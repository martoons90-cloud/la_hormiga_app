import React, { useState } from 'react';
import { Logo } from './Logo';
import { HazardStripes } from './HazardStripes';
import { 
  Truck, 
  PlusCircle, 
  CalendarClock, 
  Wrench, 
  SlidersHorizontal, 
  FileSpreadsheet, 
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  Users,
  UserPlus,
  Fuel,
  Droplet,
  X,
  Layers,
  Ticket,
  DollarSign,
  Sparkles,
  ClipboardList,
  BarChart3,
  Database,
  Smartphone
} from 'lucide-react';
import { Vehicle, Employee, FuelVoucher, FuelDeposit, Obra } from '../types';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenCreateModal: () => void;
  onOpenCreateDriverModal: () => void;
  onOpenCreateObraModal?: () => void;
  onOpenCreateFuelVoucherModal?: () => void;
  onOpenCreateFuelDepositModal?: () => void;
  onOpenCreateIssuedVoucherModal?: () => void;
  onOpenColumnModal: () => void;
  onOpenCalculatorModal: () => void;
  onExportCSV: () => void;
  onExportDriversCSV: () => void;
  onExportObrasCSV?: () => void;
  onExportFuelVouchersCSV?: () => void;
  onExportFuelDepositsCSV?: () => void;
  onExportIssuedVouchersCSV?: () => void;
  fleet: Vehicle[];
  drivers: Employee[];
  obras?: Obra[];
  fuelVouchers?: FuelVoucher[];
  fuelDeposits?: FuelDeposit[];
  issuedVouchers?: any[];
  partesDiariosCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenDatabaseModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  onOpenCreateModal,
  onOpenCreateDriverModal,
  onOpenCreateFuelVoucherModal,
  onOpenCreateFuelDepositModal,
  onOpenCreateIssuedVoucherModal,
  onOpenColumnModal,
  onOpenCalculatorModal,
  onExportCSV,
  onExportDriversCSV,
  onExportFuelVouchersCSV,
  onExportFuelDepositsCSV,
  onExportIssuedVouchersCSV,
  fleet,
  drivers,
  obras = [],
  fuelVouchers = [],
  fuelDeposits = [],
  issuedVouchers = [],
  partesDiariosCount = 0,
  isOpenMobile,
  onCloseMobile,
  onOpenDatabaseModal,
}) => {
  const disponibles = fleet.filter(v => v.estado === 'DISPONIBLE').length;
  const alquilados = fleet.filter(v => v.estado === 'ALQUILADO').length;
  const enTaller = fleet.filter(v => v.estado === 'EN_MANTENIMIENTO' || v.estado === 'TALLER').length;

  const choferesActivos = drivers.filter(d => d.estado === 'ACTIVO' || d.estado === 'EN_OBRA').length;
  const totalLitros = fuelVouchers.reduce((sum, v) => sum + (v.cantidad || 0), 0);
  const totalStockDepositos = fuelDeposits.reduce((sum, d) => sum + (d.stockActual || 0), 0);
  const valesPendientes = issuedVouchers.filter(v => v.estado === 'EMITIDO').length;

  const [isAltasExpanded, setIsAltasExpanded] = useState(true);
  const [isPartesDiariosExpanded, setIsPartesDiariosExpanded] = useState(true);
  const [isCombustibleExpanded, setIsCombustibleExpanded] = useState(true);


  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#16191F] text-slate-200 flex flex-col border-r border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Brand Header */}
        <div className="p-5 bg-[#16191F] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded flex items-center justify-center font-bold text-black text-sm">
              LH
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white uppercase flex items-center gap-1">
                <span>La Hormiga</span>
                <span className="text-amber-500 text-xs font-mono font-bold">PRO</span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Flota, Empleados & Combustible</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        {/* Main Navigation List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 ml-2">
              Gestión Operativa
            </div>
            <nav className="space-y-1">
              {/* Altas y Registros Accordion Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden mb-2">
                <button
                  onClick={() => setIsAltasExpanded(!isAltasExpanded)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-amber-400 hover:bg-slate-800/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="tracking-wide uppercase">Altas y Registros</span>
                  </div>
                  {isAltasExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isAltasExpanded && (
                  <div className="p-1.5 space-y-1 bg-[#0F1115]/50 border-t border-slate-800/60">
                    <button
                      id="nav-flota"
                      onClick={() => {
                        onSelectView('flota');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'flota'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Truck className="w-4 h-4" />
                        <span>Flota Vehicular</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {fleet.length}
                      </span>
                    </button>

                    <button
                      id="nav-choferes"
                      onClick={() => {
                        onSelectView('choferes');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'choferes'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-amber-400" />
                        <span>Nómina de Empleados</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {drivers.length}
                      </span>
                    </button>

                    <button
                      id="nav-obras"
                      onClick={() => {
                        onSelectView('obras');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'obras'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-amber-400" />
                        <span>Gestión de Obras</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                        {obras?.length || 0}
                      </span>
                    </button>

                    <button
                      id="nav-depositos"
                      onClick={() => {
                        onSelectView('depositos');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'depositos'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>Depósitos de Carga</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold">
                        {fuelDeposits.length}
                      </span>
                    </button>

                    <button
                      id="nav-tipos-combustible"
                      onClick={() => {
                        onSelectView('tipos-combustible');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'tipos-combustible'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Fuel className="w-4 h-4 text-amber-400" />
                        <span>Tipos de Combustible</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                        Catálogo
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Partes Diarios Accordion Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden mb-2">
                <button
                  onClick={() => setIsPartesDiariosExpanded(!isPartesDiariosExpanded)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-amber-400 hover:bg-slate-800/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <span className="tracking-wide uppercase">Partes Diarios</span>
                  </div>
                  {isPartesDiariosExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isPartesDiariosExpanded && (
                  <div className="p-1.5 space-y-1 bg-[#0F1115]/50 border-t border-slate-800/60">
                    <button
                      id="nav-partes-diarios"
                      onClick={() => {
                        onSelectView('partes-diarios');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'partes-diarios'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <ClipboardList className="w-4 h-4 text-amber-400" />
                        <span>Trabajos por Equipo</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {partesDiariosCount || 0}
                      </span>
                    </button>

                    <button
                      id="nav-portal-chofer"
                      onClick={() => {
                        onSelectView('portal-chofer');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'portal-chofer'
                          ? 'bg-amber-500 text-black font-bold shadow-md'
                          : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-amber-400" />
                        <span>📱 Cargar Parte (Chofer)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-black font-black uppercase">
                        App
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Combustible Accordion Section */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden mb-2">
                <button
                  onClick={() => setIsCombustibleExpanded(!isCombustibleExpanded)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold text-amber-400 hover:bg-slate-800/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Fuel className="w-4 h-4 text-amber-400" />
                    <span className="tracking-wide uppercase">Combustible</span>
                  </div>
                  {isCombustibleExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isCombustibleExpanded && (
                  <div className="p-1.5 space-y-1 bg-[#0F1115]/50 border-t border-slate-800/60">
                    <button
                      id="nav-vales-combustible"
                      onClick={() => {
                        onSelectView('combustible');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'combustible'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Fuel className="w-4 h-4 text-amber-400" />
                        <span>Expendio Combustible</span>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                        {fuelVouchers.length}
                      </span>
                    </button>

                    <button
                      id="nav-vales-circuito"
                      onClick={() => {
                        onSelectView('vales');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'vales'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Ticket className="w-4 h-4 text-amber-400" />
                        <span>Vales de Combustible</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {valesPendientes > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[10px] font-black font-mono" title={`${valesPendientes} pendientes de ticket`}>
                            {valesPendientes} pend.
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {issuedVouchers.length}
                        </span>
                      </div>
                    </button>

                    <button
                      id="nav-costos-combustible"
                      onClick={() => {
                        onSelectView('costos-combustible');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'costos-combustible'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>Costos Mensuales</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        ARS
                      </span>
                    </button>

                    <button
                      id="nav-dashboard-combustible-trabajo"
                      onClick={() => {
                        onSelectView('dashboard-combustible-trabajo');
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                        currentView === 'dashboard-combustible-trabajo'
                          ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-4 h-4 text-amber-400" />
                        <span>Combustible vs Trabajo</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Dash
                      </span>
                    </button>
                  </div>
                )}
              </div>





            </nav>
          </div>


        </div>

        {/* Bento Footer User/Instance Info */}
        <div className="p-4 border-t border-slate-800 bg-[#16191F] space-y-2.5">
          <button
            onClick={() => {
              onSelectView('portal-chofer');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-linear-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-xs font-bold text-amber-300 hover:text-white transition cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <span>Vista App Chofer</span>
            </div>
            <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black uppercase">
              Móvil
            </span>
          </button>

          {onOpenDatabaseModal && (
            <button
              onClick={() => {
                onOpenDatabaseModal();
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#0F1115] hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
                <span>Base de Datos & R2</span>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">SQL</span>
            </button>
          )}

          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
              ADM
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Admin La Hormiga</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Panel Operativo</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

