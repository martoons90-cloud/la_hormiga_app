import React, { useState, useEffect, useMemo } from 'react';
import { IssuedFuelVoucher, Vehicle, Employee, FuelDeposit } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { 
  X, 
  Ticket, 
  Truck, 
  User, 
  MapPin, 
  Fuel, 
  Calendar, 
  Clock, 
  Lock, 
  AlertCircle,
  Building2,
  Check
} from 'lucide-react';

interface IssuedVoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: IssuedFuelVoucher) => void;
  voucherToEdit?: IssuedFuelVoucher | null;
  fleet: Vehicle[];
  employees: Employee[];
  deposits: FuelDeposit[];
  existingCount: number;
}

const COMMON_FUELS: { name: string; id: string }[] = [
  { name: 'Diesel 500 (Grado 2)', id: 'COMB-D500' },
  { name: 'Infinia Diesel (Grado 3)', id: 'COMB-INF-D' },
  { name: 'Euro Diesel', id: 'COMB-EURO' },
  { name: 'Nafta Súper', id: 'COMB-SUPER' },
  { name: 'Nafta Premium', id: 'COMB-PREM' },
  { name: 'GNC / GLP', id: 'COMB-GNC' },
  { name: 'Biodiesel', id: 'COMB-BIO' }
];

export const IssuedVoucherFormModal: React.FC<IssuedVoucherFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  voucherToEdit,
  fleet,
  employees,
  deposits,
  existingCount,
}) => {
  const [formData, setFormData] = useState<Partial<IssuedFuelVoucher>>({
    id: '',
    numVale: '',
    numComprobante: '',
    fechaEmision: new Date().toISOString().slice(0, 10),
    horaEmision: new Date().toTimeString().slice(0, 5),
    codigoEquipo: '',
    marcaModelo: '',
    patente: '',
    codigoEmpleado: '',
    nombreApellido: '',
    legajo: '',
    tipoComb: 'Diesel 500 (Grado 2)',
    idCombustible: 'COMB-D500',
    litrosAutorizados: undefined,
    tipoCarga: 'Completa (Tanque Lleno)',
    estacionSurtidor: '',
    numEstacion: '',
    estado: 'EMITIDO',
    observaciones: ''
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDepositId, setSelectedDepositId] = useState<string>('');
  const [customStationName, setCustomStationName] = useState<string>('');
  const [isAddingCustomStation, setIsAddingCustomStation] = useState<boolean>(false);

  // Filter deposits to ONLY include Service Stations (Vales para Estación de Servicio)
  const serviceStations = useMemo(() => {
    const stations = deposits.filter(d => 
      d.modalidad === 'VALES_ESTACION' || 
      d.modalidadLabel?.toLowerCase().includes('estaci') ||
      Boolean(d.empresaBandera) ||
      Boolean(d.numEstacionConvenio)
    );
    // If no stations configured with VALES_ESTACION yet, fallback to all deposits with 'estacion' in name or VALES_ESTACION
    return stations.length > 0 ? stations : deposits.filter(d => d.modalidad === 'VALES_ESTACION');
  }, [deposits]);

  // Transform Fleet into Searchable Options displaying strictly: "Marca Modelo - Patente"
  const vehicleOptions = useMemo(() => {
    return fleet.map(veh => {
      const brandModel = veh.modeloMarca || [veh.marca, veh.modelo].filter(Boolean).join(' ') || veh.codigoEquipo || 'Equipo';
      const licensePlate = veh.patente ? veh.patente.trim() : 'S/P';
      const label = `${brandModel} - ${licensePlate}`;

      return {
        value: veh.id,
        label,
        extraSearchTerms: `${veh.codigoEquipo || ''} ${veh.clasificacion || ''} ${veh.combustible || ''}`
      };
    });
  }, [fleet]);

  // Transform Employees into Searchable Options displaying strictly: "Nombre y Apellido"
  const employeeOptions = useMemo(() => {
    return employees.map(emp => {
      return {
        value: emp.id,
        label: emp.nombreApellido || `${emp.codigoEmpleado || 'Empleado'}`,
        extraSearchTerms: `${emp.codigoEmpleado || ''} ${emp.legajo || ''} ${emp.dni || ''} ${emp.categoria || ''}`
      };
    });
  }, [employees]);

  // Transform Service Stations into Searchable Options
  const stationOptions = useMemo(() => {
    return serviceStations.map(d => {
      const brand = d.empresaBandera ? `[${d.empresaBandera}] ` : '';
      const name = d.nombreEstacion || d.nombre;
      const label = `${brand}${name}`;
      const location = d.direccionEstacion || d.ubicacion || undefined;

      return {
        value: d.id,
        label,
        secondaryText: location,
        extraSearchTerms: `${d.numEstacionConvenio || ''} ${d.codigo || ''} ${d.empresaBandera || ''} ${d.ubicacion || ''}`
      };
    });
  }, [serviceStations]);

  useEffect(() => {
    if (voucherToEdit) {
      setFormData(voucherToEdit);
      const matchedVeh = fleet.find(v => v.codigoEquipo === voucherToEdit.codigoEquipo || v.patente === voucherToEdit.patente);
      if (matchedVeh) setSelectedVehicleId(matchedVeh.id);
      
      const matchedEmp = employees.find(e => e.nombreApellido === voucherToEdit.nombreApellido || e.codigoEmpleado === voucherToEdit.codigoEmpleado || e.legajo === voucherToEdit.legajo);
      if (matchedEmp) setSelectedEmployeeId(matchedEmp.id);

      const matchedDep = serviceStations.find(d => d.nombre === voucherToEdit.estacionSurtidor || d.numEstacionConvenio === voucherToEdit.numEstacion || (d.nombreEstacion && d.nombreEstacion === voucherToEdit.estacionSurtidor));
      if (matchedDep) {
        setSelectedDepositId(matchedDep.id);
        setIsAddingCustomStation(false);
      } else if (voucherToEdit.estacionSurtidor) {
        setSelectedDepositId('custom');
        setCustomStationName(voucherToEdit.estacionSurtidor);
        setIsAddingCustomStation(true);
      }
    } else {
      const now = new Date();
      const currentDate = now.toISOString().slice(0, 10);
      const currentTime = now.toTimeString().slice(0, 5);

      const firstStation = serviceStations[0];

      // Reset form: numVale starts EMPTY for the user to fill in physical voucher number
      setFormData({
        id: `VAL-${Date.now().toString().slice(-4)}`,
        numVale: '', // Starts empty for the user to fill with the physical voucher number
        numComprobante: '',
        fechaEmision: currentDate,
        horaEmision: currentTime,
        codigoEquipo: '',
        marcaModelo: '',
        patente: '',
        codigoEmpleado: '',
        nombreApellido: '',
        legajo: '',
        tipoComb: 'Diesel 500 (Grado 2)',
        idCombustible: 'COMB-D500',
        litrosAutorizados: undefined,
        tipoCarga: 'Completa (Tanque Lleno)',
        estacionSurtidor: firstStation ? (firstStation.nombreEstacion || firstStation.nombre) : '',
        numEstacion: firstStation?.numEstacionConvenio || firstStation?.codigo || '',
        estado: 'EMITIDO',
        observaciones: ''
      });

      setSelectedVehicleId('');
      setSelectedEmployeeId('');
      if (firstStation) {
        setSelectedDepositId(firstStation.id);
        setIsAddingCustomStation(false);
      } else {
        setSelectedDepositId('');
        setIsAddingCustomStation(false);
      }
    }
  }, [voucherToEdit, isOpen, fleet, employees, serviceStations]);

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const veh = fleet.find(v => v.id === vehicleId);
    if (!veh) {
      setFormData(prev => ({
        ...prev,
        codigoEquipo: '',
        marcaModelo: '',
        patente: ''
      }));
      return;
    }

    let defaultFuel = 'Diesel 500 (Grado 2)';
    let defaultFuelId = 'COMB-D500';

    if (veh.combustible === 'Nafta') {
      defaultFuel = 'Nafta Súper';
      defaultFuelId = 'COMB-SUPER';
    } else if (veh.clasificacion?.includes('Camión') || veh.modeloMarca?.includes('Actros')) {
      defaultFuel = 'Infinia Diesel (Grado 3)';
      defaultFuelId = 'COMB-INF-D';
    }

    setFormData(prev => ({
      ...prev,
      codigoEquipo: veh.codigoEquipo,
      marcaModelo: veh.modeloMarca || [veh.marca, veh.modelo].filter(Boolean).join(' ') || veh.codigoEquipo,
      patente: veh.patente || '',
      tipoComb: defaultFuel,
      idCombustible: defaultFuelId
    }));

    // Auto-select assigned employee if one is assigned to this vehicle
    const assignedEmp = employees.find(e => e.vehiculoAsignadoId === veh.id);
    if (assignedEmp) {
      handleSelectEmployee(assignedEmp.id);
    }
  };

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = employees.find(e => e.id === empId);
    if (!emp) {
      setFormData(prev => ({
        ...prev,
        codigoEmpleado: '',
        nombreApellido: '',
        legajo: ''
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      codigoEmpleado: emp.codigoEmpleado || '',
      nombreApellido: emp.nombreApellido || '',
      legajo: emp.legajo || ''
    }));
  };

  const handleSelectDeposit = (depositId: string) => {
    setSelectedDepositId(depositId);
    if (depositId === 'custom') {
      setIsAddingCustomStation(true);
      return;
    }
    setIsAddingCustomStation(false);
    const dep = serviceStations.find(d => d.id === depositId);
    if (!dep) return;

    setFormData(prev => ({
      ...prev,
      estacionSurtidor: dep.nombreEstacion || dep.nombre,
      numEstacion: dep.numEstacionConvenio || dep.codigo || ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const voucherNumber = (formData.numVale || '').trim();
    if (!voucherNumber) {
      alert('Por favor ingrese el Número de Vale (debe estar completo para emitir).');
      return;
    }

    if (!selectedVehicleId && !formData.marcaModelo && !formData.codigoEquipo) {
      alert('Por favor seleccione el Equipo / Vehículo desde el desplegable.');
      return;
    }

    if (!selectedEmployeeId && !formData.nombreApellido) {
      alert('Por favor seleccione el Chofer / Operador desde el desplegable.');
      return;
    }

    const isTanqueLleno = !formData.tipoCarga || formData.tipoCarga === 'Completa (Tanque Lleno)' || formData.tipoCarga.includes('Tanque Lleno');

    if (!isTanqueLleno) {
      const ltrs = Number(formData.litrosAutorizados);
      if (!ltrs || isNaN(ltrs) || ltrs <= 0) {
        alert('Por favor ingrese la cantidad de Litros Autorizados para la carga parcial.');
        return;
      }
    }

    const stationName = isAddingCustomStation 
      ? customStationName.trim() 
      : (formData.estacionSurtidor || '').trim();

    if (!stationName) {
      alert('Por favor seleccione la Estación de Servicio autorizada.');
      return;
    }

    const valeFinal: IssuedFuelVoucher = {
      id: formData.id || `VAL-${Date.now().toString().slice(-4)}`,
      numVale: voucherNumber,
      numComprobante: voucherNumber,
      fechaEmision: formData.fechaEmision || new Date().toISOString().slice(0, 10),
      horaEmision: formData.horaEmision || new Date().toTimeString().slice(0, 5),
      codigoEquipo: formData.codigoEquipo || '',
      marcaModelo: formData.marcaModelo || '',
      patente: formData.patente || '',
      codigoEmpleado: formData.codigoEmpleado || '',
      nombreApellido: formData.nombreApellido || '',
      legajo: formData.legajo || '',
      tipoComb: formData.tipoComb || 'Diesel 500 (Grado 2)',
      idCombustible: formData.idCombustible || 'COMB-D500',
      litrosAutorizados: isTanqueLleno ? undefined : (Number(formData.litrosAutorizados) || undefined),
      cantidad: isTanqueLleno 
        ? (formData.litrosReales || undefined) 
        : (Number(formData.litrosAutorizados) || undefined),
      tipoCarga: formData.tipoCarga || 'Completa (Tanque Lleno)',
      estacionSurtidor: stationName,
      numEstacion: formData.numEstacion || '',
      estado: (formData.estado as 'EMITIDO' | 'RENDIDO' | 'ANULADO') || 'EMITIDO',
      observaciones: formData.observaciones || '',
      fechaRendicion: formData.fechaRendicion,
      horaRendicion: formData.horaRendicion,
      expendioId: formData.expendioId,
      numTicket: formData.numTicket,
      litrosReales: formData.litrosReales,
      odometroCarga: formData.odometroCarga,
      importeTotal: formData.importeTotal,
      precioUnitario: formData.precioUnitario,
      diferenciaLitros: formData.diferenciaLitros,
      fotoTicket: formData.fotoTicket,
      fotoOdometro: formData.fotoOdometro
    };

    onSave(valeFinal);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#16191F] border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-black/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{voucherToEdit ? 'Editar Vale de Combustible' : 'Emisión de Vale de Combustible'}</span>
                {voucherToEdit && formData.numVale && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold">
                    Nº {formData.numVale}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Paso 1 del Circuito: Emitir vale para entrega al chofer antes de acudir a la estación de servicio.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Circuito Notice Banner */}
          <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-800/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <span className="font-bold text-amber-400">Emisión de Vale:</span> Complete el número de vale del talonario físico, seleccione el equipo y chofer. La fecha y hora quedan fijadas automáticamente al momento de la emisión. Al cargar en la estación, el chofer rendirá el ticket en <span className="font-bold text-white">Expendio de Combustible</span>.
            </div>
          </div>

          {/* Grid: Número de Vale, Fecha y Hora (Fijos) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 1. Número de Vale (Empieza vacío para llenar; bloqueado si es edición) */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-amber-400" />
                  Número de Vale <span className="text-amber-500">*</span>
                </span>
                {voucherToEdit ? (
                  <span className="text-[10px] text-amber-400/90 font-mono flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Fijo
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Talonario Físico</span>
                )}
              </label>
              <input
                type="text"
                required
                disabled={Boolean(voucherToEdit)}
                value={formData.numVale || ''}
                onChange={e => setFormData({ ...formData, numVale: e.target.value, numComprobante: e.target.value })}
                placeholder="Ej: 02627 o VAL-00123"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm font-mono font-bold transition focus:outline-none ${
                  voucherToEdit
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300 cursor-not-allowed'
                    : 'bg-[#0F1115] border-slate-700 text-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-slate-600'
                }`}
              />
              <p className="text-[10px] text-slate-500 mt-1">
                {voucherToEdit 
                  ? 'El número de vale no puede modificarse tras su emisión.' 
                  : 'Ingrese el número impreso del vale físico a entregar.'}
              </p>
            </div>

            {/* 2. Fecha de Emisión (Fija automática) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Fecha de Emisión
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Automática
                </span>
              </label>
              <div className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono flex items-center justify-between">
                <span>{formData.fechaEmision}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-sans">Fijo</span>
              </div>
            </div>

            {/* 3. Hora de Emisión (Fija automática) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Hora de Emisión
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Automática
                </span>
              </label>
              <div className="w-full bg-[#0F1115] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono flex items-center justify-between">
                <span>{formData.horaEmision} hs</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-sans">Fijo</span>
              </div>
            </div>
          </div>

          {/* Selector de Equipo / Vehículo (Desplegable con búsqueda rápida en vivo) */}
          <div className="bg-[#0F1115] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-400" />
                Equipo / Vehículo Destino
              </label>
              {selectedVehicleId && formData.patente && (
                <span className="text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Patente: {formData.patente}
                </span>
              )}
            </div>

            <SearchableSelect
              label="Seleccionar Equipo de la Flota:"
              placeholder="Buscar por marca, modelo o patente..."
              searchPlaceholder="Escriba marca, modelo o patente (ej: Actros, Hilux, AD 456)..."
              options={vehicleOptions}
              value={selectedVehicleId}
              onChange={handleSelectVehicle}
              required
              emptyMessage="No se encontró ningún equipo con ese texto"
            />
          </div>

          {/* Selector de Chofer / Operador (Desplegable con búsqueda rápida en vivo) */}
          <div className="bg-[#0F1115] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-400" />
                Chofer / Operador Responsable
              </label>
              {selectedEmployeeId && formData.nombreApellido && (
                <span className="text-[11px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {formData.nombreApellido}
                </span>
              )}
            </div>

            <SearchableSelect
              label="Seleccionar Operador / Chofer:"
              placeholder="Buscar chofer por nombre y apellido..."
              searchPlaceholder="Escriba el nombre o apellido del chofer..."
              options={employeeOptions}
              value={selectedEmployeeId}
              onChange={handleSelectEmployee}
              required
              emptyMessage="No se encontró ningún empleado con ese nombre"
            />
          </div>

          {/* Estación de Servicio Habilitada (Solo Estaciones de Servicio Creadas) */}
          <div className="bg-[#0F1115] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                Estación de Servicio Habilitada
              </label>
              <span className="text-[11px] text-slate-400">
                {serviceStations.length} estación{serviceStations.length === 1 ? '' : 'es'} registrada{serviceStations.length === 1 ? '' : 's'}
              </span>
            </div>

            {serviceStations.length > 0 ? (
              <SearchableSelect
                label="Seleccionar Estación de Servicio:"
                placeholder="Seleccionar estación habilitada..."
                searchPlaceholder="Buscar estación por nombre, bandera o localidad..."
                options={stationOptions}
                value={selectedDepositId}
                onChange={handleSelectDeposit}
                required
                emptyMessage="No se encontraron estaciones con ese criterio"
              />
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-2">
                <p>No se encontraron Estaciones de Servicio configuradas en <strong>Depósitos de Carga</strong>.</p>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Nombre de la Estación de Servicio:</label>
                  <input
                    type="text"
                    required
                    value={formData.estacionSurtidor || ''}
                    onChange={e => setFormData({ ...formData, estacionSurtidor: e.target.value })}
                    placeholder="Ej: Surtidor YPF Ruta 8 km 52 (Pilar)"
                    className="w-full bg-[#16191F] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Combustible, Modalidad de Carga y Litros Autorizados (Solo en Carga Parcial) */}
          <div className="bg-[#0F1115] p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  Tipo de Combustible Habilitado
                </label>
                <select
                  value={formData.tipoComb}
                  onChange={e => {
                    const item = COMMON_FUELS.find(f => f.name === e.target.value);
                    setFormData({
                      ...formData,
                      tipoComb: e.target.value,
                      idCombustible: item?.id || 'COMB-D500'
                    });
                  }}
                  className="w-full bg-[#16191F] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  {COMMON_FUELS.map(f => (
                    <option key={f.id} value={f.name}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Modalidad de Carga</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                    !formData.tipoCarga || formData.tipoCarga.includes('Tanque Lleno')
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    {!formData.tipoCarga || formData.tipoCarga.includes('Tanque Lleno') ? 'Sin límite de litros' : 'Cupo fijado'}
                  </span>
                </label>
                <select
                  value={formData.tipoCarga || 'Completa (Tanque Lleno)'}
                  onChange={e => {
                    const newTipo = e.target.value;
                    const isFull = newTipo.includes('Tanque Lleno');
                    setFormData(prev => ({
                      ...prev,
                      tipoCarga: newTipo,
                      litrosAutorizados: isFull ? undefined : (prev.litrosAutorizados || 80)
                    }));
                  }}
                  className="w-full bg-[#16191F] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Completa (Tanque Lleno)">Completa (Tanque Lleno)</option>
                  <option value="Carga Parcial">Carga Parcial (Fijar Litros)</option>
                  <option value="Bidón Auxiliar">Bidón Auxiliar</option>
                  <option value="Cisterna en Obra">Cisterna en Obra</option>
                  <option value="Carga de Emergencia">Carga de Emergencia</option>
                </select>
              </div>
            </div>

            {/* If Tanque Lleno: No se pide cantidad de combustible */}
            {(!formData.tipoCarga || formData.tipoCarga.includes('Tanque Lleno')) ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                  <Fuel className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-amber-400 block">Tanque Lleno Autorizado</span>
                  <span className="text-slate-300 text-[11px] leading-relaxed block">
                    No se solicita cantidad de litros en el vale. El chofer completará el tanque en el surtidor y el volumen real despachado se cargará automáticamente al rendir el ticket.
                  </span>
                </div>
              </div>
            ) : (
              /* If Carga Parcial: Solo aquí se solicita cantidad de combustible */
              <div className="p-3.5 bg-blue-950/20 border border-blue-800/40 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <Fuel className="w-3.5 h-3.5 text-blue-400" />
                    Cantidad de Combustible Autorizada (Litros) <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[10px] text-blue-300/80 font-mono">Requerido para Carga Parcial</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={1}
                    step="any"
                    value={formData.litrosAutorizados !== undefined && formData.litrosAutorizados !== null ? formData.litrosAutorizados : ''}
                    onChange={e => setFormData({ ...formData, litrosAutorizados: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ej: 80"
                    className="w-full bg-[#16191F] border border-blue-500/40 rounded-xl px-3.5 py-2.5 text-sm text-blue-200 font-mono font-bold focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none placeholder-slate-600"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-blue-400/70 font-mono font-bold">LTS</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Límite máximo de combustible que el playero o surtidor está autorizado a cargar para este vale.
                </p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Observaciones / Destino del Viaje / Tarea Asignada
            </label>
            <textarea
              rows={2}
              value={formData.observaciones || ''}
              onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Ej: Carga previa a traslado de batea con áridos a cantera Campana."
              className="w-full bg-[#0F1115] border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-black/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Estado inicial: <strong className="text-amber-400">EMITIDO</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-black bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-xl transition shadow-md cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>{voucherToEdit ? 'Guardar Cambios' : 'Emitir y Generar Vale'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
