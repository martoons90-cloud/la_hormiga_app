import * as XLSX from 'xlsx';
import { 
  Vehicle, 
  Employee, 
  FuelDispensary, 
  IssuedFuelVoucher, 
  VehicleStatus, 
  VehicleClassification,
  EmployeeStatus,
  FuelVoucherStatus,
  IssuedVoucherStatus
} from '../types';
import { INITIAL_OBRAS } from '../data/initialObras';

export type EntityType = 'empleados' | 'flota' | 'expendio' | 'vales' | 'partesDiarios' | 'obras';

export interface EntityMetadata {
  title: string;
  singularTitle: string;
  storageKey: string;
  baseHeaders: string[];
  sampleRow: Record<string, any>;
  fieldDescriptions: Record<string, string>;
}

export const ENTITY_CONFIGS: Record<EntityType, EntityMetadata> = {
  flota: {
    title: 'Flota Vehicular & Maquinarias',
    singularTitle: 'Equipo de Flota',
    storageKey: 'la_hormiga_fleet_v1',
    baseHeaders: [
      'ID',
      'CODIGO_EQUIPO',
      'MODELO_MARCA',
      'PATENTE',
      'CODIGO_INTERNO',
      'FOTOGRAFIA',
      'PRECIO_COSTO_DIA',
      'PRECIO_SUGERIDO_DIA',
      'PRECIO_COSTO_HORA',
      'PRECIO_SUGERIDO_HORA',
      'MODALIDAD',
      'CLASIFICACION',
      'ESTADO',
      'HOROMETRO',
      'UBICACION',
      'FECHA_ALTA'
    ],
    sampleRow: {
      ID: 'EQ-01',
      CODIGO_EQUIPO: 'RET-01',
      MODELO_MARCA: 'Retroexcavadora Caterpillar 416F2',
      PATENTE: 'AC-345-XY',
      CODIGO_INTERNO: 'INT-416',
      FOTOGRAFIA: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
      PRECIO_COSTO_DIA: 280000,
      PRECIO_SUGERIDO_DIA: 365000,
      PRECIO_COSTO_HORA: 35000,
      PRECIO_SUGERIDO_HORA: 45000,
      MODALIDAD: 'AMBOS',
      CLASIFICACION: 'PESADA',
      ESTADO: 'DISPONIBLE',
      HOROMETRO: 3450,
      UBICACION: 'Base Central - Parque Industrial',
      FECHA_ALTA: '2026-01-15'
    },
    fieldDescriptions: {
      CODIGO_EQUIPO: 'Código único de equipo (ej. RET-01, CAM-03)',
      MODELO_MARCA: 'Marca, modelo o descripción de la máquina',
      PATENTE: 'Dominio/patente (o S/P si es oruga/sin patente)',
      PRECIO_COSTO_DIA: 'Costo diario en pesos',
      PRECIO_SUGERIDO_DIA: 'Precio de alquiler diario sugerido',
      MODALIDAD: 'DIA, HORA o AMBOS',
      CLASIFICACION: 'PESADA, VIAL, TRANSPORTE, ELEVACION o LIVIANA',
      ESTADO: 'DISPONIBLE, ALQUILADO, TALLER, MANTENIMIENTO, DESMOVILIZADO o RESERVADO'
    }
  },

  empleados: {
    title: 'Nómina de Empleados & Choferes',
    singularTitle: 'Empleado',
    storageKey: 'la_hormiga_empleados_v2',
    baseHeaders: [
      'ID',
      'CODIGO_EMPLEADO',
      'NOMBRE_APELLIDO',
      'LEGAJO',
      'CATEGORIA',
      'FOTO',
      'SECTOR',
      'OBRA',
      'ESTADO',
      'DNI',
      'TELEFONO',
      'EQUIPO_ASIGNADO',
      'COSTO_DIA',
      'FECHA_ALTA'
    ],
    sampleRow: {
      ID: 'EMP-01',
      CODIGO_EMPLEADO: 'CH-001',
      NOMBRE_APELLIDO: 'González, Roberto Carlos',
      LEGAJO: 'LEG-1042',
      CATEGORIA: 'Oficial Maquinista Especializado',
      FOTO: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      SECTOR: 'Movimiento de Suelos',
      OBRA: 'Autovía Ruta 7 - Tramo Chacabuco',
      ESTADO: 'ACTIVO',
      DNI: '32.450.912',
      TELEFONO: '+54 9 11 4455-8899',
      EQUIPO_ASIGNADO: 'RET-01',
      COSTO_DIA: 85000,
      FECHA_ALTA: '2025-03-10'
    },
    fieldDescriptions: {
      CODIGO_EMPLEADO: 'Código de chofer/operador (ej. CH-001)',
      NOMBRE_APELLIDO: 'Apellido y Nombre del empleado',
      LEGAJO: 'Número de legajo laboral',
      CATEGORIA: 'Oficio o puesto en la empresa',
      SECTOR: 'Sector operativo o departamento',
      OBRA: 'Lugar de trabajo actual o proyecto',
      ESTADO: 'ACTIVO, EN_OBRA, LICENCIA o INACTIVO',
      DNI: 'Documento nacional de identidad',
      COSTO_DIA: 'Costo jornal por día'
    }
  },

  expendio: {
    title: 'Expendio de Combustible (22 Columnas)',
    singularTitle: 'Registro de Expendio',
    storageKey: 'la_hormiga_expendio_combustible_v3',
    baseHeaders: [
      'ID',
      'CARGA',
      'TIPO',
      'ID_COMBUSTIBLE',
      'DEPOSITO',
      'CANTIDAD',
      'TIPO_COMB',
      'CODIGO_EMPLEADO',
      'NOMBRE_APELLIDO',
      'LEGAJO',
      'CODIGO_EQUIPO',
      'MARCA_MODELO',
      'PATENTE',
      'Nº DE ORDEN',
      'FECHA',
      'KILOMETRAJE',
      'HORA',
      'KILOMETROS_REC',
      'AUTONOM',
      'NUM_ESTACION',
      'FOTO_EXPENDIO',
      'FOTO_KILOMETRAJE'
    ],
    sampleRow: {
      ID: 'EXP-1001',
      CARGA: 'Tanque Lleno',
      TIPO: 'Despacho Directo',
      ID_COMBUSTIBLE: 'COMB-D500',
      DEPOSITO: 'Estación YPF Ruta 7',
      CANTIDAD: 140,
      TIPO_COMB: 'DIESEL',
      CODIGO_EMPLEADO: 'CH-001',
      NOMBRE_APELLIDO: 'González, Roberto Carlos',
      LEGAJO: 'LEG-1042',
      CODIGO_EQUIPO: 'CAM-01',
      MARCA_MODELO: 'Mercedes-Benz Actros 2045',
      PATENTE: 'AF-102-ZZ',
      'Nº DE ORDEN': '00001',
      FECHA: '2026-09-01',
      KILOMETRAJE: 124500,
      HORA: '08:30',
      KILOMETROS_REC: 450,
      AUTONOM: '32.1 L/100km',
      NUM_ESTACION: 'YPF-241',
      FOTO_EXPENDIO: '',
      FOTO_KILOMETRAJE: ''
    },
    fieldDescriptions: {
      CANTIDAD: 'Litros despachados (número)',
      TIPO_COMB: 'DIESEL, NAFTA, DIESEL_PREMIUM, etc.',
      'Nº DE ORDEN': 'Número del Vale de Combustible vinculado',
      FECHA: 'Fecha en formato YYYY-MM-DD o DD/MM/YYYY',
      KILOMETRAJE: 'Odómetro u horómetro al momento de la carga',
      CODIGO_EQUIPO: 'Código del equipo abastecido',
      CODIGO_EMPLEADO: 'Código del chofer receptor'
    }
  },

  vales: {
    title: 'Vales de Combustible (Emisión & Rendición)',
    singularTitle: 'Vale de Combustible',
    storageKey: 'la_hormiga_vales_combustible_v3',
    baseHeaders: [
      'ID',
      'NUM_VALE',
      'ESTADO',
      'FECHA_EMISION',
      'HORA_EMISION',
      'CODIGO_EQUIPO',
      'MARCA_MODELO',
      'PATENTE',
      'CODIGO_EMPLEADO',
      'NOMBRE_APELLIDO',
      'LEGAJO',
      'TIPO_COMBUSTIBLE',
      'ID_COMBUSTIBLE',
      'LITROS_AUTORIZADOS',
      'TIPO_CARGA',
      'ESTACION_SURTIDOR',
      'NUM_ESTACION',
      'ODOMETRO_SALIDA',
      'NUM_TICKET_ESTACION',
      'LITROS_REALES',
      'DIFERENCIA_LTS',
      'ODOMETRO_CARGA',
      'IMPORTE_TOTAL',
      'FECHA_RENDICION',
      'ID_EXPENDIO_VINCULADO',
      'OBSERVACIONES'
    ],
    sampleRow: {
      ID: 'VAL-00001',
      NUM_VALE: '00001',
      ESTADO: 'RENDIDO',
      FECHA_EMISION: '2026-09-01',
      HORA_EMISION: '07:45',
      CODIGO_EQUIPO: 'CAM-01',
      MARCA_MODELO: 'Mercedes-Benz Actros 2045',
      PATENTE: 'AF-102-ZZ',
      CODIGO_EMPLEADO: 'CH-001',
      NOMBRE_APELLIDO: 'González, Roberto Carlos',
      LEGAJO: 'LEG-1042',
      TIPO_COMBUSTIBLE: 'DIESEL',
      ID_COMBUSTIBLE: 'COMB-D500',
      LITROS_AUTORIZADOS: 150,
      TIPO_CARGA: 'Tanque Lleno',
      ESTACION_SURTIDOR: 'Estación Shell Km 142',
      NUM_ESTACION: 'EST-SHELL-14',
      ODOMETRO_SALIDA: 124050,
      NUM_TICKET_ESTACION: 'TK-889921',
      LITROS_REALES: 140,
      DIFERENCIA_LTS: -10,
      ODOMETRO_CARGA: 124500,
      IMPORTE_TOTAL: 189000,
      FECHA_RENDICION: '2026-09-01',
      ID_EXPENDIO_VINCULADO: 'EXP-1001',
      OBSERVACIONES: 'Rendición conforme sin desvíos'
    },
    fieldDescriptions: {
      NUM_VALE: 'Número correlativo del vale (ej. 00001, 00002)',
      ESTADO: 'EMITIDO, RENDIDO o ANULADO',
      LITROS_AUTORIZADOS: 'Litros autorizados para cargar',
      LITROS_REALES: 'Litros efectivamente cargados en la estación',
      ESTACION_SURTIDOR: 'Estación de servicio autorizada',
      IMPORTE_TOTAL: 'Importe en pesos según ticket fiscal'
    }
  },

  partesDiarios: {
    title: 'Partes Diarios de Equipos',
    singularTitle: 'Parte Diario',
    storageKey: 'la_hormiga_partes_diarios_v1',
    baseHeaders: [
      'ID',
      'SERV_MANT',
      'OBRA',
      'CODIGO_OBRA',
      'CODIGO_EQUIPO',
      'MARCA_MODELO',
      'CODIGO_EMPLEADO',
      'NOMBRE_APELLIDO',
      'FECHA',
      'HORA_INICIO_MAÑANA',
      'HORA_FIN_MAÑANA',
      'HORA_INICIO_TARDE',
      'HORA_FIN_TARDE',
      'HORAS TRABAJADAS',
      'ODOM-KILOM',
      'TIPO',
      'DETALLE_TIPO',
      'VIAJES_CANTIDAD',
      'EXTRACION_ENTREGAS',
      'TIPO_MATERIAL',
      'HS_CANTIDAD',
      'NOVEDADES',
      'UBICACION',
      'ENCARGADO_OBRA',
      'FIRMA',
      'NUM_PARTE'
    ],
    sampleRow: {
      ID: 'd51e15d9',
      SERV_MANT: 'ALQUILER',
      OBRA: 'AYALA EL MOLLAR',
      CODIGO_OBRA: 'OBRA-01',
      CODIGO_EQUIPO: 'EQ-01',
      MARCA_MODELO: 'EXCAVADORA KOBELCO 2017',
      CODIGO_EMPLEADO: 'EMP-101',
      NOMBRE_APELLIDO: 'GARCIA LUIS',
      FECHA: '2026-09-01',
      HORA_INICIO_MAÑANA: '08:00',
      HORA_FIN_MAÑANA: '12:00',
      HORA_INICIO_TARDE: '13:00',
      HORA_FIN_TARDE: '17:00',
      'HORAS TRABAJADAS': 8.0,
      'ODOM-KILOM': 14520,
      TIPO: 'HORAS',
      DETALLE_TIPO: 'EXCAVACIÓN',
      VIAJES_CANTIDAD: 0,
      EXTRACION_ENTREGAS: '',
      TIPO_MATERIAL: '',
      HS_CANTIDAD: 8.0,
      NOVEDADES: 'Sin novedad',
      UBICACION: 'Sector Norte',
      ENCARGADO_OBRA: 'Juan Pérez',
      FIRMA: 'Firmado',
      NUM_PARTE: '2574'
    },
    fieldDescriptions: {
      NUM_PARTE: 'Número de parte diario',
      CODIGO_EQUIPO: 'Código interno del equipo',
      MARCA_MODELO: 'Marca y modelo del equipo',
      NOMBRE_APELLIDO: 'Nombre y apellido del operador',
      'HORAS TRABAJADAS': 'Total de horas trabajadas',
      'ODOM-KILOM': 'Odómetro o kilometraje actual'
    }
  },

  obras: {
    title: 'Registro de Obras',
    singularTitle: 'Obra',
    storageKey: 'la_hormiga_obras_v1',
    baseHeaders: [
      'ID',
      'NUMERO',
      'NOMBRE_OBRA',
      'UBICACION',
      'PERTENECE',
      'ACTIVA',
      'PLAZO',
      'MONTO_ESTIMADO',
      'FECHA_ALTA',
      'OBSERVACIONES'
    ],
    sampleRow: {
      ID: 'obra-1',
      NUMERO: 'OBRA-2024-001',
      NOMBRE_OBRA: 'Ampliación Parque Industrial Norte',
      UBICACION: 'Ruta 9 Km 45, Sector Industrial',
      PERTENECE: 'Constructora San Cayetano S.A.',
      ACTIVA: 'SÍ',
      PLAZO: '12 meses',
      MONTO_ESTIMADO: 45000000,
      FECHA_ALTA: '2024-01-15',
      OBSERVACIONES: 'Movimiento de suelos'
    },
    fieldDescriptions: {
      NUMERO: 'Número o código de obra',
      NOMBRE_OBRA: 'Nombre de la obra',
      UBICACION: 'Ubicación geográfica',
      PERTENECE: 'A quién le pertenece (empresa o persona)',
      ACTIVA: 'SÍ o NO',
      MONTO_ESTIMADO: 'Monto presupuestado en ARS'
    }
  }
};

/**
 * Normaliza nombres de encabezados para comparar de forma robusta
 */
export function normalizeHeaderKey(header: string): string {
  return header
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[\s\-_./\\()#º°]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Exporta la Tabla Base / Plantilla vacía con encabezados oficiales y una fila de ejemplo
 */
export function exportBaseTableTemplate(entity: EntityType, format: 'csv' | 'xlsx' = 'xlsx'): void {
  const config = ENTITY_CONFIGS[entity];
  const filename = `plantilla_base_${entity}_la_hormiga.${format}`;

  if (format === 'xlsx') {
    const wsData = [
      config.baseHeaders,
      config.baseHeaders.map(h => config.sampleRow[h] ?? '')
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Styling: Column widths
    const colWidths = config.baseHeaders.map(h => ({
      wch: Math.max(h.length + 4, 15)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.singularTitle);
    XLSX.writeFile(wb, filename);
  } else {
    // CSV with UTF-8 BOM and semicolon separator
    const headerLine = config.baseHeaders.join(';');
    const sampleLine = config.baseHeaders
      .map(h => {
        const val = config.sampleRow[h] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(';');

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerLine, sampleLine].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Exporta la tabla con todos los datos existentes en formato Excel (.xlsx) o CSV (.csv)
 */
export function exportEntityData(
  entity: EntityType,
  data: any[],
  format: 'xlsx' | 'csv' = 'xlsx'
): void {
  const config = ENTITY_CONFIGS[entity];
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `la_hormiga_${entity}_${dateStr}.${format}`;

  if (format === 'xlsx') {
    // Convert array of objects to worksheet using base headers
    const rows = data.map(item => {
      const rowObj: Record<string, any> = {};
      config.baseHeaders.forEach(h => {
        rowObj[h] = extractValueForHeader(entity, item, h);
      });
      return rowObj;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: config.baseHeaders });

    // Set auto column widths
    const colWidths = config.baseHeaders.map(h => ({
      wch: Math.max(h.length + 4, 14)
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.singularTitle);
    XLSX.writeFile(wb, filename);
  } else {
    // CSV export
    const rows = data.map(item => {
      return config.baseHeaders.map(h => {
        const val = extractValueForHeader(entity, item, h);
        if (typeof val === 'number') return val;
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      config.baseHeaders.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function extractValueForHeader(entity: EntityType, item: any, header: string): any {
  const norm = normalizeHeaderKey(header);

  if (entity === 'flota') {
    switch (norm) {
      case 'ID': return item.id || '';
      case 'CODIGO_EQUIPO': return item.codigoEquipo || '';
      case 'MODELO_MARCA': return item.modeloMarca || '';
      case 'PATENTE': return item.patente || '';
      case 'CODIGO_INTERNO': return item.codigoInterno || '';
      case 'FOTOGRAFIA': return item.fotografia || '';
      case 'PRECIO_COSTO_DIA': return item.precioCosto ?? 0;
      case 'PRECIO_SUGERIDO_DIA': return item.precioSugerido ?? 0;
      case 'PRECIO_COSTO_HORA': return item.precioCostoHora ?? 0;
      case 'PRECIO_SUGERIDO_HORA': return item.precioSugeridoHora ?? 0;
      case 'MODALIDAD': return item.modalidadTarifa || 'AMBOS';
      case 'CLASIFICACION': return item.clasificacion || '';
      case 'ESTADO': return item.estado || '';
      case 'HOROMETRO': return item.horometro ?? '';
      case 'UBICACION': return item.ubicacionActual || '';
      case 'FECHA_ALTA': return item.fechaAlta || '';
    }
  }

  if (entity === 'empleados') {
    switch (norm) {
      case 'ID': return item.id || '';
      case 'CODIGO_EMPLEADO': return item.codigoEmpleado || '';
      case 'NOMBRE_APELLIDO': return item.nombreApellido || '';
      case 'LEGAJO': return item.legajo || '';
      case 'CATEGORIA': return item.categoria || '';
      case 'FOTO': return item.foto || '';
      case 'SECTOR': return item.sector || '';
      case 'OBRA': return item.obra || '';
      case 'ESTADO': return item.estado || '';
      case 'DNI': return item.dni || '';
      case 'TELEFONO': return item.telefono || '';
      case 'EQUIPO_ASIGNADO': return item.vehiculoAsignadoId || '';
      case 'COSTO_DIA': return item.costoPorDia ?? 0;
      case 'FECHA_ALTA': return item.fechaAlta || '';
    }
  }

  if (entity === 'expendio') {
    switch (norm) {
      case 'ID': return item.id || '';
      case 'CARGA': return item.carga || item.tipoCarga || '';
      case 'TIPO': return item.tipo || 'Despacho Directo';
      case 'ID_COMBUSTIBLE': return item.idCombustible || 'COMB-D500';
      case 'DEPOSITO': return item.deposito || item.numEstacion || '';
      case 'CANTIDAD': return item.cantidad ?? 0;
      case 'TIPO_COMB': return item.tipoComb || item.combustible || '';
      case 'CODIGO_EMPLEADO': return item.codigoEmpleado || '';
      case 'NOMBRE_APELLIDO': return item.nombreApellido || '';
      case 'LEGAJO': return item.legajo || '';
      case 'CODIGO_EQUIPO': return item.codigoEquipo || '';
      case 'MARCA_MODELO': return item.marcaModelo || '';
      case 'PATENTE': return item.patente || '';
      case 'N_DE_ORDEN':
      case 'NUM_ORDEN':
      case 'NUM_VALE': return item.numOrden || item.numVale || item.numComprobante || '';
      case 'FECHA': return item.fecha || item.fechaEmision || '';
      case 'KILOMETRAJE': return item.kilometraje ?? item.horometroOdometro ?? 0;
      case 'HORA': return item.hora || item.horaEmision || '';
      case 'KILOMETROS_REC': return item.kilometrosRec ?? 0;
      case 'AUTONOM': return item.autonom || '';
      case 'NUM_ESTACION': return item.numEstacion || '';
      case 'FOTO_EXPENDIO': return item.fotoExpendio || '';
      case 'FOTO_KILOMETRAJE': return item.fotoKilometraje || '';
    }
  }

  if (entity === 'vales') {
    switch (norm) {
      case 'ID': return item.id || '';
      case 'NUM_VALE': return item.numVale || item.numComprobante || '';
      case 'ESTADO': return item.estado || 'EMITIDO';
      case 'FECHA_EMISION': return item.fechaEmision || '';
      case 'HORA_EMISION': return item.horaEmision || '';
      case 'CODIGO_EQUIPO': return item.codigoEquipo || '';
      case 'MARCA_MODELO': return item.marcaModelo || '';
      case 'PATENTE': return item.patente || '';
      case 'CODIGO_EMPLEADO': return item.codigoEmpleado || '';
      case 'NOMBRE_APELLIDO': return item.nombreApellido || '';
      case 'LEGAJO': return item.legajo || '';
      case 'TIPO_COMBUSTIBLE': return item.tipoComb || '';
      case 'ID_COMBUSTIBLE': return item.idCombustible || '';
      case 'LITROS_AUTORIZADOS': return item.litrosAutorizados ?? 0;
      case 'TIPO_CARGA': return item.tipoCarga || '';
      case 'ESTACION_SURTIDOR': return item.estacionSurtidor || '';
      case 'NUM_ESTACION': return item.numEstacion || '';
      case 'ODOMETRO_SALIDA': return item.odometroSalida ?? '';
      case 'NUM_TICKET_ESTACION': return item.numTicket || '';
      case 'LITROS_REALES': return item.litrosReales ?? '';
      case 'DIFERENCIA_LTS': return item.diferenciaLitros ?? '';
      case 'ODOMETRO_CARGA': return item.odometroCarga ?? '';
      case 'IMPORTE_TOTAL': return item.importeTotal ?? '';
      case 'FECHA_RENDICION': return item.fechaRendicion || '';
      case 'ID_EXPENDIO_VINCULADO': return item.expendioId || '';
      case 'OBSERVACIONES': return item.observaciones || '';
    }
  }

  return item[header] ?? '';
}

/**
 * Lee y parsea cualquier archivo (.csv, .xlsx, .xls, .txt) devolviendo array de objetos crudos
 */
export async function parseFileToObjects(file: File): Promise<any[]> {
  const fileExt = file.name.split('.').pop()?.toLowerCase();

  if (fileExt === 'xlsx' || fileExt === 'xls') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return rawRows;
  }

  // Text / CSV Parsing
  const text = await file.text();
  return parseCsvString(text);
}

/**
 * Parser robusto de CSV con soporte para delimitadores (; , \t |), comillas escapadas y saltos de línea
 */
export function parseCsvString(csvText: string): any[] {
  // Remove UTF-8 BOM if present
  let cleanText = csvText.replace(/^\uFEFF/, '').trim();
  if (!cleanText) return [];

  const lines = cleanText.split(/\r\n|\n|\r/);
  if (lines.length === 0) return [];

  // Detect delimiter from the first line
  const firstLine = lines[0];
  const delimiters = [';', ',', '\t', '|'];
  let chosenDelim = ';';
  let maxCount = -1;

  delimiters.forEach(d => {
    const count = (firstLine.match(new RegExp(`\\${d}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      chosenDelim = d;
    }
  });

  const rawHeaders = splitCsvLine(firstLine, chosenDelim).map(h => h.trim());
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = splitCsvLine(line, chosenDelim);
    const rowObj: Record<string, any> = {};

    rawHeaders.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });

    rows.push(rowObj);
  }

  return rows;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Transforma y valida los datos crudos importados al tipo de dato destino
 */
export function transformImportedRows(
  entity: EntityType,
  rawRows: any[],
  existingData: any[] = [],
  mode: 'merge' | 'replace' = 'merge'
): { validItems: any[]; count: number; errors: string[] } {
  const errors: string[] = [];
  const transformed: any[] = [];

  const genId = (prefix: string, idx: number) => {
    const timeNum = Date.now().toString().slice(-4);
    return `${prefix}-${timeNum}${idx + 1}`;
  };

  rawRows.forEach((raw, idx) => {
    try {
      // Map all keys in raw row by normalized key
      const mapped: Record<string, any> = {};
      Object.keys(raw).forEach(origKey => {
        const norm = normalizeHeaderKey(origKey);
        mapped[norm] = raw[origKey];
      });

      if (entity === 'flota') {
        const item = transformVehicleRow(mapped, idx, genId);
        if (item) transformed.push(item);
      } else if (entity === 'empleados') {
        const item = transformEmployeeRow(mapped, idx, genId);
        if (item) transformed.push(item);
      } else if (entity === 'expendio') {
        const item = transformExpendioRow(mapped, idx, genId);
        if (item) transformed.push(item);
      } else if (entity === 'vales') {
        const item = transformIssuedVoucherRow(mapped, idx, genId);
        if (item) transformed.push(item);
      } else if (entity === 'partesDiarios') {
        const item = transformParteDiarioRow(mapped, idx, genId);
        if (item) transformed.push(item);
      } else if (entity === 'obras') {
        const item = transformObraRow(mapped, idx, genId);
        if (item) transformed.push(item);
      }
    } catch (e: any) {
      errors.push(`Fila #${idx + 1}: ${e.message || 'Error al procesar fila'}`);
    }
  });

  let finalItems: any[] = [];

  if (mode === 'replace') {
    finalItems = transformed;
  } else {
    // Merge: update existing by unique identifiers or append new
    const map = new Map<string, any>();

    // Key identifier resolver
    const getKey = (item: any) => {
      if (entity === 'flota') return (item.codigoEquipo || item.id || item.patente).toUpperCase().trim();
      if (entity === 'empleados') return (item.codigoEmpleado || item.legajo || item.dni || item.id).toUpperCase().trim();
      if (entity === 'expendio') return (item.numOrden || item.id).toUpperCase().trim();
      if (entity === 'vales') return (item.numVale || item.numComprobante || item.id).toUpperCase().trim();
      if (entity === 'partesDiarios') return (item.numParte || item.id).toUpperCase().trim();
      if (entity === 'obras') return (item.numero || item.id).toUpperCase().trim();
      return item.id;
    };

    // Load existing items into map
    existingData.forEach(item => {
      const k = getKey(item);
      if (k) map.set(k, item);
    });

    // Merge or insert imported items
    transformed.forEach(item => {
      const k = getKey(item);
      if (k) {
        const existing = map.get(k);
        map.set(k, existing ? { ...existing, ...item } : item);
      } else {
        map.set(item.id, item);
      }
    });

    finalItems = Array.from(map.values());
  }

  return {
    validItems: finalItems,
    count: transformed.length,
    errors
  };
}

function parseNum(val: any, defaultVal: number = 0): number {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;

  let str = String(val).trim();
  str = str.replace(/[\$€ARS\s]/gi, '');

  if (!str) return defaultVal;

  // Handle time format HH:MM or HH:MM:SS (e.g. 02:30:00 -> 2.5)
  if (/^\d+:\d+(:\d+)?$/.test(str)) {
    const parts = str.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return Number((h + m / 60 + s / 3600).toFixed(2));
  }

  const commaCount = (str.match(/,/g) || []).length;
  const dotCount = (str.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Comma is decimal, dot is thousands (e.g. 1.250,50)
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal, comma is thousands (e.g. 1,250.50)
      str = str.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    if (commaCount > 1) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (dotCount > 0) {
    if (dotCount > 1) {
      const lastDot = str.lastIndexOf('.');
      str = str.replace(/\./g, (match, idx) => idx === lastDot ? '.' : '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? defaultVal : num;
}

function transformVehicleRow(mapped: Record<string, any>, idx: number, genId: any): Vehicle | null {
  const vehicleId = mapped['ID'] || mapped['CODIGO_EQUIPO'] || mapped['CODIGO'] || mapped['EQUIPO'] || genId('VEH', idx);
  const modeloMarca = mapped['MODELO_MARCA'] || mapped['MODELO'] || mapped['MARCA'] || mapped['DESCRIPCION'] || 'Equipo Flota';
  const patente = mapped['PATENTE'] || mapped['DOMINIO'] || 'S/P';

  const estadoRaw = (mapped['ESTADO'] || 'DISPONIBLE').toUpperCase().trim();
  let estado: VehicleStatus = 'DISPONIBLE';
  if (estadoRaw === 'ALQUILADO') estado = 'ALQUILADO';
  else if (estadoRaw === 'TALLER') estado = 'TALLER';
  else if (estadoRaw === 'EN_MANTENIMIENTO' || estadoRaw === 'MANTENIMIENTO') estado = 'EN_MANTENIMIENTO';
  else if (estadoRaw === 'RESERVADO') estado = 'RESERVADO';
  else if (estadoRaw === 'FUERA_DE_SERVICIO' || estadoRaw === 'DESMOVILIZADO') estado = 'FUERA_DE_SERVICIO';

  const clasifRaw = (mapped['CLASIFICACION'] || mapped['CATEGORIA'] || 'Retroexcavadora').trim();
  const validClasif: VehicleClassification[] = [
    'Minicargadora',
    'Camión Volcador',
    'Camión Chasis / Grúa',
    'Retroexcavadora',
    'Excavadora de Orugas',
    'Pala Cargadora Frontal',
    'Rodillo Compactador',
    'Autoelevador / Clark',
    'Manipulador Telescópico',
    'Grupo Electrógeno / Compresor',
    'Plataforma Elevadora',
    'Otro'
  ];
  
  const matchedClasif = validClasif.find(c => c.toLowerCase() === clasifRaw.toLowerCase());
  const clasificacion: VehicleClassification = matchedClasif || (validClasif.includes(clasifRaw as any) ? (clasifRaw as VehicleClassification) : 'Retroexcavadora');

  return {
    id: String(vehicleId).trim(),
    modeloMarca: String(modeloMarca).trim(),
    patente: String(patente).trim(),
    codigoInterno: mapped['CODIGO_INTERNO'] || mapped['INTERNO'] || '',
    fotografia: mapped['FOTOGRAFIA'] || mapped['FOTO'] || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    precioCosto: parseNum(mapped['PRECIO_COSTO_DIA'] || mapped['PRECIO_COSTO'] || mapped['COSTO_DIA'], 200000),
    precioSugerido: parseNum(mapped['PRECIO_SUGERIDO_DIA'] || mapped['PRECIO_SUGERIDO'] || mapped['SUGERIDO_DIA'], 280000),
    precioCostoHora: parseNum(mapped['PRECIO_COSTO_HORA'] || mapped['COSTO_HORA'], 25000),
    precioSugeridoHora: parseNum(mapped['PRECIO_SUGERIDO_HORA'] || mapped['SUGERIDO_HORA'], 35000),
    modalidadTarifa: (mapped['MODALIDAD'] || mapped['MODALIDAD_TARIFA'] || 'AMBOS') as any,
    clasificacion,
    estado,
    horometro: parseNum(mapped['HOROMETRO'] || mapped['KILOMETRAJE'] || mapped['KM'], 0),
    ubicacionActual: mapped['UBICACION'] || mapped['UBICACION_ACTUAL'] || 'Base Central',
    fechaAlta: mapped['FECHA_ALTA'] || mapped['FECHA'] || new Date().toISOString().slice(0, 10)
  };
}

function transformEmployeeRow(mapped: Record<string, any>, idx: number, genId: any): Employee | null {
  const nombreApellido = mapped['NOMBRE_APELLIDO'] || mapped['NOMBRE'] || mapped['EMPLEADO'] || `Empleado ${idx + 1}`;
  const codigoEmpleado = mapped['CODIGO_EMPLEADO'] || mapped['CODIGO'] || `CH-00${idx + 1}`;
  const legajo = mapped['LEGAJO'] || `LEG-${1000 + idx}`;

  const estadoRaw = (mapped['ESTADO'] || 'ACTIVO').toUpperCase().trim();
  const validStatus: EmployeeStatus[] = ['ACTIVO', 'EN_OBRA', 'LICENCIA', 'INACTIVO'];
  const estado: EmployeeStatus = validStatus.includes(estadoRaw as EmployeeStatus) ? (estadoRaw as EmployeeStatus) : 'ACTIVO';

  return {
    id: mapped['ID'] || genId('EMP', idx),
    codigoEmpleado: String(codigoEmpleado).trim(),
    nombreApellido: String(nombreApellido).trim(),
    legajo: String(legajo).trim(),
    categoria: mapped['CATEGORIA'] || mapped['PUESTO'] || mapped['CARGO'] || 'Operador de Maquinaria',
    foto: mapped['FOTO'] || mapped['FOTOGRAFIA'] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    sector: mapped['SECTOR'] || mapped['DEPARTAMENTO'] || 'Operaciones',
    obra: mapped['OBRA'] || mapped['PROYECTO'] || 'Base Central',
    estado,
    dni: mapped['DNI'] || mapped['DOCUMENTO'] || '',
    telefono: mapped['TELEFONO'] || mapped['CELULAR'] || '',
    vehiculoAsignadoId: mapped['EQUIPO_ASIGNADO'] || mapped['VEHICULO_ASIGNADO'] || mapped['VEHICULOASIGNADOID'] || undefined,
    costoPorDia: parseNum(mapped['COSTO_DIA'] || mapped['JORNAL'] || mapped['COSTO_POR_DIA'], 75000),
    fechaAlta: mapped['FECHA_ALTA'] || mapped['FECHA'] || new Date().toISOString().slice(0, 10)
  };
}

function transformExpendioRow(mapped: Record<string, any>, idx: number, genId: any): FuelDispensary | null {
  const numOrden = mapped['N_DE_ORDEN'] || mapped['NUM_ORDEN'] || mapped['NUM_VALE'] || mapped['COMPROBANTE'] || mapped['VALE'] || String(1000 + idx);
  const cantidad = parseNum(mapped['CANTIDAD'] || mapped['LITROS'] || mapped['VOLUMEN'], 50);

  return {
    id: mapped['ID'] || genId('EXP', idx),
    carga: mapped['CARGA'] || mapped['TIPO_CARGA'] || 'Tanque Lleno',
    tipo: mapped['TIPO'] || 'Despacho Directo',
    idCombustible: mapped['ID_COMBUSTIBLE'] || 'COMB-D500',
    deposito: mapped['DEPOSITO'] || mapped['ESTACION'] || 'Estación YPF / Shell',
    cantidad,
    tipoComb: mapped['TIPO_COMB'] || mapped['COMBUSTIBLE'] || 'DIESEL',
    codigoEmpleado: mapped['CODIGO_EMPLEADO'] || mapped['CHOFER_CODIGO'] || 'CH-001',
    nombreApellido: mapped['NOMBRE_APELLIDO'] || mapped['CHOFER'] || 'Chofer Operativo',
    legajo: mapped['LEGAJO'] || 'LEG-000',
    codigoEquipo: mapped['CODIGO_EQUIPO'] || mapped['EQUIPO'] || 'EQUIPO-01',
    marcaModelo: mapped['MARCA_MODELO'] || mapped['MODELO'] || 'Equipo Flota',
    patente: mapped['PATENTE'] || 'S/P',
    numOrden: String(numOrden).trim(),
    fecha: mapped['FECHA'] || new Date().toISOString().slice(0, 10),
    kilometraje: parseNum(mapped['KILOMETRAJE'] || mapped['ODOMETRO'] || mapped['KMS_HS'], 0),
    hora: mapped['HORA'] || '08:00',
    kilometrosRec: parseNum(mapped['KILOMETROS_REC'] || mapped['KMS_REC'], 0),
    autonom: mapped['AUTONOM'] || mapped['AUTONOMIA'] || '',
    numEstacion: mapped['NUM_ESTACION'] || mapped['ESTACION_NUM'] || '',
    fotoExpendio: mapped['FOTO_EXPENDIO'] || mapped['FOTO_TICKET'] || '',
    fotoKilometraje: mapped['FOTO_KILOMETRAJE'] || mapped['FOTO_ODOMETRO'] || '',
    precioUnitario: parseNum(mapped['PRECIO_UNITARIO'], 1350),
    totalImporte: parseNum(mapped['TOTAL_IMPORTE'] || mapped['IMPORTE'], cantidad * 1350),
    estado: 'RENDIDO' as FuelVoucherStatus,
    observaciones: mapped['OBSERVACIONES'] || ''
  };
}

function transformIssuedVoucherRow(mapped: Record<string, any>, idx: number, genId: any): IssuedFuelVoucher | null {
  const numVale = mapped['NUM_VALE'] || mapped['NUM_COMPROBANTE'] || mapped['VALE'] || mapped['COMPROBANTE'] || String(10000 + idx);
  const litrosAutorizados = parseNum(mapped['LITROS_AUTORIZADOS'] || mapped['CANTIDAD_AUTORIZADA'] || mapped['LITROS'], 100);
  const litrosReales = mapped['LITROS_REALES'] !== undefined && mapped['LITROS_REALES'] !== '' ? parseNum(mapped['LITROS_REALES']) : undefined;

  const estadoRaw = (mapped['ESTADO'] || (litrosReales ? 'RENDIDO' : 'EMITIDO')).toUpperCase().trim();
  const validStatus: IssuedVoucherStatus[] = ['EMITIDO', 'RENDIDO', 'ANULADO'];
  const estado: IssuedVoucherStatus = validStatus.includes(estadoRaw as IssuedVoucherStatus) ? (estadoRaw as IssuedVoucherStatus) : 'EMITIDO';

  return {
    id: mapped['ID'] || `VAL-${numVale}`,
    numVale: String(numVale).trim(),
    numComprobante: mapped['NUM_COMPROBANTE'] || String(numVale).trim(),
    estado,
    fechaEmision: mapped['FECHA_EMISION'] || mapped['FECHA'] || new Date().toISOString().slice(0, 10),
    horaEmision: mapped['HORA_EMISION'] || mapped['HORA'] || '08:00',
    codigoEquipo: mapped['CODIGO_EQUIPO'] || mapped['EQUIPO'] || 'EQUIPO-01',
    marcaModelo: mapped['MARCA_MODELO'] || mapped['MODELO'] || 'Equipo Flota',
    patente: mapped['PATENTE'] || 'S/P',
    codigoEmpleado: mapped['CODIGO_EMPLEADO'] || mapped['CHOFER_CODIGO'] || 'CH-001',
    nombreApellido: mapped['NOMBRE_APELLIDO'] || mapped['CHOFER'] || 'Chofer Asignado',
    legajo: mapped['LEGAJO'] || 'LEG-000',
    tipoComb: mapped['TIPO_COMBUSTIBLE'] || mapped['TIPO_COMB'] || 'DIESEL',
    idCombustible: mapped['ID_COMBUSTIBLE'] || 'COMB-D500',
    litrosAutorizados,
    tipoCarga: mapped['TIPO_CARGA'] || 'Tanque Lleno',
    estacionSurtidor: mapped['ESTACION_SURTIDOR'] || mapped['ESTACION'] || 'Estación YPF / Shell',
    numEstacion: mapped['NUM_ESTACION'] || '',
    odometroSalida: mapped['ODOMETRO_SALIDA'] !== undefined && mapped['ODOMETRO_SALIDA'] !== '' ? parseNum(mapped['ODOMETRO_SALIDA']) : undefined,
    numTicket: mapped['NUM_TICKET_ESTACION'] || mapped['NUM_TICKET'] || '',
    litrosReales,
    diferenciaLitros: litrosReales !== undefined ? litrosReales - litrosAutorizados : undefined,
    odometroCarga: mapped['ODOMETRO_CARGA'] !== undefined && mapped['ODOMETRO_CARGA'] !== '' ? parseNum(mapped['ODOMETRO_CARGA']) : undefined,
    importeTotal: mapped['IMPORTE_TOTAL'] !== undefined && mapped['IMPORTE_TOTAL'] !== '' ? parseNum(mapped['IMPORTE_TOTAL']) : undefined,
    fechaRendicion: mapped['FECHA_RENDICION'] || (estado === 'RENDIDO' ? mapped['FECHA_EMISION'] : undefined),
    expendioId: mapped['ID_EXPENDIO_VINCULADO'] || mapped['EXPENDIO_ID'] || undefined,
    fotoTicket: mapped['FOTO_TICKET'] || '',
    fotoOdometro: mapped['FOTO_ODOMETRO'] || '',
    observaciones: mapped['OBSERVACIONES'] || ''
  };
}

function resolveObraForParte(mappedObra: string, mappedCodigoObra: string): { obraName: string; codigoObra: string } | null {
  let obrasList: any[] = [];
  try {
    const data = localStorage.getItem('la_hormiga_obras_v1');
    if (data) {
      obrasList = JSON.parse(data);
    }
  } catch (e) {}
  if (!Array.isArray(obrasList) || obrasList.length === 0) {
    obrasList = INITIAL_OBRAS;
  }

  const cleanObraName = String(mappedObra || '').trim();
  const cleanCodigo = String(mappedCodigoObra || '').trim();

  // Try finding by numero/codigoObra match if it's a valid code
  let found = obrasList.find(o => 
    (o.numero && o.numero.toLowerCase() === cleanCodigo.toLowerCase()) ||
    (o.id && o.id.toLowerCase() === cleanCodigo.toLowerCase())
  );

  // If not found by code, try finding by name match
  if (!found && cleanObraName) {
    found = obrasList.find(o => 
      o.nombreObra && o.nombreObra.toLowerCase() === cleanObraName.toLowerCase()
    );
  }

  if (found) {
    return {
      obraName: found.nombreObra,
      codigoObra: found.numero
    };
  }

  // If not found in existing obras, return null to discard/hide conflicting rows
  return null;
}

function calculateHoursFromTimes(iniMan?: string, finMan?: string, iniTar?: string, finTar?: string): number {
  let totalMinutes = 0;
  const parseTimeToMinutes = (t?: string) => {
    if (!t) return 0;
    const parts = t.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const im = parseTimeToMinutes(iniMan);
  const fm = parseTimeToMinutes(finMan);
  if (fm > im) totalMinutes += (fm - im);

  const it = parseTimeToMinutes(iniTar);
  const ft = parseTimeToMinutes(finTar);
  if (ft > it) totalMinutes += (ft - it);

  return Number((totalMinutes / 60).toFixed(2));
}

function transformParteDiarioRow(mapped: Record<string, any>, idx: number, genId: any): any {
  const numParte = mapped['NUM_PARTE'] || mapped['NUMERO_PARTE'] || String(2500 + idx);
  const tipoRaw = (mapped['TIPO'] || 'HORAS').toUpperCase().trim();
  const tipo = tipoRaw === 'VIAJES' ? 'VIAJES' : 'HORAS';
  const calcHours = calculateHoursFromTimes(
    mapped['HORA_INICIO_MAÑANA'] || mapped['HORA_INI_MAÑANA'],
    mapped['HORA_FIN_MAÑANA'],
    mapped['HORA_INICIO_TARDE'] || mapped['HORA_INI_TARDE'],
    mapped['HORA_FIN_TARDE']
  );

  const rawHoras = (mapped['HORAS TRABAJADAS'] !== undefined && mapped['HORAS TRABAJADAS'] !== null && String(mapped['HORAS TRABAJADAS']).trim() !== '')
    ? mapped['HORAS TRABAJADAS']
    : (mapped['HS_CANTIDAD'] !== undefined && mapped['HS_CANTIDAD'] !== null && String(mapped['HS_CANTIDAD']).trim() !== ''
        ? mapped['HS_CANTIDAD']
        : mapped['HORAS']);
  const parsedHoras = parseNum(rawHoras, 0.0);

  let horasTr = calcHours > 0 ? calcHours : 8.0;

  const viajesCnt = parseNum(mapped['VIAJES_CANTIDAD'] || mapped['CANTIDAD'], 0);

  const resolvedObra = resolveObraForParte(mapped['OBRA'] || mapped['NOMBRE_OBRA'], mapped['CODIGO_OBRA']);
  if (!resolvedObra) {
    return null; // Discard conflicting rows so they don't appear
  }

  return {
    id: mapped['ID'] || genId('PD', idx),
    servMant: mapped['SERV_MANT'] || mapped['SERVICIO'] || 'ALQUILER',
    obra: resolvedObra.obraName,
    codigoObra: resolvedObra.codigoObra,
    codigoEquipo: mapped['CODIGO_EQUIPO'] || mapped['EQUIPO'] || 'EQ-01',
    marcaModelo: mapped['MARCA_MODELO'] || mapped['EQUIPO'] || 'EXCAVADORA KOBELCO 2017',
    codigoEmpleado: mapped['CODIGO_EMPLEADO'] || mapped['OPERADOR'] || 'EMP-101',
    nombreApellido: mapped['NOMBRE_APELLIDO'] || mapped['CODIGO_EMPLEADO'] || 'GARCIA LUIS',
    fecha: mapped['FECHA'] || new Date().toISOString().slice(0, 10),
    horaInicioMañana: mapped['HORA_INICIO_MAÑANA'] || '08:00',
    horaFinMañana: mapped['HORA_FIN_MAÑANA'] || '12:00',
    horaInicioTarde: mapped['HORA_INICIO_TARDE'] || '13:00',
    horaFinTarde: mapped['HORA_FIN_TARDE'] || '17:00',
    horasTrabajadas: horasTr,
    odomKilom: parseNum(mapped['ODOM-KILOM'] || mapped['ODOMETRO'], 12000),
    tipo,
    detalleTipo: mapped['DETALLE_TIPO'] || mapped['DETALLE_DE_ENTREGA'] || mapped['TAREAS'] || 'Trabajos en obra',
    viajesCantidad: tipo === 'VIAJES' ? viajesCnt : 0,
    extraccionEntregas: mapped['EXTRACION_ENTREGAS'] || mapped['EXTRACION'] || '',
    tipoMaterial: mapped['TIPO_MATERIAL'] || mapped['MATERIAL'] || '',
    hsCantidad: tipo === 'HORAS' ? horasTr : 0,
    novedades: mapped['NOVEDADES'] || mapped['OBSERVACIONES'] || '',
    ubicacion: mapped['UBICACION'] || '',
    encargadoObra: mapped['ENCARGADO_OBRA'] || '',
    firma: mapped['FIRMA'] || 'Firmado',
    numParte: String(numParte).trim(),
    autorizado: 'NO CONTROLADO',

    // Backward compatibility
    cantidad: viajesCnt,
    detalleEntrega: mapped['DETALLE_TIPO'] || mapped['DETALLE_DE_ENTREGA'] || ''
  };
}

function transformObraRow(mapped: Record<string, any>, idx: number, genId: any): any {
  const keys = Object.keys(mapped);

  // Find numero (code) dynamically
  let rawNumero = undefined;
  const exactCodeKeys = ['NUMERO', 'NUM_OBRA', 'CODIGO_OBRA', 'COD_OBRA', 'CODIGO', 'COD', 'NRO', 'ID_OBRA', 'ID', 'OBRA_ID', 'NUM', 'CODIGO_DE_OBRA', 'NRO_OBRA'];
  for (const k of exactCodeKeys) {
    if (mapped[k] !== undefined && mapped[k] !== null && String(mapped[k]).trim() !== '' && String(mapped[k]).trim() !== '-1') {
      rawNumero = mapped[k];
      break;
    }
  }
  if (!rawNumero) {
    for (const key of keys) {
      if ((key.includes('COD') || key.includes('NUM') || key.includes('ID') || key.includes('NRO')) && !key.includes('EMPLEADO') && !key.includes('EQUIPO')) {
        if (mapped[key] !== undefined && mapped[key] !== null && String(mapped[key]).trim() !== '' && String(mapped[key]).trim() !== '-1') {
          rawNumero = mapped[key];
          break;
        }
      }
    }
  }
  if (!rawNumero || String(rawNumero).trim() === '' || String(rawNumero).trim() === '-1' || String(rawNumero).trim() === 'NaN') {
    rawNumero = `OBRA-${idx + 1}`;
  }
  const numero = String(rawNumero).trim();

  // Find nombreObra dynamically
  let rawNombre = undefined;
  const exactNameKeys = ['NOMBRE_OBRA', 'OBRA', 'NOMBRE', 'PROYECTO', 'TITULO', 'DESCRIPCION', 'NOMBRE_DE_OBRA', 'PROYECTO_OBRA'];
  for (const k of exactNameKeys) {
    if (mapped[k] !== undefined && mapped[k] !== null && String(mapped[k]).trim() !== '' && String(mapped[k]).trim() !== '-1') {
      rawNombre = mapped[k];
      break;
    }
  }
  if (!rawNombre) {
    for (const key of keys) {
      if ((key.includes('OBRA') || key.includes('NOMBRE') || key.includes('PROYECTO') || key.includes('TITULO')) && !key.includes('ENCARGADO') && !key.includes('COD')) {
        if (mapped[key] !== undefined && mapped[key] !== null && String(mapped[key]).trim() !== '' && String(mapped[key]).trim() !== '-1') {
          rawNombre = mapped[key];
          break;
        }
      }
    }
  }
  if (!rawNombre || String(rawNombre).trim() === '' || String(rawNombre).trim() === '-1') {
    rawNombre = `Obra ${numero}`;
  }
  const nombreObra = String(rawNombre).trim();

  // Find ubicacion dynamically
  let rawUbicacion = undefined;
  const exactUbicKeys = ['UBICACION', 'DIRECCION', 'LUGAR', 'LOCALIDAD', 'ZONA', 'DOMICILIO'];
  for (const k of exactUbicKeys) {
    if (mapped[k] !== undefined && mapped[k] !== null && String(mapped[k]).trim() !== '') {
      rawUbicacion = mapped[k];
      break;
    }
  }
  if (!rawUbicacion) {
    for (const key of keys) {
      if (key.includes('UBIC') || key.includes('DIR') || key.includes('LUGAR') || key.includes('ZONA')) {
        if (mapped[key] !== undefined && mapped[key] !== null && String(mapped[key]).trim() !== '') {
          rawUbicacion = mapped[key];
          break;
        }
      }
    }
  }

  // Find pertenece/cliente dynamically
  let rawPertenece = undefined;
  const exactPertKeys = ['PERTENECE', 'EMPRESA', 'CLIENTE', 'CONSTRUCTORA', 'COMITENTE', 'RAZON_SOCIAL'];
  for (const k of exactPertKeys) {
    if (mapped[k] !== undefined && mapped[k] !== null && String(mapped[k]).trim() !== '') {
      rawPertenece = mapped[k];
      break;
    }
  }

  const activaRaw = String(mapped['ACTIVA'] || mapped['ESTADO'] || 'SÍ').toUpperCase().trim();
  const activa = activaRaw === 'SÍ' || activaRaw === 'SI' || activaRaw === 'TRUE' || activaRaw === 'ACTIVA' || activaRaw === '1';

  return {
    id: mapped['ID'] || genId('obra', idx),
    numero,
    nombreObra,
    ubicacion: rawUbicacion ? String(rawUbicacion).trim() : 'Sin ubicación',
    pertenece: rawPertenece ? String(rawPertenece).trim() : 'Empresa Principal',
    activa,
    plazo: mapped['PLAZO'] || mapped['DURACION'] || '6 meses',
    montoEstimado: parseNum(mapped['MONTO_ESTIMADO'] || mapped['MONTO'] || mapped['PRESUPUESTO'], 10000000),
    fechaAlta: mapped['FECHA_ALTA'] || mapped['FECHA'] || new Date().toISOString().slice(0, 10),
    observaciones: mapped['OBSERVACIONES'] || mapped['NOTAS'] || ''
  };
}
