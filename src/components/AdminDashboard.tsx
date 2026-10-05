import React, { useState, useEffect } from 'react';
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
  StudioStats,
  CategoryClickStat,
  EmailNotificationLog,
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
  saveStats,
  trackCategoryClick,
  simulateCategoryClick,
  resetCategoryClicks,
  INITIAL_CATEGORY_CLICKS,
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
  updatePortfolioItem,
  reorderPortfolioItems,
  reorderClientGalleryFiles,
  updateAnyWebsitePhoto,
  togglePortfolioItemShowOnHome,
  togglePortfolioItemFeatured,
  getEmailNotificationLogs,
} from '../services/storageService';
import {
  generateStudioNotificationEmailHtml,
  generateClientConfirmationEmailHtml,
  resendBookingEmailNotification,
} from '../services/emailService';
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
  Star,
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
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Image as ImageIcon,
  MoveVertical,
  GripVertical,
  LayoutGrid,
  ArrowUpDown,
  SlidersHorizontal,
  MousePointerClick,
  TrendingUp,
  Trophy,
  ArrowUpRight,
  BarChart2,
  Mail,
  MailCheck,
  Inbox,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from 'recharts';
import { GoogleDriveSyncModal, DriveSyncMode } from './GoogleDriveSyncModal';
import { isFirebaseConnected } from '../services/storageService';
import {
  isDriveConnected,
  signInWithGoogleDrive,
  signOutDrive,
  getDriveCurrentUser,
} from '../services/googleDriveService';

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
  const [stats, setStats] = useState<StudioStats>(getStats());

  // AUTOMATED EMAIL NOTIFICATIONS STATE
  const [emailLogs, setEmailLogs] = useState<EmailNotificationLog[]>(getEmailNotificationLogs());
  const [selectedEmailForPreview, setSelectedEmailForPreview] = useState<{
    title: string;
    html: string;
    recipient: string;
    subject: string;
    sentAt: string;
  } | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState<boolean>(false);
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [showEmailLogsDrawer, setShowEmailLogsDrawer] = useState<boolean>(false);
  const [resendingBookingId, setResendingBookingId] = useState<string | null>(null);

  // RECHARTS CATEGORY CLICKS CHART STATE
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'pie'>('bar');
  const [chartSortOrder, setChartSortOrder] = useState<'desc' | 'alpha'>('desc');
  const [simulatedCategory, setSimulatedCategory] = useState<string>('bodas');
  const [simulateToast, setSimulateToast] = useState<string | null>(null);

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
  const [driveSyncMode, setDriveSyncMode] = useState<DriveSyncMode>('portfolio');
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

  // Google Drive & Client Gallery Editor state
  const [isDriveLinked, setIsDriveLinked] = useState<boolean>(isDriveConnected());
  const [driveUserEmail, setDriveUserEmail] = useState<string | null>(getDriveCurrentUser()?.email || null);
  const [isConnectingDrive, setIsConnectingDrive] = useState<boolean>(false);
  const [clientEditTab, setClientEditTab] = useState<'acomodo' | 'add_photos' | 'info'>('acomodo');
  const [draggedGalleryPhotoId, setDraggedGalleryPhotoId] = useState<string | null>(null);
  const [dragOverGalleryPhotoId, setDragOverGalleryPhotoId] = useState<string | null>(null);

  // Gmail (otro correo) SMTP state
  const [showSmtpConfigDrawer, setShowSmtpConfigDrawer] = useState<boolean>(false);
  const [smtpConfigForm, setSmtpConfigForm] = useState({
    user: '',
    pass: '',
    host: 'smtp.gmail.com',
    port: 465,
    from: 'CADSTUDIO Citas <notificaciones@cadstudio.mx>',
    studioRecipient: 'cadcad111.3@gmail.com',
  });
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    user?: string;
    isGmail?: boolean;
    host?: string;
    from?: string;
    studioRecipient?: string;
  } | null>(null);
  const [isSavingSmtp, setIsSavingSmtp] = useState<boolean>(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setIsDriveLinked(isDriveConnected());
    setDriveUserEmail(getDriveCurrentUser()?.email || null);

    fetch('/api/smtp-config')
      .then((res) => res.json())
      .then((data) => {
        setSmtpStatus(data);
        if (data.user) {
          setSmtpConfigForm((prev) => ({
            ...prev,
            user: data.user,
            from: data.from || prev.from,
            studioRecipient: data.studioRecipient || prev.studioRecipient,
            host: data.host || prev.host,
            port: data.port || prev.port,
          }));
        }
      })
      .catch((err) => console.warn('Could not load smtp-config:', err));
  }, []);

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const res = await signInWithGoogleDrive();
      if (res?.user) {
        setIsDriveLinked(true);
        setDriveUserEmail(res.user.email);
        setSaveSuccessMsg(`¡Google Drive conectado con éxito como ${res.user.email}!`);
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Error al conectar Google Drive:', err);
      setSaveSuccessMsg(`Aviso: ${err.message || 'No se pudo conectar Google Drive'}`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDisconnectDrive = async () => {
    await signOutDrive();
    setIsDriveLinked(false);
    setDriveUserEmail(null);
    setSaveSuccessMsg('Google Drive desconectado.');
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  const handleSaveSmtpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    setSmtpFeedback(null);
    try {
      const res = await fetch('/api/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(smtpConfigForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Error al validar credenciales de Gmail.');
      }
      setSmtpFeedback({ type: 'success', message: data.message || '¡Gmail conectado con éxito para otro correo!' });
      setSmtpStatus(data.config);
      setSaveSuccessMsg('Configuración de Gmail guardada y probada.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      setSmtpFeedback({ type: 'error', message: err.message || 'No se pudo conectar con Gmail. Verifique el correo y la contraseña de aplicación de 16 caracteres.' });
    } finally {
      setIsSavingSmtp(false);
    }
  };

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
    isFeatured: true,
  });

  // Form states for Studio Info
  const [studioForm, setStudioForm] = useState<StudioConfig>(studioConfig);

  // States for Photo & Video management across the website
  const [portfolioFilterCategory, setPortfolioFilterCategory] = useState<string>('all');
  const [portfolioSubTab, setPortfolioSubTab] = useState<'live_web' | 'works' | 'website_photos'>('live_web');
  const [portfolioLocationFilter, setPortfolioLocationFilter] = useState<'all' | 'home_only' | 'full_only' | 'hidden_only'>('all');
  const [showPhotoSwitcherModal, setShowPhotoSwitcherModal] = useState<boolean>(false);
  const [photoSwitcherTarget, setPhotoSwitcherTarget] = useState<{
    id: string;
    title: string;
    currentUrl: string;
    sectionName: string;
    mediaType?: MediaType;
  } | null>(null);
  const [photoSwitcherNewUrl, setPhotoSwitcherNewUrl] = useState<string>('');
  const [photoSwitcherMediaType, setPhotoSwitcherMediaType] = useState<MediaType>('image');
  const [isUploadingSwitcherFile, setIsUploadingSwitcherFile] = useState<boolean>(false);
  const [portfolioFileUploadPreview, setPortfolioFileUploadPreview] = useState<string | null>(null);

  // Graphical Drag-and-Drop state for Portfolio works
  const [draggedPortfolioId, setDraggedPortfolioId] = useState<string | null>(null);
  const [dragOverPortfolioId, setDragOverPortfolioId] = useState<string | null>(null);

  // Graphical Light-Table / Visual Reorder Board for Client Galleries
  const [visualReorderGallery, setVisualReorderGallery] = useState<ClientGallery | null>(null);
  const [draggedGalleryFileId, setDraggedGalleryFileId] = useState<string | null>(null);
  const [dragOverGalleryFileId, setDragOverGalleryFileId] = useState<string | null>(null);

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
            isFeatured: portfolioForm.isFeatured !== false,
            featured: portfolioForm.isFeatured !== false,
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
        isFeatured: portfolioForm.isFeatured !== false,
        featured: portfolioForm.isFeatured !== false,
        showOnHome: portfolioForm.isFeatured !== false,
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

  // REORDER PORTFOLIO WORKS (Up, Down, Top, Bottom)
  const handleMovePortfolioItem = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const index = portfolioItems.findIndex((p) => p.id === id);
    if (index === -1) return;
    const newItems = [...portfolioItems];
    if (direction === 'up' && index > 0) {
      const temp = newItems[index];
      newItems[index] = newItems[index - 1];
      newItems[index - 1] = temp;
    } else if (direction === 'down' && index < newItems.length - 1) {
      const temp = newItems[index];
      newItems[index] = newItems[index + 1];
      newItems[index + 1] = temp;
    } else if (direction === 'top') {
      const [item] = newItems.splice(index, 1);
      newItems.unshift(item);
    } else if (direction === 'bottom') {
      const [item] = newItems.splice(index, 1);
      newItems.push(item);
    }
    setPortfolioItems(newItems);
    savePortfolioItems(newItems);
    setSaveSuccessMsg('Acomodo de obras guardado correctamente.');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    if (onRefreshData) onRefreshData();
  };

  // Graphical Drag-and-Drop Drop Handler for Portfolio
  const handleDropPortfolioItem = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const sourceIndex = portfolioItems.findIndex((p) => p.id === sourceId);
    const targetIndex = portfolioItems.findIndex((p) => p.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newItems = [...portfolioItems];
    const [moved] = newItems.splice(sourceIndex, 1);
    newItems.splice(targetIndex, 0, moved);

    setPortfolioItems(newItems);
    savePortfolioItems(newItems);
    setSaveSuccessMsg(`Obra reubicada en posición #${targetIndex + 1}.`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    if (onRefreshData) onRefreshData();
  };

  // Direct Position Selector (e.g. Move directly to position #2)
  const handleSetPortfolioItemPosition = (id: string, newPositionOneBased: number) => {
    const currentIndex = portfolioItems.findIndex((p) => p.id === id);
    if (currentIndex === -1) return;
    const targetIndex = Math.max(0, Math.min(portfolioItems.length - 1, newPositionOneBased - 1));
    if (currentIndex === targetIndex) return;

    const newItems = [...portfolioItems];
    const [moved] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, moved);

    setPortfolioItems(newItems);
    savePortfolioItems(newItems);
    setSaveSuccessMsg(`Obra movida a la posición #${targetIndex + 1}.`);
    setTimeout(() => setSaveSuccessMsg(null), 2500);
    if (onRefreshData) onRefreshData();
  };

  // Toggle between Home Page visibility and Full Portfolio Only
  const handleTogglePortfolioHomeVisibility = (id: string) => {
    const updated = togglePortfolioItemShowOnHome(id);
    setPortfolioItems(updated);
    const it = updated.find((p) => p.id === id);
    const isNowOnHome = it?.showOnHome !== false;
    setSaveSuccessMsg(
      isNowOnHome
        ? `⭐ "${it?.title}" ahora se mostrará en la Página Principal.`
        : `📁 "${it?.title}" ahora solo se mostrará en el Portafolio Completo.`
    );
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    if (onRefreshData) onRefreshData();
  };

  // Toggle public portfolio visibility (isFeatured: true = public, false = hidden in admin)
  const handleTogglePortfolioFeatured = (id: string) => {
    const updated = togglePortfolioItemFeatured(id);
    setPortfolioItems(updated);
    const it = updated.find((p) => p.id === id);
    const isPublic = it?.isFeatured !== false;
    setSaveSuccessMsg(
      isPublic
        ? `🌐 "${it?.title}" ahora es visible en el portafolio público.`
        : `🔒 "${it?.title}" permanece oculta en el panel de administrador.`
    );
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    if (onRefreshData) onRefreshData();
  };

  // CLIENT GALLERY REORDER FUNCTIONS
  const handleMoveGalleryFile = (
    galleryId: string,
    fileId: string,
    direction: 'up' | 'down' | 'top' | 'bottom'
  ) => {
    const gal = galleries.find((g) => g.id === galleryId);
    if (!gal || !gal.files) return;

    const index = gal.files.findIndex((f) => f.id === fileId);
    if (index === -1) return;

    const newFiles = [...gal.files];
    if (direction === 'up' && index > 0) {
      const temp = newFiles[index];
      newFiles[index] = newFiles[index - 1];
      newFiles[index - 1] = temp;
    } else if (direction === 'down' && index < newFiles.length - 1) {
      const temp = newFiles[index];
      newFiles[index] = newFiles[index + 1];
      newFiles[index + 1] = temp;
    } else if (direction === 'top') {
      const [item] = newFiles.splice(index, 1);
      newFiles.unshift(item);
    } else if (direction === 'bottom') {
      const [item] = newFiles.splice(index, 1);
      newFiles.push(item);
    }

    reorderClientGalleryFiles(galleryId, newFiles.map((f) => f.id));
    const updatedGalleries = getClientGalleries();
    setGalleries(updatedGalleries);
    if (visualReorderGallery?.id === galleryId) {
      setVisualReorderGallery({ ...visualReorderGallery, files: newFiles });
    }
    if (uploadTargetGallery?.id === galleryId) {
      setUploadTargetGallery({ ...uploadTargetGallery, files: newFiles });
    }
    if (editingClient?.id === galleryId) {
      setEditingClient({ ...editingClient, files: newFiles });
    }
    setSaveSuccessMsg('Acomodo de fotos de la galería guardado.');
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  const handleDropGalleryFile = (galleryId: string, sourceFileId: string, targetFileId: string) => {
    if (sourceFileId === targetFileId) return;
    const gal = galleries.find((g) => g.id === galleryId);
    if (!gal || !gal.files) return;

    const sourceIndex = gal.files.findIndex((f) => f.id === sourceFileId);
    const targetIndex = gal.files.findIndex((f) => f.id === targetFileId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newFiles = [...gal.files];
    const [moved] = newFiles.splice(sourceIndex, 1);
    newFiles.splice(targetIndex, 0, moved);

    reorderClientGalleryFiles(galleryId, newFiles.map((f) => f.id));
    const updatedGalleries = getClientGalleries();
    setGalleries(updatedGalleries);
    if (visualReorderGallery?.id === galleryId) {
      setVisualReorderGallery({ ...visualReorderGallery, files: newFiles });
    }
    if (uploadTargetGallery?.id === galleryId) {
      setUploadTargetGallery({ ...uploadTargetGallery, files: newFiles });
    }
    if (editingClient?.id === galleryId) {
      setEditingClient({ ...editingClient, files: newFiles });
    }
    setSaveSuccessMsg(`Foto reubicada en posición #${targetIndex + 1}.`);
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  const handleSetGalleryFilePosition = (
    galleryId: string,
    fileId: string,
    newPositionOneBased: number
  ) => {
    const gal = galleries.find((g) => g.id === galleryId);
    if (!gal || !gal.files) return;

    const currentIndex = gal.files.findIndex((f) => f.id === fileId);
    if (currentIndex === -1) return;
    const targetIndex = Math.max(0, Math.min(gal.files.length - 1, newPositionOneBased - 1));
    if (currentIndex === targetIndex) return;

    const newFiles = [...gal.files];
    const [moved] = newFiles.splice(currentIndex, 1);
    newFiles.splice(targetIndex, 0, moved);

    reorderClientGalleryFiles(galleryId, newFiles.map((f) => f.id));
    const updatedGalleries = getClientGalleries();
    setGalleries(updatedGalleries);
    if (visualReorderGallery?.id === galleryId) {
      setVisualReorderGallery({ ...visualReorderGallery, files: newFiles });
    }
    if (uploadTargetGallery?.id === galleryId) {
      setUploadTargetGallery({ ...uploadTargetGallery, files: newFiles });
    }
    if (editingClient?.id === galleryId) {
      setEditingClient({ ...editingClient, files: newFiles });
    }
    setSaveSuccessMsg(`Foto movida a la posición #${targetIndex + 1}.`);
    setTimeout(() => setSaveSuccessMsg(null), 2000);
  };

  const handleSetGalleryCoverFromFile = (galleryId: string, coverUrl: string) => {
    const updated = galleries.map((g) => (g.id === galleryId ? { ...g, coverImage: coverUrl } : g));
    saveClientGalleries(updated);
    setGalleries(updated);
    if (visualReorderGallery?.id === galleryId) {
      setVisualReorderGallery({ ...visualReorderGallery, coverImage: coverUrl });
    }
    if (editingClient?.id === galleryId) {
      setEditingClient({ ...editingClient, coverImage: coverUrl });
    }
    setSaveSuccessMsg('¡Foto establecida como nueva portada de la galería!');
    setTimeout(() => setSaveSuccessMsg(null), 2500);
  };

  // QUICK PHOTO SWITCHER FOR ANY SECTION OR WORK
  const handleOpenPhotoSwitcher = (target: {
    id: string;
    title: string;
    currentUrl: string;
    sectionName: string;
    mediaType?: MediaType;
  }) => {
    setPhotoSwitcherTarget(target);
    setPhotoSwitcherNewUrl(target.currentUrl);
    setPhotoSwitcherMediaType(target.mediaType || 'image');
    setShowPhotoSwitcherModal(true);
  };

  const handlePhotoSwitcherFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingSwitcherFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoSwitcherNewUrl(dataUrl);
        if (file.type.startsWith('video/')) {
          setPhotoSwitcherMediaType('video');
        }
      }
      setIsUploadingSwitcherFile(false);
    };
    reader.onerror = () => {
      setIsUploadingSwitcherFile(false);
      alert('Error al leer el archivo.');
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhotoSwitch = () => {
    if (!photoSwitcherTarget || !photoSwitcherNewUrl.trim()) return;

    updateAnyWebsitePhoto(photoSwitcherTarget.id, photoSwitcherNewUrl.trim());

    // Update local state reactively
    if (photoSwitcherTarget.id === 'hero') {
      setStudioConfigState((prev) => ({ ...prev, heroImage: photoSwitcherNewUrl.trim() }));
      setStudioForm((prev) => ({ ...prev, heroImage: photoSwitcherNewUrl.trim() }));
    } else if (photoSwitcherTarget.id === 'cinema_feature') {
      setStudioConfigState((prev) => ({ ...prev, cinemaFeatureImage: photoSwitcherNewUrl.trim() }));
      setStudioForm((prev) => ({ ...prev, cinemaFeatureImage: photoSwitcherNewUrl.trim() }));
    } else if (photoSwitcherTarget.id === 'cinema_reel') {
      setStudioConfigState((prev) => ({ ...prev, cinemaReelImage: photoSwitcherNewUrl.trim() }));
      setStudioForm((prev) => ({ ...prev, cinemaReelImage: photoSwitcherNewUrl.trim() }));
    } else if (photoSwitcherTarget.id === 'announcement') {
      setAnnouncementData((prev) => ({ ...prev, imageUrl: photoSwitcherNewUrl.trim() }));
    } else if (photoSwitcherTarget.id.startsWith('cat_')) {
      setCategoriesList(getStudioCategories());
    } else if (photoSwitcherTarget.id.startsWith('port_')) {
      setPortfolioItems(getPortfolioItems());
    }

    setShowPhotoSwitcherModal(false);
    setSaveSuccessMsg(`¡Imagen actualizada con éxito para "${photoSwitcherTarget.title}"!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
    setPhotoSwitcherTarget(null);
    setPhotoSwitcherNewUrl('');
    if (onRefreshData) onRefreshData();
  };

  // Save Studio Profile Info
  const handleSaveStudioConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveStudioConfig(studioForm);
    setStudioConfigState(studioForm);
    setSaveSuccessMsg('Información de biografía y contacto actualizada.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // CATEGORY CLICKS RECHARTS SIMULATION HANDLERS
  const handleSimulateCategoryClick = (catId: string) => {
    const updatedStats = simulateCategoryClick(catId);
    setStats(updatedStats);
    const catLabel = categoriesList.find((c) => c.id === catId)?.label || catId;
    setSimulateToast(`+1 Clic registrado en "${catLabel}". ¡Gráfico Recharts actualizado en tiempo real!`);
    setTimeout(() => setSimulateToast(null), 3500);
  };

  const handleResetCategoryClicks = () => {
    const confirmed = window.confirm(
      '¿Deseas calibrar y reiniciar las estadísticas de clics de categorías a valores de muestra?'
    );
    if (confirmed) {
      const updated = resetCategoryClicks();
      setStats(updated);
      setSimulateToast('Estadísticas de clics calibradas a valores base.');
      setTimeout(() => setSimulateToast(null), 3000);
    }
  };

  // AUTOMATED EMAIL NOTIFICATION HANDLERS
  const handleSendTestBookingNotification = async (targetEmail: string = 'cadcad111.3@gmail.com') => {
    setIsSendingTestEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch('/api/test-booking-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailStatus(`✓ Notificación de prueba despachada exitosamente hacia ${targetEmail}`);
        setTimeout(() => setTestEmailStatus(null), 6000);
      } else {
        setTestEmailStatus(`Aviso: ${data.error || 'No se pudo enviar el correo de prueba'}`);
      }
    } catch (err: any) {
      setTestEmailStatus(`Aviso: ${err.message || 'Error al conectar con el servidor de correo'}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleResendBookingEmail = async (session: DiscoverySessionBooking) => {
    setResendingBookingId(session.id);
    try {
      const res = await resendBookingEmailNotification(session);
      setTestEmailStatus(res.message);
      setEmailLogs(getEmailNotificationLogs());
      setTimeout(() => setTestEmailStatus(null), 6000);
    } catch (e: any) {
      setTestEmailStatus(`Error al reenviar: ${e.message}`);
    } finally {
      setResendingBookingId(null);
    }
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
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono-data text-zinc-400 mb-1">
              <span className="text-[#2B7574] font-semibold">PANEL ADMINISTRATIVO</span>
              <span aria-hidden="true">·</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Firebase Cloud Database (Tiempo Real)
              </span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => {
                  setDriveSyncMode('portfolio');
                  setShowDriveSyncModal(true);
                }}
                className="px-2 py-0.5 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 text-[10px] font-semibold flex items-center gap-1 hover:bg-blue-900/60 transition-colors cursor-pointer"
                title="Google Drive configurado como almacén de fotos en alta resolución"
              >
                <FolderSync className="w-3 h-3 text-blue-400" />
                <span>Google Drive (Almacén de Fotos)</span>
              </button>
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

            {/* Direct Google Drive Button */}
            <button
              type="button"
              onClick={() => {
                setDriveSyncMode('portfolio');
                setShowDriveSyncModal(true);
              }}
              className="px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-600 border border-blue-500/40 rounded-lg transition-colors flex items-center gap-1.5 shadow"
              title="Abrir sincronizador de Google Drive (Portafolio, Fotos maestras o Galerías)"
            >
              <FolderSync className="w-3.5 h-3.5" />
              <span>Google Drive</span>
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

            {/* Google Drive Workspace Account Connection Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0d2229] via-[#0E2931] to-[#070e11] border border-[#2B7574]/60 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#2B7574]/30 border border-[#2B7574]/60 text-[#7cc0be]">
                  <FolderSync className="w-5 h-5 text-[#7cc0be]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Google Drive Workspace</h4>
                    {isDriveLinked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-data bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Conectado con esta cuenta: {driveUserEmail || 'cadcad111.3@gmail.com'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono-data bg-zinc-900 text-zinc-400 border border-zinc-700">
                        No Conectado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-300 mt-0.5">
                    Conecta tu Google Drive con esta cuenta para sincronizar carpetas enteras de clientes y alimentar el portafolio en alta resolución.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isDriveLinked ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDriveSyncMode('galleries');
                        setShowDriveSyncModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#2B7574] hover:bg-[#38918f] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <FolderSync className="w-3.5 h-3.5" />
                      <span>Sincronizar Carpetas</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConnectDrive}
                      disabled={isConnectingDrive}
                      className="px-3 py-1.5 rounded-xl bg-[#0E2931] hover:bg-[#1a4a58] border border-[#2B7574]/50 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      {isConnectingDrive ? 'Conectando...' : 'Cambiar Cuenta'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDisconnectDrive}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 text-xs border border-zinc-800 transition-colors cursor-pointer"
                    >
                      Desconectar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    disabled={isConnectingDrive}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA3535" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>{isConnectingDrive ? 'Conectando...' : 'Conectar Google Drive con esta cuenta'}</span>
                  </button>
                )}
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

                    {/* Mesa de Luz y Acomodo Visual Gráfico */}
                    <button
                      onClick={() => setVisualReorderGallery(gal)}
                      className="px-3 py-1.5 text-xs text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] border border-[#2B7574]/60 rounded-lg transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                      title="Abrir mesa de luz gráfica y acomodo interactivo de fotos"
                    >
                      <LayoutGrid className="w-3.5 h-3.5 text-[#E2E2E0]" />
                      <span>Acomodo Visual ({gal.files.length})</span>
                    </button>

                    {/* Edit: Modificar acomodo, agregar fotos e información */}
                    <button
                      onClick={() => {
                        setEditingClient(gal);
                        setUploadTargetGallery(gal);
                        setClientEditTab('acomodo');
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
                      className="px-3 py-1.5 text-xs text-white bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 rounded-lg transition-colors flex items-center gap-1.5 font-medium shadow-sm"
                      title="Editar fotos, acomodo visual e información de la galería"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar ({gal.files.length} fotos)</span>
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

            {/* Section B: Portfolio Works & Complete Website Photo Manager */}
            <div className="space-y-6 pt-4 border-t border-[#2B7574]/30">
              {/* Sub-tab navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#2B7574]" />
                    <span>Control de Obras, Acomodo y Fotos de la Web</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Modifique el acomodo de las fotos (mover arriba/abajo/inicio/fin), añada fotos o videos, o reemplace cualquier imagen de la página.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#0E2931] border border-[#2B7574]/40 rounded-xl flex items-center">
                    <button
                      type="button"
                      onClick={() => setPortfolioSubTab('live_web')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        portfolioSubTab === 'live_web'
                          ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                      title="Proyección exacta de la web editable en vivo"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Maqueta Real Web (En Vivo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioSubTab('works')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        portfolioSubTab === 'works'
                          ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      <MoveVertical className="w-3.5 h-3.5" />
                      <span>Acomodo & Tira ({portfolioItems.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPortfolioSubTab('website_photos')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        portfolioSubTab === 'website_photos'
                          ? 'bg-[#2B7574] text-[#E2E2E0] shadow-sm'
                          : 'text-zinc-300 hover:text-white'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Fotos de Toda la Web (8)</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setDriveSyncMode('portfolio');
                      setShowDriveSyncModal(true);
                    }}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-950/40"
                    title="Importar y sincronizar fotos desde Google Drive directamente al portafolio"
                  >
                    <FolderSync className="w-4 h-4" />
                    <span>Sincronizar Google Drive</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingPortfolioItem(null);
                      setPortfolioForm({
                        title: '',
                        category: (categoriesList[0]?.id as any) || 'bodas',
                        aspectRatio: '16:9',
                        mediaType: 'image',
                        url: '',
                        videoSrc: '',
                        client: '',
                        year: new Date().getFullYear().toString(),
                        camera: 'Leica SL2-S',
                        lens: 'Noctilux 50mm f/0.95',
                        aperture: 'f/1.4',
                        shutter: '1/250s',
                        iso: '100',
                        resolution: '8368 × 4707 px',
                        description: '',
                        isFeatured: true,
                      });
                      setPortfolioFileUploadPreview(null);
                      setShowAddPortfolioModal(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center gap-1.5 shrink-0 shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir Obra (Foto/Video)</span>
                  </button>
                </div>
              </div>

              {/* VIEW 0: MAQUETA REAL DE LA WEB EDITABLE EN VIVO (PROYECCIÓN VISUAL) */}
              {portfolioSubTab === 'live_web' && (
                <div className="space-y-6">
                  {/* Top Bar with Curation Controls & Location Filters */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0E2931] border border-[#2B7574]/50 shadow-xl space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5 text-[#2B7574]" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                            Proyección Real de la Galería Web · Editor Visual en Vivo
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                          Esta vista proyecta la galería con la diagramación y proporciones reales del sitio web. Puedes arrastrar fotos para reordenarlas, cambiar cualquier imagen con un clic y definir con el botón de estrella cuáles fotos se muestran en la <strong>Página Principal</strong> y cuáles quedan exclusivamente en el <strong>Portafolio Completo</strong>.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-3 py-1.5 rounded-full text-xs font-mono-data bg-[#2B7574] text-[#E2E2E0] font-bold shadow">
                          ⭐ {portfolioItems.filter((p) => p.showOnHome !== false).length} en Portada
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-mono-data bg-black/60 text-zinc-300 border border-white/10 font-semibold">
                          📁 {portfolioItems.length} en Archivo Master
                        </span>
                      </div>
                    </div>

                    {/* Filter Pills: By Location (Home vs Full) & Category */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2B7574]/30">
                      {/* Location Filter */}
                      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#070e11] border border-[#2B7574]/30">
                        <span className="text-[10px] font-mono-data text-zinc-400 px-2 font-bold">FILTRAR POR DESTINO:</span>
                        <button
                          type="button"
                          onClick={() => setPortfolioLocationFilter('all')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            portfolioLocationFilter === 'all'
                              ? 'bg-[#2B7574] text-white shadow'
                              : 'text-zinc-300 hover:text-white'
                          }`}
                        >
                          Todas ({portfolioItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioLocationFilter('home_only')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                            portfolioLocationFilter === 'home_only'
                              ? 'bg-amber-400 text-black shadow font-bold'
                              : 'text-amber-300 hover:text-white'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>En Portada ({portfolioItems.filter((p) => p.isFeatured !== false && p.showOnHome !== false).length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioLocationFilter('full_only')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            portfolioLocationFilter === 'full_only'
                              ? 'bg-zinc-700 text-white shadow font-bold'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Portafolio Completo ({portfolioItems.filter((p) => p.isFeatured !== false && p.showOnHome === false).length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setPortfolioLocationFilter('hidden_only')}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                            portfolioLocationFilter === 'hidden_only'
                              ? 'bg-rose-950 text-rose-200 border border-rose-500 shadow font-bold'
                              : 'text-rose-400 hover:text-white'
                          }`}
                          title="Obras que no aparecen en la web pública y solo se ven en el admin"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Ocultas en Admin ({portfolioItems.filter((p) => p.isFeatured === false).length})</span>
                        </button>
                      </div>

                      {/* Category Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                        <button
                          type="button"
                          onClick={() => setPortfolioFilterCategory('all')}
                          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                            portfolioFilterCategory === 'all'
                              ? 'bg-[#2B7574] text-white font-bold shadow'
                              : 'text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          Todas
                        </button>
                        {categoriesList.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setPortfolioFilterCategory(cat.id)}
                            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                              portfolioFilterCategory === cat.id
                                ? 'bg-[#2B7574] text-white font-bold shadow'
                                : 'text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* THE REAL WEB PROJECTION CONTAINER (Authentic Web Layout with Editable Overlays) */}
                  <div className="bg-[#E2E2E0] rounded-3xl p-6 sm:p-8 border-2 border-[#2B7574]/40 shadow-2xl text-[#0E2931]">
                    {/* Authentic Website Section Header Preview */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-[#2B7574]/25">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono-data text-[#0E2931]/70 mb-1.5">
                          <span className="text-[#2B7574] font-bold uppercase">OBRAS SELECCIONADAS</span>
                          <span aria-hidden="true">·</span>
                          <span>RESOLUCIÓN MASTER</span>
                          <span aria-hidden="true">·</span>
                          <span>CADSTUDIO CULIACÁN</span>
                        </div>
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0E2931] tracking-tight">
                          Portafolio de Autor
                        </h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono-data text-[#2B7574] font-bold bg-[#2B7574]/15 px-3 py-1.5 rounded-lg border border-[#2B7574]/30 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#2B7574]" />
                          <span>Modo Edición en Vivo — Pasa el ratón o arrastra cualquier obra</span>
                        </span>
                      </div>
                    </div>

                    {/* The Masonry Grid matching PortfolioGallery.tsx columns exactly */}
                    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
                      {portfolioItems
                        .map((item, originalIndex) => ({ item, originalIndex }))
                        .filter(({ item }) => {
                          if (portfolioFilterCategory !== 'all' && item.category !== portfolioFilterCategory) return false;
                          if (portfolioLocationFilter === 'home_only') return item.isFeatured !== false && item.showOnHome !== false;
                          if (portfolioLocationFilter === 'full_only') return item.isFeatured !== false && item.showOnHome === false;
                          if (portfolioLocationFilter === 'hidden_only') return item.isFeatured === false;
                          return true;
                        })
                        .map(({ item, originalIndex }) => {
                          const isDragging = draggedPortfolioId === item.id;
                          const isDragOver = dragOverPortfolioId === item.id;
                          const isOnHome = item.showOnHome !== false;
                          const isPublic = item.isFeatured !== false;

                          return (
                            <div
                              key={`live-${item.id}`}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('text/plain', item.id);
                                setDraggedPortfolioId(item.id);
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                if (dragOverPortfolioId !== item.id) setDragOverPortfolioId(item.id);
                              }}
                              onDragLeave={() => {
                                if (dragOverPortfolioId === item.id) setDragOverPortfolioId(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                const srcId = e.dataTransfer.getData('text/plain') || draggedPortfolioId;
                                if (srcId && srcId !== item.id) handleDropPortfolioItem(srcId, item.id);
                                setDraggedPortfolioId(null);
                                setDragOverPortfolioId(null);
                              }}
                              onDragEnd={() => {
                                setDraggedPortfolioId(null);
                                setDragOverPortfolioId(null);
                              }}
                              className={`break-inside-avoid mb-3.5 group relative rounded-2xl overflow-hidden bg-[#0E2931] border transition-all duration-300 shadow-md hover:shadow-2xl select-none ${
                                !isPublic
                                  ? 'border-dashed border-rose-500/70 opacity-90'
                                  : isDragging
                                  ? 'opacity-30 border-dashed border-[#2B7574] scale-95'
                                  : isDragOver
                                  ? 'ring-4 ring-[#2B7574] scale-102 border-white shadow-2xl'
                                  : 'border-[#2B7574]/40 hover:border-[#2B7574]'
                              }`}
                            >
                              {/* Media Container with accurate aspect ratio */}
                              <div className={`relative w-full overflow-hidden ${
                                item.aspectRatio === '16:9' ? 'aspect-[16/9]' :
                                item.aspectRatio === '9:16' ? 'aspect-[9/16]' :
                                item.aspectRatio === '3:4' ? 'aspect-[3/4]' :
                                item.aspectRatio === '1:1' ? 'aspect-square' :
                                'aspect-[4/3]'
                              } bg-black`}>
                                <img
                                  src={item.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                                />

                                {/* Permanent Top Banner Overlays */}
                                <div className="absolute top-2 left-2 right-2 flex flex-wrap items-center justify-between gap-1 z-20 pointer-events-auto">
                                  <div className="flex items-center gap-1">
                                    {/* isFeatured Public vs Hidden Toggle Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePortfolioFeatured(item.id);
                                      }}
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono-data font-bold flex items-center gap-1 shadow-md transition-all ${
                                        isPublic
                                          ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/40'
                                          : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/80 ring-1 ring-rose-500/40'
                                      }`}
                                      title={
                                        isPublic
                                          ? 'Obra PÚBLICA en el portafolio. Clic para OCULTAR y dejar solo en el panel de administrador.'
                                          : 'Obra OCULTA (Solo Admin). Clic para hacerla PÚBLICA en la web.'
                                      }
                                    >
                                      {isPublic ? (
                                        <>
                                          <Eye className="w-2.5 h-2.5 text-white" />
                                          <span>PÚBLICA</span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-2.5 h-2.5 text-rose-400" />
                                          <span>OCULTA</span>
                                        </>
                                      )}
                                    </button>

                                    {/* Location Toggle Badge */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePortfolioHomeVisibility(item.id);
                                      }}
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono-data font-bold flex items-center gap-1 shadow-md transition-all ${
                                        isOnHome
                                          ? 'bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] border border-white/20'
                                          : 'bg-black/80 hover:bg-[#2B7574] text-zinc-300 hover:text-white border border-white/10'
                                      }`}
                                      title={
                                        isOnHome
                                          ? 'Mostrado en Portada. Clic para quitar y dejar solo en el portafolio completo.'
                                          : 'Exclusivo del Portafolio Completo. Clic para mostrar también en la Portada.'
                                      }
                                    >
                                      <Star className={`w-2.5 h-2.5 ${isOnHome ? 'fill-amber-300 text-amber-300' : 'text-zinc-400'}`} />
                                      <span>{isOnHome ? 'HOME' : 'FULL'}</span>
                                    </button>
                                  </div>

                                  {/* Position & Drag Grip */}
                                  <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/20 text-[#E2E2E0]">
                                    <div
                                      className="cursor-grab active:cursor-grabbing p-0.5 text-[#2B7574]"
                                      title="Arrastrar para cambiar lugar en la web"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>
                                    <select
                                      value={originalIndex + 1}
                                      onChange={(e) => handleSetPortfolioItemPosition(item.id, Number(e.target.value))}
                                      className="bg-transparent text-[11px] font-mono-data font-bold text-white focus:outline-none cursor-pointer"
                                      title="Cambiar posición directamente"
                                    >
                                      {portfolioItems.map((_, idx) => (
                                        <option key={idx + 1} value={idx + 1} className="bg-[#0E2931] text-white">
                                          #{idx + 1}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Video Indicator if applicable */}
                                {item.mediaType === 'video' && (
                                  <div className="absolute top-11 left-2 p-1.5 rounded-full bg-[#2B7574] text-white shadow-md z-10">
                                    <Video className="w-3.5 h-3.5" />
                                  </div>
                                )}

                                {/* Hover Control Layer: In-place Action Overlay */}
                                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-10">
                                  <div className="pt-8 flex items-center justify-center gap-1.5">
                                    {/* Quick Reorder Arrows */}
                                    <button
                                      type="button"
                                      onClick={() => handleMovePortfolioItem(item.id, 'top')}
                                      disabled={originalIndex === 0}
                                      className="p-1.5 rounded-lg bg-black/70 hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0] transition-colors"
                                      title="Mover al primer lugar (inicio)"
                                    >
                                      <ChevronsUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMovePortfolioItem(item.id, 'up')}
                                      disabled={originalIndex === 0}
                                      className="p-1.5 rounded-lg bg-black/70 hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0] transition-colors"
                                      title="Subir una posición"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMovePortfolioItem(item.id, 'down')}
                                      disabled={originalIndex === portfolioItems.length - 1}
                                      className="p-1.5 rounded-lg bg-black/70 hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0] transition-colors"
                                      title="Bajar una posición"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMovePortfolioItem(item.id, 'bottom')}
                                      disabled={originalIndex === portfolioItems.length - 1}
                                      className="p-1.5 rounded-lg bg-black/70 hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0] transition-colors"
                                      title="Mover al último lugar (fin)"
                                    >
                                      <ChevronsDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Center: Replace Image Button */}
                                  <div className="text-center">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenPhotoSwitcher({
                                          id: `port_${item.id}`,
                                          title: item.title,
                                          currentUrl: item.url,
                                          sectionName: `Obra #${originalIndex + 1} (${item.title})`,
                                          mediaType: item.mediaType,
                                        })
                                      }
                                      className="px-3.5 py-2 bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] text-xs font-semibold rounded-xl shadow-xl flex items-center gap-1.5 mx-auto transition-transform hover:scale-105"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      <span>Cambiar Foto/Video</span>
                                    </button>
                                  </div>

                                  {/* Bottom Info & Edit/Delete Buttons */}
                                  <div className="space-y-1.5 bg-black/90 p-2.5 rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-bold text-white truncate max-w-[70%]">
                                        {item.title}
                                      </h4>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingPortfolioItem(item);
                                            setPortfolioForm({
                                              title: item.title,
                                              category: item.category as any,
                                              aspectRatio: item.aspectRatio,
                                              mediaType: item.mediaType,
                                              url: item.url,
                                              videoSrc: item.videoSrc || '',
                                              client: item.client || '',
                                              year: item.year || '2026',
                                              camera: item.exif?.camera || 'Leica SL2-S',
                                              lens: item.exif?.lens || 'Noctilux 50mm f/0.95',
                                              aperture: item.exif?.aperture || 'f/1.4',
                                              shutter: item.exif?.shutter || '1/250s',
                                              iso: item.exif?.iso || '100',
                                              resolution: item.exif?.resolution || '8368 × 4707 px',
                                              description: item.description || '',
                                              isFeatured: item.isFeatured !== false,
                                            });
                                            setPortfolioFileUploadPreview(item.url);
                                            setShowAddPortfolioModal(true);
                                          }}
                                          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white"
                                          title="Editar datos de la obra"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePortfolioItem(item.id)}
                                          className="p-1 rounded bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white"
                                          title="Eliminar obra"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-mono-data text-zinc-300">
                                      <span>{categoriesList.find((c) => c.id === item.category)?.label || item.category}</span>
                                      <span>{item.aspectRatio}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 1: PORTFOLIO WORKS WITH REORDER CONTROLS (DEEPLY GRAPHICAL) */}
              {portfolioSubTab === 'works' && (
                <div className="space-y-6">
                  {/* Graphical Panorama Filmstrip Ribbon */}
                  <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/50 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-[#2B7574]" />
                        <h4 className="text-xs font-bold text-[#E2E2E0] uppercase tracking-wide">
                          Secuencia Visual Panorámica ({portfolioItems.length} Obras)
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono-data text-zinc-300">
                        Este es el orden exacto en que los visitantes ven tus obras
                      </span>
                    </div>

                    {/* Horizontal scrollable filmstrip */}
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-[#2B7574] scrollbar-track-[#070e11]">
                      {portfolioItems.map((item, index) => (
                        <div
                          key={`filmstrip-${item.id}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.id);
                            setDraggedPortfolioId(item.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverPortfolioId !== item.id) setDragOverPortfolioId(item.id);
                          }}
                          onDragLeave={() => {
                            if (dragOverPortfolioId === item.id) setDragOverPortfolioId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const srcId = e.dataTransfer.getData('text/plain') || draggedPortfolioId;
                            if (srcId && srcId !== item.id) handleDropPortfolioItem(srcId, item.id);
                            setDraggedPortfolioId(null);
                            setDragOverPortfolioId(null);
                          }}
                          onDragEnd={() => {
                            setDraggedPortfolioId(null);
                            setDragOverPortfolioId(null);
                          }}
                          className={`relative group shrink-0 w-24 aspect-[4/3] rounded-lg overflow-hidden border cursor-grab active:cursor-grabbing transition-all ${
                            draggedPortfolioId === item.id
                              ? 'opacity-40 border-dashed border-[#2B7574] scale-95'
                              : dragOverPortfolioId === item.id
                              ? 'ring-2 ring-[#2B7574] border-white scale-105 shadow-xl'
                              : 'border-[#2B7574]/40 hover:border-[#2B7574] hover:scale-103'
                          } bg-black`}
                          title={`#${index + 1} ${item.title} (Arrastra a otra posición)`}
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono-data font-bold text-[#E2E2E0] border border-white/20">
                            #{index + 1}
                          </div>
                          {item.mediaType === 'video' && (
                            <div className="absolute bottom-1 right-1 p-1 rounded-full bg-[#2B7574] text-white">
                              <Video className="w-2.5 h-2.5" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1 text-center">
                            <span className="text-[9px] font-bold text-white line-clamp-2 leading-tight">
                              {item.title}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter for arrangement */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0E2931]/80 border border-[#2B7574]/40">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono-data text-zinc-300 mr-1 font-semibold flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3 text-[#2B7574]" />
                        <span>FILTRAR ACOMODO:</span>
                      </span>
                      <button
                        onClick={() => setPortfolioFilterCategory('all')}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          portfolioFilterCategory === 'all'
                            ? 'bg-[#2B7574] text-white font-semibold shadow'
                            : 'text-zinc-300 hover:bg-white/10'
                        }`}
                      >
                        Todas ({portfolioItems.length})
                      </button>
                      {categoriesList.map((cat) => {
                        const count = portfolioItems.filter((p) => p.category === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setPortfolioFilterCategory(cat.id)}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              portfolioFilterCategory === cat.id
                                ? 'bg-[#2B7574] text-white font-semibold shadow'
                                : 'text-zinc-300 hover:bg-white/10'
                            }`}
                          >
                            {cat.label} ({count})
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[11px] font-mono-data text-[#E2E2E0] bg-[#2B7574]/30 px-3 py-1 rounded-lg border border-[#2B7574]/50 flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-[#2B7574]" />
                      <span>Arrastra las tarjetas o usa los selectores directos de posición</span>
                    </div>
                  </div>

                  {/* Works grid with drag & reorder controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {portfolioItems
                      .map((item, originalIndex) => ({ item, originalIndex }))
                      .filter(({ item }) =>
                        portfolioFilterCategory === 'all' ? true : item.category === portfolioFilterCategory
                      )
                      .map(({ item, originalIndex }) => {
                        const isDragging = draggedPortfolioId === item.id;
                        const isDragOver = dragOverPortfolioId === item.id;

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', item.id);
                              setDraggedPortfolioId(item.id);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (dragOverPortfolioId !== item.id) setDragOverPortfolioId(item.id);
                            }}
                            onDragLeave={() => {
                              if (dragOverPortfolioId === item.id) setDragOverPortfolioId(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const srcId = e.dataTransfer.getData('text/plain') || draggedPortfolioId;
                              if (srcId && srcId !== item.id) handleDropPortfolioItem(srcId, item.id);
                              setDraggedPortfolioId(null);
                              setDragOverPortfolioId(null);
                            }}
                            onDragEnd={() => {
                              setDraggedPortfolioId(null);
                              setDragOverPortfolioId(null);
                            }}
                            className={`p-4 rounded-2xl bg-[#0E2931] border transition-all flex flex-col justify-between gap-3.5 shadow-lg ${
                              isDragging
                                ? 'opacity-35 border-dashed border-[#2B7574] scale-95'
                                : isDragOver
                                ? 'ring-2 ring-[#2B7574] border-white scale-102 bg-[#0E2931]/90 shadow-2xl'
                                : 'border-[#2B7574]/40 hover:border-[#2B7574]'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Position Banner, Direct Position Selector and Reorder Buttons */}
                              <div className="flex items-center justify-between gap-2 bg-[#070e11]/80 p-2 rounded-xl border border-[#2B7574]/30">
                                <div className="flex items-center gap-1.5">
                                  {/* Drag Handle */}
                                  <div
                                    className="p-1 rounded text-zinc-400 hover:text-white cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                                    title="Arrastra para reordenar"
                                  >
                                    <GripVertical className="w-4 h-4 text-[#2B7574]" />
                                  </div>

                                  {/* Direct Position Selector Dropdown */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-mono-data text-zinc-400 font-bold">POS:</span>
                                    <select
                                      value={originalIndex + 1}
                                      onChange={(e) =>
                                        handleSetPortfolioItemPosition(item.id, Number(e.target.value))
                                      }
                                      className="px-2 py-0.5 rounded-lg bg-[#0E2931] border border-[#2B7574] text-xs font-mono-data font-bold text-[#E2E2E0] focus:outline-none focus:ring-1 focus:ring-[#2B7574] cursor-pointer"
                                      title="Cambiar a esta posición directamente"
                                    >
                                      {portfolioItems.map((_, idx) => (
                                        <option key={idx + 1} value={idx + 1}>
                                          #{idx + 1} de {portfolioItems.length}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                {/* Movement Arrow Buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleMovePortfolioItem(item.id, 'top')}
                                    disabled={originalIndex === 0}
                                    className="p-1.5 rounded-lg bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 disabled:hover:bg-[#0E2931] text-[#E2E2E0] transition-colors border border-white/10"
                                    title="Mover al primer lugar (inicio)"
                                  >
                                    <ChevronsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMovePortfolioItem(item.id, 'up')}
                                    disabled={originalIndex === 0}
                                    className="p-1.5 rounded-lg bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 disabled:hover:bg-[#0E2931] text-[#E2E2E0] transition-colors border border-white/10"
                                    title="Subir una posición"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMovePortfolioItem(item.id, 'down')}
                                    disabled={originalIndex === portfolioItems.length - 1}
                                    className="p-1.5 rounded-lg bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 disabled:hover:bg-[#0E2931] text-[#E2E2E0] transition-colors border border-white/10"
                                    title="Bajar una posición"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMovePortfolioItem(item.id, 'bottom')}
                                    disabled={originalIndex === portfolioItems.length - 1}
                                    className="p-1.5 rounded-lg bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 disabled:hover:bg-[#0E2931] text-[#E2E2E0] transition-colors border border-white/10"
                                    title="Mover al último lugar (final)"
                                  >
                                    <ChevronsDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Media thumbnail */}
                              <div className="relative aspect-video rounded-xl overflow-hidden bg-black group border border-white/10 shadow-inner">
                                <img
                                  src={item.url}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                                />
                                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono-data bg-black/85 px-2 py-0.5 rounded text-white border border-white/20 font-semibold">
                                    {item.aspectRatio} · {item.mediaType.toUpperCase()}
                                  </span>
                                </div>
                                {item.mediaType === 'video' && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="p-3 rounded-full bg-[#2B7574]/90 text-white shadow-lg">
                                      <Video className="w-5 h-5" />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div>
                                <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                                <p className="text-[11px] font-mono-data text-zinc-300 mt-0.5">
                                  Categoría: <strong className="text-[#2B7574]">{categoriesList.find((c) => c.id === item.category)?.label || item.category}</strong> · {item.year}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#2B7574]/30">
                              {/* Fast Replace Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPhotoSwitcher({
                                    id: `port_${item.id}`,
                                    title: item.title,
                                    currentUrl: item.url,
                                    sectionName: `Obra #${originalIndex + 1} (${item.title})`,
                                    mediaType: item.mediaType,
                                  })
                                }
                                className="px-3 py-1.5 text-[11px] font-semibold text-[#E2E2E0] bg-[#2B7574]/50 hover:bg-[#2B7574] border border-[#2B7574]/70 rounded-lg transition-colors flex items-center gap-1.5"
                                title="Cambiar la foto o video de esta obra inmediatamente"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-[#2B7574] group-hover:text-white" />
                                <span>Cambiar Foto/Video</span>
                              </button>

                              <div className="flex items-center gap-1.5">
                                {/* isFeatured toggle button */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePortfolioFeatured(item.id)}
                                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1 border ${
                                    item.isFeatured !== false
                                      ? 'bg-blue-950/60 text-blue-300 border-blue-500/40 hover:bg-blue-900/60'
                                      : 'bg-rose-950/60 text-rose-300 border-rose-500/40 hover:bg-rose-900/60'
                                  }`}
                                  title={
                                    item.isFeatured !== false
                                      ? 'Obra pública en web. Clic para ocultarla en admin.'
                                      : 'Obra oculta en admin. Clic para publicarla en web.'
                                  }
                                >
                                  {item.isFeatured !== false ? (
                                    <>
                                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Pública</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                                      <span>Oculta</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingPortfolioItem(item);
                                    setPortfolioForm({
                                      title: item.title,
                                      category: item.category as any,
                                      aspectRatio: item.aspectRatio,
                                      mediaType: item.mediaType,
                                      url: item.url,
                                      videoSrc: item.videoSrc || '',
                                      client: item.client || '',
                                      year: item.year || '2026',
                                      camera: item.exif?.camera || 'Leica SL2-S',
                                      lens: item.exif?.lens || 'Noctilux 50mm f/0.95',
                                      aperture: item.exif?.aperture || 'f/1.4',
                                      shutter: item.exif?.shutter || '1/250s',
                                      iso: item.exif?.iso || '100',
                                      resolution: item.exif?.resolution || '8368 × 4707 px',
                                      description: item.description || '',
                                      isFeatured: item.isFeatured !== false,
                                    });
                                    setPortfolioFileUploadPreview(item.url);
                                    setShowAddPortfolioModal(true);
                                  }}
                                  className="p-1.5 text-zinc-300 hover:text-white bg-[#070e11] border border-zinc-700 rounded-lg transition-colors"
                                  title="Editar título, categoría o detalles técnicos"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeletePortfolioItem(item.id)}
                                  className="p-1.5 text-rose-400 hover:text-white bg-rose-950/40 border border-rose-900/50 rounded-lg transition-colors"
                                  title="Eliminar obra del portafolio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* VIEW 2: ALL WEBSITE PHOTOS MANAGER */}
              {portfolioSubTab === 'website_photos' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-[#0E2931]/60 border border-[#2B7574]/40 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white text-xs">
                        Gestor Visual de Imágenes Clave de la Web
                      </h4>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        Cambia a tu antojo cualquier foto principal de la portada, categorías, cine o promociones. Los cambios se reflejan inmediatamente en toda la página.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Hero Principal */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Portada de Inicio
                        </span>
                        <h4 className="text-xs font-bold text-white">Fotografía Hero Principal</h4>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
                          <img
                            src={studioForm.heroImage || '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg'}
                            alt="Hero principal"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          La imagen destacada junto al título principal y biografía en la cabecera.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'hero',
                            title: 'Fotografía Hero Principal',
                            currentUrl: studioForm.heroImage || '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg',
                            sectionName: 'Hero Header Principal',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Foto Hero</span>
                      </button>
                    </div>

                    {/* 2. Pilar Bodas */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Pilar 01
                        </span>
                        <h4 className="text-xs font-bold text-white">Portada: Bodas</h4>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
                          <img
                            src={categoriesList.find((c) => c.id === 'bodas')?.coverImage || '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg'}
                            alt="Portada Bodas"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Tarjeta en sección especialidades y portada en portafolio completo.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'cat_bodas',
                            title: 'Portada de Bodas',
                            currentUrl: categoriesList.find((c) => c.id === 'bodas')?.coverImage || '',
                            sectionName: 'Categoría Bodas',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Foto Bodas</span>
                      </button>
                    </div>

                    {/* 3. Pilar Gastronomía */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Pilar 02
                        </span>
                        <h4 className="text-xs font-bold text-white">Portada: Gastronomía</h4>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
                          <img
                            src={categoriesList.find((c) => c.id === 'gastronomia')?.coverImage || '/src/assets/images/gastronomy_culinary_fineart_1790315306551.jpg'}
                            alt="Portada Gastronomía"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Especialidad culinaria para restaurantes y marcas fine art.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'cat_gastronomia',
                            title: 'Portada de Gastronomía',
                            currentUrl: categoriesList.find((c) => c.id === 'gastronomia')?.coverImage || '',
                            sectionName: 'Categoría Gastronomía',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Foto Gastronomía</span>
                      </button>
                    </div>

                    {/* 4. Pilar Arquitectura */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Pilar 03
                        </span>
                        <h4 className="text-xs font-bold text-white">Portada: Arquitectura</h4>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
                          <img
                            src={categoriesList.find((c) => c.id === 'arquitectura')?.coverImage || '/src/assets/images/architecture_minimalist_fineart_1790312918165.jpg'}
                            alt="Portada Arquitectura"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Documentación espacial y perspectiva de autor en Sinaloa.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'cat_arquitectura',
                            title: 'Portada de Arquitectura',
                            currentUrl: categoriesList.find((c) => c.id === 'arquitectura')?.coverImage || '',
                            sectionName: 'Categoría Arquitectura',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Foto Arquitectura</span>
                      </button>
                    </div>

                    {/* 5. Pilar Retrato */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Pilar 04
                        </span>
                        <h4 className="text-xs font-bold text-white">Portada: Retrato</h4>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
                          <img
                            src={categoriesList.find((c) => c.id === 'retrato')?.coverImage || '/src/assets/images/portrait_editorial_highfashion_1790312877113.jpg'}
                            alt="Portada Retrato"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Retratos de alta moda y sesiones de estudio de formato medio.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'cat_retrato',
                            title: 'Portada de Retrato',
                            currentUrl: categoriesList.find((c) => c.id === 'retrato')?.coverImage || '',
                            sectionName: 'Categoría Retrato',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Foto Retrato</span>
                      </button>
                    </div>

                    {/* 6. Video Cine 16:9 */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Sección Cine
                        </span>
                        <h4 className="text-xs font-bold text-white">Video Cine Master (16:9)</h4>
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
                          <img
                            src={studioForm.cinemaFeatureImage || '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg'}
                            alt="Video Cine 16:9"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Video className="w-5 h-5 text-white/80" />
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Pieza cinematográfica principal en formato apaisado.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'cinema_feature',
                            title: 'Portada Video Cine 16:9',
                            currentUrl: studioForm.cinemaFeatureImage || '/src/assets/images/hero_photographer_cinematic_1790312865168.jpg',
                            sectionName: 'Sección Cine 16:9',
                            mediaType: 'video',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Portada Cine</span>
                      </button>
                    </div>

                    {/* 7. Reel Vertical 9:16 */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Sección Cine
                        </span>
                        <h4 className="text-xs font-bold text-white">Reel Vertical (9:16)</h4>
                        <div className="relative aspect-[9/16] max-h-[160px] mx-auto rounded-xl overflow-hidden bg-black border border-white/10">
                          <img
                            src={studioForm.cinemaReelImage || '/src/assets/images/fashion_reel_vertical_1790312908204.jpg'}
                            alt="Reel vertical 9:16"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Pieza vertical para redes sociales y campañas mobile.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'cinema_reel',
                            title: 'Portada Reel Vertical 9:16',
                            currentUrl: studioForm.cinemaReelImage || '/src/assets/images/fashion_reel_vertical_1790312908204.jpg',
                            sectionName: 'Sección Cine Reel 9:16',
                            mediaType: 'video',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Reel Vertical</span>
                      </button>
                    </div>

                    {/* 8. Oferta / Anuncio */}
                    <div className="p-4 rounded-2xl bg-[#0E2931] border border-[#2B7574]/40 space-y-3 shadow-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono-data font-bold px-2 py-0.5 rounded bg-[#2B7574] text-[#E2E2E0] uppercase">
                          Panel Promocional
                        </span>
                        <h4 className="text-xs font-bold text-white">Banner de Oferta</h4>
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
                          {announcementData.imageUrl ? (
                            <img
                              src={announcementData.imageUrl}
                              alt="Oferta"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                              Sin imagen activa
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-300">
                          Fotografía editorial que acompaña el banner de anuncio y descuentos.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleOpenPhotoSwitcher({
                            id: 'announcement',
                            title: 'Imagen de Oferta Especial',
                            currentUrl: announcementData.imageUrl || '',
                            sectionName: 'Banner de Oferta',
                          })
                        }
                        className="w-full py-2 text-xs font-semibold text-[#E2E2E0] bg-[#2B7574] hover:bg-[#3b9493] rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Cambiar Foto Oferta</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

            {/* Automatic Email Notifications Control & Audit Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0E2931] via-[#102d35] to-[#070e11] border border-[#2B7574]/60 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2B7574]/30 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#2B7574]/25 border border-[#2B7574]/50 text-[#7cc0be]">
                    <MailCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">
                        Sistema de Notificaciones Automáticas vía Email
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono-data bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Activo en Tiempo Real
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Cada vez que un cliente confirma una cita, el sistema despacha automáticamente el dossier a <strong className="text-white">cadcad111.3@gmail.com</strong> y la confirmación con Google Meet al cliente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSmtpConfigDrawer(!showSmtpConfigDrawer)}
                    className="px-3 py-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/50 text-blue-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Conectar Gmail (otro correo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendTestBookingNotification('cadcad111.3@gmail.com')}
                    disabled={isSendingTestEmail}
                    className="px-3 py-1.5 rounded-xl bg-[#2B7574] hover:bg-[#38918f] text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingTestEmail ? 'Enviando...' : 'Enviar Prueba a cadcad111.3@gmail.com'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowEmailLogsDrawer(!showEmailLogsDrawer)}
                    className="px-3 py-1.5 rounded-xl bg-[#0E2931] hover:bg-[#1a4a58] border border-[#2B7574]/50 text-zinc-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Inbox className="w-3.5 h-3.5 text-[#7cc0be]" />
                    <span>Historial ({emailLogs.length})</span>
                  </button>
                </div>
              </div>

              {/* Gmail (otro correo) Configuration Drawer */}
              {showSmtpConfigDrawer && (
                <form onSubmit={handleSaveSmtpConfig} className="p-4 rounded-xl bg-[#081519] border border-[#2B7574]/40 space-y-4 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2B7574]/30 pb-2.5">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[#7cc0be]" />
                        <span>Conectar Gmail con Otro Correo (Despacho de Confirmaciones)</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Usa tu cuenta de Google Drive para los archivos, y envía las confirmaciones automáticas de citas desde otro correo de Gmail.
                      </p>
                    </div>
                    {smtpStatus?.configured ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-emerald-950 text-emerald-300 border border-emerald-700 font-semibold self-start sm:self-auto">
                        Remitente: {smtpStatus.user}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono-data bg-zinc-800 text-zinc-400 self-start sm:self-auto">
                        Modo Previo (Sin credenciales)
                      </span>
                    )}
                  </div>

                  {smtpFeedback && (
                    <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      smtpFeedback.type === 'success'
                        ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-600/50'
                        : 'bg-rose-950/80 text-rose-200 border border-rose-600/50'
                    }`}>
                      {smtpFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{smtpFeedback.message}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        OTRO CORREO DE GMAIL (REMITENTE) *
                      </label>
                      <input
                        type="email"
                        value={smtpConfigForm.user}
                        onChange={(e) => setSmtpConfigForm({ ...smtpConfigForm, user: e.target.value })}
                        placeholder="ej. notificaciones@cadstudio.mx o tu_otro_correo@gmail.com"
                        required
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        CONTRASEÑA DE APLICACIÓN DE GOOGLE (16 CARACTERES) *
                      </label>
                      <input
                        type="password"
                        value={smtpConfigForm.pass}
                        onChange={(e) => setSmtpConfigForm({ ...smtpConfigForm, pass: e.target.value })}
                        placeholder="xxxx xxxx xxxx xxxx"
                        required
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574] font-mono-data"
                      />
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#7cc0be] hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <span>Generar contraseña de aplicación en Google</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        NOMBRE DEL REMITENTE ("DE:")
                      </label>
                      <input
                        type="text"
                        value={smtpConfigForm.from}
                        onChange={(e) => setSmtpConfigForm({ ...smtpConfigForm, from: e.target.value })}
                        placeholder="CADSTUDIO Citas <notificaciones@cadstudio.mx>"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                      />
                    </div>

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">
                        CORREO DEL ESTUDIO (RECIBE COPIA DEL DOSSIER)
                      </label>
                      <input
                        type="email"
                        value={smtpConfigForm.studioRecipient}
                        onChange={(e) => setSmtpConfigForm({ ...smtpConfigForm, studioRecipient: e.target.value })}
                        placeholder="cadcad111.3@gmail.com"
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSmtpConfigDrawer(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSmtp}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-[#2B7574] hover:from-blue-500 hover:to-[#38918f] text-white text-xs font-semibold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingSmtp ? 'Validando conexión...' : 'Guardar y Conectar este Gmail'}</span>
                    </button>
                  </div>
                </form>
              )}

              {testEmailStatus && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{testEmailStatus}</span>
                </div>
              )}

              {/* Collapsible History Drawer */}
              {showEmailLogsDrawer && (
                <div className="pt-2 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-mono-data uppercase font-bold text-[#7cc0be]">
                      REGISTRO DE NOTIFICACIONES DISPARADAS ({emailLogs.length})
                    </span>
                    <button
                      onClick={() => setEmailLogs(getEmailNotificationLogs())}
                      className="hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Actualizar lista</span>
                    </button>
                  </div>

                  {emailLogs.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#070e11] border border-[#2B7574]/30 text-center text-xs text-zinc-400">
                      No hay registros aún. Cuando un cliente agende una reunión, los emails automáticos quedarán registrados aquí para auditoría y reenvío.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {emailLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl bg-[#070e11] border border-[#2B7574]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {log.bookingSummary?.clientName || 'Cliente'}
                              </span>
                              <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Despachado
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono-data">
                              A: {log.recipientClient} y {log.recipientStudio} · {new Date(log.sentAt).toLocaleString('es-MX')}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {log.clientHtml && (
                              <button
                                onClick={() =>
                                  setSelectedEmailForPreview({
                                    title: 'Email Enviado al Cliente',
                                    recipient: log.recipientClient || '',
                                    subject: log.clientSubject,
                                    sentAt: log.sentAt,
                                    html: log.clientHtml!,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-[#0E2931] hover:bg-[#1a4a58] text-[#7cc0be] text-[11px] border border-[#2B7574]/40 cursor-pointer"
                              >
                                Ver copia cliente
                              </button>
                            )}
                            {log.studioHtml && (
                              <button
                                onClick={() =>
                                  setSelectedEmailForPreview({
                                    title: 'Email Enviado al Estudio',
                                    recipient: log.recipientStudio || 'cadcad111.3@gmail.com',
                                    subject: log.studioSubject,
                                    sentAt: log.sentAt,
                                    html: log.studioHtml!,
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-[#0E2931] hover:bg-[#1a4a58] text-zinc-300 text-[11px] border border-zinc-700 cursor-pointer"
                              >
                                Ver copia estudio
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono-data px-2.5 py-0.5 rounded-full font-semibold uppercase ${
                            session.meetingType === 'shoot_production'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}>
                            {session.meetingType === 'shoot_production' ? '🎬 Programación de Sesión' : '📅 Descubrimiento'}
                          </span>
                          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold uppercase">
                            {session.shootType}
                          </span>
                        </div>

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
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1.5">
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
                        {session.productionType && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-mono-data">PRODUCCIÓN:</span>
                            <span className="text-amber-300 font-medium font-mono-data text-[11px]">
                              {session.productionType === 'photos'
                                ? 'Solo Fotografía'
                                : session.productionType === 'video'
                                ? 'Solo Video'
                                : 'Fotos & Video'}
                            </span>
                          </div>
                        )}
                        {session.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-mono-data">LOCACIÓN:</span>
                            <span className="text-zinc-200 font-medium text-[11px] truncate max-w-[200px]">
                              {session.location}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-mono-data">MODALIDAD:</span>
                          <span className="text-zinc-300 font-medium">
                            {session.format === 'google_meet'
                              ? 'Google Meet (Videollamada)'
                              : session.format === 'in_person'
                              ? 'Presencial / En Locación'
                              : 'Llamada telefónica'}
                          </span>
                        </div>
                      </div>

                      {/* Automated Email Notification Status Strip */}
                      <div className="p-2.5 rounded-xl bg-[#0E2931]/60 border border-[#2B7574]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-zinc-300 font-mono-data text-[11px]">
                          <MailCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Notificación automática enviada a cliente y a <strong className="text-white">cadcad111.3@gmail.com</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedEmailForPreview({
                                title: `Email: ${session.clientName} (${session.meetingType === 'shoot_production' ? 'Sesión de Rodaje' : 'Descubrimiento'})`,
                                recipient: session.clientEmail,
                                subject: session.meetingType === 'shoot_production'
                                  ? 'Confirmación de tu Sesión de Fotos/Video · CADSTUDIO'
                                  : 'Confirmación de tu Reunión con Mateo Valenzuela · CADSTUDIO',
                                sentAt: session.createdAt,
                                html: generateClientConfirmationEmailHtml(session, studioConfig),
                              })
                            }
                            className="px-2.5 py-1 rounded-lg text-[10px] font-mono-data font-semibold bg-[#12353f] hover:bg-[#1a4a58] text-[#7cc0be] border border-[#2B7574]/50 cursor-pointer transition-colors"
                          >
                            Ver Correo
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResendBookingEmail(session)}
                            disabled={resendingBookingId === session.id}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-mono-data font-semibold bg-[#2B7574]/40 hover:bg-[#2B7574] text-white border border-[#2B7574] cursor-pointer transition-colors disabled:opacity-50"
                          >
                            {resendingBookingId === session.id ? 'Reenviando...' : 'Reenviar'}
                          </button>
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

            {/* ========================================================================= */}
            {/* RECHARTS VISUALIZATION: PORTFOLIO CATEGORIES MOST FREQUENTLY CLICKED       */}
            {/* ========================================================================= */}
            {(() => {
              const categoryClicksRaw: CategoryClickStat[] = stats.categoryClicks || INITIAL_CATEGORY_CLICKS;
              const categoryClicksData = categoryClicksRaw.map((item: CategoryClickStat) => {
                const match = categoriesList.find(
                  (c) =>
                    c.id.toLowerCase() === item.categoryId.toLowerCase() ||
                    c.label.toLowerCase() === item.categoryName.toLowerCase()
                );
                return {
                  id: item.categoryId,
                  name: match ? match.label : item.categoryName,
                  clicks: item.clicks || 0,
                  views: item.views || 0,
                  percentage: item.percentage || 0,
                  lastClickedAt: item.lastClickedAt,
                };
              });

              const sortedCategoryClicks = [...categoryClicksData].sort((a, b) => {
                if (chartSortOrder === 'desc') {
                  return b.clicks - a.clicks;
                }
                return a.name.localeCompare(b.name);
              });

              const totalCategoryClicks = categoryClicksData.reduce((acc: number, c: { clicks: number }) => acc + c.clicks, 0);
              const topCategory = [...categoryClicksData].sort((a, b) => b.clicks - a.clicks)[0];
              const topCategoryPct = totalCategoryClicks > 0
                ? ((topCategory?.clicks / totalCategoryClicks) * 100).toFixed(1)
                : '0';

              const CATEGORY_COLORS = [
                '#2B7574', // CADSTUDIO signature teal
                '#38bdf8', // sky blue
                '#f59e0b', // amber gold
                '#f43f5e', // rose crimson
                '#a855f7', // purple violet
                '#10b981', // emerald green
                '#ec4899', // pink
                '#6366f1', // indigo
              ];

              const CategoryChartTooltip = ({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const share = totalCategoryClicks > 0
                    ? ((data.clicks / totalCategoryClicks) * 100).toFixed(1)
                    : '0';
                  return (
                    <div className="bg-[#0E2931] border border-[#2B7574]/80 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
                      <p className="font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30"
                          style={{ backgroundColor: payload[0].color || payload[0].fill || '#2B7574' }}
                        />
                        <span className="text-sm">{data.name}</span>
                      </p>
                      <div className="pt-1 space-y-1">
                        <div className="flex justify-between gap-6 text-zinc-300 font-mono-data text-[11px]">
                          <span>Clics de Visitantes:</span>
                          <span className="font-bold text-white text-xs">
                            {data.clicks.toLocaleString('es-ES')}
                          </span>
                        </div>
                        <div className="flex justify-between gap-6 text-zinc-400 font-mono-data text-[11px]">
                          <span>Cuota de Preferencia:</span>
                          <span className="font-bold text-emerald-400">{share}%</span>
                        </div>
                      </div>
                      {data.lastClickedAt && (
                        <p className="text-[10px] text-zinc-400 font-mono-data pt-1.5 border-t border-zinc-700/60 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#2B7574]" />
                          <span>
                            Última interacción:{' '}
                            {new Date(data.lastClickedAt).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              };

              return (
                <div className="p-6 rounded-2xl bg-[#121215] border border-[#242429] space-y-6">
                  {/* Toast notification if simulation occurred */}
                  {simulateToast && (
                    <div className="p-3 rounded-xl bg-[#2B7574]/20 border border-[#2B7574]/60 text-xs text-[#E2E2E0] flex items-center justify-between animate-fadeIn">
                      <div className="flex items-center gap-2 font-mono-data">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{simulateToast}</span>
                      </div>
                      <button
                        onClick={() => setSimulateToast(null)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Header & Controls Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#2B7574]/20 text-[#2B7574] border border-[#2B7574]/40">
                          <BarChart2 className="w-4 h-4" />
                        </span>
                        <h3 className="text-base font-bold text-white">
                          Categorías de Portafolio Más Clickeadas por Visitantes (Recharts)
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                        Visualización interactiva que mide qué géneros fotográficos atraen más atención directa y clics de navegación en el portafolio público de CADSTUDIO.
                      </p>
                    </div>

                    {/* View Controls & Action Toggles */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Bar vs Pie Toggle */}
                      <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setChartViewMode('bar')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            chartViewMode === 'bar'
                              ? 'bg-[#2B7574] text-white shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Barras</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setChartViewMode('pie')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            chartViewMode === 'pie'
                              ? 'bg-[#2B7574] text-white shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Distribución %</span>
                        </button>
                      </div>

                      {/* Sort Order Toggle */}
                      <button
                        type="button"
                        onClick={() => setChartSortOrder(chartSortOrder === 'desc' ? 'alpha' : 'desc')}
                        className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-800 flex items-center gap-1.5 transition-colors"
                        title={chartSortOrder === 'desc' ? 'Ordenar alfabéticamente' : 'Ordenar por clics'}
                      >
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#2B7574]" />
                        <span>{chartSortOrder === 'desc' ? 'Mayor a menor' : 'Alfabético'}</span>
                      </button>

                      {/* Reset Button */}
                      <button
                        type="button"
                        onClick={handleResetCategoryClicks}
                        className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors flex items-center gap-1"
                        title="Calibrar estadísticas a valores base"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span className="hidden sm:inline">Calibrar</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono-data">
                        <span>CATEGORÍA LÍDER</span>
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-sm font-bold text-white block truncate">
                          {topCategory?.name || 'N/A'}
                        </span>
                        <span className="text-[11px] font-mono-data text-emerald-400 font-semibold">
                          {topCategory?.clicks.toLocaleString()} clics ({topCategoryPct}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono-data">
                        <span>TOTAL CLICS EN WEB</span>
                        <MousePointerClick className="w-3.5 h-3.5 text-[#2B7574]" />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-base font-bold font-mono-data text-white block">
                          {totalCategoryClicks.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono-data">
                          Interacciones de usuarios
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono-data">
                        <span>GÉNEROS ACTIVOS</span>
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-base font-bold font-mono-data text-white block">
                          {categoryClicksData.length}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono-data">
                          Categorías monitoreadas
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono-data">
                        <span>PROMEDIO POR GÉNERO</span>
                        <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                      </div>
                      <div className="mt-1.5">
                        <span className="text-base font-bold font-mono-data text-white block">
                          {categoryClicksData.length > 0
                            ? Math.round(totalCategoryClicks / categoryClicksData.length).toLocaleString()
                            : 0}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono-data">
                          Clics por categoría
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Container */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80">
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-mono-data">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>MÉTRICA ACTIVA: CLICS REALES DE VISITANTES</span>
                      </span>
                      <span>Renderizado con Recharts ResponsiveContainer</span>
                    </div>

                    <div className="w-full h-80 sm:h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        {chartViewMode === 'bar' ? (
                          <BarChart
                            data={sortedCategoryClicks}
                            margin={{ top: 20, right: 20, left: 10, bottom: 45 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis
                              dataKey="name"
                              stroke="#71717a"
                              fontSize={11}
                              interval={0}
                              angle={-15}
                              textAnchor="end"
                              tick={{ fill: '#d4d4d8' }}
                            />
                            <YAxis
                              stroke="#71717a"
                              fontSize={11}
                              tick={{ fill: '#a1a1aa' }}
                              tickFormatter={(v) => v.toLocaleString()}
                            />
                            <RechartsTooltip
                              content={<CategoryChartTooltip />}
                              cursor={{ fill: 'rgba(43, 117, 116, 0.12)' }}
                            />
                            <Bar
                              dataKey="clicks"
                              name="Clics"
                              radius={[6, 6, 0, 0]}
                              animationDuration={750}
                            >
                              {sortedCategoryClicks.map((entry, idx) => (
                                <Cell
                                  key={`cell-${entry.id || idx}`}
                                  fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        ) : (
                          <PieChart>
                            <RechartsTooltip content={<CategoryChartTooltip />} />
                            <Pie
                              data={sortedCategoryClicks}
                              dataKey="clicks"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={120}
                              paddingAngle={4}
                              animationDuration={750}
                              label={({ name, percent }: { name?: string | number; percent?: number }) =>
                                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                              }
                            >
                              {sortedCategoryClicks.map((entry, idx) => (
                                <Cell
                                  key={`pie-cell-${entry.id || idx}`}
                                  fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Simulator & Detailed Ranking Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                    {/* Simulator Card */}
                    <div className="lg:col-span-4 p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MousePointerClick className="w-4 h-4 text-[#2B7574]" />
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                            Simulador de Clics de Visitante
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed font-light">
                          Selecciona cualquier categoría para simular la visita de un usuario en el portafolio público. Podrás ver la animación de Recharts y el conteo en tiempo real.
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <label className="block text-[11px] font-mono-data text-zinc-400">
                          Seleccionar Categoría para probar:
                        </label>
                        <select
                          value={simulatedCategory}
                          onChange={(e) => setSimulatedCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-[#2B7574]"
                        >
                          {categoriesList.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label} ({categoryClicksData.find((c: { id: string; clicks: number }) => c.id === cat.id)?.clicks || 0} clics)
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleSimulateCategoryClick(simulatedCategory)}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#2B7574] hover:bg-[#3b9493] text-white transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#2B7574]/20"
                        >
                          <MousePointerClick className="w-4 h-4" />
                          <span>Simular Clic de Visitante (+1)</span>
                        </button>
                      </div>
                    </div>

                    {/* Ranking Table */}
                    <div className="lg:col-span-8 p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono-data">
                          Desglose de Preferencia por Género Visual
                        </h4>
                        <span className="text-[11px] font-mono-data text-zinc-500">
                          {categoryClicksData.length} categorías
                        </span>
                      </div>

                      <div className="space-y-2 pt-1">
                        {sortedCategoryClicks.map((item, index) => {
                          const pct = totalCategoryClicks > 0
                            ? Math.round((item.clicks / totalCategoryClicks) * 100)
                            : 0;
                          const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

                          return (
                            <div
                              key={item.id}
                              className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono-data font-bold text-[11px] shrink-0 ${
                                  index === 0
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : index === 1
                                    ? 'bg-zinc-700/30 text-zinc-300 border border-zinc-600/40'
                                    : index === 2
                                    ? 'bg-orange-900/30 text-orange-300 border border-orange-700/40'
                                    : 'bg-zinc-900 text-zinc-500'
                                }`}>
                                  #{index + 1}
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-white truncate">
                                      {item.name}
                                    </span>
                                    <span className="font-mono-data text-[11px] text-zinc-400">
                                      <strong className="text-white font-bold">{item.clicks.toLocaleString()}</strong> clics ({pct}%)
                                    </span>
                                  </div>

                                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${pct}%`, backgroundColor: color }}
                                      className="h-full rounded-full transition-all duration-500"
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSimulateCategoryClick(item.id)}
                                className="px-2.5 py-1 text-[11px] font-mono-data font-semibold text-[#2B7574] hover:text-white bg-[#2B7574]/15 hover:bg-[#2B7574] rounded-lg transition-colors border border-[#2B7574]/30 shrink-0"
                                title="Sumar clic de prueba"
                              >
                                +1 Clic
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

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

      {/* Modal: Add or Edit Client Gallery (Full Photo Management & Visual Reorder) */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className={`bg-[#121215] border border-[#27272a] rounded-2xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto ${
            editingClient ? 'max-w-5xl' : 'max-w-xl'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5 text-rose-500" />
                  <span>
                    {editingClient ? `Editar Galería Privada: ${editingClient.clientName}` : 'Nueva Galería de Entrega Privada'}
                  </span>
                </h3>
                {editingClient && (
                  <p className="text-xs text-zinc-400 mt-0.5 font-mono-data">
                    {editingClient.title} · <strong className="text-rose-400">{editingClient.files.length} fotografías</strong> · Token: {editingClient.token}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editingClient && (
                  <button
                    type="button"
                    onClick={() => onOpenClientPortalWithToken(editingClient.token)}
                    className="px-3 py-1.5 text-xs text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Abrir vista previa del cliente"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ver como Cliente</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowAddClientModal(false);
                    setEditingClient(null);
                  }}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {editingClient ? (
              <div className="space-y-4">
                {/* Navigation Tabs inside the Editor */}
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-thin">
                  <button
                    type="button"
                    onClick={() => setClientEditTab('acomodo')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      clientEditTab === 'acomodo'
                        ? 'bg-[#2B7574] text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>1. Acomodo Visual & Secuencia ({editingClient.files.length} fotos)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClientEditTab('add_photos')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      clientEditTab === 'add_photos'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>2. Agregar Fotos (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setClientEditTab('info')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                      clientEditTab === 'info'
                        ? 'bg-zinc-700 text-white shadow-md'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>3. Datos de la Entrega & Cliente</span>
                  </button>
                </div>

                {/* TAB 1: ACOMODO VISUAL & SECUENCIA (LIKE PORTFOLIO) */}
                {clientEditTab === 'acomodo' && (
                  <div className="space-y-4 animate-in fade-in">
                    {/* Filmstrip Sequence Ribbon */}
                    {editingClient.files && editingClient.files.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-[#071317] border border-[#2B7574]/40 space-y-2">
                        <div className="flex flex-wrap items-center justify-between text-[11px] font-mono-data text-zinc-400 gap-2">
                          <span className="text-[#7cc0be] font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            TIRA DE SECUENCIA ({editingClient.files.length} FOTOGRAFÍAS)
                          </span>
                          <span className="text-zinc-500">
                            Arrastra tarjetas o usa los selectores para cambiar el orden
                          </span>
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                          {editingClient.files.map((file, idx) => {
                            const isCover = (editingClient.coverImage === file.previewUrl || editingClient.coverImage === file.originalUrl);
                            return (
                              <div
                                key={file.id}
                                className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all group ${
                                  isCover ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-[#2B7574]/50'
                                }`}
                                title={`#${idx + 1}: ${file.title}`}
                              >
                                <img src={file.previewUrl} alt={file.title} className="w-full h-full object-cover" />
                                <span className="absolute top-0 left-0 bg-black/80 px-1 text-[9px] font-mono-data font-bold text-white rounded-br">
                                  #{idx + 1}
                                </span>
                                {isCover && (
                                  <span className="absolute bottom-0 right-0 bg-amber-400 text-black px-1 text-[8px] font-bold rounded-tl" title="Portada">
                                    ⭐
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Photos Grid with Full Controls */}
                    {editingClient.files.length === 0 ? (
                      <div className="p-12 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                        <ImageIcon className="w-10 h-10 text-zinc-500 mx-auto" />
                        <h4 className="text-white font-bold text-sm">Esta galería aún no tiene fotografías</h4>
                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                          Sube fotos desde tu computadora o sincroniza una carpeta de Google Drive en la pestaña "Agregar Fotos".
                        </p>
                        <button
                          type="button"
                          onClick={() => setClientEditTab('add_photos')}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
                        >
                          Ir a Agregar Fotos
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                          <span className="font-mono-data">
                            Mostrando {editingClient.files.length} fotografías · Orden interactivo en tiempo real
                          </span>
                          <button
                            type="button"
                            onClick={() => setClientEditTab('add_photos')}
                            className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar más fotos</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[52vh] overflow-y-auto pr-1">
                          {editingClient.files.map((file, idx) => {
                            const isCover = (editingClient.coverImage === file.previewUrl || editingClient.coverImage === file.originalUrl);
                            const isDragging = draggedGalleryPhotoId === file.id;
                            const isDragOver = dragOverGalleryPhotoId === file.id;

                            return (
                              <div
                                key={file.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedGalleryPhotoId(file.id);
                                  e.dataTransfer.setData('text/plain', file.id);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (dragOverGalleryPhotoId !== file.id) setDragOverGalleryPhotoId(file.id);
                                }}
                                onDragLeave={() => {
                                  if (dragOverGalleryPhotoId === file.id) setDragOverGalleryPhotoId(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const sourceId = e.dataTransfer.getData('text/plain') || draggedGalleryPhotoId;
                                  setDraggedGalleryPhotoId(null);
                                  setDragOverGalleryPhotoId(null);
                                  if (sourceId && sourceId !== file.id) {
                                    handleDropGalleryFile(editingClient.id, sourceId, file.id);
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggedGalleryPhotoId(null);
                                  setDragOverGalleryPhotoId(null);
                                }}
                                className={`group relative rounded-xl overflow-hidden bg-[#0d1a1e] border transition-all duration-200 select-none ${
                                  isCover ? 'border-amber-400/90 ring-2 ring-amber-400/30' : 'border-[#2B7574]/40 hover:border-[#2B7574]'
                                } ${isDragging ? 'opacity-30 scale-95' : ''} ${
                                  isDragOver ? 'ring-4 ring-[#2B7574] scale-102 border-white' : ''
                                }`}
                              >
                                {/* Media Container */}
                                <div className="relative aspect-[4/3] bg-black overflow-hidden">
                                  <img
                                    src={file.previewUrl}
                                    alt={file.title}
                                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                  />

                                  {/* Top Banner Overlays */}
                                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 z-20">
                                    {/* Cover Badge / Toggle */}
                                    <button
                                      type="button"
                                      onClick={() => handleSetGalleryCoverFromFile(editingClient.id, file.previewUrl)}
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono-data font-bold flex items-center gap-1 shadow-md transition-all ${
                                        isCover
                                          ? 'bg-amber-400 text-black border border-amber-300'
                                          : 'bg-black/80 hover:bg-amber-500/80 text-zinc-300 hover:text-black border border-white/20'
                                      }`}
                                      title={isCover ? 'Es la portada actual' : 'Clic para hacer portada de la galería'}
                                    >
                                      <Star className={`w-2.5 h-2.5 ${isCover ? 'fill-black' : ''}`} />
                                      <span>{isCover ? 'PORTADA' : 'HACER PORTADA'}</span>
                                    </button>

                                    {/* Grip + Position Selector */}
                                    <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-white/20 text-[#E2E2E0]">
                                      <div
                                        className="cursor-grab active:cursor-grabbing p-0.5 text-[#2B7574]"
                                        title="Arrastrar para mover foto"
                                      >
                                        <GripVertical className="w-3.5 h-3.5" />
                                      </div>
                                      <select
                                        value={idx + 1}
                                        onChange={(e) => handleSetGalleryFilePosition(editingClient.id, file.id, Number(e.target.value))}
                                        className="bg-transparent text-[11px] font-mono-data font-bold text-white focus:outline-none cursor-pointer"
                                        title="Cambiar posición directamente"
                                      >
                                        {editingClient.files.map((_, i) => (
                                          <option key={i + 1} value={i + 1} className="bg-zinc-900 text-white">
                                            #{i + 1} de {editingClient.files.length}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Hover Actions Bar */}
                                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 z-10">
                                    <div className="pt-7 flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleMoveGalleryFile(editingClient.id, file.id, 'top')}
                                        disabled={idx === 0}
                                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
                                        title="Mover al principio"
                                      >
                                        <ChevronsUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveGalleryFile(editingClient.id, file.id, 'up')}
                                        disabled={idx === 0}
                                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
                                        title="Subir un lugar"
                                      >
                                        <ArrowUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveGalleryFile(editingClient.id, file.id, 'down')}
                                        disabled={idx === editingClient.files.length - 1}
                                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
                                        title="Bajar un lugar"
                                      >
                                        <ArrowDown className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleMoveGalleryFile(editingClient.id, file.id, 'bottom')}
                                        disabled={idx === editingClient.files.length - 1}
                                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 disabled:opacity-30 text-white transition-colors"
                                        title="Mover al final"
                                      >
                                        <ChevronsDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/20">
                                      <span className="text-[10px] font-mono-data text-zinc-300 truncate max-w-[130px]">
                                        {file.title}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(`¿Eliminar la fotografía "${file.title}" de esta entrega privada?`)) {
                                            const updated = removePhotoFromGallery(editingClient.id, file.id);
                                            if (updated) setEditingClient(updated);
                                            setGalleries(getClientGalleries());
                                            setSaveSuccessMsg('Fotografía eliminada de la galería.');
                                            setTimeout(() => setSaveSuccessMsg(null), 2000);
                                          }
                                        }}
                                        className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-300 hover:text-white transition-colors cursor-pointer"
                                        title="Eliminar de la galería"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Caption info */}
                                <div className="p-2.5 bg-[#0a1417] flex items-center justify-between text-[11px] font-mono-data">
                                  <span className="text-zinc-300 font-bold truncate max-w-[150px]">
                                    #{idx + 1} · {file.title}
                                  </span>
                                  <span className="text-zinc-500 text-[10px]">
                                    {file.fileSize || 'Alta Res'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: AGREGAR FOTOS A LA GALERÍA */}
                {clientEditTab === 'add_photos' && (
                  <div className="space-y-5 animate-in fade-in text-xs">
                    {/* Option A: Dropzone Local File Upload */}
                    <div className="p-5 rounded-2xl bg-[#091519] border border-[#2B7574]/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-[#7cc0be]" />
                          <span>Opción 1: Subir Archivos Fotográficos desde tu Computadora</span>
                        </span>
                        <span className="text-[10px] font-mono-data text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          Multi-Archivo Soportado
                        </span>
                      </div>

                      <label className="p-8 rounded-2xl border-2 border-dashed border-[#2B7574]/60 bg-[#070e11] hover:border-[#2B7574] transition-colors flex flex-col items-center justify-center cursor-pointer text-center group">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={isProcessingLocalFiles}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length === 0 || !editingClient) return;
                            setIsProcessingLocalFiles(true);
                            try {
                              const newItems: ClientFile[] = [];
                              for (let i = 0; i < files.length; i++) {
                                const f = files[i];
                                const dataUrl = await new Promise<string>((resolve) => {
                                  const reader = new FileReader();
                                  reader.onload = (ev) => resolve(ev.target?.result as string);
                                  reader.readAsDataURL(f);
                                });
                                newItems.push({
                                  id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
                                  title: f.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                                  type: 'image',
                                  previewUrl: dataUrl,
                                  originalUrl: dataUrl,
                                  aspectRatio: '16:9',
                                  fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} MB RAW`,
                                  dimensions: '8368 × 4707 px',
                                  downloadsCount: 0,
                                });
                              }
                              const updatedGal = addPhotosToGallery(editingClient.id, newItems);
                              if (updatedGal) setEditingClient(updatedGal);
                              setGalleries(getClientGalleries());
                              setSaveSuccessMsg(`¡${newItems.length} fotografías añadidas a ${editingClient.clientName}!`);
                              setTimeout(() => setSaveSuccessMsg(null), 3000);
                              setClientEditTab('acomodo');
                            } catch (err: any) {
                              console.error('Error processing files:', err);
                            } finally {
                              setIsProcessingLocalFiles(false);
                            }
                          }}
                          className="hidden"
                        />
                        <Upload className="w-10 h-10 text-[#2B7574] group-hover:scale-110 transition-transform mb-2" />
                        <span className="font-bold text-white text-xs">
                          {isProcessingLocalFiles ? 'Procesando fotografías en alta resolución...' : 'Haz clic o arrastra fotos aquí'}
                        </span>
                        <span className="text-[11px] text-zinc-400 mt-1">
                          Soporta múltiples archivos JPG, PNG, WEBP o RAW a la vez
                        </span>
                      </label>
                    </div>

                    {/* Option B: Add by URL */}
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                      <span className="font-bold text-white text-xs block">
                        Opción 2: Añadir Foto por Enlace / URL Directo
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="url"
                          value={manualPhotoUrl}
                          onChange={(e) => setManualPhotoUrl(e.target.value)}
                          placeholder="https://ejemplo.com/foto.jpg"
                          className="sm:col-span-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!manualPhotoUrl.trim() || !editingClient) return;
                            const newPhoto: ClientFile = {
                              id: `file-url-${Date.now()}`,
                              title: `Foto_${editingClient.files.length + 1}`,
                              type: 'image',
                              previewUrl: manualPhotoUrl.trim(),
                              originalUrl: manualPhotoUrl.trim(),
                              aspectRatio: '16:9',
                              fileSize: '45.0 MB RAW',
                              dimensions: '8368 × 4707 px',
                              downloadsCount: 0,
                            };
                            const updated = addPhotosToGallery(editingClient.id, [newPhoto]);
                            if (updated) setEditingClient(updated);
                            setGalleries(getClientGalleries());
                            setManualPhotoUrl('');
                            setSaveSuccessMsg('¡Foto añadida a la galería!');
                            setTimeout(() => setSaveSuccessMsg(null), 2500);
                            setClientEditTab('acomodo');
                          }}
                          className="px-4 py-2.5 bg-[#2B7574] hover:bg-[#38918f] text-white font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Añadir a Galería
                        </button>
                      </div>
                    </div>

                    {/* Option C: Google Drive Sync */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-[#0e1d22] border border-blue-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <FolderSync className="w-4 h-4 text-blue-400" />
                          <span>Opción 3: Importar Carpeta Completa desde Google Drive</span>
                        </h5>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Sincroniza todas las fotos de una carpeta de Drive directamente en esta galería privada.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDriveSyncGalleryId(editingClient.id);
                          setDriveSyncMode('galleries');
                          setShowDriveSyncModal(true);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <FolderSync className="w-3.5 h-3.5" />
                        <span>Abrir Sincronizador de Drive</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: DATOS DE LA ENTREGA & CLIENTE */}
                {clientEditTab === 'info' && (
                  <form onSubmit={handleSaveClient} className="space-y-4 text-xs animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono-data text-zinc-400 mb-1">NOMBRE DEL CLIENTE *</label>
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
                        <label className="block font-mono-data text-zinc-400 mb-1">EMAIL DEL CLIENTE *</label>
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
                      <label className="block font-mono-data text-zinc-400 mb-1">TÍTULO DEL PROYECTO / SESIÓN *</label>
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

                    <div>
                      <label className="block font-mono-data text-zinc-400 mb-1">URL IMAGEN DE PORTADA</label>
                      <input
                        type="text"
                        value={clientForm.coverImage}
                        onChange={(e) => setClientForm({ ...clientForm, coverImage: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500 font-mono-data"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddClientModal(false);
                          setEditingClient(null);
                        }}
                        className="px-4 py-2 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl cursor-pointer"
                      >
                        Guardar Cambios de la Galería
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Create New Client Gallery Form */
              <form onSubmit={handleSaveClient} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono-data text-zinc-400 mb-1">NOMBRE DEL CLIENTE *</label>
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
                    <label className="block font-mono-data text-zinc-400 mb-1">EMAIL DEL CLIENTE *</label>
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
                  <label className="block font-mono-data text-zinc-400 mb-1">TÍTULO DEL PROYECTO / SESIÓN *</label>
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
                    className="px-4 py-2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl cursor-pointer"
                  >
                    Crear Galería
                  </button>
                </div>
              </form>
            )}
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

            <form onSubmit={handleSavePortfolioItem} className="space-y-4 text-xs">
              {/* Media File Upload or URL with Live Preview */}
              <div className="space-y-2">
                <label className="block font-mono-data text-zinc-300 font-semibold">
                  ARCHIVO FOTOGRÁFICO O VIDEO *
                </label>

                {/* Dropzone / File Picker */}
                <div className="p-4 rounded-xl border-2 border-dashed border-[#2B7574]/60 bg-[#070e11] hover:border-[#2B7574] transition-colors text-center">
                  <label className="cursor-pointer block space-y-2">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const isVid = file.type.startsWith('video/');
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          if (dataUrl) {
                            setPortfolioFileUploadPreview(dataUrl);
                            setPortfolioForm((prev) => ({
                              ...prev,
                              url: dataUrl,
                              videoSrc: isVid ? dataUrl : prev.videoSrc,
                              mediaType: isVid ? 'video' : 'image',
                              title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                            }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <div className="w-10 h-10 mx-auto rounded-full bg-[#2B7574]/20 border border-[#2B7574]/50 flex items-center justify-center text-[#2B7574]">
                      <Upload className="w-5 h-5 text-[#E2E2E0]" />
                    </div>
                    <div>
                      <span className="font-semibold text-[#E2E2E0] block text-xs">
                        Haga clic para subir Foto o Video desde su dispositivo
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-mono-data">
                        Formatos soportados: JPG, PNG, WEBP, RAW, MP4, MOV, WEBM
                      </span>
                    </div>
                  </label>
                </div>

                {/* Direct URL input alternative */}
                <div className="pt-1">
                  <label className="block text-[11px] font-mono-data text-zinc-400 mb-1">
                    O INGRESE LA URL DIRECTA DE LA FOTO / VIDEO:
                  </label>
                  <input
                    type="text"
                    value={portfolioForm.url}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPortfolioForm({ ...portfolioForm, url: val });
                      setPortfolioFileUploadPreview(val);
                    }}
                    placeholder="https://... o /src/assets/..."
                    className="w-full px-3 py-2 rounded-lg bg-[#070e11] border border-zinc-700 text-white font-mono-data text-xs focus:outline-none focus:border-[#2B7574]"
                  />
                </div>

                {/* Media Live Preview */}
                {(portfolioFileUploadPreview || portfolioForm.url) && (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#2B7574]/50 max-h-48 mx-auto mt-2">
                    {portfolioForm.mediaType === 'video' ? (
                      <video
                        src={portfolioForm.videoSrc || portfolioForm.url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={portfolioFileUploadPreview || portfolioForm.url}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono-data text-[#E2E2E0] border border-white/20">
                      Vista Previa Activa
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">TÍTULO DE LA OBRA *</label>
                <input
                  type="text"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  placeholder="ej. Silueta en Chiaroscuro"
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">CATEGORÍA</label>
                  <select
                    value={portfolioForm.category}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
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
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                  >
                    <option value="16:9">16:9 (Panorámico / Cine)</option>
                    <option value="9:16">9:16 (Vertical Reel / Story)</option>
                    <option value="3:4">3:4 (Retrato Clásico)</option>
                    <option value="4:3">4:3 (Editorial)</option>
                    <option value="1:1">1:1 (Cuadrado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">TIPO DE MEDIO</label>
                  <select
                    value={portfolioForm.mediaType}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, mediaType: e.target.value as MediaType })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                  >
                    <option value="image">Fotografía (Imagen)</option>
                    <option value="video">Video (Audiovisual)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">AÑO DE PRODUCCIÓN</label>
                  <input
                    type="text"
                    value={portfolioForm.year}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, year: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                  />
                </div>
              </div>

              {portfolioForm.mediaType === 'video' && (
                <div>
                  <label className="block font-mono-data text-zinc-400 mb-1">URL DEL ARCHIVO DE VIDEO (.MP4 / WEBM)</label>
                  <input
                    type="text"
                    value={portfolioForm.videoSrc}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, videoSrc: e.target.value })}
                    placeholder="https://... o video en base64"
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono-data text-zinc-400 mb-1">CÁMARA / SENSOR EXIF</label>
                <input
                  type="text"
                  value={portfolioForm.camera}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, camera: e.target.value })}
                  placeholder="ej. Leica SL2-S · Hasselblad H6D · Sony FX6"
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-[#2B7574]"
                />
              </div>

              {/* isFeatured Boolean Selector */}
              <div className="p-3.5 rounded-xl bg-[#070e11] border border-[#2B7574]/40 space-y-2">
                <span className="text-[11px] font-mono-data text-zinc-300 font-bold block">
                  VISIBILIDAD EN EL PORTAFOLIO PÚBLICO (isFeatured):
                </span>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={portfolioForm.isFeatured !== false}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-[#2B7574] rounded focus:ring-0 focus:ring-offset-0 bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="text-white font-semibold block">
                      {portfolioForm.isFeatured !== false
                        ? '🌐 Visible en Portafolio Público (isFeatured: true)'
                        : '🔒 Oculto en Panel de Administrador (isFeatured: false)'}
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      {portfolioForm.isFeatured !== false
                        ? 'Esta obra se proyectará en la web pública para los clientes y visitantes.'
                        : 'Esta obra permanecerá oculta y solo será visible para ti dentro del panel de control.'}
                    </span>
                  </div>
                </label>
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
                  className="px-5 py-2.5 bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold rounded-xl transition-colors shadow-lg"
                >
                  {editingPortfolioItem ? 'Guardar Cambios' : 'Añadir al Portafolio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Photo Switcher for ANY Website Photo or Work */}
      {showPhotoSwitcherModal && photoSwitcherTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0E2931] border border-[#2B7574] rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B7574]/40">
              <div>
                <span className="text-[10px] font-mono-data uppercase text-[#2B7574] font-bold block">
                  {photoSwitcherTarget.sectionName}
                </span>
                <h3 className="font-display text-lg font-bold text-[#E2E2E0] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#2B7574]" />
                  <span>Cambiar Imagen: {photoSwitcherTarget.title}</span>
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPhotoSwitcherModal(false);
                  setPhotoSwitcherTarget(null);
                  setPhotoSwitcherNewUrl('');
                }}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Option A: Upload local file */}
              <div>
                <label className="block font-mono-data text-zinc-300 font-semibold mb-1.5">
                  1. SELECCIONAR ARCHIVO DESDE TU DISPOSITIVO:
                </label>
                <div className="p-4 rounded-xl border-2 border-dashed border-[#2B7574]/60 bg-[#070e11] hover:border-[#2B7574] transition-colors text-center">
                  <label className="cursor-pointer block space-y-1.5">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handlePhotoSwitcherFileSelected}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 mx-auto text-[#2B7574]" />
                    <span className="text-xs font-semibold text-[#E2E2E0] block">
                      {isUploadingSwitcherFile ? 'Procesando archivo...' : 'Haz clic para seleccionar nueva foto o video'}
                    </span>
                    <span className="text-[10px] text-zinc-400 block font-mono-data">
                      Reemplazo instantáneo de la imagen en la web
                    </span>
                  </label>
                </div>
              </div>

              {/* Option B: Enter URL */}
              <div>
                <label className="block font-mono-data text-zinc-300 font-semibold mb-1">
                  2. O PEGAR ENLACE / URL DE LA IMAGEN:
                </label>
                <input
                  type="text"
                  value={photoSwitcherNewUrl}
                  onChange={(e) => setPhotoSwitcherNewUrl(e.target.value)}
                  placeholder="https://... o /src/assets/..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#070e11] border border-[#2B7574]/50 text-white font-mono-data text-xs focus:outline-none focus:border-[#2B7574]"
                />
              </div>

              {/* Side by side Preview */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="block text-[10px] font-mono-data text-zinc-400 mb-1">FOTO ACTUAL:</span>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black border border-zinc-700">
                    <img
                      src={photoSwitcherTarget.currentUrl}
                      alt="Actual"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-mono-data text-emerald-400 mb-1 font-bold">NUEVA FOTO:</span>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black border border-[#2B7574]">
                    {photoSwitcherNewUrl ? (
                      photoSwitcherMediaType === 'video' ? (
                        <video
                          src={photoSwitcherNewUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={photoSwitcherNewUrl}
                          alt="Nueva"
                          className="w-full h-full object-cover"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[11px] p-2 text-center">
                        Selecciona o pega una imagen
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2B7574]/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoSwitcherModal(false);
                    setPhotoSwitcherTarget(null);
                    setPhotoSwitcherNewUrl('');
                  }}
                  className="px-4 py-2 text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePhotoSwitch}
                  disabled={!photoSwitcherNewUrl.trim()}
                  className="px-5 py-2.5 bg-[#2B7574] hover:bg-[#3b9493] disabled:opacity-40 text-[#E2E2E0] font-semibold rounded-xl transition-colors shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Aplicar Cambio a Toda la Web</span>
                </button>
              </div>
            </div>
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
                <label className="block font-mono-data text-zinc-400 mb-1">IMAGEN DE PORTADA DE LA CATEGORÍA</label>
                <div className="flex gap-2 items-center mb-1.5">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[#E2E2E0] text-xs flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#2B7574]" />
                    <span>Subir archivo local</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          if (dataUrl) setCategoryForm((prev) => ({ ...prev, coverImage: dataUrl }));
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono-data">o escribe la URL debajo:</span>
                </div>
                <input
                  type="text"
                  value={categoryForm.coverImage}
                  onChange={(e) => setCategoryForm({ ...categoryForm, coverImage: e.target.value })}
                  placeholder="https://... o /src/assets/..."
                  className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-rose-500"
                />
                {categoryForm.coverImage && (
                  <div className="mt-2 aspect-video max-h-24 rounded-lg overflow-hidden border border-zinc-700 bg-black">
                    <img src={categoryForm.coverImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
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
                {uploadTargetGallery.files.map((f, idx) => (
                  <div key={f.id} className="relative group rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                    <img src={f.previewUrl} alt={f.title} className="w-full h-20 object-cover" />
                    <div className="absolute top-1 left-1 flex items-center gap-0.5 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === 0) return;
                          const newFiles = [...uploadTargetGallery.files];
                          const temp = newFiles[idx];
                          newFiles[idx] = newFiles[idx - 1];
                          newFiles[idx - 1] = temp;
                          reorderClientGalleryFiles(uploadTargetGallery.id, newFiles.map((fl) => fl.id));
                          setGalleries(getClientGalleries());
                          setUploadTargetGallery({ ...uploadTargetGallery, files: newFiles });
                        }}
                        disabled={idx === 0}
                        className="p-1 rounded bg-black/80 hover:bg-[#2B7574] disabled:opacity-20 text-white"
                        title="Mover foto antes"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === uploadTargetGallery.files.length - 1) return;
                          const newFiles = [...uploadTargetGallery.files];
                          const temp = newFiles[idx];
                          newFiles[idx] = newFiles[idx + 1];
                          newFiles[idx + 1] = temp;
                          reorderClientGalleryFiles(uploadTargetGallery.id, newFiles.map((fl) => fl.id));
                          setGalleries(getClientGalleries());
                          setUploadTargetGallery({ ...uploadTargetGallery, files: newFiles });
                        }}
                        disabled={idx === uploadTargetGallery.files.length - 1}
                        className="p-1 rounded bg-black/80 hover:bg-[#2B7574] disabled:opacity-20 text-white"
                        title="Mover foto después"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePhotoFromGallery(f.id)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-zinc-400 hover:text-rose-400"
                      title="Eliminar de la galería"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="p-1.5 text-[10px] font-mono-data text-zinc-300 truncate">
                      #{idx + 1} {f.title}
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

      {/* MODAL: MESA DE LUZ & ACOMODO VISUAL GRÁFICO DE GALERÍA PRIVADA */}
      {visualReorderGallery && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-[#0E2931] border border-[#2B7574] rounded-2xl max-w-5xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#2B7574]/40 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-[#2B7574]" />
                  <h3 className="font-display text-lg font-bold text-[#E2E2E0]">
                    Mesa de Luz y Acomodo Visual: {visualReorderGallery.clientName}
                  </h3>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Organice el orden de visualización de las {visualReorderGallery.files.length} fotografías de esta entrega privada. Arrastre cualquier tarjeta o use los controles rápidos.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenClientPortalWithToken(visualReorderGallery.token)}
                  className="px-3 py-1.5 text-xs text-rose-300 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/60 rounded-xl transition-colors flex items-center gap-1.5"
                  title="Ver cómo ve el cliente esta sala"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Portal del Cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisualReorderGallery(null)}
                  className="px-4 py-1.5 bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold text-xs rounded-xl transition-colors shadow"
                >
                  Listo / Cerrar
                </button>
              </div>
            </div>

            {/* Instruction strip */}
            <div className="p-3 rounded-xl bg-[#070e11] border border-[#2B7574]/30 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#E2E2E0]">
                <GripVertical className="w-4 h-4 text-[#2B7574]" />
                <span className="font-mono-data text-[11px]">
                  <strong>Arrastrar & Soltar:</strong> Mueva cualquier foto sobre otra para intercambiar su lugar.
                </span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 text-[11px] font-mono-data">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Usa la estrella para definir la foto de portada de la galería</span>
              </div>
            </div>

            {/* Panoramic Filmstrip Ribbon for this client */}
            {visualReorderGallery.files.length > 0 && (
              <div className="p-2.5 rounded-xl bg-[#070e11]/80 border border-[#2B7574]/30 space-y-1.5">
                <span className="text-[10px] font-mono-data text-zinc-400 font-bold block">
                  SECUENCIA EN MINIATURA ({visualReorderGallery.files.length} fotos):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#2B7574]">
                  {visualReorderGallery.files.map((file, idx) => (
                    <div
                      key={`gallery-strip-${file.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', file.id);
                        setDraggedGalleryFileId(file.id);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverGalleryFileId !== file.id) setDragOverGalleryFileId(file.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverGalleryFileId === file.id) setDragOverGalleryFileId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const srcId = e.dataTransfer.getData('text/plain') || draggedGalleryFileId;
                        if (srcId && srcId !== file.id) handleDropGalleryFile(visualReorderGallery.id, srcId, file.id);
                        setDraggedGalleryFileId(null);
                        setDragOverGalleryFileId(null);
                      }}
                      onDragEnd={() => {
                        setDraggedGalleryFileId(null);
                        setDragOverGalleryFileId(null);
                      }}
                      className={`shrink-0 w-16 aspect-square rounded-lg overflow-hidden border cursor-grab active:cursor-grabbing relative ${
                        draggedGalleryFileId === file.id
                          ? 'opacity-35 border-dashed border-[#2B7574]'
                          : dragOverGalleryFileId === file.id
                          ? 'ring-2 ring-[#2B7574] border-white scale-105'
                          : 'border-[#2B7574]/40 hover:border-[#2B7574]'
                      } bg-black`}
                      title={`#${idx + 1} ${file.title}`}
                    >
                      <img src={file.previewUrl} alt={file.title} className="w-full h-full object-cover" />
                      <span className="absolute top-0.5 left-0.5 px-1 rounded bg-black/80 text-[9px] font-mono-data text-white font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Contact Sheet Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              {visualReorderGallery.files.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#2B7574]/20 border border-[#2B7574]/50 flex items-center justify-center text-[#2B7574]">
                    <Upload className="w-6 h-6 text-[#E2E2E0]" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Esta galería aún no tiene fotografías cargadas</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Presione en &quot;Subir Fotos&quot; o conecte una carpeta de Google Drive para poblar esta entrega.
                  </p>
                  <button
                    onClick={() => {
                      const gal = visualReorderGallery;
                      setVisualReorderGallery(null);
                      handleOpenUploadModal(gal);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl"
                  >
                    Subir Fotos a esta Galería
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
                  {visualReorderGallery.files.map((file, idx) => {
                    const isDragging = draggedGalleryFileId === file.id;
                    const isDragOver = dragOverGalleryFileId === file.id;
                    const isCover = visualReorderGallery.coverImage === file.previewUrl || visualReorderGallery.coverImage === file.originalUrl;

                    return (
                      <div
                        key={file.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', file.id);
                          setDraggedGalleryFileId(file.id);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverGalleryFileId !== file.id) setDragOverGalleryFileId(file.id);
                        }}
                        onDragLeave={() => {
                          if (dragOverGalleryFileId === file.id) setDragOverGalleryFileId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const srcId = e.dataTransfer.getData('text/plain') || draggedGalleryFileId;
                          if (srcId && srcId !== file.id) handleDropGalleryFile(visualReorderGallery.id, srcId, file.id);
                          setDraggedGalleryFileId(null);
                          setDragOverGalleryFileId(null);
                        }}
                        onDragEnd={() => {
                          setDraggedGalleryFileId(null);
                          setDragOverGalleryFileId(null);
                        }}
                        className={`p-3 rounded-xl bg-[#070e11] border transition-all flex flex-col justify-between gap-2.5 ${
                          isDragging
                            ? 'opacity-30 border-dashed border-[#2B7574] scale-95'
                            : isDragOver
                            ? 'ring-2 ring-[#2B7574] border-white scale-102 bg-[#0E2931] shadow-2xl'
                            : isCover
                            ? 'border-amber-400/80 shadow-md ring-1 ring-amber-400/30'
                            : 'border-[#2B7574]/40 hover:border-[#2B7574]'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Card top toolbar: Grip, Position Jump, Arrows */}
                          <div className="flex items-center justify-between gap-1 pb-1 border-b border-white/10">
                            <div className="flex items-center gap-1">
                              <div
                                className="cursor-grab active:cursor-grabbing p-1 text-zinc-400 hover:text-white"
                                title="Arrastrar para cambiar lugar"
                              >
                                <GripVertical className="w-3.5 h-3.5 text-[#2B7574]" />
                              </div>
                              <select
                                value={idx + 1}
                                onChange={(e) =>
                                  handleSetGalleryFilePosition(
                                    visualReorderGallery.id,
                                    file.id,
                                    Number(e.target.value)
                                  )
                                }
                                className="px-1.5 py-0.5 rounded bg-[#0E2931] border border-[#2B7574]/60 text-[11px] font-mono-data font-bold text-[#E2E2E0] focus:outline-none"
                                title="Saltar directamente a esta posición"
                              >
                                {visualReorderGallery.files.map((_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    #{i + 1}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Move arrow buttons */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryFile(visualReorderGallery.id, file.id, 'top')}
                                disabled={idx === 0}
                                className="p-1 rounded bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0]"
                                title="Mover al inicio"
                              >
                                <ChevronsUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryFile(visualReorderGallery.id, file.id, 'up')}
                                disabled={idx === 0}
                                className="p-1 rounded bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0]"
                                title="Subir una posición"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryFile(visualReorderGallery.id, file.id, 'down')}
                                disabled={idx === visualReorderGallery.files.length - 1}
                                className="p-1 rounded bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0]"
                                title="Bajar una posición"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveGalleryFile(visualReorderGallery.id, file.id, 'bottom')}
                                disabled={idx === visualReorderGallery.files.length - 1}
                                className="p-1 rounded bg-[#0E2931] hover:bg-[#2B7574] disabled:opacity-20 text-[#E2E2E0]"
                                title="Mover al final"
                              >
                                <ChevronsDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Image preview */}
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black border border-white/10 group">
                            <img
                              src={file.previewUrl}
                              alt={file.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isCover && (
                              <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded bg-amber-500/90 text-black text-[9px] font-mono-data font-bold flex items-center gap-1 shadow">
                                <Star className="w-2.5 h-2.5 fill-black" />
                                <span>PORTADA</span>
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <div className="truncate text-[11px] font-semibold text-white">
                            {file.title}
                          </div>
                        </div>

                        {/* Card footer: Set cover and delete */}
                        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => handleSetGalleryCoverFromFile(visualReorderGallery.id, file.previewUrl)}
                            className={`px-2 py-1 rounded text-[10px] font-mono-data flex items-center gap-1 transition-colors ${
                              isCover
                                ? 'bg-amber-400 text-black font-bold'
                                : 'bg-[#0E2931] text-zinc-300 hover:text-white hover:bg-[#2B7574]/40'
                            }`}
                            title="Hacer de esta foto la portada principal de la galería"
                          >
                            <Star className={`w-3 h-3 ${isCover ? 'fill-black' : ''}`} />
                            <span>{isCover ? 'Es Portada' : 'Hacer Portada'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('¿Desea eliminar esta foto de la galería?')) {
                                const updated = removePhotoFromGallery(visualReorderGallery.id, file.id);
                                if (updated) {
                                  setGalleries(getClientGalleries());
                                  setVisualReorderGallery(updated);
                                  setSaveSuccessMsg('Foto eliminada.');
                                  setTimeout(() => setSaveSuccessMsg(null), 2000);
                                }
                              }
                            }}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom Status */}
            <div className="pt-2 border-t border-[#2B7574]/30 flex flex-wrap items-center justify-between text-xs text-zinc-300">
              <span className="font-mono-data text-[11px]">
                {visualReorderGallery.files.length} fotografías organizadas visualmente en tiempo real
              </span>
              <button
                type="button"
                onClick={() => setVisualReorderGallery(null)}
                className="px-5 py-2 bg-[#2B7574] hover:bg-[#3b9493] text-[#E2E2E0] font-semibold rounded-xl transition-colors shadow"
              >
                Guardar y Finalizar
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
        initialMode={driveSyncMode}
        onSyncComplete={() => {
          setGalleries(getClientGalleries());
          setPortfolioItems(getPortfolioItems());
          setCategoriesList(getStudioCategories());
          setStudioConfigState(getStudioConfig());
          if (onRefreshData) onRefreshData();
        }}
      />
    </div>
  );
};
