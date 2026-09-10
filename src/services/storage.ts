import { 
  Vehicle, 
  TableColumnKey, 
  Employee, 
  FuelVoucher, 
  FuelDispensary,
  IssuedFuelVoucher,
  FuelDeposit, 
  ParteDiario,
  Obra,
  GenericColumnDefinition, 
  TableColumnConfig 
} from '../types';
import { INITIAL_FLEET, INITIAL_COLUMNS } from '../data/initialFleet';
import { FLEET_COLUMNS, FUEL_VOUCHER_COLUMNS, EMPLOYEE_COLUMNS, PARTE_DIARIO_COLUMNS, FuelVoucherColumnKey, EmployeeColumnKey, ParteDiarioColumnKey } from '../data/tableColumns';
import { INITIAL_EMPLOYEES } from '../data/initialDrivers';
import { INITIAL_FUEL_VOUCHERS } from '../data/initialFuelVouchers';
import { INITIAL_FUEL_DEPOSITS } from '../data/initialFuelDeposits';
import { INITIAL_ISSUED_VOUCHERS } from '../data/initialIssuedVouchers';
import { INITIAL_PARTES_DIARIOS } from '../data/initialPartesDiarios';
import { INITIAL_OBRAS } from '../data/initialObras';

const FLEET_STORAGE_KEY = 'la_hormiga_fleet_v1';
const COLUMNS_STORAGE_KEY = 'la_hormiga_columns_v2';
const FUEL_COLUMNS_STORAGE_KEY = 'la_hormiga_fuel_columns_v2';
const DRIVER_COLUMNS_STORAGE_KEY = 'la_hormiga_driver_columns_v1';
const EMPLOYEES_STORAGE_KEY = 'la_hormiga_empleados_v2';
const FUEL_VOUCHERS_STORAGE_KEY = 'la_hormiga_expendio_combustible_v3';
const FUEL_DEPOSITS_STORAGE_KEY = 'la_hormiga_depositos_carga_v1';
const ISSUED_VOUCHERS_STORAGE_KEY = 'la_hormiga_vales_combustible_v3';
const PARTES_DIARIOS_STORAGE_KEY = 'la_hormiga_partes_diarios_v1';
const PARTES_DIARIOS_COLUMNS_STORAGE_KEY = 'la_hormiga_partes_diarios_columns_v1';
const OBRAS_STORAGE_KEY = 'la_hormiga_obras_v1';

// Generic loader for table column configurations (order + visibility)
export function loadTableColumnConfig<T extends string>(
  storageKey: string,
  defaultDefinitions: GenericColumnDefinition<T>[]
): TableColumnConfig<T> {
  const defaultOrder = defaultDefinitions.map(d => d.key);
  const defaultVisible = defaultDefinitions.reduce((acc, def) => {
    acc[def.key] = def.defaultVisible;
    return acc;
  }, {} as Record<T, boolean>);

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Support object with order and visible, or legacy record
      if (parsed && typeof parsed === 'object') {
        let order: T[] = Array.isArray(parsed.order) ? parsed.order : defaultOrder;
        // Ensure all valid keys exist in order
        const existingKeys = new Set(order);
        defaultOrder.forEach(k => {
          if (!existingKeys.has(k)) {
            order.push(k);
          }
        });
        // Filter out any obsolete keys
        order = order.filter(k => defaultDefinitions.some(d => d.key === k));

        const visibleObj = parsed.visible && typeof parsed.visible === 'object' ? parsed.visible : parsed;
        const visible: Record<T, boolean> = { ...defaultVisible };
        defaultOrder.forEach(k => {
          if (typeof visibleObj[k] === 'boolean') {
            visible[k] = visibleObj[k];
          }
        });

        return { order, visible };
      }
    }
  } catch (err) {
    console.error(`Error reading column config for ${storageKey}:`, err);
  }

  return {
    order: defaultOrder,
    visible: defaultVisible
  };
}

export function saveTableColumnConfig<T extends string>(
  storageKey: string,
  config: TableColumnConfig<T>
): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(config));
  } catch (err) {
    console.error(`Error saving column config for ${storageKey}:`, err);
  }
}

export function resetTableColumnConfig<T extends string>(
  storageKey: string,
  defaultDefinitions: GenericColumnDefinition<T>[]
): TableColumnConfig<T> {
  try {
    localStorage.removeItem(storageKey);
  } catch (err) {
    console.error(err);
  }
  return {
    order: defaultDefinitions.map(d => d.key),
    visible: defaultDefinitions.reduce((acc, def) => {
      acc[def.key] = def.defaultVisible;
      return acc;
    }, {} as Record<T, boolean>)
  };
}

// Specific Loaders / Savers
export function loadFleetColumnConfig(): TableColumnConfig<TableColumnKey> {
  return loadTableColumnConfig<TableColumnKey>(COLUMNS_STORAGE_KEY, FLEET_COLUMNS as GenericColumnDefinition<TableColumnKey>[]);
}

export function saveFleetColumnConfig(config: TableColumnConfig<TableColumnKey>): void {
  saveTableColumnConfig<TableColumnKey>(COLUMNS_STORAGE_KEY, config);
}

export function loadFuelColumnConfig(): TableColumnConfig<FuelVoucherColumnKey> {
  return loadTableColumnConfig<FuelVoucherColumnKey>(FUEL_COLUMNS_STORAGE_KEY, FUEL_VOUCHER_COLUMNS);
}

export function saveFuelColumnConfig(config: TableColumnConfig<FuelVoucherColumnKey>): void {
  saveTableColumnConfig<FuelVoucherColumnKey>(FUEL_COLUMNS_STORAGE_KEY, config);
}

export function loadDriverColumnConfig(): TableColumnConfig<EmployeeColumnKey> {
  return loadTableColumnConfig<EmployeeColumnKey>(DRIVER_COLUMNS_STORAGE_KEY, EMPLOYEE_COLUMNS);
}

export function saveDriverColumnConfig(config: TableColumnConfig<EmployeeColumnKey>): void {
  saveTableColumnConfig<EmployeeColumnKey>(DRIVER_COLUMNS_STORAGE_KEY, config);
}

export function loadParteDiarioColumnConfig(): TableColumnConfig<ParteDiarioColumnKey> {
  return loadTableColumnConfig<ParteDiarioColumnKey>(PARTES_DIARIOS_COLUMNS_STORAGE_KEY, PARTE_DIARIO_COLUMNS);
}

export function saveParteDiarioColumnConfig(config: TableColumnConfig<ParteDiarioColumnKey>): void {
  saveTableColumnConfig<ParteDiarioColumnKey>(PARTES_DIARIOS_COLUMNS_STORAGE_KEY, config);
}

export const loadEmployeeColumnConfig = loadDriverColumnConfig;
export const saveEmployeeColumnConfig = saveDriverColumnConfig;

// Backward-compatible wrappers for Fleet
export function loadVisibleColumns(): Record<TableColumnKey, boolean> {
  return loadFleetColumnConfig().visible;
}

export function saveVisibleColumns(columns: Record<TableColumnKey, boolean>): void {
  const current = loadFleetColumnConfig();
  saveFleetColumnConfig({
    order: current.order,
    visible: columns
  });
}

export function loadFuelDeposits(): FuelDeposit[] {
  try {
    const data = localStorage.getItem(FUEL_DEPOSITS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading fuel deposits from localStorage:', error);
  }
  return INITIAL_FUEL_DEPOSITS;
}

export function saveFuelDeposits(deposits: FuelDeposit[]): void {
  try {
    localStorage.setItem(FUEL_DEPOSITS_STORAGE_KEY, JSON.stringify(deposits));
  } catch (error) {
    console.error('Error saving fuel deposits to localStorage:', error);
  }
}

export function resetFuelDepositsToDefault(): FuelDeposit[] {
  try {
    localStorage.removeItem(FUEL_DEPOSITS_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_FUEL_DEPOSITS;
}

export function exportFuelDepositsToCSV(deposits: FuelDeposit[]): void {
  const headers = [
    'ID',
    'CÓDIGO',
    'NOMBRE_DEPÓSITO',
    'MODALIDAD',
    'TIPO_COMBUSTIBLE',
    'CAPACIDAD_TOTAL_LTS',
    'STOCK_ACTUAL_LTS',
    'ESTADO',
    'UBICACIÓN',
    'RESPONSABLE',
    'PATENTE_VEHÍCULO',
    'CANTIDAD_BIDONES',
    'ESTACIÓN_CONVENIO',
    'DIRECCIÓN_ESTACIÓN',
    'ÚLTIMA_RECARGA',
    'OBSERVACIONES'
  ];

  const rows = deposits.map(d => [
    `"${d.id || ''}"`,
    `"${(d.codigo || '').replace(/"/g, '""')}"`,
    `"${(d.nombre || '').replace(/"/g, '""')}"`,
    `"${(d.modalidadLabel || d.modalidad || '').replace(/"/g, '""')}"`,
    `"${(d.tipoCombustible || '').replace(/"/g, '""')}"`,
    d.capacidadTotal ?? 0,
    d.stockActual ?? 0,
    `"${(d.estado || '').replace(/"/g, '""')}"`,
    `"${(d.ubicacion || '').replace(/"/g, '""')}"`,
    `"${(d.responsableNombre || '').replace(/"/g, '""')}"`,
    `"${(d.patenteVehiculo || '').replace(/"/g, '""')}"`,
    d.cantidadBidones ?? '',
    `"${(d.numEstacionConvenio || d.nombreEstacion || '').replace(/"/g, '""')}"`,
    `"${(d.direccionEstacion || '').replace(/"/g, '""')}"`,
    `"${(d.ultimaRecargaFecha || '').replace(/"/g, '""')}"`,
    `"${(d.observaciones || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `depositos_combustible_la_hormiga_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function loadIssuedVouchers(): IssuedFuelVoucher[] {
  try {
    const data = localStorage.getItem(ISSUED_VOUCHERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading issued fuel vouchers from localStorage:', error);
  }
  return INITIAL_ISSUED_VOUCHERS;
}

export function saveIssuedVouchers(vouchers: IssuedFuelVoucher[]): void {
  try {
    localStorage.setItem(ISSUED_VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
  } catch (error) {
    console.error('Error saving issued fuel vouchers to localStorage:', error);
  }
}

export function resetIssuedVouchersToDefault(): IssuedFuelVoucher[] {
  try {
    localStorage.removeItem(ISSUED_VOUCHERS_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_ISSUED_VOUCHERS;
}

export function exportIssuedVouchersToCSV(vouchers: IssuedFuelVoucher[]): void {
  const headers = [
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
  ];

  const rows = vouchers.map(v => [
    `"${v.id || ''}"`,
    `"${(v.numVale || '').replace(/"/g, '""')}"`,
    `"${(v.estado || 'EMITIDO').replace(/"/g, '""')}"`,
    `"${(v.fechaEmision || '').replace(/"/g, '""')}"`,
    `"${(v.horaEmision || '').replace(/"/g, '""')}"`,
    `"${(v.codigoEquipo || '').replace(/"/g, '""')}"`,
    `"${(v.marcaModelo || '').replace(/"/g, '""')}"`,
    `"${(v.patente || '').replace(/"/g, '""')}"`,
    `"${(v.codigoEmpleado || '').replace(/"/g, '""')}"`,
    `"${(v.nombreApellido || '').replace(/"/g, '""')}"`,
    `"${(v.legajo || '').replace(/"/g, '""')}"`,
    `"${(v.tipoComb || '').replace(/"/g, '""')}"`,
    `"${(v.idCombustible || '').replace(/"/g, '""')}"`,
    v.litrosAutorizados ?? 0,
    `"${(v.tipoCarga || '').replace(/"/g, '""')}"`,
    `"${(v.estacionSurtidor || '').replace(/"/g, '""')}"`,
    `"${(v.numEstacion || '').replace(/"/g, '""')}"`,
    v.odometroSalida ?? '',
    `"${(v.numTicket || '').replace(/"/g, '""')}"`,
    v.litrosReales ?? '',
    v.diferenciaLitros ?? '',
    v.odometroCarga ?? '',
    v.importeTotal ?? '',
    `"${(v.fechaRendicion || '').replace(/"/g, '""')}"`,
    `"${(v.expendioId || '').replace(/"/g, '""')}"`,
    `"${(v.observaciones || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `la_hormiga_vales_combustible_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function loadFuelVouchers(): FuelVoucher[] {
  try {
    const data = localStorage.getItem(FUEL_VOUCHERS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading fuel vouchers from localStorage:', error);
  }
  return INITIAL_FUEL_VOUCHERS;
}

export function saveFuelVouchers(vouchers: FuelVoucher[]): void {
  try {
    localStorage.setItem(FUEL_VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
  } catch (error) {
    console.error('Error saving fuel vouchers to localStorage:', error);
  }
}

export function resetFuelVouchersToDefault(): FuelVoucher[] {
  try {
    localStorage.removeItem(FUEL_VOUCHERS_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_FUEL_VOUCHERS;
}

/**
 * Exporta el registro de Expendio de Combustible con las 22 columnas exactas:
 * ID, CARGA, TIPO, ID_COMBUSTIBLE, DEPOSITO, CANTIDAD, TIPO_COMB, CODIGO_EMPLEADO,
 * NOMBRE_APELLIDO, LEGAJO, CODIGO_EQUIPO, MARCA_MODELO, PATENTE, Nº DE ORDEN,
 * FECHA, KILOMETRAJE, HORA, KILOMETROS_REC, AUTONOM, NUM_ESTACION, FOTO_EXPENDIO, FOTO_KILOMETRAJE
 */
export function exportFuelVouchersToCSV(vouchers: FuelVoucher[]): void {
  const headers = [
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
  ];

  const rows = vouchers.map(v => [
    `"${v.id || ''}"`,
    `"${(v.carga || v.tipoCarga || '').replace(/"/g, '""')}"`,
    `"${(v.tipo || 'Despacho Directo').replace(/"/g, '""')}"`,
    `"${(v.idCombustible || 'COMB-D500').replace(/"/g, '""')}"`,
    `"${(v.deposito || v.numEstacion || '').replace(/"/g, '""')}"`,
    v.cantidad ?? 0,
    `"${(v.tipoComb || v.combustible || '').replace(/"/g, '""')}"`,
    `"${(v.codigoEmpleado || '').replace(/"/g, '""')}"`,
    `"${(v.nombreApellido || '').replace(/"/g, '""')}"`,
    `"${(v.legajo || '').replace(/"/g, '""')}"`,
    `"${(v.codigoEquipo || '').replace(/"/g, '""')}"`,
    `"${(v.marcaModelo || '').replace(/"/g, '""')}"`,
    `"${(v.patente || '').replace(/"/g, '""')}"`,
    `"${(v.numOrden || v.numComprobante || '').replace(/"/g, '""')}"`,
    `"${(v.fecha || v.fechaEmision || '').replace(/"/g, '""')}"`,
    v.kilometraje ?? (v.horometroOdometro ?? 0),
    `"${(v.hora || v.horaEmision || '').replace(/"/g, '""')}"`,
    v.kilometrosRec ?? 0,
    `"${(v.autonom || '').replace(/"/g, '""')}"`,
    `"${(v.numEstacion || '').replace(/"/g, '""')}"`,
    `"${(v.fotoExpendio || '').replace(/"/g, '""')}"`,
    `"${(v.fotoKilometraje || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `la_hormiga_expendio_combustible_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function loadDrivers(): Employee[] {
  try {
    const data = localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading employees from localStorage:', error);
  }
  return INITIAL_EMPLOYEES;
}

export function saveDrivers(employees: Employee[]): void {
  try {
    localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
  } catch (error) {
    console.error('Error saving employees to localStorage:', error);
  }
}

export function resetDriversToDefault(): Employee[] {
  try {
    localStorage.removeItem(EMPLOYEES_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_EMPLOYEES;
}

export function exportDriversToCSV(employees: Employee[], fleet: Vehicle[]): void {
  const headers = [
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
  ];

  const rows = employees.map(e => {
    const assignedVehicle = fleet.find(v => v.id === e.vehiculoAsignadoId);
    const assignedText = assignedVehicle 
      ? `[${assignedVehicle.id}] ${assignedVehicle.modeloMarca}` 
      : 'Sin Asignar';

    return [
      `"${e.id || ''}"`,
      `"${e.codigoEmpleado || ''}"`,
      `"${(e.nombreApellido || '').replace(/"/g, '""')}"`,
      `"${e.legajo || ''}"`,
      `"${(e.categoria || '').replace(/"/g, '""')}"`,
      `"${e.foto || ''}"`,
      `"${(e.sector || '').replace(/"/g, '""')}"`,
      `"${(e.obra || '').replace(/"/g, '""')}"`,
      `"${e.estado || ''}"`,
      `"${e.dni || ''}"`,
      `"${e.telefono || ''}"`,
      `"${assignedText.replace(/"/g, '""')}"`,
      e.costoPorDia ?? 0,
      `"${e.fechaAlta || ''}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `la_hormiga_empleados_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


export function loadFleet(): Vehicle[] {
  try {
    const data = localStorage.getItem(FLEET_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading fleet from localStorage:', error);
  }
  return INITIAL_FLEET;
}

export function saveFleet(fleet: Vehicle[]): void {
  try {
    localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(fleet));
  } catch (error) {
    console.error('Error saving fleet to localStorage:', error);
  }
}

export function resetFleetToDefault(): Vehicle[] {
  try {
    localStorage.removeItem(FLEET_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_FLEET;
}

export function exportFleetToCSV(fleet: Vehicle[]): void {
  const headers = [
    'ID',
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
  ];

  const rows = fleet.map(v => [
    `"${v.id || ''}"`,
    `"${(v.modeloMarca || '').replace(/"/g, '""')}"`,
    `"${v.patente || ''}"`,
    `"${v.codigoInterno || ''}"`,
    `"${v.fotografia || ''}"`,
    v.precioCosto ?? 0,
    v.precioSugerido ?? 0,
    v.precioCostoHora ?? 0,
    v.precioSugeridoHora ?? 0,
    `"${v.modalidadTarifa || 'AMBOS'}"`,
    `"${v.clasificacion || ''}"`,
    `"${v.estado || ''}"`,
    v.horometro ?? '',
    `"${(v.ubicacionActual || '').replace(/"/g, '""')}"`,
    `"${v.fechaAlta || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `la_hormiga_flota_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const FUEL_PRICES_STORAGE_KEY = 'la_hormiga_fuel_prices_v1';

export function loadFuelPrices(): Record<string, number> {
  try {
    const raw = localStorage.getItem(FUEL_PRICES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading fuel prices from localStorage:', err);
  }
  return {};
}

export function saveFuelPrice(fuelType: string, price: number): void {
  try {
    const current = loadFuelPrices();
    current[fuelType] = price;
    localStorage.setItem(FUEL_PRICES_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Error saving fuel price to localStorage:', err);
  }
}

export function loadPartesDiarios(): ParteDiario[] {
  try {
    const data = localStorage.getItem(PARTES_DIARIOS_STORAGE_KEY);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading partes diarios from localStorage:', error);
  }
  return INITIAL_PARTES_DIARIOS;
}

export function savePartesDiarios(partes: ParteDiario[]): void {
  try {
    localStorage.setItem(PARTES_DIARIOS_STORAGE_KEY, JSON.stringify(partes));
  } catch (error) {
    console.error('Error saving partes diarios to localStorage:', error);
  }
}

export function resetPartesDiariosToDefault(): ParteDiario[] {
  try {
    localStorage.removeItem(PARTES_DIARIOS_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_PARTES_DIARIOS;
}

export function exportPartesDiariosToCSV(partes: ParteDiario[]): void {
  const headers = [
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
  ];

  const rows = partes.map(p => [
    `"${p.id || ''}"`,
    `"${(p.servMant || 'ALQUILER').replace(/"/g, '""')}"`,
    `"${(p.obra || '').replace(/"/g, '""')}"`,
    `"${(p.codigoObra || '').replace(/"/g, '""')}"`,
    `"${(p.codigoEquipo || '').replace(/"/g, '""')}"`,
    `"${(p.marcaModelo || p.vehicleName || '').replace(/"/g, '""')}"`,
    `"${(p.codigoEmpleado || '').replace(/"/g, '""')}"`,
    `"${(p.nombreApellido || p.driverName || '').replace(/"/g, '""')}"`,
    `"${p.fecha || ''}"`,
    `"${p.horaInicioMañana || ''}"`,
    `"${p.horaFinMañana || ''}"`,
    `"${p.horaInicioTarde || ''}"`,
    `"${p.horaFinTarde || ''}"`,
    p.horasTrabajadas ?? 0,
    p.odomKilom ?? 0,
    `"${p.tipo || 'HORAS'}"`,
    `"${(p.detalleTipo || p.detalleEntrega || '').replace(/"/g, '""')}"`,
    p.viajesCantidad ?? p.cantidad ?? 0,
    `"${(p.extraccionEntregas || '').replace(/"/g, '""')}"`,
    `"${(p.tipoMaterial || '').replace(/"/g, '""')}"`,
    p.hsCantidad ?? p.horasTrabajadas ?? 0,
    `"${(p.novedades || '').replace(/"/g, '""')}"`,
    `"${(p.ubicacion || '').replace(/"/g, '""')}"`,
    `"${(p.encargadoObra || '').replace(/"/g, '""')}"`,
    `"${(p.firma || '').replace(/"/g, '""')}"`,
    `"${p.numParte || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `la_hormiga_partes_diarios_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function loadObras(): Obra[] {
  try {
    const data = localStorage.getItem(OBRAS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading obras from localStorage:', error);
  }
  return INITIAL_OBRAS;
}

export function saveObras(obras: Obra[]): void {
  try {
    localStorage.setItem(OBRAS_STORAGE_KEY, JSON.stringify(obras));
  } catch (error) {
    console.error('Error saving obras to localStorage:', error);
  }
}

export function resetObrasToDefault(): Obra[] {
  try {
    localStorage.removeItem(OBRAS_STORAGE_KEY);
  } catch (e) {
    console.error(e);
  }
  return INITIAL_OBRAS;
}

export function exportObrasToCSV(obras: Obra[]): void {
  const headers = [
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
  ];

  const rows = obras.map(o => [
    `"${o.id || ''}"`,
    `"${(o.numero || '').replace(/"/g, '""')}"`,
    `"${(o.nombreObra || '').replace(/"/g, '""')}"`,
    `"${(o.ubicacion || '').replace(/"/g, '""')}"`,
    `"${(o.pertenece || '').replace(/"/g, '""')}"`,
    o.activa ? 'SÍ' : 'NO',
    `"${(o.plazo || '').replace(/"/g, '""')}"`,
    o.montoEstimado ?? 0,
    `"${o.fechaAlta || ''}"`,
    `"${(o.observaciones || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `la_hormiga_obras_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
