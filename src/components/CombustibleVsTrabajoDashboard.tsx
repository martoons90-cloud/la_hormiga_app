import React, { useState, useMemo } from 'react';
import { FuelDispensary, Vehicle } from '../types';
import { 
  Fuel, 
  Clock, 
  Search, 
  TrendingUp, 
  Truck,
  Filter,
  CheckSquare,
  Square,
  ChevronDown,
  Activity,
  FileText,
  Gauge,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface CombustibleVsTrabajoDashboardProps {
  fuelVouchers: FuelDispensary[];
  partesDiarios: any[];
  fleet: Vehicle[];
}

export const CombustibleVsTrabajoDashboard: React.FC<CombustibleVsTrabajoDashboardProps> = ({
  fuelVouchers,
  partesDiarios,
  fleet
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const [sortOrderVouchers, setSortOrderVouchers] = useState<'desc' | 'asc'>('desc');
  const [sortOrderPartes, setSortOrderPartes] = useState<'desc' | 'asc'>('desc');

  const parseDateToComparable = (dStr?: string) => {
    if (!dStr) return '00000000';
    let clean = dStr.trim();
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        return `${year}${month}${day}`;
      }
    } else if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}${parts[1]}${parts[2]}`;
      }
    }
    return clean;
  };

  // Helper to normalize date to YYYY-MM
  const parseMonth = (dStr?: string) => {
    if (!dStr) return 'Sin Fecha';
    let clean = dStr.trim();
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) year = `20${year}`;
        return `${year}-${month}`;
      }
    } else if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        return `${parts[0]}-${parts[1]}`;
      }
    }
    return 'Sin Fecha';
  };

  // Active dashboard fleet (mostrarEnDashboard !== false)
  const dashboardFleet = useMemo(() => {
    return fleet.filter(f => f.mostrarEnDashboard !== false);
  }, [fleet]);

  const hiddenVehicles = useMemo(() => {
    return fleet.filter(f => f.mostrarEnDashboard === false);
  }, [fleet]);

  const normalizeKey = (s?: string) => (s ? s.trim().toUpperCase().replace(/\s+/g, ' ') : '');
  const cleanAlpha = (s?: string) => (s ? s.replace(/[^A-Z0-9]/gi, '').toUpperCase() : '');

  const isAllSelected = selectedVehicleIds.length === 0;
  const isNoneSelected = selectedVehicleIds.length === 1 && selectedVehicleIds[0] === '__NONE__';

  // Strict check if a record (voucher or parte) belongs to a specific vehicle from fleet
  const isRecordOfVehicle = (record: any, veh: Vehicle): boolean => {
    if (!record || !veh) return false;

    const rVehicleId = normalizeKey(record.vehicleId);
    const rEq = normalizeKey(record.codigoEquipo || record.equipo);
    const rModel = normalizeKey(record.marcaModelo || record.modeloMarca);
    const rPat = normalizeKey(record.patente);
    const rPatClean = cleanAlpha(record.patente);
    const rEqClean = cleanAlpha(record.codigoEquipo || record.equipo);

    const vId = normalizeKey(veh.id);
    const vCode = normalizeKey(veh.codigoInterno);
    const vModel = normalizeKey(veh.modeloMarca);
    const vPat = normalizeKey(veh.patente);
    const vPatClean = cleanAlpha(veh.patente);
    const vIdClean = cleanAlpha(veh.id);

    // 1. Direct explicit vehicleId match
    if (rVehicleId && (rVehicleId === vId || rVehicleId === vIdClean)) return true;

    // 2. Direct match on ID
    if (rEq && (rEq === vId || rEqClean === vIdClean)) return true;
    if (rPat && (rPat === vId || rPatClean === vIdClean)) return true;

    // 3. Exact match with vehicle's modeloMarca
    if (rEq && vModel && rEq === vModel) return true;
    if (rModel && vModel && rModel === vModel) return true;

    // 4. Exact match with internal code (codigoInterno)
    if (vCode) {
      if (rEq && rEq === vCode) return true;
      if (rModel && rModel === vCode) return true;
    }

    // 5. Exact match with license plate (patente) - ignore placeholders like 'S/P', 'SP', 'SIN PATENTE'
    const isSpecialPlate = (p: string) => !p || p === 'SP' || p === 'S/P' || p === 'SIN PATENTE' || p === 'SINPATENTE';
    if (vPat && !isSpecialPlate(vPat)) {
      if (rPat && !isSpecialPlate(rPat)) {
        if (rPat === vPat || (rPatClean.length >= 4 && rPatClean === vPatClean)) return true;
      }
      if (rEq && !isSpecialPlate(rEq)) {
        if (rEq === vPat || (rEqClean.length >= 4 && rEqClean === vPatClean)) return true;
      }
    }

    return false;
  };

  // Helper to check if a voucher or parte strictly matches selected vehicles
  const matchesFilter = (record: any) => {
    if (isNoneSelected) return false;

    if (!isAllSelected) {
      const targetIds = selectedVehicleIds.filter(id => id !== '__NONE__');
      if (targetIds.length === 0) return false;

      const targetVehicles = fleet.filter(f => targetIds.includes(f.id));
      const matchesFleetVeh = targetVehicles.some(veh => isRecordOfVehicle(record, veh));
      if (matchesFleetVeh) return true;

      // Direct exact match on selectedVehicleIds
      const rEq = normalizeKey(record.codigoEquipo || record.equipo);
      const rPat = normalizeKey(record.patente);
      const rModel = normalizeKey(record.marcaModelo || record.modeloMarca);
      return targetIds.some(id => {
        const uId = normalizeKey(id);
        return (rEq && rEq === uId) || (rPat && rPat !== 'S/P' && rPat === uId) || (rModel && rModel === uId);
      });
    }

    // If "All vehicles", exclude if belongs to hidden vehicle
    if (hiddenVehicles.length > 0) {
      const isHidden = hiddenVehicles.some(veh => isRecordOfVehicle(record, veh));
      if (isHidden) return false;
    }

    return true;
  };

  // Annotated fuel vouchers with global chronological kilometraje delta calculation per vehicle
  const annotatedFuelVouchers = useMemo(() => {
    const sorted = [...fuelVouchers].sort((a, b) => {
      const dateA = parseDateToComparable(a.fecha);
      const dateB = parseDateToComparable(b.fecha);
      return dateA.localeCompare(dateB);
    });
    const lastKmsMap = new Map<string, number>();

    return sorted.map(v => {
      const code = (v.codigoEquipo || v.patente || '').trim().toUpperCase();
      const kms = Number(v.kilometraje || v.kmsHs || v.horometroOdometro || 0);
      let delta = 0;
      if (code && kms > 0) {
        const prev = lastKmsMap.get(code) || 0;
        if (prev > 0 && kms >= prev) {
          delta = kms - prev;
        }
        lastKmsMap.set(code, kms);
      }
      return {
        ...v,
        recorridoCalculado: delta
      };
    });
  }, [fuelVouchers]);

  const activeVouchers = useMemo(() => {
    return annotatedFuelVouchers.filter(v => matchesFilter(v));
  }, [annotatedFuelVouchers, fleet, selectedVehicleIds, hiddenVehicles]);

  const activePartes = useMemo(() => {
    return partesDiarios.filter(p => matchesFilter(p));
  }, [partesDiarios, fleet, selectedVehicleIds, hiddenVehicles]);

  // Filtered vouchers and partes by selected month
  const filteredVouchers = useMemo(() => {
    return activeVouchers.filter(v => {
      const month = parseMonth(v.fecha);
      if (selectedMonth !== 'ALL' && month !== selectedMonth) return false;
      return true;
    }).sort((a, b) => {
      const dateA = parseDateToComparable(a.fecha);
      const dateB = parseDateToComparable(b.fecha);
      const cmp = dateA.localeCompare(dateB);
      return sortOrderVouchers === 'desc' ? -cmp : cmp;
    });
  }, [activeVouchers, selectedMonth, sortOrderVouchers]);

  const filteredPartes = useMemo(() => {
    return activePartes.filter(p => {
      const month = parseMonth(p.fecha);
      if (selectedMonth !== 'ALL' && month !== selectedMonth) return false;
      return true;
    }).sort((a, b) => {
      const dateA = parseDateToComparable(a.fecha);
      const dateB = parseDateToComparable(b.fecha);
      const cmp = dateA.localeCompare(dateB);
      return sortOrderPartes === 'desc' ? -cmp : cmp;
    });
  }, [activePartes, selectedMonth, sortOrderPartes]);

  // Available months
  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    fuelVouchers.forEach(v => {
      const m = parseMonth(v.fecha);
      if (m && m !== 'Sin Fecha') s.add(m);
    });
    partesDiarios.forEach(p => {
      const m = parseMonth(p.fecha);
      if (m && m !== 'Sin Fecha') s.add(m);
    });
    return Array.from(s).sort().reverse();
  }, [fuelVouchers, partesDiarios]);

  const getWeekLabel = (dStr?: string) => {
    if (!dStr) return 'Semana 1';
    let clean = dStr.trim();
    let dayNum = 1;
    if (clean.includes('/')) {
      const parts = clean.split('/');
      if (parts.length === 3) {
        dayNum = parseInt(parts[0], 10) || 1;
      }
    } else if (clean.includes('-')) {
      const parts = clean.split('-');
      if (parts.length === 3) {
        dayNum = parseInt(parts[2], 10) || 1;
      }
    }
    const weekNum = Math.min(Math.ceil(dayNum / 7), 5);
    return `Semana ${weekNum}`;
  };

  // Chart data calculation
  const chartData = useMemo(() => {
    if (selectedMonth === 'ALL') {
      const monthMap = new Map<string, { label: string; litros: number; horas: number; recorridoDelta: number }>();

      filteredVouchers.forEach(v => {
        const month = parseMonth(v.fecha);
        if (month === 'Sin Fecha') return;

        if (!monthMap.has(month)) {
          monthMap.set(month, { label: month, litros: 0, horas: 0, recorridoDelta: 0 });
        }
        const item = monthMap.get(month)!;
        item.litros += Math.abs(Number(v.cantidad || 0));
        item.recorridoDelta += Number(v.recorridoCalculado || 0);
      });

      filteredPartes.forEach(p => {
        const month = parseMonth(p.fecha);
        if (month === 'Sin Fecha') return;

        if (!monthMap.has(month)) {
          monthMap.set(month, { label: month, litros: 0, horas: 0, recorridoDelta: 0 });
        }
        monthMap.get(month)!.horas += Number(p.horasTrabajadas || p.hsCantidad || 0);
      });

      return Array.from(monthMap.values()).sort((a, b) => a.label.localeCompare(b.label));
    } else {
      const weeks = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];
      const weekMap = new Map<string, { label: string; litros: number; horas: number; recorridoDelta: number }>();
      weeks.forEach(w => weekMap.set(w, { label: w, litros: 0, horas: 0, recorridoDelta: 0 }));

      filteredVouchers.forEach(v => {
        const wLabel = getWeekLabel(v.fecha);
        if (weekMap.has(wLabel)) {
          const item = weekMap.get(wLabel)!;
          item.litros += Math.abs(Number(v.cantidad || 0));
          item.recorridoDelta += Number(v.recorridoCalculado || 0);
        }
      });

      filteredPartes.forEach(p => {
        const wLabel = getWeekLabel(p.fecha);
        if (weekMap.has(wLabel)) {
          weekMap.get(wLabel)!.horas += Number(p.horasTrabajadas || p.hsCantidad || 0);
        }
      });

      return Array.from(weekMap.values());
    }
  }, [filteredVouchers, filteredPartes, selectedMonth]);

  // Stats
  const stats = useMemo(() => {
    let totalLiters = 0;
    let totalHours = 0;
    let totalKms = 0;

    filteredVouchers.forEach(v => {
      totalLiters += Math.abs(Number(v.cantidad || 0));
      const calcRec = Number(v.recorridoCalculado || v.kilometrosRec || 0);
      if (calcRec > 0) totalKms += calcRec;
    });

    filteredPartes.forEach(p => {
      totalHours += Number(p.horasTrabajadas || p.hsCantidad || 0);
    });

    const fuelCount = filteredVouchers.length;
    const workCount = filteredPartes.length;

    // 1. Kms por Litro (Km/L)
    const kmsPorLitro = totalLiters > 0 && totalKms > 0 ? (totalKms / totalLiters).toFixed(2) : '0.00';

    // 2. Horas por Litro (hs/L) y Litros por Hora (L/h)
    const horasPorLitro = totalLiters > 0 && totalHours > 0 ? (totalHours / totalLiters).toFixed(2) : '0.00';
    const litrosPorHora = totalHours > 0 && totalLiters > 0 ? (totalLiters / totalHours).toFixed(2) : '0.00';

    // 3. Kms recorridos por hora trabajada (Km/h)
    const kmsPorHora = totalHours > 0 && totalKms > 0 ? (totalKms / totalHours).toFixed(2) : '0.00';

    // 4. Autonomía promedio por carga
    let autonomiaValue = '0';
    let autonomiaUnit = 'carga';
    if (totalKms > 0 && fuelCount > 0) {
      autonomiaValue = `${Math.round(totalKms / fuelCount).toLocaleString()}`;
      autonomiaUnit = 'Km / carga';
    } else if (totalHours > 0 && fuelCount > 0) {
      autonomiaValue = `${(totalHours / fuelCount).toFixed(1)}`;
      autonomiaUnit = 'Hs / carga';
    } else {
      autonomiaValue = '-';
      autonomiaUnit = 'Sin datos';
    }

    return {
      totalLiters,
      totalHours,
      totalKms,
      fuelCount,
      workCount,
      kmsPorLitro,
      horasPorLitro,
      litrosPorHora,
      kmsPorHora,
      autonomiaValue,
      autonomiaUnit
    };
  }, [filteredVouchers, filteredPartes]);

  const toggleVehicleSelection = (id: string) => {
    if (isAllSelected || isNoneSelected) {
      // If all or none were selected, clicking a vehicle selects ONLY this vehicle
      setSelectedVehicleIds([id]);
    } else {
      const clean = selectedVehicleIds.filter(vId => vId !== '__NONE__');
      if (clean.includes(id)) {
        const next = clean.filter(vId => vId !== id);
        // If unchecking the last selected vehicle, default back to 'Ninguno' or 'Todos'
        setSelectedVehicleIds(next.length === 0 ? ['__NONE__'] : next);
      } else {
        setSelectedVehicleIds([...clean, id]);
      }
    }
  };

  const selectedCount = isAllSelected ? dashboardFleet.length : isNoneSelected ? 0 : selectedVehicleIds.filter(id => id !== '__NONE__').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Fuel className="w-3.5 h-3.5" />
            Dashboard de Control de Flota
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Cruce de Combustible vs Trabajo por Vehículo
          </h2>
          <p className="text-xs text-slate-400 max-w-2xl">
            Selecciona uno o varios vehículos del filtro superior para analizar su rendimiento, evolución gráfica, cargas de combustible y partes de trabajo.
          </p>
        </div>

        {/* Vehicle Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>
              {isNoneSelected
                ? 'Ningún vehículo seleccionado'
                : isAllSelected 
                  ? 'Todos los Vehículos (Dashboard)' 
                  : `${selectedCount} vehículo(s) seleccionado(s)`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isVehicleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#16191F] border border-slate-700 rounded-xl shadow-xl z-50 p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Seleccionar Vehículos</span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedVehicleIds([])} className="text-[10px] text-amber-400 hover:underline cursor-pointer">Todos</button>
                  <span className="text-slate-600">|</span>
                  <button onClick={() => setSelectedVehicleIds(['__NONE__'])} className="text-[10px] text-slate-400 hover:underline cursor-pointer">Ninguno</button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {dashboardFleet.map(veh => {
                  const isChecked = isAllSelected || (!isNoneSelected && selectedVehicleIds.includes(veh.id));
                  return (
                    <div
                      key={veh.id}
                      onClick={() => toggleVehicleSelection(veh.id)}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer transition text-xs text-slate-200"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold text-white font-mono">{veh.id}</span>
                        <span className="text-slate-400 ml-1.5">({veh.modeloMarca})</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 text-right">
                <button
                  onClick={() => setIsVehicleDropdownOpen(false)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition"
                >
                  Aplicar Filtro
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* 1. Autonomía */}
        <div className="bg-[#16191F] border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Autonomía</span>
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Gauge className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-white font-mono">{stats.autonomiaValue}</div>
            <div className="text-[10px] text-amber-400/90 font-medium truncate mt-0.5">{stats.autonomiaUnit}</div>
          </div>
        </div>

        {/* 2. Kms por Litro */}
        <div className="bg-[#16191F] border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kms por Litro</span>
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-emerald-400 font-mono">{stats.kmsPorLitro}</div>
            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Km / Litro</div>
          </div>
        </div>

        {/* 3. Litros por Hora Producida (Hora Parte) */}
        <div className="bg-[#16191F] border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Litros / Hora Parte</span>
            <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-cyan-400 font-mono">{stats.litrosPorHora} <span className="text-xs font-semibold text-cyan-300">L/h</span></div>
            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Litros por hora producida</div>
          </div>
        </div>

        {/* 4. Kms por Hora Trabajada */}
        <div className="bg-[#16191F] border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Km / Hora Trab.</span>
            <div className="p-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-violet-400 font-mono">{stats.kmsPorHora}</div>
            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Km / h trabajada</div>
          </div>
        </div>

        {/* 5. Total Horas Trabajadas */}
        <div className="bg-[#16191F] border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Horas</span>
            <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-blue-400 font-mono">{stats.totalHours.toFixed(1)} h</div>
            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{stats.workCount} partes de trabajo</div>
          </div>
        </div>

        {/* 6. Total Kms Recorridos */}
        <div className="bg-[#16191F] border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kms</span>
            <div className="p-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-teal-400 font-mono">{stats.totalKms.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Km recorridos</div>
          </div>
        </div>

        {/* 7. Cantidad Litros Cargados */}
        <div className="bg-[#16191F] border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Litros</span>
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-amber-400 font-mono">{stats.totalLiters.toLocaleString()} L</div>
            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{stats.fuelCount} cargas registradas</div>
          </div>
        </div>
      </div>

      {/* Month Filter Bar */}
      <div className="bg-[#16191F] border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300">Periodo de Análisis:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-white font-bold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Meses (Evolución Completa)</option>
            {availableMonths.map(m => (
              <option key={m} value={m} className="bg-slate-900 text-white">{m} (Semanal)</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Mostrando datos filtrados para <span className="text-white font-bold">{selectedVehicleIds.length === 0 ? 'Toda la Flota de Control' : `${selectedVehicleIds.length} equipo(s)`}</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-[#16191F] border border-slate-800 p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Evolución Gráfica (Litros vs Recorrido / Horas)</h3>
            <p className="text-xs text-slate-400">
              {selectedMonth === 'ALL' ? 'Evolución mensual consolidada' : `Desglose semanal para ${selectedMonth}`}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Litros (L)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Horas (h)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Recorrido (Δ)</span>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No hay datos gráficos para el filtro seleccionado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#F59E0B" fontSize={11} label={{ value: 'Litros (L)', angle: -90, position: 'insideLeft', fill: '#F59E0B', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" fontSize={11} label={{ value: 'Recorrido / Horas (Δ)', angle: 90, position: 'insideRight', fill: '#10B981', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F1115', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar yAxisId="left" dataKey="litros" name="Litros" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Line yAxisId="right" type="monotone" dataKey="horas" name="Horas (Partes)" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="recorridoDelta" name="Recorrido (Δ)" stroke="#10B981" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tabla 1: Cargas de Combustible */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-3">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Cargas de Combustible Registradas ({filteredVouchers.length})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total: {stats.totalLiters.toLocaleString()} L</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">
                  <button 
                    onClick={() => setSortOrderVouchers(sortOrderVouchers === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 hover:text-white transition cursor-pointer font-bold uppercase tracking-wider"
                  >
                    Fecha {sortOrderVouchers === 'desc' ? '▼' : '▲'}
                  </button>
                </th>
                <th className="py-3 px-4">Equipo / Código</th>
                <th className="py-3 px-4">Modelo / Marca</th>
                <th className="py-3 px-4">Chofer / Operador</th>
                <th className="py-3 px-4">Obra</th>
                <th className="py-3 px-4 text-right">Cantidad (L)</th>
                <th className="py-3 px-4 text-right">Km / Horómetro</th>
                <th className="py-3 px-4 text-right">Km/Hs Rec. (Entre Cargas)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No hay cargas de combustible para los vehículos seleccionados en este período.
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v, idx) => (
                  <tr key={v.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-300">{v.fecha || '-'}</td>
                    <td className="py-2.5 px-4 font-bold text-white font-mono">{v.codigoEquipo || v.patente || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-xs">{v.marcaModelo || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-xs">{v.chofer || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-xs">{v.obra || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-400">{Number(v.cantidad || 0).toLocaleString()} L</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300 text-xs">{v.kilometraje || v.kmsHs || v.horometroOdometro || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {v.recorridoCalculado > 0 ? `${v.recorridoCalculado.toLocaleString()} u` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabla 2: Partes de Trabajo */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-3">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-white">Partes de Trabajo Registrados ({filteredPartes.length})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Horas: {stats.totalHours.toFixed(1)} h</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">
                  <button 
                    onClick={() => setSortOrderPartes(sortOrderPartes === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 hover:text-white transition cursor-pointer font-bold uppercase tracking-wider"
                  >
                    Fecha {sortOrderPartes === 'desc' ? '▼' : '▲'}
                  </button>
                </th>
                <th className="py-3 px-4">Equipo / Código</th>
                <th className="py-3 px-4">Modelo / Marca</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Obra</th>
                <th className="py-3 px-4 text-right">Horas Trabajadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredPartes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No hay partes de trabajo para los vehículos seleccionados en este período.
                  </td>
                </tr>
              ) : (
                filteredPartes.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-300">{p.fecha || '-'}</td>
                    <td className="py-2.5 px-4 font-bold text-white font-mono">{p.codigoEquipo || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-xs">{p.marcaModelo || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-xs">{p.chofer || p.operador || '-'}</td>
                    <td className="py-2.5 px-4 text-slate-300 text-xs">{p.obra || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-400">{Number(p.horasTrabajadas || p.hsCantidad || 0).toFixed(1)} h</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
