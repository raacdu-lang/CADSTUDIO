import React, { useState } from 'react';
import { PortfolioItem } from '../types';
import { Film, Play, Volume2, VolumeX, Maximize2, Sparkles } from 'lucide-react';

interface CinemaSectionProps {
  cinemaItems: PortfolioItem[];
  onSelectItem: (item: PortfolioItem) => void;
}

export const CinemaSection: React.FC<CinemaSectionProps> = ({
  cinemaItems,
  onSelectItem,
}) => {
  const [activeVideo, setActiveVideo] = useState<string | null>(cinemaItems[0]?.id || null);

  return (
    <section id="cinema" className="py-16 sm:py-24 border-b border-[#2B7574]/25 bg-[#E2E2E0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-[#0E2931]/70 mb-2">
              <Film className="w-3.5 h-3.5 text-[#2B7574]" />
              <span className="font-bold text-[#2B7574]">CINE, MOTION & PIEZAS AUDIOVISUALES</span>
              <span aria-hidden="true">·</span>
              <span>4K CINE RAW</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0E2931] tracking-tight">
              Cinematografía & Producción Audiovisual
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[#0E2931]/80 max-w-md font-light leading-relaxed">
            Desde piezas anamórficas panorámicas 16:9 hasta campañas verticales 9:16 para redes de alto impacto, combinamos textura cinematográfica y etalonaje en DaVinci Resolve.
          </p>
        </div>

        {/* Video Feature Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main 16:9 Cinema Feature */}
          <div className="lg:col-span-8">
            <div
              onClick={() => {
                const item = cinemaItems.find((i) => i.aspectRatio === '16:9') || cinemaItems[0];
                if (item) onSelectItem(item);
              }}
              className="group relative aspect-video rounded-2xl overflow-hidden bg-black border border-[#2B7574]/40 shadow-2xl cursor-pointer"
            >
              <img
                src="/src/assets/images/hero_photographer_cinematic_1790312865168.jpg"
                alt="Cinematografía de autor"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-4 rounded-full bg-[#2B7574] text-[#E2E2E0] shadow-2xl backdrop-blur-md group-hover:scale-110 group-hover:bg-[#3b9493] transition-transform">
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </div>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-[11px] font-mono-data text-[#2B7574] block mb-1 font-bold">
                  16:9 CINEMATIC MASTER · 4K 10-BIT
                </span>
                <h3 className="font-display text-xl font-bold text-[#E2E2E0]">
                  Atmósferas en Claroscuro & Luz Natural
                </h3>
                <p className="text-xs text-zinc-300 mt-1">
                  Grabado con Sony FX6 y ópticas fijas de apertura f/1.2
                </p>
              </div>
            </div>
          </div>

          {/* Vertical Reel 9:16 Feature */}
          <div className="lg:col-span-4">
            <div
              onClick={() => {
                const item = cinemaItems.find((i) => i.aspectRatio === '9:16') || cinemaItems[0];
                if (item) onSelectItem(item);
              }}
              className="group relative aspect-[9/16] max-h-[500px] mx-auto rounded-2xl overflow-hidden bg-black border border-[#2B7574]/40 shadow-2xl cursor-pointer"
            >
              <img
                src="/src/assets/images/fashion_reel_vertical_1790312908204.jpg"
                alt="Reel vertical editorial 9:16"
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Reel Badge */}
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#0E2931]/80 backdrop-blur-md border border-[#2B7574]/60 text-[10px] font-mono-data text-[#E2E2E0]">
                REEL VERTICAL 9:16
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-3.5 rounded-full bg-[#0E2931]/80 text-[#E2E2E0] border border-[#2B7574]/60 backdrop-blur-md group-hover:scale-110 group-hover:bg-[#2B7574] transition-all">
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] font-mono-data text-zinc-300 block">
                  ALEXA MINI LF · COOKE ANAMORPHIC
                </span>
                <h4 className="font-display text-sm font-bold mt-0.5 text-[#E2E2E0]">
                  Colonnade Motion — Alta Costura en Movimiento
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
