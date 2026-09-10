import React, { useState, useMemo } from 'react';
import { FuelDispensary, FuelVoucherStatus, Vehicle, Employee, TableColumnConfig, IssuedFuelVoucher, TableDensity } from '../types';
import { FUEL_VOUCHER_COLUMNS, FuelVoucherColumnKey } from '../data/tableColumns';
import { loadFuelColumnConfig, saveFuelColumnConfig, resetTableColumnConfig, formatCurrency } from '../services/storage';
import { ColumnManagerModal } from './ColumnManagerModal';
import { IssuedVoucherDetailModal } from './IssuedVoucherDetailModal';
import { TableDensitySelector } from './TableDensitySelector';
import { SearchableSelect } from './SearchableSelect';
import { DENSITY_CONFIG, getSavedTableDensity, saveTableDensity } from '../utils/densityStyles';
import { 
  Fuel, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  Eye, 
  Camera, 
  Calendar, 
  X, 
  Image as ImageIcon,
  ChevronRight,
  SlidersHorizontal,
  GripVertical,
  Ticket,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Layers,
  Sparkles,
  ExternalLink,
  UploadCloud
} from 'lucide-react';

interface FuelVoucherSectionProps {
  vouchers: FuelDispensary[];
  fleet: Vehicle[];
  employees: Employee[];
  issuedVouchers?: IssuedFuelVoucher[];
  density?: TableDensity;
  onChangeDensity?: (density: TableDensity) => void;
  onOpenCreateModal: () => void;
  onRendirVale?: (voucher: IssuedFuelVoucher) => void;
  onSwitchToIssuedVouchers?: () => void;
  onViewDetails: (voucher: FuelDispensary) => void;
  onViewIssuedVoucher?: (voucher: IssuedFuelVoucher) => void;
  onEditVoucher: (voucher: FuelDispensary) => void;
  onDeleteVoucher: (id: string) => void;
  onChangeStatus?: (id: string, newStatus: FuelVoucherStatus) => void;
  onExportCSV: () => void;
  onOpenImportExport?: () => void;
  onViewVehicle?: (vehicle: Vehicle) => void;
  onViewEmployee?: (employee: Employee) => void;
  onOpenVehicleAnalytics?: (vehicleCode: string) => void;
}

export const FuelVoucherSection: React.FC<FuelVoucherSectionProps> = ({
  vouchers,
  fleet,
  employees,
  issuedVouchers = [],
  density,
  onChangeDensity,
  onOpenCreateModal,
  onRendirVale,
  onSwitchToIssuedVouchers,
  onViewDetails,
  onViewIssuedVoucher,
  onEditVoucher,
  onDeleteVoucher,
  onChangeStatus,
  onExportCSV,
  onOpenImportExport,
  onViewVehicle,
  onViewEmployee,
  onOpenVehicleAnalytics,
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
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [clasificacionFilter, setClasificacionFilter] = useState<string>('TODOS');
  const [combustibleFilter, setCombustibleFilter] = useState<string>('TODOS');
  const [depositoFilter, setDepositoFilter] = useState<string>('TODOS');
  const [equipoFilter, setEquipoFilter] = useState<string>('TODOS');
  const [empleadoFilter, setEmpleadoFilter] = useState<string>('TODOS');
  const [groupByDate, setGroupByDate] = useState<boolean>(true);
  
  // Pending unrendered issued vouchers
  const pendingIssuedVouchers = useMemo(() => {
    return (issuedVouchers || []).filter(v => v.estado === 'EMITIDO');
  }, [issuedVouchers]);

  // Sorting state
  const [sortField, setSortField] = useState<FuelVoucherColumnKey>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: FuelVoucherColumnKey) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDoubleClickSort = (field: FuelVoucherColumnKey, e?: React.MouseEvent) => {
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

  // Helper to format ISO date to D/M/YYYY (e.g. 31/8/2026, 29/8/2026)
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

  // Helper to format quantity with comma decimals (positive values)
  const formatQuantity = (val?: number, tipo?: string, cantCarga?: number): string => {
    const num = Math.abs(cantCarga !== undefined ? cantCarga : val ?? 0);
    return num.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Helper to format numbers with dot thousand separator (e.g. 317.958)
  const formatNumber = (val?: number): string => {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return Number(val).toLocaleString('es-AR');
  };

  // Column Configuration & Modal State
  const [columnConfig, setColumnConfig] = useState<TableColumnConfig<FuelVoucherColumnKey>>(() => loadFuelColumnConfig());
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // Table header drag and drop state
  const [draggedHeaderKey, setDraggedHeaderKey] = useState<FuelVoucherColumnKey | null>(null);
  const [dragOverHeaderKey, setDragOverHeaderKey] = useState<FuelVoucherColumnKey | null>(null);

  // Image viewer modal state
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle: string } | null>(null);

  // Linked Issued Voucher popup modal state
  const [selectedIssuedVoucherForPopup, setSelectedIssuedVoucherForPopup] = useState<IssuedFuelVoucher | null>(null);

  // Helper to find or synthesize the linked issued fuel voucher
  const getLinkedIssuedVoucher = (v: FuelDispensary): IssuedFuelVoucher => {
    const orderNum = (v.numOrden || v.numVale || v.numComprobante || '').trim();
    
    // Check in existing issued vouchers array
    const matched = issuedVouchers.find(iv => 
      (orderNum && (iv.numVale === orderNum || iv.numComprobante === orderNum)) ||
      (v.valeId && iv.id === v.valeId) ||
      (v.id && iv.expendioId === v.id)
    );

    if (matched) {
      return matched;
    }

    // Match employee and vehicle from fleet for rich modal view
    const matchedEmp = employees.find(e => 
      e.codigoEmpleado === v.codigoEmpleado || 
      e.nombreApellido?.toLowerCase() === v.nombreApellido?.toLowerCase() ||
      e.legajo === v.legajo
    );
    const matchedVeh = fleet.find(f => 
      f.codigoEquipo === v.codigoEquipo || 
      f.patente?.toLowerCase() === v.patente?.toLowerCase()
    );

    return {
      id: `VAL-${orderNum || v.id}`,
      numVale: orderNum || v.numOrden || '00000',
      numComprobante: orderNum || v.numOrden || '00000',
      fechaEmision: v.fecha || new Date().toISOString().slice(0, 10),
      horaEmision: v.hora || '08:00',
      codigoEquipo: v.codigoEquipo || matchedVeh?.codigoEquipo || 'EQUIPO-01',
      marcaModelo: v.marcaModelo || matchedVeh?.modeloMarca || 'Equipo de Flota',
      patente: v.patente || matchedVeh?.patente || 'S/P',
      codigoEmpleado: v.codigoEmpleado || matchedEmp?.codigoEmpleado || 'CH-001',
      nombreApellido: v.nombreApellido || matchedEmp?.nombreApellido || 'Chofer Asignado',
      legajo: v.legajo || matchedEmp?.legajo || 'LEG-000',
      tipoComb: v.tipoComb || 'DIESEL',
      idCombustible: v.idCombustible || 'COMB-D500',
      litrosAutorizados: v.litrosAutorizados || v.cantidad || 0,
      cantidad: v.cantidad || 0,
      litrosReales: v.cantidad || 0,
      tipoCarga: v.carga || 'Tanque Lleno',
      estacionSurtidor: v.deposito || v.numEstacion || 'Estación YPF / Shell Autorizada',
      numEstacion: v.numEstacion || '',
      estado: 'RENDIDO',
      expendioId: v.id,
      numTicket: v.numTicket || v.numEstacion || `TK-${orderNum}`,
      odometroCarga: v.kilometraje ?? v.kmsHs,
      odometroSalida: (v.kilometraje ?? v.kmsHs) ? Math.max(0, (v.kilometraje ?? v.kmsHs ?? 0) - (v.kilometrosRec || 0)) : undefined,
      fotoTicket: v.fotoExpendio,
      fotoOdometro: v.fotoKilometraje,
      importeTotal: v.totalImporte || ((v.cantidad || 0) * (v.precioUnitario || 1350)),
      fechaRendicion: v.fecha,
      horaRendicion: v.hora,
      observaciones: v.observaciones || `Vale vinculado al registro de expendio ${v.id} (Nº Orden: ${orderNum})`
    };
  };

  // Stats calculation
  const stats = useMemo(() => {
    const total = vouchers.length;
    const totalLitros = vouchers.reduce((acc, v) => acc + (v.cantidad || 0), 0);
    const egresosCount = vouchers.filter(v => v.tipo?.toUpperCase() === 'EGRESO').length;
    const ingresosCount = vouchers.filter(v => v.tipo?.toUpperCase() === 'INGRESO').length;
    const fotosAdjuntas = vouchers.filter(v => Boolean(v.fotoExpendio || v.fotoKilometraje)).length;

    return {
      total,
      totalLitros,
      egresosCount,
      ingresosCount,
      fotosAdjuntas
    };
  }, [vouchers]);

  // Unique filters
  const allDepositos = useMemo(() => {
    const set = new Set<string>();
    vouchers.forEach((v) => {
      if (v.deposito) set.add(v.deposito);
    });
    return Array.from(set);
  }, [vouchers]);

  const allFuels = useMemo(() => {
    const set = new Set<string>();
    vouchers.forEach((v) => {
      if (v.tipoComb) set.add(v.tipoComb);
    });
    return Array.from(set);
  }, [vouchers]);

  const allClasificaciones = useMemo(() => {
    const set = new Set<string>();
    vouchers.forEach((v) => {
      if (v.clasificacion) set.add(v.clasificacion);
    });
    return Array.from(set);
  }, [vouchers]);

  const allEquipmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    fleet.forEach(f => {
      if (f.codigoEquipo) {
        map.set(f.codigoEquipo, `${f.codigoEquipo} - ${f.modeloMarca || f.patente || ''}`);
      }
    });
    vouchers.forEach(v => {
      if (v.codigoEquipo && !map.has(v.codigoEquipo)) {
        map.set(v.codigoEquipo, v.codigoEquipo);
      }
    });
    const opts = Array.from(map.entries()).map(([val, label]) => ({
      value: val,
      label: label
    }));
    opts.sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: 'TODOS', label: 'Todos los Equipos' }, ...opts];
  }, [fleet, vouchers]);

  const allEmployeeOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach(e => {
      const code = e.codigoEmpleado || e.legajo || e.nombreApellido;
      if (code) {
        map.set(code, `${e.nombreApellido} (${e.codigoEmpleado || e.legajo || ''})`);
      }
    });
    vouchers.forEach(v => {
      const code = v.codigoEmpleado || v.nombreApellido;
      if (code && !map.has(code)) {
        map.set(code, code);
      }
    });
    const opts = Array.from(map.entries()).map(([val, label]) => ({
      value: val,
      label: label
    }));
    opts.sort((a, b) => a.label.localeCompare(b.label));
    return [{ value: 'TODOS', label: 'Todos los Empleados' }, ...opts];
  }, [employees, vouchers]);

  // Filtered & sorted vouchers
  const filteredVouchers = useMemo(() => {
    const list = vouchers.filter((v) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (v.id || '').toLowerCase().includes(search) ||
        (v.deposito || '').toLowerCase().includes(search) ||
        (v.tipo || '').toLowerCase().includes(search) ||
        (v.codigoEmpleado || '').toLowerCase().includes(search) ||
        (v.nombreApellido || '').toLowerCase().includes(search) ||
        (v.codigoEquipo || '').toLowerCase().includes(search) ||
        (v.numOrden || '').toLowerCase().includes(search) ||
        (v.numEstacion || '').toLowerCase().includes(search) ||
        (v.tipoComb || '').toLowerCase().includes(search) ||
        (v.clasificacion || '').toLowerCase().includes(search);

      const matchTipo = tipoFilter === 'TODOS' || v.tipo?.toUpperCase() === tipoFilter;
      const matchFuel = combustibleFilter === 'TODOS' || v.tipoComb === combustibleFilter;
      const matchDep = depositoFilter === 'TODOS' || v.deposito === depositoFilter;
      const matchClasif = clasificacionFilter === 'TODOS' || v.clasificacion === clasificacionFilter;
      const matchEquipo = equipoFilter === 'TODOS' || (v.codigoEquipo || '').toLowerCase() === equipoFilter.toLowerCase();
      const matchEmpleado = empleadoFilter === 'TODOS' || 
        (v.codigoEmpleado || '').toLowerCase() === empleadoFilter.toLowerCase() ||
        (v.nombreApellido || '').toLowerCase() === empleadoFilter.toLowerCase();

      return matchSearch && matchTipo && matchFuel && matchDep && matchClasif && matchEquipo && matchEmpleado;
    });

    if (sortField) {
      list.sort((a, b) => {
        let valA: any = a[sortField as keyof FuelDispensary] ?? '';
        let valB: any = b[sortField as keyof FuelDispensary] ?? '';

        if (sortField === 'cantidad') {
          valA = Math.abs(a.cantCarga !== undefined ? a.cantCarga : (a.cantidad ?? 0));
          valB = Math.abs(b.cantCarga !== undefined ? b.cantCarga : (b.cantidad ?? 0));
        }

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
  }, [vouchers, searchTerm, tipoFilter, combustibleFilter, depositoFilter, clasificacionFilter, equipoFilter, empleadoFilter, sortField, sortDirection]);

  // Group vouchers by date
  const groupedVouchers = useMemo(() => {
    if (!groupByDate) {
      return { 'TODOS': filteredVouchers };
    }

    const groups: { [key: string]: FuelDispensary[] } = {};
    filteredVouchers.forEach(v => {
      const dateKey = v.fecha || 'Sin Fecha';
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(v);
    });

    return groups;
  }, [filteredVouchers, groupByDate]);

  // Sorted date keys descending
  const sortedDateKeys = useMemo(() => {
    return Object.keys(groupedVouchers).sort((a, b) => {
      if (a === 'TODOS') return 0;
      if (a === 'Sin Fecha') return 1;
      if (b === 'Sin Fecha') return -1;
      return b.localeCompare(a);
    });
  }, [groupedVouchers]);

  // Handle saving column preferences
  const handleSaveColumnConfig = (newConfig: TableColumnConfig<FuelVoucherColumnKey>) => {
    setColumnConfig(newConfig);
    saveFuelColumnConfig(newConfig);
  };

  const handleResetColumnDefaults = () => {
    const defaults = resetTableColumnConfig('la_hormiga_fuel_columns_v2', FUEL_VOUCHER_COLUMNS);
    setColumnConfig(defaults);
  };

  // Header drag and drop handlers
  const handleHeaderDragStart = (key: FuelVoucherColumnKey, e: React.DragEvent) => {
    setDraggedHeaderKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleHeaderDragOver = (key: FuelVoucherColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHeaderKey !== key) {
      setDragOverHeaderKey(key);
    }
  };

  const handleHeaderDragLeave = (key: FuelVoucherColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverHeaderKey === key) {
      setDragOverHeaderKey(null);
    }
  };

  const handleHeaderDrop = (targetKey: FuelVoucherColumnKey, e: React.DragEvent) => {
    e.preventDefault();
    const sourceKey = (e.dataTransfer.getData('text/plain') as FuelVoucherColumnKey) || draggedHeaderKey;
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
      const updated: TableColumnConfig<FuelVoucherColumnKey> = {
        ...columnConfig,
        order: newOrder
      };
      setColumnConfig(updated);
      saveFuelColumnConfig(updated);
    }

    setDraggedHeaderKey(null);
    setDragOverHeaderKey(null);
  };

  const handleHeaderDragEnd = () => {
    setDraggedHeaderKey(null);
    setDragOverHeaderKey(null);
  };

  // Render dynamic header cell with double-click sorting & sort indicator
  const renderHeaderCell = (colKey: FuelVoucherColumnKey) => {
    if (!columnConfig.visible[colKey]) return null;

    const def = FUEL_VOUCHER_COLUMNS.find(c => c.key === colKey);
    const isDragging = draggedHeaderKey === colKey;
    const isDragOver = dragOverHeaderKey === colKey;
    const isSorted = sortField === colKey;

    const baseClass = `${densityCfg.thPadding} font-bold transition select-none group cursor-pointer ${
      isDragOver
        ? 'border-l-4 border-amber-500 bg-amber-500/20 text-amber-300'
        : isDragging
        ? 'opacity-40 bg-slate-900'
        : isSorted
        ? 'bg-amber-500/10 text-amber-300'
        : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
    }`;

    const alignClass = def?.align === 'right' ? 'text-right' : def?.align === 'center' ? 'text-center' : 'text-left';

    return (
      <th
        key={colKey}
        draggable
        onDragStart={(e) => handleHeaderDragStart(colKey, e)}
        onDragOver={(e) => handleHeaderDragOver(colKey, e)}
        onDragLeave={(e) => handleHeaderDragLeave(colKey, e)}
        onDrop={(e) => handleHeaderDrop(colKey, e)}
        onDragEnd={handleHeaderDragEnd}
        onClick={() => handleSort(colKey)}
        onDoubleClick={(e) => handleDoubleClickSort(colKey, e)}
        className={`${baseClass} ${alignClass}`}
        title={`Click o Doble Click para ordenar por ${def?.label || colKey}. Arrastra para reordenar.`}
      >
        <div className={`flex items-center ${densityCfg.gap} ${def?.align === 'right' ? 'justify-end' : def?.align === 'center' ? 'justify-center' : 'justify-start'}`}>
          <GripVertical className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 cursor-grab shrink-0 transition-opacity" />
          <span className={`truncate ${densityCfg.headerFontSize}`}>{def?.label || colKey}</span>
          <span className="shrink-0">
            {isSorted ? (
              sortDirection === 'asc' ? (
                <ArrowUp className={`${densityCfg.iconSize} text-amber-400 font-bold`} />
              ) : (
                <ArrowDown className={`${densityCfg.iconSize} text-amber-400 font-bold`} />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-50" />
            )}
          </span>
        </div>
      </th>
    );
  };

  // Render individual body cells according to column definitions & exact formatting
  const renderBodyCell = (colKey: FuelVoucherColumnKey, v: FuelDispensary) => {
    if (!columnConfig.visible[colKey]) return null;

    const tdBase = `${densityCfg.tdPadding} ${densityCfg.fontSize}`;

    switch (colKey) {
      case 'id':
        return (
          <td key="id" className={`${tdBase} font-mono text-slate-300 font-medium`}>
            {v.id}
          </td>
        );

      case 'deposito':
        return (
          <td key="deposito" className={`${tdBase} text-slate-200 font-medium`}>
            {v.deposito || '-'}
          </td>
        );

      case 'tipo': {
        const isEgreso = v.tipo?.toUpperCase() === 'EGRESO';
        return (
          <td key="tipo" className={`${tdBase} font-bold`}>
            <span className={isEgreso ? 'text-rose-500' : 'text-emerald-500'}>
              {v.tipo?.toUpperCase() || 'EGRESO'}
            </span>
          </td>
        );
      }

      case 'cantidad': {
        const isEgreso = v.tipo?.toUpperCase() === 'EGRESO';
        return (
          <td key="cantidad" className={`${tdBase} text-right font-mono font-bold text-slate-100`}>
            {formatQuantity(v.cantidad, v.tipo, v.cantCarga)}
          </td>
        );
      }

      case 'codigoEmpleado':
        return (
          <td key="codigoEmpleado" className={`${tdBase} text-slate-200 font-medium uppercase truncate max-w-[160px]`} title={v.codigoEmpleado || v.nombreApellido}>
            {v.codigoEmpleado || v.nombreApellido || '-'}
          </td>
        );

      case 'codigoEquipo':
        return (
          <td key="codigoEquipo" className={`${tdBase} truncate max-w-[200px]`} title={v.codigoEquipo}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenVehicleAnalytics && v.codigoEquipo) {
                  onOpenVehicleAnalytics(v.codigoEquipo);
                } else if (onViewVehicle && v.codigoEquipo) {
                  const matched = fleet.find(f => f.codigoEquipo === v.codigoEquipo);
                  if (matched) onViewVehicle(matched);
                }
              }}
              className="text-amber-400 hover:text-amber-300 hover:underline font-bold cursor-pointer inline-flex items-center gap-1 text-left"
              title="Click para ver analítica de consumo y autonomía del vehículo"
            >
              <span>{v.codigoEquipo}</span>
            </button>
          </td>
        );

      case 'autonomiaVt':
        return (
          <td key="autonomiaVt" className={`${tdBase} text-right font-mono text-slate-300`}>
            {v.autonomiaVt || '00,00'}
          </td>
        );

      case 'autonom':
        {
          let val = v.autonom;
          if (!val || val.toUpperCase() === 'NORMAL' || val === '0,00' || val === '0' || val === '-') {
            const l = Math.abs(v.cantidad !== undefined ? v.cantidad : (v.cantCarga || 0));
            const kms = v.kilometrosRec || 0;
            if (kms > 0 && l > 0) {
              val = (kms / l).toFixed(2).replace('.', ',');
            } else {
              val = '-';
            }
          }
          return (
            <td key="autonom" className={`${tdBase} text-right font-mono text-slate-300`}>
              {val}
            </td>
          );
        }

      case 'numEstacion':
        return (
          <td key="numEstacion" className={`${tdBase} font-mono text-slate-300`}>
            {v.numEstacion || ''}
          </td>
        );

      case 'numOrden': {
        const orderNum = (v.numOrden || v.numVale || v.numComprobante || '').trim();
        if (!orderNum) {
          return (
            <td key="numOrden" className={`${tdBase} font-mono text-slate-500`}>
              -
            </td>
          );
        }

        return (
          <td key="numOrden" className={`${tdBase} font-mono`}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const linkedVoucher = getLinkedIssuedVoucher(v);
                setSelectedIssuedVoucherForPopup(linkedVoucher);
                onViewIssuedVoucher?.(linkedVoucher);
              }}
              className={`inline-flex items-center ${densityCfg.gap} ${
                activeDensity === 'ultra' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
              } rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-400 font-bold transition group/valebtn cursor-pointer shadow-xs active:scale-95`}
              title={`Hacer clic para ver el Vale de Combustible Nº ${orderNum} en un Popup`}
            >
              <Ticket className={`${densityCfg.iconSize} text-amber-400 group-hover/valebtn:rotate-12 transition-transform shrink-0`} />
              <span className="font-mono font-black underline decoration-amber-500/40 group-hover/valebtn:decoration-amber-300">
                {orderNum}
              </span>
            </button>
          </td>
        );
      }

      case 'tipoComb':
        return (
          <td key="tipoComb" className={`${tdBase} text-slate-200 font-medium`}>
            {v.tipoComb}
          </td>
        );

      case 'kilometraje':
        return (
          <td key="kilometraje" className={`${tdBase} text-right font-mono text-slate-200 font-bold`}>
            {formatNumber(v.kilometraje ?? v.kmsHs ?? 0)}
          </td>
        );

      case 'fotoExpendio':
        return (
          <td key="fotoExpendio" className={`${tdBase} text-center`}>
            {v.fotoExpendio ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage({
                    url: v.fotoExpendio!,
                    title: `Foto de Expendio - ${v.id}`,
                    subtitle: `${v.deposito} • ${v.tipoComb} • ${formatQuantity(v.cantidad, v.tipo, v.cantCarga)} Lts`
                  });
                }}
                className="relative inline-block group/img cursor-pointer"
                title="Click para ver foto ampliada del comprobante de expendio"
              >
                <img
                  src={v.fotoExpendio}
                  alt="Foto Expendio"
                  className={`${
                    activeDensity === 'ultra' ? 'w-5 h-5' : activeDensity === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
                  } rounded object-cover border border-slate-700 hover:border-amber-400 transition`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition">
                  <Eye className={`${densityCfg.iconSize} text-white`} />
                </div>
              </button>
            ) : (
              <span className="text-slate-600 text-[10px] italic">-</span>
            )}
          </td>
        );

      case 'fotoKilometraje':
        return (
          <td key="fotoKilometraje" className={`${tdBase} text-center`}>
            {v.fotoKilometraje ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage({
                    url: v.fotoKilometraje!,
                    title: `Foto de Kilometraje / Odómetro - ${v.id}`,
                    subtitle: `${v.codigoEquipo} • Odómetro / Horómetro: ${formatNumber(v.kilometraje ?? v.kmsHs)} km/hs`
                  });
                }}
                className="relative inline-block group/img cursor-pointer"
                title="Click para ver foto ampliada del tablero / odómetro"
              >
                <img
                  src={v.fotoKilometraje}
                  alt="Foto Kilometraje"
                  className={`${
                    activeDensity === 'ultra' ? 'w-5 h-5' : activeDensity === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
                  } rounded object-cover border border-slate-700 hover:border-amber-400 transition`}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition">
                  <Eye className={`${densityCfg.iconSize} text-white`} />
                </div>
              </button>
            ) : (
              <span className="text-slate-600 text-[10px] italic">-</span>
            )}
          </td>
        );

      case 'kilometrosRec':
        return (
          <td key="kilometrosRec" className={`${tdBase} text-right font-mono font-bold text-slate-200`}>
            {v.kilometrosRec !== undefined ? formatNumber(v.kilometrosRec) : '0'}
          </td>
        );

      case 'clasificacion':
        return (
          <td key="clasificacion" className={`${tdBase} text-slate-300`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`font-bold uppercase text-slate-300 ${activeDensity === 'ultra' ? 'text-[10px]' : 'text-xs'}`}>{v.clasificacion || 'MAQUINAS'}</span>
              <ChevronRight className={`${densityCfg.iconSize} text-slate-500 group-hover:text-amber-400 transition-colors shrink-0`} />
            </div>
          </td>
        );

      case 'carga':
        return (
          <td key="carga" className={`${tdBase} text-slate-300`}>
            {v.carga || '-'}
          </td>
        );

      case 'idCombustible':
        return (
          <td key="idCombustible" className={`${tdBase} font-mono text-slate-400`}>
            {v.idCombustible || '-'}
          </td>
        );

      case 'nombreApellido':
        return (
          <td key="nombreApellido" className={`${tdBase} text-slate-300`}>
            {v.nombreApellido || v.codigoEmpleado || '-'}
          </td>
        );

      case 'legajo':
        return (
          <td key="legajo" className={`${tdBase} font-mono text-slate-400`}>
            {v.legajo || '-'}
          </td>
        );

      case 'marcaModelo':
        return (
          <td key="marcaModelo" className={`${tdBase} text-slate-300 truncate max-w-[160px]`} title={v.marcaModelo}>
            {v.marcaModelo || '-'}
          </td>
        );

      case 'patente':
        return (
          <td key="patente" className={`${tdBase} font-mono text-slate-200`}>
            <span className={`rounded bg-slate-900 border border-slate-700/80 font-bold ${
              activeDensity === 'ultra' ? 'px-1 py-0 text-[10px]' : 'px-1.5 py-0.5 text-[11px]'
            }`}>
              {v.patente || 'S/P'}
            </span>
          </td>
        );

      case 'fecha':
        return (
          <td key="fecha" className={`${tdBase} font-mono text-slate-300`}>
            {formatDisplayDate(v.fecha)}
          </td>
        );

      case 'hora':
        return (
          <td key="hora" className={`${tdBase} font-mono text-slate-400`}>
            {v.hora || '-'}
          </td>
        );

      default:
        return null;
    }
  };

  const visibleCount = columnConfig.order.filter(k => columnConfig.visible[k]).length;

  return (
    <div className="space-y-4">
      {/* Breadcrumb Header Bar */}
      <div className="bg-[#12151B] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {/* Breadcrumb exact style */}
          <div className="flex items-center gap-1.5 text-xs font-black tracking-wider text-slate-400 uppercase">
            <span className="text-slate-400 hover:text-white transition">COMBUSTIBLE</span>
            <span className="text-slate-600 font-bold">&gt;</span>
            <span className="text-amber-400 font-black">EXPENDIO COMBUSTIBLE</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro detallado de cargas, egresos e ingresos con odómetro, autonomía y fotos de tickets.
          </p>
        </div>

        {/* Top Right Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Table Density Selector */}
          <TableDensitySelector
            density={activeDensity}
            onChangeDensity={handleDensityChange}
          />

          {/* Group by Date Toggle */}
          <button
            type="button"
            onClick={() => setGroupByDate(prev => !prev)}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              groupByDate 
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm' 
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Activar/Desactivar agrupación por fecha"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{groupByDate ? 'Agrupado por Fecha' : 'Sin Agrupar'}</span>
          </button>

          {/* Column Config */}
          <button
            type="button"
            onClick={() => setIsColumnModalOpen(true)}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            title="Personalizar columnas visibles y orden"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Columnas ({visibleCount})</span>
          </button>

          {/* Import / Export Hub */}
          {onOpenImportExport && (
            <button
              type="button"
              onClick={onOpenImportExport}
              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title="Importar y Exportar registros de expendio (Excel / CSV / Plantilla)"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Importar / Exportar</span>
            </button>
          )}

          {/* CSV Export */}
          <button
            type="button"
            onClick={onExportCSV}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
            title="Descargar archivo CSV oficial"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* Quick Action: Rendir Vale Emitido */}
          {pendingIssuedVouchers.length > 0 && onRendirVale && (
            <button
              type="button"
              onClick={() => onRendirVale(pendingIssuedVouchers[0])}
              className="px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold flex items-center gap-1.5 border border-amber-500/40 shadow-xs transition cursor-pointer active:scale-98"
              title="Llamar y rendir un vale emitido pendiente con su ticket"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-400" />
              <span>Rendir Vale ({pendingIssuedVouchers.length})</span>
            </button>
          )}

          {/* + AÑADIR button */}
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ AÑADIR</span>
          </button>
        </div>
      </div>

      {/* Banner de Vales Emitidos Pendientes de Rendición */}
      {pendingIssuedVouchers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Hay {pendingIssuedVouchers.length} {pendingIssuedVouchers.length === 1 ? 'vale emitido sin rendir' : 'vales emitidos sin rendir'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black font-mono">
                  {pendingIssuedVouchers.length} PENDIENTES
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cargue el ticket de la estación seleccionando el vale emitido para registrar el odómetro y cerrar el circuito a RENDIDO.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {onSwitchToIssuedVouchers && (
              <button
                type="button"
                onClick={onSwitchToIssuedVouchers}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                Ver Talonario
              </button>
            )}
            {onRendirVale && (
              <button
                type="button"
                onClick={() => onRendirVale(pendingIssuedVouchers[0])}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-98"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Rendir Vale {pendingIssuedVouchers[0]?.numVale ? `Nº ${pendingIssuedVouchers[0].numVale}` : ''}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Equipo Filter (SearchableSelect) */}
        <div>
          <SearchableSelect
            options={allEquipmentOptions}
            value={equipoFilter}
            onChange={setEquipoFilter}
            placeholder="Filtrar Equipo..."
            searchPlaceholder="Buscar equipo..."
          />
        </div>

        {/* Empleado Filter (SearchableSelect) */}
        <div>
          <SearchableSelect
            options={allEmployeeOptions}
            value={empleadoFilter}
            onChange={setEmpleadoFilter}
            placeholder="Filtrar Empleado..."
            searchPlaceholder="Buscar empleado..."
          />
        </div>

        {/* Tipo filter */}
        <div>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-amber-500 transition"
          >
            <option value="TODOS">Todos los Movimientos</option>
            <option value="EGRESO">Solo EGRESOS</option>
            <option value="INGRESO">Solo INGRESOS</option>
          </select>
        </div>

        {/* Clasificacion filter */}
        <div>
          <select
            value={clasificacionFilter}
            onChange={(e) => setClasificacionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-amber-500 transition"
          >
            <option value="TODOS">Todas las Clasificaciones</option>
            {allClasificaciones.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Combustible filter */}
        <div>
          <select
            value={combustibleFilter}
            onChange={(e) => setCombustibleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-amber-500 transition"
          >
            <option value="TODOS">Todos los Combustibles</option>
            {allFuels.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Deposito filter */}
        <div>
          <select
            value={depositoFilter}
            onChange={(e) => setDepositoFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-amber-500 transition"
          >
            <option value="TODOS">Todos los Depósitos</option>
            {allDepositos.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[#12151B] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead>
              <tr className={`bg-[#181C24] text-slate-400 border-b border-slate-800 font-mono ${densityCfg.headerFontSize} uppercase tracking-wider select-none`}>
                {/* Dynamic Reorderable Columns */}
                {columnConfig.order.map((colKey) => renderHeaderCell(colKey))}

                {/* Acciones Column (Fixed) */}
                <th className={`${densityCfg.thPadding} font-bold text-right sticky right-0 z-20 bg-[#181C24] border-l border-slate-800`}>
                  ACCIONES
                </th>
              </tr>
            </thead>

            <tbody className={`divide-y divide-slate-800/60 font-sans ${densityCfg.fontSize}`}>
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={visibleCount + 1} className="px-6 py-12 text-center text-slate-500">
                    <Fuel className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                    <p className="text-sm font-medium text-slate-400">No se encontraron registros de expendio</p>
                    <p className="text-xs text-slate-600 mt-1">Prueba ajustando los términos de búsqueda o filtros</p>
                  </td>
                </tr>
              ) : (
                sortedDateKeys.map((dateKey) => {
                  const dateVouchers = groupedVouchers[dateKey];
                  const displayDateText = formatDisplayDate(dateKey);

                  return (
                    <React.Fragment key={dateKey}>
                      {/* Date Group Header Row */}
                      {groupByDate && dateKey !== 'TODOS' && (
                        <tr className="bg-[#161922] border-y border-slate-800/80">
                          <td colSpan={visibleCount + 1} className="px-4 py-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                <span className="underline font-bold text-slate-200 text-sm tracking-wide">
                                  {displayDateText}
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 font-bold">
                                {dateVouchers.length} {dateVouchers.length === 1 ? 'registro' : 'registros'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* Items for this Date */}
                      {dateVouchers.map((v) => {
                        return (
                          <tr
                            key={v.id}
                            onClick={() => onViewDetails(v)}
                            className="hover:bg-slate-800/50 transition-colors group cursor-pointer border-b border-slate-800/40"
                          >
                            {/* Dynamic cells */}
                            {columnConfig.order.map((colKey) => renderBodyCell(colKey, v))}

                            {/* Acciones Column */}
                            <td 
                              className={`${densityCfg.tdPadding} text-right sticky right-0 z-10 bg-[#12151B] group-hover:bg-[#1A1E27] border-l border-slate-800/80`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className={`flex items-center justify-end ${densityCfg.gap}`}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const linkedVoucher = getLinkedIssuedVoucher(v);
                                    setSelectedIssuedVoucherForPopup(linkedVoucher);
                                    onViewIssuedVoucher?.(linkedVoucher);
                                  }}
                                  className={`${densityCfg.btnPadding} text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer`}
                                  title={`Ver Vale Nº ${v.numOrden || 'vinculado'} en Popup`}
                                >
                                  <Ticket className={densityCfg.iconSize} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails(v);
                                  }}
                                  className={`${densityCfg.btnPadding} text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer`}
                                  title="Ver Ficha y Ticket"
                                >
                                  <Eye className={densityCfg.iconSize} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditVoucher(v);
                                  }}
                                  className={`${densityCfg.btnPadding} text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition cursor-pointer`}
                                  title="Editar Expendio"
                                >
                                  <Edit3 className={densityCfg.iconSize} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteVoucher(v.id);
                                  }}
                                  className={`${densityCfg.btnPadding} text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer`}
                                  title="Eliminar Expendio"
                                >
                                  <Trash2 className={densityCfg.iconSize} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column Manager Modal */}
      <ColumnManagerModal<FuelVoucherColumnKey>
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        columnDefinitions={FUEL_VOUCHER_COLUMNS}
        columnConfig={columnConfig}
        onSaveConfig={handleSaveColumnConfig}
        onResetDefaults={handleResetColumnDefaults}
        title="Personalizar Columnas de Expendio de Combustible"
        subtitle="Selecciona qué columnas visualizar y ordénalas según tu flujo operativo."
      />

      {/* Photo Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="bg-[#16191F] border border-slate-700/80 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-black/40">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>{previewImage.title}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{previewImage.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-black/60 flex items-center justify-center overflow-auto flex-1 min-h-[300px]">
              <img
                src={previewImage.url}
                alt="Vista Previa"
                className="max-h-[65vh] w-auto rounded-lg object-contain border border-slate-800 shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-3 border-t border-slate-800 bg-[#12151B] flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">Comprobante Digital Verificado</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Linked Issued Fuel Voucher Modal Popup */}
      <IssuedVoucherDetailModal
        isOpen={Boolean(selectedIssuedVoucherForPopup)}
        voucher={selectedIssuedVoucherForPopup}
        fleet={fleet}
        employees={employees}
        onClose={() => setSelectedIssuedVoucherForPopup(null)}
        onProceedToRendicion={(voucher) => {
          setSelectedIssuedVoucherForPopup(null);
          onRendirVale?.(voucher);
        }}
        onViewExpendio={(expId) => {
          setSelectedIssuedVoucherForPopup(null);
          const found = vouchers.find(fv => fv.id === expId);
          if (found) {
            onViewDetails(found);
          }
        }}
      />
    </div>
  );
};
