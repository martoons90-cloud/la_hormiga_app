import React from 'react';
import { Menu, PlusCircle, UserPlus, RefreshCw, Fuel, Layers, Ticket, Database, Smartphone } from 'lucide-react';
import { Logo } from './Logo';

interface NavbarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  onOpenMobileMenu: () => void;
  onOpenCreateModal: () => void;
  onOpenCreateDriverModal: () => void;
  onOpenCreateFuelVoucherModal?: () => void;
  onOpenCreateFuelDepositModal?: () => void;
  onOpenCreateIssuedVoucherModal?: () => void;
  onResetDemo: () => void;
  onOpenDatabaseModal?: () => void;
  totalVehicles: number;
  totalDrivers: number;
  totalFuelVouchers?: number;
  totalFuelDeposits?: number;
  totalIssuedVouchers?: number;
  pendingIssuedVouchersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenMobileMenu,
  onOpenCreateModal,
  onOpenCreateDriverModal,
  onOpenCreateFuelVoucherModal,
  onOpenCreateFuelDepositModal,
  onOpenCreateIssuedVoucherModal,
  onResetDemo,
  onOpenDatabaseModal,
  totalVehicles,
  totalDrivers,
  totalFuelVouchers = 0,
  totalFuelDeposits = 0,
  totalIssuedVouchers = 0,
  pendingIssuedVouchersCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-[#16191F]/95 backdrop-blur-md px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & App Branding / View Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <Logo size="sm" showTagline={false} compact={true} />
          <div className="hidden sm:block h-6 w-px bg-slate-800" />
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-white block leading-tight">
              {currentView === 'flota' && 'Flota y Equipos'}
              {currentView === 'choferes' && 'Nómina de Empleados'}
              {currentView === 'obras' && 'Gestión de Obras'}
              {currentView === 'partes-diarios' && 'Partes Diarios de Trabajo'}
              {currentView === 'depositos' && 'Depósitos de Combustible'}
              {currentView === 'combustible' && 'Expendio de Combustible'}
              {currentView === 'vales' && 'Vales de Combustible'}
              {currentView === 'costos-combustible' && 'Costos Mensuales'}
              {currentView === 'tipos-combustible' && 'Catálogo de Combustibles'}
              {currentView === 'dashboard-combustible-trabajo' && 'Combustible vs Trabajo'}
            </span>
            <span className="text-[10px] text-amber-500 font-semibold block leading-tight">
              Panel de Administración
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions and High-Visibility App Chofer button */}
      <div className="flex items-center gap-2.5">
        
        {/* BOTÓN DESTACADO: APP CHOFER */}
        <button
          onClick={() => onSelectView('portal-chofer')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black text-black bg-amber-500 hover:bg-amber-400 active:bg-amber-600 shadow-md shadow-amber-500/20 transition cursor-pointer border border-amber-400 animate-pulse"
          title="Abrir vista simplificada para que el Chofer cargue su Parte Diario"
        >
          <Smartphone className="w-4 h-4 stroke-[2.5]" />
          <span>APP CHOFER</span>
        </button>

        {onOpenDatabaseModal && (
          <button
            onClick={onOpenDatabaseModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-amber-400 bg-slate-900/90 hover:bg-slate-800 transition cursor-pointer border border-slate-800"
            title="Estado de CockroachDB y Cloudflare R2"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Base de Datos</span>
          </button>
        )}

        <button
          onClick={onResetDemo}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-slate-800"
          title="Restablecer datos demo"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Datos Demo</span>
        </button>

        {/* Dynamic primary create button based on view */}
        {currentView === 'choferes' ? (
          <button
            id="btn-nav-alta-chofer"
            onClick={onOpenCreateDriverModal}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>+ Alta Empleado</span>
          </button>
        ) : currentView === 'depositos' ? (
          <button
            id="btn-nav-alta-deposito"
            onClick={onOpenCreateFuelDepositModal}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>+ Nuevo Depósito</span>
          </button>
        ) : currentView === 'vales' ? (
          <button
            id="btn-nav-emitir-vale"
            onClick={onOpenCreateIssuedVoucherModal}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>+ Emitir Vale</span>
          </button>
        ) : currentView === 'combustible' ? (
          <button
            id="btn-nav-alta-vale"
            onClick={onOpenCreateFuelVoucherModal}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>+ Cargar Ticket</span>
          </button>
        ) : (
          <button
            id="btn-nav-alta-vehiculo"
            onClick={onOpenCreateModal}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>+ Alta Vehículo</span>
          </button>
        )}
      </div>
    </header>
  );
};
