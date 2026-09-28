import {
  PortfolioItem,
  ClientGallery,
  ClientFile,
  StudioConfig,
  ActivityNotification,
  DeliveryStatus,
  BotKnowledge,
  ClientConversation,
  StudioAnnouncement,
  StudioCategory,
  DiscoverySessionBooking,
} from '../types';
import {
  INITIAL_STUDIO_CONFIG,
  INITIAL_PORTFOLIO_ITEMS,
  INITIAL_CLIENT_GALLERIES,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_BOT_KNOWLEDGE,
  INITIAL_CLIENT_CONVERSATIONS,
  INITIAL_STUDIO_ANNOUNCEMENT,
  INITIAL_STUDIO_CATEGORIES,
} from '../data/initialData';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';

const STORAGE_KEYS = {
  CONFIG: 'cadstudio_config_v2',
  PORTFOLIO: 'cadstudio_portfolio_items_v2',
  CATEGORIES: 'cadstudio_categories_v2',
  CLIENT_GALLERIES: 'cadstudio_client_galleries_v2',
  ACTIVITY_LOGS: 'cadstudio_activity_logs_v2',
  STATS: 'cadstudio_stats_v2',
  BOT_KNOWLEDGE: 'cadstudio_bot_knowledge_v2',
  CLIENT_CONVERSATIONS: 'cadstudio_client_conversations_v2',
  ANNOUNCEMENT: 'cadstudio_announcement_v1',
  DISCOVERY_BOOKINGS: 'cadstudio_discovery_bookings_v1',
};

// Listeners for real-time reactivity within app
type ActivityListener = (log: ActivityNotification) => void;
const activityListeners: Set<ActivityListener> = new Set();

export const subscribeToActivity = (listener: ActivityListener) => {
  activityListeners.add(listener);
  return () => {
    activityListeners.delete(listener);
  };
};

export const getStudioConfig = (): StudioConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed.location || parsed.location.includes('Madrid')) {
        parsed.location = INITIAL_STUDIO_CONFIG.location;
      }
      return { ...INITIAL_STUDIO_CONFIG, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load studio config', e);
  }
  return INITIAL_STUDIO_CONFIG;
};

export const saveStudioConfig = (config: StudioConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    addActivityLog({
      type: 'admin',
      title: 'Ajustes de estudio actualizados',
      description: 'Se modificó la información de perfil, biografía y tarifas del fotógrafo.',
    });
  } catch (e) {
    console.error('Failed to save studio config', e);
  }
};

export const getPortfolioItems = (): PortfolioItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load portfolio items', e);
  }
  return INITIAL_PORTFOLIO_ITEMS;
};

export const savePortfolioItems = (items: PortfolioItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save portfolio items', e);
  }
};

export const getStudioCategories = (): StudioCategory[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load studio categories', e);
  }
  return INITIAL_STUDIO_CATEGORIES;
};

export const saveStudioCategories = (categories: StudioCategory[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    addActivityLog({
      type: 'admin',
      title: 'Categorías de fotografía actualizadas',
      description: `Se actualizaron las categorías del estudio (${categories.length} categorías registradas).`,
    });
  } catch (e) {
    console.error('Failed to save categories', e);
  }
};

export const addStudioCategory = (category: StudioCategory): StudioCategory[] => {
  const categories = getStudioCategories();
  const exists = categories.some((c) => c.id === category.id);
  const updated = exists
    ? categories.map((c) => (c.id === category.id ? category : c))
    : [...categories, category];
  saveStudioCategories(updated);
  return updated;
};

export const deleteStudioCategory = (categoryId: string): StudioCategory[] => {
  const categories = getStudioCategories();
  // Prevent deleting the 4 core categories to maintain studio integrity
  const updated = categories.filter((c) => c.id !== categoryId || c.isCore);
  saveStudioCategories(updated);
  return updated;
};

export const updateStudioCategoryPhoto = (
  categoryId: string,
  newCoverImage: string
): StudioCategory[] => {
  const categories = getStudioCategories();
  const updated = categories.map((c) =>
    c.id === categoryId ? { ...c, coverImage: newCoverImage } : c
  );
  saveStudioCategories(updated);
  addActivityLog({
    type: 'admin',
    title: 'Portada de categoría actualizada',
    description: `Se actualizó la fotografía de portada de la categoría "${categoryId}".`,
  });
  return updated;
};

export const getClientGalleries = (): ClientGallery[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENT_GALLERIES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load client galleries', e);
  }
  return INITIAL_CLIENT_GALLERIES;
};

export const saveClientGalleries = (galleries: ClientGallery[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENT_GALLERIES, JSON.stringify(galleries));
  } catch (e) {
    console.error('Failed to save client galleries', e);
  }
};

export const addPhotosToGallery = (
  galleryId: string,
  newFiles: ClientFile[]
): ClientGallery | undefined => {
  const galleries = getClientGalleries();
  const index = galleries.findIndex((g) => g.id === galleryId);
  if (index === -1) return undefined;

  const gallery = galleries[index];
  gallery.files = [...gallery.files, ...newFiles];
  saveClientGalleries(galleries);

  // Sync to Firestore
  try {
    setDoc(doc(db, 'client_galleries', gallery.id), gallery, { merge: true }).catch((err) =>
      console.warn('Firestore gallery sync:', err)
    );
  } catch (err) {
    console.warn(err);
  }

  addActivityLog({
    type: 'admin',
    title: 'Nuevas fotos añadidas a la galería',
    description: `Se subieron ${newFiles.length} fotos a la galería de ${gallery.clientName}.`,
    clientName: gallery.clientName,
  });

  return gallery;
};

export const removePhotoFromGallery = (
  galleryId: string,
  fileId: string
): ClientGallery | undefined => {
  const galleries = getClientGalleries();
  const index = galleries.findIndex((g) => g.id === galleryId);
  if (index === -1) return undefined;

  const gallery = galleries[index];
  gallery.files = gallery.files.filter((f) => f.id !== fileId);
  gallery.selectedFileIds = gallery.selectedFileIds.filter((id) => id !== fileId);
  saveClientGalleries(galleries);

  try {
    setDoc(doc(db, 'client_galleries', gallery.id), gallery, { merge: true }).catch((err) =>
      console.warn('Firestore gallery sync:', err)
    );
  } catch (err) {
    console.warn(err);
  }

  return gallery;
};

export const getClientGalleryByToken = (token: string): ClientGallery | undefined => {
  const galleries = getClientGalleries();
  const normalized = token.trim().toLowerCase();
  return galleries.find(
    (g) => g.token.toLowerCase() === normalized || g.id === token
  );
};

export const updateGalleryStatus = (galleryId: string, status: DeliveryStatus): void => {
  const galleries = getClientGalleries();
  const index = galleries.findIndex((g) => g.id === galleryId);
  if (index !== -1) {
    const prevStatus = galleries[index].status;
    galleries[index].status = status;
    saveClientGalleries(galleries);

    const statusLabels: Record<DeliveryStatus, string> = {
      entregado: 'Entregado al cliente',
      visto: 'Enlace visualizado',
      en_seleccion: 'Selección en curso',
      seleccion_enviada: 'Selección enviada por el cliente',
      completado: 'Proyecto completado y archivado',
    };

    addActivityLog({
      type: 'selection',
      title: `Estado de entrega actualizado: ${statusLabels[status]}`,
      description: `El cliente ${galleries[index].clientName} cambió de "${statusLabels[prevStatus]}" a "${statusLabels[status]}".`,
      clientName: galleries[index].clientName,
    });
  }
};

export const toggleFileSelection = (galleryId: string, fileId: string): ClientGallery | undefined => {
  const galleries = getClientGalleries();
  const index = galleries.findIndex((g) => g.id === galleryId);
  if (index === -1) return undefined;

  const gallery = galleries[index];
  const isSelected = gallery.selectedFileIds.includes(fileId);

  if (isSelected) {
    gallery.selectedFileIds = gallery.selectedFileIds.filter((id) => id !== fileId);
  } else {
    if (gallery.selectionLimit && gallery.selectedFileIds.length >= gallery.selectionLimit) {
      return gallery;
    }
    gallery.selectedFileIds.push(fileId);
  }

  if (gallery.status === 'visto' || gallery.status === 'entregado') {
    gallery.status = 'en_seleccion';
  }

  saveClientGalleries(galleries);
  return gallery;
};

export const submitClientSelection = (
  galleryId: string,
  clientNotes: string
): ClientGallery | undefined => {
  const galleries = getClientGalleries();
  const index = galleries.findIndex((g) => g.id === galleryId);
  if (index === -1) return undefined;

  const gallery = galleries[index];
  gallery.clientNotes = clientNotes;
  gallery.status = 'seleccion_enviada';
  saveClientGalleries(galleries);

  addActivityLog({
    type: 'selection',
    title: 'Selección confirmada por el cliente',
    description: `${gallery.clientName} ha confirmado su selección de ${gallery.selectedFileIds.length} archivos y adjuntó notas de retoque.`,
    clientName: gallery.clientName,
  });

  return gallery;
};

export const recordDownload = (
  galleryId: string,
  fileId?: string,
  isBatch: boolean = false
): void => {
  const galleries = getClientGalleries();
  const gallery = galleries.find((g) => g.id === galleryId);
  if (gallery) {
    gallery.totalDownloads += isBatch ? gallery.files.length : 1;
    if (fileId) {
      const file = gallery.files.find((f) => f.id === fileId);
      if (file) {
        file.downloadsCount += 1;
      }
    }
    saveClientGalleries(galleries);

    addActivityLog({
      type: isBatch ? 'batch_download' : 'download',
      title: isBatch ? 'Descarga masiva de archivos originales' : 'Descarga directa en alta resolución',
      description: isBatch
        ? `${gallery.clientName} descargó todos los archivos (${gallery.files.length} elementos) directamente en calidad original.`
        : `${gallery.clientName} descargó un archivo maestro sin compresión.`,
      clientName: gallery.clientName,
    });
  }

  // Update overall stats
  const stats = getStats();
  stats.totalDownloads += isBatch ? (gallery ? gallery.files.length : 5) : 1;
  saveStats(stats);
};

export const recordGalleryView = (gallery: ClientGallery): void => {
  if (gallery.status === 'entregado') {
    updateGalleryStatus(gallery.id, 'visto');
  } else {
    addActivityLog({
      type: 'view',
      title: 'Cliente ingresó a su galería privada',
      description: `${gallery.clientName} accedió al enlace protegido "${gallery.title}".`,
      clientName: gallery.clientName,
    });
  }
  const stats = getStats();
  stats.clientViews += 1;
  saveStats(stats);
};

export const getActivityLogs = (): ActivityNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load activity logs', e);
  }
  return INITIAL_ACTIVITY_LOGS;
};

export const addActivityLog = (
  item: Omit<ActivityNotification, 'id' | 'timestamp'>
): void => {
  const logs = getActivityLogs();
  const newLog: ActivityNotification = {
    ...item,
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: 'Ahora mismo',
  };
  const updated = [newLog, ...logs.slice(0, 49)];
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save activity log', e);
  }
  activityListeners.forEach((fn) => {
    try {
      fn(newLog);
    } catch (err) {
      console.error(err);
    }
  });
};

export interface StudioStats {
  totalVisits: number;
  clientViews: number;
  totalDownloads: number;
  activeGalleries: number;
  monthlyDownloads: { month: string; count: number }[];
  categoryEngagement: { category: string; views: number }[];
}

export const getStats = (): StudioStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load stats', e);
  }
  return {
    totalVisits: 14820,
    clientViews: 324,
    totalDownloads: 486,
    activeGalleries: 3,
    monthlyDownloads: [
      { month: 'Mayo', count: 68 },
      { month: 'Junio', count: 94 },
      { month: 'Julio', count: 120 },
      { month: 'Agosto', count: 145 },
      { month: 'Septiembre', count: 186 },
    ],
    categoryEngagement: [
      { category: 'Bodas & Coberturas', views: 5420 },
      { category: 'Gastronomía de Autor', views: 4210 },
      { category: 'Arquitectura & Espacios', views: 3190 },
      { category: 'Retratos de Autor', views: 2000 },
    ],
  };
};

export const saveStats = (stats: StudioStats): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
};

export const incrementVisitCount = (): void => {
  const stats = getStats();
  stats.totalVisits += 1;
  saveStats(stats);
};

// ==========================================
// BOT KNOWLEDGE BASE MANAGEMENT
// ==========================================

export const getBotKnowledge = (): BotKnowledge[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOT_KNOWLEDGE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load bot knowledge', e);
  }
  return INITIAL_BOT_KNOWLEDGE;
};

export const saveBotKnowledge = async (
  item: Omit<BotKnowledge, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BotKnowledge> => {
  const list = getBotKnowledge();
  const now = new Date().toISOString();
  const newKnowledge: BotKnowledge = {
    ...item,
    id: 'kb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newKnowledge, ...list];
  try {
    localStorage.setItem(STORAGE_KEYS.BOT_KNOWLEDGE, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save bot knowledge locally', e);
  }

  // Persist to Firestore
  try {
    await setDoc(doc(db, 'bot_knowledge', newKnowledge.id), newKnowledge);
  } catch (err) {
    console.warn('Firestore bot_knowledge setDoc warning:', err);
  }

  addActivityLog({
    type: 'admin',
    title: 'Nuevo conocimiento enseñado al bot',
    description: `Se registró: "${newKnowledge.title}" (${newKnowledge.category}).`,
  });

  return newKnowledge;
};

export const updateBotKnowledge = async (
  id: string,
  updates: Partial<BotKnowledge>
): Promise<void> => {
  const list = getBotKnowledge();
  const index = list.findIndex((k) => k.id === id);
  if (index === -1) return;

  list[index] = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.BOT_KNOWLEDGE, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to update bot knowledge locally', e);
  }

  try {
    await setDoc(doc(db, 'bot_knowledge', id), list[index], { merge: true });
  } catch (err) {
    console.warn('Firestore bot_knowledge update warning:', err);
  }
};

export const deleteBotKnowledge = async (id: string): Promise<void> => {
  const list = getBotKnowledge();
  const filtered = list.filter((k) => k.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.BOT_KNOWLEDGE, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete bot knowledge locally', e);
  }

  try {
    await deleteDoc(doc(db, 'bot_knowledge', id));
  } catch (err) {
    console.warn('Firestore bot_knowledge delete warning:', err);
  }
};

export const getCombinedBotPromptKnowledge = (): string => {
  const list = getBotKnowledge().filter((k) => k.isActive);
  if (list.length === 0) return '';

  return (
    '\n\nCONOCIMIENTO ADICIONAL DEL NEGOCIO (ENTRENADO POR CADSTUDIO):\n' +
    list
      .map(
        (k, i) =>
          `[Documento ${i + 1}: ${k.title.toUpperCase()} (Categoría: ${k.category})]\n${k.content}`
      )
      .join('\n\n')
  );
};

// ==========================================
// CLIENT CONVERSATIONS & CHAT HISTORY
// ==========================================

export const getClientConversations = (): ClientConversation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENT_CONVERSATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load client conversations', e);
  }
  return INITIAL_CLIENT_CONVERSATIONS;
};

export const saveOrUpdateClientConversation = async (
  conversation: ClientConversation
): Promise<void> => {
  const list = getClientConversations();
  const index = list.findIndex(
    (c) => c.id === conversation.id || c.sessionId === conversation.sessionId
  );

  let updated: ClientConversation[];
  if (index !== -1) {
    updated = [...list];
    updated[index] = { ...conversation, lastUpdatedAt: new Date().toISOString() };
  } else {
    updated = [conversation, ...list];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.CLIENT_CONVERSATIONS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save client conversation locally', e);
  }

  // Persist to Firestore database
  try {
    const docId = conversation.id || conversation.sessionId;
    await setDoc(doc(db, 'client_conversations', docId), conversation, { merge: true });
  } catch (err) {
    console.warn('Firestore client_conversations setDoc warning:', err);
  }
};

export const deleteClientConversation = async (id: string): Promise<void> => {
  const list = getClientConversations();
  const filtered = list.filter((c) => c.id !== id && c.sessionId !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENT_CONVERSATIONS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete client conversation locally', e);
  }

  try {
    await deleteDoc(doc(db, 'client_conversations', id));
  } catch (err) {
    console.warn('Firestore client_conversations delete warning:', err);
  }
};

// ==========================================
// STUDIO ANNOUNCEMENTS & SPECIAL OFFERS
// ==========================================

export const getAnnouncement = (): StudioAnnouncement => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load studio announcement', e);
  }
  return INITIAL_STUDIO_ANNOUNCEMENT;
};

export const saveAnnouncement = async (announcement: StudioAnnouncement): Promise<void> => {
  const updated: StudioAnnouncement = {
    ...announcement,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save announcement locally', e);
  }

  // Persist to Firestore database
  try {
    await setDoc(doc(db, 'studio_announcements', updated.id), updated, { merge: true });
  } catch (err) {
    console.warn('Firestore studio_announcements setDoc warning:', err);
  }

  addActivityLog({
    type: 'admin',
    title: 'Aviso u oferta especial actualizada',
    description: `Se modificó el panel de ofertas: "${updated.title}" (${updated.isActive ? 'Activo' : 'Pausado'}).`,
  });
};

export const getDiscoveryBookings = (): DiscoverySessionBooking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISCOVERY_BOOKINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load discovery bookings', e);
  }
  return [];
};

export const saveDiscoveryBooking = async (
  booking: DiscoverySessionBooking
): Promise<void> => {
  const current = getDiscoveryBookings();
  const index = current.findIndex((b) => b.id === booking.id);
  let updatedList: DiscoverySessionBooking[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = booking;
  } else {
    updatedList = [booking, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.DISCOVERY_BOOKINGS, JSON.stringify(updatedList));
  } catch (e) {
    console.error('Failed to save discovery booking locally', e);
  }

  // Persist to Firestore
  try {
    await setDoc(doc(db, 'discovery_sessions', booking.id), booking, { merge: true });
  } catch (err) {
    console.warn('Firestore discovery_sessions setDoc warning:', err);
  }

  addActivityLog({
    type: 'contact',
    title: `Sesión de descubrimiento agendada: ${booking.clientName}`,
    description: `Fecha: ${booking.date} a las ${booking.startTime} (${booking.format === 'google_meet' ? 'Google Meet' : 'Presencial'}). Proyecto: ${booking.shootType}.`,
    clientName: booking.clientName,
  });
};


