import React, { useState } from 'react';
import { Vehicle, FuelDispensary } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  X, 
  Truck, 
  Calendar, 
  Clock, 
  Fuel, 
  TrendingUp, 
  Gauge, 
  FileText, 
  User, 
  MapPin,
  BarChart3,
  Activity,
  Droplet,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface VehicleFuelAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleCode: string | null;
  fleet: Vehicle[];
  vouchers: FuelDispensary[];
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
  const [yr, mo] = yearMonth.split('-');
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = months[parseInt(mo, 10) - 1] || mo;
  return `${monthName} ${yr}`;
}

function CustomizedDot(props: any) {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;

  if (payload?.isAnomaly) {
    return (
      <svg x={cx - 8} y={cy - 8} width={16} height={16} viewBox="0 0 24 24" fill="#EF4444" stroke="#ffffff" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    );
  }

  return (
    <circle cx={cx} cy={cy} r={4} fill="#F59E0B" stroke="#1E293B" strokeWidth={1} />
  );
}

export const VehicleFuelAnalyticsModal: React.FC<VehicleFuelAnalyticsModalProps> = ({
  isOpen,
  onClose,
  vehicleCode,
  fleet,
  vouchers,
}) => {
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [tolerancePct, setTolerancePct] = useState<number>(25);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  if (!isOpen || !vehicleCode) return null;

  // Find vehicle in fleet or fallback
  const targetCode = (vehicleCode || '').toLowerCase().trim();
  const vehicle = fleet.find(f => 
    (f.id && f.id.toLowerCase().trim() === targetCode) ||
    (f.patente && f.patente.toLowerCase().trim() === targetCode && f.patente.trim() !== 'S/P')
  );

  // Filter vouchers for this specific vehicle precisely
  const rawMatched = vouchers.filter(v => {
    const vEq = (v.codigoEquipo || '').toLowerCase().trim();
    const vPat = (v.patente || '').toLowerCase().trim();

    if (vEq && vEq === targetCode) return true;
    if (vPat && targetCode && vPat === targetCode && vPat !== 's/p') return true;
    if (vehicle) {
      if (vehicle.id && vEq === vehicle.id.toLowerCase().trim()) return true;
      if (vehicle.patente && vPat && vehicle.patente.trim() !== 'S/P' && vPat === vehicle.patente.toLowerCase().trim()) return true;
    }
    return false;
  });

  // Sort chronological oldest to newest for progressive odometer / km calculation
  const chronological = [...rawMatched].sort((a, b) => {
    const timeA = parseDateToTimestamp(a.fecha, a.hora);
    const timeB = parseDateToTimestamp(b.fecha, b.hora);
    if (timeA !== timeB) return timeA - timeB;
    return (a.numOrden || '').localeCompare(b.numOrden || '');
  });

  // Fallback data if vehicle not explicitly in fleet
  const vehicleName = vehicle?.modeloMarca || chronological[0]?.marcaModelo || vehicleCode;
  const vehiclePlate = vehicle?.patente || chronological[0]?.patente || 'S/P';
  const vehicleClass = vehicle?.clasificacion || chronological[0]?.clasificacion || 'EQUIPO DE FLOTA';
  const vehiclePhoto = vehicle?.fotografia || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
  const vehicleStatus = vehicle?.estado || 'DISPONIBLE';

  const combinedVehicleText = `${vehicle?.modeloMarca || ''} ${vehicle?.clasificacion || ''} ${vehicleName || ''}`.toUpperCase();
  const isHoursMachine = combinedVehicleText.includes('MAQUINARIA') || 
                         combinedVehicleText.includes('TRACTOR') ||
                         combinedVehicleText.includes('GRUPO') ||
                         combinedVehicleText.includes('EXCAVADORA') ||
                         combinedVehicleText.includes('PALTA') ||
                         combinedVehicleText.includes('RETRO');
  const unitLabel = isHoursMachine ? 'hrs/L' : 'km/L';

  // Enrich with calculated Kms Recorridos and Autonomia (ignoring invalid or zero values)
  let prevOdo: number | null = null;
  const enrichedVouchers = chronological.map((v) => {
    const rawLiters = v.cantidad !== undefined ? v.cantidad : (v.cantCarga || 0);
    const litros = Math.abs(rawLiters);
    const odo = v.kilometraje ?? v.kmsHs ?? 0;
    
    let kmsRec = v.kilometrosRec;
    if ((!kmsRec || kmsRec === 0) && prevOdo !== null && odo > prevOdo) {
      kmsRec = odo - prevOdo;
    }
    if (odo > 0) {
      prevOdo = odo;
    }

    let autonom = '-';
    let numericAutonom = 0;

    // RULE: If kmsRec or litros is 0 or missing, do NOT compute or take into account that autonomy
    if (kmsRec && kmsRec > 0 && litros > 0) {
      numericAutonom = kmsRec / litros;
      autonom = `${numericAutonom.toFixed(2).replace('.', ',')} ${unitLabel}`;
    } else {
      const rawAuton = v.autonom || v.autonomiaVt;
      if (rawAuton && rawAuton.toUpperCase() !== 'NORMAL' && rawAuton !== '-' && rawAuton !== '0,00' && rawAuton !== '0') {
        const parsed = parseFloat(rawAuton.replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) {
          numericAutonom = parsed;
          autonom = `${parsed.toFixed(2).replace('.', ',')} ${unitLabel}`;
        }
      }
    }

    return {
      ...v,
      computedKmsRec: kmsRec || 0,
      computedAutonom: autonom,
      numericAutonom,
      litrosVal: litros,
      odoVal: odo
    };
  });

  const availableMonths = Array.from(new Set(enrichedVouchers.map(v => getYearMonth(v.fecha)).filter(Boolean))).sort().reverse();

  const monthFilteredVouchers = selectedMonth === 'all'
    ? enrichedVouchers
    : enrichedVouchers.filter(v => getYearMonth(v.fecha) === selectedMonth);

  // Finally sort according to user preference (descending or ascending)
  const vehicleVouchersUnfiltered = [...monthFilteredVouchers].sort((a, b) => {
    const timeA = parseDateToTimestamp(a.fecha, a.hora);
    const timeB = parseDateToTimestamp(b.fecha, b.hora);
    if (timeA !== timeB) {
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    }
    const cmp = (b.numOrden || '').localeCompare(a.numOrden || '');
    return sortOrder === 'desc' ? cmp : -cmp;
  });

  // Compute stats (robustly filtering out scattered outliers to find the core group average)
  const totalLiters = vehicleVouchersUnfiltered.reduce((sum, v) => sum + v.litrosVal, 0);
  const totalLoads = vehicleVouchersUnfiltered.length;

  let avgEfficiencyNum = 0;
  const validVouchersForAvg = vehicleVouchersUnfiltered.filter(v => v.computedKmsRec > 0 && v.litrosVal > 0 && v.numericAutonom > 0);
  if (validVouchersForAvg.length > 0) {
    const autons = validVouchersForAvg.map(v => v.numericAutonom).sort((a, b) => a - b);
    let coreAutons = autons;
    
    // Gap-based clustering / outlier separation for distinct clusters (e.g. separating "0 y algo" from "2 y algo")
    if (autons.length >= 3) {
      let maxGap = -1;
      let maxGapIndex = -1;
      for (let i = 0; i < autons.length - 1; i++) {
        const gap = autons[i + 1] - autons[i];
        if (gap > maxGap) {
          maxGap = gap;
          maxGapIndex = i;
        }
      }

      const medianVal = autons[Math.floor(autons.length / 2)];
      if (maxGap > medianVal * 0.35 || (autons.length >= 4 && maxGap > (autons[autons.length - 1] - autons[0]) * 0.25)) {
        const lowerGroup = autons.slice(0, maxGapIndex + 1);
        const upperGroup = autons.slice(maxGapIndex + 1);
        
        if (upperGroup.length >= lowerGroup.length || upperGroup.length >= 2) {
          coreAutons = upperGroup;
        } else {
          coreAutons = lowerGroup;
        }
      }
    } else if (autons.length >= 4) {
      const q1 = autons[Math.floor(autons.length * 0.25)];
      const q3 = autons[Math.floor(autons.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      const filtered = autons.filter(val => val >= lowerBound && val <= upperBound);
      if (filtered.length > 0) {
        coreAutons = filtered;
      }
    }

    const sumCore = coreAutons.reduce((acc, val) => acc + val, 0);
    avgEfficiencyNum = sumCore / coreAutons.length;
  }

  const lowerLimit = avgEfficiencyNum > 0 ? avgEfficiencyNum * (1 - tolerancePct / 100) : 0;
  const upperLimit = avgEfficiencyNum > 0 ? avgEfficiencyNum * (1 + tolerancePct / 100) : 0;

  const vehicleVouchers = vehicleVouchersUnfiltered.map(v => {
    const isAnomaly = avgEfficiencyNum > 0 && v.numericAutonom > 0 && (v.numericAutonom < lowerLimit || v.numericAutonom > upperLimit);
    return {
      ...v,
      isAnomaly
    };
  });

  const anomalyCount = vehicleVouchers.filter(v => v.isAnomaly).length;

  // Latest autonomy: find the most recent voucher with a valid computed efficiency or fallback to avg efficiency
  const latestValidVoucher = vehicleVouchers.find(v => v.computedAutonom && v.computedAutonom !== '-' && !v.computedAutonom.startsWith('0,00'));
  let currentAutonomy = latestValidVoucher?.computedAutonom || '';
  if ((!currentAutonomy || currentAutonomy === '-' || currentAutonomy.startsWith('0,00')) && avgEfficiencyNum > 0) {
    currentAutonomy = `${avgEfficiencyNum.toFixed(2).replace('.', ',')} ${unitLabel}`;
  }
  if (!currentAutonomy || currentAutonomy === '-') {
    currentAutonomy = `0,00 ${unitLabel}`;
  }

  const latestVoucher = vehicleVouchers[0];
  const lastOdometer = latestVoucher?.odoVal || vehicle?.horometro || 0;

  // Prepare chart data (reverse chronological to chronological for chart)
  const chartData = [...vehicleVouchers]
    .reverse()
    .map(v => ({
      fecha: `${v.fecha || ''} ${v.hora || ''}`.trim() || 'Carga',
      litros: v.litrosVal,
      autonomia: v.numericAutonom > 0 ? Number(v.numericAutonom.toFixed(2)) : null,
      isAnomaly: v.isAnomaly
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-[#16191F] border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-[#1E232D] to-[#12151B] p-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-slate-700 shrink-0 shadow-lg">
              <img
                src={vehiclePhoto}
                alt={vehicleName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs font-mono">
                  {vehicleCode}
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  • {vehicleClass}
                </span>
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                  Patente: {vehiclePlate}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {vehicleName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={vehicleStatus} size="lg" />
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700 cursor-pointer shadow"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#101217]">
          
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-amber-500/20">
                <Gauge className="w-12 h-12" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Autonomía (Prom. / Última)</span>
              <div className="mt-1 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Prom:</span>
                  <span className="text-lg font-black font-mono text-amber-400">{avgEfficiencyNum > 0 ? `${avgEfficiencyNum.toFixed(2).replace('.', ',')} ${unitLabel}` : `0,00 ${unitLabel}`}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Última:</span>
                  <span className="text-lg font-black font-mono text-white">{vehicleVouchers[0]?.computedAutonom || `0,00 ${unitLabel}`}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Promedio del período vs última carga</p>
            </div>

            <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-blue-500/20">
                <Droplet className="w-12 h-12" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Litros (Prom. Carga / Última)</span>
              <div className="mt-1 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Prom:</span>
                  <span className="text-lg font-black font-mono text-blue-400">{totalLoads > 0 ? `${(totalLiters / totalLoads).toFixed(1).replace('.', ',')} L` : '0 L'}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-slate-400">Última:</span>
                  <span className="text-lg font-black font-mono text-white">{vehicleVouchers[0] ? `${vehicleVouchers[0].litrosVal} L` : '0 L'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Promedio por carga y última recarga</p>
            </div>

            <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-emerald-500/20">
                <Fuel className="w-12 h-12" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cargas Registradas</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-black font-mono text-emerald-400">{totalLoads}</p>
                <span className="text-xs text-slate-400 font-medium">operaciones</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">En el período analizado</p>
            </div>

            <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 text-purple-500/20">
                <Activity className="w-12 h-12" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Último Odómetro / Horómetro</span>
              <div className="flex items-baseline gap-2 mt-1">
                <p className="text-2xl font-black font-mono text-purple-400">{Number(lastOdometer).toLocaleString('es-AR')}</p>
                <span className="text-xs text-slate-400 font-medium">km / hs</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Registrado en última carga</p>
            </div>
          </div>

          {/* Controles Compactos: Período y Límites de Autonomía */}
          <div className="bg-[#16191F] border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Filtro Mes */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer w-full sm:w-auto"
                >
                  <option value="all">📅 Todos los meses (Histórico)</option>
                  {availableMonths.map(m => (
                    <option key={m} value={m}>📅 {formatMonthName(m)}</option>
                  ))}
                </select>
                {selectedMonth !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMonth('all')}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition border border-slate-700 cursor-pointer whitespace-nowrap"
                  >
                    Ver Todos
                  </button>
                )}
              </div>
            </div>

            {/* Control de Límites y Tolerancia */}
            <div className="flex flex-wrap items-center justify-end gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
                <span className={`w-2 h-2 rounded-full ${anomalyCount > 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                <span>Prom: <strong className="text-white">{avgEfficiencyNum > 0 ? avgEfficiencyNum.toFixed(2) : '0,00'}</strong></span>
                <span className="text-slate-500">|</span>
                <span>Rango (±{tolerancePct}%): <strong className="text-blue-400">{lowerLimit > 0 ? `${lowerLimit.toFixed(2)}-${upperLimit.toFixed(2)}` : 'N/D'}</strong></span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400 mr-1">Tolerancia:</span>
                {[15, 20, 25, 30].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTolerancePct(pct)}
                    className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                      tolerancePct === pct 
                        ? 'bg-amber-500 text-slate-950 shadow' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    ±{pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Section: Gráfico de Consumo y Autonomía */}
          <div className="bg-[#16191F] border border-slate-800 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Evolución de Consumo (Litros) y Autonomía</h3>
                  <p className="text-xs text-slate-400">Historial gráfico de las últimas cargas y rendimiento estimado</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                {chartData.length} registros analizados
              </span>
            </div>

            {chartData.length > 0 ? (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3D" />
                    <XAxis dataKey="fecha" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#60A5FA" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#FBBF24" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#12151B', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(value: any, name: string) => [
                        name === 'litros' ? `${value} L` : value,
                        name === 'litros' ? 'Litros Consumidos' : 'Autonomía'
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar yAxisId="left" dataKey="litros" name="Litros Consumidos" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={28} />
                    <Line yAxisId="right" type="monotone" dataKey="autonomia" name="Autonomía" stroke="#F59E0B" strokeWidth={3} dot={<CustomizedDot />} activeDot={{ r: 6 }} />
                    {lowerLimit > 0 && (
                      <ReferenceLine 
                        yAxisId="right" 
                        y={lowerLimit} 
                        stroke="#60A5FA" 
                        strokeDasharray="4 4" 
                        strokeOpacity={0.8}
                        label={{ value: `Límite Inferior (${lowerLimit.toFixed(2)})`, fill: '#60A5FA', fontSize: 10, position: 'insideBottomRight' }} 
                      />
                    )}
                    {upperLimit > 0 && (
                      <ReferenceLine 
                        yAxisId="right" 
                        y={upperLimit} 
                        stroke="#FBBF24" 
                        strokeDasharray="4 4" 
                        strokeOpacity={0.8}
                        label={{ value: `Límite Superior (${upperLimit.toFixed(2)})`, fill: '#FBBF24', fontSize: 10, position: 'insideTopRight' }} 
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-slate-500">
                <Fuel className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-medium">No hay registros de cargas suficientes para graficar</p>
              </div>
            )}
          </div>

          {/* Table Section: Listado de las Últimas Cargas */}
          <div className="bg-[#16191F] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Listado de las Últimas Cargas</h3>
                  <p className="text-xs text-slate-400">Historial completo de expendios y vales despachados a esta unidad</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/30">
                Total: {vehicleVouchers.length} registros
              </span>
            </div>

            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#12151B] text-slate-400 sticky top-0 uppercase tracking-wider font-semibold border-b border-slate-800 z-10">
                  <tr>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:bg-slate-800/80 transition select-none text-white"
                      onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                      title="Hacer clic para cambiar orden (Ascendente / Descendente)"
                    >
                      <div className="flex items-center gap-1.5">
                        Fecha / Hora
                        <span className="text-amber-400 font-bold">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                      </div>
                    </th>
                    <th className="py-3 px-4">Nº Orden / Ticket</th>
                    <th className="py-3 px-4">Depósito Origen</th>
                    <th className="py-3 px-4">Combustible</th>
                    <th className="py-3 px-4 text-right">Cantidad (L)</th>
                    <th className="py-3 px-4 text-right">Odómetro / Horó.</th>
                    <th className="py-3 px-4 text-right">Kms Rec.</th>
                    <th className="py-3 px-4 text-right">Autonomía</th>
                    <th className="py-3 px-4">Conductor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300 font-mono">
                  {vehicleVouchers.length > 0 ? (
                    vehicleVouchers.map((v) => {
                      return (
                        <tr key={v.id} className="hover:bg-slate-800/50 transition">
                          <td className="py-3 px-4 text-slate-300">
                            <div className="font-bold text-white">{v.fecha || '-'}</div>
                            <div className="text-[10px] text-slate-500">{v.hora || '00:00'}</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-amber-400">
                            {v.numOrden || v.numVale || v.id.slice(0, 8)}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-sans">{v.deposito || '-'}</td>
                          <td className="py-3 px-4 text-slate-300 font-sans font-medium">{v.tipoComb || '-'}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                            {Number(v.litrosVal).toLocaleString('es-AR')} L
                          </td>
                          <td className="py-3 px-4 text-right text-slate-300">
                            {v.odoVal > 0 ? Number(v.odoVal).toLocaleString('es-AR') : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-400">
                            {v.computedKmsRec > 0 ? `${Number(v.computedKmsRec).toLocaleString('es-AR')} km` : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-bold font-mono ${v.isAnomaly ? 'text-rose-400' : 'text-amber-400'}`}>
                                {v.computedAutonom}
                              </span>
                              {v.isAnomaly && (
                                <span className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded-md border border-rose-500/30 flex items-center gap-1 font-sans" title={`Fuera del rango aceptable (Límites: ${lowerLimit.toFixed(2)} - ${upperLimit.toFixed(2)} ${unitLabel})`}>
                                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                                  Alarma
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-sans truncate max-w-[150px]">
                            {v.nombreApellido || v.codigoEmpleado || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 italic font-sans">
                        No se registran cargas de combustible para este vehículo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#12151B] border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Unidad: {vehicleCode} • Sistema de Gestión de Flota y Combustible
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow"
          >
            Cerrar Ficha Analítica
          </button>
        </div>
      </div>
    </div>
  );
};
