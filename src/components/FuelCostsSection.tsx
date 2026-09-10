import React, { useState } from 'react';
import { FuelDispensary, FuelDeposit, Vehicle } from '../types';
import { 
  DollarSign, 
  Calendar, 
  Fuel, 
  TrendingUp, 
  Download, 
  BarChart3, 
  Receipt, 
  FileSpreadsheet,
  CheckCircle2,
  Tag
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line
} from 'recharts';

interface FuelCostsSectionProps {
  fuelVouchers: FuelDispensary[];
  fleet: Vehicle[];
  deposits: FuelDeposit[];
  onExportCSV?: () => void;
}

function parseDateToTimestamp(dateStr?: string, timeStr?: string): number {
  if (!dateStr) return 0;
  let year = 1970, month = 0, day = 1;
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    }
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
    }
  }
  let hours = 0, minutes = 0;
  if (timeStr && timeStr.includes(':')) {
    const tParts = timeStr.split(':');
    hours = parseInt(tParts[0], 10) || 0;
    minutes = parseInt(tParts[1], 10) || 0;
  }
  return new Date(year, month, day, hours, minutes).getTime();
}

function getYearMonth(dateStr?: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
  } else if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      let yr = parts[2];
      if (yr.length === 2) yr = '20' + yr;
      const mo = parts[1].padStart(2, '0');
      return `${yr}-${mo}`;
    }
  }
  return '';
}

function formatMonthName(yearMonth: string): string {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [yr, mo] = yearMonth.split('-');
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = months[parseInt(mo, 10) - 1] || mo;
  return `${monthName} ${yr}`;
}

export const FuelCostsSection: React.FC<FuelCostsSectionProps> = ({
  fuelVouchers,
  fleet,
  deposits,
  onExportCSV
}) => {
  const [selectedFuelTypeFilter, setSelectedFuelTypeFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');

  // Filter only EGRESO (fuel consumption) records
  const consumptionVouchers = fuelVouchers.filter(v => 
    !v.tipo || v.tipo.toUpperCase() === 'EGRESO' || v.tipo.toUpperCase() === 'CONSUMO'
  );

  // 1. Determine the LAST TICKET price for each fuel type
  // Sort all vouchers chronologically to find the latest ticket per fuel type
  const sortedAllVouchers = [...fuelVouchers].sort((a, b) => {
    return parseDateToTimestamp(b.fecha, b.hora) - parseDateToTimestamp(a.fecha, a.hora);
  });

  const lastPriceMap: Record<string, { price: number; ticketNum: string; date: string }> = {};

  // First pass: look for explicit precioUnitario or totalImporte / cantidad in sorted (newest first)
  for (const v of sortedAllVouchers) {
    const fuelType = (v.tipoComb || v.combustible || 'Diesel General').trim().toUpperCase();
    if (!lastPriceMap[fuelType]) {
      let unitPrice = 0;
      if (v.precioUnitario && v.precioUnitario > 0) {
        unitPrice = v.precioUnitario;
      } else if (v.totalImporte && v.cantidad && v.cantidad > 0) {
        unitPrice = v.totalImporte / v.cantidad;
      }
      
      if (unitPrice > 0) {
        lastPriceMap[fuelType] = {
          price: unitPrice,
          ticketNum: v.numTicket || v.numComprobante || v.id,
          date: v.fecha || 'Reciente'
        };
      }
    }
  }

  // Fallback default prices if any fuel type lacks a ticket price
  const defaultPrices: Record<string, number> = {
    'DIESEL INFINIA': 1450,
    'INFINIA DIESEL': 1450,
    'DIESEL 500 (GRADO 2)': 1250,
    'DIESEL COMUN': 1250,
    'EURO DIESEL': 1500,
    'NAFTA SUPÉR': 1380,
    'NAFTA SÚPER': 1380,
    'NAFTA PREMIUM': 1550,
    'GNC / GLP': 650,
    'BIODIESEL': 1180
  };

  // Ensure all unique fuel types present have a price
  const allFuelTypes: string[] = Array.from(new Set(consumptionVouchers.map(v => (v.tipoComb || v.combustible || 'Diesel General').trim().toUpperCase())));
  
  for (const ft of allFuelTypes) {
    if (!lastPriceMap[ft]) {
      const def = defaultPrices[ft] || 1300;
      lastPriceMap[ft] = {
        price: def,
        ticketNum: 'Estimado Ref.',
        date: 'Base'
      };
    }
  }

  // 2. Aggregate consumption by Month and Fuel Type
  const monthlyAggregates: Record<string, { month: string; fuelType: string; totalLiters: number; unitPrice: number; totalCost: number; count: number }> = {};
  
  for (const v of consumptionVouchers) {
    const month = getYearMonth(v.fecha);
    if (!month) continue;
    const fuelType = (v.tipoComb || v.combustible || 'Diesel General').trim().toUpperCase();
    const key = `${month}__${fuelType}`;
    const liters = Math.abs(v.cantidad !== undefined ? v.cantidad : (v.cantCarga || 0));
    const unitPrice = lastPriceMap[fuelType]?.price || 1300;

    if (!monthlyAggregates[key]) {
      monthlyAggregates[key] = {
        month,
        fuelType,
        totalLiters: 0,
        unitPrice,
        totalCost: 0,
        count: 0
      };
    }
    monthlyAggregates[key].totalLiters += liters;
    monthlyAggregates[key].totalCost = monthlyAggregates[key].totalLiters * unitPrice;
    monthlyAggregates[key].count += 1;
  }

  const aggregateList = Object.values(monthlyAggregates).sort((a, b) => b.month.localeCompare(a.month));

  const availableMonths = Array.from(new Set(aggregateList.map(item => item.month))).sort().reverse();

  // Filtered list
  const filteredAggregates = aggregateList.filter(item => {
    if (selectedFuelTypeFilter !== 'all' && item.fuelType !== selectedFuelTypeFilter) return false;
    if (selectedMonthFilter !== 'all' && item.month !== selectedMonthFilter) return false;
    return true;
  });

  // Summary Metrics
  const totalCostAll = filteredAggregates.reduce((sum, item) => sum + item.totalCost, 0);
  const totalLitersAll = filteredAggregates.reduce((sum, item) => sum + item.totalLiters, 0);
  const totalTransactions = filteredAggregates.reduce((sum, item) => sum + item.count, 0);

  // Chart data: group by month for timeline chart
  const chartMap: Record<string, { month: string; label: string; totalCost: number; [key: string]: any }> = {};
  for (const item of filteredAggregates) {
    if (!chartMap[item.month]) {
      chartMap[item.month] = {
        month: item.month,
        label: formatMonthName(item.month),
        totalCost: 0
      };
    }
    chartMap[item.month].totalCost += item.totalCost;
    const ftKey = String(item.fuelType);
    chartMap[item.month][ftKey] = ((chartMap[item.month][ftKey] as number) || 0) + item.totalCost;
  }

  const chartData = Object.values(chartMap).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <DollarSign className="w-3.5 h-3.5" />
            Control Financiero • Costos de Combustible
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Análisis de Costos Mensuales
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Cálculo de inversión mensual valorizado automáticamente al precio unitario del <strong>último ticket rendido</strong> por cada tipo de combustible.
          </p>
        </div>

        <div className="flex items-center gap-2 z-10">
          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar Reporte</span>
            </button>
          )}
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Quick Summary Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-emerald-500/20">
            <DollarSign className="w-10 h-10" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Costo Total Valuado</span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black font-mono text-emerald-400">
              ${totalCostAll.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pesos argentinos (ARS) estimados</p>
        </div>

        <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-blue-500/20">
            <Fuel className="w-10 h-10" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Litros Consumidos</span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black font-mono text-blue-400">
              {totalLitersAll.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
            </p>
            <span className="text-xs text-slate-400 font-medium">Lts</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Volumen total despachado</p>
        </div>

        <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-amber-500/20">
            <Calendar className="w-10 h-10" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Períodos Activos</span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black font-mono text-amber-400">{availableMonths.length}</p>
            <span className="text-xs text-slate-400 font-medium">meses</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Meses con registros de carga</p>
        </div>

        <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-purple-500/20">
            <Receipt className="w-10 h-10" />
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cargas / Tickets</span>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black font-mono text-purple-400">{totalTransactions}</p>
            <span className="text-xs text-slate-400 font-medium">operaciones</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registros de expendio</p>
        </div>
      </div>

      {/* Pricing Reference Card (Último Ticket Rendido por Tipo) */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Precios de Referencia (Último Ticket Rendido)</h3>
            <p className="text-xs text-slate-400">Precio unitario vigente extraído del último ticket oficial por cada tipo de combustible</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(lastPriceMap).map(([ft, info]) => (
            <div key={ft} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-300 uppercase block truncate" title={ft}>{ft}</span>
                <p className="text-lg font-black font-mono text-amber-400 mt-1">
                  ${info.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">/ L</span>
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Ticket: {info.ticketNum}</span>
                <span>{info.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400">Filtrar por Mes:</span>
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">📅 Todos los meses</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>📅 {formatMonthName(m)}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400">Combustible:</span>
          <select
            value={selectedFuelTypeFilter}
            onChange={(e) => setSelectedFuelTypeFilter(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
          >
            <option value="all">⛽ Todos los combustibles</option>
            {allFuelTypes.map(ft => (
              <option key={ft} value={ft}>⛽ {ft}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-[#16191F] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Evolución de Costos Mensuales (ARS)</h3>
              <p className="text-xs text-slate-400">Inversión mensual acumulada por período</p>
            </div>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3D" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#10B981" fontSize={11} tickLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#12151B', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(value: any, name: string) => [
                    `$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    name === 'totalCost' ? 'Costo Total' : name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="totalCost" name="Costo Total Mensual (ARS)" fill="#10B981" radius={[6, 6, 0, 0]} barSize={36} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Monthly Table */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Detalle de Consumo y Costos por Mes y Tipo</h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {filteredAggregates.length} registros agrupados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Período (Mes)</th>
                <th className="py-3 px-4">Tipo de Combustible</th>
                <th className="py-3 px-4 text-center">Operaciones</th>
                <th className="py-3 px-4 text-right">Litros Consumidos</th>
                <th className="py-3 px-4 text-right">Precio Unitario Ref.</th>
                <th className="py-3 px-4 text-right">Costo Total (ARS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
              {filteredAggregates.length > 0 ? (
                filteredAggregates.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      {formatMonthName(item.month)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {item.fuelType}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {item.count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-400">
                      {item.totalLiters.toLocaleString('es-AR', { maximumFractionDigits: 1 })} L
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400">
                      ${item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      ${item.totalCost.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                    No se encontraron registros de consumo con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
