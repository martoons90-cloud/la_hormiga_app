import React, { useState } from 'react';
import { Vehicle, VehicleStatus, Driver } from '../types';
import { StatusBadge, STATUS_CONFIG } from './StatusBadge';
import { formatCurrency } from '../services/storage';
import { 
  X, 
  Edit3, 
  Truck, 
  Calendar, 
  Clock, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Wrench, 
  QrCode, 
  CheckCircle,
  Copy,
  Check,
  UserCheck,
  Phone
} from 'lucide-react';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  assignedDriver?: Driver | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (vehicle: Vehicle) => void;
  onChangeStatus: (vehicleId: string, newStatus: VehicleStatus) => void;
  onViewDriver?: (driver: Driver) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  assignedDriver,
  isOpen,
  onClose,
  onEdit,
  onChangeStatus,
  onViewDriver,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !vehicle) return null;


  const margenDia = vehicle.precioSugerido > 0 
    ? Math.round(((vehicle.precioSugerido - vehicle.precioCosto) / vehicle.precioSugerido) * 100) 
    : 0;
  
  const gananciaDia = Math.max(0, vehicle.precioSugerido - vehicle.precioCosto);

  const margenHora = (vehicle.precioSugeridoHora && vehicle.precioCostoHora && vehicle.precioSugeridoHora > 0)
    ? Math.round(((vehicle.precioSugeridoHora - vehicle.precioCostoHora) / vehicle.precioSugeridoHora) * 100)
    : null;

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#16191F] border border-slate-800 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with image hero */}
        <div className="relative h-60 bg-black overflow-hidden">
          <img
            src={vehicle?.fotografia || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80'}
            alt={vehicle?.modeloMarca || ''}
            className="w-full h-full object-cover opacity-85"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16191F] via-[#16191F]/40 to-transparent" />

          {/* Close & Edit buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={() => onEdit(vehicle)}
              className="p-2 rounded-lg bg-black/60 hover:bg-amber-500 hover:text-black text-white backdrop-blur-md transition border border-slate-700"
              title="Editar vehículo"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-black/60 hover:bg-white hover:text-black text-white backdrop-blur-md transition border border-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Machine Header Badges */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-amber-500 text-black font-bold text-xs font-mono">
                  {vehicle.id}
                </span>
                <span className="text-xs text-slate-400">
                  • {vehicle.clasificacion}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {vehicle.modeloMarca}
              </h2>
            </div>

            <StatusBadge status={vehicle.estado} size="lg" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Main Key-Value Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0F1115] p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Patente / Dominio</span>
              <p className="text-sm font-bold font-mono text-white mt-0.5">
                {vehicle.patente || 'Sin Patente'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Código Interno</span>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-sm font-bold font-mono text-white">
                  {vehicle.codigoInterno}
                </p>
                <button
                  onClick={() => copyCode(vehicle.codigoInterno)}
                  className="text-slate-400 hover:text-amber-500"
                  title="Copiar código"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Horómetro</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {vehicle.horometro ? `${vehicle.horometro.toLocaleString()} hrs` : '0 hrs'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Fecha de Alta</span>
              <p className="text-sm font-bold text-white mt-0.5">
                {vehicle.fechaAlta || '-'}
              </p>
            </div>
          </div>

          {/* Pricing & Rentability Box */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Estructura de Tarifas y Márgenes</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Alquiler por Día */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0F1115]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Tarifa por DÍA</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                    +{margenDia}% Margen
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Precio Costo:</span>
                    <span className="font-mono font-semibold text-slate-300">{formatCurrency(vehicle.precioCosto)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-amber-500 font-semibold">Precio Sugerido:</span>
                    <span className="font-mono text-lg font-bold text-amber-400">
                      {formatCurrency(vehicle.precioSugerido)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-dashed border-slate-800 flex justify-between text-xs text-slate-400">
                    <span>Ganancia Neta Est. / Día:</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(gananciaDia)}</span>
                  </div>
                </div>
              </div>

              {/* Alquiler por Hora */}
              <div className="p-4 rounded-xl border border-slate-800 bg-[#0F1115]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-white">Tarifa por HORA</span>
                  {margenHora !== null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-400">
                      +{margenHora}% Margen
                    </span>
                  )}
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Precio Costo Hora:</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {vehicle.precioCostoHora ? formatCurrency(vehicle.precioCostoHora) : 'No definida'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-amber-500 font-semibold">Precio Sugerido Hora:</span>
                    <span className="font-mono text-lg font-bold text-amber-400">
                      {vehicle.precioSugeridoHora ? formatCurrency(vehicle.precioSugeridoHora) : 'No definida'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-dashed border-slate-800 flex justify-between text-xs text-slate-400">
                    <span>Modalidad:</span>
                    <span className="font-bold text-white">{vehicle.modalidadTarifa || 'Por Día y Hora'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación y Observaciones */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Ubicación Actual</span>
            </div>
            <p className="text-sm bg-[#0F1115] p-3 rounded-lg border border-slate-800 font-medium text-slate-200">
              {vehicle.ubicacionActual || 'Base Central - Parque Industrial'}
            </p>
          </div>

          {/* Assigned Driver Box */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500">
              <UserCheck className="w-4 h-4" />
              <span>Operador / Chofer Asignado</span>
            </div>
            {assignedDriver ? (
              <div className="p-3.5 rounded-xl bg-[#0F1115] border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={assignedDriver.foto}
                    alt={assignedDriver.nombreApellido}
                    className="w-11 h-11 rounded-full object-cover border border-amber-500/60 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-white text-sm">
                        {assignedDriver.nombreApellido}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {assignedDriver.id}
                      </span>
                      <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                        {assignedDriver.legajo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {assignedDriver.categoria} • {assignedDriver.obra}
                    </p>
                  </div>
                </div>

                {onViewDriver && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewDriver(assignedDriver);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-black text-white rounded-lg text-xs font-bold transition border border-slate-700 cursor-pointer shrink-0"
                  >
                    Ver Empleado
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#0F1115] border border-dashed border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Esta unidad no tiene chofer o maquinista asignado actualmente.</span>
              </div>
            )}
          </div>

          {vehicle.observaciones && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Observaciones Técnicas</span>
              <p className="text-xs text-amber-300 bg-amber-950/20 p-3 rounded-lg border border-amber-900/40">
                {vehicle.observaciones}
              </p>
            </div>
          )}

          {/* Quick Status Changer */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Cambio Rápido de Estado Operativo:
            </span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_CONFIG) as VehicleStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onChangeStatus(vehicle.id, st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                    vehicle.estado === st
                      ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-xs'
                      : 'bg-[#0F1115] hover:bg-slate-800 border-slate-800 text-slate-300'
                  }`}
                >
                  {STATUS_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#16191F] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            La Hormiga • Alquiler de Máquinas & Camiones
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit(vehicle)}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Modificar Ficha</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
