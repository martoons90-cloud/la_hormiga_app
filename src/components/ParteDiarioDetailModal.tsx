import React from 'react';
import { ParteDiario } from '../types';
import { X, ClipboardList, Calendar, Wrench, Users, MapPin, Clock, Truck, ShieldCheck } from 'lucide-react';

interface ParteDiarioDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  parte: ParteDiario | null;
  onEdit: (parte: ParteDiario) => void;
}

export const ParteDiarioDetailModal: React.FC<ParteDiarioDetailModalProps> = ({
  isOpen,
  onClose,
  parte,
  onEdit,
}) => {
  if (!isOpen || !parte) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-bold">Parte #{parte.numParte} (ID: {parte.id})</div>
              <h2 className="text-lg font-bold text-white">{parte.marcaModelo || parte.codigoEquipo}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-300 font-mono">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Fecha: <strong className="text-white">{parte.fecha}</strong></span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              parte.autorizado === 'CONTROLADO' || parte.autorizado === 'AUTORIZADO'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}>
              {parte.autorizado}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Obra y Código</div>
              <div className="text-sm font-bold text-white">{parte.obra}</div>
              <div className="text-xs text-slate-400">Código Obra: {parte.codigoObra}</div>
              <div className="text-xs text-slate-400">Serv / Mant: {parte.servMant}</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Equipo / Operador</div>
              <div className="text-sm font-bold text-amber-400">{parte.codigoEquipo} ({parte.marcaModelo})</div>
              <div className="text-xs text-slate-400">Op: {parte.nombreApellido} [{parte.codigoEmpleado}]</div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2 font-mono text-xs">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Horarios y Turnos</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-800/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">H. Ini Mañana</span>
                <span className="text-white font-bold">{parte.horaInicioMañana || '-'}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">H. Fin Mañana</span>
                <span className="text-white font-bold">{parte.horaFinMañana || '-'}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">H. Ini Tarde</span>
                <span className="text-white font-bold">{parte.horaInicioTarde || '-'}</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded">
                <span className="text-[10px] text-slate-500 block">H. Fin Tarde</span>
                <span className="text-white font-bold">{parte.horaFinTarde || '-'}</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm">
              <span>Horas Trabajadas: <strong className="text-amber-400">{(parte.horasTrabajadas || 0).toFixed(1)} h</strong></span>
              <span>Odómetro / Km: <strong className="text-white">{parte.odomKilom ? parte.odomKilom.toLocaleString() : '-'}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Tipo de Trabajo</div>
              <div className="text-sm font-bold text-amber-400">{parte.tipo} - {parte.detalleTipo}</div>
              {parte.tipo === 'VIAJES' && <div className="text-xs text-slate-300">Cantidad de Viajes: {parte.viajesCantidad}</div>}
              {parte.tipoMaterial && <div className="text-xs text-slate-300">Material: {parte.tipoMaterial}</div>}
              {parte.extraccionEntregas && <div className="text-xs text-purple-300">Extracción/Entrega: {parte.extraccionEntregas}</div>}
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Ubicación y Firma</div>
              <div className="text-xs text-white">Ubicación: {parte.ubicacion || '-'}</div>
              <div className="text-xs text-slate-300">Encargado: {parte.encargadoObra || '-'}</div>
              <div className="text-xs text-emerald-400">Firma: {parte.firma || '-'}</div>
            </div>
          </div>

          {parte.checklist && (
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Checklist Pre-Operacional al Arrancar
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Horómetro Inicial: {parte.odometroInicial || parte.checklist.odometroInicial || '-'}
                </span>
              </div>

              {/* Fluids & checks status tags */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
                <div className={`p-1.5 rounded border ${parte.checklist.nivelAceiteMotor ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'}`}>
                  Aceite Motor: {parte.checklist.nivelAceiteMotor ? 'OK' : 'Bajo'}
                </div>
                <div className={`p-1.5 rounded border ${parte.checklist.nivelRefrigerante ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'}`}>
                  Refrigerante: {parte.checklist.nivelRefrigerante ? 'OK' : 'Bajo'}
                </div>
                <div className={`p-1.5 rounded border ${parte.checklist.nivelAceiteHidraulico ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'}`}>
                  Hidráulico: {parte.checklist.nivelAceiteHidraulico ? 'OK' : 'Bajo'}
                </div>
                <div className={`p-1.5 rounded border ${parte.checklist.fugasFluidos ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/30 border-rose-500/30 text-rose-300'}`}>
                  Fugas: {parte.checklist.fugasFluidos ? 'Sin Fugas' : 'Pérdida'}
                </div>
              </div>

              {/* Photos Gallery */}
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono font-bold block">
                  Fotos de Inspección Inicial (4 lados + cabina + odómetro):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: 'Frente', url: parte.checklist.fotoFrente },
                    { label: 'Atrás', url: parte.checklist.fotoAtras },
                    { label: 'Lat. Izq.', url: parte.checklist.fotoLateralIzquierdo },
                    { label: 'Lat. Der.', url: parte.checklist.fotoLateralDerecho },
                    { label: 'Cabina', url: parte.checklist.fotoCabinaInterior },
                    { label: 'Odómetro', url: parte.checklist.fotoTableroOdometro },
                  ].map((p, idx) => (
                    <div key={idx} className="aspect-square bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative group">
                      {p.url ? (
                        <img
                          src={p.url}
                          alt={p.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-500 text-center p-1">
                          Sin foto
                        </div>
                      )}
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[9px] text-white text-center py-0.5 truncate">
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {parte.novedades && (
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Novedades</div>
              <p className="text-xs text-slate-300 font-sans">{parte.novedades}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                onEdit(parte);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Editar Parte
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
