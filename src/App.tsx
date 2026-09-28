import React, { useState, useEffect } from 'react';
import {
  PortfolioItem,
  ClientFile,
  StudioConfig,
  StudioAnnouncement,
  StudioCategory,
} from './types';
import {
  getStudioConfig,
  getPortfolioItems,
  getAnnouncement,
  getStudioCategories,
  incrementVisitCount,
} from './services/storageService';
import { Navbar } from './components/Navbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { OffersPanel } from './components/OffersPanel';
import { Hero } from './components/Hero';
import { CoreCategoriesSection } from './components/CoreCategoriesSection';
import { PortfolioGallery } from './components/PortfolioGallery';
import { FullPortfolioPage } from './components/FullPortfolioPage';
import { ServicesSection } from './components/ServicesSection';
import { QuickContact } from './components/QuickContact';
import { ClientDeliveryPortal } from './components/ClientDeliveryPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { MediaViewerModal } from './components/MediaViewerModal';
import { NotificationToast } from './components/NotificationToast';
import { Chatbot } from './components/Chatbot';
import { Footer } from './components/Footer';

export default function App() {
  const [activeView, setActiveView] = useState<'home' | 'client-portal' | 'admin' | 'full-portfolio'>('home');
  const [studioConfig, setStudioConfig] = useState<StudioConfig>(getStudioConfig());
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(getPortfolioItems());
  const [categories, setCategories] = useState<StudioCategory[]>(getStudioCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [studioAnnouncement, setStudioAnnouncement] = useState<StudioAnnouncement>(getAnnouncement());
  const [selectedClientToken, setSelectedClientToken] = useState<string>('');

  // Media Viewer modal state
  const [activeViewerItem, setActiveViewerItem] = useState<PortfolioItem | ClientFile | null>(null);
  const [viewerItemsList, setViewerItemsList] = useState<(PortfolioItem | ClientFile)[]>([]);
  const [viewerAllowDownload, setViewerAllowDownload] = useState<boolean>(false);

  // Check URL query parameters for direct client token link (?token=xxx) and categories (?categoria=xxx)
  useEffect(() => {
    incrementVisitCount();

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        setSelectedClientToken(token);
        setActiveView('client-portal');
      }
      const cat = params.get('categoria');
      if (cat) {
        setSelectedCategory(cat);
      }
      const view = params.get('view');
      if (view === 'admin') {
        setActiveView('admin');
      } else if (view === 'clients') {
        setActiveView('client-portal');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const refreshData = () => {
    setStudioConfig(getStudioConfig());
    setPortfolioItems(getPortfolioItems());
    setCategories(getStudioCategories());
    setStudioAnnouncement(getAnnouncement());
  };

  const handleOpenViewerFromPortfolio = (item: PortfolioItem) => {
    setActiveViewerItem(item);
    setViewerItemsList(portfolioItems);
    setViewerAllowDownload(false); // strictly no downloads on public portfolio
  };

  const handleOpenViewerFromFile = (file: ClientFile, allFiles: ClientFile[]) => {
    setActiveViewerItem(file);
    setViewerItemsList(allFiles);
    setViewerAllowDownload(true); // downloads permitted in private client room
  };

  return (
    <div className="min-h-screen bg-[#E2E2E0] text-[#0E2931] flex flex-col font-sans">
      {/* 3-Zone Top Bar */}
      <Navbar
        config={studioConfig}
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenQuickContact={() => {
          setActiveView('home');
          setTimeout(() => {
            const el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
      />

      {/* Top Special Offer & Announcement Banner */}
      <AnnouncementBanner
        announcement={studioAnnouncement}
        config={studioConfig}
        onOpenContact={() => {
          setActiveView('home');
          setTimeout(() => {
            const el = document.getElementById('contact');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {activeView === 'home' && (
          <>
            <Hero
              config={studioConfig}
              onExplorePortfolio={() => {
                const el = document.getElementById('portfolio');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenClientPortal={() => {
                setActiveView('client-portal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* Special Offers & Announcements Panel */}
            <OffersPanel
              announcement={studioAnnouncement}
              config={studioConfig}
              onOpenContact={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* The 4 Core Pillars Section */}
            <CoreCategoriesSection
              categories={categories}
              items={portfolioItems}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                const el = document.getElementById('portfolio');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <PortfolioGallery
              items={portfolioItems}
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectItem={handleOpenViewerFromPortfolio}
              onOpenFullPortfolio={() => {
                setActiveView('full-portfolio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <ServicesSection
              config={studioConfig}
              onOpenContact={() => {
                const el = document.getElementById('contact');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenClientPortal={() => {
                setActiveView('client-portal');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <QuickContact config={studioConfig} />
          </>
        )}

        {activeView === 'full-portfolio' && (
          <FullPortfolioPage
            items={portfolioItems}
            categories={categories}
            config={studioConfig}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onSelectItem={handleOpenViewerFromPortfolio}
            onBackToHome={() => {
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRefreshData={refreshData}
          />
        )}

        {activeView === 'client-portal' && (
          <ClientDeliveryPortal
            initialToken={selectedClientToken}
            config={studioConfig}
            onOpenViewer={handleOpenViewerFromFile}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            onOpenClientPortalWithToken={(token) => {
              setSelectedClientToken(token);
              setActiveView('client-portal');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRefreshData={refreshData}
          />
        )}
      </main>

      {/* High-Resolution Dynamic Zoom Media Inspector */}
      {activeViewerItem && (
        <MediaViewerModal
          item={activeViewerItem}
          itemsList={viewerItemsList}
          allowDownload={viewerAllowDownload}
          onClose={() => setActiveViewerItem(null)}
          onNavigate={(newItem) => setActiveViewerItem(newItem)}
        />
      )}

      {/* 24/7 AI Chatbot Concierge & Budget Estimator */}
      <Chatbot config={studioConfig} />

      {/* Floating Real-Time Notifications for Studio Events */}
      <NotificationToast />

      {/* Editorial Footer */}
      <Footer config={studioConfig} onNavigate={setActiveView} />
    </div>
  );
}
