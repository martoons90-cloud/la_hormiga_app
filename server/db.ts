import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isInitialized = false;

export function getDbPool(): pg.Pool | null {
  const connectionString = process.env.DATABASE_URL || 'postgresql://lahormiga:RN-bKtmn3GKJTWG6-ykpnQ@elixir-dog-33623.j77.aws-us-east-1.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full';
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=disable')
        ? false
        : { rejectUnauthorized: false }, // CockroachDB cloud requires SSL
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle CockroachDB client', err);
    });
  }

  return pool;
}

export async function checkDbConnection(): Promise<{ connected: boolean; message: string; version?: string }> {
  const p = getDbPool();
  if (!p) {
    return { connected: false, message: 'DATABASE_URL no configurada en las variables de entorno (.env)' };
  }

  try {
    const res = await p.query('SELECT version();');
    return { 
      connected: true, 
      message: 'Conectado a CockroachDB exitosamente',
      version: res.rows[0]?.version || 'CockroachDB'
    };
  } catch (error: any) {
    console.error('Error connecting to CockroachDB:', error?.message);
    return { 
      connected: false, 
      message: `Error al conectar a CockroachDB: ${error?.message || 'Fallo de conexión'}` 
    };
  }
}

export async function initCockroachSchema(): Promise<void> {
  const p = getDbPool();
  if (!p || isInitialized) return;

  try {
    console.log('Inicializando esquema en CockroachDB...');

    // 1. Tabla de Vehículos
    await p.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(100) PRIMARY KEY,
        modelo_marca VARCHAR(255),
        patente VARCHAR(100),
        codigo_interno VARCHAR(100),
        clasificacion VARCHAR(100),
        estado VARCHAR(100),
        fotografia TEXT,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Tabla de Cargas de Combustible (Fuel Vouchers / Expendio)
    await p.query(`
      CREATE TABLE IF NOT EXISTS fuel_vouchers (
        id VARCHAR(100) PRIMARY KEY,
        numero_vale VARCHAR(100),
        fecha VARCHAR(50),
        codigo_equipo VARCHAR(100),
        patente VARCHAR(100),
        deposito_origen VARCHAR(255),
        tipo_combustible VARCHAR(100),
        cantidad NUMERIC,
        kilometraje NUMERIC,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Tabla de Partes Diarios
    await p.query(`
      CREATE TABLE IF NOT EXISTS partes_diarios (
        id VARCHAR(100) PRIMARY KEY,
        fecha VARCHAR(50),
        codigo_equipo VARCHAR(100),
        obra VARCHAR(255),
        chofer VARCHAR(255),
        horas_trabajadas NUMERIC,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 4. Tabla de Choferes / Empleados
    await p.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(100) PRIMARY KEY,
        nombre_completo VARCHAR(255),
        dni VARCHAR(50),
        legajo VARCHAR(50),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Tabla de Obras
    await p.query(`
      CREATE TABLE IF NOT EXISTS obras (
        id VARCHAR(100) PRIMARY KEY,
        nombre VARCHAR(255),
        ubicacion VARCHAR(255),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Tabla de Depósitos de Combustible
    await p.query(`
      CREATE TABLE IF NOT EXISTS fuel_deposits (
        id VARCHAR(100) PRIMARY KEY,
        nombre VARCHAR(255),
        capacidad_total NUMERIC,
        nivel_actual NUMERIC,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Tabla de Vales Emitidos
    await p.query(`
      CREATE TABLE IF NOT EXISTS issued_vouchers (
        id VARCHAR(100) PRIMARY KEY,
        numero_vale VARCHAR(100),
        fecha VARCHAR(50),
        destinatario VARCHAR(255),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Tabla de Configuración y Metadatos (Columnas, Tipos de Combustible, etc.)
    await p.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    isInitialized = true;
    console.log('Esquema de CockroachDB inicializado correctamente.');
  } catch (error) {
    console.error('Error al inicializar el esquema de CockroachDB:', error);
  }
}
