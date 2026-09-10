import React, { useState, useRef } from 'react';
import { 
  EntityType, 
  ENTITY_CONFIGS, 
  exportBaseTableTemplate, 
  exportEntityData, 
  parseFileToObjects, 
  transformImportedRows 
} from '../services/importExportService';
import { 
  X, 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  RefreshCw, 
  HelpCircle, 
  Trash2,
  Table as TableIcon,
  ChevronRight,
  Info
} from 'lucide-react';

interface DataImportExportModalProps {
  isOpen: boolean;
  entityType: EntityType;
  currentData: any[];
  onClose: () => void;
  onImportSuccess: (importedItems: any[], mode: 'merge' | 'replace') => void;
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  isOpen,
  entityType,
  currentData,
  onClose,
  onImportSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [totalParsedCount, setTotalParsedCount] = useState<number>(0);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [rawParsedData, setRawParsedData] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const config = ENTITY_CONFIGS[entityType];

  const handleFileSelect = async (file: File) => {
    setErrorMessages([]);
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const parsed = await parseFileToObjects(file);
      if (parsed.length === 0) {
        setErrorMessages(['El archivo no contiene filas de datos o está vacío.']);
        setPreviewRows([]);
        setRawParsedData([]);
        setIsProcessing(false);
        return;
      }

      setRawParsedData(parsed);
      setTotalParsedCount(parsed.length);
      
      const cols = Object.keys(parsed[0] || {});
      setDetectedColumns(cols);

      // Transform preview
      const result = transformImportedRows(entityType, parsed.slice(0, 10), currentData, importMode);
      setPreviewRows(result.validItems.slice(0, 5));
      if (result.errors.length > 0) {
        setErrorMessages(result.errors.slice(0, 4));
      }
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setErrorMessages([`Error al leer el archivo: ${err.message || 'Formato no soportado'}`]);
      setPreviewRows([]);
      setRawParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (rawParsedData.length === 0) return;

    setIsProcessing(true);
    try {
      const result = transformImportedRows(entityType, rawParsedData, currentData, importMode);
      onImportSuccess(result.validItems, importMode);
      handleReset();
      onClose();
    } catch (err: any) {
      setErrorMessages([`Error procesando importación: ${err.message}`]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setRawParsedData([]);
    setTotalParsedCount(0);
    setDetectedColumns([]);
    setErrorMessages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-[#12151B] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161922]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  Importar y Exportar Datos
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {config.title}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Carga masiva, exportación en Excel/CSV y descarga de tabla base con formato oficial.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800/80 bg-[#12151B]">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'import'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>1. Importar Archivo (Excel / CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === 'export'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>2. Descargar Plantilla Base / Exportar</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          
          {/* TAB 1: IMPORT */}
          {activeTab === 'import' && (
            <div className="space-y-5">
              
              {/* Plantilla Base Quick Helper Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300">
                    ¿Primera vez importando? Descarga la <strong>Tabla Base Oficial</strong> con todas las columnas configuradas y ejemplos.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportBaseTableTemplate(entityType, 'xlsx')}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla Base (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {!selectedFile ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                    isDragging
                      ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                      : 'border-slate-800 hover:border-slate-700 bg-[#161922]/60 hover:bg-[#161922]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Arrastra tu archivo aquí o haz clic para seleccionarlo
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    Formatos soportados: <strong>Excel (.xlsx, .xls)</strong> y <strong>CSV / Texto (.csv, .txt)</strong> con delimitadores estándar (, ; \t).
                  </p>
                </div>
              ) : (
                /* Selected File Card */
                <div className="p-4 rounded-xl bg-[#161922] border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{selectedFile.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <p className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Se detectaron {totalParsedCount} filas de datos para procesar</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cambiar archivo</span>
                  </button>
                </div>
              )}

              {/* Import Mode Radio Switcher */}
              <div className="p-4 rounded-xl bg-[#161922] border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Modo de Importación:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Merge option */}
                  <label 
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-xs'
                        : 'bg-[#12151B] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-1 accent-amber-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>Combinar y Actualizar (Recomendado)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Mantiene los registros existentes, añade los nuevos y actualiza los que coincidan por ID o código.
                      </p>
                    </div>
                  </label>

                  {/* Replace option */}
                  <label 
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-red-500/10 border-red-500/50 text-white shadow-xs'
                        : 'bg-[#12151B] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-1 accent-red-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                        <span>Reemplazar Tabla Completa</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Borra todos los registros actuales de {config.title.toLowerCase()} y los reemplaza con los del archivo.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Error messages if any */}
              {errorMessages.length > 0 && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>Avisos de validación durante la lectura:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-300">
                    {errorMessages.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <TableIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>Previsualización (Primeras {previewRows.length} de {totalParsedCount} filas):</span>
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {detectedColumns.length} columnas detectadas
                    </span>
                  </div>

                  <div className="border border-slate-800 rounded-xl overflow-x-auto bg-[#0F1115] max-h-56">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#161922] text-slate-400 border-b border-slate-800 font-mono text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          {config.baseHeaders.slice(0, 8).map(h => (
                            <th key={h} className="px-3 py-2 text-slate-300">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                        {previewRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/30">
                            <td className="px-3 py-2 text-slate-500 font-bold">{rIdx + 1}</td>
                            {config.baseHeaders.slice(0, 8).map(h => {
                              const norm = h.toLowerCase();
                              // Find value in row
                              const val = (row as any)[h] || (row as any)[norm] || (row as any)[h.replace(/_/g, '')] || '-';
                              return (
                                <td key={h} className="px-3 py-2">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val || '-')}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: EXPORT & TEMPLATE */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              
              {/* Option A: Base Table Template (Empty ready to fill) */}
              <div className="p-5 rounded-2xl bg-[#161922] border border-slate-800 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                    <TableIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Plantilla Base de {config.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Descarga una planilla vacía con la estructura exacta de columnas ({config.baseHeaders.length} campos) y una fila de ejemplo para que puedas completarla en Excel o cualquier software de hoja de cálculo.
                    </p>
                  </div>
                </div>

                {/* Column list preview */}
                <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                    Estructura oficial de columnas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {config.baseHeaders.map((col) => (
                      <span key={col} className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[11px] font-mono border border-slate-700">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => exportBaseTableTemplate(entityType, 'xlsx')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Descargar Plantilla Base Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportBaseTableTemplate(entityType, 'csv')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Descargar Plantilla Base CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Option B: Export Current Live Data */}
              <div className="p-5 rounded-2xl bg-[#161922] border border-slate-800 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Exportar Datos Actuales ({currentData.length} registros)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Genera un archivo completo con todos los registros guardados actualmente en la base de datos de {config.title.toLowerCase()}.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => exportEntityData(entityType, currentData, 'xlsx')}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Exportar Datos en Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportEntityData(entityType, currentData, 'csv')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Datos en CSV (.csv)</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#161922] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {activeTab === 'import' && selectedFile && (
              <span>Listo para procesar <strong>{totalParsedCount}</strong> registros en modo <strong>{importMode === 'merge' ? 'Combinar' : 'Reemplazar'}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cerrar
            </button>

            {activeTab === 'import' && (
              <button
                type="button"
                disabled={!selectedFile || totalParsedCount === 0 || isProcessing}
                onClick={handleConfirmImport}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-black text-xs font-black shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>Confirmar e Importar ({totalParsedCount} filas)</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
