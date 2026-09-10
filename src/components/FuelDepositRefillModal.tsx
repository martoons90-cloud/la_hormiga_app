import React, { useState } from 'react';
import { FuelDeposit } from '../types';
import { 
  X, 
  Plus, 
  Fuel, 
  Truck, 
  Layers, 
  Ticket, 
  Calendar, 
  FileText, 
  DollarSign, 
  CheckCircle2 
} from 'lucide-react';

interface FuelDepositRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposit: FuelDeposit | null;
  onConfirmRefill: (depositId: string, addedLiters: number, newStock: number, refillDate: string, notes: string) => void;
}

export const FuelDepositRefillModal: React.FC<FuelDepositRefillModalProps> = ({
  isOpen,
  onClose,
  deposit,
  onConfirmRefill,
}) => {
  if (!isOpen || !deposit) return null;

  const [addedLiters, setAddedLiters] = useState<number>(
    deposit.modalidad === 'BIDONES' 
      ? (deposit.capacidadTotal - deposit.stockActual) 
      : Math.min(2000, Math.max(0, deposit.capacidadTotal - deposit.stockActual))
  );
  const [refillDate, setRefillDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [supplierNotes, setSupplierNotes] = useState<string>('');

  const currentStock = deposit.stockActual || 0;
  const maxCap = deposit.capacidadTotal || 1;
  const newCalculatedStock = Math.min(maxCap, currentStock + Number(addedLiters || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addedLiters <= 0) return;

    onConfirmRefill(
      deposit.id,
      Number(addedLiters),
      newCalculatedStock,
      refillDate,
      supplierNotes
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div 
        className="bg-[#16191F] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#1E232D] border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                {deposit.modalidad === 'VALES_ESTACION' ? 'Acreditación / Renovación de Cupo' : 'Registrar Recarga de Combustible'}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {deposit.id} • {deposit.nombre}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Status Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Modalidad:</span>
              <span className="text-white font-bold">{deposit.modalidadLabel}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Stock Actual Disponible:</span>
              <span className="text-amber-400 font-mono font-bold">{currentStock.toLocaleString()} Lts</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Capacidad / Cupo Máximo:</span>
              <span className="text-white font-mono">{maxCap.toLocaleString()} Lts</span>
            </div>

            {/* Progress Visual */}
            <div className="mt-2 space-y-1">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                <div 
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${Math.min(100, (currentStock / maxCap) * 100)}%` }}
                />
                <div 
                  className="bg-emerald-400 h-full transition-all"
                  style={{ width: `${Math.min(100 - (currentStock / maxCap) * 100, ((addedLiters || 0) / maxCap) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Stock Actual ({Math.round((currentStock / maxCap) * 100)}%)</span>
                <span className="text-emerald-400 font-bold">Nuevo: {newCalculatedStock.toLocaleString()} Lts ({Math.round((newCalculatedStock / maxCap) * 100)}%)</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              {deposit.modalidad === 'VALES_ESTACION' ? 'Litros a Acreditar en Vales' : 'Litros Despachados / Cargados'} <span className="text-amber-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max={maxCap}
                value={addedLiters}
                onChange={(e) => setAddedLiters(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-lg text-white font-bold font-mono focus:border-emerald-500 outline-hidden"
              />
              <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">LITROS</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Fecha de Recarga / Acreditación
            </label>
            <input
              type="date"
              value={refillDate}
              onChange={(e) => setRefillDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Remito / Factura / Proveedor Cisterna
            </label>
            <input
              type="text"
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              placeholder="ej: Remito YPF Directo Nº 0041-0008412 - Cisterna Axion"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Quick buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setAddedLiters(Math.max(0, maxCap - currentStock))}
              className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
            >
              Llenar al 100% (+{(maxCap - currentStock).toLocaleString()} Lts)
            </button>
            <button
              type="button"
              onClick={() => setAddedLiters(1000)}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
            >
              +1.000 L
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Recarga</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
