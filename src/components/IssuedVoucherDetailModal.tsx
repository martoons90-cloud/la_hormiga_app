import React, { useState } from 'react';
import { IssuedFuelVoucher, Vehicle, Employee } from '../types';
import { formatCurrency } from '../services/storage';
import { 
  X, 
  Printer, 
  Ticket, 
  Truck, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Fuel, 
  Gauge, 
  DollarSign, 
  CheckCircle2, 
  Clock3, 
  AlertTriangle, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Camera,
  Trash2
} from 'lucide-react';

interface IssuedVoucherDetailModalProps {
  isOpen: boolean;
  voucher: IssuedFuelVoucher | null;
  fleet: Vehicle[];
  employees: Employee[];
  onClose: () => void;
  onEdit?: (voucher: IssuedFuelVoucher) => void;
  onDelete?: (id: string) => void;
  onProceedToRendicion?: (voucher: IssuedFuelVoucher) => void;
  onViewExpendio?: (expendioId: string) => void;
}

export const IssuedVoucherDetailModal: React.FC<IssuedVoucherDetailModalProps> = ({
  isOpen,
  voucher,
  fleet,
  employees,
  onClose,
  onEdit,
  onDelete,
  onProceedToRendicion,
  onViewExpendio,
}) => {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !voucher) return null;

  const handlePrint = () => {
    window.print();
  };

  const isRendido = voucher.estado === 'RENDIDO';
  const isEmitido = voucher.estado === 'EMITIDO';

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
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  {voucher.numVale}
                </h2>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  isRendido
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : isEmitido
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {isRendido ? 'RENDIDO CON TICKET' : isEmitido ? 'EMITIDO (PENDIENTE DE RENDICIÓN)' : 'ANULADO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Vale de Combustible Oficial • La Hormiga S.A.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition border border-slate-700 cursor-pointer"
              title="Imprimir Vale para el Chofer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Printable Ticket Card Style */}
          <div className="bg-[#0F1115] border-2 border-dashed border-amber-500/40 rounded-2xl p-6 relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-400 border-b border-l border-amber-500/30 px-3 py-1 rounded-bl-xl text-[10px] font-mono font-bold uppercase tracking-wider">
              Vale Oficial de Suministro
            </div>

            {/* Top Company Banner */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">La Hormiga S.A.</h3>
                <p className="text-xs text-slate-400">Control de Flota y Abastecimiento de Combustible</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Nº de Vale</div>
                <div className="text-lg font-black text-amber-400 font-mono">{voucher.numVale}</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Fecha y Hora</span>
                <span className="text-white font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  {voucher.fechaEmision} {voucher.horaEmision}
                </span>
              </div>

              <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Equipo Asignado</span>
                <span className="text-white font-bold block">{voucher.codigoEquipo}</span>
                <span className="text-slate-400 text-[11px] font-mono">{voucher.patente}</span>
              </div>

              <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Chofer / Receptor</span>
                <span className="text-white font-medium block truncate">{voucher.nombreApellido}</span>
                <span className="text-slate-400 text-[11px] font-mono">Legajo: {voucher.legajo}</span>
              </div>

              <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">
                  {!voucher.litrosAutorizados || voucher.tipoCarga?.includes('Tanque Lleno') ? 'Modalidad' : 'Litros Autorizados'}
                </span>
                <span className="text-amber-400 font-black text-sm font-mono">
                  {!voucher.litrosAutorizados || voucher.tipoCarga?.includes('Tanque Lleno')
                    ? 'Tanque Lleno'
                    : `${voucher.litrosAutorizados} Lts`}
                </span>
                <span className="text-slate-400 text-[10px] block truncate">{voucher.tipoCarga || 'Completa (Tanque Lleno)'}</span>
              </div>
            </div>

            {/* Combustible y Estación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#16191F] rounded-xl border border-slate-800/80 flex items-start gap-3">
                <Fuel className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Combustible Habilitado</span>
                  <span className="text-white font-bold text-sm">{voucher.tipoComb}</span>
                  <span className="text-[10px] text-slate-500 font-mono block">Código: {voucher.idCombustible}</span>
                </div>
              </div>

              <div className="p-3 bg-[#16191F] rounded-xl border border-slate-800/80 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Estación / Surtidor</span>
                  <span className="text-white font-bold">{voucher.estacionSurtidor}</span>
                  {voucher.numEstacion && (
                    <span className="text-[10px] text-slate-500 font-mono block">Nº Estación: {voucher.numEstacion}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Instrucciones para el Chofer (Paso en Estación) */}
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">
                📋 Instrucciones para el Chofer / Operador:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                1. Entregue este vale en la estación de servicio autorizada.<br />
                2. Al terminar la carga, <strong className="text-white">solicite el ticket impreso de surtidor</strong> y anote de puño y letra el <strong className="text-white">Odómetro / Horómetro actual</strong> y los <strong className="text-white">Litros Reales</strong>.<br />
                3. Entregue el ticket en administración para su rendición y carga en la aplicación.
              </p>
            </div>

            {/* Odómetro de Salida */}
            {voucher.odometroSalida !== undefined && voucher.odometroSalida > 0 && (
              <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-3">
                <span>Odómetro registrado al salir de base:</span>
                <span className="font-mono font-bold text-white">{voucher.odometroSalida.toLocaleString()} Kms / Hs</span>
              </div>
            )}
          </div>

          {/* Sección de Rendición Real con Ticket (Si ya fue rendido) */}
          {isRendido ? (
            <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/30 pb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Rendición de Ticket Completada</span>
                </div>
                {voucher.expendioId && onViewExpendio && (
                  <button
                    onClick={() => onViewExpendio(voucher.expendioId!)}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                  >
                    <span>Ver Registro en Expendio ({voucher.expendioId})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Nº Ticket Estación</span>
                  <span className="text-white font-mono font-bold">{voucher.numTicket || 'S/N'}</span>
                </div>

                <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Litros Reales Cargados</span>
                  <span className="text-emerald-400 font-mono font-black text-sm">{voucher.litrosReales} Lts</span>
                  {voucher.diferenciaLitros !== undefined && (
                    <span className={`text-[10px] font-mono block ${
                      voucher.diferenciaLitros > 0 ? 'text-amber-400' : voucher.diferenciaLitros < 0 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {voucher.diferenciaLitros > 0 ? `+${voucher.diferenciaLitros} Lts dif.` : `${voucher.diferenciaLitros} Lts dif.`}
                    </span>
                  )}
                </div>

                <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Odómetro Real en Carga</span>
                  <span className="text-white font-mono font-bold">{voucher.odometroCarga?.toLocaleString() || '-'} Kms/Hs</span>
                </div>

                <div className="bg-[#16191F] p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold mb-1">Importe Total Ticket</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">{formatCurrency(voucher.importeTotal)}</span>
                </div>
              </div>

              {/* Rendition Photos */}
              {(voucher.fotoTicket || voucher.fotoOdometro) && (
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    Comprobantes Fotográficos del Ticket:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {voucher.fotoTicket && (
                      <div 
                        onClick={() => setActivePhoto(voucher.fotoTicket!)}
                        className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center"
                      >
                        <img 
                          src={voucher.fotoTicket} 
                          alt="Foto Ticket" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                          Ampliar Ticket
                        </div>
                      </div>
                    )}

                    {voucher.fotoOdometro && (
                      <div 
                        onClick={() => setActivePhoto(voucher.fotoOdometro!)}
                        className="cursor-pointer group relative rounded-xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center"
                      >
                        <img 
                          src={voucher.fotoOdometro} 
                          alt="Foto Odómetro" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold">
                          Ampliar Odómetro
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : isEmitido ? (
            /* Banner para rendir inmediatamente el vale */
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock3 className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">¿El chofer ya volvió con el ticket de la estación?</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cargue los litros y odómetro reales del ticket para registrar el ingreso en Expendio y dar por rendido este vale.
                  </p>
                </div>
              </div>

              {onProceedToRendicion && (
                <button
                  onClick={() => onProceedToRendicion(voucher)}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>⚡ Rendir Ticket en Expendio</span>
                </button>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            ID de Registro: <span className="font-mono text-slate-400">{voucher.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-500/40 rounded-lg p-1">
                  <span className="text-[11px] text-red-300 font-bold px-1.5">¿Eliminar vale?</span>
                  <button
                    onClick={() => {
                      onDelete(voucher.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded transition cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Eliminar este vale"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )
            )}

            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(voucher);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                Editar Vale
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-black bg-white hover:bg-slate-200 rounded-lg transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox photo modal */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img 
              src={activePhoto} 
              alt="Preview" 
              referrerPolicy="no-referrer"
              className="max-h-[85vh] max-w-full rounded-xl object-contain border border-slate-700" 
            />
            <button 
              onClick={() => setActivePhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/80 rounded-full text-white hover:bg-black transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
