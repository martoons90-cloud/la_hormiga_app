import express from 'express';
import { getDbPool, checkDbConnection, initCockroachSchema } from './db.js';
import { getR2Client, uploadImageToR2 } from './r2.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

// 1. Status & Diagnostics Endpoint
router.get('/status', async (req, res) => {
  const dbStatus = await checkDbConnection();
  const r2 = getR2Client();

  res.json({
    cockroachDb: {
      configured: !!process.env.DATABASE_URL,
      connected: dbStatus.connected,
      message: dbStatus.message,
      version: dbStatus.version,
    },
    cloudflareR2: {
      configured: !!r2,
      bucket: r2?.bucket || null,
      publicUrl: r2?.publicUrl || null,
      message: r2 ? 'Cloudflare R2 configurado y listo' : 'Variables de Cloudflare R2 pendientes',
    },
  });
});

// Helper for generic CockroachDB table CRUD
function createEntityRoutes(tableName: string, idField: string = 'id', extraColumnsExtractor?: (item: any) => Record<string, any>) {
  // GET all
  router.get(`/${tableName}`, async (req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'CockroachDB no configurada' });
    }

    try {
      await initCockroachSchema();
      const result = await pool.query(`SELECT data FROM ${tableName} ORDER BY updated_at DESC;`);
      const items = result.rows.map(r => r.data);
      res.json(items);
    } catch (error: any) {
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // POST (Upsert / Save item or batch)
  router.post(`/${tableName}`, async (req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'CockroachDB no configurada' });
    }

    try {
      await initCockroachSchema();
      const payload = req.body;

      if (Array.isArray(payload)) {
        // Bulk upsert
        for (const item of payload) {
          const id = item[idField] || item.id;
          if (!id) continue;

          let extraCols = extraColumnsExtractor ? extraColumnsExtractor(item) : {};
          const colNames = ['id', 'data', 'updated_at', ...Object.keys(extraCols)];
          const colPlaceholders = colNames.map((_, i) => `$${i + 1}`).join(', ');
          const colValues = [id, JSON.stringify(item), new Date(), ...Object.values(extraCols)];
          const updateSets = colNames
            .filter(c => c !== 'id')
            .map(c => `${c} = EXCLUDED.${c}`)
            .join(', ');

          await pool.query(
            `INSERT INTO ${tableName} (${colNames.join(', ')})
             VALUES (${colPlaceholders})
             ON CONFLICT (id) DO UPDATE SET ${updateSets};`,
            colValues
          );
        }
        return res.json({ success: true, count: payload.length });
      } else {
        // Single upsert
        const item = payload;
        const id = item[idField] || item.id;
        if (!id) {
          return res.status(400).json({ error: 'Campo ID requerido' });
        }

        let extraCols = extraColumnsExtractor ? extraColumnsExtractor(item) : {};
        const colNames = ['id', 'data', 'updated_at', ...Object.keys(extraCols)];
        const colPlaceholders = colNames.map((_, i) => `$${i + 1}`).join(', ');
        const colValues = [id, JSON.stringify(item), new Date(), ...Object.values(extraCols)];
        const updateSets = colNames
          .filter(c => c !== 'id')
          .map(c => `${c} = EXCLUDED.${c}`)
          .join(', ');

        await pool.query(
          `INSERT INTO ${tableName} (${colNames.join(', ')})
           VALUES (${colPlaceholders})
           ON CONFLICT (id) DO UPDATE SET ${updateSets};`,
          colValues
        );

        return res.json({ success: true, item });
      }
    } catch (error: any) {
      console.error(`Error saving to ${tableName}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // DELETE
  router.delete(`/${tableName}/:id`, async (req, res) => {
    const pool = getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'CockroachDB no configurada' });
    }

    try {
      await initCockroachSchema();
      const { id } = req.params;
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1;`, [id]);
      res.json({ success: true, deletedId: id });
    } catch (error: any) {
      console.error(`Error deleting from ${tableName}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
}

// 2. Register standard entity routes
createEntityRoutes('vehicles', 'id', (v) => ({
  modelo_marca: v.modeloMarca || '',
  patente: v.patente || '',
  codigo_interno: v.codigoInterno || '',
  clasificacion: v.clasificacion || '',
  estado: v.estado || '',
  fotografia: v.fotografia || '',
}));

createEntityRoutes('fuel_vouchers', 'id', (v) => ({
  numero_vale: v.numeroVale || '',
  fecha: v.fecha || '',
  codigo_equipo: v.codigoEquipo || '',
  patente: v.patente || '',
  deposito_origen: v.depositoOrigen || '',
  tipo_combustible: v.tipoCombustible || '',
  cantidad: Number(v.cantidad || 0),
  kilometraje: Number(v.kilometraje || 0),
}));

createEntityRoutes('partes_diarios', 'id', (p) => ({
  fecha: p.fecha || '',
  codigo_equipo: p.codigoEquipo || '',
  obra: p.obra || '',
  chofer: p.chofer || '',
  horas_trabajadas: Number(p.horasTrabajadas || p.hsCantidad || 0),
}));

createEntityRoutes('drivers', 'id', (d) => ({
  nombre_completo: d.nombreCompleto || '',
  dni: d.dni || '',
  legajo: d.legajo || '',
}));

createEntityRoutes('obras', 'id', (o) => ({
  nombre: o.nombre || '',
  ubicacion: o.ubicacion || '',
}));

createEntityRoutes('fuel_deposits', 'id', (d) => ({
  nombre: d.nombre || '',
  capacidad_total: Number(d.capacidadTotal || 0),
  nivel_actual: Number(d.nivelActual || 0),
}));

createEntityRoutes('issued_vouchers', 'id', (v) => ({
  numero_vale: v.numeroVale || '',
  fecha: v.fecha || '',
  destinatario: v.destinatario || '',
}));

// 3. Settings endpoint
router.get('/settings/:key', async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: 'CockroachDB no configurada' });

  try {
    await initCockroachSchema();
    const result = await pool.query('SELECT value FROM system_settings WHERE key = $1;', [req.params.key]);
    if (result.rows.length > 0) {
      res.json(result.rows[0].value);
    } else {
      res.status(404).json({ error: 'Configuración no encontrada' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/:key', async (req, res) => {
  const pool = getDbPool();
  if (!pool) return res.status(503).json({ error: 'CockroachDB no configurada' });

  try {
    await initCockroachSchema();
    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
      [req.params.key, JSON.stringify(req.body)]
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Cloudflare R2 Image Upload Endpoint
router.post('/upload', express.json({ limit: '25mb' }), async (req, res) => {
  try {
    const { imageBase64, fileName = 'upload.jpg', contentType = 'image/jpeg' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere el campo imageBase64' });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await uploadImageToR2(buffer, fileName, contentType);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ success: true, url: result.url });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    res.status(500).json({ error: error.message || 'Error en el servidor al subir imagen' });
  }
});

// 5. Proxy endpoint for R2 objects if public domain is not configured
router.get('/files/:key', async (req, res) => {
  const r2 = getR2Client();
  if (!r2) {
    return res.status(503).json({ error: 'Cloudflare R2 no configurado' });
  }

  try {
    const key = decodeURIComponent(req.params.key);
    const command = new GetObjectCommand({
      Bucket: r2.bucket,
      Key: key,
    });

    const response = await r2.client.send(command);
    if (response.ContentType) {
      res.setHeader('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader('Content-Length', response.ContentLength);
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000');
    (response.Body as any).pipe(res);
  } catch (error: any) {
    console.error('Error fetching file from R2:', error);
    res.status(404).send('Archivo no encontrado');
  }
});

export default router;
