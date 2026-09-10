import React, { useState, useMemo } from 'react';
import { GenericColumnDefinition, TableColumnConfig } from '../types';
import { 
  SlidersHorizontal, 
  Check, 
  RotateCcw, 
  X, 
  Eye, 
  EyeOff, 
  GripVertical, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  CheckSquare, 
  Square,
  Sparkles,
  Info
} from 'lucide-react';

interface ColumnManagerModalProps<T extends string = string> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  columnDefinitions: GenericColumnDefinition<T>[];
  columnConfig: TableColumnConfig<T>;
  onSaveConfig: (newConfig: TableColumnConfig<T>) => void;
  onResetDefaults: () => void;
}

export function ColumnManagerModal<T extends string = string>({
  isOpen,
  onClose,
  title = 'Personalizar Columnas de la Tabla',
  subtitle = 'Gestiona la visibilidad y arrastra para ordenar las columnas a tu gusto.',
  columnDefinitions,
  columnConfig,
  onSaveConfig,
  onResetDefaults,
}: ColumnManagerModalProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  // Local state for interactive editing before confirmation or instant save
  const [currentOrder, setCurrentOrder] = useState<T[]>(() => columnConfig.order);
  const [currentVisible, setCurrentVisible] = useState<Record<T, boolean>>(() => columnConfig.visible);
  const [draggedKey, setDraggedKey] = useState<T | null>(null);
  const [dragOverKey, setDragOverKey] = useState<T | null>(null);

  // Sync state if modal reopens with new props
  React.useEffect(() => {
    if (isOpen) {
      setCurrentOrder(columnConfig.order);
      setCurrentVisible(columnConfig.visible);
      setSearchTerm('');
      setDraggedKey(null);
      setDragOverKey(null);
    }
  }, [isOpen, columnConfig]);

  // Quick lookup map for definition
  const defsMap = useMemo(() => {
    const map = new Map<string, GenericColumnDefinition<T>>();
    columnDefinitions.forEach(def => {
      map.set(def.key, def);
    });
    return map;
  }, [columnDefinitions]);

  // Ordered list of columns based on currentOrder
  const orderedColumns = useMemo(() => {
    const list: GenericColumnDefinition<T>[] = [];
    currentOrder.forEach(key => {
      const def = defsMap.get(key);
      if (def) list.push(def);
    });
    // Add any missing ones at the end
    columnDefinitions.forEach(def => {
      if (!currentOrder.includes(def.key)) {
        list.push(def);
      }
    });
    return list;
  }, [currentOrder, defsMap, columnDefinitions]);

  // Filtered by search
  const filteredColumns = useMemo(() => {
    if (!searchTerm.trim()) return orderedColumns;
    const q = searchTerm.toLowerCase();
    return orderedColumns.filter(
      col =>
        col.label.toLowerCase().includes(q) ||
        (col.shortLabel && col.shortLabel.toLowerCase().includes(q)) ||
        col.description.toLowerCase().includes(q) ||
        col.key.toLowerCase().includes(q)
    );
  }, [orderedColumns, searchTerm]);

  const totalVisible = Object.values(currentVisible).filter(Boolean).length;
  const totalColumns = columnDefinitions.length;

  if (!isOpen) return null;

  // Toggle single column
  const handleToggle = (key: T) => {
    const next = {
      ...currentVisible,
      [key]: !currentVisible[key]
    };
    setCurrentVisible(next);
  };

  // Toggle All (Show all)
  const handleSelectAll = () => {
    const next = { ...currentVisible };
    columnDefinitions.forEach(def => {
      next[def.key] = true;
    });
    setCurrentVisible(next);
  };

  // Deselect All (Hide all)
  const handleDeselectAll = () => {
    const next = { ...currentVisible };
    columnDefinitions.forEach(def => {
      next[def.key] = false;
    });
    setCurrentVisible(next);
  };

  // Drag and Drop handlers
  const handleDragStart = (key: T, e: React.DragEvent) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };

  const handleDragOver = (key: T, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDragLeave = (key: T, e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverKey === key) {
      setDragOverKey(null);
    }
  };

  const handleDrop = (targetKey: T, e: React.DragEvent) => {
    e.preventDefault();
    const sourceKey = (e.dataTransfer.getData('text/plain') as T) || draggedKey;
    if (!sourceKey || sourceKey === targetKey) {
      setDraggedKey(null);
      setDragOverKey(null);
      return;
    }

    const newOrder = [...currentOrder];
    const sourceIdx = newOrder.indexOf(sourceKey);
    const targetIdx = newOrder.indexOf(targetKey);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, sourceKey);
      setCurrentOrder(newOrder);
    }

    setDraggedKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverKey(null);
  };

  // Move buttons (accessibility & fast clicks)
  const handleMoveUp = (key: T, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = currentOrder.indexOf(key);
    if (idx > 0) {
      const newOrder = [...currentOrder];
      const temp = newOrder[idx - 1];
      newOrder[idx - 1] = key;
      newOrder[idx] = temp;
      setCurrentOrder(newOrder);
    }
  };

  const handleMoveDown = (key: T, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = currentOrder.indexOf(key);
    if (idx !== -1 && idx < currentOrder.length - 1) {
      const newOrder = [...currentOrder];
      const temp = newOrder[idx + 1];
      newOrder[idx + 1] = key;
      newOrder[idx] = temp;
      setCurrentOrder(newOrder);
    }
  };

  const handleApply = () => {
    onSaveConfig({
      order: currentOrder,
      visible: currentVisible
    });
    onClose();
  };

  const handleReset = () => {
    onResetDefaults();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#16191F] border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Toolbar & Instructions */}
        <div className="px-5 sm:px-6 py-3 bg-[#11141A] border-b border-slate-800/80 space-y-2.5">
          {/* Quick info banner */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-medium">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>{totalVisible}</strong> de <strong>{totalColumns}</strong> columnas visibles
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Mostrar Todas
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Ocultar Todas
              </button>
            </div>
          </div>

          {/* Search column input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar columna por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 transition"
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

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <GripVertical className="w-3.5 h-3.5 text-amber-500/70" />
            <span>Arrastra desde el ícono o usa las flechas para reordenar la posición.</span>
          </div>
        </div>

        {/* Columns Drag & Drop List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-1.5 flex-1 divide-y divide-slate-800/40">
          {filteredColumns.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No se encontraron columnas que coincidan con "{searchTerm}".
            </div>
          ) : (
            filteredColumns.map((col, idx) => {
              const isChecked = currentVisible[col.key] ?? col.defaultVisible;
              const isDragging = draggedKey === col.key;
              const isDragOver = dragOverKey === col.key;
              const orderIndex = currentOrder.indexOf(col.key);

              return (
                <div
                  key={col.key}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(col.key, e)}
                  onDragOver={(e) => handleDragOver(col.key, e)}
                  onDragLeave={(e) => handleDragLeave(col.key, e)}
                  onDrop={(e) => handleDrop(col.key, e)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleToggle(col.key)}
                  className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-xl border transition-all select-none cursor-pointer ${
                    isDragOver
                      ? 'border-amber-500 bg-amber-500/15 shadow-md scale-[1.01]'
                      : isDragging
                      ? 'opacity-40 border-dashed border-amber-500 bg-slate-900'
                      : isChecked
                      ? 'bg-slate-900/60 hover:bg-slate-800/70 border-slate-800/80 text-white'
                      : 'bg-[#0F1115]/50 hover:bg-slate-900/40 border-slate-800/40 opacity-60 text-slate-400'
                  }`}
                >
                  {/* Drag Handle & Checkbox */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Drag Grip Handle */}
                    <div 
                      className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-amber-400 transition"
                      title="Arrastrar para ordenar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Order Index Badge */}
                    <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700/80 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 shrink-0">
                      {orderIndex + 1}
                    </div>

                    {/* Checkbox Visual */}
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                        isChecked
                          ? 'bg-amber-500 border-amber-500 text-black'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    {/* Label & Description */}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold flex items-center gap-2 flex-wrap">
                        <span className={isChecked ? 'text-slate-100' : 'text-slate-400'}>
                          {col.label}
                        </span>
                        {col.shortLabel && col.shortLabel !== col.label && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({col.shortLabel})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                        {col.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions (Move buttons + Eye icon) */}
                  <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={orderIndex <= 0}
                      onClick={(e) => handleMoveUp(col.key, e)}
                      title="Mover arriba"
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700/60 disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={orderIndex >= currentOrder.length - 1}
                      onClick={(e) => handleMoveDown(col.key, e)}
                      title="Mover abajo"
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700/60 disabled:opacity-20 disabled:hover:bg-transparent transition cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Visibility Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(col.key)}
                      title={isChecked ? 'Ocultar columna' : 'Mostrar columna'}
                      className={`p-1.5 rounded-lg transition ml-1 cursor-pointer ${
                        isChecked 
                          ? 'text-amber-400 hover:bg-amber-500/10' 
                          : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {isChecked ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-[#16191F] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:underline transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Restablecer orden por defecto</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-guardar-columnas"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 active:bg-amber-600 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              Guardar y Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
