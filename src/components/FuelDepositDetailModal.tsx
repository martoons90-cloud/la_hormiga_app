import React, { useState } from 'react';
import { FuelDeposit, FuelVoucher } from '../types';
import { 
  X, 
  Fuel, 
  Truck, 
  Layers, 
  Ticket, 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3, 
  PlusCircle, 
  FileText,
  Activity,
  History,
  ShieldCheck,
  Building2,
  Trash2
} from 'lucide-react';

interface FuelDepositDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposit: FuelDeposit | null;
  vouchers: FuelVoucher[];
  onOpenEdit: (deposit: FuelDeposit) => void;
  onOpenRefill: (deposit: FuelDeposit) => void;
  onNewDispensaryFromDeposit: (deposit: FuelDeposit) => void;
  onDelete: (id: string) => void;
}

export const FuelDepositDetailModal: React.FC<FuelDepositDetailModalProps> = ({
  isOpen,
  onClose,
  deposit,
  vouchers,
  onOpenEdit,
  onOpenRefill,
  onNewDispensaryFromDeposit,
  onDelete,
}) => {
  if (!isOpen || !deposit) return null;

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const currentStock = deposit.stockActual || 0;
  const totalCap = deposit.capacidadTotal || 1;
  const pct = Math.min(100, Math.max(0, Math.round((currentStock / totalCap) * 100)));

  // Associated dispatches from this deposit
  const relatedDispatches = vouchers.filter(v => 
    (v.deposito && v.deposito.toLowerCase().includes(deposit.nombre.toLowerCase())) ||
    (v.deposito && v.deposito.toLowerCase().includes(deposit.codigo.toLowerCase())) ||
    (v.numEstacion && deposit.numEstacionConvenio && v.numEstacion.toLowerCase().includes(deposit.numEstacionConvenio.toLowerCase())) ||
    (deposit.modalidad === 'DEPOSITO_AMBULANTE' && deposit.patenteVehiculo && v.patente === deposit.patenteVehiculo)
  );

  const totalDeliveredLiters = relatedDispatches.reduce((sum, v) => sum + (v.cantidad || 0), 0);

  const isLowStock = currentStock <= (deposit.nivelAlertaMinimo || 500);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-[#16191F] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#1E232D] border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              deposit.modalidad === 'DEPOSITO_AMBULANTE'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : deposit.modalidad === 'BIDONES'
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-purple-500/20 border-purple-500/40 text-purple-400'
            }`}>
              {deposit.modalidad === 'DEPOSITO_AMBULANTE' && <Truck className="w-5 h-5" />}
              {deposit.modalidad === 'BIDONES' && <Layers className="w-5 h-5" />}
              {deposit.modalidad === 'VALES_ESTACION' && <Ticket className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white uppercase tracking-tight">
                  {deposit.nombre}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {deposit.id}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                  deposit.estado === 'OPERATIVO'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                    : deposit.estado === 'BAJO_STOCK'
                      ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                      : 'bg-rose-950/60 text-rose-400 border-rose-800'
                }`}>
                  {deposit.estado === 'OPERATIVO' && '🟢 OPERATIVO'}
                  {deposit.estado === 'BAJO_STOCK' && '🟡 BAJO STOCK'}
                  {deposit.estado === 'EN_REPOSICION' && '🔵 EN REPOSICIÓN'}
                  {deposit.estado === 'FUERA_SERVICIO' && '🔴 FUERA DE SERVICIO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modalidad: <span className="text-white font-semibold">{deposit.modalidadLabel}</span> • {deposit.tipoCombustible}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Level Gauge & Quick KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Level Card */}
            <div className="md:col-span-2 bg-[#0F1115] border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Fuel className="w-4 h-4 text-amber-500" />
                  Nivel de Combustible Disponible
                </span>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  pct > 40 ? 'bg-emerald-500/20 text-emerald-400' : pct > 20 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {pct}% Lleno
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-extrabold font-mono text-white">
                  {currentStock.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ {totalCap.toLocaleString()} Litros</span>
              </div>

              {/* Tank Progress bar */}
              <div className="w-full h-4 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700 mb-3">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    pct > 40 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : pct > 20 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Alerta Mínima: {deposit.nivelAlertaMinimo} Lts</span>
                <span>Remanente: {(totalCap - currentStock).toLocaleString()} Lts</span>
              </div>

              {isLowStock && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>El stock está por debajo del umbral mínimo de seguridad. Se recomienda programar recarga inmediata.</span>
                </div>
              )}
            </div>

            {/* Quick Action Bento */}
            <div className="bg-[#0F1115] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
                  Acciones Operativas
                </span>
                <p className="text-[11px] text-slate-500">
                  Gestión de abastecimiento y despacho directo
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenRefill(deposit);
                  }}
                  className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{deposit.modalidad === 'VALES_ESTACION' ? 'Acreditar Cupo Vales' : 'Cargar / Reabastecer'}</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onNewDispensaryFromDeposit(deposit);
                  }}
                  className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Fuel className="w-4 h-4" />
                  <span>Nuevo Expendio con este Depósito</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenEdit(deposit);
                  }}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Parámetros</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Specs depending on Modality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Technical specs */}
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Especificaciones Técnicas</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Modalidad Oficial:</span>
                  <span className="font-bold text-white">{deposit.modalidadLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Tipo de Combustible:</span>
                  <span className="font-mono text-amber-400">{deposit.tipoCombustible} ({deposit.idCombustible})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Ubicación / Base:</span>
                  <span className="text-white text-right">{deposit.ubicacion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Responsable Asignado:</span>
                  <span className="text-white font-semibold">{deposit.responsableNombre || 'No asignado'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Costo Estimado $/Lt:</span>
                  <span className="font-mono text-emerald-400">${deposit.costoPorLitroEstimado?.toLocaleString()} ARS</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Última Recarga Registrada:</span>
                  <span className="font-mono text-white">{deposit.ultimaRecargaFecha || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Modality specifics */}
            <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>Detalle de la Modalidad ({deposit.modalidadLabel})</span>
              </h3>

              {deposit.modalidad === 'DEPOSITO_AMBULANTE' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Patente Vehículo Cisterna:</span>
                    <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {deposit.patenteVehiculo || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Código Flota Asignado:</span>
                    <span className="font-mono text-white">{deposit.codigoEquipo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Modelo del Camión:</span>
                    <span className="text-white">{deposit.marcaModeloCamion || 'Camión Cisterna Homologado'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                    🚚 Cisterna móvil habilitada para circular en ruta y abastecer maquinaria pesada en frentes de obra (retroexcavadoras, motoniveladoras, rodillos).
                  </p>
                </div>
              )}

              {deposit.modalidad === 'BIDONES' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Cantidad Total de Bidones:</span>
                    <span className="font-mono font-bold text-blue-400">{deposit.cantidadBidones || 20} unidades</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Capacidad por Unidad:</span>
                    <span className="font-mono text-white">{deposit.capacidadPorBidon || 20} Litros c/u</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Homologación:</span>
                    <span className="text-white">{deposit.tipoHomologacion || 'IRAM Antiestático'}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
                    🛢️ Bidones de alta seguridad para repostaje de minicargadoras, grupos electrógenos y herramientas de mano en pañol.
                  </p>
                </div>
              )}

              {deposit.modalidad === 'VALES_ESTACION' && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Bandera Petrolera:</span>
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300">
                      {deposit.empresaBandera || 'YPF'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Nº de Estación:</span>
                    <span className="font-mono font-bold text-white">{deposit.numEstacionConvenio || 'EST-01'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Establecimiento:</span>
                    <span className="text-white">{deposit.nombreEstacion || 'Estación de Servicio'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Nº Cuenta / Convenio:</span>
                    <span className="font-mono text-purple-400">{deposit.numeroCuentaConvenio || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Dirección:</span>
                    <span className="text-white text-right">{deposit.direccionEstacion || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observations */}
          {deposit.observaciones && (
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Notas / Observaciones:</span>
              <p>{deposit.observaciones}</p>
            </div>
          )}

          {/* Historical Dispatches Associated */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                <span>Historial de Despachos Registrados ({relatedDispatches.length})</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Total Despachado: <strong className="text-amber-400">{totalDeliveredLiters.toLocaleString()} Lts</strong>
              </span>
            </div>

            {relatedDispatches.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-500 text-xs">
                No hay registros de expendio vinculados a este depósito todavía.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">ID</th>
                        <th className="p-2.5">Fecha</th>
                        <th className="p-2.5">Equipo</th>
                        <th className="p-2.5">Chofer</th>
                        <th className="p-2.5">Litros</th>
                        <th className="p-2.5">Km/Horas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {relatedDispatches.slice(0, 10).map((v) => (
                        <tr key={v.id} className="hover:bg-slate-900/60">
                          <td className="p-2.5 font-mono font-bold text-amber-400">{v.id}</td>
                          <td className="p-2.5 font-mono text-slate-400">{v.fecha}</td>
                          <td className="p-2.5 font-semibold text-white">{v.codigoEquipo || v.patente}</td>
                          <td className="p-2.5 text-slate-300">{v.nombreApellido || 'Chofer'}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-400">{v.cantidad} L</td>
                          <td className="p-2.5 font-mono text-slate-400">{v.kilometraje?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#1E232D] border-t border-slate-700/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Cerrar Ficha
          </button>

          <div className="flex items-center gap-2">
            {confirmingDelete ? (
              <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-500/50 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-rose-200 font-medium">¿Eliminar depósito?</span>
                <button
                  onClick={() => {
                    onDelete(deposit.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded transition cursor-pointer"
                >
                  Sí, eliminar
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenEdit(deposit);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Modificar Depósito</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
