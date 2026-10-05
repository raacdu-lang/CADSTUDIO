import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ClientGallery,
  ClientFile,
  DeliveryStatus,
  StudioConfig,
} from '../types';
import {
  getClientGalleries,
  getClientGalleryByToken,
  recordDownload,
  recordGalleryView,
  toggleFileSelection,
  submitClientSelection,
} from '../services/storageService';
import {
  FolderLock,
  Download,
  CheckCircle2,
  Clock,
  KeyRound,
  ShieldCheck,
  Heart,
  Eye,
  Camera,
  Film,
  Sparkles,
  ArrowRight,
  Share2,
  Send,
  Maximize2,
  Lock,
  Check,
  Copy,
  Info,
  ChevronRight,
  Loader2,
  FolderSync,
} from 'lucide-react';

interface ClientDeliveryPortalProps {
  initialToken?: string;
  config: StudioConfig;
  onOpenViewer: (file: ClientFile, allFiles: ClientFile[]) => void;
}

export const ClientDeliveryPortal: React.FC<ClientDeliveryPortalProps> = ({
  initialToken,
  config,
  onOpenViewer,
}) => {
  const [tokenInput, setTokenInput] = useState<string>(initialToken || '');
  const [pinInput, setPinInput] = useState<string>('');
  const [currentGallery, setCurrentGallery] = useState<ClientGallery | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [clientNotesText, setClientNotesText] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<{
    type: 'loading' | 'success' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Load initial gallery only if valid initialToken provided in URL or via admin link
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
      loadGallery(initialToken);
    } else {
      setCurrentGallery(null);
    }
  }, [initialToken]);

  const loadGallery = (token: string, pin?: string) => {
    setPinError(null);
    if (!token.trim()) {
      setPinError('Por favor introduce tu código de acceso o token de cliente.');
      setCurrentGallery(null);
      return;
    }

    const gallery = getClientGalleryByToken(token);
    if (!gallery) {
      setPinError('Código no encontrado. Por favor verifique el código personal provisto por CADSTUDIO.');
      setCurrentGallery(null);
      return;
    }

    // Check PIN requirement
    if (gallery.pin && (!pin || pin !== gallery.pin)) {
      if (pin && pin !== gallery.pin) {
        setPinError('El código PIN ingresado es incorrecto. Intente nuevamente.');
      } else {
        setPinError('Esta galería privada requiere un código PIN de seguridad de 4 dígitos.');
      }
      setCurrentGallery(null);
      return;
    }

    setCurrentGallery(gallery);
    setClientNotesText(gallery.clientNotes || '');
    recordGalleryView(gallery);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadGallery(tokenInput, pinInput);
  };

  // Helper to trigger direct download of original file without compression
  const triggerDirectDownload = (file: ClientFile) => {
    const link = document.createElement('a');
    const targetUrl = file.type === 'video' && file.videoSrc ? file.videoSrc : file.originalUrl;
    link.href = targetUrl;
    const ext = file.type === 'video' ? 'mp4' : 'jpg';
    link.download = `${file.title.replace(/\s+/g, '_')}_ORIGINAL_MASTER.${ext}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSingle = (file: ClientFile) => {
    if (!currentGallery) return;

    recordDownload(currentGallery.id, file.id, false);

    // Trigger direct download of the original file
    triggerDirectDownload(file);

    // Update local state download count
    setCurrentGallery((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        totalDownloads: prev.totalDownloads + 1,
        files: prev.files.map((f) =>
          f.id === file.id ? { ...f, downloadsCount: f.downloadsCount + 1 } : f
        ),
      };
    });

    setDownloadSuccessMessage(`Iniciando descarga en máxima resolución: ${file.title}`);
    setToastNotification({
      type: 'success',
      title: 'Descarga directa iniciada',
      message: `Descargando directamente "${file.title}" en archivo original (${file.fileSize}) sin compresión.`,
    });
    setTimeout(() => {
      setDownloadSuccessMessage(null);
      setToastNotification((curr) => (curr?.title === 'Descarga directa iniciada' ? null : curr));
    }, 4000);
  };

  const handleDownloadFullFolder = () => {
    if (!currentGallery || isDownloadingAll) return;

    setIsDownloadingAll(true);
    setDownloadProgress(10);
    setToastNotification({
      type: 'loading',
      title: 'Descargando archivos originales',
      message: `Iniciando descarga directa de ${currentGallery.files.length} archivos en máxima resolución original...`,
    });

    const total = currentGallery.files.length;
    currentGallery.files.forEach((file, index) => {
      setTimeout(() => {
        triggerDirectDownload(file);
        const progress = Math.round(((index + 1) / total) * 100);
        setDownloadProgress(progress);

        if (index === total - 1) {
          recordDownload(currentGallery.id, undefined, true);

          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#E11D48', '#ffffff', '#22c55e', '#3b82f6'],
          });

          setCurrentGallery((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              totalDownloads: prev.totalDownloads + prev.files.length,
            };
          });

          setIsDownloadingAll(false);
          setDownloadSuccessMessage(
            `Descarga completada: ${total} archivos originales descargados directamente sin compresión.`
          );
          setToastNotification({
            type: 'success',
            title: '¡Descarga directa completada!',
            message: `Se han descargado directamente los ${total} archivos en calidad 100% original.`,
          });

          setTimeout(() => {
            setDownloadSuccessMessage(null);
            setToastNotification((curr) => (curr?.type === 'success' ? null : curr));
            setDownloadProgress(0);
          }, 5000);
        }
      }, index * 250);
    });
  };

  const handleToggleSelect = (fileId: string) => {
    if (!currentGallery) return;
    const updated = toggleFileSelection(currentGallery.id, fileId);
    if (updated) {
      setCurrentGallery({ ...updated });
    }
  };

  const handleDownloadSelectedOnly = () => {
    if (!currentGallery || currentGallery.selectedFileIds.length === 0) return;

    const selectedFiles = currentGallery.files.filter((f) =>
      currentGallery.selectedFileIds.includes(f.id)
    );

    recordDownload(currentGallery.id, undefined, true);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });

    setDownloadSuccessMessage(
      `Descargando selección de ${selectedFiles.length} archivos originales directamente.`
    );
    setToastNotification({
      type: 'loading',
      title: 'Descarga directa de favoritas',
      message: `Iniciando descarga directa de ${selectedFiles.length} fotos originales en máxima resolución...`,
    });

    selectedFiles.forEach((file, index) => {
      setTimeout(() => {
        triggerDirectDownload(file);
        if (index === selectedFiles.length - 1) {
          setToastNotification({
            type: 'success',
            title: '¡Favoritas descargadas!',
            message: `Se han descargado directamente ${selectedFiles.length} archivos originales en calidad 100% master sin compresión.`,
          });
          setTimeout(() => {
            setDownloadSuccessMessage(null);
            setToastNotification((curr) => (curr?.title === '¡Favoritas descargadas!' ? null : curr));
          }, 4500);
        }
      }, index * 250);
    });
  };

  const handleSubmitSelectionToPhotographer = () => {
    if (!currentGallery) return;

    submitClientSelection(currentGallery.id, clientNotesText);
    setShowNotesModal(false);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });

    setCurrentGallery((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'seleccion_enviada',
        clientNotes: clientNotesText,
      };
    });

    setDownloadSuccessMessage(
      '¡Selección enviada con éxito! El fotógrafo ha sido notificado y procesará los retoques solicitados.'
    );
    setToastNotification({
      type: 'success',
      title: '¡Selección confirmada!',
      message: 'El fotógrafo ha recibido tus notas de retoque y favoritas en tiempo real.',
    });
    setTimeout(() => {
      setDownloadSuccessMessage(null);
      setToastNotification((curr) => (curr?.title === '¡Selección confirmada!' ? null : curr));
    }, 6000);
  };

  const copyPrivateLink = () => {
    if (!currentGallery) return;
    const url = `${window.location.origin}/?token=${currentGallery.token}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Helper for status badge & timeline
  const statusSteps: { key: DeliveryStatus; label: string; desc: string }[] = [
    { key: 'entregado', label: '1. Entregado', desc: 'Archivos listos' },
    { key: 'visto', label: '2. Visualizado', desc: 'Enlace abierto' },
    { key: 'en_seleccion', label: '3. En Selección', desc: 'Escogiendo fotos' },
    { key: 'seleccion_enviada', label: '4. Selección Enviada', desc: 'Notas recibidas' },
    { key: 'completado', label: '5. Completado', desc: 'Entrega final' },
  ];

  const getStatusIndex = (st: DeliveryStatus) => {
    return statusSteps.findIndex((s) => s.key === st);
  };

  // Aspect ratio class helper
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '3:4':
        return 'aspect-[3/4]';
      case '16:9':
        return 'aspect-[16/9]';
      case '9:16':
        return 'aspect-[9/16]';
      case '1:1':
        return 'aspect-square';
      case '4:3':
        return 'aspect-[4/3]';
      default:
        return 'aspect-[4/3]';
    }
  };

  return (
    <div className="py-10 sm:py-16 bg-[#E2E2E0] min-h-[90vh] relative text-[#0E2931]">
      {/* Floating Interactive Toast for Immediate Feedback */}
      {toastNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-[#0E2931]/95 backdrop-blur-md border border-[#2B7574] shadow-2xl rounded-2xl p-4 text-xs animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            {toastNotification.type === 'loading' ? (
              <div className="p-2.5 rounded-xl bg-[#2B7574]/20 text-[#2B7574] border border-[#2B7574]/40 shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-[#2B7574]" />
              </div>
            ) : toastNotification.type === 'success' ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[#2B7574]/20 text-[#2B7574] border border-[#2B7574]/30 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-[#E2E2E0] text-xs tracking-wide">
                  {toastNotification.title}
                </h4>
                {toastNotification.type === 'loading' && (
                  <span className="text-[10px] font-mono-data text-[#2B7574] font-bold shrink-0">
                    {downloadProgress}%
                  </span>
                )}
              </div>
              <p className="text-zinc-300 text-[11px] mt-0.5 leading-relaxed">
                {toastNotification.message}
              </p>

              {toastNotification.type === 'loading' && (
                <div className="mt-2.5 w-full bg-[#070e11] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#2B7574] to-[#3b9493] h-full transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setToastNotification(null)}
              className="text-zinc-400 hover:text-white text-xs p-1 -mr-1 transition-colors"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner of High Importance */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0E2931] via-[#102d35] to-[#070e11] border border-[#2B7574]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#2B7574]/20 border border-[#2B7574]/40 text-[#2B7574] shrink-0">
              <FolderLock className="w-5 h-5 text-[#E2E2E0]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono-data tracking-widest text-[#2B7574] font-semibold block">
                SUITE DE ENTREGA PRIVADA DE ARCHIVOS
              </span>
              <h1 className="text-base sm:text-lg font-bold text-[#E2E2E0] tracking-tight">
                Descarga de Archivos Originales Master & Modo Selección
              </h1>
            </div>
          </div>

          {/* Privacy Security Status & Lock Out Button */}
          <div className="flex items-center gap-3">
            {currentGallery ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E2931] border border-[#2B7574]/40 text-xs font-mono-data text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Sesión segura: {currentGallery.clientName}</span>
                </div>
                <button
                  onClick={() => {
                    setCurrentGallery(null);
                    setTokenInput('');
                    setPinInput('');
                    setPinError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0E2931] border border-[#2B7574]/50 hover:bg-[#2B7574]/20 text-xs text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                  title="Cerrar acceso a esta galería"
                >
                  <Lock className="w-3.5 h-3.5 text-[#2B7574]" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono-data text-zinc-300 bg-[#0E2931] px-3 py-1.5 rounded-lg border border-[#2B7574]/40">
                <Lock className="w-3.5 h-3.5 text-[#2B7574]" />
                <span>Acceso exclusivo protegido con cifrado</span>
              </div>
            )}
          </div>
        </div>

        {/* Success toast banner */}
        {downloadSuccessMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadSuccessMessage}</span>
            </div>
            <button
              onClick={() => setDownloadSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Gate screen: If PIN is required or token not found */}
        {!currentGallery ? (
          <div className="max-w-md mx-auto my-12 p-8 rounded-2xl bg-[#0E2931] border border-[#2B7574] shadow-2xl text-center space-y-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#070e11] border border-[#2B7574]/50 flex items-center justify-center text-[#2B7574]">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-[#E2E2E0] tracking-tight">
                Acceso a Galería Privada
              </h2>
              <p className="text-xs text-zinc-300 mt-2">
                Ingrese el código o enlace privado provisto por {config.studioName} para acceder a sus archivos en alta resolución.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-mono-data text-[#8cd2cf] mb-1 font-bold">
                  TOKEN DE ENLACE PRIVADO
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ej. valeria-haute-2026"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070e11] border border-[#2B7574]/50 text-white text-sm focus:outline-none focus:border-[#2B7574] font-mono-data"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#8cd2cf] mb-1 font-bold">
                  CÓDIGO PIN (SI APLICA)
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="PIN de 4 dígitos"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070e11] border border-[#2B7574]/50 text-white text-sm focus:outline-none focus:border-[#2B7574] font-mono-data"
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-400 font-medium">{pinError}</p>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0E2931]/80"
              >
                <KeyRound className="w-4 h-4" />
                <span>Desbloquear y Acceder</span>
              </button>
            </form>

            <div className="pt-4 border-t border-[#2B7574]/30 text-[11px] text-zinc-400 font-mono-data">
              ¿No tiene su clave? Contacte a {config.email}
            </div>
          </div>
        ) : (
          /* Active Client Gallery View */
          <div className="space-y-8">
            {/* Gallery Header Card */}
            <div className="relative rounded-2xl overflow-hidden bg-[#0E2931] border border-[#2B7574] shadow-2xl">
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col lg:flex-row justify-between gap-8 items-start lg:items-center">
                <div className="space-y-3 max-w-2xl">
                  {/* Zero-Pill unboxed metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono-data text-zinc-400">
                    <span className="text-[#2B7574] font-semibold">{currentGallery.clientName}</span>
                    <span aria-hidden="true">·</span>
                    <span>Fecha Evento: {currentGallery.eventDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>Vence: {currentGallery.expiryDate}</span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#E2E2E0] tracking-tight">
                    {currentGallery.title}
                  </h2>

                  <p className="text-sm text-zinc-300 font-light">
                    {currentGallery.subtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono-data text-zinc-400 pt-1">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Camera className="w-3.5 h-3.5 text-[#2B7574]" />
                      {currentGallery.files.length} Archivos Master
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      {currentGallery.totalDownloads} Descargas realizadas
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Heart className="w-3.5 h-3.5 text-[#2B7574]" />
                      {currentGallery.selectedFileIds.length} Favoritas
                    </span>
                    {currentGallery.driveFolderName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1.5 text-cyan-300 bg-[#070e11] border border-[#2B7574]/50 px-2 py-0.5 rounded-lg text-[11px]">
                          <FolderSync className="w-3 h-3 text-[#2B7574] shrink-0" />
                          <span>Google Drive Cloud: {currentGallery.driveFolderName}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Primary Gallery Actions (Full download & selection toggle) */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
                  {/* 1-Click Complete Folder Download */}
                  <button
                    onClick={handleDownloadFullFolder}
                    disabled={isDownloadingAll}
                    className={`relative overflow-hidden px-5 py-3 text-xs sm:text-sm font-semibold text-[#E2E2E0] rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg ${
                      isDownloadingAll
                        ? 'bg-[#2B7574]/80 cursor-wait shadow-[#0E2931] ring-1 ring-[#2B7574]'
                        : 'bg-[#2B7574] hover:bg-[#3b9493] shadow-lg shadow-[#0E2931]/60 active:scale-[0.99]'
                    }`}
                  >
                    {isDownloadingAll ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />
                        <span className="font-medium">
                          Descargando archivos originales ({downloadProgress}%)...
                        </span>
                        {/* Shimmer loading progress bar along button bottom */}
                        <span
                          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-[#2B7574] to-white transition-all duration-300 ease-out"
                          style={{ width: `${downloadProgress}%` }}
                        />
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                        <span>Descargar Todos los Archivos Originales (1-Click)</span>
                      </>
                    )}
                  </button>

                  <div className="flex gap-2">
                    {/* Toggle Selection Mode */}
                    <button
                      onClick={() => setIsSelectionMode(!isSelectionMode)}
                      className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        isSelectionMode
                          ? 'bg-[#2B7574]/30 text-[#E2E2E0] border-[#2B7574] shadow-sm'
                          : 'bg-[#070e11] text-zinc-300 border-[#2B7574]/40 hover:border-[#2B7574]'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSelectionMode ? 'fill-[#2B7574] text-[#2B7574]' : ''}`} />
                      <span>{isSelectionMode ? 'Salir de Modo Selección' : 'Modo Selección (Favoritas)'}</span>
                    </button>

                    {/* Copy Link */}
                    <button
                      onClick={copyPrivateLink}
                      className="px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#070e11] hover:bg-[#2B7574]/20 text-zinc-300 border border-[#2B7574]/40 transition-colors flex items-center gap-1.5"
                      title="Copiar enlace privado para compartir"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#2B7574]" />}
                      <span className="hidden sm:inline">{copiedLink ? 'Copiado' : 'Compartir'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Tracking Pipeline */}
              <div className="border-t border-[#2B7574]/30 bg-[#070e11]/80 px-6 py-4">
                <div className="text-[11px] font-mono-data text-zinc-400 mb-2 flex items-center justify-between">
                  <span>SEGUIMIENTO DE ESTADO EN TIEMPO REAL:</span>
                  <span className="text-[#2B7574] font-semibold uppercase">
                    Estado Actual: {currentGallery.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {statusSteps.map((step, idx) => {
                    const currentIdx = getStatusIndex(currentGallery.status);
                    const isPassed = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div
                        key={step.key}
                        className={`p-2.5 rounded-lg border transition-all ${
                          isCurrent
                            ? 'bg-[#2B7574]/20 border-[#2B7574] text-white'
                            : isPassed
                            ? 'bg-[#0E2931]/60 border-[#2B7574]/30 text-zinc-300'
                            : 'bg-black/30 border-zinc-900/60 text-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {isPassed ? (
                            <CheckCircle2 className={`w-3 h-3 ${isCurrent ? 'text-[#2B7574]' : 'text-emerald-400'}`} />
                          ) : (
                            <Clock className="w-3 h-3 text-zinc-600" />
                          )}
                          <span className="text-[11px] font-semibold tracking-tight">{step.label}</span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate">{step.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selection Mode Notice / Dock */}
            {isSelectionMode && (
              <div className="p-4 rounded-xl bg-[#0E2931] border border-[#2B7574] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#2B7574]/20 text-[#2B7574]">
                    <Heart className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#E2E2E0]">
                      Modo Selección Activo: {currentGallery.selectedFileIds.length} de {currentGallery.selectionLimit || 30} fotos seleccionadas
                    </h4>
                    <p className="text-[11px] text-zinc-300">
                      Haga clic en el corazón sobre cada foto para marcarla como favorita. Podrá descargarlas juntas o enviar sus notas de retoque.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadSelectedOnly}
                    disabled={currentGallery.selectedFileIds.length === 0}
                    className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-[#E2E2E0] bg-[#070e11] hover:bg-[#2B7574]/30 disabled:opacity-40 border border-[#2B7574]/50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#2B7574]" />
                    <span>Descargar Seleccionadas</span>
                  </button>

                  <button
                    onClick={() => setShowNotesModal(true)}
                    disabled={currentGallery.selectedFileIds.length === 0}
                    className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] disabled:opacity-40 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-[#0E2931]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar al Fotógrafo</span>
                  </button>
                </div>
              </div>
            )}

            {/* Media Files Grid */}
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
              {currentGallery.files.map((file) => {
                const isSelected = currentGallery.selectedFileIds.includes(file.id);

                return (
                  <div
                    key={file.id}
                    className={`break-inside-avoid mb-3 group relative rounded-xl overflow-hidden bg-[#0E2931] border transition-all duration-300 shadow-md hover:shadow-2xl ${
                      isSelected
                        ? 'border-[#2B7574] ring-2 ring-[#2B7574]/40'
                        : 'border-[#2B7574]/30 hover:border-[#2B7574]'
                    }`}
                  >
                    {/* Media Container with explicit aspect ratio */}
                    <div className={`w-full ${getAspectRatioClass(file.aspectRatio)} relative overflow-hidden bg-[#070e11]`}>
                      <img
                        src={file.previewUrl}
                        alt={file.title}
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-500 ease-out"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />

                      {/* Favorite / Select button in top-right corner */}
                      <div className="absolute top-2.5 right-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(file.id);
                          }}
                          className={`p-2 rounded-full backdrop-blur-md transition-all ${
                            isSelected
                              ? 'bg-[#2B7574] text-[#E2E2E0] shadow-lg shadow-[#0E2931] scale-105'
                              : 'bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80 border border-white/10 opacity-70 group-hover:opacity-100'
                          }`}
                          title={isSelected ? 'Quitar de favoritas' : 'Marcar como favorita'}
                        >
                          <Heart className={`w-4 h-4 ${isSelected ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Center Zoom / View overlay button on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <button
                          onClick={() => onOpenViewer(file, currentGallery.files)}
                          className="pointer-events-auto p-3 rounded-full bg-black/80 hover:bg-[#2B7574] text-white border border-white/20 backdrop-blur-md shadow-2xl transition-all hover:scale-105"
                          title="Abrir visor con zoom dinámico"
                        >
                          <Maximize2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Action Card Bar (Clean below the image) */}
                    <div className="p-3.5 bg-[#070e11] border-t border-[#2B7574]/25 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-display text-xs font-semibold text-[#E2E2E0] truncate" title={file.title}>
                          {file.title}
                        </h4>
                        <span className="text-[10px] font-mono-data text-zinc-400 shrink-0">
                          {file.fileSize}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2B7574]/15">
                        <span className="text-[10px] font-mono-data text-zinc-400">
                          {file.downloadsCount} descargas
                        </span>

                        <button
                          onClick={() => handleDownloadSingle(file)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#E2E2E0] bg-[#0E2931] hover:bg-[#2B7574] hover:border-[#2B7574] border border-[#2B7574]/40 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Descargar este archivo en máxima resolución original"
                        >
                          <Download className="w-3 h-3 text-[#2B7574]" />
                          <span>Descargar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Client Notes / Retouch Section Preview if already sent */}
            {currentGallery.clientNotes && (
              <div className="p-6 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-2">
                <span className="text-xs font-mono-data uppercase text-[#2B7574] font-semibold">
                  Notas de Retoque e Instrucciones Enviadas:
                </span>
                <p className="text-sm text-zinc-300 leading-relaxed font-light italic">
                  "{currentGallery.clientNotes}"
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Client Submit Selection & Notes */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E2931] border border-[#2B7574] rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#E2E2E0]">
                Confirmar Selección al Fotógrafo
              </h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300">
              Ha seleccionado{' '}
              <strong className="text-[#2B7574] font-mono-data">
                {currentGallery?.selectedFileIds.length} archivos
              </strong>
              . Escriba aquí cualquier solicitud especial, ajustes de encuadre, color o retoque específico para cada foto.
            </p>

            <textarea
              rows={4}
              value={clientNotesText}
              onChange={(e) => setClientNotesText(e.target.value)}
              placeholder="Ej. En la foto 2 por favor aumentar ligeramente el contraste de la piel. En la foto 4 ajustar el balance de blancos..."
              className="w-full p-3 rounded-xl bg-[#070e11] border border-[#2B7574]/50 text-white text-xs focus:outline-none focus:border-[#2B7574] leading-relaxed"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitSelectionToPhotographer}
                className="px-5 py-2.5 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-[#0E2931]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar y Enviar Selección</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
