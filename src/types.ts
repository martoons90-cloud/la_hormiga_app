export type VehicleStatus = 
  | 'DISPONIBLE'
  | 'ALQUILADO'
  | 'EN_MANTENIMIENTO'
  | 'TALLER'
  | 'RESERVADO'
  | 'FUERA_DE_SERVICIO';

export type VehicleClassification =
  | 'Minicargadora'
  | 'Camión Volcador'
  | 'Camión Chasis / Grúa'
  | 'Retroexcavadora'
  | 'Excavadora de Orugas'
  | 'Pala Cargadora Frontal'
  | 'Rodillo Compactador'
  | 'Autoelevador / Clark'
  | 'Manipulador Telescópico'
  | 'Grupo Electrógeno / Compresor'
  | 'Plataforma Elevadora'
  | 'Otro';

export type RentalModality = 'DIAS' | 'HORAS' | 'AMBOS';

export interface Vehicle {
  id: string; // e.g., "EQ-001" or "MINI-01"
  modeloMarca: string; // e.g., "Bobcat S570"
  patente: string; // e.g., "AF 123 CD"
  codigoInterno: string; // e.g., "LH-MQ-2024-001"
  fotografia: string; // URL / base64 image
  precioCosto: number; // Costo por día o base
  precioSugerido: number; // Precio sugerido por día o base
  precioCostoHora?: number; // Costo por hora
  precioSugeridoHora?: number; // Precio sugerido por hora
  modalidadTarifa?: RentalModality; // 'DIAS' | 'HORAS' | 'AMBOS'
  clasificacion: VehicleClassification;
  estado: VehicleStatus;
  
  // Campos complementarios útiles para alquiler
  horometro?: number; // Horas de motor actuales
  anio?: number; // Año de fabricación
  combustible?: 'Diesel' | 'Nafta' | 'Eléctrico' | 'GLP';
  ubicacionActual?: string; // "Base Central - Parque Industrial", "Obra Nordelta", etc.
  observaciones?: string;
  fechaAlta: string; // ISO date string
  fechaUltimoMantenimiento?: string;
  mostrarEnDashboard?: boolean; // Control whether shown in CombustibleVsTrabajoDashboard
}

export type TableColumnKey =
  | 'fotografia'
  | 'id'
  | 'modeloMarca'
  | 'patente'
  | 'codigoInterno'
  | 'clasificacion'
  | 'precioCosto'
  | 'precioSugerido'
  | 'estado'
  | 'horometro'
  | 'ubicacionActual'
  | 'fechaAlta';

export interface GenericColumnDefinition<T extends string = string> {
  key: T;
  label: string;
  shortLabel?: string;
  description: string;
  defaultVisible: boolean;
  required?: boolean;
  category?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableColumnConfig<T extends string = string> {
  order: T[];
  visible: Record<T, boolean>;
}

export type TableDensity = 'normal' | 'compact' | 'ultra';

export type ColumnDefinition = GenericColumnDefinition<TableColumnKey>;

export interface FleetStats {
  total: number;
  disponibles: number;
  alquilados: number;
  enMantenimiento: number;
  reservados: number;
  fueraDeServicio: number;
  valorFlotaCostoTotal: number;
  potencialFacturacionDiaria: number;
}

export type EmployeeStatus = 
  | 'ACTIVO'
  | 'EN_OBRA'
  | 'LICENCIA'
  | 'INACTIVO';

export type DriverStatus = EmployeeStatus;

export interface Employee {
  id: string; // ID
  codigoEmpleado: string; // CODIGO_EMPLEADO
  nombreApellido: string; // NOMBRE_APELLIDO
  legajo: string; // LEGAJO
  categoria: string; // CATEGORIA
  foto: string; // FOTO
  sector: string; // SECTOR
  obra: string; // OBRA
  estado: EmployeeStatus; // ESTADO

  // Campos complementarios de contacto e integración operativa
  dni?: string;
  cuit?: string;
  telefono?: string;
  email?: string;
  vehiculoAsignadoId?: string; // ID de Máquina / Equipo de la flota asignado
  fechaAlta?: string;
  costoPorDia?: number;
  costoPorHora?: number;
  observaciones?: string;
}

// Alias Driver to Employee for seamless compatibility
export type Driver = Employee;

export interface EmployeeStats {
  total: number;
  activos: number;
  enObra: number;
  enLicencia: number;
  inactivos: number;
}

export type DriverStats = EmployeeStats;

// ==================== EXPENDIO DE COMBUSTIBLE ====================

export type FuelVoucherStatus = 
  | 'CARGADO'
  | 'EMITIDO'
  | 'RENDIDO'
  | 'PENDIENTE'
  | 'ANULADO';

export type FuelType = 
  | 'Diesel 500 (Grado 2)'
  | 'Infinia Diesel (Grado 3)'
  | 'Euro Diesel'
  | 'Nafta Súper'
  | 'Nafta Premium'
  | 'GNC / GLP'
  | 'Biodiesel';

export type FuelLoadType =
  | 'Tanque Lleno'
  | 'Carga Parcial'
  | 'Bidón Auxiliar'
  | 'Cisterna Móvil'
  | 'Grupo Electrógeno'
  | 'Carga de Emergencia';

/**
 * Registro oficial de Expendio de Combustible (22 Columnas exactas)
 * 1. ID
 * 2. CARGA
 * 3. TIPO
 * 4. ID_COMBUSTIBLE
 * 5. DEPOSITO
 * 6. CANTIDAD
 * 7. TIPO_COMB
 * 8. CODIGO_EMPLEADO
 * 9. NOMBRE_APELLIDO
 * 10. LEGAJO
 * 11. CODIGO_EQUIPO
 * 12. MARCA_MODELO
 * 13. PATENTE
 * 14. Nº DE ORDEN
 * 15. FECHA
 * 16. KILOMETRAJE
 * 17. HORA
 * 18. KILOMETROS_REC
 * 19. AUTONOM
 * 20. NUM_ESTACION
 * 21. FOTO_EXPENDIO
 * 22. FOTO_KILOMETRAJE
 */
export interface FuelDispensary {
  id: string; // 1. ID (ej: "faa9f1c3")
  carga?: string; // 2. CARGA (ej: "Tanque Lleno", "Carga Parcial", "Bidón", etc.)
  tipo: string; // 3. TIPO (ej: "EGRESO", "INGRESO")
  idCombustible?: string; // 4. ID_COMBUSTIBLE (ej: "COMB-INF-D", "COMB-D500")
  deposito: string; // 5. DEPOSITO (ej: "ESTACION DE SERV", "DIESEL 500")
  cantidad: number; // 6. CANTIDAD (Litros)
  cantCarga?: number; // CANT_CARGA (ej: -117.78 o 145.61)
  tipoComb: string; // 7. TIPO_COMB (ej: "DIESEL INFINIA", "DIESEL COMUN", "NAFTA SUPER")
  codigoEmpleado: string; // 8. CODIGO_EMPLEADO (ej: "DANIEL GARCIA", "ANDRES ACOSTA")
  nombreApellido?: string; // 9. NOMBRE_APELLIDO (ej: "Daniel García")
  legajo?: string; // 10. LEGAJO (ej: "LEG-7512")
  codigoEquipo: string; // 11. CODIGO_EQUIPO (ej: "MERCEDES BENZ 1720 - 15", "NISSAN 4X2")
  marcaModelo?: string; // 12. MARCA_MODELO (ej: "Mercedes-Benz Actros 2645 Batea")
  patente?: string; // 13. PATENTE (ej: "AD 456 EF")
  numOrden?: string; // 14. Nº DE ORDEN (ej: "02623")
  fecha: string; // 15. FECHA (ej: "2026-08-31" o "31/8/2026")
  kilometraje?: number; // 16. KILOMETRAJE / KMS_HS (ej: 317958)
  kmsHs?: number; // KMS/HS
  hora?: string; // 17. HORA (ej: "07:15")
  kilometrosRec?: number; // 18. KILOMETROS_REC (ej: 537)
  autonomiaVt?: string; // AUTONOMIA_VT (ej: "04,56", "00,25")
  autonom?: string; // 19. AUTONOM (ej: "4,56", "3,93")
  numEstacion?: string; // 20. NUM_ESTACION (ej: "48-56047")
  fotoExpendio?: string; // 21. FOTO_EXPENDIO (URL o base64)
  fotoKilometraje?: string; // 22. FOTO_KILOMETRAJE (URL o base64)
  clasificacion?: string; // CLASIFICACION (ej: "CAMIONES", "AUTOS/CAMIONETAS", "MAQUINAS")

  // Campos adicionales operativos y de trazabilidad
  estado?: FuelVoucherStatus;
  numComprobante?: string;
  numVale?: string; // Número de vale vinculado (ej: "VAL-2026-000851")
  valeId?: string; // ID interno del vale vinculado (ej: "VAL-001")
  numTicket?: string; // Número de ticket anotado de la estación (ej: "TK-0084-00192842")
  litrosAutorizados?: number; // Litros que autorizaba el vale
  diferenciaLitros?: number; // Diferencia entre litros reales y autorizados
  empresa?: string;
  precioUnitario?: number;
  totalImporte?: number;
  observaciones?: string;
  empleado?: string;
  combustible?: string;
  tipoCarga?: string;
  fechaEmision?: string;
  horaEmision?: string;
  horometroOdometro?: number;
  despachante?: string;
}

export type FuelVoucher = FuelDispensary;

/**
 * Vale de Combustible Emitido (Circuito de Entrega a Chofer -> Carga en Estación -> Rendición con Ticket)
 */
export type IssuedVoucherStatus = 'EMITIDO' | 'RENDIDO' | 'ANULADO';

export interface IssuedFuelVoucher {
  id: string; // ej: "VAL-001"
  numVale: string; // ej: "02627" o "VAL-2026-000851"
  numComprobante?: string; // ej: "02627" (NUM. COMPROBANTE)
  fechaEmision: string; // ej: "2026-09-01" o "1/9/2026"
  fecha?: string;
  horaEmision?: string; // ej: "07:30"
  codigoEquipo: string; // ej: "NISSAN 4X2", "MERCEDES BENZ 1720 - 15"
  marcaModelo?: string; // ej: "Nissan Frontier 4x2"
  patente?: string; // ej: "AD 456 EF"
  codigoEmpleado?: string; // ej: "CH-204"
  nombreApellido: string; // ej: "ANDRES ACOSTA"
  legajo?: string; // ej: "LEG-7512"
  tipoComb: string; // ej: "DIESEL INFINIA", "DIESEL COMUN", "NAFTA SUPER"
  idCombustible?: string; // ej: "COMB-INF-D"
  litrosAutorizados?: number; // Litros solicitados o cupo estimado
  cantidad?: number; // ej: 57.87 (CANTIDAD DESPACHADA)
  tipoCarga?: string; // ej: "Tanque Lleno Autorizado", "Carga Parcial 100L", "Bidones"
  estacionSurtidor?: string; // ej: "Surtidor YPF Ruta 8 km 52 (Pilar)"
  numEstacion?: string; // ej: "48-56067" (NUM_ESTACION)
  odometroSalida?: number; // Odómetro al momento de emitir el vale
  estado: IssuedVoucherStatus; // 'RENDIDO' | 'EMITIDO' | 'ANULADO'
  observaciones?: string;
  
  // Datos completados automáticamente cuando se rinde con el Ticket en Expendio:
  fechaRendicion?: string;
  horaRendicion?: string;
  expendioId?: string; // ID del registro de expendio generado (ej: "EXP-001")
  numTicket?: string; // Número de ticket de la estación anotado (ej: "TK-0084-00192842")
  litrosReales?: number; // Litros reales despachados según ticket
  odometroCarga?: number; // Odómetro real anotado en el ticket
  importeTotal?: number;
  precioUnitario?: number;
  diferenciaLitros?: number; // litrosReales - litrosAutorizados
  fotoTicket?: string;
  fotoOdometro?: string;
}

export type IssuedVoucherColumnKey =
  | 'numVale'
  | 'estado'
  | 'fechaEmision'
  | 'codigoEquipo'
  | 'patente'
  | 'nombreApellido'
  | 'tipoComb'
  | 'litrosAutorizados'
  | 'estacionSurtidor'
  | 'numTicket'
  | 'litrosReales'
  | 'diferenciaLitros'
  | 'fechaRendicion';

export interface IssuedVoucherStats {
  totalVales: number;
  emitidos: number; // Pendientes de rendir
  rendidos: number; // Con ticket cargado
  anulados: number;
  totalLitrosAutorizados: number;
  totalLitrosRendidos: number;
}

export interface FuelVoucherStats {
  totalVales: number;
  totalLitros: number;
  cargados: number;
  emitidos: number;
  pendientes: number;
  anulados: number;
  costoTotalEstimado: number;
  promedioRendimiento?: string;
}

/**
 * 3 Modalidades exclusivas de la empresa para Depósitos de Carga:
 * 1. DEPOSITO_AMBULANTE: Cisterna móvil sobre camión/carretón
 * 2. BIDONES: Stock de bidones homologados de 20L / 50L en pañol/obra
 * 3. VALES_ESTACION: Vales para ir a la estación de servicio (YPF, Shell, Axion, etc.)
 */
export type FuelDepositModality = 
  | 'DEPOSITO_AMBULANTE' 
  | 'BIDONES'            
  | 'VALES_ESTACION';    

export type FuelDepositStatus = 'OPERATIVO' | 'BAJO_STOCK' | 'EN_REPOSICION' | 'FUERA_SERVICIO';

export interface FuelDeposit {
  id: string; // ej: "DEP-AMB-01", "DEP-BID-01", "DEP-VAL-01"
  codigo: string; // ej: "CIST-MOV-01", "BID-BASE-01", "VAL-YPF-01"
  nombre: string; // ej: "Cisterna Móvil Mercedes 1114 #01", "Stock Bidones Base Central", "Cuenta Corriente YPF Pilar"
  modalidad: FuelDepositModality;
  modalidadLabel: string; // "Depósito Ambulante" | "Bidones" | "Vales para Estación de Servicio"
  tipoCombustible: string; // "Diesel 500", "Infinia Diesel", "Nafta Súper", "Múltiple", etc.
  idCombustible: string; // "COMB-D500", "COMB-INF-D", etc.
  capacidadTotal: number; // Capacidad máxima en Litros o Cupo mensual en Litros
  stockActual: number; // Litros disponibles
  nivelAlertaMinimo: number; // Litros para alerta de reposición
  ubicacion: string; // Base Central, Obrador Tigre, Obra Panamericana, Estación YPF Pilar, etc.
  responsableId?: string;
  responsableNombre?: string;
  estado: FuelDepositStatus;
  
  // Campos específicos según modalidad:
  // 1. Depósito Ambulante
  patenteVehiculo?: string;
  vehiculoId?: string;
  codigoEquipo?: string;
  marcaModeloCamion?: string;
  
  // 2. Bidones
  cantidadBidones?: number;
  capacidadPorBidon?: number; // ej: 20L o 50L
  tipoHomologacion?: string; // ej: "Bidones Plásticos Homologados IRAM", "Bidones Metálicos Antiexplosivos"
  
  // 3. Vales para Estación de Servicio
  numEstacionConvenio?: string;
  nombreEstacion?: string;
  direccionEstacion?: string;
  empresaBandera?: 'YPF' | 'SHELL' | 'AXION' | 'PUMA' | 'OTRA';
  numeroCuentaConvenio?: string;

  costoPorLitroEstimado?: number;
  ultimaRecargaFecha?: string;
  observaciones?: string;
  foto?: string;
}

export type ParteDiarioStatus = 'COMPLETADO' | 'PENDIENTE' | 'EN_CURSO';
export type ParteTipoTrabajo = 'HORAS' | 'VIAJES';
export type ParteAutorizadoStatus = 'NO CONTROLADO' | 'CONTROLADO' | 'AUTORIZADO';

export interface DailyVehicleChecklist {
  // Fotos de inspección inicial (4 lados + cabina + horómetro/tablero)
  fotoFrente?: string;
  fotoAtras?: string;
  fotoLateralIzquierdo?: string;
  fotoLateralDerecho?: string;
  fotoCabinaInterior?: string;
  fotoTableroOdometro?: string;

  // Chequeos mecánicos y de fluidos
  nivelAceiteMotor: boolean; // Nivel de aceite de motor (varilla en rango)
  nivelRefrigerante: boolean; // Nivel de refrigerante / agua de radiador
  nivelAceiteHidraulico: boolean; // Nivel de fluido hidráulico (tanque/visor)
  lucesYAlarmas: boolean; // Luces de trabajo, baliza y alarma de retroceso
  fugasFluidos: boolean; // Sin pérdidas visibles en mangueras/cilindros
  estadoNeumaticosOrugas: boolean; // Presión de neumáticos o tensión de orugas
  frenoEmergencia: boolean; // Freno de mano / traba de seguridad / corta corriente
  extintorYBotiquin: boolean; // Matafuegos cargado y elementos de seguridad

  // Lectura inicial del odómetro/horómetro antes de arrancar
  odometroInicial: number;
  observacionesChecklist?: string;
  completado: boolean;
  fechaHoraChecklist?: string;
}

export interface ParteDiario {
  id: string;
  servMant: string; // SERV_MANT
  obra: string; // OBRA
  codigoObra: string; // CODIGO_OBRA
  codigoEquipo: string; // CODIGO_EQUIPO
  marcaModelo: string; // MARCA_MODELO
  codigoEmpleado: string; // CODIGO_EMPLEADO
  nombreApellido: string; // NOMBRE_APELLIDO
  fecha: string; // FECHA
  horaInicioMañana?: string; // HORA_INICIO_MAÑANA
  horaFinMañana?: string; // HORA_FIN_MAÑANA
  horaInicioTarde?: string; // HORA_INICIO_TARDE
  horaFinTarde?: string; // HORA_FIN_TARDE
  horasTrabajadas: number; // HORAS TRABAJADAS
  odomKilom?: number; // ODOM-KILOM
  odometroInicial?: number; // Odómetro / Horómetro al inicio del día (Checklist)
  tipo: ParteTipoTrabajo; // TIPO (HORAS / VIAJES)
  detalleTipo?: string; // DETALLE_TIPO
  viajesCantidad: number; // VIAJES_CANTIDAD
  extraccionEntregas?: string; // EXTRACION_ENTREGAS
  tipoMaterial?: string; // TIPO_MATERIAL
  hsCantidad: number; // HS_CANTIDAD
  novedades?: string; // NOVEDADES
  ubicacion?: string; // UBICACION
  encargadoObra?: string; // ENCARGADO_OBRA
  firma?: string; // FIRMA
  numParte: string; // NUM_PARTE
  autorizado: ParteAutorizadoStatus;

  // Checklist de arranque diario
  checklist?: DailyVehicleChecklist;

  // Compatibility / extra fields
  vehicleId?: string;
  vehicleName?: string;
  patenteOrCodigo?: string;
  driverName?: string;
  cantidad?: number;
  detalleEntrega?: string;
  nombreHoraVirtual?: string;
  combustibleConsumidoLts?: number;
  estado?: ParteDiarioStatus;
  supervisor?: string;
  observaciones?: string;
}

export interface ParteDiarioStats {
  totalPartes: number;
  horasTotalesTrabajadas: number;
  combustibleTotalConsumido: number;
  completados: number;
  pendientes: number;
}

export interface FuelDepositStats {
  totalDepositos: number;
  capacidadTotalLitros: number;
  stockTotalLitros: number;
  totalAmbulantes: number;
  totalBidones: number;
  totalValesEstacion: number;
  depositosBajoStock: number;
  porcentajeStockGlobal: number;
}

export interface Obra {
  id: string;
  numero: string; // numero
  nombreObra: string; // nombre de obra
  ubicacion: string; // ubicacion
  pertenece: string; // empresa o persona a quien le pertenece
  activa: boolean; // si esta activa
  plazo: string; // plazo
  montoEstimado: number; // monto estimado
  fechaAlta?: string;
  observaciones?: string;
}


