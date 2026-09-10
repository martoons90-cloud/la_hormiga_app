import React, { useState, useMemo } from 'react';
import { IssuedFuelVoucher, IssuedVoucherStatus, Vehicle, Employee, FuelDeposit, TableDensity } from '../types';
import { TableDensitySelector } from './TableDensitySelector';
import { DENSITY_CONFIG, getSavedTableDensity, saveTableDensity } from '../utils/densityStyles';
import { 
  Ticket, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock3, 
  Edit3,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Sparkles,
  Layers,
  ChevronRight,
  UploadCloud
} from 'lucide-react';

interface IssuedVouchersSectionProps {
  vouchers: IssuedFuelVoucher[];
  fleet: Vehicle[];
  employees: Employee[];
  deposits: FuelDeposit[];
  density?: TableDensity;
  onChangeDensity?: (density: TableDensity) => void;
  onOpenCreateModal: () => void;
  onViewDetails: (voucher: IssuedFuelVoucher) => void;
  onEditVoucher: (voucher: IssuedFuelVoucher) => void;
  onDeleteVoucher: (id: string) => void;
  onProceedToRendicion: (voucher: IssuedFuelVoucher) => void;
  onExportCSV: () => void;
  onOpenImportExport?: () => void;
  onViewExpendio?: (expendioId: string) => void;
}

type IssuedVoucherSortKey = 
  | 'estado' 
  | 'numComprobante' 
  | 'codigoEquipo' 
  | 'nombreApellido' 
  | 'tipoComb' 
  | 'numEstacion' 
  | 'cantidad'
  | 'fechaEmision';

export const IssuedVouchersSection: React.FC<IssuedVouchersSectionProps> = ({
  vouchers,
  fleet,
  employees,
  deposits,
  density,
  onChangeDensity,
  onOpenCreateModal,
  onViewDetails,
  onEditVoucher,
  onDeleteVoucher,
  onProceedToRendicion,
  onExportCSV,
  onOpenImportExport,
  onViewExpendio,
}) => {
  const [localDensity, setLocalDensity] = useState<TableDensity>(() => getSavedTableDensity());
  const activeDensity = density || localDensity;

  const handleDensityChange = (d: TableDensity) => {
    setLocalDensity(d);
    saveTableDensity(d);
    if (onChangeDensity) {
      onChangeDensity(d);
    }
  };

  const densityCfg = DENSITY_CONFIG[activeDensity];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [vehicleFilter, setVehicleFilter] = useState<string>('TODOS');
  const [combustibleFilter, setCombustibleFilter] = useState<string>('TODOS');
  const [groupByDate, setGroupByDate] = useState<boolean>(true);

  // Sorting state
  const [sortField, setSortField] = useState<IssuedVoucherSortKey>('fechaEmision');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: IssuedVoucherSortKey) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDoubleClickSort = (field: IssuedVoucherSortKey, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper to format ISO or text date to D/M/YYYY (e.g. 1/9/2026, 31/8/2026)
  const formatDisplayDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
      }
    }
    return dateStr;
  };

  // Helper to format quantity with comma decimals (e.g. 57,87)
  const formatQuantity = (val?: number): string => {
    if (val === undefined || val === null || isNaN(val)) return '0,00';
    return Number(val).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = vouchers.length;
    const rendidos = vouchers.filter(v => v.estado === 'RENDIDO').length;
    const emitidos = vouchers.filter(v => v.estado === 'EMITIDO').length;
    const anulados = vouchers.filter(v => v.estado === 'ANULADO').length;

    const totalLitros = vouchers.reduce((sum, v) => sum + (v.cantidad ?? v.litrosReales ?? v.litrosAutorizados ?? 0), 0);

    return {
      total,
      rendidos,
      emitidos,
      anulados,
      totalLitros
    };
  }, [vouchers]);

  // Unique fuels for filter
  const uniqueFuels = useMemo(() => {
    const set = new Set<string>();
    vouchers.forEach(v => {
      if (v.tipoComb) set.add(v.tipoComb);
    });
    return Array.from(set);
  }, [vouchers]);

  // Filtered & sorted vouchers list
  const filteredVouchers = useMemo(() => {
    const list = vouchers.filter(v => {
      const search = searchTerm.toLowerCase();
      const numComp = (v.numComprobante || v.numVale || '').toLowerCase();
      const equipo = (v.codigoEquipo || '').toLowerCase();
      const chofer = (v.nombreApellido || '').toLowerCase();
      const comb = (v.tipoComb || '').toLowerCase();
      const est = (v.numEstacion || v.estacionSurtidor || '').toLowerCase();
      const ticket = (v.numTicket || '').toLowerCase();

      const matchSearch = 
        !searchTerm ||
        numComp.includes(search) ||
        equipo.includes(search) ||
        chofer.includes(search) ||
        comb.includes(search) ||
        est.includes(search) ||
        ticket.includes(search);

      const matchStatus = statusFilter === 'TODOS' || v.estado === statusFilter;
      const matchVehicle = vehicleFilter === 'TODOS' || v.codigoEquipo === vehicleFilter;
      const matchFuel = combustibleFilter === 'TODOS' || v.tipoComb === combustibleFilter;

      return matchSearch && matchStatus && matchVehicle && matchFuel;
    });

    if (sortField) {
      list.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'numComprobante') {
          valA = a.numComprobante || a.numVale || '';
          valB = b.numComprobante || b.numVale || '';
        } else if (sortField === 'cantidad') {
          valA = a.cantidad ?? a.litrosReales ?? a.litrosAutorizados ?? 0;
          valB = b.cantidad ?? b.litrosReales ?? b.litrosAutorizados ?? 0;
        } else {
          valA = a[sortField as keyof IssuedFuelVoucher] ?? '';
          valB = b[sortField as keyof IssuedFuelVoucher] ?? '';
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
            : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return list;
  }, [vouchers, searchTerm, statusFilter, vehicleFilter, combustibleFilter, sortField, sortDirection]);

  // Group vouchers by date if groupByDate is enabled
  const groupedVouchers = useMemo(() => {
    if (!groupByDate) {
      return [{ dateKey: 'all', displayDate: '', items: filteredVouchers }];
    }

    const groupsMap = new Map<string, IssuedFuelVoucher[]>();

    filteredVouchers.forEach(v => {
      const rawDate = v.fechaEmision || v.fecha || 'Sin Fecha';
      if (!groupsMap.has(rawDate)) {
        groupsMap.set(rawDate, []);
      }
      groupsMap.get(rawDate)!.push(v);
    });

    const result: { dateKey: string; displayDate: string; items: IssuedFuelVoucher[] }[] = [];
    groupsMap.forEach((items, dateKey) => {
      result.push({
        dateKey,
        displayDate: formatDisplayDate(dateKey),
        items
      });
    });

    return result;
  }, [filteredVouchers, groupByDate]);

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 border-b border-slate-800">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold tracking-wider uppercase mb-1">
            <span className="text-slate-400 hover:text-slate-200 cursor-pointer">COMBUSTIBLE</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 stroke-[2.5]" />
            <span className="text-amber-400 font-bold">VALES</span>
          </nav>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Vales de Combustible</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-normal">
              {filteredVouchers.length} registros
            </span>
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Table Density Selector */}
          <TableDensitySelector
            density={activeDensity}
            onChangeDensity={handleDensityChange}
          />

          <button
            onClick={() => setGroupByDate(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
              groupByDate 
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Alternar agrupación por fecha"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{groupByDate ? 'Agrupado por Fecha' : 'Vista Plana'}</span>
          </button>

          {onOpenImportExport && (
            <button
              type="button"
              onClick={onOpenImportExport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
              title="Importar y Exportar Vales de Combustible (Excel / CSV / Plantilla)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar / Exportar</span>
            </button>
          )}

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Emitir Nuevo Vale</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#16191F] border border-slate-800 px-4 py-3 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Vales</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{stats.total}</div>
        </div>

        <div className="bg-[#16191F] border border-emerald-500/30 px-4 py-3 rounded-xl">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Rendidos</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{stats.rendidos}</div>
        </div>

        <div className="bg-[#16191F] border border-amber-500/30 px-4 py-3 rounded-xl">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Clock3 className="w-3.5 h-3.5" />
            <span>Pendientes</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{stats.emitidos}</div>
        </div>

        <div className="bg-[#16191F] border border-slate-800 px-4 py-3 rounded-xl">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Litros Totales</div>
          <div className="text-2xl font-black text-slate-200 font-mono mt-1">
            {formatQuantity(stats.totalLitros)} <span className="text-xs text-slate-400 font-normal">L</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#16191F] p-3.5 rounded-xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar Nº comprobante, equipo, chofer, estación..."
              className="w-full bg-[#0F1115] border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="TODOS">Todos los Estados ({vouchers.length})</option>
              <option value="RENDIDO">✓ Rendidos ({stats.rendidos})</option>
              <option value="EMITIDO">⚡ Emitidos / Pendientes ({stats.emitidos})</option>
              <option value="ANULADO">✕ Anulados ({stats.anulados})</option>
            </select>
          </div>

          {/* Vehicle Filter */}
          <div>
            <select
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="TODOS">Todos los Equipos</option>
              {fleet.map(v => (
                <option key={v.id} value={v.codigoEquipo}>
                  [{v.codigoEquipo}] {v.modeloMarca}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Filter */}
          <div>
            <select
              value={combustibleFilter}
              onChange={e => setCombustibleFilter(e.target.value)}
              className="w-full bg-[#0F1115] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="TODOS">Todos los Combustibles</option>
              {uniqueFuels.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick status tabs pills */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('TODOS')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'TODOS'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todos ({vouchers.length})
          </button>

          <button
            onClick={() => setStatusFilter('RENDIDO')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              statusFilter === 'RENDIDO'
                ? 'bg-emerald-500 text-black font-bold'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Rendidos ({stats.rendidos})</span>
          </button>

          <button
            onClick={() => setStatusFilter('EMITIDO')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              statusFilter === 'EMITIDO'
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Clock3 className="w-3.5 h-3.5" />
            <span>Pendientes ({stats.emitidos})</span>
          </button>

          <button
            onClick={() => setStatusFilter('ANULADO')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'ANULADO'
                ? 'bg-red-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Anulados ({stats.anulados})
          </button>
        </div>
      </div>

      {/* Main Table Structure structured exactly as requested in screenshot */}
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`bg-[#1E232D] border-b border-slate-800 text-slate-300 uppercase tracking-wider font-semibold select-none ${densityCfg.headerFontSize}`}>
                
                {/* 1. RENDICION */}
                <th
                  onClick={() => handleSort('estado')}
                  onDoubleClick={(e) => handleDoubleClickSort('estado', e)}
                  className={`${densityCfg.thPadding} font-bold cursor-pointer transition ${sortField === 'estado' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                  title="Doble clic para ordenar A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>RENDICION</span>
                    {sortField === 'estado' ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                        {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 2. NUM. COMPROBANTE */}
                <th
                  onClick={() => handleSort('numComprobante')}
                  onDoubleClick={(e) => handleDoubleClickSort('numComprobante', e)}
                  className={`${densityCfg.thPadding} font-bold cursor-pointer transition ${sortField === 'numComprobante' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                  title="Doble clic para ordenar A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>NUM. COMPROBANTE</span>
                    {sortField === 'numComprobante' ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                        {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 3. CODIGO_EQUIPO */}
                <th
                  onClick={() => handleSort('codigoEquipo')}
                  onDoubleClick={(e) => handleDoubleClickSort('codigoEquipo', e)}
                  className={`${densityCfg.thPadding} font-bold cursor-pointer transition ${sortField === 'codigoEquipo' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                  title="Doble clic para ordenar A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>CODIGO_EQUIPO</span>
                    {sortField === 'codigoEquipo' ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                        {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 4. NOMBRE_APELLIDO */}
                <th
                  onClick={() => handleSort('nombreApellido')}
                  onDoubleClick={(e) => handleDoubleClickSort('nombreApellido', e)}
                  className={`${densityCfg.thPadding} font-bold cursor-pointer transition ${sortField === 'nombreApellido' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                  title="Doble clic para ordenar A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>NOMBRE_APELLIDO</span>
                    {sortField === 'nombreApellido' ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                        {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 5. COMBUSTIBLE */}
                <th
                  onClick={() => handleSort('tipoComb')}
                  onDoubleClick={(e) => handleDoubleClickSort('tipoComb', e)}
                  className={`${densityCfg.thPadding} font-bold cursor-pointer transition ${sortField === 'tipoComb' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                  title="Doble clic para ordenar A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>COMBUSTIBLE</span>
                    {sortField === 'tipoComb' ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                        {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 6. NUM_ESTACION */}
                <th
                  onClick={() => handleSort('numEstacion')}
                  onDoubleClick={(e) => handleDoubleClickSort('numEstacion', e)}
                  className={`${densityCfg.thPadding} font-bold cursor-pointer transition ${sortField === 'numEstacion' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                  title="Doble clic para ordenar A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>NUM_ESTACION</span>
                    {sortField === 'numEstacion' ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                        {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* 7. CANTIDAD */}
                <th
                  onClick={() => handleSort('cantidad')}
                  onDoubleClick={(e) => handleDoubleClickSort('cantidad', e)}
                  className={`${densityCfg.thPadding} font-bold cursor-pointer transition ${sortField === 'cantidad' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                  title="Doble clic para ordenar A-Z / Z-A"
                >
                  <div className="flex items-center gap-1.5">
                    <span>CANTIDAD</span>
                    {sortField === 'cantidad' ? (
                      <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                        {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                        {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                      </span>
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>

                {/* Actions Column */}
                <th className={`${densityCfg.thPadding} font-bold text-right w-24`}></th>
              </tr>
            </thead>

            <tbody className={`divide-y divide-slate-800/60 ${densityCfg.fontSize}`}>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Ticket className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-400">No se encontraron vales de combustible</p>
                    <p className="text-[11px] text-slate-500 mt-1">Pruebe ajustando los filtros de búsqueda o emita un nuevo vale.</p>
                  </td>
                </tr>
              ) : (
                groupedVouchers.map((group, groupIdx) => (
                  <React.Fragment key={group.dateKey || groupIdx}>
                    {/* Date Section Header Row as in screenshot */}
                    {groupByDate && group.displayDate && (
                      <tr className="bg-[#11141A] border-t border-b border-slate-800">
                        <td colSpan={8} className="py-2 px-4 text-xs font-bold text-slate-300 font-sans tracking-wide">
                          {group.displayDate}
                        </td>
                      </tr>
                    )}

                    {/* Voucher Rows */}
                    {group.items.map(v => {
                      const isRendido = v.estado === 'RENDIDO';
                      const isEmitido = v.estado === 'EMITIDO';
                      const isAnulado = v.estado === 'ANULADO';

                      return (
                        <tr 
                          key={v.id} 
                          onClick={() => onViewDetails(v)}
                          className="hover:bg-slate-800/40 transition group border-b border-slate-800/40 cursor-pointer"
                        >
                          {/* 1. RENDICION */}
                          <td className={`${densityCfg.tdPadding} whitespace-nowrap`}>
                            <div className="flex items-center gap-1.5">
                              {isRendido ? (
                                <>
                                  <CheckCircle2 className={`${densityCfg.iconSize} text-emerald-500 stroke-[2.5]`} />
                                  <span className={`font-bold text-emerald-500 tracking-wide ${densityCfg.fontSize}`}>RENDIDO</span>
                                </>
                              ) : isEmitido ? (
                                <>
                                  <Clock3 className={`${densityCfg.iconSize} text-amber-500 stroke-[2.5]`} />
                                  <span className={`font-bold text-amber-500 tracking-wide ${densityCfg.fontSize}`}>EMITIDO</span>
                                </>
                              ) : (
                                <>
                                  <X className={`${densityCfg.iconSize} text-red-500 stroke-[2.5]`} />
                                  <span className={`font-bold text-red-500 tracking-wide ${densityCfg.fontSize}`}>ANULADO</span>
                                </>
                              )}
                            </div>
                          </td>

                          {/* 2. NUM. COMPROBANTE */}
                          <td className={`${densityCfg.tdPadding} whitespace-nowrap font-mono text-slate-300`}>
                            {v.numComprobante || v.numVale}
                          </td>

                          {/* 3. CODIGO_EQUIPO */}
                          <td className={`${densityCfg.tdPadding} whitespace-nowrap font-medium text-slate-200 uppercase`}>
                            {v.codigoEquipo}
                          </td>

                          {/* 4. NOMBRE_APELLIDO */}
                          <td className={`${densityCfg.tdPadding} whitespace-nowrap text-slate-300 uppercase`}>
                            {v.nombreApellido}
                          </td>

                          {/* 5. COMBUSTIBLE */}
                          <td className={`${densityCfg.tdPadding} whitespace-nowrap text-slate-300 uppercase font-medium`}>
                            {v.tipoComb}
                          </td>

                          {/* 6. NUM_ESTACION */}
                          <td className={`${densityCfg.tdPadding} whitespace-nowrap font-mono text-slate-300`}>
                            {v.numEstacion || v.numTicket || '-'}
                          </td>

                          {/* 7. CANTIDAD */}
                          <td className={`${densityCfg.tdPadding} whitespace-nowrap font-mono text-slate-200 font-semibold`}>
                            {isEmitido && (!v.litrosAutorizados || v.tipoCarga?.includes('Tanque Lleno')) && !v.cantidad && !v.litrosReales ? (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans font-medium inline-flex items-center gap-1">
                                <span>Tanque Lleno</span>
                              </span>
                            ) : (
                              formatQuantity(v.cantidad ?? v.litrosReales ?? v.litrosAutorizados)
                            )}
                          </td>

                          {/* Actions: Edit and Delete buttons as in screenshot */}
                          <td 
                            className={`${densityCfg.tdPadding} whitespace-nowrap text-right`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className={`flex items-center justify-end ${densityCfg.gap} text-slate-400`}>
                              {isEmitido && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onProceedToRendicion(v);
                                  }}
                                  className={`${densityCfg.btnPadding} text-amber-400 hover:text-amber-300 transition cursor-pointer`}
                                  title="Rendir Ticket"
                                >
                                  <Sparkles className={densityCfg.iconSize} />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditVoucher(v);
                                }}
                                className={`${densityCfg.btnPadding} hover:text-amber-400 transition cursor-pointer`}
                                title="Editar Vale"
                              >
                                <Edit3 className={densityCfg.iconSize} />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteVoucher(v.id);
                                }}
                                className={`${densityCfg.btnPadding} hover:text-red-400 transition cursor-pointer`}
                                title="Eliminar Vale"
                              >
                                <Trash2 className={densityCfg.iconSize} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
