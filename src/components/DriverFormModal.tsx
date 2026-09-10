import React, { useState, useEffect } from 'react';
import { Employee, EmployeeStatus, Vehicle } from '../types';
import { 
  EMPLOYEE_CATEGORIES, 
  EMPLOYEE_SECTORS, 
  EMPLOYEE_OBRAS, 
  EMPLOYEE_AVATAR_PRESETS 
} from '../data/initialDrivers';
import { 
  X, 
  UserCheck, 
  Upload, 
  HardHat, 
  Phone, 
  Building2, 
  MapPin, 
  Layers, 
  Truck, 
  DollarSign, 
  FileText,
  Check,
  BadgeAlert,
  Sparkles,
  Briefcase
} from 'lucide-react';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  driverToEdit?: Employee | null;
  existingDriversCount: number;
  fleet: Vehicle[];
}

export const DriverFormModal: React.FC<DriverFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  driverToEdit,
  existingDriversCount,
  fleet,
}) => {
  // Required 9 columns
  const [id, setId] = useState('');
  const [codigoEmpleado, setCodigoEmpleado] = useState('');
  const [nombreApellido, setNombreApellido] = useState('');
  const [legajo, setLegajo] = useState('');
  const [categoria, setCategoria] = useState(EMPLOYEE_CATEGORIES[0]);
  const [foto, setFoto] = useState(EMPLOYEE_AVATAR_PRESETS[0]);
  const [sector, setSector] = useState(EMPLOYEE_SECTORS[0]);
  const [obra, setObra] = useState(EMPLOYEE_OBRAS[0]);
  const [estado, setEstado] = useState<EmployeeStatus>('ACTIVO');

  // Secondary operational fields
  const [dni, setDni] = useState('');
  const [cuit, setCuit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [vehiculoAsignadoId, setVehiculoAsignadoId] = useState<string>('');
  const [costoPorDia, setCostoPorDia] = useState<number>(42000);
  const [observaciones, setObservaciones] = useState('');
  const [customSector, setCustomSector] = useState(false);
  const [customObra, setCustomObra] = useState(false);
  const [customCategoria, setCustomCategoria] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (driverToEdit) {
      setId(driverToEdit.id);
      setCodigoEmpleado(driverToEdit.codigoEmpleado || '');
      setNombreApellido(driverToEdit.nombreApellido || '');
      setLegajo(driverToEdit.legajo || '');
      setCategoria(driverToEdit.categoria || EMPLOYEE_CATEGORIES[0]);
      setFoto(driverToEdit.foto || EMPLOYEE_AVATAR_PRESETS[0]);
      setSector(driverToEdit.sector || EMPLOYEE_SECTORS[0]);
      setObra(driverToEdit.obra || EMPLOYEE_OBRAS[0]);
      setEstado(driverToEdit.estado || 'ACTIVO');

      setDni(driverToEdit.dni || '');
      setCuit(driverToEdit.cuit || '');
      setTelefono(driverToEdit.telefono || '');
      setEmail(driverToEdit.email || '');
      setVehiculoAsignadoId(driverToEdit.vehiculoAsignadoId || '');
      setCostoPorDia(driverToEdit.costoPorDia || 42000);
      setObservaciones(driverToEdit.observaciones || '');
      setErrors({});
    } else {
      const nextNum = existingDriversCount + 1;
      const formattedNum = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;
      
      setId(`EMP-${formattedNum}`);
      setCodigoEmpleado(`OP-${100 + nextNum}`);
      setNombreApellido('');
      setLegajo(`LEG-${7000 + nextNum * 15}`);
      setCategoria(EMPLOYEE_CATEGORIES[0]);
      setFoto(EMPLOYEE_AVATAR_PRESETS[(nextNum - 1) % EMPLOYEE_AVATAR_PRESETS.length]);
      setSector(EMPLOYEE_SECTORS[0]);
      setObra(EMPLOYEE_OBRAS[0]);
      setEstado('ACTIVO');

      setDni('');
      setCuit('');
      setTelefono('');
      setEmail('');
      setVehiculoAsignadoId('');
      setCostoPorDia(42000);
      setObservaciones('');
      setErrors({});
    }
  }, [driverToEdit, existingDriversCount, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!id.trim()) newErrors.id = 'El ID es obligatorio.';
    if (!codigoEmpleado.trim()) newErrors.codigoEmpleado = 'El Código de Empleado es obligatorio.';
    if (!nombreApellido.trim()) newErrors.nombreApellido = 'El Nombre y Apellido es obligatorio.';
    if (!legajo.trim()) newErrors.legajo = 'El Legajo es obligatorio.';
    if (!categoria.trim()) newErrors.categoria = 'La Categoría es requerida.';
    if (!sector.trim()) newErrors.sector = 'El Sector es requerido.';
    if (!obra.trim()) newErrors.obra = 'La Obra es requerida.';
    if (!foto.trim()) newErrors.foto = 'La Foto es requerida.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const employeeData: Employee = {
      id: id.trim().toUpperCase(),
      codigoEmpleado: codigoEmpleado.trim().toUpperCase(),
      nombreApellido: nombreApellido.trim(),
      legajo: legajo.trim().toUpperCase(),
      categoria: categoria.trim(),
      foto: foto.trim(),
      sector: sector.trim(),
      obra: obra.trim(),
      estado,
      dni: dni.trim() || undefined,
      cuit: cuit.trim() || undefined,
      telefono: telefono.trim() || undefined,
      email: email.trim() || undefined,
      vehiculoAsignadoId: vehiculoAsignadoId || undefined,
      fechaAlta: driverToEdit?.fechaAlta || new Date().toISOString().slice(0, 10),
      costoPorDia: Number(costoPorDia) || undefined,
      observaciones: observaciones.trim() || undefined,
    };

    onSave(employeeData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-[#13161C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {driverToEdit ? 'Editar Datos de Empleado' : 'Alta de Nuevo Empleado'}
              </h3>
              <p className="text-xs text-slate-400">
                Registro de columnas obligatorias: ID, Código, Nombre/Apellido, Legajo, Categoría, Foto, Sector, Obra y Estado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Top Bento Highlight */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Columnas del Registro Oficial de Personal • La Hormiga</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              9 Columnas Estructuradas
            </span>
          </div>

          {/* Section 1: Identificación y Datos Principales */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              <span>1. Identificación & Legajo</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ID */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ID <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="ej. EMP-007"
                  className={`w-full bg-[#0F1115] border rounded-lg px-3.5 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500 ${
                    errors.id ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
                {errors.id && <p className="text-[11px] text-rose-500 mt-1">{errors.id}</p>}
              </div>

              {/* CODIGO_EMPLEADO */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  CÓDIGO EMPLEADO <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={codigoEmpleado}
                  onChange={(e) => setCodigoEmpleado(e.target.value)}
                  placeholder="ej. OP-107"
                  className={`w-full bg-[#0F1115] border rounded-lg px-3.5 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500 ${
                    errors.codigoEmpleado ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
                {errors.codigoEmpleado && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.codigoEmpleado}</p>
                )}
              </div>

              {/* LEGAJO */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  LEGAJO <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={legajo}
                  onChange={(e) => setLegajo(e.target.value)}
                  placeholder="ej. LEG-8920"
                  className={`w-full bg-[#0F1115] border rounded-lg px-3.5 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500 ${
                    errors.legajo ? 'border-rose-500' : 'border-slate-800'
                  }`}
                />
                {errors.legajo && <p className="text-[11px] text-rose-500 mt-1">{errors.legajo}</p>}
              </div>
            </div>

            {/* NOMBRE_APELLIDO */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                NOMBRE Y APELLIDO <span className="text-amber-500">*</span>
              </label>
              <input
                type="text"
                value={nombreApellido}
                onChange={(e) => setNombreApellido(e.target.value)}
                placeholder="ej. Carlos Benítez"
                className={`w-full bg-[#0F1115] border rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 ${
                  errors.nombreApellido ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {errors.nombreApellido && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.nombreApellido}</p>
              )}
            </div>
          </div>

          {/* Section 2: Puesto, Sector, Obra y Estado */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span>2. Categoría, Sector, Obra & Estado</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CATEGORIA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    CATEGORÍA <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomCategoria(!customCategoria)}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    {customCategoria ? 'Elegir de lista' : '+ Otra manual'}
                  </button>
                </div>
                {customCategoria ? (
                  <input
                    type="text"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    placeholder="Escriba la categoría personalizada"
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {EMPLOYEE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                {errors.categoria && <p className="text-[11px] text-rose-500 mt-1">{errors.categoria}</p>}
              </div>

              {/* ESTADO */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ESTADO <span className="text-amber-500">*</span>
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EmployeeStatus)}
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="ACTIVO">ACTIVO (Disponible)</option>
                  <option value="EN_OBRA">EN_OBRA (Asignado)</option>
                  <option value="LICENCIA">LICENCIA (Franco / Médico)</option>
                  <option value="INACTIVO">INACTIVO (Baja)</option>
                </select>
              </div>

              {/* SECTOR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    SECTOR <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomSector(!customSector)}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    {customSector ? 'Elegir de lista' : '+ Otro sector'}
                  </button>
                </div>
                {customSector ? (
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Escriba el sector operativo"
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {EMPLOYEE_SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}
                {errors.sector && <p className="text-[11px] text-rose-500 mt-1">{errors.sector}</p>}
              </div>

              {/* OBRA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    OBRA / DESTINO <span className="text-amber-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomObra(!customObra)}
                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                  >
                    {customObra ? 'Elegir de lista' : '+ Otra obra'}
                  </button>
                </div>
                {customObra ? (
                  <input
                    type="text"
                    value={obra}
                    onChange={(e) => setObra(e.target.value)}
                    placeholder="Nombre o ubicación de la obra"
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <select
                    value={obra}
                    onChange={(e) => setObra(e.target.value)}
                    className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {EMPLOYEE_OBRAS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}
                {errors.obra && <p className="text-[11px] text-rose-500 mt-1">{errors.obra}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Fotografía */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>3. Fotografía del Empleado</span>
            </h4>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-[#0F1115] border border-slate-800">
              <div className="relative">
                <img
                  src={foto}
                  alt="Preview Foto"
                  className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/80 shadow-md bg-slate-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = EMPLOYEE_AVATAR_PRESETS[0];
                  }}
                />
              </div>

              <div className="flex-1 space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    URL de la Imagen o Cargar Foto <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={foto}
                    onChange={(e) => setFoto(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#16191F] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition border border-slate-700 inline-flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir archivo local</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    <span className="text-[10px] text-slate-500 mr-1">Predefinidos:</span>
                    {EMPLOYEE_AVATAR_PRESETS.slice(0, 5).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFoto(p)}
                        className={`w-6 h-6 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                          foto === p ? 'border-amber-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {errors.foto && <p className="text-[11px] text-rose-500 mt-1">{errors.foto}</p>}
          </div>

          {/* Section 4: Datos Complementarios de Operación */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <span>4. Datos Operativos & Contacto (Opcionales)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">DNI</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="ej. 32.845.120"
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="ej. +54 9 11 4455-8910"
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Costo Jornal / Día ($)</label>
                <input
                  type="number"
                  value={costoPorDia}
                  onChange={(e) => setCostoPorDia(Number(e.target.value))}
                  placeholder="40000"
                  className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Asignación de Máquina / Equipo de la flota */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Vehículo / Equipo de Flota Asignado
              </label>
              <select
                value={vehiculoAsignadoId}
                onChange={(e) => setVehiculoAsignadoId(e.target.value)}
                className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Sin Vehículo Asignado / Rotativo --</option>
                {fleet.map((v) => (
                  <option key={v.id} value={v.id}>
                    [{v.codigoEquipo}] {v.modeloMarca} ({v.patente}) - {v.estado}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Observaciones</label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Anotaciones sobre certificaciones, apto médico o especialidades..."
                className="w-full bg-[#0F1115] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{driverToEdit ? 'Guardar Cambios' : 'Registrar Empleado'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
