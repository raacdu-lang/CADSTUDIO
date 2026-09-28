import React, { useState } from 'react';
import { StudioAnnouncement, StudioConfig } from '../types';
import { Sparkles, ArrowRight, X, Megaphone, Tag, MessageCircle } from 'lucide-react';

interface AnnouncementBannerProps {
  announcement: StudioAnnouncement;
  config: StudioConfig;
  onOpenContact: () => void;
  onOpenChatbot?: () => void;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcement,
  config,
  onOpenContact,
  onOpenChatbot,
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  if (!announcement.isActive || isDismissed) {
    return null;
  }

  const handleCtaClick = () => {
    if (announcement.ctaAction === 'whatsapp') {
      const cleanPhone = config.whatsapp.replace(/[^\d+]/g, '');
      const msg = encodeURIComponent(`Hola Mateo, vi el anuncio en la web "${announcement.title}" y quisiera más información.`);
      window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${msg}`, '_blank', 'noopener,noreferrer');
    } else if (announcement.ctaAction === 'chatbot' && onOpenChatbot) {
      onOpenChatbot();
    } else {
      onOpenContact();
    }
  };

  const themeStyles = {
    rose: {
      bg: 'bg-gradient-to-r from-[#0E2931] via-[#102d35] to-[#070e11]',
      border: 'border-[#2B7574]/60',
      badge: 'bg-[#2B7574]/30 text-[#E2E2E0] border-[#2B7574]/60',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-[#0E2931]/60',
      icon: 'text-[#2B7574]',
    },
    amber: {
      bg: 'bg-gradient-to-r from-[#0E2931] via-[#142928] to-[#070e11]',
      border: 'border-amber-700/40',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-amber-950/40',
      icon: 'text-amber-400',
    },
    emerald: {
      bg: 'bg-gradient-to-r from-[#0E2931] via-[#0f2e2f] to-[#070e11]',
      border: 'border-[#2B7574]/60',
      badge: 'bg-[#2B7574]/30 text-emerald-300 border-[#2B7574]/40',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-[#0E2931]/60',
      icon: 'text-emerald-400',
    },
    blue: {
      bg: 'bg-gradient-to-r from-[#0E2931] via-[#112d38] to-[#070e11]',
      border: 'border-[#2B7574]/60',
      badge: 'bg-[#2B7574]/30 text-cyan-200 border-[#2B7574]/40',
      btn: 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] shadow-[#0E2931]/60',
      icon: 'text-cyan-400',
    },
  }[announcement.theme || 'rose'];

  return (
    <aside
      aria-label="Aviso u oferta especial"
      className={`relative z-30 border-b ${themeStyles.border} ${themeStyles.bg} px-4 py-2.5 sm:py-3 shadow-lg transition-all animate-in fade-in duration-300`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-1.5 rounded-lg bg-black/40 border border-white/5 shrink-0 ${themeStyles.icon}`}>
            <Megaphone className="w-4 h-4" />
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
            {announcement.badge && (
              <span className={`text-[10px] font-mono-data uppercase px-2 py-0.5 rounded font-bold border shrink-0 ${themeStyles.badge}`}>
                {announcement.badge}
              </span>
            )}

            <span className="font-bold text-white tracking-tight">
              {announcement.title}
            </span>

            {announcement.message && (
              <span className="text-zinc-300 font-light hidden md:inline truncate max-w-xl">
                — {announcement.message}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {announcement.ctaText && (
            <button
              onClick={handleCtaClick}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-md active:scale-98 ${themeStyles.btn}`}
            >
              <span>{announcement.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Ocultar aviso"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
