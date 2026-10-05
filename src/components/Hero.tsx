import React from 'react';
import { StudioConfig } from '../types';
import { ArrowDown, FolderLock, Sparkles, Film, Camera, ShieldCheck } from 'lucide-react';

interface HeroProps {
  config: StudioConfig;
  onExplorePortfolio: () => void;
  onOpenClientPortal: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  config,
  onExplorePortfolio,
  onOpenClientPortal,
}) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 border-b border-[#2B7574]/25">
      {/* Background subtle radial illumination */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#2B7574]/20 via-[#0E2931]/40 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Bold Typographic Split */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs text-[#0E2931]/70 font-mono-data">
              <span className="text-[#2B7574] font-bold uppercase tracking-wider">Fotografía & Video</span>
              <span aria-hidden="true">·</span>
              <span>{config.location}</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0E2931] text-balance leading-[1.08]">
              Luz natural, textura analógica y precisión visual.
            </h1>

            <p className="text-base sm:text-lg text-[#0E2931]/80 max-w-2xl font-light leading-relaxed">
              {config.bio}
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onExplorePortfolio}
                className="px-6 py-3.5 text-sm font-semibold text-[#0E2931] bg-white hover:bg-[#2B7574]/10 border border-[#2B7574]/40 rounded-xl transition-all duration-200 flex items-center gap-2 group hover:border-[#2B7574] shadow-xs"
              >
                <span>Explorar Galería & Obras</span>
                <ArrowDown className="w-4 h-4 text-[#2B7574] group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={onOpenClientPortal}
                className="px-6 py-3.5 text-sm font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#225e5d] border border-[#2B7574] rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md shadow-[#2B7574]/30"
              >
                <FolderLock className="w-4 h-4 text-[#E2E2E0]" />
                <span>Acceso Clientes Privado</span>
              </button>
            </div>

            {/* Quiet guarantee notes */}
            <div className="flex items-center gap-4 text-xs text-[#0E2931]/70 pt-1 font-mono-data">
              <span className="flex items-center gap-1.5 text-[#0E2931]/90">
                <ShieldCheck className="w-4 h-4 text-[#2B7574]" />
                Descargas 100% Calidad Original
              </span>
              <span aria-hidden="true">·</span>
              <span>Protección con PIN</span>
              <span aria-hidden="true">·</span>
              <span>Seguimiento de Estado</span>
            </div>
          </div>

          {/* Right Column: Editorial Hero Visual Anchor */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-[#2B7574]/40 shadow-2xl bg-[#0E2931] group">
              <img
                src={config.heroImage || "/src/assets/images/hero_photographer_cinematic_1790312865168.jpg"}
                alt="Mateo Valenzuela en estudio con cámara Leica y ópticas de autor"
                className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Elegant Editorial Marquee Ribbon */}
      <div className="mt-16 w-full overflow-hidden border-y border-[#2B7574]/25 bg-[#0E2931]/70 py-3 select-none backdrop-blur-sm">
        <div className="flex whitespace-nowrap animate-marquee">
          <div className="flex items-center gap-8 text-xs font-mono-data uppercase tracking-widest text-[#E2E2E0]/80">
            <span>BODAS DE AUTOR & EMOTIVAS</span>
            <span className="text-[#2B7574]">◆</span>
            <span>GASTRONOMÍA & TEXTURAS CULINARIAS</span>
            <span className="text-[#2B7574]">◆</span>
            <span>ARQUITECTURA & ESPACIOS CONTEMPLATIVOS</span>
            <span className="text-[#2B7574]">◆</span>
            <span>RETRATOS CON CARÁCTER & LUZ NATURAL</span>
            <span className="text-[#2B7574]">◆</span>
            <span>ENTREGA PRIVADA CON SEGUIMIENTO DE ESTADO</span>
            <span className="text-[#2B7574]">◆</span>
            <span>DESCARGAS MASTER ORIGINALES AL 100%</span>
            <span className="text-[#2B7574]">◆</span>
            <span>BODAS DE AUTOR & EMOTIVAS</span>
            <span className="text-[#2B7574]">◆</span>
            <span>GASTRONOMÍA & TEXTURAS CULINARIAS</span>
            <span className="text-[#2B7574]">◆</span>
            <span>ARQUITECTURA & ESPACIOS CONTEMPLATIVOS</span>
            <span className="text-[#2B7574]">◆</span>
          </div>
        </div>
      </div>
    </section>
  );
};
