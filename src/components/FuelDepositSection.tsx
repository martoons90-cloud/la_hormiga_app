import React, { useState, useMemo } from 'react';
import { 
  FuelDeposit, 
  FuelDepositModality, 
  FuelDepositStatus, 
  FuelVoucher, 
  Vehicle, 
  Employee 
} from '../types';
import { 
  Fuel, 
  Truck, 
  Layers, 
  Ticket, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Eye, 
  PlusCircle, 
  Building2, 
  MapPin, 
  User, 
  ArrowUpRight,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';

interface FuelDepositSectionProps {
  deposits: FuelDeposit[];
  vouchers: FuelVoucher[];
  fleet: Vehicle[];
  employees: Employee[];
  onOpenCreateModal: () => void;
  onViewDetails: (deposit: FuelDeposit) => void;
  onEditDeposit: (deposit: FuelDeposit) => void;
  onDeleteDeposit: (id: string) => void;
  onOpenRefill: (deposit: FuelDeposit) => void;
  onExportCSV: () => void;
  onNewDispensaryFromDeposit: (deposit: FuelDeposit) => void;
}

export const FuelDepositSection: React.FC<FuelDepositSectionProps> = ({
  deposits,
  vouchers,
  fleet,
  employees,
  onOpenCreateModal,
  onViewDetails,
  onEditDeposit,
  onDeleteDeposit,
  onOpenRefill,
  onExportCSV,
  onNewDispensaryFromDeposit,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModality, setSelectedModality] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [depositToDelete, setDepositToDelete] = useState<FuelDeposit | null>(null);

  // Sorting state
  type DepositSortKey = 'id' | 'nombre' | 'modalidad' | 'tipoCombustible' | 'stockActual' | 'capacidadTotal' | 'ubicacion' | 'responsableNombre' | 'estado';
  const [sortField, setSortField] = useState<DepositSortKey | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: DepositSortKey) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDoubleClickSort = (field: DepositSortKey, e?: React.MouseEvent) => {
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

  // Calculate Metrics
  const stats = useMemo(() => {
    const totalDepositos = deposits.length;
    const capacidadTotal = deposits.reduce((sum, d) => sum + (d.capacidadTotal || 0), 0);
    const stockTotal = deposits.reduce((sum, d) => sum + (d.stockActual || 0), 0);
    
    // 1. Depósito Ambulante
    const ambulantes = deposits.filter(d => d.modalidad === 'DEPOSITO_AMBULANTE');
    const capAmbulante = ambulantes.reduce((sum, d) => sum + (d.capacidadTotal || 0), 0);
    const stockAmbulante = ambulantes.reduce((sum, d) => sum + (d.stockActual || 0), 0);

    // 2. Bidones
    const bidones = deposits.filter(d => d.modalidad === 'BIDONES');
    const totalBidonesUnidades = bidones.reduce((sum, d) => sum + (d.cantidadBidones || 0), 0);
    const stockBidonesLts = bidones.reduce((sum, d) => sum + (d.stockActual || 0), 0);

    // 3. Vales para Estación de Servicio
    const vales = deposits.filter(d => d.modalidad === 'VALES_ESTACION');
    const cupoValesTotal = vales.reduce((sum, d) => sum + (d.capacidadTotal || 0), 0);
    const saldoValesLts = vales.reduce((sum, d) => sum + (d.stockActual || 0), 0);

    const bajoStockCount = deposits.filter(d => (d.stockActual || 0) <= (d.nivelAlertaMinimo || 500)).length;

    return {
      totalDepositos,
      capacidadTotal,
      stockTotal,
      ambulantesCount: ambulantes.length,
      capAmbulante,
      stockAmbulante,
      bidonesCount: bidones.length,
      totalBidonesUnidades,
      stockBidonesLts,
      valesCount: vales.length,
      cupoValesTotal,
      saldoValesLts,
      bajoStockCount,
      porcentajeGlobal: capacidadTotal > 0 ? Math.round((stockTotal / capacidadTotal) * 100) : 0
    };
  }, [deposits]);

  // Filtered & sorted deposits
  const filteredDeposits = useMemo(() => {
    const list = deposits.filter(d => {
      // Search
      const matchesSearch = 
        !searchQuery ||
        d.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.ubicacion && d.ubicacion.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.responsableNombre && d.responsableNombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.patenteVehiculo && d.patenteVehiculo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.nombreEstacion && d.nombreEstacion.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.numEstacionConvenio && d.numEstacionConvenio.toLowerCase().includes(searchQuery.toLowerCase()));

      // Modality filter (3 exclusive modalities)
      const matchesModality = 
        selectedModality === 'TODAS' || 
        d.modalidad === selectedModality;

      // Status filter
      const matchesStatus = 
        selectedStatus === 'TODOS' || 
        d.estado === selectedStatus;

      return matchesSearch && matchesModality && matchesStatus;
    });

    if (sortField) {
      list.sort((a, b) => {
        let valA: any = a[sortField] ?? '';
        let valB: any = b[sortField] ?? '';

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
  }, [deposits, searchQuery, selectedModality, selectedStatus, sortField, sortDirection]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner with 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Total Global Capacity & Stock */}
        <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Stock Global Disponible
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                {stats.stockTotal.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {stats.capacidadTotal.toLocaleString()} Lts
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${stats.porcentajeGlobal}%` }}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{stats.totalDepositos} Puntos de Carga</span>
            <span className="text-amber-400 font-bold">{stats.porcentajeGlobal}% Capacidad</span>
          </div>
        </div>

        {/* Card 2: 🚚 Depósito Ambulante */}
        <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              1. Depósitos Ambulantes
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {stats.ambulantesCount} Cisternas
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">
                {stats.stockAmbulante.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">Lts en obra</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              Cisternas móviles sobre camión
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Cap: {stats.capAmbulante.toLocaleString()} L</span>
            <span className="text-emerald-400 font-bold">Despacho en Obra</span>
          </div>
        </div>

        {/* Card 3: 🛢️ Bidones */}
        <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              2. Stock en Bidones
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {stats.bidonesCount} Lotes
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">
                {stats.stockBidonesLts.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">Lts</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {stats.totalBidonesUnidades} Bidones homologados 20L
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Pañol & Auxiliares</span>
            <span className="text-blue-400 font-bold">Grupos / Minicarg.</span>
          </div>
        </div>

        {/* Card 4: 🎫 Vales para Estación */}
        <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4.5 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              3. Vales para Estación
            </span>
            <span className="px-2 py-0.5 text-xs font-bold rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              {stats.valesCount} Convenios
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono">
                {stats.saldoValesLts.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-slate-400">Lts saldo</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              YPF, Shell y Axion Flotas
            </p>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Cupo: {stats.cupoValesTotal.toLocaleString()} L</span>
            <span className="text-purple-400 font-bold">Cuentas Corrientes</span>
          </div>
        </div>
      </div>

      {/* Main Section Filter Bar & Actions */}
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 space-y-4">
        
        {/* Modality Selector Tabs (The 3 exclusive modalities) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedModality('TODAS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              selectedModality === 'TODAS'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span>Todas las Modalidades</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              selectedModality === 'TODAS' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {deposits.length}
            </span>
          </button>

          {/* Modalidad 1: Depósito Ambulante */}
          <button
            onClick={() => setSelectedModality('DEPOSITO_AMBULANTE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              selectedModality === 'DEPOSITO_AMBULANTE'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>🚚 Depósito Ambulante</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              selectedModality === 'DEPOSITO_AMBULANTE' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {stats.ambulantesCount}
            </span>
          </button>

          {/* Modalidad 2: Bidones */}
          <button
            onClick={() => setSelectedModality('BIDONES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              selectedModality === 'BIDONES'
                ? 'bg-blue-500 text-black shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>🛢️ Bidones</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              selectedModality === 'BIDONES' ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-300'
            }`}>
              {stats.bidonesCount}
            </span>
          </button>

          {/* Modalidad 3: Vales para Estación */}
          <button
            onClick={() => setSelectedModality('VALES_ESTACION')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              selectedModality === 'VALES_ESTACION'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-purple-400" />
            <span>🎫 Vales para Estación</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              selectedModality === 'VALES_ESTACION' ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-300'
            }`}>
              {stats.valesCount}
            </span>
          </button>
        </div>

        {/* Second row: Search, Estado Filter, View Switcher & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          
          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-1 max-w-lg">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar depósito por nombre, código, patente, estación, ubicación..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-amber-500 outline-hidden"
              />
            </div>

            {/* Status select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:border-amber-500 outline-hidden"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="OPERATIVO">🟢 Operativos</option>
              <option value="BAJO_STOCK">🟡 Bajo Stock</option>
              <option value="EN_REPOSICION">🔵 En Reposición</option>
              <option value="FUERA_SERVICIO">🔴 Fuera de Servicio</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:text-white'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-slate-800 text-amber-400' : 'text-slate-500 hover:text-white'
                }`}
                title="Vista en Tabla"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={onExportCSV}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Exportar Depósitos a CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">CSV</span>
            </button>

            {/* New Deposit Button */}
            <button
              id="btn-alta-deposito-seccion"
              onClick={onOpenCreateModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Depósito</span>
            </button>
          </div>
        </div>
      </div>

      {/* Deposit Items Content */}
      {filteredDeposits.length === 0 ? (
        <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Fuel className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase">No se encontraron depósitos de carga</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            No hay puntos de abastecimiento que coincidan con los filtros seleccionados o todavía no ha dado de alta depósitos en esta modalidad.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-2 px-4 py-2 bg-amber-500 text-black font-bold text-xs rounded-xl shadow-sm hover:bg-amber-400 transition cursor-pointer"
          >
            + Crear Primer Depósito
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW OF DEPOSIT CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeposits.map((dep) => {
            const stock = dep.stockActual || 0;
            const cap = dep.capacidadTotal || 1;
            const pct = Math.min(100, Math.max(0, Math.round((stock / cap) * 100)));
            const isLow = stock <= (dep.nivelAlertaMinimo || 500);

            return (
              <div
                key={dep.id}
                className="bg-[#16191F] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 group"
              >
                {/* Top Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                        dep.modalidad === 'DEPOSITO_AMBULANTE'
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : dep.modalidad === 'BIDONES'
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                            : 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                      }`}>
                        {dep.modalidad === 'DEPOSITO_AMBULANTE' && <Truck className="w-4 h-4" />}
                        {dep.modalidad === 'BIDONES' && <Layers className="w-4 h-4" />}
                        {dep.modalidad === 'VALES_ESTACION' && <Ticket className="w-4 h-4" />}
                      </span>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          {dep.id} • {dep.codigo}
                        </span>
                        <h3 className="text-sm font-bold text-white leading-tight group-hover:text-amber-400 transition">
                          {dep.nombre}
                        </h3>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 border ${
                      dep.estado === 'OPERATIVO'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                        : dep.estado === 'BAJO_STOCK'
                          ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                          : 'bg-rose-950/60 text-rose-400 border-rose-800'
                    }`}>
                      {dep.estado === 'OPERATIVO' ? 'OPERATIVO' : dep.estado === 'BAJO_STOCK' ? 'BAJO STOCK' : dep.estado}
                    </span>
                  </div>

                  {/* Modality Tag & Specific Tag */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      dep.modalidad === 'DEPOSITO_AMBULANTE'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        : dep.modalidad === 'BIDONES'
                          ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                          : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                    }`}>
                      {dep.modalidadLabel}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">
                      {dep.tipoCombustible}
                    </span>

                    {dep.modalidad === 'DEPOSITO_AMBULANTE' && dep.patenteVehiculo && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Patente: {dep.patenteVehiculo}
                      </span>
                    )}

                    {dep.modalidad === 'BIDONES' && dep.cantidadBidones && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {dep.cantidadBidones} Bidones × {dep.capacidadPorBidon || 20}L
                      </span>
                    )}

                    {dep.modalidad === 'VALES_ESTACION' && dep.numEstacionConvenio && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {dep.empresaBandera || 'YPF'} • {dep.numEstacionConvenio}
                      </span>
                    )}
                  </div>
                </div>

                {/* Level Gauge & Capacity */}
                <div className="bg-[#0F1115] border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {dep.modalidad === 'VALES_ESTACION' ? 'Saldo Vales Disponible:' : 'Combustible Disponible:'}
                    </span>
                    <span className="font-mono font-black text-white text-sm">
                      {stock.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {cap.toLocaleString()} Lts</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct > 40 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Alerta: {dep.nivelAlertaMinimo} L</span>
                    <span className={pct > 40 ? 'text-emerald-400 font-bold' : pct > 20 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                      {pct}% Lleno
                    </span>
                  </div>
                </div>

                {/* Metadata Location & Responsible */}
                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{dep.ubicacion || 'Base Central'}</span>
                  </div>
                  {dep.responsableNombre && (
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{dep.responsableNombre}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenRefill(dep)}
                      className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-[11px] rounded-lg border border-emerald-500/30 transition flex items-center gap-1 cursor-pointer"
                      title="Registrar recarga o ajuste de stock"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{dep.modalidad === 'VALES_ESTACION' ? 'Acreditar' : 'Recargar'}</span>
                    </button>

                    <button
                      onClick={() => onNewDispensaryFromDeposit(dep)}
                      className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 font-bold text-[11px] rounded-lg border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                      title="Crear expendio con este depósito preseleccionado"
                    >
                      <Fuel className="w-3.5 h-3.5" />
                      <span>Expendio</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onViewDetails(dep)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Ver Ficha y Consumos"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditDeposit(dep)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDepositToDelete(dep)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW OF DEPOSITS */
        <div className="bg-[#16191F] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#1E232D] text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('id')}
                    onDoubleClick={(e) => handleDoubleClickSort('id', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'id' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ID / Código</span>
                      {sortField === 'id' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('nombre')}
                    onDoubleClick={(e) => handleDoubleClickSort('nombre', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'nombre' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nombre del Depósito</span>
                      {sortField === 'nombre' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('modalidad')}
                    onDoubleClick={(e) => handleDoubleClickSort('modalidad', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'modalidad' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Modalidad</span>
                      {sortField === 'modalidad' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('tipoCombustible')}
                    onDoubleClick={(e) => handleDoubleClickSort('tipoCombustible', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'tipoCombustible' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Combustible</span>
                      {sortField === 'tipoCombustible' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('stockActual')}
                    onDoubleClick={(e) => handleDoubleClickSort('stockActual', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'stockActual' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Nivel & Stock</span>
                      {sortField === 'stockActual' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('capacidadTotal')}
                    onDoubleClick={(e) => handleDoubleClickSort('capacidadTotal', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'capacidadTotal' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Capacidad Total</span>
                      {sortField === 'capacidadTotal' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('ubicacion')}
                    onDoubleClick={(e) => handleDoubleClickSort('ubicacion', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'ubicacion' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Ubicación / Patente</span>
                      {sortField === 'ubicacion' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('responsableNombre')}
                    onDoubleClick={(e) => handleDoubleClickSort('responsableNombre', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'responsableNombre' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Responsable</span>
                      {sortField === 'responsableNombre' ? (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold border border-amber-500/40">
                          {sortDirection === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                          {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('estado')}
                    onDoubleClick={(e) => handleDoubleClickSort('estado', e)}
                    className={`p-3 cursor-pointer transition ${sortField === 'estado' ? 'bg-amber-500/10 text-amber-300' : 'hover:bg-slate-800/80 hover:text-white'}`}
                    title="Doble clic para ordenar A-Z / Z-A"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Estado</span>
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

                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredDeposits.map((dep) => {
                  const stock = dep.stockActual || 0;
                  const cap = dep.capacidadTotal || 1;
                  const pct = Math.min(100, Math.max(0, Math.round((stock / cap) * 100)));

                  return (
                    <tr key={dep.id} className="hover:bg-slate-900/60 transition">
                      <td className="p-3 font-mono font-bold text-amber-400">
                        {dep.id}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{dep.nombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{dep.codigo}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          dep.modalidad === 'DEPOSITO_AMBULANTE'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                            : dep.modalidad === 'BIDONES'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        }`}>
                          {dep.modalidadLabel}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-300">
                        {dep.tipoCombustible}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                pct > 40 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-white text-xs">{stock.toLocaleString()} L</span>
                          <span className="text-[10px] text-slate-500">({pct}%)</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-slate-400">
                        {cap.toLocaleString()} Lts
                      </td>
                      <td className="p-3">
                        <div className="text-slate-300 truncate max-w-xs">{dep.ubicacion}</div>
                        {dep.patenteVehiculo && (
                          <div className="text-[10px] font-mono text-amber-400">Patente: {dep.patenteVehiculo}</div>
                        )}
                        {dep.numEstacionConvenio && (
                          <div className="text-[10px] font-mono text-purple-400">Estación: {dep.numEstacionConvenio}</div>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">
                        {dep.responsableNombre || 'No asignado'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          dep.estado === 'OPERATIVO'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : dep.estado === 'BAJO_STOCK'
                              ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                              : 'bg-rose-950/60 text-rose-400 border-rose-800'
                        }`}>
                          {dep.estado}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenRefill(dep)}
                            className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            title="Recargar Stock"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onViewDetails(dep)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Ver Detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditDeposit(dep)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDepositToDelete(dep)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {depositToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#16191F] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Eliminar Depósito</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              ¿Estás seguro de eliminar el depósito o cisterna <strong className="text-white">"{depositToDelete.nombre}"</strong> ({depositToDelete.id})?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDepositToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteDeposit(depositToDelete.id);
                  setDepositToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Sí, eliminar depósito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
