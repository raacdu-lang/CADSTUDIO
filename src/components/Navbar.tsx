import React, { useState } from 'react';
import { StudioConfig } from '../types';
import { Shield, Sparkles, FolderLock, Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  config: StudioConfig;
  activeView: 'home' | 'client-portal' | 'admin' | 'full-portfolio';
  setActiveView: (view: 'home' | 'client-portal' | 'admin' | 'full-portfolio') => void;
  onOpenQuickContact: () => void;
  onSelectClientToken?: (token: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  activeView,
  setActiveView,
  onOpenQuickContact,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (sectionId === 'portfolio') {
      setActiveView('full-portfolio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveView('home');
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#E2E2E0]/95 backdrop-blur-md border-b border-[#2B7574]/25 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Zone 1: Brand title wordmark */}
        <button
          onClick={() => {
            setActiveView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-left group flex items-baseline gap-2.5 text-[#0E2931] hover:opacity-90 transition-opacity"
        >
          <span className="font-display text-xl sm:text-2xl font-extrabold tracking-wider uppercase text-[#0E2931]">
            {config.studioName}
          </span>
          <span className="text-xs uppercase tracking-widest text-[#2B7574] font-semibold hidden sm:inline">
            Atelier
          </span>
        </button>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => handleNavClick('portfolio')}
            className={`transition-colors cursor-pointer ${
              activeView === 'full-portfolio'
                ? 'text-[#2B7574] font-bold border-b-2 border-[#2B7574]'
                : 'text-[#0E2931]/80 hover:text-[#2B7574]'
            }`}
          >
            Portafolio
          </button>
          <button
            onClick={() => handleNavClick('services')}
            className="text-[#0E2931]/80 hover:text-[#2B7574] transition-colors cursor-pointer"
          >
            Servicios
          </button>
          <button
            onClick={() => handleNavClick('contact')}
            className="text-[#0E2931]/80 hover:text-[#2B7574] transition-colors cursor-pointer"
          >
            Contacto & Agenda
          </button>
        </nav>

        {/* Zone 3: Primary action */}
        <div className="flex items-center gap-3">
          {/* Client Delivery Button */}
          <button
            onClick={() => {
              setActiveView('client-portal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 border ${
              activeView === 'client-portal'
                ? 'bg-[#2B7574] text-[#E2E2E0] border-[#2B7574] shadow-sm'
                : 'bg-[#0E2931] text-[#E2E2E0] border-[#0E2931] hover:bg-[#2B7574] hover:border-[#2B7574]'
            }`}
            title="Portal de entrega privada de archivos para clientes"
          >
            <FolderLock className="w-3.5 h-3.5 text-[#E2E2E0] shrink-0" />
            <span>Clientes</span>
          </button>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#0E2931] hover:text-[#2B7574] transition-colors"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#2B7574]/20 bg-[#E2E2E0] px-4 py-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col gap-2 text-sm text-[#0E2931]">
            <button
              onClick={() => handleNavClick('portfolio')}
              className="text-left py-2 px-3 rounded-md hover:bg-[#2B7574]/15 text-[#0E2931] transition-colors font-medium"
            >
              Portafolio
            </button>
            <button
              onClick={() => handleNavClick('services')}
              className="text-left py-2 px-3 rounded-md hover:bg-[#2B7574]/15 text-[#0E2931] transition-colors font-medium"
            >
              Servicios
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenQuickContact();
              }}
              className="text-left py-2 px-3 rounded-md hover:bg-[#2B7574]/15 text-[#0E2931] transition-colors font-medium"
            >
              Solicitar Presupuesto
            </button>
          </div>
          <div className="pt-3 border-t border-[#2B7574]/30 flex gap-2">
            <button
              onClick={() => {
                setActiveView('client-portal');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 px-3 text-center text-xs font-semibold bg-[#2B7574] text-[#E2E2E0] border border-[#2B7574] rounded-lg"
            >
              Clientes
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
