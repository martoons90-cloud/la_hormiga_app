import React, { useState, useEffect } from 'react';
import { ParteDiario, ParteTipoTrabajo, ParteAutorizadoStatus, Vehicle, Employee, Obra } from '../types';
import { X, ClipboardList, Check } from 'lucide-react';

interface ParteDiarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (parte: ParteDiario) => void;
  parteToEdit?: ParteDiario | null;
  fleet: Vehicle[];
  employees: Employee[];
  obras: Obra[];
}

const calculateHoursFromTimes = (iniMan?: string, finMan?: string, iniTar?: string, finTar?: string): number => {
  let totalMinutes = 0;
  const parseTimeToMinutes = (t?: string) => {
    if (!t) return 0;
    const parts = t.trim().split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const im = parseTimeToMinutes(iniMan);
  const fm = parseTimeToMinutes(finMan);
  if (fm > im) totalMinutes += (fm - im);

  const it = parseTimeToMinutes(iniTar);
  const ft = parseTimeToMinutes(finTar);
  if (ft > it) totalMinutes += (ft - it);

  return Number((totalMinutes / 60).toFixed(2));
};

export const ParteDiarioFormModal: React.FC<ParteDiarioFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  parteToEdit,
  fleet,
  employees,
  obras,
}) => {
  const [servMant, setServMant] = useState<string>('ALQUILER');
  const [obra, setObra] = useState<string>('AYALA EL MOLLAR');
  const [codigoObra, setCodigoObra] = useState<string>('OBRA-01');
  const [codigoEquipo, setCodigoEquipo] = useState<string>('EQ-01');
  const [marcaModelo, setMarcaModelo] = useState<string>('EXCAVADORA KOBELCO 2017');
  const [codigoEmpleado, setCodigoEmpleado] = useState<string>('EMP-101');
  const [nombreApellido, setNombreApellido] = useState<string>('GARCIA LUIS');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horaInicioMañana, setHoraInicioMañana] = useState<string>('08:00');
  const [horaFinMañana, setHoraFinMañana] = useState<string>('12:00');
  const [horaInicioTarde, setHoraInicioTarde] = useState<string>('13:00');
  const [horaFinTarde, setHoraFinTarde] = useState<string>('17:00');
  const calcHours = calculateHoursFromTimes(horaInicioMañana, horaFinMañana, horaInicioTarde, horaFinTarde);
  const horasTrabajadas = calcHours > 0 ? calcHours : 8.0;
  const hsCantidad = horasTrabajadas;
  const [odomKilom, setOdomKilom] = useState<number>(10000);
  const [tipo, setTipo] = useState<ParteTipoTrabajo>('HORAS');
  const [detalleTipo, setDetalleTipo] = useState<string>('EXCAVACIÓN Y NIVELACIÓN');
  const [viajesCantidad, setViajesCantidad] = useState<number>(0);
  const [extraccionEntregas, setExtraccionEntregas] = useState<string>('');
  const [tipoMaterial, setTipoMaterial] = useState<string>('');
  const [novedades, setNovedades] = useState<string>('Sin novedades');
  const [ubicacion, setUbicacion] = useState<string>('Sector Principal');
  const [encargadoObra, setEncargadoObra] = useState<string>('Juan Pérez');
  const [firma, setFirma] = useState<string>('Firmado');
  const [numParte, setNumParte] = useState<string>('2620');
  const [autorizado, setAutorizado] = useState<ParteAutorizadoStatus>('NO CONTROLADO');

  useEffect(() => {
    if (parteToEdit) {
      setServMant(parteToEdit.servMant || 'ALQUILER');
      setObra(parteToEdit.obra || 'AYALA EL MOLLAR');
      setCodigoObra(parteToEdit.codigoObra || 'OBRA-01');
      setCodigoEquipo(parteToEdit.codigoEquipo || 'EQ-01');
      setMarcaModelo(parteToEdit.marcaModelo || parteToEdit.vehicleName || 'EXCAVADORA KOBELCO 2017');
      setCodigoEmpleado(parteToEdit.codigoEmpleado || 'EMP-101');
      setNombreApellido(parteToEdit.nombreApellido || parteToEdit.driverName || 'GARCIA LUIS');
      setFecha(parteToEdit.fecha || new Date().toISOString().split('T')[0]);
      setHoraInicioMañana(parteToEdit.horaInicioMañana || '08:00');
      setHoraFinMañana(parteToEdit.horaFinMañana || '12:00');
      setHoraInicioTarde(parteToEdit.horaInicioTarde || '13:00');
      setHoraFinTarde(parteToEdit.horaFinTarde || '17:00');
      setOdomKilom(parteToEdit.odomKilom || 10000);
      setTipo(parteToEdit.tipo || 'HORAS');
      setDetalleTipo(parteToEdit.detalleTipo || 'TRABAJOS GENERALES');
      setViajesCantidad(parteToEdit.viajesCantidad || 0);
      setExtraccionEntregas(parteToEdit.extraccionEntregas || '');
      setTipoMaterial(parteToEdit.tipoMaterial || '');
      setNovedades(parteToEdit.novedades || '');
      setUbicacion(parteToEdit.ubicacion || '');
      setEncargadoObra(parteToEdit.encargadoObra || '');
      setFirma(parteToEdit.firma || 'Firmado');
      setNumParte(parteToEdit.numParte || '2620');
      setAutorizado(parteToEdit.autorizado || 'NO CONTROLADO');
    } else {
      setNumParte(String(Math.floor(2600 + Math.random() * 100)));
      setServMant('ALQUILER');
      setObra('AYALA EL MOLLAR');
      setCodigoObra('OBRA-01');
      setCodigoEquipo('EQ-01');
      setMarcaModelo(fleet[0]?.modeloMarca || 'EXCAVADORA KOBELCO 2017');
      setCodigoEmpleado('EMP-101');
      setNombreApellido(employees[0]?.nombreApellido || 'GARCIA LUIS');
      setFecha(new Date().toISOString().split('T')[0]);
      setHoraInicioMañana('08:00');
      setHoraFinMañana('12:00');
      setHoraInicioTarde('13:00');
      setHoraFinTarde('17:00');
      setOdomKilom(12000);
      setTipo('HORAS');
      setDetalleTipo('EXCAVACIÓN Y NIVELACIÓN');
      setViajesCantidad(0);
      setExtraccionEntregas('');
      setTipoMaterial('');
      setNovedades('Sin novedades');
      setUbicacion('Sector Norte');
      setEncargadoObra('Juan Pérez');
      setFirma('Firmado');
      setAutorizado('NO CONTROLADO');
    }
  }, [parteToEdit, isOpen, fleet, employees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newParte: ParteDiario = {
      id: parteToEdit ? parteToEdit.id : Math.random().toString(16).substring(2, 10),
      servMant,
      obra,
      codigoObra,
      codigoEquipo,
      marcaModelo,
      codigoEmpleado,
      nombreApellido,
      fecha,
      horaInicioMañana,
      horaFinMañana,
      horaInicioTarde,
      horaFinTarde,
      horasTrabajadas: Number(horasTrabajadas),
      odomKilom: Number(odomKilom),
      tipo,
      detalleTipo,
      viajesCantidad: tipo === 'VIAJES' ? Number(viajesCantidad) : 0,
      extraccionEntregas,
      tipoMaterial: tipo === 'VIAJES' ? tipoMaterial : '',
      hsCantidad: tipo === 'HORAS' ? Number(hsCantidad) : 0,
      novedades,
      ubicacion,
      encargadoObra,
      firma,
      numParte,
      autorizado,

      // Compatibility
      vehicleId: fleet.find(v => v.modeloMarca === marcaModelo)?.id || 'eq-1',
      vehicleName: marcaModelo,
      driverName: nombreApellido,
      cantidad: viajesCantidad,
      detalleEntrega: detalleTipo,
      combustibleConsumidoLts: 35
    };

    onSave(newParte);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {parteToEdit ? 'Editar Parte Diario (26 Columnas)' : 'Nuevo Parte Diario'}
              </h2>
              <p className="text-xs text-slate-400">Complete todos los campos del parte diario de equipos.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">NUM_PARTE</label>
              <input
                type="text"
                required
                value={numParte}
                onChange={(e) => setNumParte(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">AUTORIZADO</label>
              <select
                value={autorizado}
                onChange={(e) => setAutorizado(e.target.value as ParteAutorizadoStatus)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="NO CONTROLADO">NO CONTROLADO</option>
                <option value="CONTROLADO">CONTROLADO</option>
                <option value="AUTORIZADO">AUTORIZADO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">FECHA</label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">SERV_MANT</label>
              <input
                type="text"
                value={servMant}
                onChange={(e) => setServMant(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase">OBRA</label>
                {obras.length > 0 && (
                  <span className="text-[10px] text-amber-400 font-sans">Seleccionar de Obras</span>
                )}
              </div>
              {obras.length > 0 && (
                <select
                  value={obra}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    setObra(val);
                    const found = obras.find(o => o.nombreObra === val || o.numero === val || o.id === val);
                    if (found) {
                      setCodigoObra(found.numero);
                      if (found.ubicacion) setUbicacion(found.ubicacion);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 mb-2"
                >
                  <option value="">-- Seleccionar Obra Registrada --</option>
                  {obras.map(o => (
                    <option key={o.id} value={o.nombreObra}>
                      {o.nombreObra} [{o.numero}]
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                required
                value={obra}
                onChange={(e) => setObra(e.target.value)}
                placeholder="Nombre de obra"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase">CODIGO_OBRA</label>
                {obras.length > 0 && (
                  <span className="text-[10px] text-amber-400 font-sans">Seleccionar Código</span>
                )}
              </div>
              {obras.length > 0 && (
                <select
                  value={codigoObra}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    setCodigoObra(val);
                    const found = obras.find(o => o.numero === val || o.id === val);
                    if (found) {
                      setObra(found.nombreObra);
                      if (found.ubicacion) setUbicacion(found.ubicacion);
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 mb-2"
                >
                  <option value="">-- Seleccionar Código Obra --</option>
                  {obras.map(o => (
                    <option key={o.id} value={o.numero}>
                      {o.numero} - {o.nombreObra}
                    </option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={codigoObra}
                onChange={(e) => {
                  const val = e.target.value;
                  setCodigoObra(val);
                  const found = obras.find(o => o.numero.toLowerCase().trim() === val.toLowerCase().trim() || o.id.toLowerCase().trim() === val.toLowerCase().trim());
                  if (found) {
                    setObra(found.nombreObra);
                    if (found.ubicacion) setUbicacion(found.ubicacion);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase">MARCA_MODELO</label>
                {fleet.length > 0 && (
                  <span className="text-[10px] text-amber-400 font-sans">Seleccionar de Flota</span>
                )}
              </div>
              <select
                value={marcaModelo}
                onChange={(e) => {
                  const val = e.target.value;
                  setMarcaModelo(val);
                  const found = fleet.find(f => f.modeloMarca === val || f.codigo === val || f.id === val);
                  if (found) {
                    setCodigoEquipo(found.codigo || found.id || val);
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Seleccionar Equipo (Marca / Modelo) --</option>
                {fleet.map(f => (
                  <option key={f.id} value={f.modeloMarca}>
                    {f.modeloMarca} {f.codigo ? `[Código: ${f.codigo}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">CODIGO_EQUIPO</label>
              <input
                type="text"
                value={codigoEquipo}
                onChange={(e) => setCodigoEquipo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase">NOMBRE_APELLIDO</label>
                {employees.length > 0 && (
                  <span className="text-[10px] text-amber-400 font-sans">Seleccionar Empleado</span>
                )}
              </div>
              <select
                value={nombreApellido}
                onChange={(e) => {
                  const val = e.target.value;
                  setNombreApellido(val);
                  const found = employees.find(emp => emp.nombreApellido === val || emp.codigoEmpleado === val || emp.legajo === val);
                  if (found) {
                    setCodigoEmpleado(found.codigoEmpleado || found.legajo || 'EMP-' + Math.floor(100 + Math.random() * 900));
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Seleccionar Empleado / Operador --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.nombreApellido}>
                    {emp.nombreApellido} {emp.codigoEmpleado ? `[Legajo/Cod: ${emp.codigoEmpleado}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">CODIGO_EMPLEADO</label>
              <input
                type="text"
                value={codigoEmpleado}
                onChange={(e) => setCodigoEmpleado(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">HORA_INI_MAÑANA</label>
              <input
                type="text"
                value={horaInicioMañana}
                onChange={(e) => setHoraInicioMañana(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">HORA_FIN_MAÑANA</label>
              <input
                type="text"
                value={horaFinMañana}
                onChange={(e) => setHoraFinMañana(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">HORA_INI_TARDE</label>
              <input
                type="text"
                value={horaInicioTarde}
                onChange={(e) => setHoraInicioTarde(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">HORA_FIN_TARDE</label>
              <input
                type="text"
                value={horaFinTarde}
                onChange={(e) => setHoraFinTarde(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase">HORAS TRABAJADAS</label>
                <span className="text-[10px] text-amber-400 font-sans">Calculado automático</span>
              </div>
              <input
                type="number"
                step="0.1"
                readOnly
                disabled
                value={horasTrabajadas}
                className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">ODOM-KILOM</label>
              <input
                type="number"
                value={odomKilom}
                onChange={(e) => setOdomKilom(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">TIPO</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as ParteTipoTrabajo)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-amber-400"
              >
                <option value="HORAS">HORAS</option>
                <option value="VIAJES">VIAJES</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">DETALLE_TIPO</label>
              <input
                type="text"
                value={detalleTipo}
                onChange={(e) => setDetalleTipo(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">VIAJES_CANTIDAD</label>
              <input
                type="number"
                value={viajesCantidad}
                onChange={(e) => setViajesCantidad(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300 uppercase">HS_CANTIDAD</label>
                <span className="text-[10px] text-amber-400 font-sans">Calculado automático</span>
              </div>
              <input
                type="number"
                step="0.1"
                readOnly
                disabled
                value={hsCantidad}
                className="w-full bg-slate-900/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-bold cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">EXTRACION_ENTREGAS</label>
              <input
                type="text"
                value={extraccionEntregas}
                onChange={(e) => setExtraccionEntregas(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">TIPO_MATERIAL</label>
              <input
                type="text"
                value={tipoMaterial}
                onChange={(e) => setTipoMaterial(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">UBICACION</label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">ENCARGADO_OBRA</label>
              <input
                type="text"
                value={encargadoObra}
                onChange={(e) => setEncargadoObra(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">FIRMA</label>
              <input
                type="text"
                value={firma}
                onChange={(e) => setFirma(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-1">NOVEDADES</label>
            <textarea
              rows={2}
              value={novedades}
              onChange={(e) => setNovedades(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{parteToEdit ? 'Guardar Cambios' : 'Registrar Parte'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
