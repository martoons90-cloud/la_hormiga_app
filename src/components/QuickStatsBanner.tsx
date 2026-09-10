import React from 'react';
import { Vehicle } from '../types';
import { formatCurrency } from '../services/storage';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  TrendingUp, 
  DollarSign 
} from 'lucide-react';

interface QuickStatsBannerProps {
  fleet: Vehicle[];
}

export const QuickStatsBanner: React.FC<QuickStatsBannerProps> = ({ fleet }) => {
  const total = fleet.length;
  const disponibles = fleet.filter(v => v.estado === 'DISPONIBLE').length;
  const alquilados = fleet.filter(v => v.estado === 'ALQUILADO').length;
  const enTaller = fleet.filter(v => v.estado === 'EN_MANTENIMIENTO' || v.estado === 'TALLER').length;
  
  const facturacionSugeridaTotal = fleet.reduce((acc, curr) => acc + (curr.precioSugerido || 0), 0);
  const costoTotalFlota = fleet.reduce((acc, curr) => acc + (curr.precioCosto || 0), 0);
  const margenPromedio = costoTotalFlota > 0 
    ? Math.round(((facturacionSugeridaTotal - costoTotalFlota) / facturacionSugeridaTotal) * 100)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Unidades */}
      <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl hover:border-slate-700 transition">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Unidades</div>
          <Truck className="w-4 h-4 text-slate-500" />
        </div>
        <div className="text-2xl font-bold mt-1 text-white font-mono">{total}</div>
        <div className="mt-1 text-[11px] text-slate-500">Parque completo activo</div>
      </div>

      {/* En Alquiler */}
      <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl hover:border-amber-500/40 transition">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">En Alquiler</div>
          <Clock className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold mt-1 text-amber-500 font-mono">{alquilados}</div>
        <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
          <span>En obras y clientes</span>
          <span className="text-amber-400 font-semibold">({total > 0 ? Math.round((alquilados / total) * 100) : 0}%)</span>
        </div>
      </div>

      {/* Mantenimiento */}
      <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl hover:border-red-500/40 transition">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mantenimiento</div>
          <Wrench className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-2xl font-bold mt-1 text-red-500 font-mono">
          {String(enTaller).padStart(2, '0')}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">En revisión o taller</div>
      </div>

      {/* Disponibles */}
      <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Disponibles</div>
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold mt-1 text-emerald-500 font-mono">
          {String(disponibles).padStart(2, '0')}
        </div>
        <div className="mt-1 text-[11px] text-emerald-500/80 font-medium">Entrega inmediata</div>
      </div>
    </div>
  );
};
