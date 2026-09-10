import React, { useState } from 'react';
import { FuelDispensary, FuelVoucherStatus, Vehicle, Employee, IssuedFuelVoucher } from '../types';
import { FuelVoucherStatusBadge } from './FuelVoucherStatusBadge';
import { IssuedVoucherDetailModal } from './IssuedVoucherDetailModal';
import { formatCurrency } from '../services/storage';
import { 
  X, 
  Edit3, 
  Printer, 
  Fuel, 
  Truck, 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  FileText, 
  Gauge, 
  DollarSign, 
  Check, 
  Copy,
  Hash,
  ShieldCheck,
  QrCode,
  Camera,
  Activity,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Ticket,
  Trash2
} from 'lucide-react';

interface FuelVoucherDetailModalProps {
  isOpen: boolean;
  voucher: FuelDispensary | null;
  fleet: Vehicle[];
  employees: Employee[];
  issuedVouchers?: IssuedFuelVoucher[];
  onClose: () => void;
  onEdit: (voucher: FuelDispensary) => void;
  onDelete?: (id: string) => void;
  onChangeStatus?: (id: string, newStatus: FuelVoucherStatus) => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
  onViewEmployee?: (employee: Employee) => void;
  onViewIssuedVoucher?: (voucher: IssuedFuelVoucher) => void;
}

export const FuelVoucherDetailModal: React.FC<FuelVoucherDetailModalProps> = ({
  isOpen,
  voucher,
  fleet,
  employees,
  issuedVouchers = [],
  onClose,
  onEdit,
  onDelete,
  onChangeStatus,
  onViewVehicle,
  onViewEmployee,
  onViewIssuedVoucher,
}) => {
  const [copied, setCopied] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [selectedIssuedVoucher, setSelectedIssuedVoucher] = useState<IssuedFuelVoucher | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  if (!isOpen || !voucher) return null;

  const matchedVehicle = fleet.find(
    v => v.codigoEquipo === voucher.codigoEquipo || v.patente === voucher.patente
  );
  const matchedEmployee = employees.find(
    e => e.codigoEmpleado === voucher.codigoEmpleado || e.nombreApellido?.toLowerCase() === voucher.nombreApellido?.toLowerCase() || e.legajo === voucher.legajo
  );

  const getLinkedIssuedVoucher = (v: FuelDispensary): IssuedFuelVoucher => {
    const orderNum = (v.numOrden || v.numVale || v.numComprobante || '').trim();
    const matched = issuedVouchers.find(iv => 
      (orderNum && (iv.numVale === orderNum || iv.numComprobante === orderNum)) ||
      (v.valeId && iv.id === v.valeId) ||
      (v.id && iv.expendioId === v.id)
    );

    if (matched) return matched;

    return {
      id: `VAL-${orderNum || v.id}`,
      numVale: orderNum || v.numOrden || '00000',
      numComprobante: orderNum || v.numOrden || '00000',
      fechaEmision: v.fecha || new Date().toISOString().slice(0, 10),
      horaEmision: v.hora || '08:00',
      codigoEquipo: v.codigoEquipo || matchedVehicle?.codigoEquipo || 'EQUIPO-01',
      marcaModelo: v.marcaModelo || matchedVehicle?.modeloMarca || 'Equipo de Flota',
      patente: v.patente || matchedVehicle?.patente || 'S/P',
      codigoEmpleado: v.codigoEmpleado || matchedEmployee?.codigoEmpleado || 'CH-001',
      nombreApellido: v.nombreApellido || matchedEmployee?.nombreApellido || 'Chofer Asignado',
      legajo: v.legajo || matchedEmployee?.legajo || 'LEG-000',
      tipoComb: v.tipoComb || 'DIESEL',
      idCombustible: v.idCombustible || 'COMB-D500',
      litrosAutorizados: v.litrosAutorizados || v.cantidad || 0,
      cantidad: v.cantidad || 0,
      litrosReales: v.cantidad || 0,
      tipoCarga: v.carga || 'Tanque Lleno',
      estacionSurtidor: v.deposito || v.numEstacion || 'Estación YPF / Shell Autorizada',
      numEstacion: v.numEstacion || '',
      estado: 'RENDIDO',
      expendioId: v.id,
      numTicket: v.numTicket || v.numEstacion || `TK-${orderNum}`,
      odometroCarga: v.kilometraje ?? v.kmsHs,
      odometroSalida: (v.kilometraje ?? v.kmsHs) ? Math.max(0, (v.kilometraje ?? v.kmsHs ?? 0) - (v.kilometrosRec || 0)) : undefined,
      fotoTicket: v.fotoExpendio,
      fotoOdometro: v.fotoKilometraje,
      importeTotal: v.totalImporte || ((v.cantidad || 0) * (v.precioUnitario || 1350)),
      fechaRendicion: v.fecha,
      horaRendicion: v.hora,
      observaciones: v.observaciones || `Vale vinculado al registro de expendio ${v.id}`
    };
  };

  const copyId = () => {
    navigator.clipboard.writeText(voucher.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#16191F] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="relative bg-black/90 p-6 border-b border-slate-800 overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Action buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={handlePrint}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-white transition border border-slate-700 cursor-pointer"
              title="Imprimir Comprobante de Despacho"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(voucher)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-amber-500 hover:text-black text-white transition border border-slate-700 cursor-pointer"
              title="Editar Expendio"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition border border-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-24">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Fuel className="w-5 h-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white font-mono tracking-tight">
                      {voucher.id}
                    </h2>
                    <button
                      onClick={copyId}
                      className="text-slate-500 hover:text-amber-400 transition"
                      title="Copiar ID"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Orden de Despacho: <strong className="text-white font-mono">{voucher.numOrden || 'S/N'}</strong> • La Hormiga Flotas
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-3xl font-black text-amber-400 font-mono">
                  {voucher.cantidad} <span className="text-sm font-normal text-slate-400">Lts</span>
                </span>
                <span className="block text-[11px] font-bold text-slate-300">
                  {voucher.tipoComb || 'Diesel 500'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Official 22-Column Inspection Grid */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Ficha Técnica de Expendio (22 Columnas)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {voucher.fecha} • {voucher.hora}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">1. ID</span>
                <span className="text-amber-400 font-black text-sm">{voucher.id}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">2. CARGA</span>
                <span className="text-white font-medium">{voucher.carga || 'Tanque Lleno'}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">3. TIPO</span>
                <span className="text-white font-medium">{voucher.tipo || 'Despacho Directo'}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">4. ID_COMBUSTIBLE</span>
                <span className="text-cyan-400 font-bold">{voucher.idCombustible || 'COMB-D500'}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 col-span-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">5. DEPOSITO / SURTIDOR</span>
                <span className="text-white font-medium truncate block">{voucher.deposito || voucher.numEstacion}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">6. CANTIDAD</span>
                <span className="text-amber-400 font-black text-sm">{voucher.cantidad} Lts</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">7. TIPO_COMB</span>
                <span className="text-slate-200 font-medium truncate block">{voucher.tipoComb}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">8. CODIGO_EMPLEADO</span>
                <span className="text-slate-300 font-bold">{voucher.codigoEmpleado}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 col-span-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">9. NOMBRE_APELLIDO</span>
                <span className="text-white font-bold truncate block">{voucher.nombreApellido}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">10. LEGAJO</span>
                <span className="text-slate-300 font-bold">{voucher.legajo}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">11. CODIGO_EQUIPO</span>
                <span className="text-amber-400 font-bold">{voucher.codigoEquipo}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 col-span-2">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">12. MARCA_MODELO</span>
                <span className="text-white font-medium truncate block">{voucher.marcaModelo}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">13. PATENTE</span>
                <span className="text-slate-200 font-bold">{voucher.patente}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">14. Nº DE ORDEN</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-white font-bold font-mono">{voucher.numOrden || 'S/N'}</span>
                  {voucher.numOrden && (
                    <button
                      type="button"
                      onClick={() => {
                        const linked = getLinkedIssuedVoucher(voucher);
                        if (onViewIssuedVoucher) {
                          onViewIssuedVoucher(linked);
                        } else {
                          setSelectedIssuedVoucher(linked);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition cursor-pointer shadow-xs"
                      title="Ver Vale de Combustible en Popup"
                    >
                      <Ticket className="w-3 h-3 stroke-[2.5]" />
                      <span>Ver Vale</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">15. FECHA</span>
                <span className="text-slate-200">{voucher.fecha}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">16. KILOMETRAJE / HS</span>
                <span className="text-white font-bold">{(voucher.kilometraje || 0).toLocaleString('es-AR')}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">17. HORA</span>
                <span className="text-slate-200">{voucher.hora}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">18. KILOMETROS_REC</span>
                <span className="text-emerald-400 font-black">+{voucher.kilometrosRec || 0} km</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">19. AUTONOM</span>
                <span className="text-cyan-300 font-bold">{voucher.autonom || '-'}</span>
              </div>

              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-[10px] text-slate-500 uppercase block font-bold">20. NUM_ESTACION</span>
                <span className="text-slate-300">{voucher.numEstacion}</span>
              </div>
            </div>
          </div>

          {/* Section: Photographs (21. FOTO_EXPENDIO & 22. FOTO_KILOMETRAJE) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              Comprobantes Fotográficos de Respaldo
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* 21. FOTO_EXPENDIO */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <span className="text-amber-400">21.</span> FOTO_EXPENDIO (Ticket / Comprobante)
                  </span>
                  {voucher.fotoExpendio && (
                    <button
                      onClick={() => setActivePhoto(voucher.fotoExpendio)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ampliar</span>
                    </button>
                  )}
                </div>

                {voucher.fotoExpendio ? (
                  <div 
                    onClick={() => setActivePhoto(voucher.fotoExpendio)}
                    className="relative rounded-lg overflow-hidden border border-slate-700/80 aspect-video bg-black/60 cursor-pointer group"
                  >
                    <img
                      src={voucher.fotoExpendio}
                      alt="Foto Expendio"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-black/80 rounded-lg text-xs font-bold text-white">
                        Hacer clic para ver en grande
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                    Sin foto de comprobante registrada
                  </div>
                )}
              </div>

              {/* 22. FOTO_KILOMETRAJE */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                    <span className="text-cyan-400">22.</span> FOTO_KILOMETRAJE (Odómetro / Horómetro)
                  </span>
                  {voucher.fotoKilometraje && (
                    <button
                      onClick={() => setActivePhoto(voucher.fotoKilometraje)}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Ampliar</span>
                    </button>
                  )}
                </div>

                {voucher.fotoKilometraje ? (
                  <div 
                    onClick={() => setActivePhoto(voucher.fotoKilometraje)}
                    className="relative rounded-lg overflow-hidden border border-slate-700/80 aspect-video bg-black/60 cursor-pointer group"
                  >
                    <img
                      src={voucher.fotoKilometraje}
                      alt="Foto Kilometraje"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="px-3 py-1.5 bg-black/80 rounded-lg text-xs font-bold text-white">
                        Hacer clic para ver en grande
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                    Sin foto de odómetro registrada
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Linked Fuel Voucher Quick Access Card */}
          {voucher.numOrden && (
            <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Comprobante de Vale Vinculado:</span>
                    <span className="text-sm font-black text-amber-400 font-mono">Nº {voucher.numOrden}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Este número de orden fue emitido como comprobante en el módulo de Vales y rendido en este expendio.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const linked = getLinkedIssuedVoucher(voucher);
                  if (onViewIssuedVoucher) {
                    onViewIssuedVoucher(linked);
                  } else {
                    setSelectedIssuedVoucher(linked);
                  }
                }}
                className="shrink-0 w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer active:scale-95"
              >
                <Ticket className="w-4 h-4 stroke-[2.5]" />
                <span>Ver Vale Nº {voucher.numOrden} (Popup)</span>
              </button>
            </div>
          )}

          {/* Linked Fleet & Employee Navigation Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedVehicle && onViewVehicle && (
              <button
                onClick={() => {
                  onClose();
                  onViewVehicle(matchedVehicle);
                }}
                className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 rounded-xl flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={matchedVehicle?.fotografia || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=400&q=80'}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Ver Ficha del Equipo</span>
                    <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                      [{matchedVehicle.codigoEquipo}] {matchedVehicle.modeloMarca}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition" />
              </button>
            )}

            {matchedEmployee && onViewEmployee && (
              <button
                onClick={() => {
                  onClose();
                  onViewEmployee(matchedEmployee);
                }}
                className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center justify-between transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={matchedEmployee.foto}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold uppercase block">Ver Ficha del Chofer</span>
                    <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition">
                      [{matchedEmployee.codigoEmpleado}] {matchedEmployee.nombreApellido}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
              </button>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Costo total estimado:{' '}
            <strong className="text-white font-mono">
              {formatCurrency(voucher.totalImporte || (voucher.cantidad * 1250))}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-500/40 rounded-lg p-1">
                  <span className="text-[11px] text-red-300 font-bold px-1.5">¿Eliminar registro?</span>
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
                  title="Eliminar este comprobante"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              )
            )}

            <button
              onClick={() => {
                onClose();
                onEdit(voucher);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>

      {/* Photo Lightbox Popup */}
      {activePhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh]">
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/80 hover:text-white rounded-lg bg-black/50 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activePhoto}
              alt="Foto Ampliada"
              className="max-h-[80vh] w-auto rounded-xl object-contain border border-slate-700 shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
      {/* Linked Issued Fuel Voucher Modal Popup */}
      <IssuedVoucherDetailModal
        isOpen={Boolean(selectedIssuedVoucher)}
        voucher={selectedIssuedVoucher}
        fleet={fleet}
        employees={employees}
        onClose={() => setSelectedIssuedVoucher(null)}
      />
    </div>
  );
};
