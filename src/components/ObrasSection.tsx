import React, { useState, useMemo } from 'react';
import { Obra, TableDensity } from '../types';
import { formatCurrency } from '../services/storage';
import { TableDensitySelector } from './TableDensitySelector';
import { DENSITY_CONFIG, getSavedTableDensity, saveTableDensity } from '../utils/densityStyles';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  MapPin, 
  Calendar, 
  DollarSign, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Edit3, 
  Trash2,
  UploadCloud,
  Hash
} from 'lucide-react';

interface ObrasSectionProps {
  obras: Obra[];
  density?: TableDensity;
  onChangeDensity?: (density: TableDensity) => void;
  onOpenCreateModal: () => void;
  onViewDetails: (obra: Obra) => void;
  onEditObra: (obra: Obra) => void;
  onDeleteObra: (id: string) => void;
  onExportCSV: () => void;
  onOpenImportExport?: () => void;
}

export const ObrasSection: React.FC<ObrasSectionProps> = ({
  obras,
  density,
  onChangeDensity,
  onOpenCreateModal,
  onViewDetails,
  onEditObra,
  onDeleteObra,
  onExportCSV,
  onOpenImportExport,
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
  const [estadoFilter, setEstadoFilter] = useState<string>('TODAS');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Stats
  const stats = useMemo(() => {
    const total = obras.length;
    const activas = obras.filter(o => o.activa).length;
    const inactivas = total - activas;
    const montoTotalEstimado = obras.reduce((acc, o) => acc + (o.montoEstimado || 0), 0);
    return { total, activas, inactivas, montoTotalEstimado };
  }, [obras]);

  // Filtered obras
  const filteredObras = useMemo(() => {
    return obras.filter(obra => {
      const matchesSearch = 
        obra.nombreObra.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obra.pertenece.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = 
        estadoFilter === 'TODAS' ||
        (estadoFilter === 'ACTIVAS' && obra.activa) ||
        (estadoFilter === 'INACTIVAS' && !obra.activa);

      return matchesSearch && matchesEstado;
    });
  }, [obras, searchTerm, estadoFilter]);

  // Paginated slice
  const totalPages = Math.ceil(filteredObras.length / pageSize) || 1;
  const paginatedObras = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredObras.slice(start, start + pageSize);
  }, [filteredObras, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#16191F] to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
              Gestión de Obras
            </span>
            <span className="text-xs text-slate-400 font-mono">• {stats.total} registradas ({stats.activas} activas)</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-amber-400" />
            <span>Obras y Proyectos</span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Administración completa de ubicaciones, plazos, comitentes y presupuestos estimados.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {onOpenImportExport && (
            <button
              onClick={onOpenImportExport}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border border-slate-700 shadow-sm"
              title="Importar / Exportar masivo"
            >
              <UploadCloud className="w-4 h-4 text-amber-400" />
              <span>Importar / Exportar</span>
            </button>
          )}

          <button
            onClick={onExportCSV}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border border-slate-700 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nueva Obra</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#16191F] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Obras</p>
            <h3 className="text-2xl font-bold text-white mt-1 font-mono">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#16191F] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Obras Activas</p>
            <h3 className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{stats.activas}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#16191F] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Inactivas / Finalizadas</p>
            <h3 className="text-2xl font-bold text-slate-400 mt-1 font-mono">{stats.inactivas}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#16191F] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Presupuesto Estimado Global</p>
            <h3 className="text-xl font-bold text-amber-400 mt-1 font-mono">{formatCurrency(stats.montoTotalEstimado)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por nombre, número, ubicación o dueño..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {['TODAS', 'ACTIVAS', 'INACTIVAS'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setEstadoFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  estadoFilter === filter
                    ? 'bg-amber-500 text-black shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <TableDensitySelector density={activeDensity} onChangeDensity={handleDensityChange} />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                <th className="px-4 py-3 font-bold">Número</th>
                <th className="px-4 py-3 font-bold">Nombre de Obra</th>
                <th className="px-4 py-3 font-bold">Ubicación</th>
                <th className="px-4 py-3 font-bold">Pertenece a</th>
                <th className="px-4 py-3 font-bold text-center">Estado</th>
                <th className="px-4 py-3 font-bold">Plazo</th>
                <th className="px-4 py-3 font-bold text-right">Monto Estimado</th>
                <th className="px-4 py-3 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {paginatedObras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">No se encontraron obras registradas.</p>
                      <button
                        onClick={() => { setSearchTerm(''); setEstadoFilter('TODAS'); }}
                        className="text-xs text-amber-400 hover:underline mt-1 cursor-pointer"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedObras.map((obra) => (
                  <tr 
                    key={obra.id} 
                    className={`hover:bg-slate-900/60 transition group ${densityCfg.row}`}
                  >
                    <td className={`px-4 font-mono font-bold text-amber-400 ${densityCfg.cell}`}>
                      {obra.numero}
                    </td>
                    <td className={`px-4 font-bold text-white font-sans ${densityCfg.cell}`}>
                      <div className="flex items-center gap-2">
                        <span>{obra.nombreObra}</span>
                      </div>
                    </td>
                    <td className={`px-4 text-slate-300 font-sans ${densityCfg.cell}`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-xs">{obra.ubicacion || '-'}</span>
                      </div>
                    </td>
                    <td className={`px-4 text-slate-300 font-sans ${densityCfg.cell}`}>
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-xs">{obra.pertenece || '-'}</span>
                      </div>
                    </td>
                    <td className={`px-4 text-center ${densityCfg.cell}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        obra.activa 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {obra.activa ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </td>
                    <td className={`px-4 text-slate-300 font-mono ${densityCfg.cell}`}>
                      {obra.plazo || '-'}
                    </td>
                    <td className={`px-4 text-right font-mono font-bold text-emerald-400 ${densityCfg.cell}`}>
                      {formatCurrency(obra.montoEstimado)}
                    </td>
                    <td className={`px-4 text-center ${densityCfg.cell}`}>
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onViewDetails(obra)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-400 text-slate-300 transition cursor-pointer"
                          title="Ver Ficha y Detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditObra(obra)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-500/20 hover:text-blue-400 text-slate-300 transition cursor-pointer"
                          title="Editar Obra"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteObra(obra.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 hover:text-red-400 text-slate-300 transition cursor-pointer"
                          title="Eliminar Obra"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Mostrando {filteredObras.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} al {Math.min(currentPage * pageSize, filteredObras.length)} de {filteredObras.length} obras ({obras.length} total)</span>
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
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
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
    </div>
  );
};
