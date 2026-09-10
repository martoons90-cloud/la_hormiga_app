import React, { useState, useMemo } from 'react';
import { Employee, EmployeeStatus, Vehicle, TableColumnConfig, TableDensity } from '../types';
import { EMPLOYEE_COLUMNS, EmployeeColumnKey } from '../data/tableColumns';
import { loadEmployeeColumnConfig, saveEmployeeColumnConfig, resetTableColumnConfig, formatCurrency } from '../services/storage';
import { ColumnManagerModal } from './ColumnManagerModal';
import { DriverStatusBadge } from './DriverStatusBadge';
import { TableDensitySelector } from './TableDensitySelector';
import { DENSITY_CONFIG, getSavedTableDensity, saveTableDensity } from '../utils/densityStyles';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  FileSpreadsheet, 
  Phone, 
  HardHat, 
  Truck, 
  Building2, 
  Layers, 
  MapPin, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2,
  Clock,
  Briefcase,
  IdCard,
  Hash,
  FileText,
  SlidersHorizontal,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  UploadCloud,
  RotateCcw
} from 'lucide-react';

interface DriverSectionProps {
  drivers: Employee[];
  fleet: Vehicle[];
  density?: TableDensity;
  onChangeDensity?: (density: TableDensity) => void;
  onOpenCreateModal: () => void;
  onViewDetails: (employee: Employee) => void;
  onEditDriver: (employee: Employee) => void;
  onDeleteDriver: (id: string) => void;
  onChangeStatus: (id: string, newStatus: EmployeeStatus) => void;
  onExportCSV: () => void;
  onOpenImportExport?: () => void;
  onResetDrivers?: () => void;
  onClearAllDrivers?: () => void;
  onDeleteSelectedDrivers?: (ids: string[]) => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
}

export const DriverSection: React.FC<DriverSectionProps> = ({
  drivers,
  fleet,
  density,
  onChangeDensity,
  onOpenCreateModal,
  onViewDetails,
  onEditDriver,
  onDeleteDriver,
  onChangeStatus,
  onExportCSV,
  onOpenImportExport,
  onResetDrivers,
  onClearAllDrivers,
  onDeleteSelectedDrivers,
  onViewVehicle,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const [sectorFilter, setSectorFilter] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Sorting state
  const [sortField, setSortField] = useState<EmployeeColumnKey | null>('nombreApellido');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: EmployeeColumnKey) => {
    if (field === 'foto') return; // photo not sortable
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDoubleClickSort = (field: EmployeeColumnKey, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (field === 'foto') return;
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Column Configuration State & Modal
  const [columnConfig, setColumnConfig] = useState<TableColumnConfig<EmployeeColumnKey>>(() => loadEmployeeColumnConfig());
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Table header drag and drop state
  const [draggedHeaderKey, setDraggedHeaderKey] = useState<EmployeeColumnKey | null>(null);
  const [dragOverHeaderKey, setDragOverHeaderKey] = useState<EmployeeColumnKey | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = drivers.length;
    const activos = drivers.filter((d) => d.estado === 'ACTIVO').length;
    const enObra = drivers.filter((d) => d.estado === 'EN_OBRA' || (d.estado as string) === 'EN_VIAJE').length;
    const enLicencia = drivers.filter((d) => d.estado === 'LICENCIA').length;
    const inactivos = drivers.filter((d) => d.estado === 'INACTIVO').length;

    return {
      total,
      activos,
      enObra,
      enLicencia,
      inactivos,
    };
  }, [drivers]);

  // Unique sectors for filter
  const allSectors = useMemo(() => {
    const set = new Set<string>();
    drivers.forEach((d) => {
      if (d.sector) set.add(d.sector);
    });
    return Array.from(set);
  }, [drivers]);

  // Filtered & sorted employees
  const filteredEmployees = useMemo(() => {
    const list = drivers.filter((d) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (d.nombreApellido || '').toLowerCase().includes(search) ||
        (d.codigoEmpleado || '').toLowerCase().includes(search) ||
        (d.legajo || '').toLowerCase().includes(search) ||
        (d.categoria || '').toLowerCase().includes(search) ||
        (d.sector || '').toLowerCase().includes(search) ||
        (d.obra || '').toLowerCase().includes(search) ||
        (d.id || '').toLowerCase().includes(search) ||
        (d.dni || '').toLowerCase().includes(search);

      const matchStatus =
        statusFilter === 'TODOS' ||
        d.estado === statusFilter ||
        (statusFilter === 'EN_OBRA' && (d.estado as string) === 'EN_VIAJE');

      const matchSector = sectorFilter === 'TODOS' || d.sector === sectorFilter;

      return matchSearch && matchStatus && matchSector;
    });

    if (sortField && sortField !== 'foto') {
      list.sort((a, b) => {
        let valA: any = a[sortField as keyof Employee] ?? '';
        let valB: any = b[sortField as keyof Employee] ?? '';

        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
            : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
        }

        if (typeof valA === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        return 0;
      });
    }

    return list;
  }, [drivers, searchTerm, statusFilter, sectorFilter, sortField, sortDirection]);

  const allFilteredIds = useMemo(() => filteredEmployees.map(e => e.id), [filteredEmployees]);

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

  // Handle saving column preferences
  const handleSaveColumnConfig = (newConfig: TableColumnConfig<EmployeeColumnKey>) => {
    setColumnConfig(newConfig);
    saveEmployeeColumnConfig(newConfig);
  };

  const handleResetColumnDefaults = () => {
    const defaults = resetTableColumnConfig('la_hormiga_employee_columns_v1', EMPLOYEE_COLUMNS);
    setColumnConfig(defaults);
  };

  // Header drag and drop handlers
  const handleHeaderDragStart = (key: EmployeeColumnKey, e: React.DragEvent) => {
    setDraggedHeaderKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleHeaderDragOver = (key: EmployeeColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHeaderKey !== key) {
      setDragOverHeaderKey(key);
    }
  };

  const handleHeaderDragLeave = (key: EmployeeColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverHeaderKey === key) {
      setDragOverHeaderKey(null);
    }
  };

  const handleHeaderDrop = (targetKey: EmployeeColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    const sourceKey = (e.dataTransfer.getData('text/plain') as EmployeeColumnKey) || draggedHeaderKey;
    if (!sourceKey || sourceKey === targetKey) {
      setDraggedHeaderKey(null);
      setDragOverHeaderKey(null);
      return;
    }

    const newOrder = [...columnConfig.order];
    const sourceIdx = newOrder.indexOf(sourceKey);
    const targetIdx = newOrder.indexOf(targetKey);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, sourceKey);
      const updated: TableColumnConfig<EmployeeColumnKey> = {
        ...columnConfig,
        order: newOrder
      };
      setColumnConfig(updated);
      saveEmployeeColumnConfig(updated);
    }

    setDraggedHeaderKey(null);
    setDragOverHeaderKey(null);
  };

  const handleHeaderDragEnd = () => {
    setDraggedHeaderKey(null);
    setDragOverHeaderKey(null);
  };

  // Dynamic header rendering
  const renderHeaderCell = (colKey: EmployeeColumnKey) => {
    if (!columnConfig.visible[colKey]) return null;

    const def = EMPLOYEE_COLUMNS.find(c => c.key === colKey);
    const isDragging = draggedHeaderKey === colKey;
    const isDragOver = dragOverHeaderKey === colKey;
    const isSorted = sortField === colKey;
    const isSortable = colKey !== 'foto';

    const baseClass = `${densityCfg.thPadding} font-bold uppercase tracking-wider ${densityCfg.headerFontSize} transition select-none group ${
      isDragOver
        ? 'border-l-4 border-amber-500 bg-amber-500/20 text-amber-300'
        : isDragging
        ? 'opacity-40 bg-slate-900'
        : isSorted
        ? 'bg-amber-500/10 text-amber-300'
        : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
    } ${isSortable ? 'cursor-pointer' : 'cursor-grab'}`;

    return (
      <th
        key={colKey}
        draggable={true}
        onDragStart={(e) => handleHeaderDragStart(colKey, e)}
        onDragOver={(e) => handleHeaderDragOver(colKey, e)}
        onDragLeave={(e) => handleHeaderDragLeave(colKey, e)}
        onDrop={(e) => handleHeaderDrop(colKey, e)}
        onDragEnd={handleHeaderDragEnd}
        onClick={() => isSortable && handleSort(colKey)}
        onDoubleClick={(e) => isSortable && handleDoubleClickSort(colKey, e)}
        className={baseClass}
        title={isSortable ? `Doble clic para ordenar A-Z / Z-A (Actualmente: ${isSorted ? (sortDirection === 'asc' ? 'A-Z' : 'Z-A') : 'sin ordenar'}) • Arrastrar para mover` : 'Arrastra para reordenar columna'}
      >
        <div className={`flex items-center ${densityCfg.gap}`}>
          <GripVertical className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition shrink-0 cursor-grab" />
          <span className={`truncate ${densityCfg.headerFontSize}`}>{def?.label || colKey}</span>
          {isSorted ? (
            <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40 shrink-0 lowercase">
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp className="w-2.5 h-2.5" />
                  <span className="uppercase">A-Z</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-2.5 h-2.5" />
                  <span className="uppercase">Z-A</span>
                </>
              )}
            </span>
          ) : (
            isSortable && <ArrowUpDown className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  // Dynamic body cell rendering
  const renderBodyCell = (colKey: EmployeeColumnKey, emp: Employee) => {
    if (!columnConfig.visible[colKey]) return null;

    const tdBase = `${densityCfg.tdPadding} ${densityCfg.fontSize}`;

    switch (colKey) {
      case 'id':
        return (
          <td key="id" className={`${tdBase} font-mono font-bold text-amber-500 whitespace-nowrap`}>
            {emp.id}
          </td>
        );

      case 'codigoEmpleado':
        return (
          <td key="codigoEmpleado" className={`${tdBase} font-mono font-bold text-white whitespace-nowrap`}>
            <span className={`rounded bg-[#0F1115] border border-slate-700 ${
              activeDensity === 'ultra' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5'
            }`}>
              {emp.codigoEmpleado}
            </span>
          </td>
        );

      case 'foto':
        return (
          <td key="foto" className={`${tdBase} whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
            <img
              src={emp.foto}
              alt={emp.nombreApellido}
              className={`${
                activeDensity === 'ultra' ? 'w-6 h-6' : activeDensity === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
              } rounded-full object-cover border border-amber-500/50 bg-slate-900`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </td>
        );

      case 'nombreApellido':
        return (
          <td key="nombreApellido" className={`${tdBase} font-bold text-white whitespace-nowrap`}>
            <div className="flex flex-col">
              <span className={`font-bold group-hover:text-amber-400 transition ${densityCfg.fontSize}`}>
                {emp.nombreApellido}
              </span>
              {emp.telefono && activeDensity !== 'ultra' && (
                <span className="text-[10px] text-slate-400 font-normal">
                  Tel: {emp.telefono}
                </span>
              )}
            </div>
          </td>
        );

      case 'legajo':
        return (
          <td key="legajo" className={`${tdBase} font-mono font-bold text-slate-200 whitespace-nowrap`}>
            <span className={`rounded bg-slate-800/80 border border-slate-700 text-amber-300 ${
              activeDensity === 'ultra' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5'
            }`}>
              {emp.legajo}
            </span>
          </td>
        );

      case 'categoria':
        return (
          <td key="categoria" className={`${tdBase} text-slate-300 whitespace-nowrap font-medium`}>
            <div className={`flex items-center ${densityCfg.gap}`}>
              <Briefcase className={`${densityCfg.iconSize} text-amber-500 shrink-0`} />
              <span>{emp.categoria}</span>
            </div>
          </td>
        );

      case 'sector':
        return (
          <td key="sector" className={`${tdBase} text-slate-300 whitespace-nowrap`}>
            <span className={`rounded-md bg-[#0F1115] border border-slate-800 text-slate-300 ${
              activeDensity === 'ultra' ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5'
            }`}>
              {emp.sector}
            </span>
          </td>
        );

      case 'obra':
        return (
          <td key="obra" className={`${tdBase} text-slate-300 whitespace-nowrap`}>
            <div className={`flex items-center ${densityCfg.gap} text-amber-400 font-medium`}>
              <MapPin className={`${densityCfg.iconSize} text-amber-500 shrink-0`} />
              <span>{emp.obra}</span>
            </div>
          </td>
        );

      case 'estado':
        return (
          <td key="estado" className={`${tdBase} whitespace-nowrap`}>
            <DriverStatusBadge 
              status={emp.estado} 
              size={activeDensity === 'ultra' ? 'xs' : 'sm'} 
            />
          </td>
        );

      default:
        return null;
    }
  };

  const visibleCount = columnConfig.order.filter(k => columnConfig.visible[k]).length;

  return (
    <div className="space-y-6">
      
      {/* Header & Metrics Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
            <HardHat className="w-3.5 h-3.5" />
            Recursos Humanos & Plantel Operativo
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Nómina de Empleados
          </h2>
          <p className="text-xs text-slate-400">
            Control oficial con columnas requeridas: ID, Código, Nombre y Apellido, Legajo, Categoría, Foto, Sector, Obra y Estado.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
          {/* Column Customizer Button */}
          <button
            id="btn-columnas-empleados"
            onClick={() => setIsColumnModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16191F] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition cursor-pointer group"
            title="Personalizar columnas visibles y orden"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
            <span>Columnas ({visibleCount})</span>
          </button>

          {/* Import / Export Hub Button */}
          {onOpenImportExport && (
            <button
              type="button"
              onClick={onOpenImportExport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#16191F] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition cursor-pointer"
              title="Importar y Exportar nómina (Excel / CSV / Plantilla)"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Importar / Exportar</span>
            </button>
          )}

          {onResetDrivers && (
            <button
              onClick={onResetDrivers}
              className="flex items-center gap-2 px-3 py-2 bg-[#16191F] hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 font-bold text-xs rounded-xl border border-slate-800 transition cursor-pointer"
              title="Restaurar empleados predeterminados"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Restaurar</span>
            </button>
          )}

          {onClearAllDrivers && (
            <button
              onClick={onClearAllDrivers}
              className="flex items-center gap-2 px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 transition cursor-pointer"
              title="Borrar todos los registros de empleados"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Borrar Todos</span>
            </button>
          )}

          <button
            onClick={onExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#16191F] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition cursor-pointer"
            title="Exportar nómina a CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            id="btn-alta-empleado-principal"
            onClick={onOpenCreateModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-bold shadow-lg shadow-amber-500/15 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Alta Empleado</span>
          </button>
        </div>
      </div>

      {/* Batch Selection Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs text-amber-300 shadow-lg">
          <span className="font-bold">
            {selectedIds.length} empleados seleccionados
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
                if (onDeleteSelectedDrivers) {
                  onDeleteSelectedDrivers(selectedIds);
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

      {/* Bento Grid Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        
        {/* Total Empleados */}
        <div className="p-4 rounded-xl bg-[#16191F] border border-slate-800 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Empleados</span>
            <div className="text-2xl font-black text-white">{stats.total}</div>
            <p className="text-[11px] text-slate-500 font-medium">Plantel Registrado</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Activos */}
        <div className="p-4 rounded-xl bg-[#16191F] border border-slate-800 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="space-y-1">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Disponibles</span>
            <div className="text-2xl font-black text-emerald-400">{stats.activos}</div>
            <p className="text-[11px] text-slate-500 font-medium">Base Central</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* En Obra */}
        <div className="p-4 rounded-xl bg-[#16191F] border border-slate-800 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="space-y-1">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">En Obra</span>
            <div className="text-2xl font-black text-amber-400">{stats.enObra}</div>
            <p className="text-[11px] text-slate-500 font-medium">En Destino Operativo</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* En Licencia */}
        <div className="p-4 rounded-xl bg-[#16191F] border border-slate-800 flex items-center justify-between relative overflow-hidden group hover:border-slate-700 transition">
          <div className="space-y-1">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">En Licencia</span>
            <div className="text-2xl font-black text-blue-400">{stats.enLicencia}</div>
            <p className="text-[11px] text-slate-500 font-medium">Vacaciones / Médico</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter and View Mode Controls */}
      <div className="p-4 rounded-xl bg-[#16191F] border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Nombre, Código, Legajo, Categoría, Sector u Obra..."
              className="w-full bg-[#0F1115] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sector filter */}
            <div className="flex items-center gap-1.5 bg-[#0F1115] border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="TODOS" className="bg-[#16191F]">Todos los Sectores</option>
                {allSectors.map((s) => (
                  <option key={s} value={s} className="bg-[#16191F]">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1.5 bg-[#0F1115] border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-300 focus:outline-none cursor-pointer font-semibold"
              >
                <option value="TODOS" className="bg-[#16191F]">Todos los Estados</option>
                <option value="ACTIVO" className="bg-[#16191F]">Activos / Disponibles</option>
                <option value="EN_OBRA" className="bg-[#16191F]">En Obra</option>
                <option value="LICENCIA" className="bg-[#16191F]">En Licencia</option>
                <option value="INACTIVO" className="bg-[#16191F]">Inactivos / Baja</option>
              </select>
            </div>

            {/* Table Density Selector (3 levels) */}
            <TableDensitySelector
              density={activeDensity}
              onChangeDensity={handleDensityChange}
            />

            {/* View switcher */}
            <div className="flex items-center bg-[#0F1115] border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Tabla"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
                }`}
                title="Vista Tarjetas Bento"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

        {/* Active filters pill list */}
        {(searchTerm || statusFilter !== 'TODOS' || sectorFilter !== 'TODOS') && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
            <span className="text-slate-500">Filtros activos:</span>
            {searchTerm && (
              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                Texto: "{searchTerm}"
              </span>
            )}
            {sectorFilter !== 'TODOS' && (
              <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded text-[11px]">
                Sector: {sectorFilter}
              </span>
            )}
            {statusFilter !== 'TODOS' && (
              <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded text-[11px]">
                Estado: {statusFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('TODOS');
                setSectorFilter('TODOS');
              }}
              className="text-[11px] text-amber-400 hover:underline ml-auto cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Drag Hint Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-amber-500/80" />
          <span>Arrastra los encabezados para reordenar la tabla en vivo.</span>
        </span>
        <span>
          Mostrando <strong>{filteredEmployees.length}</strong> de {drivers.length} empleados
        </span>
      </div>

      {/* Main List Section: Table or Cards */}
      {filteredEmployees.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#16191F] border border-dashed border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No se encontraron empleados</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No hay registros que coincidan con los filtros seleccionados o el plantel está vacío.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg shadow-sm hover:bg-amber-400 transition cursor-pointer inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrar Nuevo Empleado</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* DYNAMIC TABLE VIEW WITH DRAG & DROP */
        <div className="rounded-xl border border-slate-800 bg-[#16191F] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b border-slate-800 bg-[#121418] text-slate-400 font-bold uppercase tracking-wider ${densityCfg.headerFontSize}`}>
                  <th className={`${densityCfg.thPadding} w-10 text-center`}>
                    <input
                      type="checkbox"
                      checked={allFilteredIds.length > 0 && selectedIds.length === allFilteredIds.length}
                      onChange={toggleSelectAll}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                      title="Seleccionar todos los visibles"
                    />
                  </th>
                  {columnConfig.order.map((colKey) => renderHeaderCell(colKey))}
                  <th className={`${densityCfg.thPadding} text-right`}>ACCIONES</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-800/80 ${densityCfg.fontSize}`}>
                {filteredEmployees.map((emp) => {
                  const cleanPhone = emp.telefono ? emp.telefono.replace(/[^0-9]/g, '') : '';

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-800/40 transition group cursor-pointer ${selectedIds.includes(emp.id) ? 'bg-amber-500/10' : ''}`}
                      onClick={() => onViewDetails(emp)}
                    >
                      <td className={`${densityCfg.tdPadding} w-10 text-center`} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(emp.id)}
                          onChange={() => toggleSelectOne(emp.id)}
                          className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      {columnConfig.order.map((colKey) => renderBodyCell(colKey, emp))}

                      {/* ACCIONES */}
                      <td
                        className={`${densityCfg.tdPadding} text-right whitespace-nowrap`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className={`flex items-center justify-end ${densityCfg.gap}`}>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${densityCfg.btnPadding} rounded-lg bg-emerald-950/60 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-800/60 transition`}
                              title="Contactar por WhatsApp"
                            >
                              <Phone className={densityCfg.iconSize} />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails(emp);
                            }}
                            className={`${densityCfg.btnPadding} rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer`}
                            title="Ver Ficha Completa"
                          >
                            <Eye className={densityCfg.iconSize} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditDriver(emp);
                            }}
                            className={`${densityCfg.btnPadding} rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-300 transition cursor-pointer`}
                            title="Editar Empleado"
                          >
                            <Edit3 className={densityCfg.iconSize} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteDriver(emp.id);
                            }}
                            className={`${densityCfg.btnPadding} rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition cursor-pointer`}
                            title="Dar de Baja"
                          >
                            <Trash2 className={densityCfg.iconSize} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 border-t border-slate-800 bg-[#121418] flex items-center justify-between text-xs text-slate-400">
            <span>Mostrando <strong>{filteredEmployees.length}</strong> de {drivers.length} empleados registrados</span>
            <span className="text-[11px] font-mono text-slate-500">Columnas activas: {visibleCount}</span>
          </div>
        </div>
      ) : (
        
        /* BENTO CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => {
            const assignedVehicle = fleet.find((v) => v.id === emp.vehiculoAsignadoId);
            const cleanPhone = emp.telefono ? emp.telefono.replace(/[^0-9]/g, '') : '';

            return (
              <div
                key={emp.id}
                onClick={() => onViewDetails(emp)}
                className="bg-[#16191F] border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between group cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div className="space-y-4">
                  
                  {/* Card Header: Avatar, Identifiers & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={emp.foto}
                          alt={emp.nombreApellido}
                          className="w-13 h-13 rounded-full object-cover border-2 border-amber-500/80 bg-slate-900"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-amber-500">
                            {emp.id}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0F1115] border border-slate-700 text-slate-300">
                            {emp.codigoEmpleado}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-base leading-tight group-hover:text-amber-400 transition mt-0.5">
                          {emp.nombreApellido}
                        </h4>
                        <span className="text-[11px] font-mono text-amber-400 font-bold">
                          Legajo: {emp.legajo}
                        </span>
                      </div>
                    </div>

                    <DriverStatusBadge status={emp.estado} size="sm" />
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2 text-xs bg-[#0F1115] p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        Categoría:
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]" title={emp.categoria}>
                        {emp.categoria}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                        Sector:
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]" title={emp.sector}>
                        {emp.sector}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        Obra:
                      </span>
                      <span className="font-bold text-amber-400 truncate max-w-[170px]" title={emp.obra}>
                        {emp.obra}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Machine if any */}
                  {assignedVehicle && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewVehicle) onViewVehicle(assignedVehicle);
                      }}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#0F1115] border border-slate-800 hover:border-amber-500/40 transition text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-bold text-white truncate max-w-[150px]">
                          [{assignedVehicle.codigoEquipo}] {assignedVehicle.modeloMarca}
                        </span>
                      </div>
                      <span className="text-[10px] text-amber-400 font-bold hover:underline">Ver Equipo</span>
                    </div>
                  )}

                </div>

                {/* Footer Action Buttons */}
                <div
                  className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-800/60 transition"
                        title="Contactar WhatsApp"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(emp);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                    >
                      Ficha
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditDriver(emp);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-300 transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteDriver(emp.id);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Column Manager Modal for Employees */}
      <ColumnManagerModal<EmployeeColumnKey>
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title="Personalizar Columnas - Nómina de Empleados"
        subtitle="Activa, desactiva y arrastra para reordenar las columnas de la nómina de personal."
        columnDefinitions={EMPLOYEE_COLUMNS}
        columnConfig={columnConfig}
        onSaveConfig={handleSaveColumnConfig}
        onResetDefaults={handleResetColumnDefaults}
      />

    </div>
  );
};
