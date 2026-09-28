import React from 'react';
import { StudioConfig } from '../types';
import { ShieldCheck, HardDrive, Download, Sliders, ArrowRight } from 'lucide-react';

interface ServicesSectionProps {
  config: StudioConfig;
  onOpenContact: () => void;
  onOpenClientPortal: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  config,
  onOpenContact,
  onOpenClientPortal,
}) => {
  const services = [
    {
      num: '01',
      title: 'Fotografía de Bodas & Coberturas Exclusivas',
      desc: 'Documentación emotiva y espontánea de bodas de destino, ceremonias íntimas y celebraciones privadas con ópticas luminosas y gradación personalizada.',
      deliverable: 'Galería privada con PIN + Masters RAW y álbum digital',
    },
    {
      num: '02',
      title: 'Gastronomía de Autor & Espacios Culinarios',
      desc: 'Fotografía para restaurantes Michelin, chefs y marcas gastronómicas capturando texturas, producto fresco, servicio en vivo y ambientación del salón.',
      deliverable: 'Archivos RAW de alta resolución + Archivos de exportación para prensa y redes',
    },
    {
      num: '03',
      title: 'Arquitectura & Espacios Contemplativos',
      desc: 'Documentación rigurosa de proyectos de arquitectura, interiorismo y desarrollos inmobiliarios respetando la pureza de líneas y la luz natural ambiente.',
      deliverable: 'Corrección de perspectiva tilt-shift + Archivos para publicación',
    },
    {
      num: '04',
      title: 'Retrato de Autor & Suite de Clientes',
      desc: 'Retratos individuales y corporativos con iluminación controlada en estudio o exteriores, junto con portal privado para prueba y selección con descargas en 1-click.',
      deliverable: 'Descarga completa en 1-click + Modo de selección de favoritas',
    },
  ];

  return (
    <section id="services" className="py-16 sm:py-24 border-b border-[#2B7574]/25 relative bg-[#E2E2E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-[#0E2931]/70 mb-2">
              <span className="text-[#2B7574] font-bold">SERVICIOS</span>
              <span aria-hidden="true">·</span>
              <span>CALIDAD SIN COMPRESIÓN</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0E2931] tracking-tight">
              Servicios
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenContact}
              className="text-xs font-semibold text-[#2B7574] hover:text-[#0E2931] flex items-center gap-1.5 transition-colors"
            >
              <span>Consultar Servicios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Services List with Editorial Numbering (Clean Zero-Pill) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {services.map((s) => (
            <div
              key={s.num}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-[#2B7574]/30 hover:border-[#2B7574] transition-all space-y-4 shadow-sm hover:shadow-md"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono-data text-2xl font-bold text-[#2B7574]">
                  {s.num}.
                </span>
                <span className="text-[11px] font-mono-data text-[#0E2931]/60 font-semibold">
                  ATELIER WORKFLOW
                </span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-bold text-[#0E2931] tracking-tight">
                {s.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#0E2931]/75 leading-relaxed font-light">
                {s.desc}
              </p>

              <div className="pt-3 border-t border-[#2B7574]/20 text-[11px] font-mono-data text-[#0E2931]/80 flex items-center gap-2">
                <span className="text-[#2B7574] font-bold">ENTREGABLE:</span>
                <span>{s.deliverable}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Client Guarantee Callout */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-[#0E2931] border border-[#2B7574]/50 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="font-display text-base font-bold text-[#E2E2E0]">
              ¿Ya realizó una producción con nosotros?
            </h4>
            <p className="text-xs text-zinc-300 font-light">
              Acceda a su galería privada con su token para revisar, seleccionar y descargar sus masters originales sin compresión.
            </p>
          </div>

          <button
            onClick={onOpenClientPortal}
            className="px-5 py-2.5 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#225e5d] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-lg shadow-[#0E2931]/70"
          >
            Abrir Portal de Clientes
          </button>
        </div>
      </div>
    </section>
  );
};
