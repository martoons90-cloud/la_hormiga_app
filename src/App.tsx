import React, { useState, useEffect } from 'react';
import { 
  Vehicle, 
  TableColumnKey, 
  VehicleStatus, 
  Employee, 
  DriverStatus, 
  FuelDispensary, 
  FuelVoucherStatus,
  FuelDeposit,
  FuelDepositStatus,
  IssuedFuelVoucher,
  TableColumnConfig,
  Obra,
  ParteDiario
} from './types';
import { 
  loadFleet, 
  saveFleet, 
  loadDrivers, 
  saveDrivers, 
  loadFuelVouchers, 
  saveFuelVouchers, 
  loadFuelDeposits, 
  saveFuelDeposits, 
  loadIssuedVouchers,
  saveIssuedVouchers,
  loadObras,
  saveObras,
  loadFleetColumnConfig, 
  saveFleetColumnConfig, 
  resetFleetToDefault, 
  resetDriversToDefault, 
  resetFuelVouchersToDefault, 
  resetFuelDepositsToDefault,
  resetIssuedVouchersToDefault,
  resetObrasToDefault,
  resetPartesDiariosToDefault,
  exportFleetToCSV, 
  exportDriversToCSV, 
  exportFuelVouchersToCSV, 
  exportFuelDepositsToCSV,
  exportIssuedVouchersToCSV,
  exportObrasToCSV,
  loadPartesDiarios,
  savePartesDiarios,
  exportPartesDiariosToCSV
} from './services/storage';
import { ObrasSection } from './components/ObrasSection';
import { ObraFormModal } from './components/ObraFormModal';
import { ObraDetailModal } from './components/ObraDetailModal';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { QuickStatsBanner } from './components/QuickStatsBanner';
import { VehicleTable } from './components/VehicleTable';
import { VehicleFormModal } from './components/VehicleFormModal';
import { VehicleDetailModal } from './components/VehicleDetailModal';
import { DriverSection } from './components/DriverSection';
import { DriverFormModal } from './components/DriverFormModal';
import { DriverDetailModal } from './components/DriverDetailModal';
import { FuelDepositSection } from './components/FuelDepositSection';
import { FuelDepositFormModal } from './components/FuelDepositFormModal';
import { FuelDepositDetailModal } from './components/FuelDepositDetailModal';
import { FuelDepositRefillModal } from './components/FuelDepositRefillModal';
import { FuelVoucherSection } from './components/FuelVoucherSection';
import { FuelVoucherFormModal } from './components/FuelVoucherFormModal';
import { FuelVoucherDetailModal } from './components/FuelVoucherDetailModal';
import { IssuedVouchersSection } from './components/IssuedVouchersSection';
import { IssuedVoucherFormModal } from './components/IssuedVoucherFormModal';
import { IssuedVoucherDetailModal } from './components/IssuedVoucherDetailModal';
import { ColumnVisibilityModal } from './components/ColumnVisibilityModal';
import { PricingCalculatorModal } from './components/PricingCalculatorModal';
import { DataImportExportModal } from './components/DataImportExportModal';
import { VehicleFuelAnalyticsModal } from './components/VehicleFuelAnalyticsModal';
import { FuelCostsSection } from './components/FuelCostsSection';
import { FuelTypesManagerSection } from './components/FuelTypesManagerSection';
import { CombustibleVsTrabajoDashboard } from './components/CombustibleVsTrabajoDashboard';
import { PartesDiariosSection } from './components/PartesDiariosSection';
import { ParteDiarioFormModal } from './components/ParteDiarioFormModal';
import { ParteDiarioDetailModal } from './components/ParteDiarioDetailModal';
import { DriverAppPortal } from './components/DriverAppPortal';

import { EntityType } from './services/importExportService';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { apiFetchCollection, apiSaveItems, apiDeleteItem } from './services/api';
import { Logo } from './components/Logo';
import { Check, Plus } from 'lucide-react';

export default function App() {
  // Data states
  const [fleet, setFleet] = useState<Vehicle[]>(() => loadFleet());
  const [drivers, setDrivers] = useState<Employee[]>(() => loadDrivers());
  const [fuelDeposits, setFuelDeposits] = useState<FuelDeposit[]>(() => loadFuelDeposits());
  const [fuelVouchers, setFuelVouchers] = useState<FuelDispensary[]>(() => loadFuelVouchers());
  const [issuedVouchers, setIssuedVouchers] = useState<IssuedFuelVoucher[]>(() => loadIssuedVouchers());
  const [fleetColumnConfig, setFleetColumnConfig] = useState<TableColumnConfig<TableColumnKey>>(() => loadFleetColumnConfig());
  
  // Navigation & UI states
  const [currentView, setCurrentView] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === 'chofer' || params.get('mode') === 'driver' || params.get('vista') === 'chofer') {
        return 'portal-chofer';
      }
    }
    return 'flota';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  // Vehicle Modals
  const [isCreateVehicleModalOpen, setIsCreateVehicleModalOpen] = useState<boolean>(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);
  const [selectedVehicleForDetail, setSelectedVehicleForDetail] = useState<Vehicle | null>(null);
  const [selectedVehicleCodeForAnalytics, setSelectedVehicleCodeForAnalytics] = useState<string | null>(null);

  // Driver / Employee Modals
  const [isCreateDriverModalOpen, setIsCreateDriverModalOpen] = useState<boolean>(false);
  const [driverToEdit, setDriverToEdit] = useState<Employee | null>(null);
  const [selectedDriverForDetail, setSelectedDriverForDetail] = useState<Employee | null>(null);

  // Fuel Deposit Modals (Modalidades: Ambulante, Bidones, Vales)
  const [isCreateFuelDepositModalOpen, setIsCreateFuelDepositModalOpen] = useState<boolean>(false);
  const [fuelDepositToEdit, setFuelDepositToEdit] = useState<FuelDeposit | null>(null);
  const [selectedFuelDepositForDetail, setSelectedFuelDepositForDetail] = useState<FuelDeposit | null>(null);
  const [fuelDepositToRefill, setFuelDepositToRefill] = useState<FuelDeposit | null>(null);
  const [isRefillModalOpen, setIsRefillModalOpen] = useState<boolean>(false);
  const [preselectedDepositForVoucher, setPreselectedDepositForVoucher] = useState<FuelDeposit | null>(null);

  // Fuel Dispensary (Expendio de Combustible - 22 Columnas) Modals
  const [isCreateFuelVoucherModalOpen, setIsCreateFuelVoucherModalOpen] = useState<boolean>(false);
  const [fuelVoucherToEdit, setFuelVoucherToEdit] = useState<FuelDispensary | null>(null);
  const [selectedFuelVoucherForDetail, setSelectedFuelVoucherForDetail] = useState<FuelDispensary | null>(null);
  const [initialVoucherIdForExpendio, setInitialVoucherIdForExpendio] = useState<string | null>(null);

  // Issued Fuel Vouchers (Vales de Combustible - Emisión & Circuito) Modals
  const [isCreateIssuedVoucherModalOpen, setIsCreateIssuedVoucherModalOpen] = useState<boolean>(false);
  const [issuedVoucherToEdit, setIssuedVoucherToEdit] = useState<IssuedFuelVoucher | null>(null);
  const [selectedIssuedVoucherForDetail, setSelectedIssuedVoucherForDetail] = useState<IssuedFuelVoucher | null>(null);

  // Partes Diarios States & Modals
  const [partesDiarios, setPartesDiarios] = useState<ParteDiario[]>(() => loadPartesDiarios());
  const [isCreateParteModalOpen, setIsCreateParteModalOpen] = useState<boolean>(false);
  const [parteToEdit, setParteToEdit] = useState<ParteDiario | null>(null);
  const [selectedParteForDetail, setSelectedParteForDetail] = useState<ParteDiario | null>(null);

  // Obras States & Modals
  const [obras, setObras] = useState<Obra[]>(() => loadObras());
  const [isCreateObraModalOpen, setIsCreateObraModalOpen] = useState<boolean>(false);
  const [obraToEdit, setObraToEdit] = useState<Obra | null>(null);
  const [selectedObraForDetail, setSelectedObraForDetail] = useState<Obra | null>(null);

  // Other Modals
  const [isColumnModalOpen, setIsColumnModalOpen] = useState<boolean>(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [importExportModalState, setImportExportModalState] = useState<{
    isOpen: boolean;
    entityType: EntityType;
  }>({
    isOpen: false,
    entityType: 'flota'
  });
  // Database & Storage Modal
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial Load from CockroachDB if available and populated
  useEffect(() => {
    let isMounted = true;
    async function loadFromCockroachDB() {
      try {
        const [v, f, p, d, o, dep, iss] = await Promise.all([
          apiFetchCollection<Vehicle>('vehicles'),
          apiFetchCollection<FuelDispensary>('fuel_vouchers'),
          apiFetchCollection<ParteDiario>('partes_diarios'),
          apiFetchCollection<Employee>('drivers'),
          apiFetchCollection<Obra>('obras'),
          apiFetchCollection<FuelDeposit>('fuel_deposits'),
          apiFetchCollection<IssuedFuelVoucher>('issued_vouchers'),
        ]);

        if (!isMounted) return;

        if (v && v.length > 0) setFleet(v);
        if (f && f.length > 0) setFuelVouchers(f);
        if (p && p.length > 0) setPartesDiarios(p);
        if (d && d.length > 0) setDrivers(d);
        if (o && o.length > 0) setObras(o);
        if (dep && dep.length > 0) setFuelDeposits(dep);
        if (iss && iss.length > 0) setIssuedVouchers(iss);
      } catch (err) {
        console.log('Modo local / CockroachDB en espera de configuración');
      }
    }
    loadFromCockroachDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync fleet changes with LocalStorage and CockroachDB
  useEffect(() => {
    saveFleet(fleet);
    apiSaveItems('vehicles', fleet).catch(() => {});
  }, [fleet]);

  // Sync drivers changes with LocalStorage and CockroachDB
  useEffect(() => {
    saveDrivers(drivers);
    apiSaveItems('drivers', drivers).catch(() => {});
  }, [drivers]);

  // Sync fuel deposits with LocalStorage and CockroachDB
  useEffect(() => {
    saveFuelDeposits(fuelDeposits);
    apiSaveItems('fuel_deposits', fuelDeposits).catch(() => {});
  }, [fuelDeposits]);

  // Sync fuel dispensaries with LocalStorage and CockroachDB
  useEffect(() => {
    saveFuelVouchers(fuelVouchers);
    apiSaveItems('fuel_vouchers', fuelVouchers).catch(() => {});
  }, [fuelVouchers]);

  // Sync issued vouchers with LocalStorage and CockroachDB
  useEffect(() => {
    saveIssuedVouchers(issuedVouchers);
    apiSaveItems('issued_vouchers', issuedVouchers).catch(() => {});
  }, [issuedVouchers]);

  // Sync partes diarios with LocalStorage and CockroachDB
  useEffect(() => {
    savePartesDiarios(partesDiarios);
    apiSaveItems('partes_diarios', partesDiarios).catch(() => {});
  }, [partesDiarios]);

  // Sync obras with LocalStorage and CockroachDB
  useEffect(() => {
    saveObras(obras);
    apiSaveItems('obras', obras).catch(() => {});
  }, [obras]);

  const handleSaveObra = (obra: Obra) => {
    setObras(prev => {
      const exists = prev.some(o => o.id === obra.id);
      if (exists) {
        return prev.map(o => o.id === obra.id ? obra : o);
      } else {
        return [obra, ...prev];
      }
    });
    showToast(obraToEdit ? 'Obra actualizada correctamente' : 'Nueva obra registrada con éxito');
  };

  const handleDeleteObra = (id: string) => {
    setObras(prev => prev.filter(o => o.id !== id));
    apiDeleteItem('obras', id).catch(() => {});
    showToast('Obra eliminada con éxito.');
  };

  const handleSaveParteDiario = (parte: ParteDiario) => {
    setPartesDiarios(prev => {
      const exists = prev.some(p => p.id === parte.id);
      const updated = exists ? prev.map(p => p.id === parte.id ? parte : p) : [parte, ...prev];
      savePartesDiarios(updated);
      return updated;
    });
    showToast(parteToEdit ? 'Parte diario actualizado correctamente' : 'Nuevo parte diario registrado con éxito');
  };

  const handleDeleteParteDiario = (id: string) => {
    setPartesDiarios(prev => {
      const updated = prev.filter(p => p.id !== id);
      savePartesDiarios(updated);
      return updated;
    });
    apiDeleteItem('partes_diarios', id).catch(() => {});
    showToast('Parte diario eliminado.');
  };

  const handleDeleteSelectedPartes = (ids: string[]) => {
    setPartesDiarios(prev => {
      const updated = prev.filter(p => !ids.includes(p.id));
      savePartesDiarios(updated);
      return updated;
    });
    ids.forEach(id => apiDeleteItem('partes_diarios', id).catch(() => {}));
    showToast(`${ids.length} partes diarios eliminados correctamente.`);
  };

  // Sync fleet column config with LocalStorage
  useEffect(() => {
    saveFleetColumnConfig(fleetColumnConfig);
  }, [fleetColumnConfig]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // --- Handlers for Vehicle Actions ---
  const handleSaveVehicle = (vehicle: Vehicle) => {
    const exists = fleet.some(v => v.id === vehicle.id);
    if (exists) {
      setFleet(prev => prev.map(v => v.id === vehicle.id ? vehicle : v));
      showToast(`Vehículo ${vehicle.id} modificado correctamente.`);
    } else {
      setFleet(prev => [vehicle, ...prev]);
      showToast(`Vehículo ${vehicle.id} dado de alta con éxito en la flota.`);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    const vehicle = fleet.find(v => v.id === id);
    setFleet(prev => prev.filter(v => v.id !== id));
    // Clear vehicle assignment on drivers if any
    setDrivers(prev => prev.map(d => d.vehiculoAsignadoId === id ? { ...d, vehiculoAsignadoId: undefined } : d));
    
    if (selectedVehicleForDetail?.id === id) {
      setSelectedVehicleForDetail(null);
    }
    apiDeleteItem('vehicles', id).catch(() => {});
    showToast(`Equipo ${vehicle?.id || id} eliminado de la flota.`);
  };

  const handleChangeVehicleStatus = (id: string, newStatus: VehicleStatus) => {
    setFleet(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, estado: newStatus };
      }
      return v;
    }));

    if (selectedVehicleForDetail?.id === id) {
      setSelectedVehicleForDetail(prev => prev ? { ...prev, estado: newStatus } : null);
    }

    showToast(`Estado de máquina actualizado a ${newStatus}.`);
  };

  const handleToggleDashboardVehicle = (id: string) => {
    setFleet(prev => prev.map(v => {
      if (v.id === id) {
        const nextVal = v.mostrarEnDashboard === false ? true : false;
        showToast(`Equipo ${v.id}: ${nextVal ? 'Visible en Dashboard' : 'Oculto del Dashboard'}`);
        return { ...v, mostrarEnDashboard: nextVal };
      }
      return v;
    }));
  };

  // --- Handlers for Driver / Employee Actions ---
  const handleSaveDriver = (employee: Employee) => {
    const exists = drivers.some(d => d.id === employee.id);
    if (exists) {
      setDrivers(prev => prev.map(d => d.id === employee.id ? employee : d));
      showToast(`Empleado ${employee.nombreApellido} (Legajo: ${employee.legajo}) actualizado.`);
    } else {
      setDrivers(prev => [employee, ...prev]);
      showToast(`Empleado ${employee.nombreApellido} dado de alta exitosamente.`);
    }
  };

  const handleDeleteDriver = (id: string) => {
    const target = drivers.find(d => d.id === id);
    setDrivers(prev => prev.filter(d => d.id !== id));
    if (selectedDriverForDetail?.id === id) {
      setSelectedDriverForDetail(null);
    }
    apiDeleteItem('drivers', id).catch(() => {});
    showToast(`Empleado ${target?.nombreApellido || id} dado de baja.`);
  };

  const handleChangeDriverStatus = (id: string, newStatus: DriverStatus) => {
    setDrivers(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, estado: newStatus };
      }
      return d;
    }));

    if (selectedDriverForDetail?.id === id) {
      setSelectedDriverForDetail(prev => prev ? { ...prev, estado: newStatus } : null);
    }

    showToast(`Estado de empleado actualizado a ${newStatus}.`);
  };

  // --- Handlers for Fuel Deposit Actions (3 Modalidades: Ambulante, Bidones, Vales) ---
  const handleSaveFuelDeposit = (deposit: FuelDeposit) => {
    const exists = fuelDeposits.some(d => d.id === deposit.id);
    if (exists) {
      setFuelDeposits(prev => prev.map(d => d.id === deposit.id ? deposit : d));
      showToast(`Depósito "${deposit.nombre}" actualizado.`);
    } else {
      setFuelDeposits(prev => [deposit, ...prev]);
      showToast(`Depósito "${deposit.nombre}" creado exitosamente (${deposit.modalidadLabel}).`);
    }

    if (selectedFuelDepositForDetail?.id === deposit.id) {
      setSelectedFuelDepositForDetail(deposit);
    }
  };

  const handleDeleteFuelDeposit = (id: string) => {
    const target = fuelDeposits.find(d => d.id === id);
    setFuelDeposits(prev => prev.filter(d => d.id !== id));
    if (selectedFuelDepositForDetail?.id === id) {
      setSelectedFuelDepositForDetail(null);
    }
    apiDeleteItem('fuel_deposits', id).catch(() => {});
    showToast(`Depósito "${target?.nombre || id}" eliminado.`);
  };

  const handleRefillDeposit = (depositId: string, addedLiters: number, newStock: number, notes?: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setFuelDeposits(prev => prev.map(d => {
      if (d.id === depositId) {
        const updatedStatus: FuelDepositStatus = newStock <= (d.nivelAlertaMinimo || 500) ? 'BAJO_STOCK' : 'OPERATIVO';
        return {
          ...d,
          stockActual: newStock,
          ultimaRecargaFecha: today,
          ultimaRecargaLitros: addedLiters,
          estado: updatedStatus,
          observaciones: notes ? `${d.observaciones ? d.observaciones + ' | ' : ''}Recarga: ${notes}` : d.observaciones
        };
      }
      return d;
    }));

    if (selectedFuelDepositForDetail?.id === depositId) {
      setSelectedFuelDepositForDetail(prev => prev ? {
        ...prev,
        stockActual: newStock,
        ultimaRecargaFecha: today,
        ultimaRecargaLitros: addedLiters,
        estado: newStock <= (prev.nivelAlertaMinimo || 500) ? 'BAJO_STOCK' : 'OPERATIVO'
      } : null);
    }

    showToast(`Recarga de +${addedLiters.toLocaleString()} Lts registrada exitosamente.`);
  };

  const handleNewDispensaryFromDeposit = (deposit: FuelDeposit) => {
    setPreselectedDepositForVoucher(deposit);
    setInitialVoucherIdForExpendio(null);
    setFuelVoucherToEdit(null);
    setIsCreateFuelVoucherModalOpen(true);
  };

  // --- Handlers for Issued Fuel Vouchers (Emisión & Rendición) ---
  const handleSaveIssuedVoucher = (voucher: IssuedFuelVoucher) => {
    const exists = issuedVouchers.some(v => v.id === voucher.id);
    if (exists) {
      setIssuedVouchers(prev => prev.map(v => v.id === voucher.id ? voucher : v));
      showToast(`Vale ${voucher.numVale} actualizado correctamente.`);
    } else {
      setIssuedVouchers(prev => [voucher, ...prev]);
      showToast(`Vale ${voucher.numVale} emitido y entregado a ${voucher.nombreApellido || 'chofer'}.`);
    }

    if (selectedIssuedVoucherForDetail?.id === voucher.id) {
      setSelectedIssuedVoucherForDetail(voucher);
    }
  };

  const handleDeleteIssuedVoucher = (id: string) => {
    const target = issuedVouchers.find(v => v.id === id);
    setIssuedVouchers(prev => prev.filter(v => v.id !== id));
    if (selectedIssuedVoucherForDetail?.id === id) {
      setSelectedIssuedVoucherForDetail(null);
    }
    apiDeleteItem('issued_vouchers', id).catch(() => {});
    showToast(`Vale ${target?.numVale || id} eliminado.`);
  };

  // Triggers the Rendición flow from the Vales view into the Expendio form
  const handleProceedToRendicion = (voucher: IssuedFuelVoucher) => {
    setSelectedIssuedVoucherForDetail(null);
    setInitialVoucherIdForExpendio(voucher.id);
    setFuelVoucherToEdit(null);
    setPreselectedDepositForVoucher(null);
    setIsCreateFuelVoucherModalOpen(true);
  };

  // --- Handlers for Fuel Dispensary (Expendio de Combustible - 22 Columnas) Actions ---
  const handleSaveFuelVoucher = (dispensary: FuelDispensary) => {
    const exists = fuelVouchers.some(v => v.id === dispensary.id);
    if (exists) {
      setFuelVouchers(prev => prev.map(v => v.id === dispensary.id ? dispensary : v));
    } else {
      setFuelVouchers(prev => [dispensary, ...prev]);

      // Auto-discount stock from corresponding deposit if found
      if (dispensary.deposito) {
        setFuelDeposits(prev => prev.map(d => {
          if (d.nombre.toLowerCase() === dispensary.deposito?.toLowerCase() || d.id === dispensary.deposito) {
            const nextStock = Math.max(0, (d.stockActual || 0) - (dispensary.cantidad || 0));
            const newStatus: FuelDepositStatus = nextStock <= (d.nivelAlertaMinimo || 500) ? 'BAJO_STOCK' : 'OPERATIVO';
            return {
              ...d,
              stockActual: nextStock,
              estado: newStatus
            };
          }
          return d;
        }));
      }
    }

    // AUTOMATIC CIRCUIT SYNC:
    // If this dispensary is linked to an IssuedFuelVoucher (via valeId or numVale),
    // mark that issued voucher as 'RENDIDO' and save actual liters & ticket data.
    const linkedVoucherId = dispensary.valeId;
    const linkedValeNum = dispensary.numVale;

    let matchedVoucher: IssuedFuelVoucher | undefined;
    if (linkedVoucherId) {
      matchedVoucher = issuedVouchers.find(v => v.id === linkedVoucherId);
    }
    if (!matchedVoucher && linkedValeNum) {
      matchedVoucher = issuedVouchers.find(v => v.numVale === linkedValeNum);
    }

    if (matchedVoucher) {
      const diffLitros = (dispensary.cantidad || 0) - (matchedVoucher.litrosAutorizados || 0);
      const updatedIssuedVoucher: IssuedFuelVoucher = {
        ...matchedVoucher,
        estado: 'RENDIDO',
        expendioId: dispensary.id,
        numTicket: dispensary.numTicket || matchedVoucher.numTicket,
        litrosReales: dispensary.cantidad,
        diferenciaLitros: diffLitros,
        odometroCarga: dispensary.kilometraje,
        importeTotal: dispensary.totalImporte,
        fechaRendicion: dispensary.fecha,
        horaRendicion: dispensary.hora,
        observaciones: dispensary.observaciones 
          ? `${matchedVoucher.observaciones ? matchedVoucher.observaciones + ' | ' : ''}Ticket: ${dispensary.numTicket || ''}` 
          : matchedVoucher.observaciones
      };

      setIssuedVouchers(prev => prev.map(v => v.id === matchedVoucher!.id ? updatedIssuedVoucher : v));
      showToast(`¡Ticket ${dispensary.numTicket || ''} registrado! El Vale ${matchedVoucher.numVale} pasó automáticamente a estado RENDIDO.`);
    } else {
      showToast(`Expendio ${dispensary.id} registrado con éxito (${dispensary.cantidad} Lts).`);
    }

    if (selectedFuelVoucherForDetail?.id === dispensary.id) {
      setSelectedFuelVoucherForDetail(dispensary);
    }
  };

  const handleDeleteFuelVoucher = (id: string) => {
    const target = fuelVouchers.find(v => v.id === id);
    setFuelVouchers(prev => prev.filter(v => v.id !== id));
    
    // If it was linked to an issued voucher, revert status to EMITIDO
    if (target?.valeId) {
      setIssuedVouchers(prev => prev.map(v => {
        if (v.id === target.valeId || v.expendioId === target.id) {
          return {
            ...v,
            estado: 'EMITIDO',
            expendioId: undefined,
            numTicket: undefined,
            litrosReales: undefined,
            diferenciaLitros: undefined,
            fechaRendicion: undefined,
            horaRendicion: undefined
          };
        }
        return v;
      }));
    }

    if (selectedFuelVoucherForDetail?.id === id) {
      setSelectedFuelVoucherForDetail(null);
    }
    apiDeleteItem('fuel_vouchers', id).catch(() => {});
    showToast(`Expendio ${target?.id || id} eliminado.`);
  };

  const handleChangeFuelVoucherStatus = (id: string, newStatus: FuelVoucherStatus) => {
    setFuelVouchers(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, estado: newStatus };
      }
      return v;
    }));

    if (selectedFuelVoucherForDetail?.id === id) {
      setSelectedFuelVoucherForDetail(prev => prev ? { ...prev, estado: newStatus } : null);
    }

    showToast(`Estado de expendio actualizado a ${newStatus}.`);
  };

  const handleSaveFleetColumnConfig = (newConfig: TableColumnConfig<TableColumnKey>) => {
    setFleetColumnConfig(newConfig);
    saveFleetColumnConfig(newConfig);
    showToast('Configuración de columnas de flota guardada.');
  };

  const handleResetFleetColumns = () => {
    const defaultCols: Record<TableColumnKey, boolean> = {
      id: true,
      modeloMarca: true,
      patente: true,
      codigoInterno: true,
      fotografia: true,
      precioCosto: true,
      precioSugerido: true,
      clasificacion: true,
      estado: true,
      horometro: true,
      ubicacionActual: true,
      fechaAlta: true
    };
    const defaultOrder: TableColumnKey[] = [
      'fotografia',
      'id',
      'modeloMarca',
      'patente',
      'codigoInterno',
      'clasificacion',
      'precioCosto',
      'precioSugerido',
      'estado',
      'horometro',
      'ubicacionActual',
      'fechaAlta'
    ];
    const newConfig: TableColumnConfig<TableColumnKey> = {
      order: defaultOrder,
      visible: defaultCols
    };
    setFleetColumnConfig(newConfig);
    saveFleetColumnConfig(newConfig);
    showToast('Columnas de flota restablecidas al orden y visibilidad inicial.');
  };

  const handleResetDemoData = () => {
    if (confirm('¿Deseas restablecer la flota, empleados, depósitos, vales emitidos y expendios a los datos de demostración?')) {
      const resetFleet = resetFleetToDefault();
      const resetDrivers = resetDriversToDefault();
      const resetDeposits = resetFuelDepositsToDefault();
      const resetVouchers = resetFuelVouchersToDefault();
      const resetIssued = resetIssuedVouchersToDefault();
      setFleet(resetFleet);
      setDrivers(resetDrivers);
      setFuelDeposits(resetDeposits);
      setFuelVouchers(resetVouchers);
      setIssuedVouchers(resetIssued);
      showToast('Datos restablecidos a los valores iniciales de La Hormiga.');
    }
  };

  const handleResetPartesDiarios = () => {
    if (confirm('¿Deseas restablecer los partes diarios a los valores predeterminados iniciales? Esto limpiará cualquier importación o dato erróneo.')) {
      const resetPartes = resetPartesDiariosToDefault();
      setPartesDiarios(resetPartes);
      showToast('Partes diarios restablecidos correctamente.');
    }
  };

  const handleClearAllPartesDiarios = () => {
    setPartesDiarios([]);
    savePartesDiarios([]);
    showToast('Todos los partes diarios han sido borrados.');
  };

  const handleResetDrivers = () => {
    if (confirm('¿Deseas restablecer la nómina de empleados a los valores iniciales?')) {
      const reset = resetDriversToDefault();
      setDrivers(reset);
      showToast('Nómina de empleados restablecida correctamente.');
    }
  };

  const handleClearAllDrivers = () => {
    setDrivers([]);
    saveDrivers([]);
    showToast('Todos los empleados han sido borrados.');
  };

  const handleDeleteSelectedDrivers = (ids: string[]) => {
    setDrivers(prev => {
      const updated = prev.filter(d => !ids.includes(d.id));
      saveDrivers(updated);
      return updated;
    });
    showToast(`${ids.length} empleados eliminados con éxito.`);
  };

  const handleExportFleetCSV = () => {
    exportFleetToCSV(fleet);
    showToast('Flota vehicular exportada a CSV exitosamente.');
  };

  const handleExportDriversCSV = () => {
    exportDriversToCSV(drivers, fleet);
    showToast('Nómina de empleados exportada a CSV exitosamente.');
  };

  const handleExportFuelDepositsCSV = () => {
    exportFuelDepositsToCSV(fuelDeposits);
    showToast('Depósitos de carga exportados a CSV exitosamente.');
  };

  const handleExportFuelVouchersCSV = () => {
    exportFuelVouchersToCSV(fuelVouchers);
    showToast('Expendio de combustible exportado a CSV con las 22 columnas oficiales.');
  };

  const handleExportIssuedVouchersCSV = () => {
    exportIssuedVouchersToCSV(issuedVouchers);
    showToast('Vales emitidos de combustible exportados a CSV exitosamente.');
  };

  const handleExportObrasCSV = () => {
    exportObrasToCSV(obras);
    showToast('Obras exportadas a CSV exitosamente.');
  };

  // --- Handlers for Import & Export Modal ---
  const handleOpenImportExport = (entityType: EntityType) => {
    setImportExportModalState({
      isOpen: true,
      entityType
    });
  };

  const handleImportSuccess = (importedItems: any[], mode: 'merge' | 'replace') => {
    const entityType = importExportModalState.entityType;
    if (entityType === 'flota') {
      setFleet(importedItems);
      saveFleet(importedItems);
      showToast(`Se importaron ${importedItems.length} equipos en la Flota Vehicular (${mode === 'merge' ? 'Combinado' : 'Reemplazado'}).`);
    } else if (entityType === 'empleados') {
      setDrivers(importedItems);
      saveDrivers(importedItems);
      showToast(`Se importaron ${importedItems.length} empleados en la Nómina (${mode === 'merge' ? 'Combinado' : 'Reemplazado'}).`);
    } else if (entityType === 'expendio') {
      setFuelVouchers(importedItems);
      saveFuelVouchers(importedItems);
      showToast(`Se importaron ${importedItems.length} registros en Expendio de Combustible (${mode === 'merge' ? 'Combinado' : 'Reemplazado'}).`);
    } else if (entityType === 'vales') {
      setIssuedVouchers(importedItems);
      saveIssuedVouchers(importedItems);
      showToast(`Se importaron ${importedItems.length} vales en Vales de Combustible (${mode === 'merge' ? 'Combinado' : 'Reemplazado'}).`);
    } else if (entityType === 'partesDiarios') {
      setPartesDiarios(importedItems);
      savePartesDiarios(importedItems);
      showToast(`Se importaron ${importedItems.length} partes diarios (${mode === 'merge' ? 'Combinado' : 'Reemplazado'}).`);
    } else if (entityType === 'obras') {
      setObras(importedItems);
      saveObras(importedItems);
      showToast(`Se importaron ${importedItems.length} obras (${mode === 'merge' ? 'Combinado' : 'Reemplazado'}).`);
    }
  };

  const getCurrentDataForImportExport = (entityType: EntityType) => {
    switch (entityType) {
      case 'flota': return fleet;
      case 'empleados': return drivers;
      case 'expendio': return fuelVouchers;
      case 'vales': return issuedVouchers;
      case 'partesDiarios': return partesDiarios;
      case 'obras': return obras;
    }
  };

  // Find driver assigned to a specific vehicle for details modal
  const assignedDriverForSelectedVehicle = selectedVehicleForDetail 
    ? drivers.find(d => d.vehiculoAsignadoId === selectedVehicleForDetail.id)
    : null;

  const pendingIssuedVouchersCount = issuedVouchers.filter(v => v.estado === 'EMITIDO').length;

  // If Chofer Portal View is active, render the dedicated mobile-first Driver App
  if (currentView === 'portal-chofer') {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-20 right-5 left-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#16191F] text-white rounded-xl shadow-2xl border border-amber-500/50 text-xs font-semibold animate-in slide-in-from-bottom-5">
            <div className="w-5 h-5 rounded bg-amber-500 text-black flex items-center justify-center font-black text-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </div>
        )}

        <DriverAppPortal
          fleet={fleet}
          drivers={drivers}
          obras={obras}
          partesDiarios={partesDiarios}
          onSaveParteDiario={handleSaveParteDiario}
          onExitToAdmin={() => setCurrentView('flota')}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-200 flex flex-col antialiased selection:bg-amber-500 selection:text-black font-sans">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#16191F] text-white rounded-xl shadow-2xl border border-amber-500/50 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <div className="w-5 h-5 rounded bg-amber-500 text-black flex items-center justify-center font-black text-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenCreateModal={() => {
          setVehicleToEdit(null);
          setIsCreateVehicleModalOpen(true);
        }}
        onOpenCreateDriverModal={() => {
          setDriverToEdit(null);
          setIsCreateDriverModalOpen(true);
        }}
        onOpenCreateFuelVoucherModal={() => {
          setFuelVoucherToEdit(null);
          setPreselectedDepositForVoucher(null);
          setInitialVoucherIdForExpendio(null);
          setIsCreateFuelVoucherModalOpen(true);
        }}
        onOpenCreateFuelDepositModal={() => {
          setFuelDepositToEdit(null);
          setIsCreateFuelDepositModalOpen(true);
        }}
        onOpenCreateIssuedVoucherModal={() => {
          setIssuedVoucherToEdit(null);
          setIsCreateIssuedVoucherModalOpen(true);
        }}
        onOpenColumnModal={() => setIsColumnModalOpen(true)}
        onOpenCalculatorModal={() => setIsCalculatorModalOpen(true)}
        onOpenCreateObraModal={() => {
          setObraToEdit(null);
          setIsCreateObraModalOpen(true);
        }}
        onExportCSV={handleExportFleetCSV}
        onExportDriversCSV={handleExportDriversCSV}
        onExportObrasCSV={handleExportObrasCSV}
        onExportFuelVouchersCSV={handleExportFuelVouchersCSV}
        onExportFuelDepositsCSV={handleExportFuelDepositsCSV}
        onExportIssuedVouchersCSV={handleExportIssuedVouchersCSV}
        fleet={fleet}
        drivers={drivers}
        obras={obras}
        fuelVouchers={fuelVouchers}
        fuelDeposits={fuelDeposits}
        issuedVouchers={issuedVouchers}
        partesDiariosCount={partesDiarios.length}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <Navbar
          currentView={currentView}
          onSelectView={setCurrentView}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
          onOpenCreateModal={() => {
            setVehicleToEdit(null);
            setIsCreateVehicleModalOpen(true);
          }}
          onOpenCreateDriverModal={() => {
            setDriverToEdit(null);
            setIsCreateDriverModalOpen(true);
          }}
          onOpenCreateFuelDepositModal={() => {
            setFuelDepositToEdit(null);
            setIsCreateFuelDepositModalOpen(true);
          }}
          onOpenCreateFuelVoucherModal={() => {
            setFuelVoucherToEdit(null);
            setPreselectedDepositForVoucher(null);
            setInitialVoucherIdForExpendio(null);
            setIsCreateFuelVoucherModalOpen(true);
          }}
          onOpenCreateIssuedVoucherModal={() => {
            setIssuedVoucherToEdit(null);
            setIsCreateIssuedVoucherModalOpen(true);
          }}
          onResetDemo={handleResetDemoData}
          totalVehicles={fleet.length}
          totalDrivers={drivers.length}
          totalFuelDeposits={fuelDeposits.length}
          totalFuelVouchers={fuelVouchers.length}
          totalIssuedVouchers={issuedVouchers.length}
          pendingIssuedVouchersCount={pendingIssuedVouchersCount}
        />

        {/* Dashboard Body */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {currentView === 'flota' ? (
            <>
              {/* Bento Welcome Banner */}
              <div className="bg-[#16191F] border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2 z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    FleetLogic Pro • La Hormiga
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    Gestión y Parque de Maquinarias
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                    Control de flota para alquiler de camiones y maquinaria pesada por días y horas de <strong>La Hormiga</strong>.
                  </p>
                </div>

                <div className="hidden sm:block z-10 bg-[#0F1115]/80 p-3 rounded-xl border border-slate-800 shadow-inner">
                  <Logo size="md" showTagline={true} />
                </div>

                {/* Subtle background grid pattern */}
                <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              </div>

              {/* Bento Quick Metrics */}
              <QuickStatsBanner fleet={fleet} />

              {/* Main Vehicle Table View */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Inventario Operativo de Equipos
                    </h3>
                    <p className="text-xs text-slate-500">
                      Visualización Bento, filtros en tiempo real y control de tarifas
                    </p>
                  </div>

                  <button
                    id="btn-alta-seccion"
                    onClick={() => {
                      setVehicleToEdit(null);
                      setIsCreateVehicleModalOpen(true);
                    }}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Dar de Alta Vehículo</span>
                  </button>
                </div>

                {/* The Table */}
                <VehicleTable
                  fleet={fleet}
                  visibleColumns={fleetColumnConfig.visible}
                  columnOrder={fleetColumnConfig.order}
                  onReorderColumns={(newOrder) => {
                    const updated = { ...fleetColumnConfig, order: newOrder };
                    setFleetColumnConfig(updated);
                    saveFleetColumnConfig(updated);
                  }}
                  onOpenCreateModal={() => {
                    setVehicleToEdit(null);
                    setIsCreateVehicleModalOpen(true);
                  }}
                  onOpenColumnModal={() => setIsColumnModalOpen(true)}
                  onViewDetails={(vehicle) => setSelectedVehicleForDetail(vehicle)}
                  onEditVehicle={(vehicle) => {
                    setVehicleToEdit(vehicle);
                    setIsCreateVehicleModalOpen(true);
                  }}
                  onDeleteVehicle={handleDeleteVehicle}
                  onChangeStatus={handleChangeVehicleStatus}
                  onOpenImportExport={() => handleOpenImportExport('flota')}
                  onExportCSV={handleExportFleetCSV}
                  onToggleDashboard={handleToggleDashboardVehicle}
                />
              </section>
            </>
          ) : currentView === 'choferes' ? (
            /* Empleados View */
            <DriverSection
              drivers={drivers}
              fleet={fleet}
              onOpenCreateModal={() => {
                setDriverToEdit(null);
                setIsCreateDriverModalOpen(true);
              }}
              onViewDetails={(driver) => setSelectedDriverForDetail(driver)}
              onEditDriver={(driver) => {
                setDriverToEdit(driver);
                setIsCreateDriverModalOpen(true);
              }}
              onDeleteDriver={handleDeleteDriver}
              onChangeStatus={handleChangeDriverStatus}
              onExportCSV={handleExportDriversCSV}
              onOpenImportExport={() => handleOpenImportExport('empleados')}
              onResetDrivers={handleResetDrivers}
              onClearAllDrivers={handleClearAllDrivers}
              onDeleteSelectedDrivers={handleDeleteSelectedDrivers}
              onViewVehicle={(v) => setSelectedVehicleForDetail(v)}
            />
          ) : currentView === 'depositos' ? (
            /* Depósitos de Carga View (3 Modalidades: Ambulante, Bidones, Vales) */
            <FuelDepositSection
              deposits={fuelDeposits}
              vouchers={fuelVouchers}
              fleet={fleet}
              employees={drivers}
              onOpenCreateModal={() => {
                setFuelDepositToEdit(null);
                setIsCreateFuelDepositModalOpen(true);
              }}
              onViewDetails={(deposit) => setSelectedFuelDepositForDetail(deposit)}
              onEditDeposit={(deposit) => {
                setFuelDepositToEdit(deposit);
                setIsCreateFuelDepositModalOpen(true);
              }}
              onDeleteDeposit={handleDeleteFuelDeposit}
              onOpenRefill={(deposit) => {
                setFuelDepositToRefill(deposit);
                setIsRefillModalOpen(true);
              }}
              onExportCSV={handleExportFuelDepositsCSV}
              onNewDispensaryFromDeposit={handleNewDispensaryFromDeposit}
            />
          ) : currentView === 'vales' ? (
            /* Vales de Combustible (Circuito de Emisión & Rendición) View */
            <IssuedVouchersSection
              vouchers={issuedVouchers}
              fleet={fleet}
              employees={drivers}
              deposits={fuelDeposits}
              onOpenCreateModal={() => {
                setIssuedVoucherToEdit(null);
                setIsCreateIssuedVoucherModalOpen(true);
              }}
              onViewDetails={(voucher) => setSelectedIssuedVoucherForDetail(voucher)}
              onEditVoucher={(voucher) => {
                setIssuedVoucherToEdit(voucher);
                setIsCreateIssuedVoucherModalOpen(true);
              }}
              onDeleteVoucher={handleDeleteIssuedVoucher}
              onProceedToRendicion={handleProceedToRendicion}
              onExportCSV={handleExportIssuedVouchersCSV}
              onOpenImportExport={() => handleOpenImportExport('vales')}
              onViewExpendio={(expendioId) => {
                const found = fuelVouchers.find(fv => fv.id === expendioId);
                if (found) {
                  setSelectedFuelVoucherForDetail(found);
                }
              }}
            />

          ) : currentView === 'partes-diarios' ? (
            /* Partes Diarios de Equipos View */
            <PartesDiariosSection
              partes={partesDiarios}
              fleet={fleet}
              employees={drivers}
              onOpenCreateModal={() => {
                setParteToEdit(null);
                setIsCreateParteModalOpen(true);
              }}
              onViewDetails={(parte) => setSelectedParteForDetail(parte)}
              onEditParte={(parte) => {
                setParteToEdit(parte);
                setIsCreateParteModalOpen(true);
              }}
              onDeleteParte={handleDeleteParteDiario}
              onExportCSV={() => exportPartesDiariosToCSV(partesDiarios)}
              onOpenImportExport={() => handleOpenImportExport('partesDiarios')}
              onResetPartesDiarios={handleResetPartesDiarios}
              onClearAllPartesDiarios={handleClearAllPartesDiarios}
              onDeleteSelectedPartes={handleDeleteSelectedPartes}
              onViewVehicle={(codigoEquipo, marcaModelo) => {
                const found = fleet.find(v => v.codigo === codigoEquipo || v.id === codigoEquipo || v.modeloMarca === marcaModelo);
                if (found) {
                  setSelectedVehicleForDetail(found);
                } else {
                  showToast(`Equipo: ${codigoEquipo || marcaModelo}`);
                }
              }}
              onViewEmployee={(codigoEmpleado, nombreApellido) => {
                const found = drivers.find(d => d.codigoEmpleado === codigoEmpleado || d.legajo === codigoEmpleado || d.nombreApellido === nombreApellido);
                if (found) {
                  setSelectedDriverForDetail(found);
                } else {
                  showToast(`Empleado: ${nombreApellido || codigoEmpleado}`);
                }
              }}
              onViewObra={(obraNombre, codigoObra) => {
                const found = obras.find(o => o.nombreObra.toLowerCase().trim() === obraNombre.toLowerCase().trim() || o.numero.toLowerCase().trim() === codigoObra.toLowerCase().trim());
                if (found) {
                  setSelectedObraForDetail(found);
                } else {
                  showToast(`Obra: ${obraNombre} [${codigoObra}]`);
                }
              }}
            />

          ) : currentView === 'obras' ? (
            /* Obras & Proyectos View */
            <ObrasSection
              obras={obras}
              onOpenCreateModal={() => {
                setObraToEdit(null);
                setIsCreateObraModalOpen(true);
              }}
              onViewDetails={(obra) => setSelectedObraForDetail(obra)}
              onEditObra={(obra) => {
                setObraToEdit(obra);
                setIsCreateObraModalOpen(true);
              }}
              onDeleteObra={handleDeleteObra}
              onExportCSV={handleExportObrasCSV}
              onOpenImportExport={() => handleOpenImportExport('obras')}
            />

          ) : currentView === 'costos-combustible' ? (
            /* Vista de Costos Mensuales en Combustibles */
            <FuelCostsSection
              fuelVouchers={fuelVouchers}
              fleet={fleet}
              deposits={fuelDeposits}
              onExportCSV={handleExportFuelVouchersCSV}
            />
          ) : currentView === 'tipos-combustible' ? (
            /* Vista de Gestión de Tipos y Precios de Combustible */
            <FuelTypesManagerSection
              fuelVouchers={fuelVouchers}
              onShowToast={showToast}
            />
          ) : currentView === 'dashboard-combustible-trabajo' ? (
            /* Vista de Dashboard: Cruce de Combustible vs Trabajo */
            <CombustibleVsTrabajoDashboard
              fuelVouchers={fuelVouchers}
              partesDiarios={partesDiarios}
              fleet={fleet}
            />
          ) : (
            /* Expendio de Combustible (22 Columnas) View */
            <FuelVoucherSection
              vouchers={fuelVouchers}
              fleet={fleet}
              employees={drivers}
              issuedVouchers={issuedVouchers}
              onOpenCreateModal={() => {
                setFuelVoucherToEdit(null);
                setPreselectedDepositForVoucher(null);
                setInitialVoucherIdForExpendio(null);
                setIsCreateFuelVoucherModalOpen(true);
              }}
              onRendirVale={(voucher) => handleProceedToRendicion(voucher)}
              onSwitchToIssuedVouchers={() => setCurrentView('vales')}
              onViewDetails={(voucher) => setSelectedFuelVoucherForDetail(voucher)}
              onViewIssuedVoucher={(voucher) => setSelectedIssuedVoucherForDetail(voucher)}
              onEditVoucher={(voucher) => {
                setFuelVoucherToEdit(voucher);
                setIsCreateFuelVoucherModalOpen(true);
              }}
              onDeleteVoucher={handleDeleteFuelVoucher}
              onChangeStatus={handleChangeFuelVoucherStatus}
              onExportCSV={handleExportFuelVouchersCSV}
              onOpenImportExport={() => handleOpenImportExport('expendio')}
              onViewVehicle={(v) => setSelectedVehicleForDetail(v)}
              onViewEmployee={(e) => setSelectedDriverForDetail(e)}
              onOpenVehicleAnalytics={(code) => setSelectedVehicleCodeForAnalytics(code)}
            />
          )}

        </main>
      </div>

      {/* Vehicle Modals */}
      <VehicleFormModal
        isOpen={isCreateVehicleModalOpen}
        onClose={() => {
          setIsCreateVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSave={handleSaveVehicle}
        vehicleToEdit={vehicleToEdit}
        existingCount={fleet.length}
      />

      <VehicleDetailModal
        isOpen={Boolean(selectedVehicleForDetail)}
        vehicle={selectedVehicleForDetail}
        assignedDriver={assignedDriverForSelectedVehicle}
        onClose={() => setSelectedVehicleForDetail(null)}
        onEdit={(v) => {
          setSelectedVehicleForDetail(null);
          setVehicleToEdit(v);
          setIsCreateVehicleModalOpen(true);
        }}
        onChangeStatus={handleChangeVehicleStatus}
        onViewDriver={(d) => {
          setSelectedVehicleForDetail(null);
          setSelectedDriverForDetail(d);
        }}
      />

      <VehicleFuelAnalyticsModal
        isOpen={Boolean(selectedVehicleCodeForAnalytics)}
        vehicleCode={selectedVehicleCodeForAnalytics}
        onClose={() => setSelectedVehicleCodeForAnalytics(null)}
        fleet={fleet}
        vouchers={fuelVouchers}
      />

      {/* Driver / Employee Modals */}
      <DriverFormModal
        isOpen={isCreateDriverModalOpen}
        onClose={() => {
          setIsCreateDriverModalOpen(false);
          setDriverToEdit(null);
        }}
        onSave={handleSaveDriver}
        driverToEdit={driverToEdit}
        existingDriversCount={drivers.length}
        fleet={fleet}
      />

      <DriverDetailModal
        isOpen={Boolean(selectedDriverForDetail)}
        driver={selectedDriverForDetail}
        fleet={fleet}
        onClose={() => setSelectedDriverForDetail(null)}
        onEdit={(d) => {
          setSelectedDriverForDetail(null);
          setDriverToEdit(d);
          setIsCreateDriverModalOpen(true);
        }}
        onChangeStatus={handleChangeDriverStatus}
        onViewVehicle={(v) => {
          setSelectedDriverForDetail(null);
          setSelectedVehicleForDetail(v);
        }}
      />

      {/* Fuel Deposit Modals (Ambulante, Bidones, Vales Estación) */}
      <FuelDepositFormModal
        isOpen={isCreateFuelDepositModalOpen}
        onClose={() => {
          setIsCreateFuelDepositModalOpen(false);
          setFuelDepositToEdit(null);
        }}
        onSave={handleSaveFuelDeposit}
        depositToEdit={fuelDepositToEdit}
        existingCount={fuelDeposits.length}
        fleet={fleet}
        employees={drivers}
      />

      <FuelDepositDetailModal
        isOpen={Boolean(selectedFuelDepositForDetail)}
        deposit={selectedFuelDepositForDetail}
        vouchers={fuelVouchers}
        onClose={() => setSelectedFuelDepositForDetail(null)}
        onOpenEdit={(d) => {
          setSelectedFuelDepositForDetail(null);
          setFuelDepositToEdit(d);
          setIsCreateFuelDepositModalOpen(true);
        }}
        onOpenRefill={(d) => {
          setSelectedFuelDepositForDetail(null);
          setFuelDepositToRefill(d);
          setIsRefillModalOpen(true);
        }}
        onNewDispensaryFromDeposit={handleNewDispensaryFromDeposit}
        onDelete={handleDeleteFuelDeposit}
      />

      <FuelDepositRefillModal
        isOpen={isRefillModalOpen}
        deposit={fuelDepositToRefill}
        onClose={() => {
          setIsRefillModalOpen(false);
          setFuelDepositToRefill(null);
        }}
        onConfirmRefill={handleRefillDeposit}
      />

      {/* Fuel Dispensary (Expendio 22 Cols) Modals */}
      <FuelVoucherFormModal
        isOpen={isCreateFuelVoucherModalOpen}
        onClose={() => {
          setIsCreateFuelVoucherModalOpen(false);
          setFuelVoucherToEdit(null);
          setPreselectedDepositForVoucher(null);
          setInitialVoucherIdForExpendio(null);
        }}
        onSave={handleSaveFuelVoucher}
        voucherToEdit={fuelVoucherToEdit}
        existingCount={fuelVouchers.length}
        existingVouchers={fuelVouchers}
        fleet={fleet}
        employees={drivers}
        deposits={fuelDeposits}
        preselectedDeposit={preselectedDepositForVoucher}
        issuedVouchers={issuedVouchers}
        initialSelectedVoucherId={initialVoucherIdForExpendio}
      />

      <FuelVoucherDetailModal
        isOpen={Boolean(selectedFuelVoucherForDetail)}
        voucher={selectedFuelVoucherForDetail}
        fleet={fleet}
        employees={drivers}
        issuedVouchers={issuedVouchers}
        onClose={() => setSelectedFuelVoucherForDetail(null)}
        onEdit={(v) => {
          setSelectedFuelVoucherForDetail(null);
          setFuelVoucherToEdit(v);
          setIsCreateFuelVoucherModalOpen(true);
        }}
        onDelete={handleDeleteFuelVoucher}
        onChangeStatus={handleChangeFuelVoucherStatus}
        onViewVehicle={(v) => {
          setSelectedFuelVoucherForDetail(null);
          setSelectedVehicleForDetail(v);
        }}
        onViewEmployee={(e) => {
          setSelectedFuelVoucherForDetail(null);
          setSelectedDriverForDetail(e);
        }}
        onViewIssuedVoucher={(iv) => {
          setSelectedFuelVoucherForDetail(null);
          setSelectedIssuedVoucherForDetail(iv);
        }}
      />

      {/* Issued Fuel Voucher (Emisión de Vales) Modals */}
      <IssuedVoucherFormModal
        isOpen={isCreateIssuedVoucherModalOpen}
        onClose={() => {
          setIsCreateIssuedVoucherModalOpen(false);
          setIssuedVoucherToEdit(null);
        }}
        onSave={handleSaveIssuedVoucher}
        voucherToEdit={issuedVoucherToEdit}
        fleet={fleet}
        employees={drivers}
        deposits={fuelDeposits}
        existingCount={issuedVouchers.length}
      />

      <IssuedVoucherDetailModal
        isOpen={Boolean(selectedIssuedVoucherForDetail)}
        voucher={selectedIssuedVoucherForDetail}
        fleet={fleet}
        employees={drivers}
        onClose={() => setSelectedIssuedVoucherForDetail(null)}
        onEdit={(v) => {
          setSelectedIssuedVoucherForDetail(null);
          setIssuedVoucherToEdit(v);
          setIsCreateIssuedVoucherModalOpen(true);
        }}
        onDelete={handleDeleteIssuedVoucher}
        onProceedToRendicion={handleProceedToRendicion}
        onViewExpendio={(expendioId) => {
          const found = fuelVouchers.find(fv => fv.id === expendioId);
          if (found) {
            setSelectedIssuedVoucherForDetail(null);
            setSelectedFuelVoucherForDetail(found);
          }
        }}
      />

      {/* Partes Diarios Modals */}
      <ParteDiarioFormModal
        isOpen={isCreateParteModalOpen}
        onClose={() => {
          setIsCreateParteModalOpen(false);
          setParteToEdit(null);
        }}
        onSave={handleSaveParteDiario}
        parteToEdit={parteToEdit}
        fleet={fleet}
        employees={drivers}
        obras={obras}
      />

      <ParteDiarioDetailModal
        isOpen={Boolean(selectedParteForDetail)}
        parte={selectedParteForDetail}
        onClose={() => setSelectedParteForDetail(null)}
        onEdit={(p) => {
          setSelectedParteForDetail(null);
          setParteToEdit(p);
          setIsCreateParteModalOpen(true);
        }}
      />

      {/* Obras Modals */}
      <ObraFormModal
        isOpen={isCreateObraModalOpen}
        onClose={() => {
          setIsCreateObraModalOpen(false);
          setObraToEdit(null);
        }}
        onSave={handleSaveObra}
        editingObra={obraToEdit}
      />

      <ObraDetailModal
        isOpen={Boolean(selectedObraForDetail)}
        obra={selectedObraForDetail}
        onClose={() => setSelectedObraForDetail(null)}
        onEdit={(o) => {
          setSelectedObraForDetail(null);
          setObraToEdit(o);
          setIsCreateObraModalOpen(true);
        }}
        partesDiarios={partesDiarios}
      />

      {/* Configuration & Pricing Modals */}
      <ColumnVisibilityModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        visibleColumns={fleetColumnConfig.visible}
        columnOrder={fleetColumnConfig.order}
        onSaveConfig={handleSaveFleetColumnConfig}
        onResetDefaults={handleResetFleetColumns}
      />

      <PricingCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        fleet={fleet}
      />

      {/* Global Data Import & Export Hub Modal */}
      <DataImportExportModal
        isOpen={importExportModalState.isOpen}
        entityType={importExportModalState.entityType}
        currentData={getCurrentDataForImportExport(importExportModalState.entityType)}
        onClose={() => setImportExportModalState(prev => ({ ...prev, isOpen: false }))}
        onImportSuccess={handleImportSuccess}
      />

      {/* CockroachDB and Cloudflare R2 Connection Modal */}
      <DatabaseStatusModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        fleet={fleet}
        drivers={drivers}
        fuelVouchers={fuelVouchers}
        fuelDeposits={fuelDeposits}
        issuedVouchers={issuedVouchers}
        obras={obras}
        partesDiarios={partesDiarios}
        onDataSynced={() => showToast('¡Datos migrados y sincronizados con CockroachDB!')}
      />
    </div>
  );
}
