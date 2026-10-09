import React from 'react';
import { PortfolioItem, StudioCategory, AspectRatio, StudioConfig } from '../types';
import { trackCategoryClick } from '../services/storageService';
import {
  ArrowLeft,
  Layers,
  Sparkles,
  Play,
  Film,
  ZoomIn,
} from 'lucide-react';

interface FullPortfolioPageProps {
  items: PortfolioItem[];
  categories: StudioCategory[];
  config: StudioConfig;
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onSelectItem: (item: PortfolioItem) => void;
  onBackToHome: () => void;
  onRefreshData?: () => void;
}

export const FullPortfolioPage: React.FC<FullPortfolioPageProps> = ({
  items,
  categories,
  config,
  selectedCategory,
  onSelectCategory,
  onSelectItem,
  onBackToHome,
}) => {
  // Filter items based on isFeatured (only public works appear, hidden works remain in admin)
  const publicItems = items.filter((item) => item.isFeatured !== false);
  const filteredItems = selectedCategory === 'all'
    ? publicItems
    : publicItems.filter((item) => item.category === selectedCategory);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  const getAspectRatioClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-[16/9]';
      case '9:16':
        return 'aspect-[9/16]';
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4]';
      case '1:1':
        return 'aspect-square';
      default:
        return 'aspect-[4/5]';
    }
  };

  return (
    <div className="min-h-screen bg-[#E2E2E0] text-[#0E2931] pb-24">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="border-b border-[#2B7574]/25 bg-[#E2E2E0]/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#0E2931] hover:text-[#2B7574] transition-colors py-1.5 px-3 rounded-lg hover:bg-[#2B7574]/15 border border-transparent hover:border-[#2B7574]/30"
          >
            <ArrowLeft className="w-4 h-4 text-[#2B7574]" />
            <span>Volver a la Página Principal</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono-data text-[#0E2931]/70 hidden sm:inline font-semibold">
              {filteredItems.length} {filteredItems.length === 1 ? 'obra mostrada' : 'obras mostradas'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono-data bg-[#2B7574] text-[#E2E2E0] font-semibold">
              {config.studioName} · ARCHIVO MASTER
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section of the Full Portfolio */}
      <div className="relative py-12 sm:py-16 overflow-hidden border-b border-[#2B7574]/20 bg-[#E2E2E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono-data text-[#2B7574] font-bold">
              <span>GALERÍA COMPLETA DE FOTOGRAFÍA</span>
              <span aria-hidden="true">·</span>
              <span>RESOLUCIÓN DE AUTOR</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#0E2931] tracking-tight">
              Portafolio & Archivo Visual
            </h1>

            <p className="text-sm sm:text-base text-[#0E2931]/80 font-light leading-relaxed">
              Explora nuestra producción completa por especialidades: coberturas de bodas de destino, fotografía gastronómica de autor, arquitectura y retratos editoriales.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* CATEGORY TABS (Prominent at Top as requested) */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-data uppercase tracking-wider text-[#0E2931]/70 font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#2B7574]" />
              <span>Pestañas de Categorías:</span>
            </span>
          </div>

          {/* Horizontal scrollable tab buttons */}
          <div className="flex items-center gap-2 p-1.5 bg-white border border-[#2B7574]/30 rounded-2xl overflow-x-auto shadow-xs touch-pan-x">
            {/* "Todas" Tab */}
            <button
              onClick={() => onSelectCategory('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                selectedCategory === 'all'
                  ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-bold scale-[1.01]'
                  : 'text-[#0E2931]/80 hover:text-[#0E2931] hover:bg-[#2B7574]/15'
              }`}
            >
              <span>Todas las Categorías</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-data ${
                selectedCategory === 'all' ? 'bg-[#0E2931] text-[#E2E2E0]' : 'bg-[#E2E2E0] text-[#0E2931]'
              }`}>
                {items.length}
              </span>
            </button>

            {/* Individual Category Tabs */}
            {categories.map((cat) => {
              const count = items.filter((i) => i.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    trackCategoryClick(cat.id, cat.label);
                    onSelectCategory(cat.id);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-bold scale-[1.01]'
                      : 'text-[#0E2931]/80 hover:text-[#0E2931] hover:bg-[#2B7574]/15'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-data ${
                    isSelected ? 'bg-[#0E2931] text-[#E2E2E0]' : 'bg-[#E2E2E0] text-[#0E2931]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Category Feature Card with Cover Photo */}
        {activeCategoryObj && (
          <div className="mb-10 p-6 rounded-2xl bg-white border border-[#2B7574]/30 shadow-md relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Category Info */}
              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono-data uppercase px-2.5 py-0.5 rounded-full bg-[#2B7574] text-[#E2E2E0] font-bold">
                    CATEGORÍA ACTIVA
                  </span>
                  <span className="text-xs font-mono-data text-[#0E2931]/70 font-semibold">
                    {filteredItems.length} obras en esta serie
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0E2931]">
                  {activeCategoryObj.label}
                </h2>

                <p className="text-xs sm:text-sm text-[#0E2931]/75 font-light leading-relaxed max-w-2xl">
                  {activeCategoryObj.description}
                </p>
              </div>

              {/* Category Cover Photo Preview */}
              <div className="md:col-span-4 relative group">
                <div className="relative overflow-hidden rounded-xl border border-[#2B7574]/50 shadow-2xl aspect-[16/10] bg-black">
                  <img
                    src={activeCategoryObj.coverImage}
                    alt={activeCategoryObj.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono-data text-zinc-300 px-2 py-0.5 rounded bg-black/60 backdrop-blur">
                    PORTADA DE CATEGORÍA
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* If 'all' is selected, show small preview strip of all category cards with click to filter */}
        {selectedCategory === 'all' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-data uppercase tracking-wider text-[#0E2931]/70 font-semibold">
                Especialidades de CADSTUDIO:
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => {
                    trackCategoryClick(cat.id, cat.label);
                    onSelectCategory(cat.id);
                  }}
                  className="group relative rounded-xl overflow-hidden border border-[#2B7574]/30 bg-[#0E2931] shadow-md transition-all hover:border-[#2B7574] cursor-pointer"
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-black">
                    <img
                      src={cat.coverImage}
                      alt={cat.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="font-display text-xs font-bold text-white block truncate">
                        {cat.label}
                      </span>
                      <span className="text-[10px] font-mono-data text-zinc-300">
                        {items.filter((i) => i.category === cat.id).length} obras
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PHOTO GALLERY: Masonry Columns */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2B7574]/20">
            <span className="text-xs font-mono-data text-zinc-400">
              OBRAS EN GALERÍA ({filteredItems.length}):
            </span>
            <span className="text-[11px] font-mono-data text-zinc-500">
              Haz clic en cualquier pieza para ampliar en alta definición
            </span>
          </div>

          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
            {filteredItems.map((item) => {
              const isVideo = item.mediaType === 'video';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="break-inside-avoid mb-3 group relative cursor-pointer rounded-xl overflow-hidden bg-[#0E2931] border border-[#2B7574]/40 hover:border-[#E2E2E0] transition-all duration-300 shadow-md hover:shadow-2xl select-none"
                >
                  <div className={`relative w-full overflow-hidden ${getAspectRatioClass(item.aspectRatio)} bg-black`}>
                    <img
                      src={item.url}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-data uppercase px-2 py-0.5 rounded bg-black/60 text-zinc-200 border border-white/10">
                          {item.aspectRatio}
                        </span>
                        <div className="p-1.5 rounded-lg bg-[#2B7574] text-white">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-display text-sm font-bold text-white leading-tight">
                          {item.title}
                        </h4>
                        {item.client && (
                          <p className="text-[11px] text-zinc-300 font-mono-data truncate">
                            {item.client}
                          </p>
                        )}
                        {item.exif && (
                          <p className="text-[10px] text-zinc-400 font-mono-data truncate">
                            {item.exif.lens || item.exif.camera || 'Leica / Hasselblad'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Video indicator */}
                    {isVideo && (
                      <div className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-black/60 backdrop-blur border border-white/20 text-white">
                        <Play className="w-3 h-3 fill-white" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="py-20 text-center rounded-2xl bg-[#0E2931]/30 border border-[#2B7574]/20 space-y-3">
              <p className="text-sm text-zinc-300 font-light">
                No hay fotografías registradas en esta categoría aún.
              </p>
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="px-4 py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] rounded-xl hover:bg-[#3b9493]"
              >
                Ver todas las categorías
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
