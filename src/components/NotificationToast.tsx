import React, { useEffect, useState } from 'react';
import { subscribeToActivity } from '../services/storageService';
import { ActivityNotification } from '../types';
import { Bell, Download, Eye, Heart, Sparkles, X } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToActivity((newNotification) => {
      setNotifications((prev) => [newNotification, ...prev.slice(0, 3)]);

      // Auto dismiss after 6 seconds
      setTimeout(() => {
        setNotifications((current) => current.filter((n) => n.id !== newNotification.id));
      }, 6000);
    });

    return unsubscribe;
  }, []);

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((n) => {
        const getIcon = () => {
          switch (n.type) {
            case 'download':
            case 'batch_download':
              return <Download className="w-4 h-4 text-emerald-400" />;
            case 'selection':
              return <Heart className="w-4 h-4 text-rose-400" />;
            case 'view':
              return <Eye className="w-4 h-4 text-cyan-400" />;
            default:
              return <Bell className="w-4 h-4 text-amber-400" />;
          }
        };

        return (
          <div
            key={n.id}
            className="pointer-events-auto bg-[#0E2931]/95 backdrop-blur-md border border-[#2B7574]/70 shadow-2xl rounded-2xl p-4 flex items-start gap-3.5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-300"
          >
            <div className="p-2.5 rounded-xl bg-[#070e11] border border-[#2B7574]/40 shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-data bg-[#2B7574]/30 text-emerald-300 border border-[#2B7574]/50 font-bold uppercase tracking-wider">
                  Admin Monitor
                </span>
                <span className="text-[10px] text-zinc-400 font-mono-data shrink-0 ml-auto">
                  {n.timestamp}
                </span>
              </div>
              <div className="text-xs font-semibold text-[#E2E2E0] tracking-wide truncate mb-0.5">
                {n.title}
              </div>
              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                {n.description}
              </p>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
              aria-label="Cerrar notificación"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
