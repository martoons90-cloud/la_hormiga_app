import React, { useState, useEffect } from 'react';
import { Obra } from '../types';
import { X, Building2, MapPin, Hash, DollarSign, Calendar, UserCheck, CheckCircle } from 'lucide-react';

interface ObraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (obra: Obra) => void;
  editingObra?: Obra | null;
}

export const ObraFormModal: React.FC<ObraFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingObra,
}) => {
  const [numero, setNumero] = useState('');
  const [nombreObra, setNombreObra] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [pertenece, setPertenece] = useState('');
  const [activa, setActiva] = useState(true);
  const [plazo, setPlazo] = useState('');
  const [montoEstimado, setMontoEstimado] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (editingObra) {
      setNumero(editingObra.numero || '');
      setNombreObra(editingObra.nombreObra || '');
      setUbicacion(editingObra.ubicacion || '');
      setPertenece(editingObra.pertenece || '');
      setActiva(editingObra.activa ?? true);
      setPlazo(editingObra.plazo || '');
      setMontoEstimado(editingObra.montoEstimado || 0);
      setObservaciones(editingObra.observaciones || '');
    } else {
      setNumero(`OBRA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setNombreObra('');
      setUbicacion('');
      setPertenece('');
      setActiva(true);
      setPlazo('6 meses');
      setMontoEstimado(10000000);
      setObservaciones('');
    }
  }, [editingObra, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreObra.trim()) {
      alert('Por favor ingrese el nombre de la obra.');
      return;
    }

    const obraToSave: Obra = {
      id: editingObra ? editingObra.id : `obra-${Date.now()}`,
      numero: numero.trim() || `OBRA-${Date.now().toString().slice(-4)}`,
      nombreObra: nombreObra.trim(),
      ubicacion: ubicacion.trim(),
      pertenece: pertenece.trim() || 'Empresa Principal',
      activa,
      plazo: plazo.trim() || 'Sin especificar',
      montoEstimado: Number(montoEstimado) || 0,
      fechaAlta: editingObra?.fechaAlta || new Date().toISOString().slice(0, 10),
      observaciones: observaciones.trim()
    };

    onSave(obraToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1a1d24] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">
                {editingObra ? 'Editar Obra / Proyecto' : 'Nueva Obra / Proyecto'}
              </h3>
              <p className="text-xs text-slate-400">
                {editingObra ? `Actualizando ${editingObra.numero}` : 'Ingrese los datos de la nueva obra'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Número de Obra / Expediente
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="Ej. OBRA-2026-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Nombre de la Obra *
              </label>
              <input
                type="text"
                required
                value={nombreObra}
                onChange={(e) => setNombreObra(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-medium"
                placeholder="Ej. Pavimentación Acceso Norte"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Ubicación
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ej. Ruta 9 Km 45, Parque Industrial"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                ¿A quién le pertenece? (Empresa / Persona)
              </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={pertenece}
                  onChange={(e) => setPertenece(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ej. Constructora San Cayetano S.A."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Plazo Estimado
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={plazo}
                  onChange={(e) => setPlazo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ej. 12 meses"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Monto Estimado ($ ARS)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={montoEstimado}
                  onChange={(e) => setMontoEstimado(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  placeholder="45000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Estado Actual
              </label>
              <div className="flex items-center h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl">
                <label className="relative flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={activa}
                    onChange={(e) => setActiva(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className={`text-xs font-bold ${activa ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {activa ? 'ACTIVA (En ejecución)' : 'INACTIVA / Finalizada'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
              Observaciones / Notas
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Detalles adicionales, contactos o condiciones contractuales..."
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-sm font-bold transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {editingObra ? 'Guardar Cambios' : 'Registrar Obra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
