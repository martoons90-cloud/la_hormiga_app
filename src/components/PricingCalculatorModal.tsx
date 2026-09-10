import React, { useState } from 'react';
import { Vehicle } from '../types';
import { formatCurrency } from '../services/storage';
import { Calculator, Clock, Calendar, Check, X, ShieldAlert, Sparkles } from 'lucide-react';

interface PricingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: Vehicle[];
}

export const PricingCalculatorModal: React.FC<PricingCalculatorModalProps> = ({
  isOpen,
  onClose,
  fleet,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(fleet[0]?.id || '');
  const [rentalType, setRentalType] = useState<'DIAS' | 'HORAS'>('DIAS');
  const [duration, setDuration] = useState<number>(3); // 3 days or 8 hours
  const [includeOperator, setIncludeOperator] = useState(true);
  const [includeFuel, setIncludeFuel] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

  if (!isOpen) return null;

  const vehicle = fleet.find(v => v.id === selectedVehicleId) || fleet[0];

  const baseDailyRate = vehicle?.precioSugerido || 0;
  const baseHourlyRate = vehicle?.precioSugeridoHora || Math.round(baseDailyRate / 8);

  const operatorRateDaily = 35000;
  const operatorRateHourly = 5500;
  const fuelRateDaily = 25000;
  const fuelRateHourly = 4000;

  const baseRentalSubtotal = rentalType === 'DIAS' 
    ? baseDailyRate * duration 
    : baseHourlyRate * duration;

  const operatorSubtotal = includeOperator 
    ? (rentalType === 'DIAS' ? operatorRateDaily * duration : operatorRateHourly * duration)
    : 0;

  const fuelSubtotal = includeFuel 
    ? (rentalType === 'DIAS' ? fuelRateDaily * duration : fuelRateHourly * duration)
    : 0;

  const grossTotal = baseRentalSubtotal + operatorSubtotal + fuelSubtotal;
  const discountAmount = (grossTotal * discountPercent) / 100;
  const netTotal = grossTotal - discountAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#16191F] border border-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-black">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Cotizador Rápido de Alquiler (Días / Horas)
              </h3>
              <p className="text-xs text-amber-400">
                La Hormiga • Cálculo de tarifas comerciales para clientes
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* Select Machine */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Seleccionar Máquina / Camión:
            </label>
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-800 bg-[#0F1115] font-semibold text-sm text-white focus:border-amber-500 outline-hidden"
            >
              {fleet.map((v) => (
                <option key={v.id} value={v.id} className="bg-[#16191F] text-white">
                  [{v.codigoEquipo}] {v.modeloMarca} - {v.clasificacion} ({v.estado})
                </option>
              ))}
            </select>
          </div>

          {/* Rental Mode: Days vs Hours */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setRentalType('DIAS');
                if (duration > 30) setDuration(3);
              }}
              className={`p-3.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                rentalType === 'DIAS'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                  : 'bg-[#0F1115] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-sm">Alquiler por DÍAS</span>
              <span className="text-[11px] font-mono font-semibold text-slate-300">{formatCurrency(baseDailyRate)} / día</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRentalType('HORAS');
                if (duration > 24) setDuration(8);
              }}
              className={`p-3.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                rentalType === 'HORAS'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                  : 'bg-[#0F1115] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm">Alquiler por HORAS</span>
              <span className="text-[11px] font-mono font-semibold text-slate-300">{formatCurrency(baseHourlyRate)} / hora</span>
            </button>
          </div>

          {/* Duration Slider / Input */}
          <div className="p-4 rounded-xl bg-[#0F1115] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Cantidad de {rentalType === 'DIAS' ? 'Días' : 'Horas de Operación'}:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={rentalType === 'DIAS' ? 90 : 48}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
                  className="w-16 px-2 py-1 text-center font-bold text-sm rounded-md border border-slate-700 bg-slate-900 text-white"
                />
                <span className="text-xs font-bold text-slate-400">{rentalType === 'DIAS' ? 'días' : 'hs'}</span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max={rentalType === 'DIAS' ? 30 : 24}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Add-ons: Operator & Fuel */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Servicios Opcionales:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-[#0F1115] cursor-pointer">
                <span className="text-xs font-medium text-slate-300">Incluir Maquinista / Operador</span>
                <input
                  type="checkbox"
                  checked={includeOperator}
                  onChange={(e) => setIncludeOperator(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-[#0F1115] cursor-pointer">
                <span className="text-xs font-medium text-slate-300">Incluir Combustible / Fluidos</span>
                <input
                  type="checkbox"
                  checked={includeFuel}
                  onChange={(e) => setIncludeFuel(e.target.checked)}
                  className="accent-amber-500 w-4 h-4 rounded"
                />
              </label>
            </div>
          </div>

          {/* Breakdown summary */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-sm">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Alquiler base ({duration} {rentalType.toLowerCase()}):</span>
              <span className="font-mono text-slate-300">{formatCurrency(baseRentalSubtotal)}</span>
            </div>
            {includeOperator && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>Operador especializado:</span>
                <span className="font-mono text-slate-300">+{formatCurrency(operatorSubtotal)}</span>
              </div>
            )}
            {includeFuel && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>Combustible y fluidos:</span>
                <span className="font-mono text-slate-300">+{formatCurrency(fuelSubtotal)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-amber-500/30 flex justify-between items-baseline">
              <span className="font-bold text-white">Total Cotizado Estimado:</span>
              <span className="text-xl font-bold text-amber-400 font-mono">
                {formatCurrency(netTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#16191F] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
