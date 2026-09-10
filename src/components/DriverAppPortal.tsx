import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Send, 
  ChevronRight, 
  ArrowLeft, 
  AlertTriangle, 
  Sparkles, 
  Layers, 
  History, 
  Plus, 
  Compass, 
  Check, 
  Fuel, 
  Info,
  ShieldCheck,
  Camera,
  CheckCheck,
  Wrench,
  Gauge,
  Droplet,
  Eye,
  ClipboardCheck,
  RotateCcw
} from 'lucide-react';
import { ParteDiario, Vehicle, Employee, Obra, ParteTipoTrabajo, DailyVehicleChecklist } from '../types';
import { Logo } from './Logo';
import { VehicleStartChecklistModal } from './VehicleStartChecklistModal';

interface DriverAppPortalProps {
  fleet: Vehicle[];
  drivers: Employee[];
  obras: Obra[];
  partesDiarios: ParteDiario[];
  onSaveParteDiario: (parte: ParteDiario) => void;
  onExitToAdmin: () => void;
  showToast: (msg: string) => void;
}

export const DriverAppPortal: React.FC<DriverAppPortalProps> = ({
  fleet,
  drivers,
  obras,
  partesDiarios,
  onSaveParteDiario,
  onExitToAdmin,
  showToast
}) => {
  // Saved / active driver state (remember in localStorage for ease of use)
  const [selectedDriverId, setSelectedDriverId] = useState<string>(() => {
    return localStorage.getItem('driver_app_selected_id') || (drivers[0]?.id || '');
  });

  const activeDriver = drivers.find(d => d.id === selectedDriverId) || drivers[0];

  // Active view tab in mobile portal: 'checklist' | 'nuevo-parte' | 'mis-partes' | 'mi-perfil'
  const [activeTab, setActiveTab] = useState<'checklist' | 'nuevo-parte' | 'mis-partes' | 'mi-perfil'>('checklist');

  // Form states for creating a new Parte Diario
  const [step, setStep] = useState<number>(1); // Step 1: Máquina y Obra, Step 2: Horarios y Tipo, Step 3: Novedades y Confirmación
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedObraId, setSelectedObraId] = useState<string>('');
  const [servMant, setServMant] = useState<string>('ALQUILER');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tipoTrabajo, setTipoTrabajo] = useState<ParteTipoTrabajo>('HORAS');
  const [detalleTipo, setDetalleTipo] = useState<string>('TRABAJOS GENERALES');
  
  // Hours
  const [horaInicioMañana, setHoraInicioMañana] = useState<string>('08:00');
  const [horaFinMañana, setHoraFinMañana] = useState<string>('12:00');
  const [horaInicioTarde, setHoraInicioTarde] = useState<string>('13:00');
  const [horaFinTarde, setHoraFinTarde] = useState<string>('17:00');
  
  // Metrics
  const [odomKilom, setOdomKilom] = useState<string>('');
  const [viajesCantidad, setViajesCantidad] = useState<string>('0');
  const [tipoMaterial, setTipoMaterial] = useState<string>('');
  const [extraccionEntregas, setExtraccionEntregas] = useState<string>('');
  const [novedades, setNovedades] = useState<string>('');
  const [encargadoObra, setEncargadoObra] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [lastSubmittedParte, setLastSubmittedParte] = useState<ParteDiario | null>(null);

  // Pre-operational Daily Checklist Modal state
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState<boolean>(false);
  const [currentChecklist, setCurrentChecklist] = useState<DailyVehicleChecklist | null>(null);

  // Auto-fill assigned vehicle when driver changes
  useEffect(() => {
    if (activeDriver) {
      localStorage.setItem('driver_app_selected_id', activeDriver.id);
      if (activeDriver.vehiculoAsignadoId) {
        setSelectedVehicleId(activeDriver.vehiculoAsignadoId);
      } else if (fleet.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(fleet[0].id);
      }
      if (obras.length > 0 && !selectedObraId) {
        const foundObra = obras.find(o => o.nombreObra.toLowerCase() === activeDriver.obra?.toLowerCase());
        setSelectedObraId(foundObra ? foundObra.id : obras[0].id);
      }
    }
  }, [activeDriver, fleet, obras]);

  const selectedVehicle = fleet.find(v => v.id === selectedVehicleId) || fleet[0];
  const selectedObra = obras.find(o => o.id === selectedObraId) || obras[0];

  // Pre-fill horometro / kilometraje when vehicle is chosen
  useEffect(() => {
    if (selectedVehicle?.horometro) {
      setOdomKilom(String(selectedVehicle.horometro));
    }
  }, [selectedVehicleId]);

  // Calculations
  const calculateHours = (): number => {
    const parse = (t: string) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    let mins = 0;
    const im = parse(horaInicioMañana);
    const fm = parse(horaFinMañana);
    if (fm > im) mins += (fm - im);

    const it = parse(horaInicioTarde);
    const ft = parse(horaFinTarde);
    if (ft > it) mins += (ft - it);

    return Number((mins / 60).toFixed(2)) || 8.0;
  };

  const calculatedHours = calculateHours();

  // Filter partes submitted by this driver
  const myPartes = partesDiarios.filter(p => {
    if (!activeDriver) return false;
    return (
      p.codigoEmpleado === activeDriver.codigoEmpleado ||
      p.codigoEmpleado === activeDriver.legajo ||
      p.nombreApellido?.toLowerCase() === activeDriver.nombreApellido?.toLowerCase() ||
      p.driverName?.toLowerCase() === activeDriver.nombreApellido?.toLowerCase()
    );
  });

  const handleSendParte = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeDriver) {
      showToast('Por favor selecciona tu nombre de chofer.');
      return;
    }

    const numParteGen = String(Math.floor(2000 + Math.random() * 8000));
    const newParte: ParteDiario = {
      id: Math.random().toString(16).substring(2, 10),
      numParte: numParteGen,
      servMant: servMant || 'ALQUILER',
      obra: selectedObra?.nombreObra || 'Obra General',
      codigoObra: selectedObra?.numero || 'OBRA-01',
      codigoEquipo: selectedVehicle?.codigoInterno || selectedVehicle?.id || 'EQ-01',
      marcaModelo: selectedVehicle ? `${selectedVehicle.modeloMarca} (${selectedVehicle.patente})` : 'Equipo Flota',
      codigoEmpleado: activeDriver.codigoEmpleado || activeDriver.legajo || 'CHOFER',
      nombreApellido: activeDriver.nombreApellido,
      fecha: fecha || new Date().toISOString().split('T')[0],
      horaInicioMañana,
      horaFinMañana,
      horaInicioTarde,
      horaFinTarde,
      horasTrabajadas: calculatedHours,
      odomKilom: Number(odomKilom) || (currentChecklist?.odometroInicial ? currentChecklist.odometroInicial : 0),
      odometroInicial: currentChecklist?.odometroInicial || undefined,
      tipo: tipoTrabajo,
      detalleTipo: detalleTipo || 'TRABAJOS GENERALES',
      viajesCantidad: tipoTrabajo === 'VIAJES' ? Number(viajesCantidad) || 0 : 0,
      extraccionEntregas: extraccionEntregas || '',
      tipoMaterial: tipoMaterial || '',
      hsCantidad: calculatedHours,
      novedades: novedades.trim() || 'Sin novedades',
      ubicacion: selectedObra?.ubicacion || 'En obra',
      encargadoObra: encargadoObra || 'Encargado de Turno',
      firma: 'Firmado Digital',
      autorizado: 'NO CONTROLADO',
      estado: 'COMPLETADO',
      checklist: currentChecklist || undefined,
      vehicleId: selectedVehicle?.id,
      vehicleName: selectedVehicle?.modeloMarca,
      driverName: activeDriver.nombreApellido
    };

    onSaveParteDiario(newParte);
    setLastSubmittedParte(newParte);
    setIsSuccessModalOpen(true);
    showToast(`Parte Nº ${newParte.numParte} enviado correctamente`);

    // Reset some form values
    setNovedades('');
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-[#0C0E12] text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500 selection:text-black">
      
      {/* Top Header - Driver Identity & Mode Switch */}
      <header className="sticky top-0 z-30 bg-[#16191F]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" showTagline={false} compact={true} />
            <div className="h-6 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block leading-tight">
                PORTAL CHOFER
              </span>
              <span className="text-xs font-bold text-white truncate max-w-[140px] block leading-tight">
                {activeDriver?.nombreApellido || 'Chofer'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Driver selector dropdown */}
            <select
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              aria-label="Seleccionar chofer"
              className="bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-amber-400 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer max-w-[130px]"
            >
              {drivers.map(d => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.nombreApellido}
                </option>
              ))}
            </select>

            {/* Back to Admin button */}
            <button
              onClick={onExitToAdmin}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition cursor-pointer"
              title="Volver al Panel Administrador"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 pb-24">
        
        {/* TAB 0: VERIFICACIÓN / CHECKLIST PRE-OPERACIONAL */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Header Card */}
            <div className="bg-linear-to-r from-amber-500/15 via-slate-900 to-[#16191F] border border-amber-500/40 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black shadow-lg">
                    <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      INSPECCIÓN OBLIGATORIA
                    </span>
                    <h2 className="text-base font-black text-white leading-tight">
                      Verificación del Equipo
                    </h2>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                  currentChecklist?.completado
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                }`}>
                  {currentChecklist?.completado ? 'VERIFICADO ✓' : 'PENDIENTE'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                Control pre-operacional de seguridad: 6 fotos de inspección, chequeo de fluidos y registro de horómetro antes de iniciar la jornada.
              </p>
            </div>

            {/* Selected Machine Selector Only */}
            <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Equipo a Verificar</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {selectedVehicle?.clasificacion || 'MÁQUINA'}
                </span>
              </div>

              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 font-bold"
              >
                {fleet.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} - {v.modeloMarca} ({v.patente})
                  </option>
                ))}
              </select>
            </div>

            {/* Verification Status Overview Card */}
            {currentChecklist?.completado ? (
              <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-2xl p-4 space-y-3.5 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-xs font-black text-white">Inspección Lista y Habilitada</h3>
                      <p className="text-[10px] text-slate-400">
                        Horómetro Inicial: <strong className="text-emerald-300 font-mono">{currentChecklist.odometroInicial}</strong>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChecklistModalOpen(true)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-lg transition"
                  >
                    Editar / Repetir
                  </button>
                </div>

                {/* Status Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">📸 6 Fotos:</span>
                    <span className="text-emerald-400 font-bold">Completas</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">🛢️ Fluidos:</span>
                    <span className="text-emerald-400 font-bold">Verificados</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">🚜 Orugas/Ruedas:</span>
                    <span className="text-emerald-400 font-bold">OK</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">⏱️ Odómetro:</span>
                    <span className="text-amber-300 font-mono font-bold">{currentChecklist.odometroInicial}</span>
                  </div>
                </div>

                {/* 6 Photos Preview Mini-Grid */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Fotos de la Inspección de Hoy:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Frente', url: currentChecklist.fotoFrente },
                      { label: 'Atrás', url: currentChecklist.fotoAtras },
                      { label: 'Lat. Izq.', url: currentChecklist.fotoLateralIzquierdo },
                      { label: 'Lat. Der.', url: currentChecklist.fotoLateralDerecho },
                      { label: 'Cabina', url: currentChecklist.fotoCabinaInterior },
                      { label: 'Odómetro', url: currentChecklist.fotoTableroOdometro },
                    ].map((slot, idx) => (
                      <div key={idx} className="aspect-4/3 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative group">
                        {slot.url ? (
                          <img src={slot.url} alt={slot.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">
                            Sin foto
                          </div>
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[9px] font-bold text-white text-center py-0.5 truncate">
                          {slot.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('nuevo-parte');
                    setStep(1);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                >
                  <span>IR A CARGAR PARTE DIARIO</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ) : (
              /* Pending verification banner */
              <div className="bg-[#16191F] border-2 border-dashed border-amber-500/50 rounded-2xl p-5 text-center space-y-3.5 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Inspección Pre-Operacional Pendiente
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Toma las 6 fotos del equipo, revisa los niveles de aceite y refrigerante y anota el horómetro inicial.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsChecklistModalOpen(true)}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>INICIAR VERIFICACIÓN AHORA</span>
                </button>
              </div>
            )}

            {/* Checklist Guide / Safety Tips */}
            <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs text-slate-400">
              <h4 className="font-bold text-slate-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>¿Por qué es obligatoria la verificación?</span>
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-400 leading-relaxed">
                <li>Garantiza la seguridad del operador y del personal en obra.</li>
                <li>Registra el estado estético inicial para prevenir reclamos de daños preexistentes.</li>
                <li>Verifica los niveles críticos de fluidos para evitar roturas costosas de motor e hidráulicos.</li>
                <li>Registra el horómetro exacto para el control de horas de alquiler y mantenimiento preventivo.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 1: NUEVO PARTE DIARIO */}
        {activeTab === 'nuevo-parte' && (
          <div className="space-y-4">
            
            {/* Greeting & Quick Summary Card */}
            <div className="bg-linear-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-black text-white flex items-center gap-1.5">
                    <span>Cargar Parte de Trabajo</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Registra tu jornada de hoy ({fecha}) en 3 pasos rápidos.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center text-sm shadow-md">
                  {activeDriver?.legajo || 'CH'}
                </div>
              </div>

              {/* Step indicator */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`flex items-center gap-1.5 font-bold transition cursor-pointer ${
                    step === 1 ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 1 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}>1</span>
                  <span>Equipo</span>
                </button>

                <div className={`h-0.5 flex-1 mx-2 ${step >= 2 ? 'bg-amber-500/60' : 'bg-slate-800'}`} />

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`flex items-center gap-1.5 font-bold transition cursor-pointer ${
                    step === 2 ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 2 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}>2</span>
                  <span>Horarios</span>
                </button>

                <div className={`h-0.5 flex-1 mx-2 ${step >= 3 ? 'bg-amber-500/60' : 'bg-slate-800'}`} />

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`flex items-center gap-1.5 font-bold transition cursor-pointer ${
                    step === 3 ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    step === 3 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}>3</span>
                  <span>Enviar</span>
                </button>
              </div>
            </div>

            {/* Step Form */}
            <form onSubmit={handleSendParte} className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 shadow-md space-y-4">
              
              {/* STEP 1: EQUIPO, OBRA Y FECHA */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      Paso 1: Asignación y Obra
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">1 de 3</span>
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Fecha de Trabajo
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      required
                      className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {/* Vehículo / Máquina */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Vehículo o Máquina Utilizada *
                    </label>
                    <select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      required
                      className="w-full bg-[#0F1115] border border-slate-700 text-amber-300 font-semibold rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {fleet.map(v => (
                        <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                          {v.id} - {v.modeloMarca} ({v.patente})
                        </option>
                      ))}
                    </select>
                    {selectedVehicle && (
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Clasificación: <strong className="text-white">{selectedVehicle.clasificacion}</strong> | Estado: {selectedVehicle.estado}</span>
                      </p>
                    )}
                  </div>

                  {/* Obra de Destino */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Obra / Frente de Trabajo *
                    </label>
                    <select
                      value={selectedObraId}
                      onChange={(e) => setSelectedObraId(e.target.value)}
                      required
                      className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      {obras.map(o => (
                        <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                          {o.nombreObra} ({o.ubicacion})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Modalidad de Servicio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Modalidad de Servicio
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['ALQUILER', 'MANTENIMIENTO', 'PROPIA', 'AUXILIO'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setServMant(m)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            servMant === m
                              ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CHECKLIST PRE-OPERACIONAL OBLIGATORIO (FOTOS 4 LADOS + CABINA + FLUIDOS + HOROMETRO) */}
                  <div className={`rounded-2xl p-3.5 border transition space-y-2.5 ${
                    currentChecklist?.completado
                      ? 'bg-emerald-950/20 border-emerald-500/50'
                      : 'bg-amber-500/10 border-amber-500/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                          currentChecklist?.completado
                            ? 'bg-emerald-500 text-black'
                            : 'bg-amber-500 text-black'
                        }`}>
                          {currentChecklist?.completado ? <ShieldCheck className="w-5 h-5" /> : <Camera className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-white">
                            {currentChecklist?.completado ? 'Checklist Inicial Completado' : 'Checklist Pre-Operacional'}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {currentChecklist?.completado
                              ? `Horómetro inicial: ${currentChecklist.odometroInicial} | Fotos OK`
                              : 'Obligatorio al arrancar: Fotos 4 lados + cabina, fluidos y odómetro'}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        currentChecklist?.completado
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {currentChecklist?.completado ? 'COMPLETO ✓' : 'PENDIENTE'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsChecklistModalOpen(true)}
                      className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                        currentChecklist?.completado
                          ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500 hover:bg-amber-400 text-black'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{currentChecklist?.completado ? 'Ver / Modificar Checklist y Fotos' : 'REALIZAR CHECKLIST INICIAL AHORA'}</span>
                    </button>
                  </div>

                  {/* Siguiente Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentChecklist?.completado) {
                        setIsChecklistModalOpen(true);
                        showToast('Debes realizar el checklist inicial y fotos antes de continuar.');
                        return;
                      }
                      setStep(2);
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer mt-4"
                  >
                    <span>Continuar a Horarios y Tareas</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: HORARIOS Y TIPO DE TRABAJO */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Paso 2: Registro de Horas y Metraje
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">2 de 3</span>
                  </div>

                  {/* Tipo de Trabajo: Horas vs Viajes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tipo de Medición
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoTrabajo('HORAS')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          tipoTrabajo === 'HORAS'
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        Por Horas Trabajadas
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoTrabajo('VIAJES')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          tipoTrabajo === 'VIAJES'
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-slate-900 text-slate-300 border-slate-800'
                        }`}
                      >
                        Por Cantidad de Viajes
                      </button>
                    </div>
                  </div>

                  {/* Horarios Mañana y Tarde */}
                  <div className="bg-[#0F1115] border border-slate-800/80 rounded-xl p-3 space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                      Turno Mañana
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Inicio Mañana</label>
                        <input
                          type="time"
                          value={horaInicioMañana}
                          onChange={(e) => setHoraInicioMañana(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Fin Mañana</label>
                        <input
                          type="time"
                          value={horaFinMañana}
                          onChange={(e) => setHoraFinMañana(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider pt-2 border-t border-slate-800">
                      Turno Tarde
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Inicio Tarde</label>
                        <input
                          type="time"
                          value={horaInicioTarde}
                          onChange={(e) => setHoraInicioTarde(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Fin Tarde</label>
                        <input
                          type="time"
                          value={horaFinTarde}
                          onChange={(e) => setHoraFinTarde(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-300">Horas Totales Calculadas:</span>
                      <span className="text-sm font-black text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        {calculatedHours} hs
                      </span>
                    </div>
                  </div>

                  {/* Si es por viajes */}
                  {tipoTrabajo === 'VIAJES' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Cantidad de Viajes</label>
                        <input
                          type="number"
                          value={viajesCantidad}
                          onChange={(e) => setViajesCantidad(e.target.value)}
                          placeholder="Ej: 5"
                          className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de Material</label>
                        <input
                          type="text"
                          value={tipoMaterial}
                          onChange={(e) => setTipoMaterial(e.target.value)}
                          placeholder="Tierra, Tosca, Escombro..."
                          className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Horómetro / Odómetro Actual */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Horómetro o Kilometraje Final del Equipo
                    </label>
                    <input
                      type="number"
                      value={odomKilom}
                      onChange={(e) => setOdomKilom(e.target.value)}
                      placeholder="Ej: 14500"
                      className="w-full bg-[#0F1115] border border-slate-700 text-amber-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>

                  {/* Botones de Navegación */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-2/3 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                    >
                      <span>Revisar y Enviar</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DETALLE, NOVEDADES Y ENVÍO */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Send className="w-4 h-4" />
                      Paso 3: Novedades y Confirmación
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">3 de 3</span>
                  </div>

                  {/* Detalle de Trabajo Realizado */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Tarea o Detalle del Trabajo
                    </label>
                    <input
                      type="text"
                      value={detalleTipo}
                      onChange={(e) => setDetalleTipo(e.target.value)}
                      placeholder="Ej: Movimiento de suelos, Zanjeo, Desmonte..."
                      className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Novedades mecánicas o de obra */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Novedades / Falla Mecánica / Observaciones</span>
                      <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
                    </label>
                    <textarea
                      rows={3}
                      value={novedades}
                      onChange={(e) => setNovedades(e.target.value)}
                      placeholder="Ej: Se detectó pérdida leve en manguera hidráulica, o 'Sin novedades'..."
                      className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Encargado de Obra */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Encargado o Supervisor en Obra
                    </label>
                    <input
                      type="text"
                      value={encargadoObra}
                      onChange={(e) => setEncargadoObra(e.target.value)}
                      placeholder="Nombre del encargado que supervisa"
                      className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Resumen Final antes de Guardar */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1.5 text-xs">
                    <div className="text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                      <Check className="w-4 h-4 text-amber-400" />
                      <span>Resumen del Parte Diario</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Chofer:</span>
                      <strong className="text-white">{activeDriver?.nombreApellido}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Equipo:</span>
                      <strong className="text-white">{selectedVehicle?.id} - {selectedVehicle?.modeloMarca}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Obra:</span>
                      <strong className="text-white">{selectedObra?.nombreObra}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Total Horas:</span>
                      <strong className="text-amber-400 font-mono font-black">{calculatedHours} hs</strong>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>ENVIAR PARTE DIARIO</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        )}

        {/* TAB 2: MIS PARTES DIARIOS */}
        {activeTab === 'mis-partes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-black text-white">Mis Partes Cargados</h1>
                <p className="text-xs text-slate-400">Historial de registros de {activeDriver?.nombreApellido}</p>
              </div>
              <button
                onClick={() => setActiveTab('nuevo-parte')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>

            {myPartes.length === 0 ? (
              <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">Aún no tienes partes registrados</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Carga tu primer parte del día tocando en el botón de abajo.
                </p>
                <button
                  onClick={() => setActiveTab('nuevo-parte')}
                  className="px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Cargar Parte Diario Ahora
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {myPartes.map(p => (
                  <div key={p.id} className="bg-[#16191F] border border-slate-800 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Parte #{p.numParte}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{p.fecha}</span>
                    </div>

                    <div className="text-xs text-slate-200">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.codigoEquipo} - {p.marcaModelo}</span>
                      </p>
                      <p className="text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.obra}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">
                          {p.tipo === 'HORAS' ? `${p.horasTrabajadas} Horas` : `${p.viajesCantidad} Viajes`}
                        </span>
                        {p.checklist?.completado && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Checklist OK</span>
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {p.autorizado || 'GUARDADO'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MI PERFIL Y EQUIPO ASIGNADO */}
        {activeTab === 'mi-perfil' && (
          <div className="space-y-4">
            <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-5 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-500 text-black font-black text-2xl flex items-center justify-center mx-auto shadow-lg">
                {activeDriver?.nombreApellido.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-black text-white">{activeDriver?.nombreApellido}</h2>
                <p className="text-xs text-amber-400 font-mono mt-0.5">Legajo: {activeDriver?.legajo || 'S/N'}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-left">
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Categoría:</span>
                  <span className="text-white font-medium">{activeDriver?.categoria || 'Operador'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Obra Actual:</span>
                  <span className="text-white font-medium">{activeDriver?.obra || 'Sin asignar'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Máquina Asignada:</span>
                  <span className="text-amber-300 font-medium">{activeDriver?.vehiculoAsignadoId || 'A elección'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Total Partes Enviados:</span>
                  <span className="text-white font-bold font-mono">{myPartes.length}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onExitToAdmin}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la vista del Administrador</span>
            </button>
          </div>
        )}

      </main>

      {/* Success Modal Confirmation */}
      {isSuccessModalOpen && lastSubmittedParte && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#16191F] border border-amber-500/40 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">¡Parte Guardado con Éxito!</h3>
              <p className="text-xs text-slate-400 mt-1">
                El parte diario <strong className="text-amber-400">Nº {lastSubmittedParte.numParte}</strong> fue registrado y sincronizado en la base de datos.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-left space-y-1">
              <div className="text-slate-300">
                <span className="text-slate-500">Equipo: </span>
                <span className="font-bold text-white">{lastSubmittedParte.codigoEquipo}</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Horas: </span>
                <span className="font-bold text-amber-400">{lastSubmittedParte.horasTrabajadas} hs</span>
              </div>
              <div className="text-slate-300">
                <span className="text-slate-500">Obra: </span>
                <span className="font-bold text-white">{lastSubmittedParte.obra}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setActiveTab('mis-partes');
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl transition cursor-pointer"
              >
                Ver Mis Partes
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setActiveTab('nuevo-parte');
                  setStep(1);
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition cursor-pointer"
              >
                Cargar Otro Parte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Navigation Bar (Mobile App Style) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121418]/95 backdrop-blur-md border-t border-slate-800 px-3 py-2">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
          
          {/* Tab 1: Verificación / Checklist */}
          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition cursor-pointer relative ${
              activeTab === 'checklist'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl relative ${
              activeTab === 'checklist' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : ''
            }`}>
              <ShieldCheck className="w-5 h-5" />
              {!currentChecklist?.completado && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </div>
            <span className="text-[10px] font-bold truncate">Verificación</span>
          </button>

          {/* Tab 2: Nuevo Parte */}
          <button
            onClick={() => {
              setActiveTab('nuevo-parte');
              setStep(1);
            }}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'nuevo-parte'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'nuevo-parte' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : ''}`}>
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold truncate">Nuevo Parte</span>
          </button>

          {/* Tab 3: Mis Partes */}
          <button
            onClick={() => setActiveTab('mis-partes')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'mis-partes'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'mis-partes' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : ''}`}>
              <History className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold truncate">Mis Partes</span>
          </button>

          {/* Tab 4: Mi Perfil */}
          <button
            onClick={() => setActiveTab('mi-perfil')}
            className={`flex flex-col items-center gap-1 py-1 px-1.5 rounded-xl transition cursor-pointer ${
              activeTab === 'mi-perfil'
                ? 'text-amber-400 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${activeTab === 'mi-perfil' ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold truncate">Mi Perfil</span>
          </button>

        </div>
      </nav>

      {/* Pre-Operational Daily Checklist Modal */}
      {isChecklistModalOpen && selectedVehicle && activeDriver && (
        <VehicleStartChecklistModal
          vehicle={selectedVehicle}
          driver={activeDriver}
          obra={selectedObra}
          existingChecklist={currentChecklist || undefined}
          onCompleteChecklist={(completedChecklist) => {
            setCurrentChecklist(completedChecklist);
            setIsChecklistModalOpen(false);
            if (completedChecklist.odometroInicial) {
              setOdomKilom(String(completedChecklist.odometroInicial));
            }
            showToast('✓ Checklist inicial y fotos guardados correctamente. Ya puedes comenzar.');
          }}
          onCancel={() => setIsChecklistModalOpen(false)}
          showToast={showToast}
        />
      )}

    </div>
  );
};
