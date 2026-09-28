import React from 'react';
import { StudioCategory, PortfolioItem } from '../types';
import { Sparkles, ArrowRight, Layers, Camera } from 'lucide-react';

interface CoreCategoriesSectionProps {
  categories: StudioCategory[];
  items: PortfolioItem[];
  onSelectCategory: (categoryId: string) => void;
}

export const CoreCategoriesSection: React.FC<CoreCategoriesSectionProps> = ({
  categories,
  items,
  onSelectCategory,
}) => {
  // Filter only the 4 core categories
  const coreCategories = categories
    .filter((cat) => cat.isCore)
    .sort((a, b) => a.order - b.order)
    .slice(0, 4);

  const getCountForCategory = (catId: string) => {
    return items.filter((item) => item.category === catId).length;
  };

  return (
    <section id="core-categories" className="py-16 sm:py-24 border-b border-[#2B7574]/25 relative bg-[#E2E2E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-[#0E2931]/70 mb-2">
              <span className="text-[#2B7574] font-bold uppercase">ESPECIALIDADES PRINCIPALES</span>
              <span aria-hidden="true">·</span>
              <span>4 PILARES VISUALES</span>
              <span aria-hidden="true">·</span>
              <span>CULIACÁN & SINALOA</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0E2931] tracking-tight">
              Nuestras 4 Categorías Fuertes
            </h2>
            <p className="text-sm text-[#0E2931]/80 mt-2 max-w-2xl font-light leading-relaxed">
              Especialización fotográfica de autor con equipo de formato medio y ópticas de apertura extrema. Seleccione una especialidad para explorar sus obras dedicadas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono-data text-[#0E2931] bg-white border border-[#2B7574]/30 px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-[#2B7574]" />
              <span className="font-semibold">{coreCategories.length} Especialidades Principales</span>
            </span>
          </div>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {coreCategories.map((cat, index) => {
            const count = getCountForCategory(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden bg-white border border-[#2B7574]/30 hover:border-[#2B7574] transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:scale-[1.01]"
              >
                {/* Visual Cover Header */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0E2931]">
                  {cat.coverImage ? (
                    <img
                      src={cat.coverImage}
                      alt={cat.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0E2931] text-zinc-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}

                  {/* Top Badge Overlay */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-mono-data uppercase tracking-wider px-2 py-0.5 rounded bg-[#0E2931]/90 backdrop-blur-md text-[#E2E2E0] border border-[#2B7574]/60 font-semibold">
                      0{index + 1} · Pilar Fuerte
                    </span>
                  </div>

                  {/* Photo count pill */}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[11px] font-mono-data bg-black/80 backdrop-blur-md text-[#E2E2E0] px-2.5 py-0.5 rounded-full border border-[#2B7574]/40">
                      {count} {count === 1 ? 'obra' : 'obras'}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#0E2931] group-hover:text-[#2B7574] transition-colors">
                      {cat.label}
                    </h3>
                    <p className="text-xs text-[#0E2931]/75 mt-1.5 leading-relaxed font-light line-clamp-3">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#2B7574]/20 flex items-center justify-between text-xs font-semibold text-[#2B7574] group-hover:text-[#0E2931] transition-colors">
                    <span>Ver Galería Filtrada</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
