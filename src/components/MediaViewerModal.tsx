import React, { useState, useEffect, useRef } from 'react';
import { PortfolioItem, ClientFile } from '../types';
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Info,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Camera,
  Film,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Lock,
} from 'lucide-react';

interface MediaViewerModalProps {
  item: PortfolioItem | ClientFile;
  itemsList?: (PortfolioItem | ClientFile)[];
  allowDownload?: boolean; // Strictly true only in private client rooms
  onClose: () => void;
  onNavigate?: (newItem: PortfolioItem | ClientFile) => void;
  onDownload?: (item: PortfolioItem | ClientFile) => void;
}

export const MediaViewerModal: React.FC<MediaViewerModalProps> = ({
  item,
  itemsList = [],
  allowDownload,
  onClose,
  onNavigate,
  onDownload,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 1.5, 2, 3
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showExifDrawer, setShowExifDrawer] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Touch gesture state refs for pinch-to-zoom and swipe-to-navigate
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchDistRef = useRef<number | null>(null);
  const pinchZoomStartRef = useRef<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isVideo = ('type' in item && item.type === 'video') || ('mediaType' in item && item.mediaType === 'video');
  const videoSrc = 'videoSrc' in item ? item.videoSrc : undefined;
  const originalUrl = ('originalUrl' in item && item.originalUrl)
    ? item.originalUrl
    : ('previewUrl' in item ? item.previewUrl : ('url' in item ? (item as any).url : ''));
  const title = item.title;
  const exif = 'exif' in item ? item.exif : undefined;
  const colors = 'colors' in item ? item.colors : undefined;
  const description = 'description' in item ? item.description : undefined;

  // Strict check: only allow downloads if explicitly allowed (private client room) or is a client file
  const isClientFile = 'fileSize' in item || 'downloadsCount' in item;
  const canDownload = allowDownload !== undefined ? allowDownload : isClientFile;

  // Reset zoom & pan when item changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsPlaying(true);
  }, [item.id]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && onNavigate && itemsList.length > 1) {
        const currentIndex = itemsList.findIndex((i) => i.id === item.id);
        const nextItem = itemsList[(currentIndex + 1) % itemsList.length];
        onNavigate(nextItem);
      } else if (e.key === 'ArrowLeft' && onNavigate && itemsList.length > 1) {
        const currentIndex = itemsList.findIndex((i) => i.id === item.id);
        const prevItem = itemsList[(currentIndex - 1 + itemsList.length) % itemsList.length];
        onNavigate(prevItem);
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key.toLowerCase() === 'z' && !isVideo) {
        setZoomLevel((prev) => (prev === 1 ? 2 : 1));
        setPanPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, itemsList, isVideo, onClose, onNavigate]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Mouse pan handlers for zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch gesture handlers (Pinch-to-Zoom & Swipe-to-Navigate)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && !isVideo) {
      // 2-finger pinch initiate
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchDistRef.current = dist;
      pinchZoomStartRef.current = zoomLevel;
    } else if (e.touches.length === 1) {
      // 1-finger start
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      if (zoomLevel > 1) {
        setIsDragging(true);
        setDragStart({ x: touch.clientX - panPosition.x, y: touch.clientY - panPosition.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && !isVideo && pinchDistRef.current !== null) {
      // Pinching
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scaleFactor = currentDist / pinchDistRef.current;
      const newZoom = Math.min(Math.max(pinchZoomStartRef.current * scaleFactor, 1), 3.5);
      setZoomLevel(newZoom);
      if (newZoom === 1) {
        setPanPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && zoomLevel > 1 && isDragging) {
      // Panning when zoomed in
      const touch = e.touches[0];
      setPanPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    pinchDistRef.current = null;
    setIsDragging(false);

    // If 1-finger swipe on normal zoom (zoomLevel === 1)
    if (touchStartRef.current && zoomLevel <= 1 && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsedTime = Date.now() - touchStartRef.current.time;

      // Horizontal swipe navigation (Swipe Left -> Next, Swipe Right -> Prev)
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && elapsedTime < 500) {
        if (deltaX < 0 && onNavigate && itemsList.length > 1) {
          const currentIndex = itemsList.findIndex((i) => i.id === item.id);
          const nextItem = itemsList[(currentIndex + 1) % itemsList.length];
          onNavigate(nextItem);
        } else if (deltaX > 0 && onNavigate && itemsList.length > 1) {
          const currentIndex = itemsList.findIndex((i) => i.id === item.id);
          const prevItem = itemsList[(currentIndex - 1 + itemsList.length) % itemsList.length];
          onNavigate(prevItem);
        }
      }

      // Vertical swipe down to close modal
      if (deltaY > 100 && Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && elapsedTime < 400) {
        onClose();
      }
    }
    touchStartRef.current = null;
  };

  const handleDownload = () => {
    if (!canDownload) return;

    if (onDownload) {
      onDownload(item);
    } else {
      // Trigger file download only for permitted clients
      const link = document.createElement('a');
      link.href = isVideo && videoSrc ? videoSrc : originalUrl;
      link.download = `${title.replace(/\s+/g, '_')}_ORIGINAL_MASTER`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Navigation indices
  const currentIndex = itemsList.findIndex((i) => i.id === item.id);
  const hasPrev = itemsList.length > 1;
  const hasNext = itemsList.length > 1;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-50 bg-[#060608]/98 backdrop-blur-2xl flex flex-col animate-in fade-in duration-200 select-none"
    >
      {/* Top Bar Controls */}
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-[#1c1c20] bg-[#0c0c0e]/80">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            {isVideo ? (
              <Film className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Camera className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <h2 className="text-sm font-semibold text-white tracking-wide truncate max-w-xs sm:max-w-md">
              {title}
            </h2>
          </div>
          <span className="hidden sm:inline text-xs text-zinc-500 font-mono-data">
            · {item.aspectRatio}
          </span>
          <span className="text-[11px] font-mono-data text-emerald-400/90 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            Master 100% Calidad Original
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom controls for images */}
          {!isVideo && (
            <div className="hidden sm:flex items-center gap-1 bg-[#161619] border border-[#27272a] rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 rounded transition-colors"
                title="Reducir zoom (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono-data text-zinc-300 px-1.5 min-w-[42px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3.5}
                className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 rounded transition-colors"
                title="Ampliar zoom (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={handleResetZoom}
                  className="p-1.5 text-zinc-400 hover:text-white rounded transition-colors"
                  title="Ajustar a pantalla (0)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Toggle Exif Info */}
          {(exif || description) && (
            <button
              onClick={() => setShowExifDrawer(!showExifDrawer)}
              className={`p-2 rounded-lg border transition-colors ${
                showExifDrawer
                  ? 'bg-zinc-800 text-white border-zinc-600'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
              title="Información técnica EXIF"
            >
              <Info className="w-4 h-4" />
            </button>
          )}

          {/* Download Original File: EXCLUSIVELY FOR PRIVATE CLIENT ROOMS */}
          {canDownload ? (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-lg transition-colors shadow-lg shadow-[#0E2931]/60"
              title="Descargar archivo original sin compresión (Sala Privada de Cliente)"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar Original</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 bg-zinc-900/90 border border-zinc-800 rounded-lg"
              title="Descargas reservadas exclusivamente a salas privadas de clientes"
            >
              <Lock className="w-3.5 h-3.5 text-[#2B7574] shrink-0" />
              <span className="hidden sm:inline text-[11px] font-mono-data">Sala Privada</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors ml-1"
            title="Cerrar visor (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Visual Display Area with Touch Gestures */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Navigation arrow Left */}
        {hasPrev && onNavigate && (
          <button
            onClick={() => {
              const prev = itemsList[(currentIndex - 1 + itemsList.length) % itemsList.length];
              onNavigate(prev);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all group"
            title="Anterior (←)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Navigation arrow Right */}
        {hasNext && onNavigate && (
          <button
            onClick={() => {
              const next = itemsList[(currentIndex + 1) % itemsList.length];
              onNavigate(next);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all group"
            title="Siguiente (→)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Central Viewport with Mouse and Touch Event Listeners */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none touch-none ${
            zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
        >
          {isVideo && videoSrc ? (
            <div className="relative max-h-full max-w-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={videoSrc}
                poster={originalUrl}
                playsInline
                autoPlay
                loop
                muted={isMuted}
                className="max-h-[78vh] max-w-[85vw] rounded-xl object-contain shadow-2xl border border-zinc-800"
              />

              {/* Floating video control overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center gap-4 text-white">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                        setIsPlaying(true);
                      } else {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      }
                    }
                  }}
                  className="hover:text-[#2B7574] transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="hover:text-[#2B7574] transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <span className="text-[11px] font-mono-data text-zinc-300">
                  VIDEO 4K
                </span>
              </div>
            </div>
          ) : (
            <div
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                transformOrigin: 'center center',
              }}
              className="relative max-h-full max-w-full flex items-center justify-center"
            >
              <img
                src={originalUrl}
                alt={title}
                className="max-h-[82vh] max-w-[85vw] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* EXIF & Details Drawer (Collapsible Right Side) */}
        {showExifDrawer && (
          <aside className="w-80 border-l border-[#1c1c20] bg-[#0d0d10] p-5 flex flex-col justify-between overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono-data">
                  Metadatos de la Obra
                </span>
                <h3 className="font-display text-lg font-bold text-white mt-1 leading-snug">
                  {title}
                </h3>
                {description && (
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-light">
                    {description}
                  </p>
                )}
              </div>

              {/* Technical EXIF Sheet */}
              {exif && (
                <div className="space-y-3 pt-3 border-t border-[#1c1c20]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <Camera className="w-3.5 h-3.5 text-[#2B7574]" />
                    <span>Especificaciones Técnicas</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono-data">
                    <div className="bg-[#141417] p-2 rounded-lg border border-[#222227]">
                      <span className="block text-[10px] text-zinc-500">CÁMARA</span>
                      <span className="text-zinc-200 font-medium truncate block">{exif.camera}</span>
                    </div>

                    <div className="bg-[#141417] p-2 rounded-lg border border-[#222227]">
                      <span className="block text-[10px] text-zinc-500">ÓPTICA</span>
                      <span className="text-zinc-200 font-medium truncate block">{exif.lens}</span>
                    </div>

                    <div className="bg-[#141417] p-2 rounded-lg border border-[#222227]">
                      <span className="block text-[10px] text-zinc-500">APERTURA</span>
                      <span className="text-zinc-200 font-medium">{exif.aperture}</span>
                    </div>

                    <div className="bg-[#141417] p-2 rounded-lg border border-[#222227]">
                      <span className="block text-[10px] text-zinc-500">VELOCIDAD</span>
                      <span className="text-zinc-200 font-medium">{exif.shutter}</span>
                    </div>

                    <div className="bg-[#141417] p-2 rounded-lg border border-[#222227]">
                      <span className="block text-[10px] text-zinc-500">SENSIBILIDAD</span>
                      <span className="text-zinc-200 font-medium">ISO {exif.iso}</span>
                    </div>

                    <div className="bg-[#141417] p-2 rounded-lg border border-[#222227]">
                      <span className="block text-[10px] text-zinc-500">DISTANCIA</span>
                      <span className="text-zinc-200 font-medium">{exif.focalLength}</span>
                    </div>
                  </div>

                  <div className="bg-[#141417] p-2.5 rounded-lg border border-[#222227] text-xs font-mono-data">
                    <span className="block text-[10px] text-zinc-500">RESOLUCIÓN NATIVA</span>
                    <span className="text-emerald-400 font-semibold">{exif.resolution}</span>
                  </div>
                </div>
              )}

              {/* Color Palette Palette Extraction */}
              {colors && colors.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-[#1c1c20]">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono-data">
                    Paleta Cromática Extraída
                  </span>
                  <div className="flex gap-2">
                    {colors.map((c, i) => (
                      <div key={i} className="flex-1 group relative">
                        <div
                          className="h-8 rounded-md border border-white/10 shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: c }}
                        />
                        <span className="text-[9px] font-mono-data text-zinc-400 block text-center mt-1">
                          {c}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Tips */}
            <div className="pt-4 border-t border-[#1c1c20] text-[11px] text-zinc-400 space-y-1 font-mono-data">
              <p>· Tecla 'Z' para zoom 200%</p>
              <p>· Arrastra para explorar detalles</p>
              <p>· Flechas ← → para navegar</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
