import React, { useState, useEffect } from 'react';
import { Database, Cloud, CheckCircle2, XCircle, AlertTriangle, RefreshCw, UploadCloud, Server, ExternalLink, ShieldCheck, Copy, Check } from 'lucide-react';
import { checkSystemStatus, DbStatusResponse, apiSaveItems } from '../services/api';
import { Vehicle, Employee, FuelDispensary, FuelDeposit, IssuedFuelVoucher, Obra, ParteDiario } from '../types';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  fleet: Vehicle[];
  drivers: Employee[];
  fuelVouchers: FuelDispensary[];
  fuelDeposits: FuelDeposit[];
  issuedVouchers: IssuedFuelVoucher[];
  obras: Obra[];
  partesDiarios: ParteDiario[];
  onDataSynced?: () => void;
}

export const DatabaseStatusModal: React.FC<DatabaseStatusModalProps> = ({
  isOpen,
  onClose,
  fleet,
  drivers,
  fuelVouchers,
  fuelDeposits,
  issuedVouchers,
  obras,
  partesDiarios,
  onDataSynced,
}) => {
  const [status, setStatus] = useState<DbStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    const s = await checkSystemStatus();
    setStatus(s);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
      setSyncResult(null);
    }
  }, [isOpen]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSyncToCockroach = async () => {
    if (!status?.cockroachDb.connected) {
      setSyncResult({
        success: false,
        message: 'No se puede sincronizar: CockroachDB no está conectada.',
      });
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      await apiSaveItems('vehicles', fleet);
      await apiSaveItems('fuel_vouchers', fuelVouchers);
      await apiSaveItems('partes_diarios', partesDiarios);
      await apiSaveItems('drivers', drivers);
      await apiSaveItems('obras', obras);
      await apiSaveItems('fuel_deposits', fuelDeposits);
      await apiSaveItems('issued_vouchers', issuedVouchers);

      setSyncResult({
        success: true,
        message: `¡Sincronización exitosa! Se migraron ${fleet.length} vehículos, ${fuelVouchers.length} cargas, ${partesDiarios.length} partes diarios, ${drivers.length} choferes y ${fuelDeposits.length} depósitos a CockroachDB.`,
      });

      if (onDataSynced) {
        onDataSynced();
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: `Error durante la sincronización: ${err.message || 'Error desconocido'}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#16191F] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#12141A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Conexión a Base de Datos & Almacenamiento
              </h2>
              <p className="text-xs text-slate-400">CockroachDB (SQL Distribuido) + Cloudflare R2 (Imágenes & Fotos)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. CockroachDB */}
            <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">CockroachDB</span>
                  </div>
                  {status?.cockroachDb.connected ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> No Conectado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mb-2">{status?.cockroachDb.message}</p>
                {status?.cockroachDb.version && (
                  <p className="text-[10px] text-slate-500 font-mono truncate">{status.cockroachDb.version}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                Variable: <code className="text-amber-300 font-mono">DATABASE_URL</code>
              </div>
            </div>

            {/* 2. Cloudflare R2 */}
            <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Cloudflare R2</span>
                  </div>
                  {status?.cloudflareR2.configured ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Configurado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mb-2">{status?.cloudflareR2.message}</p>
                {status?.cloudflareR2.bucket && (
                  <p className="text-[10px] text-slate-400">
                    Bucket: <span className="text-white font-mono">{status.cloudflareR2.bucket}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                Variables: <code className="text-cyan-300 font-mono">R2_ACCOUNT_ID, R2_...</code>
              </div>
            </div>

          </div>

          {/* Sync Local Data to CockroachDB */}
          <div className="bg-[#12141A] border border-slate-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  Sincronizar y Migrar Datos a CockroachDB
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Guarda todos los datos actuales ({fleet.length} vehículos, {fuelVouchers.length} cargas, {partesDiarios.length} partes diarios) en tu base de datos CockroachDB.
                </p>
              </div>

              <button
                onClick={handleSyncToCockroach}
                disabled={syncing || !status?.cockroachDb.connected}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-black text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:cursor-not-allowed"
              >
                {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>{syncing ? 'Sincronizando...' : 'Subir Datos a CockroachDB'}</span>
              </button>
            </div>

            {syncResult && (
              <div className={`p-3 rounded-lg text-xs mt-3 flex items-start gap-2 ${
                syncResult.success 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' 
                  : 'bg-red-500/10 border border-red-500/20 text-red-300'
              }`}>
                {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>{syncResult.message}</span>
              </div>
            )}
          </div>

          {/* Variables guide */}
          <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Variables de Entorno Requeridas (.env / Secrets)
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="bg-[#16191F] p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-amber-400 font-bold">DATABASE_URL</span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">postgresql://[user]:[password]@[host]:26257/[db]?sslmode=verify-full</p>
                </div>
                <button 
                  onClick={() => handleCopy('DATABASE_URL=""', 'db')}
                  className="text-slate-400 hover:text-white p-1" 
                  title="Copiar nombre"
                >
                  {copiedKey === 'db' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="bg-[#16191F] p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME</span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">Credenciales del bucket de Cloudflare R2 para almacenamiento de imágenes</p>
                </div>
                <button 
                  onClick={() => handleCopy('R2_ACCOUNT_ID=""\nR2_ACCESS_KEY_ID=""\nR2_SECRET_ACCESS_KEY=""\nR2_BUCKET_NAME=""\nR2_PUBLIC_URL=""', 'r2')}
                  className="text-slate-400 hover:text-white p-1" 
                  title="Copiar bloque de variables R2"
                >
                  {copiedKey === 'r2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#12141A] flex items-center justify-between">
          <button
            onClick={loadStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Verificar Conexión</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
