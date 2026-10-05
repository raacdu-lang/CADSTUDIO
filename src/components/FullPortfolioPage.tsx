import React, { useState } from 'react';
import { PortfolioItem, StudioCategory, AspectRatio, StudioConfig } from '../types';
import { updateStudioCategoryPhoto, trackCategoryClick } from '../services/storageService';
import {
  ArrowLeft,
  Camera,
  Layers,
  Sparkles,
  Edit2,
  Check,
  X,
  Upload,
  Image as ImageIcon,
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
  onRefreshData,
}) => {
  // Modal state to change category cover photo
  const [editingCategory, setEditingCategory] = useState<StudioCategory | null>(null);
  const [newCoverUrl, setNewCoverUrl] = useState<string>('');
  const [changeSuccessMsg, setChangeSuccessMsg] = useState<string | null>(null);

  // Filter items based on isFeatured (only public works appear, hidden works remain in admin)
  const publicItems = items.filter((item) => item.isFeatured !== false);
  const filteredItems = selectedCategory === 'all'
    ? publicItems
    : publicItems.filter((item) => item.category === selectedCategory);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  // Handle changing category cover photo
  const handleOpenEditPhotoModal = (category: StudioCategory) => {
    setEditingCategory(category);
    setNewCoverUrl(category.coverImage || '');
    setChangeSuccessMsg(null);
  };

  const handleSaveCoverPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !newCoverUrl.trim()) return;

    updateStudioCategoryPhoto(editingCategory.id, newCoverUrl.trim());
    setChangeSuccessMsg(`¡Foto de portada de "${editingCategory.label}" actualizada con éxito!`);

    if (onRefreshData) {
      onRefreshData();
    }

    setTimeout(() => {
      setEditingCategory(null);
      setChangeSuccessMsg(null);
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewCoverUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

            {/* Quick button to change photo of active category if specific category is selected */}
            {activeCategoryObj && (
              <button
                type="button"
                onClick={() => handleOpenEditPhotoModal(activeCategoryObj)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#2B7574]/15 text-xs text-[#0E2931] border border-[#2B7574]/40 transition-colors shadow-xs font-semibold"
              >
                <Camera className="w-3.5 h-3.5 text-[#2B7574]" />
                <span>Cambiar Foto de Portada ({activeCategoryObj.label})</span>
              </button>
            )}
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

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPhotoModal(activeCategoryObj)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] text-xs font-semibold transition-colors shadow-md"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cambiar Foto de Portada de {activeCategoryObj.label}</span>
                  </button>
                </div>
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
                  <button
                    onClick={() => handleOpenEditPhotoModal(activeCategoryObj)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    <Camera className="w-4 h-4 text-[#2B7574]" />
                    <span>Actualizar Portada</span>
                  </button>
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono-data text-zinc-300 px-2 py-0.5 rounded bg-black/60 backdrop-blur">
                    PORTADA ACTUAL
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* If 'all' is selected, show small preview strip of all category cards with quick photo change */}
        {selectedCategory === 'all' && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono-data uppercase tracking-wider text-zinc-400 font-semibold">
                Portadas de Categorías (Haz clic en una cámara para cambiar su foto):
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group relative rounded-xl overflow-hidden border border-[#2B7574]/30 bg-[#0E2931] shadow-md transition-all hover:border-[#2B7574]"
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

                    <button
                      type="button"
                      onClick={() => handleOpenEditPhotoModal(cat)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-[#2B7574] text-white transition-colors shadow"
                      title={`Cambiar foto de ${cat.label}`}
                    >
                      <Camera className="w-3.5 h-3.5 text-[#E2E2E0]" />
                    </button>

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

      {/* MODAL: CAMBIAR FOTO DE PORTADA DE CATEGORÍA */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-[#0E2931] border border-[#2B7574] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#2B7574]/40 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#2B7574]" />
                <h3 className="font-display text-lg font-bold text-[#E2E2E0]">
                  Cambiar Foto de Portada: {editingCategory.label}
                </h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {changeSuccessMsg && (
              <div className="p-3 rounded-xl bg-[#2B7574]/30 border border-[#2B7574] text-[#E2E2E0] text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{changeSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoverPhoto} className="space-y-4">
              {/* Image Preview */}
              <div>
                <label className="block text-xs font-mono-data text-zinc-300 mb-1.5 uppercase">
                  VISTA PREVIA DE LA NUEVA PORTADA:
                </label>
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#2B7574]/50 bg-black">
                  {newCoverUrl ? (
                    <img
                      src={newCoverUrl}
                      alt="Vista previa portada"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-1 text-zinc-600" />
                      <span>Sin imagen seleccionada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-xs font-mono-data text-zinc-300 mb-1 uppercase">
                  URL DE LA IMAGEN O RUTA:
                </label>
                <input
                  type="text"
                  required
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  placeholder="ej. /src/assets/images/... o URL web https://..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070e11] border border-[#2B7574]/50 text-white text-xs font-mono-data focus:outline-none focus:border-[#2B7574]"
                />
              </div>

              {/* File Upload Option */}
              <div>
                <label className="block text-xs font-mono-data text-zinc-300 mb-1 uppercase">
                  O SUBE UNA FOTO DESDE TU DISPOSITIVO:
                </label>
                <label className="w-full py-2.5 px-3 rounded-lg border border-dashed border-[#2B7574]/60 bg-[#070e11]/60 hover:bg-[#070e11] cursor-pointer flex items-center justify-center gap-2 text-xs text-zinc-300 transition-colors">
                  <Upload className="w-4 h-4 text-[#2B7574]" />
                  <span>Seleccionar archivo local de imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Quick Pick from Works in this category */}
              <div>
                <label className="block text-[11px] font-mono-data text-zinc-400 mb-1.5 uppercase">
                  O ELIGE UNA FOTO DE LAS OBRAS DE ESTA CATEGORÍA:
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1 bg-[#070e11] rounded-lg border border-[#2B7574]/30">
                  {items
                    .filter((item) => item.category === editingCategory.id)
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setNewCoverUrl(item.url)}
                        className={`aspect-square rounded-lg overflow-hidden border transition-all ${
                          newCoverUrl === item.url
                            ? 'border-[#2B7574] ring-2 ring-[#2B7574]'
                            : 'border-zinc-800 hover:border-zinc-500'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-[#2B7574]/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Foto de Portada</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
