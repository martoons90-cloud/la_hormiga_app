import React, { useState, useMemo } from 'react';
import { Vehicle, TableColumnKey, VehicleStatus, VehicleClassification, TableDensity } from '../types';
import { FLEET_COLUMNS } from '../data/tableColumns';
import { StatusBadge, STATUS_CONFIG } from './StatusBadge';
import { TableDensitySelector } from './TableDensitySelector';
import { DENSITY_CONFIG, getSavedTableDensity, saveTableDensity } from '../utils/densityStyles';
import { formatCurrency } from '../services/storage';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  SlidersHorizontal,
  ExternalLink,
  ImageIcon,
  PlusCircle,
  LayoutGrid,
  List,
  Sparkles,
  DollarSign,
  GripVertical,
  FileSpreadsheet,
  UploadCloud
} from 'lucide-react';

interface VehicleTableProps {
  fleet: Vehicle[];
  visibleColumns: Record<TableColumnKey, boolean>;
  columnOrder?: TableColumnKey[];
  density?: TableDensity;
  onChangeDensity?: (density: TableDensity) => void;
  onOpenCreateModal: () => void;
  onOpenColumnModal: () => void;
  onViewDetails: (vehicle: Vehicle) => void;
  onEditVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onChangeStatus: (id: string, newStatus: VehicleStatus) => void;
  onReorderColumns?: (newOrder: TableColumnKey[]) => void;
  onOpenImportExport?: () => void;
  onExportCSV?: () => void;
  onToggleDashboard?: (id: string) => void;
}

type SortField = TableColumnKey | 'margen';
type SortDirection = 'asc' | 'desc';

export const VehicleTable: React.FC<VehicleTableProps> = ({
  fleet,
  visibleColumns,
  columnOrder = FLEET_COLUMNS.map(c => c.key as TableColumnKey),
  density,
  onChangeDensity,
  onOpenCreateModal,
  onOpenColumnModal,
  onViewDetails,
  onEditVehicle,
  onDeleteVehicle,
  onChangeStatus,
  onReorderColumns,
  onOpenImportExport,
  onExportCSV,
  onToggleDashboard,
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
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Drag and drop state for table headers
  const [draggedHeaderKey, setDraggedHeaderKey] = useState<TableColumnKey | null>(null);
  const [dragOverHeaderKey, setDragOverHeaderKey] = useState<TableColumnKey | null>(null);

  // Available unique classifications from fleet
  const availableClassifications = useMemo(() => {
    const set = new Set(fleet.map(v => v.clasificacion));
    return Array.from(set);
  }, [fleet]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Double click to sort A-Z and Z-A
  const handleDoubleClickSort = (field: SortField, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (sortField === field) {
      // Toggle between A-Z and Z-A on subsequent double-clicks
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set as primary sort and default to A-Z (asc)
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Header drag and drop handlers
  const handleHeaderDragStart = (key: TableColumnKey, e: React.DragEvent) => {
    setDraggedHeaderKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleHeaderDragOver = (key: TableColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHeaderKey !== key) {
      setDragOverHeaderKey(key);
    }
  };

  const handleHeaderDragLeave = (key: TableColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverHeaderKey === key) {
      setDragOverHeaderKey(null);
    }
  };

  const handleHeaderDrop = (targetKey: TableColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    const sourceKey = (e.dataTransfer.getData('text/plain') as TableColumnKey) || draggedHeaderKey;
    if (!sourceKey || sourceKey === targetKey) {
      setDraggedHeaderKey(null);
      setDragOverHeaderKey(null);
      return;
    }

    const newOrder = [...columnOrder];
    const sourceIdx = newOrder.indexOf(sourceKey);
    const targetIdx = newOrder.indexOf(targetKey);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, sourceKey);
      if (onReorderColumns) {
        onReorderColumns(newOrder);
      }
    }

    setDraggedHeaderKey(null);
    setDragOverHeaderKey(null);
  };

  const handleHeaderDragEnd = () => {
    setDraggedHeaderKey(null);
    setDragOverHeaderKey(null);
  };

  // Filtered & sorted fleet
  const processedFleet = useMemo(() => {
    return fleet
      .filter((v) => {
        // Status filter
        if (statusFilter !== 'ALL' && v.estado !== statusFilter) return false;

        // Classification filter
        if (classFilter !== 'ALL' && v.clasificacion !== classFilter) return false;

        // Search query
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchId = v.id.toLowerCase().includes(q);
          const matchModel = v.modeloMarca.toLowerCase().includes(q);
          const matchPlate = v.patente.toLowerCase().includes(q);
          const matchInternal = v.codigoInterno.toLowerCase().includes(q);
          const matchClass = v.clasificacion.toLowerCase().includes(q);
          const matchLocation = (v.ubicacionActual || '').toLowerCase().includes(q);
          return matchId || matchModel || matchPlate || matchInternal || matchClass || matchLocation;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField as keyof Vehicle] ?? '';
        let valB: any = b[sortField as keyof Vehicle] ?? '';

        if (typeof valA === 'string') {
          return sortDirection === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }

        if (typeof valA === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
      });
  }, [fleet, searchTerm, statusFilter, classFilter, sortField, sortDirection]);

  // Header definitions metadata for clean rendering
  const COLUMN_HEADERS: Record<TableColumnKey, { label: string; align?: 'left' | 'center' | 'right'; sortable?: boolean; highlight?: boolean }> = {
    fotografia: { label: 'Foto', align: 'center', sortable: false },
    id: { label: 'ID', align: 'left', sortable: true },
    modeloMarca: { label: 'MODELO / MARCA', align: 'left', sortable: true },
    patente: { label: 'PATENTE', align: 'left', sortable: true },
    codigoInterno: { label: 'INTERNO', align: 'left', sortable: true },
    clasificacion: { label: 'CLASE', align: 'left', sortable: true },
    precioCosto: { label: 'COSTO', align: 'right', sortable: true },
    precioSugerido: { label: 'SUGERIDO', align: 'right', sortable: true, highlight: true },
    estado: { label: 'ESTADO', align: 'center', sortable: true },
    horometro: { label: 'HORÓMETRO', align: 'right', sortable: true },
    ubicacionActual: { label: 'UBICACIÓN', align: 'left', sortable: true },
    fechaAlta: { label: 'FECHA ALTA', align: 'left', sortable: true },
  };

  // Render dynamic header cell
  const renderHeaderCell = (colKey: TableColumnKey) => {
    if (!visibleColumns[colKey]) return null;

    const def = COLUMN_HEADERS[colKey] || { label: colKey, align: 'left', sortable: true };
    const isDragging = draggedHeaderKey === colKey;
    const isDragOver = dragOverHeaderKey === colKey;
    const isSorted = sortField === colKey;

    const alignClass = def.align === 'right' ? 'text-right' : def.align === 'center' ? 'text-center' : 'text-left';
    const justifyClass = def.align === 'right' ? 'justify-end' : def.align === 'center' ? 'justify-center' : 'justify-start';

    const baseClass = `${densityCfg.thPadding} border-b border-slate-700 transition select-none group relative ${
      isDragOver
        ? 'border-l-4 border-amber-500 bg-amber-500/20 text-amber-300'
        : isDragging
        ? 'opacity-40 bg-slate-900'
        : isSorted
        ? 'bg-amber-500/10 text-amber-300'
        : 'hover:bg-slate-700/40 text-slate-300'
    } ${alignClass} ${def.sortable ? 'cursor-pointer' : 'cursor-grab'}`;

    if (colKey === 'fotografia') {
      return (
        <th
          key="fotografia"
          draggable={true}
          onDragStart={(e) => handleHeaderDragStart('fotografia', e)}
          onDragOver={(e) => handleHeaderDragOver('fotografia', e)}
          onDragLeave={(e) => handleHeaderDragLeave('fotografia', e)}
          onDrop={(e) => handleHeaderDrop('fotografia', e)}
          onDragEnd={handleHeaderDragEnd}
          className={`${baseClass} ${activeDensity === 'ultra' ? 'w-10' : activeDensity === 'compact' ? 'w-12' : 'w-14'} text-center cursor-grab active:cursor-grabbing`}
          title="Arrastrar para reordenar columna"
        >
          <div className={`flex items-center justify-center ${densityCfg.gap}`}>
            <GripVertical className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
            <span className={densityCfg.headerFontSize}>Foto</span>
          </div>
        </th>
      );
    }

    return (
      <th
        key={colKey}
        draggable={true}
        onDragStart={(e) => handleHeaderDragStart(colKey, e)}
        onDragOver={(e) => handleHeaderDragOver(colKey, e)}
        onDragLeave={(e) => handleHeaderDragLeave(colKey, e)}
        onDrop={(e) => handleHeaderDrop(colKey, e)}
        onDragEnd={handleHeaderDragEnd}
        onClick={() => handleSort(colKey as SortField)}
        onDoubleClick={(e) => handleDoubleClickSort(colKey as SortField, e)}
        className={baseClass}
        title={`Doble clic para ordenar A-Z / Z-A (Actualmente: ${isSorted ? (sortDirection === 'asc' ? 'A-Z' : 'Z-A') : 'sin ordenar'}) • Arrastrar para mover`}
      >
        <div className={`flex items-center ${densityCfg.gap} ${justifyClass} ${def.highlight ? 'text-amber-500 font-bold' : ''}`}>
          <GripVertical className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition cursor-grab shrink-0" />
          <span className={`truncate ${densityCfg.headerFontSize}`}>{def.label}</span>
          {isSorted ? (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40 shrink-0">
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp className="w-2.5 h-2.5" />
                  <span>A-Z</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-2.5 h-2.5" />
                  <span>Z-A</span>
                </>
              )}
            </span>
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  // Render dynamic body cell
  const renderBodyCell = (colKey: TableColumnKey, vehicle: Vehicle) => {
    if (!visibleColumns[colKey]) return null;

    const margen = vehicle.precioSugerido > 0 
      ? Math.round(((vehicle.precioSugerido - vehicle.precioCosto) / vehicle.precioSugerido) * 100)
      : 0;

    const tdBase = `${densityCfg.tdPadding} ${densityCfg.fontSize}`;

    switch (colKey) {
      case 'fotografia':
        return (
          <td key="fotografia" className={tdBase}>
            <div 
              onClick={() => setImagePreviewUrl(vehicle?.fotografia || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80')}
              className={`${densityCfg.imgContainer} rounded bg-slate-700 cursor-pointer overflow-hidden relative border border-slate-600/50 hover:border-amber-500 transition`}
              title="Click para ver imagen completa"
            >
              <img
                src={vehicle?.fotografia || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80'}
                alt={vehicle?.modeloMarca || ''}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>
          </td>
        );

      case 'id':
        return (
          <td key="id" className={`${tdBase} font-mono whitespace-nowrap`}>
            <button
              onClick={() => onViewDetails(vehicle)}
              className="font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer"
            >
              {vehicle.id}
            </button>
          </td>
        );

      case 'modeloMarca':
        return (
          <td key="modeloMarca" className={tdBase}>
            <div className="font-medium text-slate-200 max-w-xs truncate">
              {vehicle.modeloMarca}
            </div>
            {activeDensity !== 'ultra' && (
              <div className="text-[10px] text-slate-500 truncate">
                {vehicle.ubicacionActual || 'Base Central'}
              </div>
            )}
          </td>
        );

      case 'patente':
        return (
          <td key="patente" className={`${tdBase} font-mono uppercase text-slate-300 whitespace-nowrap`}>
            {vehicle.patente || 'S/P'}
          </td>
        );

      case 'codigoInterno':
        return (
          <td key="codigoInterno" className={`${tdBase} font-mono text-slate-400 whitespace-nowrap`}>
            {vehicle.codigoInterno}
          </td>
        );

      case 'clasificacion':
        return (
          <td key="clasificacion" className={`${tdBase} whitespace-nowrap`}>
            <span className={`bg-slate-700 text-slate-200 rounded font-semibold uppercase ${
              activeDensity === 'ultra' ? 'px-1.5 py-0 text-[9px]' : 'px-2 py-0.5 text-[10px]'
            }`}>
              {vehicle.clasificacion}
            </span>
          </td>
        );

      case 'precioCosto':
        return (
          <td key="precioCosto" className={`${tdBase} text-right font-mono text-slate-400 whitespace-nowrap`}>
            <div>{formatCurrency(vehicle.precioCosto)}</div>
            {vehicle.precioCostoHora && activeDensity !== 'ultra' && (
              <div className="text-[10px] text-slate-500">{formatCurrency(vehicle.precioCostoHora)}/hs</div>
            )}
          </td>
        );

      case 'precioSugerido':
        return (
          <td key="precioSugerido" className={`${tdBase} text-right font-mono font-bold text-amber-500 whitespace-nowrap`}>
            <div>{formatCurrency(vehicle.precioSugerido)}</div>
            {activeDensity !== 'ultra' && (
              <div className="text-[10px] text-slate-400 font-normal">
                +{margen}% mg
              </div>
            )}
          </td>
        );

      case 'estado':
        return (
          <td key="estado" className={`${tdBase} text-center whitespace-nowrap`}>
            <StatusBadge 
              status={vehicle.estado} 
              size={activeDensity === 'ultra' ? 'xs' : 'sm'} 
            />
          </td>
        );

      case 'horometro':
        return (
          <td key="horometro" className={`${tdBase} text-right font-mono text-slate-300 whitespace-nowrap`}>
            {vehicle.horometro ? `${vehicle.horometro} hrs` : '-'}
          </td>
        );

      case 'ubicacionActual':
        return (
          <td key="ubicacionActual" className={`${tdBase} text-slate-300 whitespace-nowrap`}>
            {vehicle.ubicacionActual || 'Base Central'}
          </td>
        );

      case 'fechaAlta':
        return (
          <td key="fechaAlta" className={`${tdBase} font-mono text-slate-400 whitespace-nowrap`}>
            {vehicle.fechaAlta || '-'}
          </td>
        );

      default:
        return null;
    }
  };

  const visibleCount = columnOrder.filter(k => visibleColumns[k]).length;

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar (Bento style) */}
      <div className="bg-[#16191F] p-4 rounded-xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="search-fleet"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, modelo, marca, patente, código interno o categoría..."
              className="w-full pl-10 pr-4 py-2 bg-[#0F1115] border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Action Tools & View Switcher */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0F1115] p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-slate-800 text-amber-500 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista de Tabla"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-slate-800 text-amber-500 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista de Tarjetas Bento"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
            </div>

            {/* Table Density Selector (3 levels) */}
            <TableDensitySelector
              density={activeDensity}
              onChangeDensity={handleDensityChange}
            />

            {/* Column Visibility & Drag Reorder Manager Button */}
            <button
              id="btn-open-column-config"
              onClick={onOpenColumnModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition cursor-pointer group"
              title="Personalizar qué columnas ver y reordenar con drag & drop"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-45 transition-transform" />
              <span>Columnas ({visibleCount})</span>
            </button>

            {/* Import / Export Hub Button */}
            {onOpenImportExport && (
              <button
                type="button"
                onClick={onOpenImportExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition cursor-pointer"
                title="Importar y Exportar datos de Flota (Excel / CSV / Plantilla)"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Importar / Exportar</span>
              </button>
            )}

            {/* Export Quick CSV */}
            {onExportCSV && (
              <button
                type="button"
                onClick={onExportCSV}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-slate-800 transition cursor-pointer"
                title="Descargar archivo CSV oficial"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            )}

            {/* Dar de alta button */}
            <button
              id="btn-alta-vehiculo"
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-black" />
              <span>+ Alta de Vehículo</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          {/* Status Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mr-1">Estado:</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500 text-black'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Todos ({fleet.length})
            </button>

            <button
              onClick={() => setStatusFilter('DISPONIBLE')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                statusFilter === 'DISPONIBLE'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-950/60'
              }`}
            >
              Disponibles ({fleet.filter(v => v.estado === 'DISPONIBLE').length})
            </button>

            <button
              onClick={() => setStatusFilter('ALQUILADO')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALQUILADO'
                  ? 'bg-amber-600 text-black font-bold'
                  : 'bg-amber-950/30 text-amber-400 border border-amber-800/40 hover:bg-amber-950/60'
              }`}
            >
              En Alquiler ({fleet.filter(v => v.estado === 'ALQUILADO').length})
            </button>

            <button
              onClick={() => setStatusFilter('EN_MANTENIMIENTO')}
              className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                statusFilter === 'EN_MANTENIMIENTO'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-950/30 text-red-400 border border-red-800/40 hover:bg-red-950/60'
              }`}
            >
              Mantenimiento ({fleet.filter(v => v.estado === 'EN_MANTENIMIENTO').length})
            </button>
          </div>

          {/* Classification Dropdown filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Categoría:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-2.5 py-1 rounded bg-[#0F1115] border border-slate-800 text-xs font-semibold text-slate-300 outline-none focus:border-amber-500"
            >
              <option value="ALL">Todas las Categorías</option>
              {availableClassifications.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Drag & Drop Hint Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-amber-500/80" />
          <span>Tip: Puedes arrastrar cualquier encabezado de columna para reordenar la tabla en vivo.</span>
        </span>
        <span>
          Mostrando <strong className="text-white">{processedFleet.length}</strong> de <strong className="text-white">{fleet.length}</strong> equipos
        </span>
      </div>

      {/* Main Table Layout (Bento Grid Card) */}
      {viewMode === 'table' ? (
        <div className="bg-[#16191F] border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Table Header with Drag & Drop */}
              <thead>
                <tr className="bg-slate-800/50 text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none border-b border-slate-700">
                  {columnOrder.map(colKey => renderHeaderCell(colKey))}

                  {/* ACCIONES (Fixed column) */}
                  <th className={`${densityCfg.thPadding} border-b border-slate-700 text-center ${activeDensity === 'ultra' ? 'w-16' : activeDensity === 'compact' ? 'w-20' : 'w-24'} sticky right-0 bg-slate-900/90 z-10 border-l border-slate-800`}>
                    <span className={densityCfg.headerFontSize}>ACCIONES</span>
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className={densityCfg.fontSize}>
                {processedFleet.length === 0 ? (
                  <tr>
                    <td colSpan={visibleCount + 1} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 text-slate-600" />
                        <p className="text-sm font-semibold text-slate-300">No se encontraron vehículos ni máquinas</p>
                        <p className="text-xs text-slate-500">
                          Prueba ajustando los filtros de búsqueda o da de alta un nuevo equipo.
                        </p>
                        <button
                          onClick={onOpenCreateModal}
                          className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs"
                        >
                          + Dar de Alta Vehículo
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processedFleet.map((vehicle, idx) => {
                    const isEven = idx % 2 === 1;

                    return (
                      <tr 
                        key={vehicle.id}
                        className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition ${isEven ? 'bg-slate-800/10' : ''}`}
                      >
                        {columnOrder.map(colKey => renderBodyCell(colKey, vehicle))}

                        {/* ACCIONES */}
                        <td className={`${densityCfg.tdPadding} text-center whitespace-nowrap sticky right-0 bg-[#16191F]/90 group-hover:bg-[#1C2028] border-l border-slate-800`}>
                          <div className={`flex items-center justify-center ${densityCfg.gap}`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleDashboard && onToggleDashboard(vehicle.id);
                              }}
                              className={`${densityCfg.btnPadding} rounded transition cursor-pointer font-mono text-[10px] font-bold px-1.5 py-1 ${
                                vehicle.mostrarEnDashboard !== false
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300 border border-slate-700'
                              }`}
                              title={vehicle.mostrarEnDashboard !== false ? 'Visible en Dashboard de Control (Click para ocultar)' : 'Oculto del Dashboard de Control (Click para mostrar)'}
                            >
                              {vehicle.mostrarEnDashboard !== false ? 'Dashboard: Sí' : 'Dashboard: No'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(vehicle);
                              }}
                              className={`${densityCfg.btnPadding} rounded text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer`}
                              title="Ver ficha técnica"
                            >
                              <Eye className={densityCfg.iconSize} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditVehicle(vehicle);
                              }}
                              className={`${densityCfg.btnPadding} rounded text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition cursor-pointer`}
                              title="Editar vehículo"
                            >
                              <Edit3 className={densityCfg.iconSize} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteVehicle(vehicle.id);
                              }}
                              className={`${densityCfg.btnPadding} rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition cursor-pointer`}
                              title="Eliminar de flota"
                            >
                              <Trash2 className={densityCfg.iconSize} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bento Table Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-800/30 text-xs">
            <div className="text-slate-500">
              Mostrando <span className="text-white font-bold">{processedFleet.length}</span> de <span className="text-white font-bold">{fleet.length}</span> registros de flota
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-amber-500 font-bold">
                LA HORMIGA PRO
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Visual Bento Cards Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedFleet.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-[#16191F] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col"
            >
              {/* Card Image */}
              <div className="relative h-40 bg-slate-900 overflow-hidden">
                <img
                  src={vehicle?.fotografia || 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80'}
                  alt={vehicle?.modeloMarca || ''}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 rounded bg-[#0F1115]/90 text-amber-500 font-bold text-xs border border-slate-800 font-mono">
                    {vehicle.id}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={vehicle.estado} size="sm" />
                </div>
                <div className="absolute bottom-2 left-3 right-3 text-slate-300 text-[11px] bg-[#0F1115]/80 backdrop-blur-xs px-2.5 py-1 rounded flex justify-between font-mono">
                  <span>ID: {vehicle.id}</span>
                  <span>Patente: {vehicle.patente}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {vehicle.clasificacion}
                  </div>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {vehicle.modeloMarca}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    📍 {vehicle.ubicacionActual || 'Base Central'}
                  </p>
                </div>

                {/* Price pill */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Costo / Sugerido</span>
                    <div className="font-mono text-xs">
                      <span className="text-slate-500 line-through mr-1.5">{formatCurrency(vehicle.precioCosto)}</span>
                      <span className="text-amber-500 font-bold">{formatCurrency(vehicle.precioSugerido)}/d</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewDetails(vehicle)}
                      className="px-2.5 py-1 rounded bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-amber-500 hover:text-black transition cursor-pointer"
                    >
                      Ficha
                    </button>
                    <button
                      onClick={() => onEditVehicle(vehicle)}
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {imagePreviewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setImagePreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-xl overflow-hidden border border-slate-700 bg-[#16191F]">
            <img
              src={imagePreviewUrl}
              alt="Vista ampliada"
              className="w-full h-full object-contain max-h-[80vh]"
            />
            <button
              onClick={() => setImagePreviewUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-white hover:bg-amber-500 hover:text-black transition font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
