import React, { useState } from 'react';
import { Employee, EmployeeStatus, Vehicle } from '../types';
import { DriverStatusBadge, DRIVER_STATUS_CONFIG } from './DriverStatusBadge';
import { formatCurrency } from '../services/storage';
import { 
  X, 
  Edit3, 
  Phone, 
  Mail, 
  HardHat, 
  Building2, 
  MapPin, 
  Layers, 
  Truck, 
  DollarSign, 
  Copy, 
  Check, 
  Calendar,
  Briefcase,
  IdCard,
  Hash,
  FileText
} from 'lucide-react';

interface DriverDetailModalProps {
  isOpen: boolean;
  driver: Employee | null;
  fleet: Vehicle[];
  onClose: () => void;
  onEdit: (employee: Employee) => void;
  onChangeStatus: (id: string, newStatus: EmployeeStatus) => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
}

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({
  isOpen,
  driver,
  fleet,
  onClose,
  onEdit,
  onChangeStatus,
  onViewVehicle,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !driver) return null;

  const assignedVehicle = fleet.find((v) => v.id === driver.vehiculoAsignadoId);

  const copyLegajo = () => {
    navigator.clipboard.writeText(driver.legajo || driver.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = driver.telefono ? driver.telefono.replace(/[^0-9]/g, '') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#16191F] border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Photo & Core Identity */}
        <div className="relative bg-black/90 p-6 border-b border-slate-800 overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Action buttons top right */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => onEdit(driver)}
              className="p-2 rounded-lg bg-black/60 hover:bg-amber-500 hover:text-black text-white backdrop-blur-md transition border border-slate-700 cursor-pointer"
              title="Editar legajo de empleado"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-black/60 hover:bg-white hover:text-black text-white backdrop-blur-md transition border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 z-10 relative">
            <div className="relative">
              <img
                src={driver.foto}
                alt={driver.nombreApellido}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-500 shadow-xl bg-slate-900"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                }}
              />
              <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-black border-2 border-[#16191F]">
                <HardHat className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                  {driver.id}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-bold">
                  CÓD: {driver.codigoEmpleado}
                </span>
                <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black text-xs font-mono font-extrabold">
                  LEGAJO: {driver.legajo}
                </span>
                <DriverStatusBadge status={driver.estado} size="sm" />
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight truncate">
                {driver.nombreApellido}
              </h2>

              <p className="text-sm font-semibold text-amber-400/90 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                <span>{driver.categoria}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick status change bar */}
          <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400">Actualizar Estado:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['ACTIVO', 'EN_OBRA', 'LICENCIA', 'INACTIVO'] as EmployeeStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onChangeStatus(driver.id, st)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                    driver.estado === st
                      ? `${DRIVER_STATUS_CONFIG[st].bg} ${DRIVER_STATUS_CONFIG[st].text} ${DRIVER_STATUS_CONFIG[st].border}`
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {DRIVER_STATUS_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>

          {/* Bento 9 Columns Grid Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* ID */}
            <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-amber-500" />
                ID Sistema
              </span>
              <p className="text-base font-bold font-mono text-white">{driver.id}</p>
            </div>

            {/* CODIGO_EMPLEADO */}
            <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <IdCard className="w-3.5 h-3.5 text-amber-500" />
                Código Empleado
              </span>
              <p className="text-base font-bold font-mono text-amber-400">{driver.codigoEmpleado}</p>
            </div>

            {/* LEGAJO */}
            <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  Legajo Oficial
                </span>
                <button
                  onClick={copyLegajo}
                  className="text-slate-500 hover:text-white transition cursor-pointer"
                  title="Copiar Legajo"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-base font-bold font-mono text-white">{driver.legajo}</p>
            </div>

            {/* CATEGORIA */}
            <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 space-y-1 sm:col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                Categoría Laboral
              </span>
              <p className="text-sm font-bold text-white truncate" title={driver.categoria}>
                {driver.categoria}
              </p>
            </div>

            {/* SECTOR */}
            <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Sector / Área
              </span>
              <p className="text-sm font-bold text-white truncate" title={driver.sector}>
                {driver.sector}
              </p>
            </div>

            {/* OBRA */}
            <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Obra / Destino
              </span>
              <p className="text-sm font-bold text-amber-400 truncate" title={driver.obra}>
                {driver.obra}
              </p>
            </div>

          </div>

          {/* Assigned Fleet Machine */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <Truck className="w-4 h-4" />
              <span>Vehículo / Maquinaria Asignada de la Flota</span>
            </div>

            {assignedVehicle ? (
              <div className="p-4 rounded-xl bg-[#0F1115] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={assignedVehicle?.fotografia || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=400&q=80'}
                    alt={assignedVehicle?.modeloMarca || ''}
                    className="w-14 h-14 rounded-lg object-cover border border-amber-500/50 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {assignedVehicle.modeloMarca}
                      </span>
                      <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-black">
                        {assignedVehicle.codigoEquipo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Patente: {assignedVehicle.patente} • Clasificación: {assignedVehicle.clasificacion}
                    </p>
                  </div>
                </div>

                {onViewVehicle && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewVehicle(assignedVehicle);
                    }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-black text-white rounded-lg text-xs font-bold transition border border-slate-700 cursor-pointer shrink-0"
                  >
                    Ver Ficha de Máquina
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0F1115] border border-dashed border-slate-800 text-xs text-slate-400">
                Este empleado no cuenta con un vehículo asignado de manera fija actualmente (modalidad rotativa o en base).
              </div>
            )}
          </div>

          {/* Contact & Complementary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0F1115] border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                Contacto Directo
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Teléfono:</span>
                  {driver.telefono ? (
                    <a
                      href={`https://wa.me/${cleanPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>{driver.telefono}</span>
                      <span className="text-[10px] bg-emerald-500/20 px-1 rounded">WA</span>
                    </a>
                  ) : (
                    <span className="text-slate-600">No especificado</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">DNI / CUIT:</span>
                  <span className="font-mono text-white font-semibold">
                    {driver.dni || driver.cuit || 'Sin registrar'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-300 truncate max-w-[180px]">
                    {driver.email || 'No especificado'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0F1115] border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                Costo Operativo & Registro
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Jornal Diario:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {driver.costoPorDia ? formatCurrency(driver.costoPorDia) : 'A convenir'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Fecha de Alta:</span>
                  <span className="font-mono text-slate-300 font-semibold">
                    {driver.fechaAlta || 'Registrado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Observations */}
          {driver.observaciones && (
            <div className="p-4 rounded-xl bg-[#0F1115] border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Observaciones Técnicas</span>
              <p className="text-xs text-slate-300 leading-relaxed">{driver.observaciones}</p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#13161C] flex items-center justify-between">
          <button
            onClick={() => onEdit(driver)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Legajo</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
};
