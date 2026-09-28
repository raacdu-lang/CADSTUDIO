import React, { useState } from 'react';
import {
  ClientGallery,
  PortfolioItem,
  StudioConfig,
  ActivityNotification,
  DeliveryStatus,
  AspectRatio,
  MediaType,
  ClientFile,
  BotKnowledge,
  ClientConversation,
  StudioCategory,
  StudioAnnouncement,
  DiscoverySessionBooking,
} from '../types';
import {
  getClientGalleries,
  saveClientGalleries,
  addPhotosToGallery,
  removePhotoFromGallery,
  getPortfolioItems,
  savePortfolioItems,
  getStudioConfig,
  saveStudioConfig,
  getActivityLogs,
  addActivityLog,
  getStats,
  getBotKnowledge,
  saveBotKnowledge,
  updateBotKnowledge,
  deleteBotKnowledge,
  getClientConversations,
  deleteClientConversation,
  getStudioCategories,
  saveStudioCategories,
  addStudioCategory,
  deleteStudioCategory,
  getAnnouncement,
  saveAnnouncement,
  getDiscoveryBookings,
  saveDiscoveryBooking,
} from '../services/storageService';
import {
  exportMonthlyReportPDF,
  exportMonthlyReportExcel,
} from '../services/exportService';
import {
  Shield,
  FolderLock,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  Download,
  BarChart3,
  Camera,
  Film,
  Users,
  Bell,
  Eye,
  Settings,
  Sparkles,
  Lock,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Upload,
  Bot,
  Brain,
  MessagesSquare,
  FileUp,
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  User,
  Calendar,
  Layers,
  BookOpen,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Tag,
  FolderSync,
  CalendarCheck,
  Video,
} from 'lucide-react';
import { GoogleDriveSyncModal } from './GoogleDriveSyncModal';

interface AdminDashboardProps {
  onOpenClientPortalWithToken: (token: string) => void;
  onRefreshData?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenClientPortalWithToken,
  onRefreshData,
}) => {
  // Authentication state (Default unlocked for developer review, with password protection option)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'clients' | 'portfolio' | 'categories' | 'offers' | 'discovery-sessions' | 'stats' | 'activity' | 'bot-knowledge' | 'chat-history'
  >('clients');

  // Loaded Data
  const [galleries, setGalleries] = useState<ClientGallery[]>(getClientGalleries());
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(getPortfolioItems());
  const [categoriesList, setCategoriesList] = useState<StudioCategory[]>(getStudioCategories());
  const [discoveryBookings, setDiscoveryBookings] = useState<DiscoverySessionBooking[]>(getDiscoveryBookings());
  const [studioConfig, setStudioConfigState] = useState<StudioConfig>(getStudioConfig());
  const [announcementData, setAnnouncementData] = useState<StudioAnnouncement>(getAnnouncement());
  const [announcementForm, setAnnouncementForm] = useState<StudioAnnouncement>(getAnnouncement());
  const [activities, setActivities] = useState<ActivityNotification[]>(getActivityLogs());
  const [botKnowledgeList, setBotKnowledgeList] = useState<BotKnowledge[]>(getBotKnowledge());
  const [conversationsList, setConversationsList] = useState<ClientConversation[]>(getClientConversations());
  const stats = getStats();

  // CATEGORIES MANAGEMENT STATE
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<StudioCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState<{
    id: string;
    label: string;
    description: string;
    isCore: boolean;
    order: number;
    coverImage: string;
  }>({
    id: '',
    label: '',
    description: '',
    isCore: false,
    order: 5,
    coverImage: '',
  });

  // Modals & Forms
  const [showDriveSyncModal, setShowDriveSyncModal] = useState<boolean>(false);
  const [driveSyncGalleryId, setDriveSyncGalleryId] = useState<string | undefined>(undefined);
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<ClientGallery | null>(null);
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState<boolean>(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // PHOTO UPLOAD MODAL STATE
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadTargetGallery, setUploadTargetGallery] = useState<ClientGallery | null>(null);
  const [previewFilesToAdd, setPreviewFilesToAdd] = useState<ClientFile[]>([]);
  const [manualPhotoTitle, setManualPhotoTitle] = useState<string>('');
  const [manualPhotoUrl, setManualPhotoUrl] = useState<string>('');
  const [manualPhotoRatio, setManualPhotoRatio] = useState<AspectRatio>('16:9');
  const [manualPhotoType, setManualPhotoType] = useState<MediaType>('image');
  const [manualPhotoSize, setManualPhotoSize] = useState<string>('48.5 MB RAW');
  const [manualPhotoDimensions, setManualPhotoDimensions] = useState<string>('9504 × 6336 px');
  const [isProcessingLocalFiles, setIsProcessingLocalFiles] = useState<boolean>(false);

  // BOT KNOWLEDGE MANAGEMENT STATE
  const [knowledgeMode, setKnowledgeMode] = useState<'docs' | 'tutor'>('docs');
  const [docTitle, setDocTitle] = useState<string>('');
  const [docCategory, setDocCategory] = useState<BotKnowledge['category']>('precios');
  const [docContent, setDocContent] = useState<string>('');
  const [isSavingDoc, setIsSavingDoc] = useState<boolean>(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  
  // Bot Tutor interactive chat state
  const [tutorMessages, setTutorMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([
    {
      role: 'assistant',
      content: '¡Hola Mateo! Soy tu Asistente en Modo Entrenamiento. Puedes enseñarme nuevas tarifas, políticas de viaje, equipos o reglas de negocio para los clientes, o ponerme a prueba con preguntas simuladas. Todo lo que conversemos aquí puedo sintetizarlo y guardarlo en la base de datos.',
      timestamp: 'Ahora',
    },
  ]);
  const [tutorInput, setTutorInput] = useState<string>('');
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);
  const [suggestedKnowledge, setSuggestedKnowledge] = useState<{ title: string; category: BotKnowledge['category']; content: string } | null>(null);

  // CLIENT CHAT HISTORY STATE
  const [selectedConversation, setSelectedConversation] = useState<ClientConversation | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [chatFilter, setChatFilter] = useState<string>('todos');

  // Form states for New Client
  const [clientForm, setClientForm] = useState({
    clientName: '',
    clientEmail: '',
    title: '',
    subtitle: '',
    token: '',
    pin: '',
    eventDate: new Date().toISOString().slice(0, 10),
    deliveryDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    selectionLimit: 25,
    coverImage: '/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg',
  });

  // Form states for Portfolio item
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    category: 'bodas' as 'bodas' | 'gastronomia' | 'arquitectura' | 'retrato',
    aspectRatio: '16:9' as AspectRatio,
    mediaType: 'image' as MediaType,
    url: '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg',
    videoSrc: '',
    client: '',
    year: '2026',
    camera: 'Leica SL2-S',
    lens: 'Noctilux 50mm f/0.95',
    aperture: 'f/1.4',
    shutter: '1/250s',
    iso: '100',
    resolution: '8368 × 4707 px',
    description: '',
  });

  // Form states for Studio Info
  const [studioForm, setStudioForm] = useState<StudioConfig>(studioConfig);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = adminPinInput.trim().toLowerCase();
    if (clean === 'aurora2026' || clean === 'cad2026' || clean === 'admin') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Contraseña incorrecta. Acceso denegado.');
    }
  };

  const handleCopyLink = (token: string) => {
    const fullUrl = `${window.location.origin}/?token=${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  // Add / Edit Client Handler
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingClient) {
      // Update existing
      const updated = galleries.map((g) => {
        if (g.id === editingClient.id) {
          return {
            ...g,
            clientName: clientForm.clientName,
            clientEmail: clientForm.clientEmail,
            title: clientForm.title,
            subtitle: clientForm.subtitle,
            token: clientForm.token || g.token,
            pin: clientForm.pin,
            eventDate: clientForm.eventDate,
            deliveryDate: clientForm.deliveryDate,
            expiryDate: clientForm.expiryDate,
            selectionLimit: Number(clientForm.selectionLimit),
            coverImage: clientForm.coverImage,
          };
        }
        return g;
      });
      setGalleries(updated);
      saveClientGalleries(updated);
      setEditingClient(null);
    } else {
      // Create new gallery
      const newGal: ClientGallery = {
        id: 'gal-' + Date.now(),
        token: clientForm.token.trim() || clientForm.clientName.toLowerCase().replace(/\s+/g, '-') + '-2026',
        pin: clientForm.pin,
        clientName: clientForm.clientName,
        clientEmail: clientForm.clientEmail,
        title: clientForm.title,
        subtitle: clientForm.subtitle,
        coverImage: clientForm.coverImage,
        eventDate: clientForm.eventDate,
        deliveryDate: clientForm.deliveryDate,
        expiryDate: clientForm.expiryDate,
        status: 'entregado',
        totalDownloads: 0,
        selectedFileIds: [],
        allowFullDownload: true,
        selectionLimit: Number(clientForm.selectionLimit),
        files: [
          {
            id: 'file-new-1',
            title: `${clientForm.clientName.replace(/\s+/g, '_')}_001_MASTER_RAW`,
            type: 'image',
            previewUrl: clientForm.coverImage,
            originalUrl: clientForm.coverImage,
            aspectRatio: '16:9',
            fileSize: '54.2 MB RAW',
            dimensions: '8368 × 4707 px',
            downloadsCount: 0,
          },
          {
            id: 'file-new-2',
            title: `${clientForm.clientName.replace(/\s+/g, '_')}_002_PORTRAIT`,
            type: 'image',
            previewUrl: '/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg',
            originalUrl: '/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg',
            aspectRatio: '3:4',
            fileSize: '48.9 MB RAW',
            dimensions: '11600 × 8700 px',
            downloadsCount: 0,
          },
        ],
      };

      const updated = [newGal, ...galleries];
      setGalleries(updated);
      saveClientGalleries(updated);

      addActivityLog({
        type: 'admin',
        title: `Nueva galería creada: ${newGal.clientName}`,
        description: `Se generó el enlace privado protegido "${newGal.token}" para el cliente.`,
        clientName: newGal.clientName,
      });
    }

    setShowAddClientModal(false);
    setSaveSuccessMsg('Galería de cliente guardada y sincronizada correctamente.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteClient = (galleryId: string) => {
    if (window.confirm('¿Está seguro de revocar y eliminar el acceso a esta galería de cliente?')) {
      const updated = galleries.filter((g) => g.id !== galleryId);
      setGalleries(updated);
      saveClientGalleries(updated);
      addActivityLog({
        type: 'admin',
        title: 'Acceso de cliente revocado',
        description: `Se eliminó la galería con identificador ${galleryId}.`,
      });
      setSaveSuccessMsg('Acceso de cliente eliminado con éxito.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleUpdateStatus = (galleryId: string, newStatus: DeliveryStatus) => {
    const updated = galleries.map((g) => {
      if (g.id === galleryId) {
        return { ...g, status: newStatus };
      }
      return g;
    });
    setGalleries(updated);
    saveClientGalleries(updated);
    addActivityLog({
      type: 'admin',
      title: `Estado modificado manualmente a "${newStatus}"`,
      description: `El administrador actualizó el estado de la entrega.`,
    });
  };

  // ==========================================
  // GALLERY PHOTO UPLOAD HANDLERS
  // ==========================================
  const handleOpenUploadModal = (gallery: ClientGallery) => {
    setUploadTargetGallery(gallery);
    setPreviewFilesToAdd([]);
    setManualPhotoTitle(`${gallery.clientName.replace(/\s+/g, '_')}_${gallery.files.length + 1}`);
    setManualPhotoUrl('/src/assets/images/hero_photographer_cinematic_1790312865168.jpg');
    setManualPhotoRatio('16:9');
    setManualPhotoType('image');
    setManualPhotoSize('52.4 MB RAW');
    setManualPhotoDimensions('9504 × 6336 px');
    setShowUploadModal(true);
  };

  const handleLocalFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadTargetGallery) return;

    setIsProcessingLocalFiles(true);
    const newItems: ClientFile[] = [];

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const isVid = file.type.startsWith('video');
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

        newItems.push({
          id: 'file-upload-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 5),
          title: cleanTitle || `Foto_${uploadTargetGallery.files.length + idx + 1}`,
          type: isVid ? 'video' : 'image',
          previewUrl: dataUrl,
          originalUrl: dataUrl,
          videoSrc: isVid ? dataUrl : undefined,
          aspectRatio: '16:9',
          fileSize: `${sizeMb} MB ${isVid ? '4K Video' : 'RAW'}`,
          dimensions: isVid ? '3840 × 2160 px' : '9504 × 6336 px',
          downloadsCount: 0,
        });

        if (newItems.length === files.length) {
          setPreviewFilesToAdd((prev) => [...prev, ...newItems]);
          setIsProcessingLocalFiles(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddManualQueueItem = () => {
    if (!uploadTargetGallery || !manualPhotoUrl.trim()) return;
    const newItem: ClientFile = {
      id: 'file-manual-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title: manualPhotoTitle.trim() || `Foto_${uploadTargetGallery.files.length + previewFilesToAdd.length + 1}`,
      type: manualPhotoType,
      previewUrl: manualPhotoUrl.trim(),
      originalUrl: manualPhotoUrl.trim(),
      videoSrc: manualPhotoType === 'video' ? manualPhotoUrl.trim() : undefined,
      aspectRatio: manualPhotoRatio,
      fileSize: manualPhotoSize,
      dimensions: manualPhotoDimensions,
      downloadsCount: 0,
    };
    setPreviewFilesToAdd((prev) => [...prev, newItem]);
    setManualPhotoTitle('');
  };

  const handleRemoveFromQueue = (index: number) => {
    setPreviewFilesToAdd((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAddPhotosToGallery = () => {
    if (!uploadTargetGallery || previewFilesToAdd.length === 0) return;

    const updatedGallery = addPhotosToGallery(uploadTargetGallery.id, previewFilesToAdd);
    if (updatedGallery) {
      setGalleries(getClientGalleries());
      setUploadTargetGallery(updatedGallery);
      setPreviewFilesToAdd([]);
      setSaveSuccessMsg(`¡Se han añadido ${previewFilesToAdd.length} fotos a la galería de ${updatedGallery.clientName}!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleDeletePhotoFromGallery = (fileId: string) => {
    if (!uploadTargetGallery) return;
    if (window.confirm('¿Desea eliminar este archivo de la galería?')) {
      const updatedGallery = removePhotoFromGallery(uploadTargetGallery.id, fileId);
      if (updatedGallery) {
        setGalleries(getClientGalleries());
        setUploadTargetGallery(updatedGallery);
        setSaveSuccessMsg('Archivo eliminado de la galería.');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
        if (onRefreshData) onRefreshData();
      }
    }
  };

  // ==========================================
  // BOT KNOWLEDGE MANAGEMENT HANDLERS
  // ==========================================
  const handleUploadDocumentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSavingDoc(true);
    const fileNameClean = file.name.replace(/\.[^/.]+$/, '');
    setDocTitle(fileNameClean);

    // Auto classify category based on filename
    const lower = file.name.toLowerCase();
    if (lower.includes('precio') || lower.includes('tarifa') || lower.includes('coste')) {
      setDocCategory('precios');
    } else if (lower.includes('politi') || lower.includes('termino') || lower.includes('contrato')) {
      setDocCategory('politicas');
    } else if (lower.includes('equip') || lower.includes('camara') || lower.includes('lente')) {
      setDocCategory('equipamiento');
    } else if (lower.includes('faq') || lower.includes('pregunta')) {
      setDocCategory('faq');
    } else {
      setDocCategory('servicios');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setDocContent(text);
      }
      setIsSavingDoc(false);
    };
    reader.onerror = () => {
      setIsSavingDoc(false);
      alert('No se pudo leer el archivo de texto.');
    };
    reader.readAsText(file);
  };

  const handleSaveDocumentKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    setIsSavingDoc(true);
    try {
      if (editingKnowledgeId) {
        await updateBotKnowledge(editingKnowledgeId, {
          title: docTitle.trim(),
          category: docCategory,
          content: docContent.trim(),
        });
        setEditingKnowledgeId(null);
        setSaveSuccessMsg('Documento de conocimiento actualizado con éxito.');
      } else {
        await saveBotKnowledge({
          title: docTitle.trim(),
          category: docCategory,
          content: docContent.trim(),
          sourceType: 'manual',
          isActive: true,
        });
        setSaveSuccessMsg('Nuevo conocimiento guardado y conectado al bot.');
      }
      setBotKnowledgeList(getBotKnowledge());
      setDocTitle('');
      setDocContent('');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleToggleKnowledgeActive = async (id: string, currentState: boolean) => {
    await updateBotKnowledge(id, { isActive: !currentState });
    setBotKnowledgeList(getBotKnowledge());
  };

  const handleDeleteKnowledgeItem = async (id: string) => {
    if (window.confirm('¿Desea eliminar este documento de conocimiento del bot?')) {
      await deleteBotKnowledge(id);
      setBotKnowledgeList(getBotKnowledge());
      setSaveSuccessMsg('Documento eliminado de la base de conocimiento.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // BOT COACH / TUTOR CHAT
  const handleSendTutorMessage = async () => {
    const text = tutorInput.trim();
    if (!text || isTutorLoading) return;

    const userMsg = {
      role: 'user' as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...tutorMessages, userMsg];
    setTutorMessages(newHistory);
    setTutorInput('');
    setIsTutorLoading(true);
    setSuggestedKnowledge(null);

    try {
      const activeKnowledgeText = botKnowledgeList
        .filter((k) => k.isActive)
        .map((k) => `[${k.title}]: ${k.content}`)
        .join('\n\n');

      const response = await fetch('/api/bot/teach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          existingKnowledge: activeKnowledgeText,
        }),
      });

      const data = await response.json();
      const botMsg = {
        role: 'assistant' as const,
        content: data.reply || 'He registrado la indicación en mi memoria de sesión.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setTutorMessages([...newHistory, botMsg]);

      // If user instructed something actionable, prepare suggested knowledge draft
      if (text.length > 20) {
        setSuggestedKnowledge({
          title: text.substring(0, 35) + '...',
          category: text.toLowerCase().includes('precio') || text.toLowerCase().includes('€') ? 'precios' : 'instrucciones',
          content: `Regla enseñada por el fotógrafo:\n${text}`,
        });
      }
    } catch (err: any) {
      console.error(err);
      const botMsg = {
        role: 'assistant' as const,
        content: `Instrucción aprendida: "${text}". La tendré en cuenta en las futuras respuestas a clientes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTutorMessages([...newHistory, botMsg]);
      setSuggestedKnowledge({
        title: 'Regla: ' + text.substring(0, 30),
        category: 'instrucciones',
        content: text,
      });
    } finally {
      setIsTutorLoading(false);
    }
  };

  const handleSaveSuggestedDraft = async () => {
    if (!suggestedKnowledge) return;
    await saveBotKnowledge({
      title: suggestedKnowledge.title,
      category: suggestedKnowledge.category,
      content: suggestedKnowledge.content,
      sourceType: 'direct_chat',
      isActive: true,
    });
    setBotKnowledgeList(getBotKnowledge());
    setSuggestedKnowledge(null);
    setSaveSuccessMsg('¡Instrucción guardada permanentemente en la Base de Datos del Bot!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // CLIENT CONVERSATIONS HANDLERS
  const handleDeleteConversationItem = async (id: string) => {
    if (window.confirm('¿Desea eliminar esta plática del historial?')) {
      await deleteClientConversation(id);
      setConversationsList(getClientConversations());
      if (selectedConversation?.id === id) {
        setSelectedConversation(null);
      }
      setSaveSuccessMsg('Conversación eliminada de la base de datos.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Add / Edit Portfolio Item
  const handleSavePortfolioItem = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPortfolioItem) {
      const updated = portfolioItems.map((item) => {
        if (item.id === editingPortfolioItem.id) {
          return {
            ...item,
            title: portfolioForm.title,
            category: portfolioForm.category,
            aspectRatio: portfolioForm.aspectRatio,
            mediaType: portfolioForm.mediaType,
            url: portfolioForm.url,
            originalUrl: portfolioForm.url,
            videoSrc: portfolioForm.videoSrc || undefined,
            client: portfolioForm.client,
            year: portfolioForm.year,
            description: portfolioForm.description,
            exif: {
              camera: portfolioForm.camera,
              lens: portfolioForm.lens,
              aperture: portfolioForm.aperture,
              shutter: portfolioForm.shutter,
              iso: portfolioForm.iso,
              focalLength: '50mm',
              resolution: portfolioForm.resolution,
            },
          };
        }
        return item;
      });
      setPortfolioItems(updated);
      savePortfolioItems(updated);
      setEditingPortfolioItem(null);
    } else {
      const newItem: PortfolioItem = {
        id: 'port-' + Date.now(),
        title: portfolioForm.title,
        category: portfolioForm.category,
        aspectRatio: portfolioForm.aspectRatio,
        mediaType: portfolioForm.mediaType,
        url: portfolioForm.url,
        originalUrl: portfolioForm.url,
        videoSrc: portfolioForm.videoSrc || undefined,
        client: portfolioForm.client,
        year: portfolioForm.year,
        description: portfolioForm.description,
        exif: {
          camera: portfolioForm.camera,
          lens: portfolioForm.lens,
          aperture: portfolioForm.aperture,
          shutter: portfolioForm.shutter,
          iso: portfolioForm.iso,
          focalLength: '50mm',
          resolution: portfolioForm.resolution,
        },
      };
      const updated = [newItem, ...portfolioItems];
      setPortfolioItems(updated);
      savePortfolioItems(updated);
      addActivityLog({
        type: 'admin',
        title: `Nueva obra agregada al portafolio: ${newItem.title}`,
        description: `Categoría ${newItem.category} en formato ${newItem.aspectRatio}.`,
      });
    }

    setShowAddPortfolioModal(false);
    setSaveSuccessMsg('Obra del portafolio guardada con éxito.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    if (onRefreshData) onRefreshData();
  };

  const handleDeletePortfolioItem = (id: string) => {
    if (window.confirm('¿Desea eliminar esta obra del portafolio?')) {
      const updated = portfolioItems.filter((p) => p.id !== id);
      setPortfolioItems(updated);
      savePortfolioItems(updated);
      setSaveSuccessMsg('Obra eliminada del portafolio.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Save Studio Profile Info
  const handleSaveStudioConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStudioConfig(studioForm);
    setStudioConfigState(studioForm);
    setSaveSuccessMsg('Información de biografía y contacto actualizada.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // CATEGORY HANDLERS
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.label.trim()) return;

    const catId = categoryForm.id.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-') ||
      categoryForm.label.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');

    const newCategory: StudioCategory = {
      id: catId,
      label: categoryForm.label.trim(),
      description: categoryForm.description.trim(),
      isCore: categoryForm.isCore,
      order: Number(categoryForm.order) || categoriesList.length + 1,
      coverImage: categoryForm.coverImage.trim() || '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg',
    };

    const updated = addStudioCategory(newCategory);
    setCategoriesList(updated);
    setShowAddCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({
      id: '',
      label: '',
      description: '',
      isCore: false,
      order: updated.length + 1,
      coverImage: '',
    });
    setSaveSuccessMsg(`Categoría "${newCategory.label}" guardada exitosamente.`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    if (onRefreshData) onRefreshData();
  };

  const handleDeleteCategory = (catId: string) => {
    const target = categoriesList.find((c) => c.id === catId);
    if (target?.isCore) {
      alert('Esta es una de las 4 categorías fuertes principales de CADSTUDIO y está protegida para mantener la coherencia de la marca.');
      return;
    }

    if (window.confirm(`¿Desea eliminar la categoría "${target?.label || catId}"? Las fotos existentes mantendrán su archivo.`)) {
      const updated = deleteStudioCategory(catId);
      setCategoriesList(updated);
      setSaveSuccessMsg('Categoría eliminada.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      if (onRefreshData) onRefreshData();
    }
  };

  // ANNOUNCEMENT & OFFERS HANDLERS
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAnnouncement(announcementForm);
    setAnnouncementData({ ...announcementForm });
    setSaveSuccessMsg('¡Panel de ofertas y anuncio del estudio actualizado y publicado!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    if (onRefreshData) onRefreshData();
  };

  // Simulate Live Client Event
  const handleSimulateClientActivity = () => {
    const randomEvents = [
      {
        type: 'download' as const,
        title: 'Descarga individual en alta resolución',
        description: 'Valeria Ramos descargó Atelier_Valeria_001_RAW (54.8 MB RAW)',
        clientName: 'Valeria Ramos',
      },
      {
        type: 'selection' as const,
        title: 'Nueva foto marcada como favorita',
        description: 'Lucas & Elena marcaron Boda_LucasElena_Retrato_Pareja_078 como favorita.',
        clientName: 'Lucas & Elena',
      },
      {
        type: 'batch_download' as const,
        title: 'Descarga masiva de archivos originales',
        description: 'Nomad Arquitectura descargó todos los archivos originales directamente (14 archivos).',
        clientName: 'Nomad Arquitectura',
      },
      {
        type: 'view' as const,
        title: 'Enlace privado abierto por el cliente',
        description: 'Acceso validado a galería privada con PIN de seguridad.',
        clientName: 'Valeria Ramos',
      },
    ];

    const ev = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    addActivityLog(ev);
    setActivities(getActivityLogs());
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0E2931] border border-[#2B7574] rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#2B7574]/20 border border-[#2B7574]/50 flex items-center justify-center text-[#2B7574]">
            <Shield className="w-7 h-7 text-[#E2E2E0]" />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-[#E2E2E0] tracking-tight">
              Panel Administrativo CADSTUDIO
            </h2>
            <p className="text-xs text-zinc-300 mt-2">
              Autenticación para gestión de clientes, links privados, portafolio y estadísticas.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Contraseña de administrador"
                className="w-full px-4 py-2.5 rounded-lg bg-[#070e11] border border-[#2B7574]/50 text-white text-sm focus:outline-none focus:border-[#2B7574] font-mono-data text-center"
              />
            </div>

            {authError && <p className="text-xs text-rose-400">{authError}</p>}

            <button
              type="submit"
              className="w-full py-2.5 bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0E2931]/80"
            >
              <KeyRound className="w-4 h-4" />
              <span>Desbloquear Panel</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 bg-[#070e11] text-[#E2E2E0] min-h-[90vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2B7574]/25">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-data text-zinc-400 mb-1">
              <span className="text-[#2B7574] font-semibold">PANEL ADMINISTRATIVO</span>
              <span aria-hidden="true">·</span>
              <span>AUTENTICACIÓN ACTIVA</span>
              <span aria-hidden="true">·</span>
              <span>{studioConfig.studioName}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#E2E2E0] tracking-tight">
              Control de Operaciones, Clientes & Portafolio
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Real-time simulation trigger for testing */}
            <button
              onClick={handleSimulateClientActivity}
              className="px-3.5 py-2 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5"
              title="Simular actividad de cliente para ver la notificación en tiempo real"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Actividad en Vivo</span>
            </button>

            {/* Quick Export PDF / Excel */}
            <button
              onClick={() => exportMonthlyReportPDF(studioConfig, stats, galleries, activities)}
              className="px-3 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Exportar informe mensual PDF"
            >
              <FileText className="w-3.5 h-3.5 text-[#2B7574]" />
              <span>PDF</span>
            </button>

            <button
              onClick={() => exportMonthlyReportExcel(studioConfig, stats, galleries, activities)}
              className="px-3 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Exportar auditoría en Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Global Save Feedback Banner */}
        {saveSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs flex items-center justify-between animate-in fade-in duration-200">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              {saveSuccessMsg}
            </span>
            <button onClick={() => setSaveSuccessMsg(null)}>✕</button>
          </div>
        )}

        {/* Tab Navigation (Segmented Interactive Controls) */}
        <div className="flex items-center gap-2 p-1 bg-[#0E2931] border border-[#2B7574]/40 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <FolderLock className="w-3.5 h-3.5" />
            <span>Entregas a Clientes ({galleries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'portfolio'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Portafolio & Obras ({portfolioItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#2B7574]" />
            <span>Categorías ({categoriesList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'offers'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-[#2B7574]" />
            <span>Ofertas & Anuncios {announcementData.isActive ? '(Activo)' : '(Pausado)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('discovery-sessions')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'discovery-sessions'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5 text-[#2B7574]" />
            <span>Sesiones Google Calendar ({discoveryBookings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'stats'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Estadísticas & Reportes</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Actividad en Vivo ({activities.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('bot-knowledge')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'bot-knowledge'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-[#2B7574]" />
            <span>Entrenamiento IA ({botKnowledgeList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('chat-history')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'chat-history'
                ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm font-semibold'
                : 'text-zinc-300 hover:text-[#E2E2E0] hover:bg-[#2B7574]/20'
            }`}
          >
            <MessagesSquare className="w-3.5 h-3.5 text-[#2B7574]" />
            <span>Historial de Pláticas ({conversationsList.length})</span>
          </button>
        </div>

        {/* TAB 1: CLIENTS & PRIVATE DELIVERIES */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Galerías Privadas de Clientes</h2>
                <p className="text-xs text-zinc-400">
                  Agregue clientes, configure sus tokens de enlace privado, supervise estados y descargas.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setDriveSyncGalleryId(undefined);
                    setShowDriveSyncModal(true);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Conectar y sincronizar carpetas de Google Drive a las salas privadas"
                >
                  <FolderSync className="w-4 h-4 text-blue-400" />
                  <span>Sincronizar Google Drive</span>
                </button>

                <button
                  onClick={() => {
                    setEditingClient(null);
                    setClientForm({
                      clientName: '',
                      clientEmail: '',
                      title: '',
                      subtitle: '',
                      token: '',
                      pin: '',
                      eventDate: new Date().toISOString().slice(0, 10),
                      deliveryDate: new Date().toISOString().slice(0, 10),
                      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                      selectionLimit: 25,
                      coverImage: '/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg',
                    });
                    setShowAddClientModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Galería Privada</span>
                </button>
              </div>
            </div>

            {/* Client List Cards */}
            <div className="grid grid-cols-1 gap-4">
              {galleries.map((gal) => (
                <div
                  key={gal.id}
                  className="p-5 rounded-2xl bg-[#121215] border border-[#242429] hover:border-[#33333d] transition-colors flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={gal.coverImage}
                      alt={gal.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800"
                    />

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{gal.clientName}</h3>
                        <span className="text-xs text-zinc-400 font-mono-data hidden sm:inline">
                          ({gal.clientEmail})
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 truncate">{gal.title}</p>

                      {/* Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-data text-zinc-400">
                        <span>Token: <strong className="text-rose-400">{gal.token}</strong></span>
                        <span aria-hidden="true">·</span>
                        <span>PIN: {gal.pin || 'Sin PIN'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{gal.files.length} archivos</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-400 font-semibold">{gal.totalDownloads} descargas</span>
                        <span aria-hidden="true">·</span>
                        <span>{gal.selectedFileIds.length} seleccionadas</span>
                        {gal.driveFolderName && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-blue-400 font-medium flex items-center gap-1">
                              <FolderSync className="w-3 h-3" />
                              <span>Drive: {gal.driveFolderName}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Control */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 justify-between lg:justify-end">
                    {/* Status Dropdown */}
                    <select
                      value={gal.status}
                      onChange={(e) => handleUpdateStatus(gal.id, e.target.value as DeliveryStatus)}
                      aria-label="Estado de entrega de la galería"
                      className="text-xs font-mono-data bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
                    >
                      <option value="entregado">1. Entregado</option>
                      <option value="visto">2. Visto por Cliente</option>
                      <option value="en_seleccion">3. En Selección</option>
                      <option value="seleccion_enviada">4. Selección Enviada</option>
                      <option value="completado">5. Completado</option>
                    </select>

                    {/* Sincronizar Google Drive */}
                    <button
                      onClick={() => {
                        setDriveSyncGalleryId(gal.id);
                        setShowDriveSyncModal(true);
                      }}
                      className="px-2.5 py-1.5 text-xs text-blue-300 bg-blue-950/40 hover:bg-blue-900/60 border border-blue-800/50 rounded-lg transition-colors flex items-center gap-1"
                      title="Sincronizar carpeta de Google Drive a esta galería"
                    >
                      <FolderSync className="w-3.5 h-3.5 text-blue-400" />
                      <span>Drive</span>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(gal.token)}
                      className="px-2.5 py-1.5 text-xs text-zinc-300 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1"
                      title="Copiar enlace privado al portapapeles"
                    >
                      {copiedToken === gal.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken === gal.token ? 'Copiado' : 'Link'}</span>
                    </button>

                    {/* Test In Portal */}
                    <button
                      onClick={() => onOpenClientPortalWithToken(gal.token)}
                      className="px-2.5 py-1.5 text-xs text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors flex items-center gap-1"
                      title="Probar vista de cliente"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver Cliente</span>
                    </button>

                    {/* Subir Fotos a Galería */}
                    <button
                      onClick={() => handleOpenUploadModal(gal)}
                      className="px-3 py-1.5 text-xs text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                      title="Subir fotos y gestionar archivos en esta galería"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Fotos ({gal.files.length})</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditingClient(gal);
                        setClientForm({
                          clientName: gal.clientName,
                          clientEmail: gal.clientEmail,
                          title: gal.title,
                          subtitle: gal.subtitle,
                          token: gal.token,
                          pin: gal.pin || '',
                          eventDate: gal.eventDate,
                          deliveryDate: gal.deliveryDate,
                          expiryDate: gal.expiryDate,
                          selectionLimit: gal.selectionLimit || 25,
                          coverImage: gal.coverImage,
                        });
                        setShowAddClientModal(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-700 rounded-lg transition-colors"
                      title="Modificar perfil e información"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Revoke / Delete */}
                    <button
                      onClick={() => handleDeleteClient(gal.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 bg-zinc-900 border border-zinc-700 rounded-lg transition-colors"
                      title="Revocar acceso y eliminar galería"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PORTFOLIO & WEB CONFIG */}
        {activeTab === 'portfolio' && (
          <div className="space-y-8">
            {/* Section A: Studio & Photographer Info Form */}
            <div className="p-6 rounded-2xl bg-[#121215] border border-[#242429] space-y-6">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-rose-400" />
                <span>Perfil del Fotógrafo & Información del Estudio</span>
              </h2>

              <form onSubmit={handleSaveStudioConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">NOMBRE DEL FOTÓGRAFO</label>
                  <input
                    type="text"
                    value={studioForm.photographerName}
                    onChange={(e) => setStudioForm({ ...studioForm, photographerName: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">NOMBRE DEL ESTUDIO / ATELIER</label>
                  <input
                    type="text"
                    value={studioForm.studioName}
                    onChange={(e) => setStudioForm({ ...studioForm, studioName: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-mono-data text-zinc-400 mb-1">BIOGRAFÍA Y MANIFIESTO ARTÍSTICO</label>
                  <textarea
                    rows={3}
                    value={studioForm.bio}
                    onChange={(e) => setStudioForm({ ...studioForm, bio: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">CORREO ELECTRÓNICO PROFESIONAL</label>
                  <input
                    type="email"
                    value={studioForm.email}
                    onChange={(e) => setStudioForm({ ...studioForm, email: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">WHATSAPP DIRECTO</label>
                  <input
                    type="text"
                    value={studioForm.whatsapp}
                    onChange={(e) => setStudioForm({ ...studioForm, whatsapp: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors"
                  >
                    Guardar Cambios de Perfil
                  </button>
                </div>
              </form>
            </div>

            {/* Section B: Portfolio Works Manager */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Obras en Portafolio</h3>
                  <p className="text-xs text-zinc-400">
                    Administre las fotografías y videos de autor expuestos en la galería principal.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingPortfolioItem(null);
                    setShowAddPortfolioModal(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-zinc-100/10 hover:bg-zinc-100/20 border border-zinc-700 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Nueva Obra</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#121215] border border-[#242429] flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 text-[10px] font-mono-data bg-black/70 px-2 py-0.5 rounded text-white border border-white/10">
                          {item.aspectRatio} · {item.mediaType}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] font-mono-data text-zinc-400">
                        Categoría: {categoriesList.find((c) => c.id === item.category)?.label || item.category} · {item.year}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                      <button
                        onClick={() => handleDeletePortfolioItem(item.id)}
                        className="p-1.5 text-rose-400 hover:text-white rounded transition-colors"
                        title="Eliminar obra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-rose-500" />
                  <span>Gestión de Categorías & Clasificación</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Administre sus 4 especialidades principales y agregue nuevas categorías para clasificar todas las obras del estudio.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({
                    id: '',
                    label: '',
                    description: '',
                    isCore: false,
                    order: categoriesList.length + 1,
                    coverImage: '',
                  });
                  setShowAddCategoryModal(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-lg shadow-rose-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Nueva Categoría</span>
              </button>
            </div>

            {/* Core 4 vs Additional Categories Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categoriesList.map((cat, idx) => {
                const count = portfolioItems.filter((p) => p.category === cat.id).length;
                return (
                  <div
                    key={cat.id}
                    className={`p-5 rounded-2xl bg-[#121215] border flex flex-col justify-between gap-3 ${
                      cat.isCore
                        ? 'border-rose-900/40 bg-gradient-to-b from-rose-950/20 to-[#121215]'
                        : 'border-[#242429]'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-data uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          ID: {cat.id}
                        </span>
                        {cat.isCore ? (
                          <span className="text-[10px] font-mono-data uppercase px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
                            Pilar Fuerte · Protegido
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono-data uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                            Categoría Adicional
                          </span>
                        )}
                      </div>

                      {cat.coverImage && (
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black/60">
                          <img
                            src={cat.coverImage}
                            alt={cat.label}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <h3 className="font-display text-base font-bold text-white">
                        {cat.label}
                      </h3>

                      <p className="text-xs text-zinc-400 font-light leading-relaxed line-clamp-3">
                        {cat.description || 'Sin descripción ingresada.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono-data">
                      <span className="text-zinc-400">
                        {count} {count === 1 ? 'obra clasificada' : 'obras clasificadas'}
                      </span>

                      {!cat.isCore && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 text-rose-400 hover:text-white rounded transition-colors"
                          title="Eliminar categoría adicional"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: OFFERS & ANNOUNCEMENTS MANAGEMENT */}
        {activeTab === 'offers' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  <span>Panel de Ofertas & Anuncios del Estudio</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Modifique las ofertas exclusivas, promociones para Culiacán y anuncios destacados visibles en la web principal.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono-data px-2.5 py-1 rounded-full border font-semibold ${
                    announcementForm.isActive
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {announcementForm.isActive ? '● Oferta Publicada & Activa' : '○ Oferta Pausada'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Settings */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-[#121215] border border-[#242429] space-y-5">
                <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <div>
                      <span className="font-semibold text-white block">Estado del Anuncio / Oferta</span>
                      <span className="text-[11px] text-zinc-400">
                        {announcementForm.isActive
                          ? 'Visible en el banner superior y en el panel destacado de la página principal.'
                          : 'Oculto para todos los visitantes del sitio web.'}
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.isActive}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, isActive: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        ETIQUETA SUPERIOR (BADGE)
                      </label>
                      <input
                        type="text"
                        value={announcementForm.badge}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, badge: e.target.value })
                        }
                        placeholder="ej. OFERTA EXCLUSIVA · CULIACÁN"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        CÓDIGO DE DESCUENTO O PROMOCIÓN
                      </label>
                      <input
                        type="text"
                        value={announcementForm.discountCode || ''}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, discountCode: e.target.value })
                        }
                        placeholder="ej. CULIACAN2026"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 uppercase font-mono-data"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono-data text-zinc-400 mb-1">
                      TÍTULO PRINCIPAL DE LA OFERTA
                    </label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, title: e.target.value })
                      }
                      placeholder="ej. Temporada de Bodas 2026/2027: 15% de Descuento"
                      className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 text-sm font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-mono-data text-zinc-400 mb-1">
                      MENSAJE DESCRIPTIVO
                    </label>
                    <textarea
                      rows={3}
                      value={announcementForm.message}
                      onChange={(e) =>
                        setAnnouncementForm({ ...announcementForm, message: e.target.value })
                      }
                      placeholder="Describa el beneficio o la promoción..."
                      className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        FECHA LÍMITE DE VIGENCIA
                      </label>
                      <input
                        type="text"
                        value={announcementForm.validUntil || ''}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, validUntil: e.target.value })
                        }
                        placeholder="ej. 30 de Noviembre, 2026"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        TEXTO DEL BOTÓN (CTA)
                      </label>
                      <input
                        type="text"
                        value={announcementForm.ctaText}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, ctaText: e.target.value })
                        }
                        placeholder="ej. Aprovechar Oferta"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        ACCIÓN DEL BOTÓN
                      </label>
                      <select
                        value={announcementForm.ctaAction}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            ctaAction: e.target.value as any,
                          })
                        }
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="contact">Abrir Formulario de Contacto</option>
                        <option value="whatsapp">Enviar Mensaje de WhatsApp</option>
                        <option value="chatbot">Abrir Asistente Virtual 24/7</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        TEMA CROMÁTICO
                      </label>
                      <select
                        value={announcementForm.theme}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            theme: e.target.value as any,
                          })
                        }
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="rose">Rosa Atelier (Firma CADSTUDIO)</option>
                        <option value="amber">Ámbar Dorado (Edición Especial)</option>
                        <option value="emerald">Esmeralda (Temporada / Disponible)</option>
                        <option value="blue">Azul Cine (Promoción Audiovisual)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        DETALLES ADICIONALES / CONDICIONES
                      </label>
                      <input
                        type="text"
                        value={announcementForm.details || ''}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, details: e.target.value })
                        }
                        placeholder="ej. Válido para coberturas en Culiacán y Sinaloa"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        IMAGEN DE LA PROMOCIÓN (URL / FOTOGRAFÍA ATRACTIVA)
                      </label>
                      <input
                        type="text"
                        value={announcementForm.imageUrl || ''}
                        onChange={(e) =>
                          setAnnouncementForm({ ...announcementForm, imageUrl: e.target.value })
                        }
                        placeholder="ej. /src/assets/images/hero_photographer_cinematic_1790312865168.jpg o URL web"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574] text-xs font-mono-data"
                      />
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono-data text-zinc-500">Imágenes sugeridas del estudio:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setAnnouncementForm({
                              ...announcementForm,
                              imageUrl: '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg',
                            })
                          }
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-[#2B7574]/40 text-[10px] text-zinc-300 border border-zinc-700"
                        >
                          Bodas de Autor
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAnnouncementForm({
                              ...announcementForm,
                              imageUrl: '/src/assets/images/gastronomy_culinary_fineart_1790315306551.jpg',
                            })
                          }
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-[#2B7574]/40 text-[10px] text-zinc-300 border border-zinc-700"
                        >
                          Gastronomía
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setAnnouncementForm({
                              ...announcementForm,
                              imageUrl: '/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg',
                            })
                          }
                          className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-[#2B7574]/40 text-[10px] text-zinc-300 border border-zinc-700"
                        >
                          Retrato Editorial
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-semibold text-white bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors shadow-lg shadow-[#0E2931]/60 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios de Oferta & Publicar</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Real-time Preview Panel */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-mono-data text-zinc-400 font-semibold block uppercase tracking-wider">
                  VISTA PREVIA EN VIVO
                </span>

                {/* Banner Preview */}
                <div className="p-3 rounded-xl bg-[#0e0e11] border border-zinc-800 text-xs space-y-2">
                  <span className="text-[10px] font-mono-data text-zinc-500 block">
                    1. Aspecto en el Banner Superior:
                  </span>
                  <div className="py-2 px-3 rounded-lg bg-zinc-900 text-zinc-200 flex items-center justify-between text-[11px] gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[9px] font-mono-data uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold shrink-0">
                        {announcementForm.badge || 'OFERTA'}
                      </span>
                      <span className="truncate">{announcementForm.title}</span>
                    </div>
                    <span className="text-rose-400 font-semibold shrink-0">
                      {announcementForm.ctaText} →
                    </span>
                  </div>
                </div>

                {/* Panel Preview */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161214] via-[#101012] to-[#121214] border border-zinc-800 space-y-3">
                  <span className="text-[10px] font-mono-data text-zinc-500 block">
                    2. Aspecto en el Panel Destacado de Inicio:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono-data uppercase px-2 py-0.5 rounded-full border border-rose-500/40 text-rose-300 bg-rose-500/10 font-bold">
                      {announcementForm.badge || 'OFERTA'}
                    </span>
                    {announcementForm.discountCode && (
                      <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300">
                        CÓDIGO: {announcementForm.discountCode}
                      </span>
                    )}
                    {announcementForm.validUntil && (
                      <span className="text-[10px] font-mono-data text-zinc-400">
                        Vigente hasta {announcementForm.validUntil}
                      </span>
                    )}
                  </div>

                  <h4 className="font-display text-base font-bold text-white">
                    {announcementForm.title || 'Título de la oferta'}
                  </h4>

                  <p className="text-xs text-zinc-400 leading-relaxed font-light">
                    {announcementForm.message || 'Mensaje de la promoción...'}
                  </p>

                  {announcementForm.details && (
                    <p className="text-[11px] font-mono-data text-zinc-500">
                      * {announcementForm.details}
                    </p>
                  )}

                  {announcementForm.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-zinc-700 aspect-[16/9] bg-zinc-900">
                      <img
                        src={announcementForm.imageUrl}
                        alt="Vista previa de la oferta"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#2B7574] rounded-xl"
                    >
                      {announcementForm.ctaText || 'Aprovechar Oferta'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: DISCOVERY SESSIONS VIA GOOGLE CALENDAR */}
        {activeTab === 'discovery-sessions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-blue-400" />
                  <span>Sesiones de Descubrimiento (Google Calendar)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Citas de asesoría técnica agendadas directamente por los clientes según la disponibilidad del estudio en Culiacán.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 text-xs font-semibold text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/60 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Google Calendar</span>
                </a>
              </div>
            </div>

            {discoveryBookings.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#121215] border border-zinc-800/80 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  No hay sesiones de descubrimiento agendadas aún
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Cuando los clientes seleccionen un horario disponible en el formulario de la página principal, sus citas se sincronizarán en tiempo real con Google Calendar y aparecerán aquí con sus enlaces de Google Meet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveryBookings.map((session) => (
                  <div
                    key={session.id}
                    className="p-5 rounded-2xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono-data px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold uppercase">
                          {session.shootType}
                        </span>

                        <span
                          className={`text-[10px] font-mono-data px-2.5 py-0.5 rounded-full border font-semibold ${
                            session.status === 'confirmed'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                              : session.status === 'cancelled'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {session.status === 'confirmed'
                            ? '● Confirmada en Agenda'
                            : session.status === 'cancelled'
                            ? '✕ Cancelada'
                            : 'Pendiente'}
                        </span>
                      </div>

                      {/* Client Header */}
                      <div>
                        <h4 className="font-display text-base font-bold text-white">
                          {session.clientName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1 font-mono-data">
                          <span>{session.clientEmail}</span>
                          {session.clientPhone && <span>· {session.clientPhone}</span>}
                        </div>
                      </div>

                      {/* Date & Time Slot */}
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-mono-data">FECHA:</span>
                          <span className="font-semibold text-white">{session.date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-mono-data">HORARIO:</span>
                          <span className="font-semibold text-rose-400 font-mono-data">
                            {session.startTime} - {session.endTime} (GMT-7 Culiacán)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-mono-data">MODALIDAD:</span>
                          <span className="text-zinc-300 font-medium">
                            {session.format === 'google_meet'
                              ? 'Google Meet (Videollamada)'
                              : session.format === 'in_person'
                              ? 'Presencial en CADSTUDIO'
                              : 'Llamada telefónica'}
                          </span>
                        </div>
                      </div>

                      {session.notes && (
                        <p className="text-xs text-zinc-400 italic bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/60">
                          "{session.notes}"
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {session.meetLink && session.format === 'google_meet' && (
                          <a
                            href={session.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Entrar a Google Meet</span>
                          </a>
                        )}

                        {session.htmlLink && (
                          <a
                            href={session.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors flex items-center gap-1"
                            title="Ver evento en Google Calendar"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ver en Calendar</span>
                          </a>
                        )}
                      </div>

                      {session.clientPhone && (
                        <a
                          href={`https://wa.me/${session.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hola ${session.clientName}, le saluda Mateo Valenzuela de CADSTUDIO respecto a nuestra sesión de descubrimiento agendada para el ${session.date} a las ${session.startTime}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="space-y-8">
            {/* KPI Metric Blocks (Zero Pill Discipline) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#121215] border border-[#242429]">
                <span className="block text-xs font-mono-data text-zinc-400">VISITAS TOTALES WEB</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-data text-white block mt-1">
                  {stats.totalVisits.toLocaleString('es-ES')}
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">+18% este mes</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#121215] border border-[#242429]">
                <span className="block text-xs font-mono-data text-zinc-400">VISITAS A LINKS PRIVADOS</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-data text-rose-400 block mt-1">
                  {stats.clientViews.toLocaleString('es-ES')}
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Acceso seguro con token/PIN</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#121215] border border-[#242429]">
                <span className="block text-xs font-mono-data text-zinc-400">DESCARGAS ORIGINALES MASTER</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-data text-emerald-400 block mt-1">
                  {stats.totalDownloads.toLocaleString('es-ES')}
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">100% Calidad sin compresión</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#121215] border border-[#242429]">
                <span className="block text-xs font-mono-data text-zinc-400">GALERÍAS DE CLIENTES ACTIVAS</span>
                <span className="text-2xl sm:text-3xl font-bold font-mono-data text-white block mt-1">
                  {galleries.length}
                </span>
                <span className="text-[11px] text-zinc-400 mt-1 block">Con seguimiento de estado</span>
              </div>
            </div>

            {/* Monthly Trend & Category Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Downloads Bar Visualization */}
              <div className="p-6 rounded-2xl bg-[#121215] border border-[#242429] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Evolución Mensual de Descargas Master</h3>
                  <span className="text-xs font-mono-data text-zinc-500">Últimos 5 meses</span>
                </div>

                <div className="h-44 flex items-end gap-4 pt-4 border-b border-zinc-800">
                  {stats.monthlyDownloads.map((m) => {
                    const maxVal = 200;
                    const heightPercent = Math.min((m.count / maxVal) * 100, 100);

                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-mono-data text-zinc-400 group-hover:text-white transition-colors">
                          {m.count}
                        </span>
                        <div className="w-full bg-zinc-900 rounded-t-lg h-32 flex items-end overflow-hidden">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-rose-600/80 group-hover:bg-rose-500 transition-all rounded-t"
                          />
                        </div>
                        <span className="text-[11px] font-mono-data text-zinc-400">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-6 rounded-2xl bg-[#121215] border border-[#242429] space-y-4">
                <h3 className="text-sm font-bold text-white">Visualizaciones por Género Visual</h3>

                <div className="space-y-3 pt-2">
                  {stats.categoryEngagement.map((cat) => {
                    const max = 6000;
                    const pct = Math.round((cat.views / max) * 100);

                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono-data">
                          <span className="text-zinc-300">{cat.category}</span>
                          <span className="text-zinc-500">{cat.views.toLocaleString('es-ES')} vistas</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Export Actions Banner */}
            <div className="p-6 rounded-2xl bg-[#141418] border border-zinc-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Descarga de Informes Mensuales</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Generación instantánea del informe formal de auditoría con desglose de entregas y descargas.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => exportMonthlyReportPDF(studioConfig, stats, galleries, activities)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-rose-950/40"
                >
                  <FileText className="w-4 h-4" />
                  <span>Exportar Informe en PDF</span>
                </button>

                <button
                  onClick={() => exportMonthlyReportExcel(studioConfig, stats, galleries, activities)}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Exportar Datos en Excel (.XLSX)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REAL-TIME ACTIVITY STREAM */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Registro de Actividad en Tiempo Real</h2>
                <p className="text-xs text-zinc-400">
                  Notificaciones automáticas ante accesos de clientes, descargas master y selecciones de fotos.
                </p>
              </div>

              <button
                onClick={handleSimulateClientActivity}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 border border-amber-600/50 rounded-lg hover:bg-amber-900/40 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simular Evento</span>
              </button>
            </div>

            <div className="divide-y divide-zinc-800/80 rounded-2xl bg-[#121215] border border-[#242429] overflow-hidden">
              {activities.map((act) => (
                <div key={act.id} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-zinc-900/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{act.title}</span>
                      {act.clientName && (
                        <span className="text-[11px] font-mono-data text-rose-400">
                          · {act.clientName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{act.description}</p>
                  </div>

                  <span className="text-[10px] font-mono-data text-zinc-500 shrink-0">
                    {act.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: BOT KNOWLEDGE & TRAINING */}
        {activeTab === 'bot-knowledge' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-rose-500" />
                  <span>Entrenamiento & Base de Conocimiento del Asistente IA</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Enseñe a su asistente virtual las tarifas, directrices, tiempos de entrega y políticas de CADSTUDIO mediante documentos o conversando directamente con él.
                </p>
              </div>

              {/* Sub-mode selector */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                  onClick={() => setKnowledgeMode('docs')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    knowledgeMode === 'docs'
                      ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Documentos & Archivos ({botKnowledgeList.length})</span>
                </button>
                <button
                  onClick={() => setKnowledgeMode('tutor')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                    knowledgeMode === 'tutor'
                      ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Hablar con el Bot (Tutor & Pruebas)</span>
                </button>
              </div>
            </div>

            {knowledgeMode === 'docs' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form to upload file or write document */}
                <div className="lg:col-span-5 p-5 rounded-2xl bg-[#121215] border border-[#242429] space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileUp className="w-4 h-4 text-rose-400" />
                      <span>{editingKnowledgeId ? 'Editar Documento' : 'Subir o Redactar Información'}</span>
                    </h3>
                    {editingKnowledgeId && (
                      <button
                        onClick={() => {
                          setEditingKnowledgeId(null);
                          setDocTitle('');
                          setDocContent('');
                        }}
                        className="text-xs text-zinc-400 hover:text-white underline"
                      >
                        Cancelar Edición
                      </button>
                    )}
                  </div>

                  {/* Upload file trigger */}
                  <div className="p-3.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 hover:border-rose-500/60 transition-colors text-center">
                    <label className="cursor-pointer block space-y-1.5">
                      <input
                        type="file"
                        accept=".txt,.md,.json,.pdf,.csv,.doc,.docx"
                        onChange={handleUploadDocumentFile}
                        className="hidden"
                      />
                      <div className="w-8 h-8 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <p className="text-xs font-medium text-zinc-200">
                        Subir archivo con información del negocio
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono-data">
                        Soporta .txt, .md, .json, .csv (extracción automática de texto)
                      </p>
                    </label>
                  </div>

                  <form onSubmit={handleSaveDocumentKnowledge} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">TÍTULO DEL CONOCIMIENTO</label>
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="ej. Paquete Boda Destino Italia 2027"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">CATEGORÍA</label>
                      <select
                        value={docCategory}
                        onChange={(e) => setDocCategory(e.target.value as any)}
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="precios">Precios & Tarifas</option>
                        <option value="politicas">Políticas & Formas de Pago</option>
                        <option value="equipamiento">Equipamiento Técnico & Cámaras</option>
                        <option value="servicios">Servicios & Coberturas</option>
                        <option value="faq">Preguntas Frecuentes (FAQ)</option>
                        <option value="instrucciones">Instrucciones de Tono & Respuestas</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">CONTENIDO & DIRECTRICES</label>
                      <textarea
                        rows={6}
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        placeholder="Escriba las instrucciones, precios, condiciones, detalles o notas que el bot debe memorizar..."
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 leading-relaxed font-sans"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingDoc}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{editingKnowledgeId ? 'Guardar Cambios' : 'Guardar en Base de Datos & Conectar'}</span>
                    </button>
                  </form>
                </div>

                {/* Right: Knowledge items list */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono-data text-zinc-400">
                      DOCUMENTOS MEMORIZADOS POR EL BOT ({botKnowledgeList.length})
                    </span>
                    <span className="text-[11px] font-mono-data text-emerald-400">
                      Sincronizado con Firestore
                    </span>
                  </div>

                  <div className="space-y-3">
                    {botKnowledgeList.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all ${
                          item.isActive
                            ? 'bg-[#121215] border-[#242429]'
                            : 'bg-zinc-950/60 border-zinc-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-mono-data uppercase px-2 py-0.5 rounded font-medium ${
                                  item.category === 'precios'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : item.category === 'politicas'
                                    ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                    : item.category === 'equipamiento'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                    : 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                }`}
                              >
                                {item.category}
                              </span>
                              <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                            </div>
                            <p className="text-xs text-zinc-400 mt-2 whitespace-pre-line leading-relaxed line-clamp-4">
                              {item.content}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Toggle active */}
                            <button
                              onClick={() => handleToggleKnowledgeActive(item.id, item.isActive)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                item.isActive
                                  ? 'bg-emerald-950/30 text-emerald-400 border-emerald-600/40'
                                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                              }`}
                              title={item.isActive ? 'Desactivar conocimiento' : 'Activar conocimiento'}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingKnowledgeId(item.id);
                                setDocTitle(item.title);
                                setDocCategory(item.category);
                                setDocContent(item.content);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                              title="Editar este conocimiento"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteKnowledgeItem(item.id)}
                              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/50 border border-zinc-700 hover:border-rose-600/50 text-zinc-400 hover:text-rose-400 transition-colors"
                              title="Eliminar conocimiento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Tutor / Coach Interactive Chat */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 p-5 rounded-2xl bg-[#121215] border border-[#242429] flex flex-col h-[580px]">
                  <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white">Consola de Entrenamiento Directo</h3>
                        <p className="text-[11px] text-zinc-400">
                          Hable con el bot como administrador para enseñarle o evaluar sus respuestas
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setTutorMessages([
                          {
                            role: 'assistant',
                            content: 'Sesión reiniciada. ¿Qué nueva directriz o información deseas enseñarme?',
                            timestamp: 'Ahora',
                          },
                        ])
                      }
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Limpiar chat</span>
                    </button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-2">
                    {tutorMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-3 text-xs leading-relaxed ${
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="w-6 h-6 rounded-full bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="w-3 h-3" />
                          </div>
                        )}
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 whitespace-pre-line ${
                            msg.role === 'user'
                              ? 'bg-rose-600 text-white'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                          }`}
                        >
                          {msg.content}
                          <span className="block text-[10px] mt-1 opacity-60 text-right">
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                    {isTutorLoading && (
                      <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        <span>El bot está asimilando la instrucción...</span>
                      </div>
                    )}
                  </div>

                  {/* Suggested knowledge draft alert if detected */}
                  {suggestedKnowledge && (
                    <div className="mb-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 animate-in fade-in">
                      <div className="text-xs">
                        <span className="font-semibold text-amber-300 block">¿Guardar esta regla permanentemente?</span>
                        <span className="text-zinc-300 text-[11px] truncate block max-w-md">{suggestedKnowledge.title}</span>
                      </div>
                      <button
                        onClick={handleSaveSuggestedDraft}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition-colors shrink-0"
                      >
                        Guardar en BD
                      </button>
                    </div>
                  )}

                  {/* Input Form */}
                  <div className="pt-3 border-t border-zinc-800 flex items-center gap-2">
                    <input
                      type="text"
                      value={tutorInput}
                      onChange={(e) => setTutorInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendTutorMessage()}
                      placeholder="Escribe una instrucción (ej. 'En 2027 cobramos 300€ de suplemento de viaje fuera de Madrid')..."
                      className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-rose-500"
                    />
                    <button
                      onClick={handleSendTutorMessage}
                      disabled={isTutorLoading || !tutorInput.trim()}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Instruir</span>
                    </button>
                  </div>
                </div>

                {/* Right: Quick Prompts & Training Tips */}
                <div className="lg:col-span-4 p-5 rounded-2xl bg-[#121215] border border-[#242429] space-y-4 text-xs">
                  <h3 className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rose-400" />
                    <span>Ejemplos de Instrucciones</span>
                  </h3>
                  <div className="space-y-2">
                    {[
                      'Si un cliente pregunta por bodas en el extranjero, explícale que incluimos gastos de viaje en el paquete Weekend.',
                      'Para proyectos de arquitectura, destaca que utilizamos cámaras de formato medio Hasselblad y objetivos descentrables tilt-shift.',
                      'Recuerda que no cobramos recargo por entrega en formato RAW original.',
                      'Prueba: ¿Qué le responderías a un cliente que tiene un presupuesto de 1.500€ para una boda?',
                    ].map((example, idx) => (
                      <button
                        key={idx}
                        onClick={() => setTutorInput(example)}
                        className="w-full text-left p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CLIENT CONVERSATIONS & CHAT HISTORY */}
        {activeTab === 'chat-history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessagesSquare className="w-5 h-5 text-blue-400" />
                  <span>Historial de Pláticas con Clientes (Base de Datos)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Registro completo de pláticas mantenidas entre los clientes y el bot virtual 24/7, guardadas en Firestore.
                </p>
              </div>

              {/* Refresh from database button */}
              <button
                onClick={() => setConversationsList(getClientConversations())}
                className="px-3 py-1.5 text-xs text-zinc-300 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Actualizar Historial</span>
              </button>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-[#121215] border border-[#242429]">
                <span className="text-[10px] font-mono-data text-zinc-400 block uppercase">Total Pláticas</span>
                <span className="text-xl font-bold text-white mt-1 block">{conversationsList.length}</span>
              </div>
              <div className="p-4 rounded-xl bg-[#121215] border border-[#242429]">
                <span className="text-[10px] font-mono-data text-emerald-400 block uppercase">Presupuestos Solicitados</span>
                <span className="text-xl font-bold text-emerald-400 mt-1 block">
                  {conversationsList.filter((c) => c.leadStatus === 'presupuesto_solicitado').length}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#121215] border border-[#242429]">
                <span className="text-[10px] font-mono-data text-amber-400 block uppercase">Citas Propuestas</span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">
                  {conversationsList.filter((c) => c.leadStatus === 'cita_propuesta').length}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#121215] border border-[#242429]">
                <span className="text-[10px] font-mono-data text-blue-400 block uppercase">Mensajes Totales</span>
                <span className="text-xl font-bold text-blue-400 mt-1 block">
                  {conversationsList.reduce((acc, c) => acc + c.messages.length, 0)}
                </span>
              </div>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  placeholder="Buscar por cliente o mensaje..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 text-white rounded-lg text-xs focus:outline-none focus:border-rose-500 font-mono-data"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['todos', 'presupuesto_solicitado', 'cita_propuesta', 'nuevo', 'resuelto'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setChatFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono-data uppercase whitespace-nowrap ${
                      chatFilter === st
                        ? 'bg-zinc-100 text-zinc-900 font-semibold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversations List */}
            <div className="space-y-3">
              {conversationsList
                .filter((conv) => {
                  const matchStatus = chatFilter === 'todos' || conv.leadStatus === chatFilter;
                  const matchQuery =
                    !chatSearchQuery.trim() ||
                    conv.clientName.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                    conv.messages.some((m) => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()));
                  return matchStatus && matchQuery;
                })
                .map((conv) => {
                  const lastMessage = conv.messages[conv.messages.length - 1];

                  return (
                    <div
                      key={conv.id || conv.sessionId}
                      className="p-5 rounded-2xl bg-[#121215] border border-[#242429] hover:border-zinc-700 transition-colors flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white truncate">{conv.clientName}</h3>
                          <span
                            className={`text-[10px] font-mono-data uppercase px-2 py-0.5 rounded font-medium ${
                              conv.leadStatus === 'presupuesto_solicitado'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : conv.leadStatus === 'cita_propuesta'
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {conv.leadStatus ? conv.leadStatus.replace('_', ' ') : 'consulta'}
                          </span>
                          <span className="text-[11px] font-mono-data text-zinc-500 hidden sm:inline">
                            · {conv.sessionId}
                          </span>
                        </div>

                        {conv.summary && (
                          <p className="text-xs text-zinc-300 line-clamp-1">{conv.summary}</p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] font-mono-data text-zinc-400">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{new Date(conv.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <span aria-hidden="true">·</span>
                          <span>{conv.messages.length} mensajes intercambiados</span>
                          {lastMessage && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-zinc-500 truncate max-w-xs">
                                Último: "{lastMessage.content.substring(0, 45)}..."
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelectedConversation(conv)}
                          className="px-3.5 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Transcripción</span>
                        </button>

                        <button
                          onClick={() => handleDeleteConversationItem(conv.id || conv.sessionId)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/50 border border-zinc-700 hover:border-rose-600/50 text-zinc-400 hover:text-rose-400 transition-colors"
                          title="Eliminar plática"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Client */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-display text-lg font-bold text-white">
                {editingClient ? 'Modificar Galería de Cliente' : 'Nueva Galería de Entrega Privada'}
              </h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">NOMBRE DEL CLIENTE</label>
                  <input
                    type="text"
                    value={clientForm.clientName}
                    onChange={(e) => setClientForm({ ...clientForm, clientName: e.target.value })}
                    placeholder="ej. Valeria Ramos"
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">EMAIL DEL CLIENTE</label>
                  <input
                    type="email"
                    value={clientForm.clientEmail}
                    onChange={(e) => setClientForm({ ...clientForm, clientEmail: e.target.value })}
                    placeholder="valeria@email.com"
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">TÍTULO DEL PROYECTO / SESIÓN</label>
                <input
                  type="text"
                  value={clientForm.title}
                  onChange={(e) => setClientForm({ ...clientForm, title: e.target.value })}
                  placeholder="ej. Campaña Colección Atelier Otoño/Invierno"
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">SUBTÍTULO / DESCRIPCIÓN BREVE</label>
                <input
                  type="text"
                  value={clientForm.subtitle}
                  onChange={(e) => setClientForm({ ...clientForm, subtitle: e.target.value })}
                  placeholder="ej. Sesión Editorial en Estudio & Exterior"
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">TOKEN ENLACE PRIVADO</label>
                  <input
                    type="text"
                    value={clientForm.token}
                    onChange={(e) => setClientForm({ ...clientForm, token: e.target.value })}
                    placeholder="ej. valeria-haute-2026"
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 font-mono-data"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">CÓDIGO PIN (OPCIONAL)</label>
                  <input
                    type="text"
                    value={clientForm.pin}
                    onChange={(e) => setClientForm({ ...clientForm, pin: e.target.value })}
                    placeholder="ej. 2026"
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 font-mono-data"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">FECHA EVENTO</label>
                  <input
                    type="date"
                    value={clientForm.eventDate}
                    onChange={(e) => setClientForm({ ...clientForm, eventDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">FECHA VENCIMIENTO</label>
                  <input
                    type="date"
                    value={clientForm.expiryDate}
                    onChange={(e) => setClientForm({ ...clientForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">LÍMITE SELECCIÓN</label>
                  <input
                    type="number"
                    value={clientForm.selectionLimit}
                    onChange={(e) => setClientForm({ ...clientForm, selectionLimit: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl"
                >
                  Guardar Galería
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Portfolio Item */}
      {showAddPortfolioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-display text-lg font-bold text-white">
                Añadir Obra al Portafolio
              </h3>
              <button
                onClick={() => setShowAddPortfolioModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePortfolioItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">TÍTULO DE LA OBRA</label>
                <input
                  type="text"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="ej. Silueta en Chiaroscuro"
                  className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">CATEGORÍA</label>
                  <select
                    value={portfolioForm.category}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value as any })}
                    className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} {cat.isCore ? '(Pilar Fuerte)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">FORMATO (ASPECT RATIO)</label>
                  <select
                    value={portfolioForm.aspectRatio}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, aspectRatio: e.target.value as AspectRatio })}
                    className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="3:4">3:4 (Retrato)</option>
                    <option value="16:9">16:9 (Panorámico)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="1:1">1:1 (Cuadrado)</option>
                    <option value="4:3">4:3 (Clásico)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">TIPO DE MEDIO</label>
                  <select
                    value={portfolioForm.mediaType}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, mediaType: e.target.value as MediaType })}
                    className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="image">Fotografía de Alta Resolución</option>
                    <option value="video">Video de Alta Resolución</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">AÑO</label>
                  <input
                    type="text"
                    value={portfolioForm.year}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, year: e.target.value })}
                    className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {portfolioForm.mediaType === 'video' && (
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">URL DEL VIDEO (.MP4)</label>
                  <input
                    type="text"
                    value={portfolioForm.videoSrc}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, videoSrc: e.target.value })}
                    placeholder="https://.../video.mp4"
                    className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">CÁMARA / SENSOR EXIF</label>
                <input
                  type="text"
                  value={portfolioForm.camera}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, camera: e.target.value })}
                  placeholder="ej. Leica SL2-S o Hasselblad"
                  className="w-full p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddPortfolioModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl"
                >
                  Añadir Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-500" />
                <span>{editingCategory ? 'Editar Categoría' : 'Añadir Nueva Categoría'}</span>
              </h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">NOMBRE DE LA CATEGORÍA</label>
                <input
                  type="text"
                  value={categoryForm.label}
                  onChange={(e) => setCategoryForm({ ...categoryForm, label: e.target.value })}
                  placeholder="ej. Campañas Comerciales & Moda"
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">IDENTIFICADOR / SLUG (URL)</label>
                <input
                  type="text"
                  value={categoryForm.id}
                  onChange={(e) => setCategoryForm({ ...categoryForm, id: e.target.value })}
                  placeholder="ej. comercial (automático si se deja vacío)"
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 font-mono-data"
                />
              </div>

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">DESCRIPCIÓN</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Breve descripción del enfoque visual de esta categoría..."
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">IMAGEN DE PORTADA (URL)</label>
                <input
                  type="text"
                  value={categoryForm.coverImage}
                  onChange={(e) => setCategoryForm({ ...categoryForm, coverImage: e.target.value })}
                  placeholder="https://... o /src/assets/..."
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-rose-950/40"
                >
                  Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Subir Fotos a Galería de Cliente */}
      {showUploadModal && uploadTargetGallery && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-rose-500" />
                  <span>Subir Fotos a Galería: {uploadTargetGallery.clientName}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Los archivos se guardarán directamente en calidad original master en la base de datos de esta entrega.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setPreviewFilesToAdd([]);
                }}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Local file dropzone */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:border-rose-500/70 transition-colors text-center">
              <label className="cursor-pointer block space-y-2">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleLocalFilesSelected}
                  className="hidden"
                />
                <div className="w-10 h-10 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">
                  {isProcessingLocalFiles ? 'Procesando archivos locales...' : 'Haz clic para seleccionar fotos locales desde tu computadora'}
                </p>
                <p className="text-xs text-zinc-500 font-mono-data">
                  Soporta formatos RAW, JPG, TIFF, PNG y Video MP4 en máxima resolución
                </p>
              </label>
            </div>

            {/* Manual entry / URL alternative */}
            <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3">
              <span className="text-xs font-mono-data text-zinc-400 block font-semibold">
                O AÑADIR ARCHIVO MEDIANTE URL / PRESET DE ESTUDIO
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">Título del archivo</label>
                  <input
                    type="text"
                    value={manualPhotoTitle}
                    onChange={(e) => setManualPhotoTitle(e.target.value)}
                    placeholder="ej. Sesion_01_RAW_Master"
                    className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">URL de la imagen o video</label>
                  <input
                    type="text"
                    value={manualPhotoUrl}
                    onChange={(e) => setManualPhotoUrl(e.target.value)}
                    placeholder="https://... o /src/assets/..."
                    className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Aspect Ratio</label>
                  <select
                    value={manualPhotoRatio}
                    onChange={(e) => setManualPhotoRatio(e.target.value as any)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="16:9">16:9 (Panorámico)</option>
                    <option value="3:4">3:4 (Retrato)</option>
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="1:1">1:1 (Cuadrado)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Tamaño estimado</label>
                  <input
                    type="text"
                    value={manualPhotoSize}
                    onChange={(e) => setManualPhotoSize(e.target.value)}
                    className="w-full p-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddManualQueueItem}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar a cola de subida</span>
              </button>
            </div>

            {/* Pending uploads queue */}
            {previewFilesToAdd.length > 0 && (
              <div className="space-y-2 border-t border-zinc-800 pt-3">
                <span className="text-xs font-mono-data text-emerald-400 font-semibold block">
                  ARCHIVOS LISTOS PARA SUBIR ({previewFilesToAdd.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {previewFilesToAdd.map((file, i) => (
                    <div key={file.id} className="relative group rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                      <img src={file.previewUrl} alt={file.title} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFromQueue(i)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-rose-400 hover:text-white"
                      >
                        ✕
                      </button>
                      <div className="p-1.5 text-[10px] font-mono-data text-zinc-300 truncate">
                        {file.title}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleConfirmAddPhotosToGallery}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar y Subir {previewFilesToAdd.length} Fotos a la Galería</span>
                </button>
              </div>
            )}

            {/* Existing photos in this gallery */}
            <div className="border-t border-zinc-800 pt-3 space-y-2">
              <span className="text-xs font-mono-data text-zinc-400 font-semibold block">
                FOTOS ACTUALES EN ESTA GALERÍA ({uploadTargetGallery.files.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                {uploadTargetGallery.files.map((f) => (
                  <div key={f.id} className="relative group rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                    <img src={f.previewUrl} alt={f.title} className="w-full h-20 object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeletePhotoFromGallery(f.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-zinc-400 hover:text-rose-400"
                      title="Eliminar de la galería"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="p-1.5 text-[10px] font-mono-data text-zinc-300 truncate">
                      {f.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Full Conversation Transcript */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <MessagesSquare className="w-5 h-5 text-blue-400" />
                  <span>Transcripción: {selectedConversation.clientName}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sesión iniciada el {new Date(selectedConversation.startedAt).toLocaleString()} ({selectedConversation.sessionId})
                </p>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Conversation message turn-by-turn */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 max-h-[480px]">
              {selectedConversation.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    m.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-blue-950/60 border border-blue-800 text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-rose-600 text-white rounded-tr-none'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none'
                    }`}
                  >
                    <span className="text-[10px] font-mono-data opacity-60 block mb-1">
                      {m.role === 'user' ? 'Cliente' : 'Asistente 24/7 CADSTUDIO'} · {m.timestamp}
                    </span>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono-data">
                Guardado en base de datos Firestore
              </span>
              <button
                onClick={() => handleDeleteConversationItem(selectedConversation.id || selectedConversation.sessionId)}
                className="px-3 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/50 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Plática</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Sync Modal */}
      <GoogleDriveSyncModal
        isOpen={showDriveSyncModal}
        onClose={() => setShowDriveSyncModal(false)}
        galleries={galleries}
        initialSelectedGalleryId={driveSyncGalleryId}
        onSyncComplete={() => {
          setGalleries(getClientGalleries());
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
