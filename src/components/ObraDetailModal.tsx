import React, { useState } from 'react';
import { Obra, ParteDiario } from '../types';
import { X, Building2, MapPin, Hash, DollarSign, Calendar, UserCheck, CheckCircle2, FileText, Clock, ClipboardList, Wrench } from 'lucide-react';
import { formatCurrency } from '../services/storage';

interface ObraDetailModalProps {
  obra: Obra | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (obra: Obra) => void;
  partesDiarios?: ParteDiario[];
}

export const ObraDetailModal: React.FC<ObraDetailModalProps> = ({
  obra,
  isOpen,
  onClose,
  onEdit,
  partesDiarios = [],
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'partes'>('info');

  if (!isOpen || !obra) return null;

  const obraPartes = partesDiarios.filter(
    p => p.obra?.toLowerCase().trim() === obra.nombreObra?.toLowerCase().trim() ||
         p.codigoObra?.toLowerCase().trim() === obra.numero?.toLowerCase().trim()
  );

  const totalHoras = obraPartes.reduce((acc, p) => acc + (p.horasTrabajadas || p.hsCantidad || 0), 0);
  const totalViajes = obraPartes.reduce((acc, p) => acc + (p.viajesCantidad || p.cantidad || 0), 0);
  const equiposUnicos = Array.from(new Set(obraPartes.map(p => p.codigoEquipo).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {obra.numero}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${obra.activa ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {obra.activa ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>
              <h3 className="text-white font-bold text-lg mt-1">{obra.nombreObra}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 gap-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'info'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Información General
          </button>
          <button
            onClick={() => setActiveTab('partes')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'partes'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Trabajos por Equipo / Partes ({obraPartes.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'info' ? (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>Ubicación</span>
                  </div>
                  <div className="text-white font-medium text-sm">{obra.ubicacion || 'Sin ubicación especificada'}</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Pertenece a (Comitente / Dueño)</span>
                  </div>
                  <div className="text-white font-medium text-sm">{obra.pertenece || 'Empresa Principal'}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span>Plazo Estimado</span>
                  </div>
                  <div className="text-white font-mono text-sm font-semibold">{obra.plazo || 'N/D'}</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <DollarSign className="w-4 h-4 text-amber-400" />
                    <span>Monto Estimado</span>
                  </div>
                  <div className="text-emerald-400 font-mono text-base font-bold">{formatCurrency(obra.montoEstimado)}</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Fecha de Alta</span>
                  </div>
                  <div className="text-slate-300 font-mono text-sm">{obra.fechaAlta || 'N/D'}</div>
                </div>
              </div>

              {/* Summary Stats of Work Execution */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                <div>
                  <span className="text-xs text-slate-400 block">Total Horas Trabajadas</span>
                  <span className="text-lg font-mono font-bold text-amber-400">{totalHoras.toFixed(1)} hs</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Total Viajes / Cargas</span>
                  <span className="text-lg font-mono font-bold text-blue-400">{totalViajes}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Equipos / Máquinas Asignadas</span>
                  <span className="text-lg font-mono font-bold text-white">{equiposUnicos.length} equipos</span>
                </div>
              </div>

              {obra.observaciones && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Observaciones / Notas</span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">{obra.observaciones}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">Partes Diarios y Trabajos Registrados</h4>
                  <p className="text-xs text-slate-400">Listado de partes de equipos operando en esta obra</p>
                </div>
                <div className="flex gap-2 font-mono text-xs">
                  <span className="bg-slate-900 border border-slate-800 text-amber-400 px-3 py-1 rounded-lg">
                    {totalHoras.toFixed(1)} hs total
                  </span>
                </div>
              </div>

              {obraPartes.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
                  <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-300 text-sm font-medium">No hay partes diarios registrados para esta obra.</p>
                  <p className="text-xs text-slate-500 mt-1">Al crear o importar un parte diario con el nombre o código de esta obra, aparecerá aquí automáticamente.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {obraPartes.map((p) => (
                    <div 
                      key={p.id}
                      className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-xl p-3.5 transition flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Parte #{p.numParte}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{p.fecha}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {p.tipo}
                          </span>
                        </div>
                        <div className="text-white text-sm font-medium flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5 text-amber-400" />
                          <span>{p.codigoEquipo} - {p.marcaModelo}</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Operador: <span className="text-slate-200">{p.nombreApellido}</span> {p.novedades ? `• ${p.novedades}` : ''}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        {p.tipo === 'HORAS' ? (
                          <div>
                            <div className="text-emerald-400 font-bold text-sm">{p.horasTrabajadas || p.hsCantidad} hs</div>
                            <div className="text-[10px] text-slate-500">Trabajadas</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-blue-400 font-bold text-sm">{p.viajesCantidad || p.cantidad} viajes</div>
                            <div className="text-[10px] text-slate-500">{p.tipoMaterial || 'Material'}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onEdit(obra);
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2"
          >
            Editar Obra
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
