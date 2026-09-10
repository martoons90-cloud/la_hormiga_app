import React, { useState, useEffect } from 'react';
import { Vehicle, VehicleClassification, VehicleStatus, RentalModality } from '../types';
import { PRESET_MACHINERY_IMAGES } from '../data/initialFleet';
import { uploadImageToCloudflareR2 } from '../services/api';
import { 
  PlusCircle, 
  Edit3, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Calculator, 
  Check, 
  AlertCircle,
  Truck,
  Hash,
  FileText,
  DollarSign,
  Tag,
  Clock,
  MapPin,
  Sparkles
} from 'lucide-react';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
  vehicleToEdit?: Vehicle | null;
  existingCount: number;
}

const CLASSIFICATIONS: VehicleClassification[] = [
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
  'Otro',
];

const STATUSES: { value: VehicleStatus; label: string }[] = [
  { value: 'DISPONIBLE', label: 'Disponible (Listo para Alquiler)' },
  { value: 'ALQUILADO', label: 'Alquilado / En Obra' },
  { value: 'EN_MANTENIMIENTO', label: 'En Mantenimiento Preventivo' },
  { value: 'TALLER', label: 'En Taller / Reparación' },
  { value: 'RESERVADO', label: 'Reservado' },
  { value: 'FUERA_DE_SERVICIO', label: 'Fuera de Servicio' },
];

export const VehicleFormModal: React.FC<VehicleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  vehicleToEdit,
  existingCount,
}) => {
  const isEditing = Boolean(vehicleToEdit);

  // Form states matching user's exact columns:
  // ID, CODIGO_EQUIPO, MODELO_MARCA, PATENTE, CODIGO_INTERNO, FOTOGRAFIA, PRECIO COSTO, PRECIO_SUGERIDO, CLASIFICACION, ESTADO
  const [id, setId] = useState('');
  const [modeloMarca, setModeloMarca] = useState('');
  const [patente, setPatente] = useState('');
  const [codigoInterno, setCodigoInterno] = useState('');
  const [fotografia, setFotografia] = useState('');
  const [precioCosto, setPrecioCosto] = useState<number | ''>('');
  const [precioSugerido, setPrecioSugerido] = useState<number | ''>('');
  const [precioCostoHora, setPrecioCostoHora] = useState<number | ''>('');
  const [precioSugeridoHora, setPrecioSugeridoHora] = useState<number | ''>('');
  const [modalidadTarifa, setModalidadTarifa] = useState<RentalModality>('AMBOS');
  const [clasificacion, setClasificacion] = useState<VehicleClassification>('Minicargadora');
  const [estado, setEstado] = useState<VehicleStatus>('DISPONIBLE');
  
  // Complementary attributes
  const [horometro, setHorometro] = useState<number | ''>('');
  const [ubicacionActual, setUbicacionActual] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [mostrarEnDashboard, setMostrarEnDashboard] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    if (vehicleToEdit) {
      setId(vehicleToEdit.id);
      setModeloMarca(vehicleToEdit.modeloMarca);
      setPatente(vehicleToEdit.patente);
      setCodigoInterno(vehicleToEdit.codigoInterno);
      setFotografia(vehicleToEdit.fotografia);
      setPrecioCosto(vehicleToEdit.precioCosto);
      setPrecioSugerido(vehicleToEdit.precioSugerido);
      setPrecioCostoHora(vehicleToEdit.precioCostoHora ?? '');
      setPrecioSugeridoHora(vehicleToEdit.precioSugeridoHora ?? '');
      setModalidadTarifa(vehicleToEdit.modalidadTarifa || 'AMBOS');
      setClasificacion(vehicleToEdit.clasificacion);
      setEstado(vehicleToEdit.estado);
      setHorometro(vehicleToEdit.horometro ?? '');
      setUbicacionActual(vehicleToEdit.ubicacionActual || '');
      setObservaciones(vehicleToEdit.observaciones || '');
      setMostrarEnDashboard(vehicleToEdit.mostrarEnDashboard ?? true);
    } else {
      // Auto-generate defaults for new vehicle
      const nextNum = existingCount + 1;
      const formattedNum = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;
      setId(`EQ-${formattedNum}`);
      setModeloMarca('');
      setPatente('');
      setCodigoInterno(`LH-MQ-2024-${nextNum < 10 ? `0${nextNum}` : nextNum}`);
      setFotografia('https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80');
      setPrecioCosto(45000);
      setPrecioSugerido(85000);
      setPrecioCostoHora(6500);
      setPrecioSugeridoHora(13000);
      setModalidadTarifa('AMBOS');
      setClasificacion('Minicargadora');
      setEstado('DISPONIBLE');
      setHorometro(0);
      setUbicacionActual('Base Central - Parque de Maquinaria');
      setObservaciones('');
      setMostrarEnDashboard(true);
    }
    setErrors({});
    setShowPresets(false);
  }, [vehicleToEdit, existingCount, isOpen]);

  if (!isOpen) return null;

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (under 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen no debe superar los 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) return;

      setFotografia(base64); // Instant local preview

      // Try uploading to Cloudflare R2
      setUploadingImage(true);
      try {
        const r2Res = await uploadImageToCloudflareR2(base64, file.name, file.type);
        if (r2Res.success && r2Res.url) {
          setFotografia(r2Res.url); // Use R2 public CDN / persistent URL
        }
      } catch (err) {
        console.warn('R2 upload bypassed, using local base64:', err);
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyMarkup = (percentage: number) => {
    const cost = typeof precioCosto === 'number' ? precioCosto : Number(precioCosto) || 0;
    if (cost > 0) {
      const suggested = Math.round(cost * (1 + percentage / 100));
      setPrecioSugerido(suggested);
    }
    const costH = typeof precioCostoHora === 'number' ? precioCostoHora : Number(precioCostoHora) || 0;
    if (costH > 0) {
      const suggestedH = Math.round(costH * (1 + percentage / 100));
      setPrecioSugeridoHora(suggestedH);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!id.trim()) newErrors.id = 'El ID es requerido';
    if (!modeloMarca.trim()) newErrors.modeloMarca = 'El Modelo / Marca es requerido';
    if (precioCosto === '' || Number(precioCosto) < 0) newErrors.precioCosto = 'Ingrese un precio de costo válido';
    if (precioSugerido === '' || Number(precioSugerido) < 0) newErrors.precioSugerido = 'Ingrese un precio sugerido válido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const savedVehicle: Vehicle = {
      id: id.trim(),
      modeloMarca: modeloMarca.trim(),
      patente: patente.trim().toUpperCase() || 'S/P',
      codigoInterno: codigoInterno.trim().toUpperCase() || id.trim(),
      fotografia: fotografia.trim() || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80',
      precioCosto: Number(precioCosto) || 0,
      precioSugerido: Number(precioSugerido) || 0,
      precioCostoHora: Number(precioCostoHora) || undefined,
      precioSugeridoHora: Number(precioSugeridoHora) || undefined,
      modalidadTarifa,
      clasificacion,
      estado,
      horometro: Number(horometro) || 0,
      ubicacionActual: ubicacionActual.trim() || 'Base Central',
      observaciones: observaciones.trim(),
      fechaAlta: vehicleToEdit ? vehicleToEdit.fechaAlta : new Date().toISOString().slice(0, 10),
      fechaUltimoMantenimiento: vehicleToEdit?.fechaUltimoMantenimiento,
      mostrarEnDashboard,
    };

    onSave(savedVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="bg-[#16191F] border border-slate-800 w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold shadow-sm">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {isEditing ? `Modificar Vehículo: ${vehicleToEdit?.id}` : 'Dar de Alta a Vehículo / Máquina'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                La Hormiga • Registro de flota para alquiler por día y por hora
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-200">
          
          {/* Section 1: Identificación del Equipo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-amber-500">
              <Truck className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                1. Identificación y Datos Principales
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* ID */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  ID de Registro (Código único) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-xs">#</span>
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="ej: EQ-001, MINI-01"
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-amber-400 font-bold focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
                {errors.id && <p className="text-xs text-red-400 mt-1">{errors.id}</p>}
              </div>

              {/* MODELO_MARCA */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Modelo y Marca <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modeloMarca}
                  onChange={(e) => setModeloMarca(e.target.value)}
                  placeholder="ej: Bobcat S570 / Caterpillar 416F"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500"
                  required
                />
                {errors.modeloMarca && <p className="text-xs text-red-400 mt-1">{errors.modeloMarca}</p>}
              </div>

              {/* PATENTE */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Patente / Dominio
                </label>
                <input
                  type="text"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value.toUpperCase())}
                  placeholder="ej: AF 123 CD (o S/P)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500 font-mono uppercase"
                />
              </div>

              {/* CODIGO_INTERNO */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Código Interno
                </label>
                <input
                  type="text"
                  value={codigoInterno}
                  onChange={(e) => setCodigoInterno(e.target.value)}
                  placeholder="ej: LH-MQ-2024-03"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* CLASIFICACION */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Clasificación / Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={clasificacion}
                  onChange={(e) => setClasificacion(e.target.value as VehicleClassification)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500"
                >
                  {CLASSIFICATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* ESTADO */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Estado Operativo Actual <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {STATUSES.map((st) => {
                    const isSelected = estado === st.value;
                    return (
                      <button
                        type="button"
                        key={st.value}
                        onClick={() => setEstado(st.value)}
                        className={`p-2 rounded-lg border text-xs font-bold text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-500 shadow-sm'
                            : 'bg-[#0F1115] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {st.label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Tarifas y Costos */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-amber-500">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  2. Estructura de Costos y Precios de Alquiler (Día / Hora)
                </h3>
              </div>

              {/* Quick markup generator helper */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Aplicar Margen:</span>
                <button
                  type="button"
                  onClick={() => applyMarkup(50)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-black font-semibold text-[11px] text-slate-300 transition cursor-pointer"
                >
                  +50%
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkup(75)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-black font-semibold text-[11px] text-slate-300 transition cursor-pointer"
                >
                  +75%
                </button>
                <button
                  type="button"
                  onClick={() => applyMarkup(100)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-black font-semibold text-[11px] text-slate-300 transition cursor-pointer"
                >
                  +100%
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#0F1115] p-4 rounded-xl border border-slate-800">
              {/* PRECIO COSTO DIARIO */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Precio Costo por DÍA ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={precioCosto}
                  onChange={(e) => setPrecioCosto(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 45000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#16191F] text-white focus:outline-none focus:border-amber-500 font-mono"
                  required
                />
                {errors.precioCosto && <p className="text-xs text-red-400 mt-1">{errors.precioCosto}</p>}
              </div>

              {/* PRECIO SUGERIDO DIARIO */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-amber-500">
                  Precio Sugerido por DÍA ($) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={precioSugerido}
                  onChange={(e) => setPrecioSugerido(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 80000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-500/40 bg-[#16191F] focus:outline-none focus:border-amber-500 font-bold font-mono text-amber-400"
                  required
                />
                {errors.precioSugerido && <p className="text-xs text-red-400 mt-1">{errors.precioSugerido}</p>}
              </div>

              {/* PRECIO COSTO POR HORA */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Precio Costo por HORA ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={precioCostoHora}
                  onChange={(e) => setPrecioCostoHora(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 6500"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#16191F] text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* PRECIO SUGERIDO POR HORA */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-amber-500">
                  Precio Sugerido por HORA ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={precioSugeridoHora}
                  onChange={(e) => setPrecioSugeridoHora(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 13000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-amber-500/40 bg-[#16191F] focus:outline-none focus:border-amber-500 font-bold font-mono text-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Fotografía del Vehículo */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-amber-500">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  3. Fotografía de la Unidad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs font-medium text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{showPresets ? 'Ocultar catálogo de fotos' : 'Ver fotos sugeridas'}</span>
              </button>
            </div>

            {showPresets && (
              <div className="p-3 bg-[#0F1115] border border-slate-800 rounded-xl space-y-2 animate-in fade-in">
                <p className="text-xs font-semibold text-slate-300">
                  Selecciona una foto rápida de maquinaria:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PRESET_MACHINERY_IMAGES.map((img, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setFotografia(img.url)}
                      className="group relative rounded-lg overflow-hidden border border-slate-700 hover:border-amber-500 focus:border-amber-500 transition aspect-video cursor-pointer"
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/80 text-[10px] text-white p-1 truncate text-center">
                        {img.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* Photo Preview */}
              <div className="rounded-xl border border-slate-800 bg-[#0F1115] p-2 flex flex-col items-center justify-center">
                {fotografia ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900">
                    <img
                      src={fotografia}
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold">
                      Vista previa
                    </span>
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-lg border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span className="text-xs">Sin imagen</span>
                  </div>
                )}
              </div>

              {/* Photo Input options */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    URL de la Imagen Web
                  </label>
                  <input
                    type="url"
                    value={fotografia}
                    onChange={(e) => setFotografia(e.target.value)}
                    placeholder="https://ejemplo.com/foto-maquinaria.jpg"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    O sube una foto desde tu dispositivo
                  </label>
                  <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-700 bg-[#0F1115] hover:bg-slate-800 hover:border-amber-500 transition cursor-pointer text-xs font-medium text-slate-300">
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span>{uploadingImage ? 'Subiendo imagen a Cloudflare R2...' : 'Seleccionar archivo (PNG, JPG, WebP)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="sr-only"
                    />
                  </label>
                  {uploadingImage && (
                    <p className="text-[11px] text-amber-400 animate-pulse mt-1">Subiendo archivo a almacenamiento seguro Cloudflare R2...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Datos Complementarios de Operación */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-amber-500">
              <Clock className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                4. Ubicación, Horómetro y Observaciones
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Horómetro Actual (Horas trabajadas)
                </label>
                <input
                  type="number"
                  min="0"
                  value={horometro}
                  onChange={(e) => setHorometro(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="ej: 1450"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Ubicación Actual
                </label>
                <input
                  type="text"
                  value={ubicacionActual}
                  onChange={(e) => setUbicacionActual(e.target.value)}
                  placeholder="ej: Base Central / Obra Autopista Sur"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Observaciones / Accesorios Incluidos
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="ej: Incluye martillo hidráulico, juego de baldes 30/60cm, VTV al día..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-800 bg-[#0F1115] text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <div className="flex items-center justify-between p-3.5 bg-[#0F1115] border border-slate-800 rounded-xl">
                  <div>
                    <span className="block text-xs font-bold text-white">Mostrar en Dashboard de Control</span>
                    <span className="block text-[11px] text-slate-400">Si está activo, este equipo se incluye en el panel de Combustible vs Trabajo.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarEnDashboard(!mostrarEnDashboard)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      mostrarEnDashboard
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {mostrarEnDashboard ? 'Sí (Visible)' : 'No (Oculto)'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-[#16191F] py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-guardar-vehiculo"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditing ? 'Guardar Cambios' : 'Dar de Alta Vehículo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
