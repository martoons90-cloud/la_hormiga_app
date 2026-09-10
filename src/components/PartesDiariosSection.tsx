import React, { useState, useMemo } from 'react';
import { ParteDiario, Vehicle, Employee, TableDensity, TableColumnConfig } from '../types';
import { ParteDiarioColumnKey, PARTE_DIARIO_COLUMNS } from '../data/tableColumns';
import { loadParteDiarioColumnConfig, saveParteDiarioColumnConfig } from '../services/storage';
import { ColumnManagerModal } from './ColumnManagerModal';
import { TableDensitySelector } from './TableDensitySelector';
import { DENSITY_CONFIG, getSavedTableDensity, saveTableDensity } from '../utils/densityStyles';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock3, 
  Edit3,
  Trash2,
  Wrench,
  Users,
  Calendar,
  Fuel,
  Sparkles,
  MapPin,
  Eye,
  ShieldCheck,
  Truck,
  UploadCloud,
  SlidersHorizontal,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

interface PartesDiariosSectionProps {
  partes: ParteDiario[];
  fleet: Vehicle[];
  employees: Employee[];
  density?: TableDensity;
  onChangeDensity?: (density: TableDensity) => void;
  onOpenCreateModal: () => void;
  onViewDetails: (parte: ParteDiario) => void;
  onEditParte: (parte: ParteDiario) => void;
  onDeleteParte: (id: string) => void;
  onDeleteSelectedPartes?: (ids: string[]) => void;
  onExportCSV: () => void;
  onOpenImportExport?: () => void;
  onResetPartesDiarios?: () => void;
  onClearAllPartesDiarios?: () => void;
  onViewVehicle?: (codigoEquipo: string, marcaModelo: string) => void;
  onViewEmployee?: (codigoEmpleado: string, nombreApellido: string) => void;
  onViewObra?: (obraNombre: string, codigoObra: string) => void;
}

type SortKey = 'fecha' | 'numParte' | 'codigoEquipo' | 'nombreApellido' | 'obra' | 'tipo';

export const PartesDiariosSection: React.FC<PartesDiariosSectionProps> = ({
  partes,
  fleet,
  employees,
  density,
  onChangeDensity,
  onOpenCreateModal,
  onViewDetails,
  onEditParte,
  onDeleteParte,
  onDeleteSelectedPartes,
  onExportCSV,
  onOpenImportExport,
  onResetPartesDiarios,
  onClearAllPartesDiarios,
  onViewVehicle,
  onViewEmployee,
  onViewObra,
}) => {
  const [localDensity, setLocalDensity] = useState<TableDensity>(() => getSavedTableDensity());
  const activeDensity = density || localDensity;

  const handleDensityChange = (d: TableDensity) => {
    setLocalDensity(d);
    saveTableDensity(d);
    if (onChangeDensity) onChangeDensity(d);
  };

  const densityCfg = DENSITY_CONFIG[activeDensity];

  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [sortField, setSortField] = useState<SortKey>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Column configuration & Date Grouping state
  const [columnConfig, setColumnConfig] = useState<TableColumnConfig<ParteDiarioColumnKey>>(() => loadParteDiarioColumnConfig());
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [groupByDate, setGroupByDate] = useState<boolean>(true);

  const handleSaveColumnConfig = (newConfig: TableColumnConfig<ParteDiarioColumnKey>) => {
    setColumnConfig(newConfig);
    saveParteDiarioColumnConfig(newConfig);
    setIsColumnModalOpen(false);
  };

  const visibleColumnsCount = useMemo(() => {
    return columnConfig.order.filter(k => columnConfig.visible[k]).length;
  }, [columnConfig]);

  const handleSort = (field: SortKey) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Stats calculations
  const stats = useMemo(() => {
    const totalPartes = partes.length;
    const horasTotales = partes.reduce((sum, p) => sum + (p.horasTrabajadas || p.hsCantidad || 0), 0);
    const viajesTotales = partes.reduce((sum, p) => sum + (p.viajesCantidad || p.cantidad || 0), 0);
    const controlados = partes.filter(p => p.autorizado === 'CONTROLADO' || p.autorizado === 'AUTORIZADO').length;
    const noControlados = partes.filter(p => p.autorizado === 'NO CONTROLADO').length;
    return { totalPartes, horasTotales, viajesTotales, controlados, noControlados };
  }, [partes]);

  // Helper to normalize and format dates robustly (handles 4/9/2026, 2026-09-04, etc. identically)
  const normalizeDateKey = (dateStr?: string): { key: string; display: string } => {
    if (!dateStr || !dateStr.trim() || dateStr === 'Sin Fecha' || dateStr.toLowerCase() === 'invalid date') {
      return { key: 'sin-fecha', display: 'Sin Fecha' };
    }
    const trimmed = dateStr.trim();

    // If YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return {
          key: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
          display: `${day}/${month}/${year}`
        };
      }
    }

    // If D/M/YYYY or DD/MM/YYYY
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const day = parseInt(d, 10);
        const month = parseInt(m, 10);
        const year = parseInt(y, 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const fullYear = year < 100 ? 2000 + year : year;
          return {
            key: `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
            display: `${day}/${month}/${fullYear}`
          };
        }
      }
    }

    const time = new Date(trimmed).getTime();
    if (!isNaN(time)) {
      const dateObj = new Date(time);
      const y = dateObj.getFullYear();
      const m = dateObj.getMonth() + 1;
      const d = dateObj.getDate();
      return {
        key: `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`,
        display: `${d}/${m}/${y}`
      };
    }

    return { key: trimmed.toLowerCase(), display: trimmed };
  };

  const parseDateToTimestamp = (dateStr?: string): number => {
    if (!dateStr || !dateStr.trim() || dateStr === 'Sin Fecha') return Number.MAX_SAFE_INTEGER;
    const { key } = normalizeDateKey(dateStr);
    if (key === 'sin-fecha') return Number.MAX_SAFE_INTEGER;
    const time = new Date(key).getTime();
    return isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
  };

  // Filter & sort
  const filteredPartes = useMemo(() => {
    return partes.filter(p => {
      const matchSearch = 
        (p.codigoEquipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.marcaModelo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.nombreApellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.obra || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.detalleTipo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.numParte || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchTipo = tipoFilter === 'TODOS' || p.tipo === tipoFilter;
      return matchSearch && matchTipo;
    }).sort((a, b) => {
      if (sortField === 'fecha') {
        const aTime = parseDateToTimestamp(a.fecha);
        const bTime = parseDateToTimestamp(b.fecha);
        if (aTime !== bTime) {
          return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
        }
        return (a.numParte || '').localeCompare(b.numParte || '');
      }

      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [partes, searchTerm, tipoFilter, sortField, sortDirection]);

  // Paginated slice
  const totalPages = Math.ceil(filteredPartes.length / pageSize) || 1;
  const paginatedPartes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPartes.slice(start, start + pageSize);
  }, [filteredPartes, currentPage, pageSize]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const allFilteredIds = useMemo(() => filteredPartes.map(p => p.id), [filteredPartes]);

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  // Grouped by normalized date if groupByDate is true
  const groupedPartes = useMemo(() => {
    if (!groupByDate) {
      return [{ date: 'Todos los Registros', items: paginatedPartes }];
    }

    const groupsMap = new Map<string, { displayDate: string; items: ParteDiario[] }>();
    paginatedPartes.forEach(p => {
      const rawDate = p.fecha || 'Sin Fecha';
      const { key, display } = normalizeDateKey(rawDate);

      if (!groupsMap.has(key)) {
        groupsMap.set(key, { displayDate: display, items: [] });
      }
      groupsMap.get(key)!.items.push(p);
    });

    const result: { date: string; items: ParteDiario[] }[] = [];
    groupsMap.forEach((val) => {
      result.push({ date: val.displayDate, items: val.items });
    });

    result.sort((a, b) => {
      const aInvalid = a.date === 'Sin Fecha' || a.date === 'sin-fecha' || parseDateToTimestamp(a.date) === Number.MAX_SAFE_INTEGER;
      const bInvalid = b.date === 'Sin Fecha' || b.date === 'sin-fecha' || parseDateToTimestamp(b.date) === Number.MAX_SAFE_INTEGER;
      if (aInvalid && !bInvalid) return 1;
      if (!aInvalid && bInvalid) return -1;
      if (aInvalid && bInvalid) return a.date.localeCompare(b.date);

      const tA = parseDateToTimestamp(a.date);
      const tB = parseDateToTimestamp(b.date);
      if (tA !== tB) {
        return sortDirection === 'asc' ? tA - tB : tB - tA;
      }
      return a.date.localeCompare(b.date);
    });

    return result;
  }, [paginatedPartes, groupByDate, sortDirection]);

  // Render header cell
  const renderHeaderCell = (colKey: ParteDiarioColumnKey) => {
    if (!columnConfig.visible[colKey]) return null;
    const def = PARTE_DIARIO_COLUMNS.find(d => d.key === colKey);
    const isSorted = sortField === colKey;

    return (
      <th
        key={colKey}
        onClick={() => {
          if (colKey === 'fecha' || colKey === 'numParte' || colKey === 'codigoEquipo' || colKey === 'nombreApellido' || colKey === 'obra' || colKey === 'tipo') {
            handleSort(colKey as SortKey);
          }
        }}
        className={`${densityCfg.thPadding} font-bold cursor-pointer select-none group hover:text-amber-400 transition ${
          def?.align === 'right' ? 'text-right' : def?.align === 'center' ? 'text-center' : 'text-left'
        }`}
        title="Click para ordenar. Arrastra en la configuración para reordenar."
      >
        <div className={`flex items-center gap-1 ${def?.align === 'right' ? 'justify-end' : def?.align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <span className="truncate">{def?.label || colKey}</span>
          <span>
            {isSorted ? (
              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-400 font-bold" /> : <ArrowDown className="w-3 h-3 text-amber-400 font-bold" />
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-50" />
            )}
          </span>
        </div>
      </th>
    );
  };

  // Render body cell
  const renderBodyCell = (colKey: ParteDiarioColumnKey, parte: ParteDiario) => {
    if (!columnConfig.visible[colKey]) return null;
    const tdBase = `${densityCfg.tdPadding} ${densityCfg.fontSize}`;

    switch (colKey) {
      case 'id':
        return <td key="id" className={`${tdBase} text-slate-500 font-mono text-[11px]`}>{parte.id}</td>;
      case 'numParte':
        return <td key="numParte" className={`${tdBase} font-bold text-white font-mono`}>{parte.numParte}</td>;
      case 'fecha':
        return <td key="fecha" className={`${tdBase} text-slate-300 font-mono`}>{parte.fecha}</td>;
      case 'servMant':
        return <td key="servMant" className={`${tdBase} text-slate-300`}>{parte.servMant}</td>;
      case 'obra':
        return (
          <td 
            key="obra" 
            className={`${tdBase} text-white font-sans font-medium cursor-pointer hover:text-amber-400 hover:underline`}
            onClick={() => onViewObra?.(parte.obra, parte.codigoObra)}
            title="Ver detalles de la obra"
          >
            {parte.obra}
          </td>
        );
      case 'codigoObra':
        return (
          <td 
            key="codigoObra" 
            className={`${tdBase} text-slate-400 font-mono cursor-pointer hover:underline`}
            onClick={() => onViewObra?.(parte.obra, parte.codigoObra)}
            title="Ver detalles de la obra"
          >
            {parte.codigoObra}
          </td>
        );
      case 'codigoEquipo':
        return (
          <td 
            key="codigoEquipo" 
            className={`${tdBase} text-amber-400 font-bold font-mono cursor-pointer hover:underline`}
            onClick={() => onViewVehicle?.(parte.codigoEquipo, parte.marcaModelo)}
            title="Ver detalles del equipo"
          >
            {parte.codigoEquipo}
          </td>
        );
      case 'marcaModelo':
        return (
          <td 
            key="marcaModelo" 
            className={`${tdBase} text-slate-300 font-sans cursor-pointer hover:text-amber-400 hover:underline`}
            onClick={() => onViewVehicle?.(parte.codigoEquipo, parte.marcaModelo)}
            title="Ver detalles del equipo"
          >
            {parte.marcaModelo}
          </td>
        );
      case 'codigoEmpleado':
        return (
          <td 
            key="codigoEmpleado" 
            className={`${tdBase} text-slate-400 font-mono cursor-pointer hover:underline`}
            onClick={() => onViewEmployee?.(parte.codigoEmpleado, parte.nombreApellido)}
            title="Ver detalles del empleado"
          >
            {parte.codigoEmpleado}
          </td>
        );
      case 'nombreApellido':
        return (
          <td 
            key="nombreApellido" 
            className={`${tdBase} text-blue-300 font-sans cursor-pointer hover:underline`}
            onClick={() => onViewEmployee?.(parte.codigoEmpleado, parte.nombreApellido)}
            title="Ver detalles del empleado"
          >
            {parte.nombreApellido}
          </td>
        );
      case 'tipo':
        return (
          <td key="tipo" className={`${tdBase} text-center`}>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              parte.tipo === 'HORAS' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
            }`}>
              {parte.tipo}
            </span>
          </td>
        );
      case 'horasTrabajadas':
        return <td key="horasTrabajadas" className={`${tdBase} text-right font-mono font-bold text-amber-400`}>{(parte.horasTrabajadas || parte.hsCantidad || 0).toFixed(1)}</td>;
      case 'viajesCantidad':
        return <td key="viajesCantidad" className={`${tdBase} text-right font-mono font-bold text-white`}>{parte.tipo === 'VIAJES' ? (parte.viajesCantidad || parte.cantidad || 0) : '-'}</td>;
      case 'tipoMaterial':
        return <td key="tipoMaterial" className={`${tdBase} text-slate-300 font-sans`}>{parte.tipoMaterial || '-'}</td>;
      case 'odomKilom':
        return <td key="odomKilom" className={`${tdBase} text-right font-mono text-slate-300`}>{parte.odomKilom ? parte.odomKilom.toLocaleString() : '-'}</td>;
      case 'ubicacion':
        return <td key="ubicacion" className={`${tdBase} text-slate-300 font-sans`}>{parte.ubicacion || '-'}</td>;
      case 'encargadoObra':
        return <td key="encargadoObra" className={`${tdBase} text-slate-300 font-sans`}>{parte.encargadoObra || '-'}</td>;
      case 'novedades':
        return <td key="novedades" className={`${tdBase} text-slate-400 font-sans max-w-[200px] truncate`} title={parte.novedades}>{parte.novedades || '-'}</td>;
      default:
        return <td key={colKey} className={`${tdBase} text-slate-300`}>-</td>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#16191F] border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Partes Diarios de Equipos
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {partes.length} Registros
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Control completo de horas, turnos, viajes, obras y operadores con columnas y agrupación personalizables.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              title="Importar Partes Diarios desde Excel o CSV"
            >
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Importar</span>
            </button>
          )}

          <button
            onClick={onExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            title="Exportar Partes a CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          {onResetPartesDiarios && (
            <button
              onClick={onResetPartesDiarios}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
              title="Restaurar partes diarios predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Restaurar</span>
            </button>
          )}

          {onClearAllPartesDiarios && (
            <button
              onClick={onClearAllPartesDiarios}
              className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs rounded-xl border border-rose-500/30 transition cursor-pointer"
              title="Borrar todos los registros de partes diarios"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Borrar Todos</span>
            </button>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>+ Añadir Parte Diario</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#16191F] border border-slate-800 p-4 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por equipo, marca, operador, obra, num parte o detalle..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
            {['TODOS', 'HORAS', 'VIAJES'].map(t => (
              <button
                key={t}
                onClick={() => setTipoFilter(t)}
                className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                  tipoFilter === t 
                    ? 'bg-amber-500 text-black font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'TODOS' ? 'Todos' : t}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setGroupByDate(!groupByDate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              groupByDate
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Agrupar registros por fecha"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{groupByDate ? 'Agrupado por Fecha' : 'Lista Plana'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsColumnModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Personalizar columnas visibles y orden"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Columnas ({visibleColumnsCount})</span>
          </button>

          <TableDensitySelector density={activeDensity} onChangeDensity={handleDensityChange} />
        </div>
      </div>

      {/* Batch Selection Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-300 shadow-lg">
          <span className="font-bold">
            {selectedIds.length} partes diarios seleccionados
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
            >
              Deseleccionar
            </button>
            <button
              type="button"
              onClick={() => {
                if (onDeleteSelectedPartes) {
                  onDeleteSelectedPartes(selectedIds);
                  setSelectedIds([]);
                }
              }}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar seleccionados ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table with Customizable Columns */}
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className={`${densityCfg.thPadding} w-10 text-center`}>
                  <input
                    type="checkbox"
                    checked={allFilteredIds.length > 0 && selectedIds.length === allFilteredIds.length}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                    title="Seleccionar todos los visibles"
                  />
                </th>
                {columnConfig.order.map(colKey => renderHeaderCell(colKey))}
                <th className={`${densityCfg.thPadding} font-bold text-right sticky right-0 z-20 bg-slate-900/90 border-l border-slate-800`}>
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs font-mono">
              {paginatedPartes.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnsCount + 2} className="px-4 py-12 text-center text-slate-500 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ClipboardList className="w-10 h-10 text-slate-600" />
                      <p className="text-sm font-medium">No se encontraron partes diarios con los filtros seleccionados.</p>
                      <button
                        type="button"
                        onClick={() => { setSearchTerm(''); setTipoFilter('TODOS'); setCurrentPage(1); }}
                        className="text-xs text-amber-400 hover:underline mt-1 cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedPartes.map((group, groupIdx) => {
                  const groupHours = group.items.reduce((acc, p) => acc + (p.horasTrabajadas || p.hsCantidad || 0), 0);
                  const groupTrips = group.items.reduce((acc, p) => acc + (p.viajesCantidad || p.cantidad || 0), 0);

                  return (
                    <React.Fragment key={group.date || groupIdx}>
                      {groupByDate && (
                        <tr className="bg-slate-900/95 border-t-2 border-b border-slate-800 select-none">
                          <td colSpan={visibleColumnsCount + 2} className="px-4 py-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Calendar className="w-4 h-4 text-amber-400" />
                                <span className="font-mono font-bold text-white text-xs">{group.date}</span>
                                <span className="bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono border border-amber-500/30">
                                  {group.items.length} {group.items.length === 1 ? 'parte' : 'partes'}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                                <span>Horas: <strong className="text-amber-400">{groupHours.toFixed(1)} hs</strong></span>
                                <span>Viajes: <strong className="text-blue-400">{groupTrips}</strong></span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                      {group.items.map((parte) => (
                        <tr 
                          key={parte.id} 
                          className={`hover:bg-slate-900/60 transition group ${densityCfg.row} ${selectedIds.includes(parte.id) ? 'bg-amber-500/10' : ''}`}
                        >
                          <td className={`${densityCfg.cell} w-10 text-center`}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(parte.id)}
                              onChange={() => toggleSelectOne(parte.id)}
                              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          {columnConfig.order.map(colKey => renderBodyCell(colKey, parte))}

                          <td className={`px-3 text-right ${densityCfg.cell}`}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onViewDetails(parte)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition cursor-pointer"
                                title="Ver detalle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEditParte(parte)}
                                className="p-1 bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-black rounded transition cursor-pointer"
                                title="Editar"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteParte(parte.id)}
                                className="p-1 bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white rounded transition cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Mostrando {filteredPartes.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} al {Math.min(currentPage * pageSize, filteredPartes.length)} de {filteredPartes.length} registros ({partes.length} total)</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Filas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded cursor-pointer transition"
            >
              « Primero
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded cursor-pointer transition"
            >
              ‹ Anterior
            </button>
            <span className="px-3 py-1 bg-slate-800 text-amber-400 font-bold rounded">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded cursor-pointer transition"
            >
              Siguiente ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded cursor-pointer transition"
            >
              Último »
            </button>
          </div>
        </div>
      </div>

      {/* Column Manager Modal */}
      <ColumnManagerModal<ParteDiarioColumnKey>
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title="Personalizar Columnas de Partes Diarios"
        subtitle="Selecciona qué columnas mostrar y arrástralas para reordenar la tabla de trabajos por equipo."
        columnDefinitions={PARTE_DIARIO_COLUMNS}
        columnConfig={columnConfig}
        onSaveConfig={handleSaveColumnConfig}
        onResetDefaults={() => {
          const reset = loadParteDiarioColumnConfig();
          setColumnConfig(reset);
          saveParteDiarioColumnConfig(reset);
          setIsColumnModalOpen(false);
        }}
      />
    </div>
  );
};
