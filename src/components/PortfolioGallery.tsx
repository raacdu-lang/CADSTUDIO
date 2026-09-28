import React, { useState, useRef, useEffect } from 'react';
import { PortfolioItem, AspectRatio, StudioCategory } from '../types';
import { Play, Maximize2, Camera, Film, Lock, ArrowRight } from 'lucide-react';

interface PortfolioGalleryProps {
  items: PortfolioItem[];
  categories?: StudioCategory[];
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
  onSelectItem: (item: PortfolioItem) => void;
  onOpenFullPortfolio?: () => void;
}

interface PortfolioCardProps {
  item: PortfolioItem;
  onSelectItem: (item: PortfolioItem) => void;
  getAspectRatioClass: (ratio: AspectRatio) => string;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({
  item,
  onSelectItem,
  getAspectRatioClass,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    // If browser doesn't support IntersectionObserver, fall back to immediate load
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '250px 0px', // Preload when item is 250px away from viewport
        threshold: 0.01,
      }
    );

    const el = cardRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const isVideo = item.mediaType === 'video';

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelectItem(item)}
      onContextMenu={(e) => e.preventDefault()}
      className="break-inside-avoid mb-2.5 sm:mb-3 group relative cursor-pointer rounded-xl overflow-hidden bg-[#111114] border border-[#242429] hover:border-zinc-400 transition-all duration-300 shadow-md hover:shadow-2xl select-none"
    >
      {/* Media Container with explicit aspect ratio */}
      <div className={`w-full ${getAspectRatioClass(item.aspectRatio)} relative overflow-hidden bg-[#0c0c0e]`}>
        {/* Placeholder skeleton while not yet intersecting or while loading */}
        {(!isVisible || !isLoaded) && (
          <div className="absolute inset-0 bg-[#121215] flex items-center justify-center animate-pulse">
            <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-600">
              <Camera className="w-4 h-4 text-zinc-500" />
            </div>
          </div>
        )}

        {/* Media rendered when triggered by IntersectionObserver */}
        {isVisible && (
          <>
            {isVideo && item.videoSrc && isHovered ? (
              <video
                src={item.videoSrc}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover transition-opacity duration-300 pointer-events-none"
              />
            ) : (
              <img
                src={item.url}
                alt={item.title}
                draggable={false}
                onLoad={() => setIsLoaded(true)}
                className={`w-full h-full object-cover object-center group-hover:scale-104 transition-all duration-500 ease-out pointer-events-none ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            )}
          </>
        )}

        {/* Center Action Overlay Icon on Hover (minimal subtle indicator) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="p-3 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            {isVideo ? (
              <Play className="w-5 h-5 fill-current text-white translate-x-0.5" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({
  items,
  categories = [],
  selectedCategory: externalSelectedCategory,
  onSelectCategory: externalOnSelectCategory,
  onSelectItem,
  onOpenFullPortfolio,
}) => {
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const activeCategory = externalSelectedCategory !== undefined ? externalSelectedCategory : internalCategory;

  const handleCategoryChange = (catId: string) => {
    if (externalOnSelectCategory) {
      externalOnSelectCategory(catId);
    } else {
      setInternalCategory(catId);
    }
  };

  // Build filter list from provided categories or default 4 core categories
  const filterTabs = [
    { id: 'all', label: 'Todas las Obras' },
    ...categories.map((c) => ({ id: c.id, label: c.label })),
  ];

  const filteredItems = activeCategory === 'all'
    ? items
    : items.filter((item) => item.category === activeCategory);

  // Helper for aspect ratio class
  const getAspectRatioClass = (ratio: AspectRatio) => {
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
    <section id="portfolio" className="py-16 sm:py-24 border-b border-[#2B7574]/25 relative bg-[#E2E2E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-[#0E2931]/70 mb-2">
              <span className="text-[#2B7574] font-bold uppercase">OBRAS SELECCIONADAS</span>
              <span aria-hidden="true">·</span>
              <span>RESOLUCIÓN MASTER</span>
              <span aria-hidden="true">·</span>
              <span>CADSTUDIO CULIACÁN</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0E2931] tracking-tight">
              Portafolio de Autor
            </h2>
          </div>

          {/* Interactive Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#2B7574]/30 rounded-xl overflow-x-auto max-w-full touch-pan-x shadow-xs">
            {filterTabs.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                    : 'text-[#0E2931]/80 hover:text-[#0E2931] hover:bg-[#2B7574]/15'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tight Masonry Grid: Eliminates gaps between mixed 16:9, 9:16, 3:4 aspect ratios */}
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-2.5 sm:gap-3 [column-fill:_balance]">
          {filteredItems.map((item) => (
            <PortfolioCard
              key={item.id}
              item={item}
              onSelectItem={onSelectItem}
              getAspectRatioClass={getAspectRatioClass}
            />
          ))}
        </div>

        {/* Empty state safeguard */}
        {filteredItems.length === 0 && (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-sm">No se encontraron piezas en esta categoría.</p>
            <button
              onClick={() => handleCategoryChange('all')}
              className="mt-3 text-xs text-[#2B7574] hover:underline"
            >
              Ver todas las obras
            </button>
          </div>
        )}

        {/* Prominent button to open full portfolio page */}
        {onOpenFullPortfolio && (
          <div className="mt-14 text-center">
            <button
              onClick={onOpenFullPortfolio}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold text-sm transition-all duration-300 shadow-xl shadow-[#0E2931]/60 active:scale-98 group border border-[#2B7574]/40"
            >
              <span>Ir al Portafolio Completo</span>
              <ArrowRight className="w-4 h-4 text-[#E2E2E0] group-hover:translate-x-1.5 transition-transform" />
            </button>
            <p className="text-xs text-zinc-400 mt-2.5 font-mono-data">
              Ver galería ampliada por categorías con opción de gestionar fotos de portada
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
