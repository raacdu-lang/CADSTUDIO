import React, { useState } from 'react';
import { StudioConfig } from '../types';
import { Lock, Shield, KeyRound, X } from 'lucide-react';

interface FooterProps {
  config: StudioConfig;
  onNavigate: (view: 'home' | 'client-portal' | 'admin') => void;
}

export const Footer: React.FC<FooterProps> = ({ config, onNavigate }) => {
  const [showAdminCodeModal, setShowAdminCodeModal] = useState<boolean>(false);
  const [adminCode, setAdminCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleAdminCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminCode.trim().toLowerCase();
    if (clean === 'cad2026' || clean === 'admin' || clean === 'aurora2026') {
      setShowAdminCodeModal(false);
      setAdminCode('');
      setCodeError(null);
      onNavigate('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCodeError('Código de seguridad incorrecto. Acceso denegado.');
    }
  };

  return (
    <footer className="bg-[#0E2931] border-t border-[#2B7574]/40 py-12 text-xs text-[#E2E2E0]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#2B7574]/30">
          <div>
            <span className="font-display text-lg font-bold tracking-wider uppercase text-[#E2E2E0] block">
              {config.studioName}
            </span>
            <span className="text-[#E2E2E0]/70 text-[11px] font-mono-data mt-0.5 block">
              {config.photographerName} · {config.location}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[#E2E2E0]/90">
            <button
              onClick={() => onNavigate('home')}
              className="hover:text-white transition-colors"
            >
              Portafolio
            </button>
            <button
              onClick={() => onNavigate('client-portal')}
              className="text-[#2B7574] hover:text-[#3b9493] font-semibold transition-colors"
            >
              Clientes
            </button>
            <a
              href={`mailto:${config.email}`}
              className="hover:text-white transition-colors"
            >
              {config.email}
            </a>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono-data text-[#E2E2E0]/60">
          <p>© {new Date().getFullYear()} {config.studioName}. Todos los derechos de reproducción reservados.</p>

          {/* Discreet, hidden admin entrance with code requirement */}
          <div className="flex items-center gap-3">
            <span>Entrega privada en máxima calidad</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setShowAdminCodeModal(true)}
              className="text-[#E2E2E0]/60 hover:text-[#2B7574] transition-colors flex items-center gap-1 group"
              title="Acceso exclusivo administración"
            >
              <Lock className="w-3 h-3 group-hover:text-[#2B7574] transition-colors" />
              <span className="text-[10px]">Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Prompt Modal for Admin Access */}
      {showAdminCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E2931] border border-[#2B7574] rounded-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#2B7574]/20 border border-[#2B7574]/60 flex items-center justify-center text-[#E2E2E0]">
              <Shield className="w-6 h-6 text-[#2B7574]" />
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-[#E2E2E0]">
                Acceso de Administración
              </h3>
              <p className="text-xs text-zinc-300 mt-1">
                Introduzca el código de seguridad para acceder al panel de control.
              </p>
            </div>

            <form onSubmit={handleAdminCodeSubmit} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="Código de seguridad"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070e11] border border-[#2B7574]/50 text-white text-xs text-center font-mono-data focus:outline-none focus:border-[#2B7574]"
              />

              {codeError && (
                <p className="text-xs text-rose-400 font-medium">{codeError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminCodeModal(false);
                    setCodeError(null);
                    setAdminCode('');
                  }}
                  className="flex-1 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-[#070e11] border border-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-[#0E2931]/80"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};
