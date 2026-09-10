import React, { useState, useEffect } from 'react';
import { FuelDispensary } from '../types';
import { loadFuelPrices, saveFuelPrice } from '../services/storage';
import { 
  Fuel, 
  DollarSign, 
  Plus, 
  Tag, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Trash2, 
  Save, 
  X,
  Droplet,
  LayoutGrid,
  Table as TableIcon,
  Search
} from 'lucide-react';

interface FuelTypesManagerSectionProps {
  fuelVouchers: FuelDispensary[];
  onShowToast: (msg: string) => void;
}

export const FuelTypesManagerSection: React.FC<FuelTypesManagerSectionProps> = ({
  fuelVouchers,
  onShowToast
}) => {
  const [fuelPrices, setFuelPrices] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFuelName, setEditingFuelName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(1350);

  useEffect(() => {
    const loaded = loadFuelPrices();
    const defaults = {
      'DIESEL INFINIA': 1450,
      'INFINIA DIESEL': 1450,
      'DIESEL 500 (GRADO 2)': 1250,
      'DIESEL COMUN': 1250,
      'EURO DIESEL': 1500,
      'NAFTA SUPÉR': 1380,
      'NAFTA SÚPER': 1380,
      'NAFTA PREMIUM': 1550,
      'GNC / GLP': 650
    };
    const merged = { ...defaults, ...loaded };
    setFuelPrices(merged);
  }, []);

  // Calculate usage stats per fuel type from fuelVouchers
  const fuelStats: Record<string, { count: number; totalLiters: number }> = {};
  for (const v of fuelVouchers) {
    const ft = (v.tipoComb || v.combustible || 'Diesel General').trim().toUpperCase();
    if (!fuelStats[ft]) {
      fuelStats[ft] = { count: 0, totalLiters: 0 };
    }
    fuelStats[ft].count += 1;
    fuelStats[ft].totalLiters += Math.abs(v.cantidad !== undefined ? v.cantidad : (v.cantCarga || 0));
  }

  const allTypes = Array.from(new Set([...Object.keys(fuelPrices), ...Object.keys(fuelStats)]));

  const filteredTypes = allTypes.filter(ft => ft.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenCreate = () => {
    setEditingFuelName(null);
    setFormName('');
    setFormPrice(1350);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (name: string, price: number) => {
    setEditingFuelName(name);
    setFormName(name);
    setFormPrice(price);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formName.trim().toUpperCase();
    if (!trimmedName) {
      onShowToast('Por favor ingrese el nombre del combustible.');
      return;
    }
    if (formPrice <= 0) {
      onShowToast('El precio por litro debe ser mayor a 0.');
      return;
    }

    saveFuelPrice(trimmedName, formPrice);
    setFuelPrices(prev => ({ ...prev, [trimmedName]: formPrice }));
    onShowToast(`Combustible "${trimmedName}" guardado correctamente ($${formPrice} / L).`);
    setIsModalOpen(false);
  };

  const handleDelete = (name: string) => {
    const updated = { ...fuelPrices };
    delete updated[name];
    try {
      localStorage.setItem('fuel_prices_catalog', JSON.stringify(updated));
    } catch (err) {}
    setFuelPrices(updated);
    onShowToast(`Combustible "${name}" eliminado.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Fuel className="w-3.5 h-3.5" />
            Configuración • Tipos y Precios de Combustible
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Gestión de Tipos de Combustible y Precios
          </h2>
          <p className="text-xs md:text-sm text-slate-400 max-w-xl">
            Alta y actualización de precios unitarios por litro. Visualización en tarjetas o tabla interactiva.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-amber-500 text-black shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-amber-500 text-black shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Combustible</span>
          </button>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-[#16191F] border border-slate-800 rounded-xl p-4 shadow-xl flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar tipo de combustible..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          {filteredTypes.length} combustibles registrados
        </span>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTypes.map((ft) => {
            const price = fuelPrices[ft] || 1350;
            const stats = fuelStats[ft] || { count: 0, totalLiters: 0 };
            const isNafta = ft.includes('NAFTA') || ft.includes('SÚPER') || ft.includes('SUPÉR') || ft.includes('PREMIUM');
            
            return (
              <div key={ft} className="bg-[#16191F] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition">
                <div className="absolute top-0 right-0 p-4 text-slate-800 pointer-events-none">
                  <Fuel className="w-16 h-16 opacity-30" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      isNafta 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {isNafta ? 'Nafta' : 'Diesel / Gasoil'}
                    </span>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(ft, price)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                        title="Editar precio o nombre"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ft)}
                        className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg transition cursor-pointer"
                        title="Eliminar combustible"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide truncate" title={ft}>
                    {ft}
                  </h3>

                  <div className="mt-3 bg-slate-900/80 border border-slate-800/80 rounded-lg p-3">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Precio Unitario Vigente</span>
                    <p className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                      ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-slate-400 font-normal">/ L</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>{stats.count} registros</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-blue-400">
                    <Droplet className="w-3.5 h-3.5" />
                    <span>{stats.totalLiters.toLocaleString('es-AR', { maximumFractionDigits: 1 })} L</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-[#16191F] border border-slate-800 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/70 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tipo de Combustible</th>
                  <th className="py-3.5 px-4">Categoría</th>
                  <th className="py-3.5 px-4 text-right">Precio por Litro (ARS)</th>
                  <th className="py-3.5 px-4 text-center">Registros / Vales</th>
                  <th className="py-3.5 px-4 text-right">Volumen Total</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
                {filteredTypes.length > 0 ? (
                  filteredTypes.map((ft) => {
                    const price = fuelPrices[ft] || 1350;
                    const stats = fuelStats[ft] || { count: 0, totalLiters: 0 };
                    const isNafta = ft.includes('NAFTA') || ft.includes('SÚPER') || ft.includes('SUPÉR') || ft.includes('PREMIUM');
                    
                    return (
                      <tr key={ft} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2.5">
                          <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <Fuel className="w-4 h-4" />
                          </div>
                          <span>{ft}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isNafta 
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}>
                            {isNafta ? 'Nafta' : 'Diesel / Gasoil'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          ${price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-300 font-mono">
                          {stats.count}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-blue-400">
                          {stats.totalLiters.toLocaleString('es-AR', { maximumFractionDigits: 1 })} L
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(ft, price)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition text-xs font-semibold cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(ft)}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition text-xs font-semibold cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                      No se encontraron tipos de combustible con la búsqueda ingresada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing Fuel Type */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#16191F] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingFuelName ? 'Editar Combustible' : 'Nuevo Tipo de Combustible'}
                  </h3>
                  <p className="text-xs text-slate-400">Defina el nombre y el precio por litro</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Nombre del Combustible *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: DIESEL PREMIUM, GNC, BIO-DIESEL"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium uppercase"
                />
                <span className="text-[11px] text-slate-500">Se guardará en mayúsculas para estandarizar registros.</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Precio por Litro (ARS) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="1450.00"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3.5 py-2.5 text-white text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Este valor se usará en los cálculos de costos y presupuestos.</span>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Combustible</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
