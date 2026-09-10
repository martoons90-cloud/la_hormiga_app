import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Upload, 
  Gauge, 
  Wrench, 
  Check, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ArrowLeft,
  Info,
  ShieldCheck,
  Droplet,
  Eye,
  RotateCcw,
  Maximize2,
  LayoutGrid,
  Video,
  SwitchCamera,
  Play
} from 'lucide-react';
import { DailyVehicleChecklist, Vehicle, Employee, Obra } from '../types';
import { uploadImageToCloudflareR2 } from '../services/api';

interface VehicleStartChecklistModalProps {
  vehicle: Vehicle;
  driver: Employee;
  obra?: Obra;
  existingChecklist?: DailyVehicleChecklist;
  onCompleteChecklist: (checklist: DailyVehicleChecklist) => void;
  onCancel?: () => void;
  showToast: (msg: string) => void;
}

interface PhotoSlot {
  key: keyof Pick<DailyVehicleChecklist, 'fotoFrente' | 'fotoAtras' | 'fotoLateralIzquierdo' | 'fotoLateralDerecho' | 'fotoCabinaInterior' | 'fotoTableroOdometro'>;
  label: string;
  stepNumber: number;
  instruction: string;
  sublabel: string;
  emoji: string;
  helperTip: string;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  { 
    key: 'fotoFrente', 
    stepNumber: 1,
    label: '1. Frente del Equipo', 
    instruction: 'Párate frente al equipo',
    sublabel: 'Balde / Trompa / Ópticas / Parabrisas', 
    emoji: '🚜',
    helperTip: 'Párate frente al equipo a 3 metros para capturar el frente completo y los accesorios.'
  },
  { 
    key: 'fotoLateralDerecho', 
    stepNumber: 2,
    label: '2. Lateral Derecho', 
    instruction: 'Párate en el costado derecho',
    sublabel: 'Oruga / Ruedas / Tanque / Puertas laterales', 
    emoji: '👉',
    helperTip: 'Captura el estado de las orugas, neumáticos y chapa del lado derecho.'
  },
  { 
    key: 'fotoAtras', 
    stepNumber: 3,
    label: '3. Parte Trasera', 
    instruction: 'Párate detrás del equipo',
    sublabel: 'Contrapeso / Faros traseros / Escape', 
    emoji: '🔙',
    helperTip: 'Enfoca el contrapeso, rejilla de radiador y luces traseras.'
  },
  { 
    key: 'fotoLateralIzquierdo', 
    stepNumber: 4,
    label: '4. Lateral Izquierdo', 
    instruction: 'Párate en el costado izquierdo',
    sublabel: 'Oruga / Ruedas / Espejo / Escalera de acceso', 
    emoji: '👈',
    helperTip: 'Muestra la escalera de acceso a cabina y el tren de rodaje izquierdo.'
  },
  { 
    key: 'fotoCabinaInterior', 
    stepNumber: 5,
    label: '5. Interior de Cabina', 
    instruction: 'Abre la puerta y enfoca la cabina',
    sublabel: 'Asiento / Mandos / Joysticks / Limpieza', 
    emoji: '💺',
    helperTip: 'Abre la puerta y enfoca los joysticks, asiento y mandos de control.'
  },
  { 
    key: 'fotoTableroOdometro', 
    stepNumber: 6,
    label: '6. Tablero / Horómetro', 
    instruction: 'Acércate al horómetro o velocímetro',
    sublabel: 'Números del horómetro legibles', 
    emoji: '⏱️',
    helperTip: 'Acerca la cámara para que los números o pantalla digital sean legibles.'
  },
];

export const VehicleStartChecklistModal: React.FC<VehicleStartChecklistModalProps> = ({
  vehicle,
  driver,
  obra,
  existingChecklist,
  onCompleteChecklist,
  onCancel,
  showToast
}) => {
  // Wizard steps: 1 = Fotos Guiadas (1 a 1 automáticas), 2 = Chequeo Mecánico/Fluidos, 3 = Odómetro/Horómetro Inicial
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Guided Photo Step index (0 to 5 for the 6 photos)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(() => {
    if (!existingChecklist) return 0;
    // Find first missing photo or default to 0
    const missingIndex = PHOTO_SLOTS.findIndex(s => !existingChecklist[s.key]);
    return missingIndex >= 0 ? missingIndex : 0;
  });

  // View mode in Step 1: 'guided' (one by one large photo) or 'grid' (all 6 cards)
  const [photoViewMode, setPhotoViewMode] = useState<'guided' | 'grid'>('guided');

  // Photos state (Data URLs or uploaded URLs)
  const [photos, setPhotos] = useState({
    fotoFrente: existingChecklist?.fotoFrente || '',
    fotoAtras: existingChecklist?.fotoAtras || '',
    fotoLateralIzquierdo: existingChecklist?.fotoLateralIzquierdo || '',
    fotoLateralDerecho: existingChecklist?.fotoLateralDerecho || '',
    fotoCabinaInterior: existingChecklist?.fotoCabinaInterior || '',
    fotoTableroOdometro: existingChecklist?.fotoTableroOdometro || '',
  });

  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  // Live Camera Stream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isFlashEffect, setIsFlashEffect] = useState<boolean>(false);

  // Mechanical / Fluid Checklist Items
  const [checklistItems, setChecklistItems] = useState({
    nivelAceiteMotor: existingChecklist?.nivelAceiteMotor ?? true,
    nivelRefrigerante: existingChecklist?.nivelRefrigerante ?? true,
    nivelAceiteHidraulico: existingChecklist?.nivelAceiteHidraulico ?? true,
    lucesYAlarmas: existingChecklist?.lucesYAlarmas ?? true,
    fugasFluidos: existingChecklist?.fugasFluidos ?? true,
    estadoNeumaticosOrugas: existingChecklist?.estadoNeumaticosOrugas ?? true,
    frenoEmergencia: existingChecklist?.frenoEmergencia ?? true,
    extintorYBotiquin: existingChecklist?.extintorYBotiquin ?? true,
  });

  // Odometro / Horometro
  const [odometroInicial, setOdometroInicial] = useState<string>(() => {
    if (existingChecklist?.odometroInicial) return String(existingChecklist.odometroInicial);
    if (vehicle?.horometro) return String(vehicle.horometro);
    return '';
  });

  const [observacionesChecklist, setObservacionesChecklist] = useState<string>(
    existingChecklist?.observacionesChecklist || ''
  );

  const [previewPhoto, setPreviewPhoto] = useState<{ label: string; url: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSlotKey, setCurrentSlotKey] = useState<keyof typeof photos | null>(null);

  const activePhotoSlot = PHOTO_SLOTS[currentPhotoIndex] || PHOTO_SLOTS[0];

  // Start live camera stream when in step 1
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Cámara en vivo no disponible:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  useEffect(() => {
    if (activeStep === 1) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeStep]);

  // Capture current live frame from video
  const handleSnapLivePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraActive) {
      triggerCameraForSlot(activePhotoSlot.key);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    // Flash shutter effect
    setIsFlashEffect(true);
    setTimeout(() => setIsFlashEffect(false), 200);

    const base64Data = canvas.toDataURL('image/jpeg', 0.82);
    processTakenPhoto(activePhotoSlot.key, base64Data);
  };

  // Process and save taken photo (Auto-advances to next slot!)
  const processTakenPhoto = async (targetSlotKey: keyof typeof photos, base64Data: string) => {
    setPhotos(prev => ({
      ...prev,
      [targetSlotKey]: base64Data
    }));

    const currentSlotIndex = PHOTO_SLOTS.findIndex(s => s.key === targetSlotKey);

    // Auto-advance seamlessly!
    if (currentSlotIndex >= 0 && currentSlotIndex < PHOTO_SLOTS.length - 1) {
      showToast(`✓ Foto ${currentSlotIndex + 1} guardada. Ahora: ${PHOTO_SLOTS[currentSlotIndex + 1].label}`);
      setCurrentPhotoIndex(currentSlotIndex + 1);
    } else if (currentSlotIndex === PHOTO_SLOTS.length - 1) {
      showToast('🎉 ¡Completaste las 6 fotos! Pasando a chequeo de fluidos.');
      stopCamera();
      setTimeout(() => {
        setActiveStep(2);
      }, 500);
    }

    // Background upload to Cloudflare R2
    try {
      const uploadResult = await uploadImageToCloudflareR2(
        base64Data, 
        `checklist_${vehicle.id}_${targetSlotKey}_${Date.now()}.jpg`,
        'image/jpeg'
      );
      if (uploadResult.success && uploadResult.url) {
        setPhotos(prev => ({
          ...prev,
          [targetSlotKey]: uploadResult.url
        }));
      }
    } catch (err) {
      console.warn('Subida R2 omitida:', err);
    }
  };

  // Trigger file selection for camera/gallery
  const triggerCameraForSlot = (slotKey: keyof typeof photos) => {
    setCurrentSlotKey(slotKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetSlotKey = currentSlotKey || activePhotoSlot.key;
    if (!file || !targetSlotKey) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('La foto es demasiado pesada (máx 10MB).');
      return;
    }

    setUploadingSlot(targetSlotKey);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      processTakenPhoto(targetSlotKey, base64Data);
      setUploadingSlot(null);
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (slotKey: keyof typeof photos, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotos(prev => ({
      ...prev,
      [slotKey]: ''
    }));
  };

  // Toggle item in Step 2
  const toggleCheck = (key: keyof typeof checklistItems) => {
    setChecklistItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Count photos loaded
  const photosCount = Object.values(photos).filter(Boolean).length;
  const isAllPhotosDone = photosCount === PHOTO_SLOTS.length;

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();

    if (!odometroInicial || isNaN(Number(odometroInicial))) {
      showToast('Por favor ingresa el valor numérico del Horómetro/Odómetro inicial.');
      setActiveStep(3);
      return;
    }

    const finalChecklist: DailyVehicleChecklist = {
      ...photos,
      ...checklistItems,
      odometroInicial: Number(odometroInicial),
      observacionesChecklist: observacionesChecklist.trim() || undefined,
      completado: true,
      fechaHoraChecklist: new Date().toISOString()
    };

    onCompleteChecklist(finalChecklist);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-y-auto font-sans p-3 sm:p-4">
      {/* Hidden canvas for taking snapshot from live video stream */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for camera/gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header Container */}
      <div className="max-w-lg w-full mx-auto bg-[#16191F] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black font-black flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block leading-tight">
                INSPECCIÓN RÁPIDA GUIADA
              </span>
              <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                Verificación Pre-Operacional
              </h2>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={() => {
                stopCamera();
                onCancel();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Machine & Driver banner */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
          <div className="min-w-0 pr-2">
            <span className="text-slate-400 block text-[10px]">Equipo:</span>
            <span className="font-bold text-amber-300 truncate block text-xs">
              {vehicle.id} - {vehicle.modeloMarca} ({vehicle.patente})
            </span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-slate-400 block text-[10px]">Chofer / Operador:</span>
            <span className="font-bold text-white block text-xs">
              {driver.nombreApellido}
            </span>
          </div>
        </div>

        {/* 3 Steps Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`py-2 px-1 rounded-xl text-center transition border cursor-pointer ${
              activeStep === 1
                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 font-bold text-xs'
            }`}
          >
            <span className="text-[9px] block opacity-80 uppercase">Paso 1</span>
            <span className="text-xs truncate block font-bold">📸 Fotos ({photosCount}/6)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (photosCount < 2) {
                showToast('Te recomendamos tomar las fotos del equipo primero.');
              }
              stopCamera();
              setActiveStep(2);
            }}
            className={`py-2 px-1 rounded-xl text-center transition border cursor-pointer ${
              activeStep === 2
                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 font-bold text-xs'
            }`}
          >
            <span className="text-[9px] block opacity-80 uppercase">Paso 2</span>
            <span className="text-xs truncate block font-bold">🔧 Fluidos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveStep(3);
            }}
            className={`py-2 px-1 rounded-xl text-center transition border cursor-pointer ${
              activeStep === 3
                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 font-bold text-xs'
            }`}
          >
            <span className="text-[9px] block opacity-80 uppercase">Paso 3</span>
            <span className="text-xs truncate block font-bold">⏱️ Horómetro</span>
          </button>
        </div>
      </div>

      {/* Main Step Content */}
      <div className="max-w-lg w-full mx-auto my-3 flex-1 flex flex-col justify-start">
        
        {/* ================= STEP 1: FOTOS GUIADAS AUTOMÁTICAS (1 A 1) ================= */}
        {activeStep === 1 && (
          <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
            
            {/* Top Toolbar: Switch view & Photo Dots */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  Captura Automática Guiada
                </span>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Foto {currentPhotoIndex + 1} de 6:</span>
                  <span className="text-amber-300">{activePhotoSlot.label}</span>
                </h3>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPhotoViewMode(photoViewMode === 'guided' ? 'grid' : 'guided')}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                  title="Cambiar vista a cuadrícula"
                >
                  {photoViewMode === 'guided' ? (
                    <>
                      <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold">Ver Todas</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-bold">Modo Guiado</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Horizontal Mini-Steps Selector (Click any photo to jump) */}
            <div className="grid grid-cols-6 gap-1">
              {PHOTO_SLOTS.map((slot, idx) => {
                const hasPhoto = Boolean(photos[slot.key]);
                const isSelected = idx === currentPhotoIndex;

                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => {
                      setCurrentPhotoIndex(idx);
                      setPhotoViewMode('guided');
                    }}
                    className={`py-1.5 px-1 rounded-lg text-center transition border cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-white font-bold ring-1 ring-amber-400'
                        : hasPhoto
                        ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400'
                        : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] block font-mono">#{idx + 1}</span>
                    <span className="text-[10px] block leading-tight">
                      {hasPhoto ? '✓' : slot.emoji}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* GUIDED MODE: ONE BIG INTERACTIVE CAPTURE CARD */}
            {photoViewMode === 'guided' ? (
              <div className="space-y-3">
                {/* Big Camera / Photo Area */}
                <div 
                  className={`relative aspect-4/3 w-full rounded-2xl border-2 transition overflow-hidden flex flex-col items-center justify-center p-3 text-center shadow-2xl group ${
                    photos[activePhotoSlot.key]
                      ? 'border-emerald-500 bg-black/60'
                      : 'border-amber-500 bg-slate-950'
                  }`}
                >
                  {/* Flash shutter visual effect */}
                  {isFlashEffect && (
                    <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200" />
                  )}

                  {photos[activePhotoSlot.key] ? (
                    <>
                      <img
                        src={photos[activePhotoSlot.key]}
                        alt={activePhotoSlot.label}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/60 flex flex-col justify-between p-3 z-10">
                        <div className="flex justify-between items-center">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-black font-black text-xs shadow flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Foto {currentPhotoIndex + 1} Lista</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPhoto({ label: activePhotoSlot.label, url: photos[activePhotoSlot.key] });
                              }}
                              className="p-2 rounded-full bg-black/70 hover:bg-black text-white text-xs backdrop-blur-sm"
                              title="Ver en pantalla completa"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                handleRemovePhoto(activePhotoSlot.key, e);
                                startCamera();
                              }}
                              className="p-2 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-xs shadow"
                              title="Borrar y repetir foto"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-center space-y-1">
                          <span className="text-sm font-black text-white drop-shadow block">
                            {activePhotoSlot.label}
                          </span>
                          <span className="text-[11px] text-emerald-300 font-bold bg-black/70 px-3 py-1 rounded-full inline-block backdrop-blur-sm">
                            ✓ Guardada con éxito
                          </span>
                        </div>
                      </div>
                    </>
                  ) : cameraActive ? (
                    /* Live viewfinder stream */
                    <div className="absolute inset-0 w-full h-full bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Viewfinder Target Framing & Guideline */}
                      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5 border-2 border-dashed border-amber-400/60 rounded-2xl m-2">
                        <div className="flex justify-between items-start pointer-events-auto">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500 text-black font-black text-[11px] shadow flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-600" />
                            <span>Enfocando #{currentPhotoIndex + 1}: {activePhotoSlot.label}</span>
                          </span>

                          <button
                            type="button"
                            onClick={toggleCameraFacing}
                            className="p-2 rounded-full bg-black/70 hover:bg-black text-amber-300 backdrop-blur-md shadow pointer-events-auto"
                            title="Girar cámara"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Framing crosshair in center */}
                        <div className="self-center w-16 h-16 border border-white/40 rounded-xl flex items-center justify-center">
                          <span className="text-2xl opacity-60">{activePhotoSlot.emoji}</span>
                        </div>

                        <div className="text-center bg-black/80 backdrop-blur-md rounded-xl py-1 px-2 border border-slate-700">
                          <span className="text-xs font-bold text-amber-300 block">
                            {activePhotoSlot.instruction}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Fallback file/gallery prompt */
                    <div 
                      onClick={() => triggerCameraForSlot(activePhotoSlot.key)}
                      className="cursor-pointer space-y-3 py-4"
                    >
                      <div className="w-16 h-16 rounded-3xl bg-amber-500 text-black flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 group-hover:scale-110 transition duration-300">
                        <Camera className="w-8 h-8 stroke-[2.5]" />
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-base font-black text-white block">
                          {activePhotoSlot.instruction}
                        </span>
                        <span className="text-xs text-amber-300 font-medium block">
                          {activePhotoSlot.sublabel}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full">
                        <Camera className="w-3.5 h-3.5" />
                        <span>Abrir Cámara</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Helper Tip */}
                <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-2.5 flex items-start gap-2 text-xs">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    <strong className="text-slate-200">Consejo:</strong> {activePhotoSlot.helperTip}
                  </p>
                </div>

                {/* Big Action Button (SACAR FOTO AHORA) - Automatically takes photo & advances */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (photos[activePhotoSlot.key]) {
                        // If already taken, retake
                        handleRemovePhoto(activePhotoSlot.key);
                        startCamera();
                      } else {
                        handleSnapLivePhoto();
                      }
                    }}
                    className={`w-full py-4.5 font-black text-base sm:text-lg rounded-2xl flex items-center justify-center gap-3 shadow-2xl transition cursor-pointer active:scale-95 ${
                      photos[activePhotoSlot.key]
                        ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40'
                        : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/40 animate-pulse'
                    }`}
                  >
                    <Camera className="w-6 h-6 stroke-[2.5]" />
                    <span>
                      {photos[activePhotoSlot.key] 
                        ? '🔄 REPETIR ESTA FOTO' 
                        : `📸 SACAR FOTO #${currentPhotoIndex + 1} (${activePhotoSlot.label.toUpperCase()})`}
                    </span>
                  </button>

                  {/* Manual upload fallback button */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => triggerCameraForSlot(activePhotoSlot.key)}
                      className="text-[11px] text-slate-400 hover:text-amber-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Subir desde Galería o Archivos si la cámara no abre</span>
                    </button>
                  </div>
                </div>

                {/* Prev / Next Navigation Arrows */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    disabled={currentPhotoIndex === 0}
                    onClick={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))}
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  <span className="text-xs font-mono text-amber-400 font-black">
                    {photosCount} de 6 fotos listas
                  </span>

                  {currentPhotoIndex < PHOTO_SLOTS.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentPhotoIndex(prev => Math.min(PHOTO_SLOTS.length - 1, prev + 1))}
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setActiveStep(2);
                      }}
                      className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl flex items-center gap-1 shadow transition cursor-pointer"
                    >
                      <span>Fluidos</span>
                      <ChevronRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* GRID VIEW: All 6 slots */
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PHOTO_SLOTS.map((slot, idx) => {
                    const photoUrl = photos[slot.key];
                    const isUploading = uploadingSlot === slot.key;

                    return (
                      <div
                        key={slot.key}
                        onClick={() => {
                          setCurrentPhotoIndex(idx);
                          triggerCameraForSlot(slot.key);
                        }}
                        className={`relative aspect-4/3 rounded-xl border-2 transition cursor-pointer overflow-hidden flex flex-col items-center justify-center p-2 text-center group ${
                          photoUrl
                            ? 'border-emerald-500 bg-emerald-950/20'
                            : 'border-dashed border-slate-700 bg-slate-900/60 hover:border-amber-500 hover:bg-slate-900'
                        }`}
                      >
                        {photoUrl ? (
                          <>
                            <img
                              src={photoUrl}
                              alt={slot.label}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-1.5">
                              <div className="flex justify-between items-start">
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-black text-[10px] shadow">
                                  ✓
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewPhoto({ label: slot.label, url: photoUrl });
                                    }}
                                    className="w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center text-xs"
                                    title="Ver en grande"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleRemovePhoto(slot.key, e)}
                                    className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-xs"
                                    title="Borrar foto"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <span className="text-[10px] font-black text-white truncate drop-shadow">
                                {slot.label}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {isUploading ? (
                              <div className="space-y-1">
                                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                                <span className="text-[10px] text-amber-400 font-bold block">Cargando...</span>
                              </div>
                            ) : (
                              <>
                                <div className="w-7 h-7 rounded-full bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 flex items-center justify-center mb-1 transition">
                                  <Camera className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-200 block leading-tight">
                                  {slot.stepNumber}. {slot.label}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPhotoViewMode('guided')}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
                >
                  Volver al Modo Guiado Paso a Paso
                </button>
              </div>
            )}

            {/* Quick Skip or Continue to Fluid Check */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <span>Continuar a Chequeo de Fluidos</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 2: CHEQUEO MECANICO / FLUIDOS ================= */}
        {activeStep === 2 && (
          <div className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Chequeo de Fluidos y Seguridad Operativa</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Verifica cada punto antes de dar marcha al motor (Toca para cambiar estado).
              </p>
            </div>

            <div className="space-y-2">
              {/* Item 1: Aceite Motor */}
              <div
                onClick={() => toggleCheck('nivelAceiteMotor')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  checklistItems.nivelAceiteMotor
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    checklistItems.nivelAceiteMotor ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}>
                    🛢️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Nivel de Aceite de Motor</h4>
                    <p className="text-[10px] text-slate-400">Varilla entre marcas MIN y MAX</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  checklistItems.nivelAceiteMotor ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {checklistItems.nivelAceiteMotor ? 'ÓPTIMO / OK' : 'BAJO / REVISAR'}
                </span>
              </div>

              {/* Item 2: Refrigerante Radiador */}
              <div
                onClick={() => toggleCheck('nivelRefrigerante')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  checklistItems.nivelRefrigerante
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    checklistItems.nivelRefrigerante ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}>
                    💧
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Nivel de Refrigerante / Agua</h4>
                    <p className="text-[10px] text-slate-400">Vaso de expansión o radiador en nivel</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  checklistItems.nivelRefrigerante ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {checklistItems.nivelRefrigerante ? 'ÓPTIMO / OK' : 'BAJO / REVISAR'}
                </span>
              </div>

              {/* Item 3: Fluido Hidráulico */}
              <div
                onClick={() => toggleCheck('nivelAceiteHidraulico')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  checklistItems.nivelAceiteHidraulico
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    checklistItems.nivelAceiteHidraulico ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}>
                    ⚙️
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Aceite Hidráulico (Visor / Tanque)</h4>
                    <p className="text-[10px] text-slate-400">Esencial en retroexcavadoras y palas</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  checklistItems.nivelAceiteHidraulico ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {checklistItems.nivelAceiteHidraulico ? 'ÓPTIMO / OK' : 'BAJO / REVISAR'}
                </span>
              </div>

              {/* Item 4: Fugas y Mangueras */}
              <div
                onClick={() => toggleCheck('fugasFluidos')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  checklistItems.fugasFluidos
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    checklistItems.fugasFluidos ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}>
                    🔍
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Mangueras y Cilindros sin Fugas</h4>
                    <p className="text-[10px] text-slate-400">Sin goteo en pistones ni acoples</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  checklistItems.fugasFluidos ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {checklistItems.fugasFluidos ? 'SIN FUGAS' : 'CON PÉRDIDA'}
                </span>
              </div>

              {/* Item 5: Orugas / Neumáticos */}
              <div
                onClick={() => toggleCheck('estadoNeumaticosOrugas')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  checklistItems.estadoNeumaticosOrugas
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    checklistItems.estadoNeumaticosOrugas ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}>
                    🚜
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Tensión Orugas / Presión Neumáticos</h4>
                    <p className="text-[10px] text-slate-400">Sin cortes profundos ni desprendimientos</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  checklistItems.estadoNeumaticosOrugas ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {checklistItems.estadoNeumaticosOrugas ? 'CORRECTO' : 'REVISIÓN'}
                </span>
              </div>

              {/* Item 6: Luces, Baliza y Alarma de Retroceso */}
              <div
                onClick={() => toggleCheck('lucesYAlarmas')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  checklistItems.lucesYAlarmas
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    checklistItems.lucesYAlarmas ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}>
                    🚨
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Luces de Trabajo y Alarma de Retroceso</h4>
                    <p className="text-[10px] text-slate-400">Baliza destellante y bocina activas</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  checklistItems.lucesYAlarmas ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {checklistItems.lucesYAlarmas ? 'OPERATIVO' : 'FALLA'}
                </span>
              </div>

              {/* Item 7: Freno de emergencia / Traba de seguridad */}
              <div
                onClick={() => toggleCheck('frenoEmergencia')}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  checklistItems.frenoEmergencia
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100'
                    : 'bg-rose-950/20 border-rose-500/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    checklistItems.frenoEmergencia ? 'bg-emerald-500 text-black' : 'bg-rose-600 text-white'
                  }`}>
                    🛑
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Traba de Seguridad / Freno</h4>
                    <p className="text-[10px] text-slate-400">Palanca de bloqueo de mandos de cabina</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  checklistItems.frenoEmergencia ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {checklistItems.frenoEmergencia ? 'TRABA OK' : 'REVISAR'}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="w-2/3 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <span>Siguiente: Horómetro Inicial</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ODOMETRO / HOROMETRO INICIAL + CONFIRMAR ================= */}
        {activeStep === 3 && (
          <form onSubmit={handleFinish} className="bg-[#16191F] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Paso 3: Odómetro / Horómetro Inicial</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Registra la lectura del tablero antes de arrancar la jornada de trabajo.
              </p>
            </div>

            {/* Odómetro input */}
            <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-3.5 space-y-2">
              <label className="block text-xs font-bold text-amber-300">
                Horómetro o Kilometraje al Inicio *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={odometroInicial}
                  onChange={(e) => setOdometroInicial(e.target.value)}
                  placeholder="Ej: 12450.5"
                  required
                  className="w-full bg-slate-900 border-2 border-amber-500/50 focus:border-amber-400 text-white font-mono text-xl font-black rounded-xl px-3.5 py-3 focus:outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  {vehicle.clasificacion?.toLowerCase().includes('camion') ? 'KM' : 'HS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Último registro en sistema: <strong className="text-white font-mono">{vehicle.horometro || 0} {vehicle.clasificacion?.toLowerCase().includes('camion') ? 'Km' : 'Hs'}</strong>
                </span>
              </p>
            </div>

            {/* Observaciones adicionales */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span>Observaciones del Checklist Inicial</span>
                <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
              </label>
              <textarea
                rows={2}
                value={observacionesChecklist}
                onChange={(e) => setObservacionesChecklist(e.target.value)}
                placeholder="Ej: Espejo derecho con fisura, máquina limpia, nivel de combustible en 3/4..."
                className="w-full bg-[#0F1115] border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            {/* Checklist Validation Card */}
            <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Inspección Lista para Operar</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Al confirmar, se guardará el checklist con fecha y hora actual y podrás comenzar a cargar tus horas y viajes en el Parte Diario.
              </p>
            </div>

            {/* Navigation & Submit */}
            <div className="pt-2 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="w-1/3 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Atrás
              </button>
              <button
                type="submit"
                className="w-2/3 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>HABILITAR Y COMENZAR</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Modal Preview Big Photo */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setPreviewPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-lg w-full text-center space-y-2">
            <h4 className="text-sm font-bold text-white">{previewPhoto.label}</h4>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.label}
              className="max-h-[75vh] w-auto mx-auto rounded-xl object-contain border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
