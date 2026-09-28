import React, { useState } from 'react';
import { StudioAnnouncement, StudioConfig } from '../types';
import { Tag, Sparkles, Calendar, MessageCircle, ArrowRight, ShieldCheck, MapPin, X } from 'lucide-react';

interface OffersPanelProps {
  announcement: StudioAnnouncement;
  config: StudioConfig;
  onOpenContact: () => void;
  onOpenChatbot?: () => void;
}

export const OffersPanel: React.FC<OffersPanelProps> = ({
  announcement,
  config,
  onOpenContact,
  onOpenChatbot,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (!announcement.isActive || isDismissed) {
    return null;
  }

  const handleAction = () => {
    if (announcement.ctaAction === 'whatsapp') {
      const cleanPhone = (config.whatsapp || '+526671234567').replace(/[^\d+]/g, '');
      const msg = encodeURIComponent(
        `Hola ${config.photographerName}, me interesa la oferta "${announcement.title}" que vi en la web de CADSTUDIO Culiacán.`
      );
      window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${msg}`, '_blank', 'noopener,noreferrer');
    } else if (announcement.ctaAction === 'chatbot' && onOpenChatbot) {
      onOpenChatbot();
    } else {
      onOpenContact();
    }
  };

  const themeClasses = {
    rose: {
      cardBg: 'from-[#0E2931] via-[#102d35] to-[#0a1f26]',
      border: 'border-[#2B7574]/60 hover:border-[#2B7574]',
      badge: 'bg-[#2B7574]/30 text-[#E2E2E0] border-[#2B7574]/60',
      accentText: 'text-[#2B7574]',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-[#0E2931]/60',
      glow: 'from-[#2B7574]/20',
    },
    amber: {
      cardBg: 'from-[#0E2931] via-[#142928] to-[#0b1c20]',
      border: 'border-amber-700/50 hover:border-amber-500/70',
      badge: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
      accentText: 'text-amber-400',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-amber-950/40',
      glow: 'from-amber-600/15',
    },
    emerald: {
      cardBg: 'from-[#0E2931] via-[#0f2e2f] to-[#0a1e22]',
      border: 'border-[#2B7574]/70 hover:border-[#3b9493]',
      badge: 'bg-[#2B7574]/30 text-emerald-200 border-[#2B7574]/50',
      accentText: 'text-emerald-300',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-[#0E2931]/50',
      glow: 'from-[#2B7574]/25',
    },
    blue: {
      cardBg: 'from-[#0E2931] via-[#112d38] to-[#0a1e24]',
      border: 'border-[#2B7574]/60 hover:border-[#3b9493]',
      badge: 'bg-[#2B7574]/30 text-cyan-200 border-[#2B7574]/50',
      accentText: 'text-cyan-300',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-[#0E2931]/50',
      glow: 'from-[#2B7574]/20',
    },
  }[announcement.theme || 'rose'];

  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-12 sm:mb-16 z-20">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${themeClasses.cardBg} border ${themeClasses.border} p-6 sm:p-8 shadow-2xl transition-all duration-300`}
      >
        {/* Subtle decorative glow */}
        <div
          className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${themeClasses.glow} to-transparent blur-3xl pointer-events-none -z-10`}
        />

        {/* Close / Dismiss button */}
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors z-10"
          title="Cerrar panel de aviso"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Info Column */}
          <div className={`${announcement.imageUrl ? 'lg:col-span-8' : 'lg:col-span-9'} space-y-4`}>
            {/* Badges / Header Metadata */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] sm:text-xs font-mono-data uppercase tracking-wider px-2.5 py-0.5 rounded-full border font-bold ${themeClasses.badge}`}
              >
                {announcement.badge || 'OFERTA ESPECIAL'}
              </span>

              <span className="flex items-center gap-1 text-[11px] font-mono-data text-zinc-300">
                <MapPin className="w-3 h-3 text-[#2B7574]" />
                <span>Culiacán, Sinaloa & Todo México</span>
              </span>

              {announcement.validUntil && (
                <span className="flex items-center gap-1 text-[11px] font-mono-data text-zinc-400">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>Vigencia: {announcement.validUntil}</span>
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-[#E2E2E0] tracking-tight leading-snug">
              {announcement.title}
            </h3>

            {/* Message Body */}
            <p className="text-xs sm:text-sm text-zinc-200/90 font-light leading-relaxed">
              {announcement.message}
            </p>

            {/* Optional Extra Details / Discount Code */}
            {(announcement.discountCode || announcement.details) && (
              <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                {announcement.discountCode && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0E2931]/90 border border-[#2B7574]/50 font-mono-data text-[#E2E2E0]">
                    <Tag className="w-3.5 h-3.5 text-[#2B7574]" />
                    <span>CÓDIGO: <strong className="text-white tracking-wider">{announcement.discountCode}</strong></span>
                  </div>
                )}
                {announcement.details && (
                  <span className="text-zinc-300 text-xs italic">
                    {announcement.details}
                  </span>
                )}
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                onClick={handleAction}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-xl active:scale-98 ${themeClasses.btn}`}
              >
                <span>{announcement.ctaText || 'Aprovechar Oferta'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Optional Image Column */}
          {announcement.imageUrl && (
            <div className="lg:col-span-4 relative group">
              <div className="relative overflow-hidden rounded-xl border border-[#2B7574]/40 shadow-2xl aspect-[4/3] bg-[#0E2931]">
                <img
                  src={announcement.imageUrl}
                  alt={announcement.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    // graceful fallback if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E2931]/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur text-[10px] font-mono-data text-zinc-300 border border-white/10">
                  CADSTUDIO PROMO
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
