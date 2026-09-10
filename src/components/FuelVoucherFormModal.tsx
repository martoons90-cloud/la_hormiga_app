import React, { useState, useEffect, useMemo } from 'react';
import { FuelDispensary, FuelVoucherStatus, Vehicle, Employee, FuelDeposit, IssuedFuelVoucher } from '../types';
import { SearchableSelect } from './SearchableSelect';
import { formatCurrency, loadFuelPrices, saveFuelPrice } from '../services/storage';
import { 
  X, 
  Fuel, 
  Truck, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Gauge, 
  Check, 
  Camera, 
  Image as ImageIcon,
  Hash,
  CheckCircle2,
  Ticket,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface FuelVoucherFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voucher: FuelDispensary) => void;
  voucherToEdit?: FuelDispensary | null;
  existingCount: number;
  existingVouchers?: FuelDispensary[];
  fleet: Vehicle[];
  employees: Employee[];
  deposits?: FuelDeposit[];
  preselectedDeposit?: FuelDeposit | null;
  issuedVouchers?: IssuedFuelVoucher[];
  initialSelectedVoucherId?: string | null;
}

const COMMON_FUELS: { name: string; id: string; price: number }[] = [
  { name: 'Diesel 500 (Grado 2)', id: 'COMB-D500', price: 1200 },
  { name: 'Infinia Diesel (Grado 3)', id: 'COMB-INF-D', price: 1350 },
  { name: 'Euro Diesel', id: 'COMB-EURO', price: 1320 },
  { name: 'Nafta Súper', id: 'COMB-SUPER', price: 1180 },
  { name: 'Nafta Premium', id: 'COMB-PREM', price: 1380 },
  { name: 'GNC / GLP', id: 'COMB-GNC', price: 650 },
  { name: 'Biodiesel', id: 'COMB-BIO', price: 1100 }
];

const COMMON_DEPOSITOS = [
  'Tanque Principal Base 1 (Cap. 25.000 L)',
  'Surtidor YPF Ruta 8 km 52 (Pilar)',
  'Cisterna Móvil Base 1 (#CM-02)',
  'Cisterna Móvil Obra Norte (#CM-01)',
  'Estación Shell Flotas Directa (Tigre)',
  'Estación Axion Card Flotas (Panamericana)',
  'Tanque Auxiliar Obrador Nordelta',
  'Surtidor Interno Taller Central'
];

const COMMON_TIPOS = [
  'Estación de Servicio',
  'Despacho Directo',
  'Cisterna en Obra',
  'Surtidor Interno',
  'Auxilio en Ruta'
];

const COMMON_CARGAS = [
  'Completa (Tanque Lleno)',
  'Carga Parcial',
  'Bidón Auxiliar',
  'Carga en Cisterna',
  'Grupo Electrógeno',
  'Carga de Emergencia'
];

export const FuelVoucherFormModal: React.FC<FuelVoucherFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  voucherToEdit,
  existingCount,
  existingVouchers = [],
  fleet,
  employees,
  deposits = [],
  preselectedDeposit = null,
  issuedVouchers = [],
  initialSelectedVoucherId = null,
}) => {
  const [formData, setFormData] = useState<Partial<FuelDispensary>>({
    id: '',
    carga: 'Completa (Tanque Lleno)',
    tipo: 'Estación de Servicio',
    idCombustible: 'COMB-D500',
    deposito: 'Surtidor YPF Ruta 8 km 52 (Pilar)',
    cantidad: 100,
    tipoComb: 'Diesel 500 (Grado 2)',
    codigoEmpleado: '',
    nombreApellido: '',
    legajo: '',
    codigoEquipo: '',
    marcaModelo: '',
    patente: '',
    numOrden: '',
    fecha: new Date().toISOString().slice(0, 10),
    kilometraje: 0,
    hora: new Date().toTimeString().slice(0, 5),
    kilometrosRec: 0,
    autonom: '',
    numEstacion: 'EST-YPF-402',
    fotoExpendio: '',
    fotoKilometraje: '',
    estado: 'RENDIDO',
    precioUnitario: 1200,
    totalImporte: 120000,
    observaciones: '',
    valeId: '',
    numVale: '',
    numTicket: '',
    litrosAutorizados: 100,
    diferenciaLitros: 0
  });

  const [selectedVoucherId, setSelectedVoucherId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDepositId, setSelectedDepositId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'datos' | 'fotos'>('datos');

  // Filter list of unrendered vouchers (or current linked voucher if editing)
  const pendingVouchers = useMemo(() => {
    return issuedVouchers.filter(v => v.estado === 'EMITIDO' || v.id === formData.valeId || (voucherToEdit && v.id === voucherToEdit.valeId));
  }, [issuedVouchers, formData.valeId, voucherToEdit]);

  // Options for SearchableSelect: Vales Emitidos Sin Rendir
  const pendingVoucherOptions = useMemo(() => {
    return pendingVouchers.map(v => {
      const brandModel = v.marcaModelo || v.codigoEquipo || 'Equipo';
      const plate = v.patente ? ` [${v.patente.trim()}]` : '';
      const label = `Vale Nº ${v.numVale} — ${brandModel}${plate}`;
      const secondaryText = `Chofer: ${v.nombreApellido || 'S/D'} • Estación: ${v.estacionSurtidor || 'S/E'} • Cupo: ${v.litrosAutorizados || 0} Lts (${v.tipoComb || 'Diesel'})`;
      const extraSearchTerms = `${v.numVale || ''} ${v.numComprobante || ''} ${v.codigoEquipo || ''} ${v.marcaModelo || ''} ${v.patente || ''} ${v.nombreApellido || ''} ${v.estacionSurtidor || ''} ${v.tipoComb || ''}`;

      return {
        value: v.id,
        label,
        secondaryText,
        extraSearchTerms
      };
    });
  }, [pendingVouchers]);

  // Options for SearchableSelect: Equipos de Flota (strictly: Marca Modelo - Patente)
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

  // Options for SearchableSelect: Choferes / Operadores (strictly: Nombre y Apellido)
  const employeeOptions = useMemo(() => {
    return employees.map(emp => {
      return {
        value: emp.id,
        label: emp.nombreApellido || `${emp.codigoEmpleado || 'Empleado'}`,
        extraSearchTerms: `${emp.codigoEmpleado || ''} ${emp.legajo || ''} ${emp.dni || ''} ${emp.categoria || ''}`
      };
    });
  }, [employees]);

  // Find previous dispensary / odometer for the selected vehicle
  const previousDispensaryInfo = useMemo(() => {
    const vehCode = formData.codigoEquipo;
    const plate = formData.patente;
    const currentVehId = selectedVehicleId;

    if (!vehCode && !plate && !currentVehId) return null;

    // Filter existing dispensaries for this vehicle, excluding the current voucher being edited
    const vehicleDispensaries = (existingVouchers || []).filter(v => {
      if (voucherToEdit && v.id === voucherToEdit.id) return false;
      const matchCode = Boolean(vehCode && v.codigoEquipo && v.codigoEquipo.trim().toUpperCase() === vehCode.trim().toUpperCase());
      const matchPlate = Boolean(plate && v.patente && v.patente.trim().toUpperCase() === plate.trim().toUpperCase());
      return matchCode || matchPlate;
    });

    // Sort by date desc, then hora desc, then id desc
    vehicleDispensaries.sort((a, b) => {
      const dateComp = (b.fecha || '').localeCompare(a.fecha || '');
      if (dateComp !== 0) return dateComp;
      const timeComp = (b.hora || '').localeCompare(a.hora || '');
      if (timeComp !== 0) return timeComp;
      return (b.id || '').localeCompare(a.id || '');
    });

    const lastDispensary = vehicleDispensaries.find(v => (v.kilometraje || 0) > 0);
    if (lastDispensary && (lastDispensary.kilometraje || 0) > 0) {
      return {
        odometer: lastDispensary.kilometraje || 0,
        fecha: lastDispensary.fecha,
        hora: lastDispensary.hora,
        litros: lastDispensary.cantidad,
        id: lastDispensary.id,
        source: 'Carga anterior registrada'
      };
    }

    // Fallback: Check if linked issued voucher has an odometroSalida
    if (formData.valeId) {
      const linkedVoucher = (issuedVouchers || []).find(iv => iv.id === formData.valeId);
      if (linkedVoucher && (linkedVoucher.odometroSalida || 0) > 0) {
        return {
          odometer: linkedVoucher.odometroSalida || 0,
          fecha: linkedVoucher.fechaEmision,
          hora: linkedVoucher.horaEmision,
          litros: linkedVoucher.litrosAutorizados,
          id: `Vale Nº ${linkedVoucher.numVale}`,
          source: 'Odómetro al emitir vale'
        };
      }
    }

    // Fallback: Vehicle's current horometro/odometer in fleet
    const matchedVeh = fleet.find(f => 
      (vehCode && f.codigoEquipo === vehCode) || 
      (plate && f.patente === plate) || 
      f.id === currentVehId
    );
    if (matchedVeh && (matchedVeh.horometro || 0) > 0) {
      return {
        odometer: matchedVeh.horometro || 0,
        fecha: undefined,
        hora: undefined,
        litros: undefined,
        id: matchedVeh.codigoEquipo,
        source: 'Odómetro inicial de flota'
      };
    }

    return null;
  }, [existingVouchers, voucherToEdit, formData.codigoEquipo, formData.patente, selectedVehicleId, formData.valeId, issuedVouchers, fleet]);

  // Automatic calculation of Distance Traveled (kmRecorridos) and Autonomy (autonom)
  const calculationResult = useMemo(() => {
    const kmAnterior = previousDispensaryInfo?.odometer || 0;
    const kmActual = Number(formData.kilometraje) || 0;
    const litros = Number(formData.cantidad) || 0;

    let kmRec = 0;
    if (kmActual > 0 && kmAnterior > 0) {
      if (kmActual >= kmAnterior) {
        kmRec = kmActual - kmAnterior;
      } else {
        kmRec = 0;
      }
    }

    let autonomia = '';
    let kmPerLiter = 0;
    let litersPer100 = 0;

    if (kmRec > 0 && litros > 0) {
      kmPerLiter = parseFloat((kmRec / litros).toFixed(2));
      litersPer100 = parseFloat(((litros / kmRec) * 100).toFixed(1));
      autonomia = `${kmPerLiter} km/L (${litersPer100} L/100km)`;
    } else if (kmActual > 0 && kmAnterior === 0) {
      autonomia = 'Primer odómetro registrado';
    } else if (kmActual === 0) {
      autonomia = 'Ingrese odómetro del ticket';
    } else {
      autonomia = '-';
    }

    return {
      kmAnterior,
      kmActual,
      kmRec,
      litros,
      kmPerLiter,
      litersPer100,
      autonomia
    };
  }, [previousDispensaryInfo, formData.kilometraje, formData.cantidad]);

  // Sync calculation result into state for consistency
  useEffect(() => {
    setFormData(prev => {
      if (prev.kilometrosRec === calculationResult.kmRec && prev.autonom === calculationResult.autonomia) {
        return prev;
      }
      return {
        ...prev,
        kilometrosRec: calculationResult.kmRec,
        autonom: calculationResult.autonomia
      };
    });
  }, [calculationResult.kmRec, calculationResult.autonomia]);

  // Handle Initial Voucher selection or Deposit Preselection
  useEffect(() => {
    if (voucherToEdit) {
      setFormData({
        ...voucherToEdit,
        carga: voucherToEdit.carga || voucherToEdit.tipoCarga || 'Completa (Tanque Lleno)',
        tipo: voucherToEdit.tipo || 'Estación de Servicio',
        idCombustible: voucherToEdit.idCombustible || 'COMB-D500',
        deposito: voucherToEdit.deposito || voucherToEdit.numEstacion || 'Surtidor YPF Ruta 8 km 52 (Pilar)',
        tipoComb: voucherToEdit.tipoComb || voucherToEdit.combustible || 'Diesel 500 (Grado 2)',
        fecha: voucherToEdit.fecha || voucherToEdit.fechaEmision || new Date().toISOString().slice(0, 10),
        hora: voucherToEdit.hora || voucherToEdit.horaEmision || new Date().toTimeString().slice(0, 5),
        kilometraje: voucherToEdit.kilometraje ?? (voucherToEdit.horometroOdometro ?? 0),
        kilometrosRec: voucherToEdit.kilometrosRec ?? 0,
        autonom: voucherToEdit.autonom || '',
        numOrden: voucherToEdit.numOrden || voucherToEdit.numComprobante || '',
        numVale: voucherToEdit.numVale || '',
        numTicket: voucherToEdit.numTicket || '',
        fotoExpendio: voucherToEdit.fotoExpendio || '',
        fotoKilometraje: voucherToEdit.fotoKilometraje || '',
        estado: voucherToEdit.estado || 'RENDIDO'
      });

      if (voucherToEdit.valeId) {
        setSelectedVoucherId(voucherToEdit.valeId);
      } else {
        setSelectedVoucherId('');
      }

      const matchedVeh = fleet.find(f => f.codigoEquipo === voucherToEdit.codigoEquipo || f.patente === voucherToEdit.patente);
      if (matchedVeh) setSelectedVehicleId(matchedVeh.id);

      const matchedEmp = employees.find(e => e.codigoEmpleado === voucherToEdit.codigoEmpleado || e.legajo === voucherToEdit.legajo || e.nombreApellido === voucherToEdit.nombreApellido);
      if (matchedEmp) setSelectedEmployeeId(matchedEmp.id);
    } else {
      const nextNum = (existingCount + 1).toString().padStart(3, '0');
      const nextOrderNum = (existingCount + 412).toString().padStart(4, '0');

      const savedPrices = loadFuelPrices();
      const defaultFuel = 'Diesel 500 (Grado 2)';
      const defaultPrice = savedPrices[defaultFuel] !== undefined ? savedPrices[defaultFuel] : 1200;

      const initialId = `EXP-${nextNum}`;
      const defaultState: Partial<FuelDispensary> = {
        id: initialId,
        carga: 'Completa (Tanque Lleno)',
        tipo: 'Estación de Servicio',
        idCombustible: 'COMB-D500',
        deposito: 'Surtidor YPF Ruta 8 km 52 (Pilar)',
        cantidad: 100,
        tipoComb: defaultFuel,
        codigoEmpleado: '',
        nombreApellido: '',
        legajo: '',
        codigoEquipo: '',
        marcaModelo: '',
        patente: '',
        numOrden: `ORD-2026-${nextOrderNum}`,
        fecha: new Date().toISOString().slice(0, 10),
        kilometraje: 0,
        hora: new Date().toTimeString().slice(0, 5),
        kilometrosRec: 0,
        autonom: '',
        numEstacion: 'EST-YPF-402',
        fotoExpendio: '',
        fotoKilometraje: '',
        estado: 'RENDIDO',
        precioUnitario: defaultPrice,
        totalImporte: 100 * defaultPrice,
        observaciones: '',
        numTicket: '',
        valeId: '',
        numVale: '',
        litrosAutorizados: undefined,
        diferenciaLitros: undefined
      };

      setFormData(defaultState);
      setSelectedVoucherId('');
      setSelectedVehicleId('');
      setSelectedEmployeeId('');

      if (initialSelectedVoucherId) {
        handleSelectIssuedVoucher(initialSelectedVoucherId);
      } else if (preselectedDeposit) {
        handleSelectDeposit(preselectedDeposit.id);
      }
    }
  }, [voucherToEdit, existingCount, isOpen, fleet, employees, initialSelectedVoucherId]);

  // Hook when picking an issued voucher (Circuito de Rendición de Vale con Ticket)
  const handleSelectIssuedVoucher = (voucherId: string) => {
    setSelectedVoucherId(voucherId);
    if (!voucherId) {
      setFormData(prev => ({
        ...prev,
        valeId: '',
        numVale: '',
        litrosAutorizados: undefined,
        diferenciaLitros: undefined,
        estado: 'RENDIDO'
      }));
      return;
    }

    const v = issuedVouchers.find(item => item.id === voucherId);
    if (!v) return;

    // Find vehicle to compute kms
    const matchedVehicle = fleet.find(f => 
      (v.codigoEquipo && f.codigoEquipo === v.codigoEquipo) || 
      (v.patente && f.patente === v.patente)
    );
    const lastKm = v.odometroSalida || matchedVehicle?.horometro || 0;
    const realLiters = v.litrosAutorizados || 100;
    const price = COMMON_FUELS.find(f => f.name === v.tipoComb)?.price || 1200;

    setFormData(prev => ({
      ...prev,
      valeId: v.id,
      numVale: v.numVale,
      numOrden: v.numVale, // Associating the voucher number to column 14
      codigoEquipo: v.codigoEquipo || matchedVehicle?.codigoEquipo || '',
      marcaModelo: v.marcaModelo || matchedVehicle?.modeloMarca || '',
      patente: v.patente || matchedVehicle?.patente || '',
      codigoEmpleado: v.codigoEmpleado || '',
      nombreApellido: v.nombreApellido || '',
      legajo: v.legajo || '',
      tipoComb: v.tipoComb || 'Diesel 500 (Grado 2)',
      idCombustible: v.idCombustible || 'COMB-D500',
      deposito: v.estacionSurtidor || prev.deposito,
      numEstacion: v.numEstacion || 'EST-YPF-402',
      carga: v.tipoCarga || 'Completa (Tanque Lleno)',
      tipo: 'Estación de Servicio',
      litrosAutorizados: v.litrosAutorizados,
      cantidad: prev.cantidad && prev.cantidad > 0 ? prev.cantidad : (v.litrosAutorizados || 100),
      diferenciaLitros: v.litrosAutorizados ? ((prev.cantidad || v.litrosAutorizados) - v.litrosAutorizados) : undefined,
      kilometraje: lastKm,
      kilometrosRec: 0,
      autonom: '',
      precioUnitario: price,
      totalImporte: realLiters * price,
      estado: 'RENDIDO', // Automatically set to RENDIDO!
      observaciones: `Rendición de ticket correspondiente al vale Nº ${v.numVale}. ${v.observaciones || ''}`
    }));

    if (matchedVehicle) {
      setSelectedVehicleId(matchedVehicle.id);
    }
    const matchedEmployee = employees.find(e => 
      (v.codigoEmpleado && e.codigoEmpleado === v.codigoEmpleado) || 
      (v.nombreApellido && e.nombreApellido === v.nombreApellido) ||
      (v.legajo && e.legajo === v.legajo)
    );
    if (matchedEmployee) {
      setSelectedEmployeeId(matchedEmployee.id);
    }
  };

  const handleClearVoucherSelection = () => {
    setSelectedVoucherId('');
    setFormData(prev => ({
      ...prev,
      valeId: '',
      numVale: '',
      litrosAutorizados: undefined,
      diferenciaLitros: undefined,
      observaciones: ''
    }));
  };

  const handleSelectDeposit = (depositId: string) => {
    if (!deposits) return;
    const dep = deposits.find(d => d.id === depositId);
    if (!dep) return;

    setSelectedDepositId(dep.id);

    let defaultTipo = 'Despacho Directo';
    let defaultCarga = formData.carga || 'Completa (Tanque Lleno)';
    let defaultNumEstacion = formData.numEstacion || 'EST-YPF-402';

    if (dep.modalidad === 'DEPOSITO_AMBULANTE') {
      defaultTipo = 'Cisterna en Obra';
      defaultNumEstacion = dep.patenteVehiculo ? `CIST-${dep.patenteVehiculo}` : 'CIST-MOVIL';
    } else if (dep.modalidad === 'BIDONES') {
      defaultTipo = 'Despacho Directo';
      defaultCarga = 'Bidón Auxiliar';
      defaultNumEstacion = dep.codigo || 'BID-BASE';
    } else if (dep.modalidad === 'VALES_ESTACION') {
      defaultTipo = 'Estación de Servicio';
      defaultNumEstacion = dep.numEstacionConvenio || 'EST-YPF-402';
    }

    setFormData(prev => ({
      ...prev,
      deposito: dep.nombre,
      idCombustible: dep.idCombustible || prev.idCombustible || 'COMB-D500',
      tipoComb: dep.tipoCombustible || prev.tipoComb || 'Diesel 500 (Grado 2)',
      tipo: defaultTipo,
      carga: defaultCarga,
      numEstacion: defaultNumEstacion,
      precioUnitario: dep.costoPorLitroEstimado || prev.precioUnitario || 1200,
      totalImporte: (dep.costoPorLitroEstimado || prev.precioUnitario || 1200) * (prev.cantidad || 100)
    }));
  };

  // Handle Equipment Selection Autocomplete
  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = fleet.find(v => v.id === vehicleId);
    if (vehicle) {
      const currentKm = vehicle.horometro || 0;
      setFormData(prev => ({
        ...prev,
        codigoEquipo: vehicle.codigoEquipo,
        marcaModelo: vehicle.modeloMarca || [vehicle.marca, vehicle.modelo].filter(Boolean).join(' ') || vehicle.codigoEquipo,
        patente: vehicle.patente || '',
        kilometraje: currentKm,
        tipoComb: vehicle.clasificacion?.includes('CAMION') ? 'Infinia Diesel (Grado 3)' : (vehicle.combustible === 'Nafta' ? 'Nafta Súper' : 'Diesel 500 (Grado 2)'),
        idCombustible: vehicle.clasificacion?.includes('CAMION') ? 'COMB-INF-D' : (vehicle.combustible === 'Nafta' ? 'COMB-SUPER' : 'COMB-D500')
      }));

      if (vehicle.id) {
        const assignedDriver = employees.find(e => e.vehiculoAsignadoId === vehicle.id);
        if (assignedDriver) {
          handleSelectEmployee(assignedDriver.id);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        codigoEquipo: '',
        marcaModelo: '',
        patente: ''
      }));
    }
  };

  // Handle Employee Selection Autocomplete
  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        codigoEmpleado: employee.codigoEmpleado,
        nombreApellido: employee.nombreApellido,
        legajo: employee.legajo
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        codigoEmpleado: '',
        nombreApellido: '',
        legajo: ''
      }));
    }
  };

  // Recalculate Totals, Liters Variance & Autonomy
  const handleQuantityOrPriceChange = (newQty: number, newPrice?: number) => {
    const qty = isNaN(newQty) ? 0 : newQty;
    const price = newPrice !== undefined ? newPrice : (formData.precioUnitario || 1200);
    const total = qty * price;
    const diff = formData.litrosAutorizados !== undefined ? qty - formData.litrosAutorizados : undefined;

    setFormData(prev => ({
      ...prev,
      cantidad: qty,
      diferenciaLitros: diff,
      precioUnitario: price,
      totalImporte: total
    }));
  };

  const handleKmActualChange = (kmActual: number) => {
    setFormData(prev => ({
      ...prev,
      kilometraje: isNaN(kmActual) ? 0 : kmActual
    }));
  };

  // Handle Fuel selection with automated ID and price
  const handleFuelChange = (fuelName: string) => {
    const found = COMMON_FUELS.find(f => f.name === fuelName);
    const idComb = found ? found.id : 'COMB-D500';
    const savedPrices = loadFuelPrices();
    const price = savedPrices[fuelName] !== undefined ? savedPrices[fuelName] : (found ? found.price : 1200);

    setFormData(prev => ({
      ...prev,
      tipoComb: fuelName,
      idCombustible: idComb,
      precioUnitario: price,
      totalImporte: (prev.cantidad || 0) * price
    }));
  };

  // Handle Photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'fotoExpendio' | 'fotoKilometraje') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id?.trim()) {
      alert('El ID de expendio es requerido.');
      return;
    }
    if (!formData.codigoEquipo?.trim() && !formData.marcaModelo?.trim()) {
      alert('Debe seleccionar el Equipo / Vehículo.');
      return;
    }
    if (!formData.cantidad || formData.cantidad <= 0) {
      alert('La cantidad de combustible debe ser mayor a 0 Litros.');
      return;
    }

    const unitPrice = Number(formData.precioUnitario) || 1200;
    const fuelType = formData.tipoComb || 'Diesel 500 (Grado 2)';

    // Save as latest price for this fuel type globally
    saveFuelPrice(fuelType, unitPrice);

    const payload: FuelDispensary = {
      id: formData.id.trim(),
      carga: formData.carga || 'Completa (Tanque Lleno)',
      tipo: formData.tipo || 'Estación de Servicio',
      idCombustible: formData.idCombustible || 'COMB-D500',
      deposito: formData.deposito || 'Surtidor YPF Ruta 8 km 52 (Pilar)',
      cantidad: Number(formData.cantidad),
      tipoComb: fuelType,
      codigoEmpleado: formData.codigoEmpleado || '',
      nombreApellido: formData.nombreApellido || '',
      legajo: formData.legajo || '',
      codigoEquipo: (formData.codigoEquipo || '').trim(),
      marcaModelo: formData.marcaModelo || '',
      patente: formData.patente || '',
      numOrden: formData.numOrden || formData.numVale || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      fecha: formData.fecha || new Date().toISOString().slice(0, 10),
      kilometraje: Number(formData.kilometraje) || 0,
      hora: formData.hora || new Date().toTimeString().slice(0, 5),
      kilometrosRec: Number(formData.kilometrosRec) || 0,
      autonom: formData.autonom || '',
      numEstacion: formData.numEstacion || 'EST-YPF-402',
      fotoExpendio: formData.fotoExpendio || '',
      fotoKilometraje: formData.fotoKilometraje || '',
      estado: (formData.estado as FuelVoucherStatus) || 'RENDIDO',
      precioUnitario: unitPrice,
      totalImporte: formData.totalImporte || (Number(formData.cantidad) * unitPrice),
      observaciones: formData.observaciones || '',
      valeId: formData.valeId,
      numVale: formData.numVale,
      numTicket: formData.numTicket,
      litrosAutorizados: formData.litrosAutorizados,
      diferenciaLitros: formData.diferenciaLitros
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  const selectedVoucherObj = issuedVouchers.find(v => v.id === selectedVoucherId);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#16191F] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-black/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {voucherToEdit ? 'Editar Registro de Expendio' : 'Carga de Ticket de Estación & Rendición de Vale'}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500 text-black font-black">
                  {formData.id}
                </span>
                {formData.numVale && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                    Vale Nº {formData.numVale} → RENDIDO
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Paso 2 del Circuito: Cargar ticket de surtidor y rendir vale emitido para ingreso de combustible y control de odómetro.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-800 bg-slate-900/40 px-6">
          <button
            type="button"
            onClick={() => setActiveTab('datos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'datos'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Datos del Ticket & Rendición (20 Columnas)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'fotos'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Fotos de Comprobantes (Ticket Surtidor & Odómetro)</span>
            {(formData.fotoExpendio || formData.fotoKilometraje) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'datos' ? (
            <div className="space-y-6">
              
              {/* VINCULACIÓN CON VALE EMITIDO SIN RENDIR (SECCIÓN DESTACADA) */}
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Ticket className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span>Llamar a Vale Emitido Sin Rendir</span>
                        {pendingVouchers.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                            {pendingVouchers.length} sin rendir
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-slate-300 block">
                        Seleccione el vale del talonario físico para autocompletar equipo, chofer, estación y litros autorizados.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {formData.numVale ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Vale Nº {formData.numVale} Vinculado
                        </span>
                        <button
                          type="button"
                          onClick={handleClearVoucherSelection}
                          className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1 transition"
                          title="Desvincular vale y cargar manualmente"
                        >
                          <RotateCcw className="w-3 h-3" /> Desvincular
                        </button>
                      </div>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-mono">
                        Carga Manual / Sin Vale
                      </span>
                    )}
                  </div>
                </div>

                {/* Desplegable interactivo con búsqueda en vivo de Vales Emitidos */}
                <div className="space-y-3">
                  <SearchableSelect
                    label="Seleccionar Vale Emitido Pendiente de Rendición:"
                    placeholder={pendingVouchers.length === 0 ? "No hay vales emitidos pendientes de rendir" : "Buscar vale por número, chofer, equipo o patente..."}
                    searchPlaceholder="Escriba el número de vale (ej: 02627), chofer, modelo o patente..."
                    options={pendingVoucherOptions}
                    value={selectedVoucherId}
                    onChange={handleSelectIssuedVoucher}
                    disabled={pendingVouchers.length === 0 && !selectedVoucherId}
                    emptyMessage="No se encontraron vales emitidos sin rendir con ese criterio"
                  />

                  {/* Detalle visual del vale seleccionado */}
                  {selectedVoucherObj && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Vale Físico:</span>
                        <strong className="text-amber-400 font-mono text-xs">Nº {selectedVoucherObj.numVale}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Equipo Destino:</span>
                        <span className="text-white font-medium truncate block">{selectedVoucherObj.marcaModelo || selectedVoucherObj.codigoEquipo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Chofer:</span>
                        <span className="text-white font-medium truncate block">{selectedVoucherObj.nombreApellido || 'S/D'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Estación / Modalidad:</span>
                        <span className="text-emerald-400 font-mono font-bold block">
                          {!selectedVoucherObj.litrosAutorizados || selectedVoucherObj.tipoCarga?.includes('Tanque Lleno')
                            ? 'Tanque Lleno'
                            : `${selectedVoucherObj.litrosAutorizados} Lts`} ({selectedVoucherObj.estacionSurtidor || 'Estación'})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Número de Ticket de la Estación (Anotado en el papel) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center gap-1">
                        <Hash className="w-3.5 h-3.5 text-amber-400" />
                        Nº de Ticket / Factura de Estación de Servicio:
                      </label>
                      <input
                        type="text"
                        value={formData.numTicket || ''}
                        onChange={(e) => setFormData({ ...formData, numTicket: e.target.value })}
                        placeholder="Ej: TK-YPF-0048-0091823 o 0001-00048912"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Estado de Rendición del Circuito:
                      </label>
                      <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          RENDIDO (Listo para registrar)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Automático</span>
                      </div>
                    </div>
                  </div>

                  {/* Banner de comparación Litros Autorizados vs Reales */}
                  {formData.litrosAutorizados !== undefined && formData.litrosAutorizados > 0 && (
                    <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Cupo Autorizado en Vale:</span>
                        <strong className="text-white font-mono">{formData.litrosAutorizados} Lts</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Litros Reales del Ticket:</span>
                        <strong className="text-amber-400 font-mono text-sm">{formData.cantidad || 0} Lts</strong>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Diferencia:</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          (formData.diferenciaLitros || 0) > 0
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : (formData.diferenciaLitros || 0) < 0
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {(formData.diferenciaLitros || 0) > 0
                            ? `+${formData.diferenciaLitros} Lts (Excedente)`
                            : (formData.diferenciaLitros || 0) < 0
                            ? `${formData.diferenciaLitros} Lts (Menor a cupo)`
                            : '0 Lts (Exacto)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 1: Modalidad, Canal y Suministro de Combustible */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  Modalidad, Canal y Suministro de Combustible
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* 2. CARGA */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Modalidad de Carga:
                    </label>
                    <select
                      value={formData.carga}
                      onChange={(e) => setFormData({ ...formData, carga: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                    >
                      {COMMON_CARGAS.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* 3. TIPO */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Canal de Despacho (Tipo):
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                    >
                      {COMMON_TIPOS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. DEPOSITO */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Estación / Depósito / Surtidor:
                    </label>
                    <input
                      type="text"
                      list="depositos-list"
                      value={formData.deposito}
                      onChange={(e) => setFormData({ ...formData, deposito: e.target.value })}
                      placeholder="Surtidor YPF Ruta 8 km 52 (Pilar)"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                    <datalist id="depositos-list">
                      {deposits && deposits.map(d => (
                        <option key={d.id} value={d.nombre} />
                      ))}
                      {COMMON_DEPOSITOS.map(d => (
                        <option key={d} value={d} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 7. TIPO_COMB */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Tipo de Combustible:
                    </label>
                    <select
                      value={formData.tipoComb}
                      onChange={(e) => handleFuelChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                    >
                      {COMMON_FUELS.map(f => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. CANTIDAD (LITROS REALES ANOTADOS EN TICKET) */}
                  <div>
                    <label className="text-[11px] font-bold text-amber-400 block mb-1 flex items-center justify-between">
                      <span>Cantidad Real (Litros del Ticket) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Surtidor</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      required
                      value={formData.cantidad || ''}
                      onChange={(e) => handleQuantityOrPriceChange(parseFloat(e.target.value))}
                      placeholder="120"
                      className="w-full px-3 py-2 bg-slate-900 border-2 border-amber-500/70 rounded-lg text-sm font-mono font-black text-amber-400 focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {/* Precio Unitario / Total */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1 flex items-center justify-between">
                      <span>Precio Unitario ($/L):</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        Total: {formatCurrency(formData.totalImporte || ((formData.cantidad || 0) * (formData.precioUnitario || 1200)))}
                      </span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.precioUnitario || ''}
                      onChange={(e) => handleQuantityOrPriceChange(formData.cantidad || 0, parseFloat(e.target.value))}
                      placeholder="1200"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Grid 2: Operador y Equipo (con Selectores Desplegables Inteligentes) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  Personal y Maquinaria Asignada
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Selector de Equipo */}
                  <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <SearchableSelect
                      label="Seleccionar Equipo de Flota (Marca Modelo - Patente):"
                      placeholder="Buscar por marca, modelo o patente..."
                      searchPlaceholder="Escriba marca, modelo o patente..."
                      options={vehicleOptions}
                      value={selectedVehicleId}
                      onChange={handleSelectVehicle}
                      emptyMessage="No se encontró el equipo"
                    />
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="block text-[10px] text-slate-500">Cód. Equipo:</span>
                        <span className="font-mono text-amber-400 font-bold">{formData.codigoEquipo || 'S/D'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Marca/Modelo:</span>
                        <span className="text-white truncate block">{formData.marcaModelo || 'S/D'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Patente:</span>
                        <span className="font-mono text-white font-bold">{formData.patente || 'S/D'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selector de Chofer */}
                  <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <SearchableSelect
                      label="Seleccionar Chofer / Operador (Nombre y Apellido):"
                      placeholder="Buscar chofer por nombre y apellido..."
                      searchPlaceholder="Escriba el nombre o apellido del chofer..."
                      options={employeeOptions}
                      value={selectedEmployeeId}
                      onChange={handleSelectEmployee}
                      emptyMessage="No se encontró el empleado"
                    />
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                      <div>
                        <span className="block text-[10px] text-slate-500">Cód. Empleado:</span>
                        <span className="font-mono text-blue-400 font-bold">{formData.codigoEmpleado || 'S/D'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Nombre y Apellido:</span>
                        <span className="text-white truncate block">{formData.nombreApellido || 'S/D'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500">Legajo:</span>
                        <span className="font-mono text-white">{formData.legajo || 'S/D'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 3: Datos de Operación, Odómetro y Rendimiento Automático */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    Odómetro Real del Ticket y Rendimiento Automático
                  </span>
                  <span className="text-[10px] text-emerald-400 font-normal bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Cálculo Automático
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 14. Nº DE ORDEN */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Nº de Orden / Vale:
                    </label>
                    <input
                      type="text"
                      value={formData.numOrden}
                      onChange={(e) => setFormData({ ...formData, numOrden: e.target.value })}
                      placeholder="VAL-2026-000851"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* 15. FECHA */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Fecha de Carga:
                    </label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* 17. HORA */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Hora:
                    </label>
                    <input
                      type="time"
                      value={formData.hora}
                      onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* 20. NUM_ESTACION */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">
                      Nº Estación / Convenio:
                    </label>
                    <input
                      type="text"
                      value={formData.numEstacion}
                      onChange={(e) => setFormData({ ...formData, numEstacion: e.target.value })}
                      placeholder="EST-YPF-402"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Panel de Telemetría: Odómetro y Rendimiento Automático */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Odómetro Actual (Input Editable del Ticket) */}
                    <div className="md:col-span-4">
                      <label className="text-xs font-bold text-emerald-400 block mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                          Odómetro Actual (Ticket) *
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Del surtidor</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          required
                          value={formData.kilometraje || ''}
                          onChange={(e) => handleKmActualChange(parseFloat(e.target.value) || 0)}
                          placeholder="Ej: 145200"
                          className="w-full px-3.5 py-2.5 bg-black/60 border-2 border-emerald-500/70 rounded-xl text-base font-mono font-black text-white focus:border-emerald-400 focus:outline-none pr-12"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-emerald-400 pointer-events-none">
                          km
                        </span>
                      </div>
                    </div>

                    {/* Resultados Calculados Automáticos (No editables) */}
                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {/* Carga Anterior / Odómetro Previo */}
                      <div className="bg-black/40 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Carga Anterior
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            Base
                          </span>
                        </div>
                        <div className="text-sm font-bold font-mono text-slate-200 truncate">
                          {calculationResult.kmAnterior > 0 
                            ? `${calculationResult.kmAnterior.toLocaleString('es-AR')} km` 
                            : 'Sin registro'}
                        </div>
                        <span className="text-[10px] text-slate-500 truncate mt-1">
                          {previousDispensaryInfo?.source || 'Sin odómetro previo'}
                        </span>
                      </div>

                      {/* Kilómetros Recorridos (Diferencia Automática) */}
                      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                            Km Recorridos
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                            Automático
                          </span>
                        </div>
                        <div className="text-base font-black font-mono text-emerald-400">
                          {calculationResult.kmRec > 0 
                            ? `+${calculationResult.kmRec.toLocaleString('es-AR')} km` 
                            : '0 km'}
                        </div>
                        <span className="text-[10px] text-emerald-500/80 truncate mt-1">
                          Diferencia odómetros
                        </span>
                      </div>

                      {/* Autonomía Calculada (Automática) */}
                      <div className="bg-cyan-950/20 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                            Autonomía
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                            Automático
                          </span>
                        </div>
                        <div className="text-xs font-bold font-mono text-cyan-300 truncate">
                          {calculationResult.autonomia}
                        </div>
                        <span className="text-[10px] text-cyan-500/80 truncate mt-1">
                          {calculationResult.kmPerLiter > 0 ? `${calculationResult.kmPerLiter} km por Litro` : 'Recorrido / Litros'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning si odómetro es menor al previo */}
                  {calculationResult.kmAnterior > 0 && calculationResult.kmActual > 0 && calculationResult.kmActual < calculationResult.kmAnterior && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <span className="font-bold">Aviso:</span> El odómetro ingresado ({calculationResult.kmActual.toLocaleString('es-AR')} km) es menor al odómetro de la carga anterior ({calculationResult.kmAnterior.toLocaleString('es-AR')} km). Verifique el número en el ticket.
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <span>
                      Los kilómetros recorridos y la autonomía se calculan automáticamente restando la carga anterior y dividiendo por los litros del ticket (no editables).
                    </span>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Observaciones Generales de la Carga:
                </label>
                <textarea
                  rows={2}
                  value={formData.observaciones || ''}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Detalles sobre el viaje, ruta o rendición..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

            </div>
          ) : (
            /* TAB: Photographic Proofs (Column 21 & 22) */
            <div className="space-y-6">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4" />
                  Evidencia Fotográfica de Suministro (Columnas 21 y 22)
                </h4>
                <p className="text-xs text-slate-400">
                  Adjunte la foto del ticket impreso de surtidor y la foto del odómetro para respaldo auditor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 21. FOTO_EXPENDIO */}
                <div className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono font-bold">
                        21
                      </span>
                      21. FOTO_EXPENDIO (Ticket de Estación)
                    </label>
                    {formData.fotoExpendio && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Adjunta
                      </span>
                    )}
                  </div>

                  {formData.fotoExpendio ? (
                    <div className="relative rounded-lg overflow-hidden border border-amber-500/40 group aspect-video bg-black/40">
                      <img
                        src={formData.fotoExpendio}
                        alt="Foto Ticket"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fotoExpendio: '' })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Quitar Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl p-6 text-center space-y-3 bg-slate-950/40">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-500" />
                      <div className="text-xs text-slate-400">
                        <label className="text-amber-400 font-bold hover:underline cursor-pointer">
                          <span>Subir foto ticket</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'fotoExpendio')}
                            className="hidden"
                          />
                        </label>{' '}
                        o pegar enlace web abajo
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                      URL directa de la foto del ticket:
                    </label>
                    <input
                      type="url"
                      value={formData.fotoExpendio}
                      onChange={(e) => setFormData({ ...formData, fotoExpendio: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* 22. FOTO_KILOMETRAJE */}
                <div className="space-y-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-mono font-bold">
                        22
                      </span>
                      22. FOTO_KILOMETRAJE (Tablero / Odómetro)
                    </label>
                    {formData.fotoKilometraje && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Adjunta
                      </span>
                    )}
                  </div>

                  {formData.fotoKilometraje ? (
                    <div className="relative rounded-lg overflow-hidden border border-cyan-500/40 group aspect-video bg-black/40">
                      <img
                        src={formData.fotoKilometraje}
                        alt="Foto Kilometraje"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, fotoKilometraje: '' })}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Quitar Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-6 text-center space-y-3 bg-slate-950/40">
                      <Gauge className="w-8 h-8 mx-auto text-slate-500" />
                      <div className="text-xs text-slate-400">
                        <label className="text-cyan-400 font-bold hover:underline cursor-pointer">
                          <span>Subir foto odómetro</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'fotoKilometraje')}
                            className="hidden"
                          />
                        </label>{' '}
                        o pegar enlace web abajo
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-mono block mb-1">
                      URL directa de la foto del odómetro:
                    </label>
                    <input
                      type="url"
                      value={formData.fotoKilometraje}
                      onChange={(e) => setFormData({ ...formData, fotoKilometraje: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span className="font-bold text-amber-400">{formData.cantidad || 0} Lts reales</span> de{' '}
              <span className="text-white">{formData.tipoComb}</span> | Total:{' '}
              <strong className="text-white font-mono">
                ${((formData.cantidad || 0) * (formData.precioUnitario || 1200)).toLocaleString('es-AR')}
              </strong>
              {formData.numVale && (
                <span className="ml-2 text-emerald-400 font-bold">• Vale Nº {formData.numVale} pasará a RENDIDO</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-2 shadow-lg transition cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{voucherToEdit ? 'Guardar Cambios' : (formData.numVale ? 'Registrar Ticket y Rendir Vale' : 'Registrar Expendio')}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
