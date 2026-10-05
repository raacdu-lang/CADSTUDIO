export type AspectRatio = '3:4' | '16:9' | '9:16' | '1:1' | '4:3';
export type MediaType = 'image' | 'video';

export interface ExifData {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutter: string;
  iso: string;
  resolution: string;
}

export type PortfolioCategory = 'bodas' | 'gastronomia' | 'arquitectura' | 'retrato' | string;

export interface StudioCategory {
  id: string;
  label: string;
  description: string;
  isCore: boolean; // true for the 4 core categories
  order: number;
  coverImage?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: PortfolioCategory;
  aspectRatio: AspectRatio;
  mediaType: MediaType;
  url: string;
  originalUrl: string;
  videoSrc?: string;
  client?: string;
  year: string;
  order?: number;
  exif?: ExifData;
  colors?: string[];
  description?: string;
  featured?: boolean;
  isFeatured?: boolean;
  showOnHome?: boolean;
}

export interface ClientFile {
  id: string;
  title: string;
  type: MediaType;
  previewUrl: string;
  originalUrl: string;
  videoSrc?: string;
  aspectRatio: AspectRatio;
  fileSize: string;
  dimensions: string;
  downloadsCount: number;
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  notes?: string;
  exif?: ExifData;
}

export type DeliveryStatus =
  | 'entregado'
  | 'visto'
  | 'en_seleccion'
  | 'seleccion_enviada'
  | 'completado';

export interface ClientGallery {
  id: string;
  token: string;
  pin?: string;
  clientName: string;
  clientEmail: string;
  title: string;
  subtitle: string;
  coverImage: string;
  eventDate: string;
  deliveryDate: string;
  expiryDate: string;
  status: DeliveryStatus;
  files: ClientFile[];
  totalDownloads: number;
  clientNotes?: string;
  selectedFileIds: string[];
  allowFullDownload: boolean;
  selectionLimit?: number;
  driveFolderId?: string;
  driveFolderName?: string;
  lastDriveSync?: string;
  autoSyncDrive?: boolean;
}

export interface GoogleDriveFolder {
  id: string;
  name: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  createdTime?: string;
  imageMediaMetadata?: {
    width?: number;
    height?: number;
    cameraMake?: string;
    cameraModel?: string;
    exposureTime?: number;
    aperture?: number;
    focalLength?: number;
    isoSpeed?: number;
    time?: string;
  };
  videoMediaMetadata?: {
    width?: number;
    height?: number;
    durationMillis?: string;
  };
}

export interface ActivityNotification {
  id: string;
  timestamp: string;
  type: 'view' | 'download' | 'batch_download' | 'selection' | 'contact' | 'admin';
  title: string;
  description: string;
  clientName?: string;
}

export interface StudioConfig {
  photographerName: string;
  studioName: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  vimeo: string;
  experienceYears?: number;
  projectsCompleted?: number;
  awardsCount?: number;
  heroImage?: string;
  cinemaFeatureImage?: string;
  cinemaReelImage?: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  date?: string;
  shootType: string;
  budgetRange: string;
  message: string;
  timestamp: string;
}

export interface BotKnowledge {
  id: string;
  title: string;
  category: 'precios' | 'politicas' | 'equipamiento' | 'servicios' | 'faq' | 'instrucciones';
  content: string;
  sourceType: 'file' | 'direct_chat' | 'manual';
  fileName?: string;
  fileType?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ClientConversation {
  id: string;
  sessionId: string;
  clientName: string;
  clientEmail?: string;
  startedAt: string;
  lastUpdatedAt: string;
  messages: ConversationMessage[];
  topics?: string[];
  leadStatus?: 'nuevo' | 'presupuesto_solicitado' | 'cita_propuesta' | 'resuelto';
  summary?: string;
}

export interface DiscoverySessionBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  shootType: string;
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  format: 'google_meet' | 'in_person' | 'phone';
  meetingType?: 'discovery' | 'shoot_production';
  productionType?: 'photos' | 'video' | 'both';
  location?: string;
  notes?: string;
  googleEventId?: string;
  meetLink?: string;
  htmlLink?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  emailNotificationStatus?: {
    sent: boolean;
    clientDelivered: boolean;
    studioDelivered: boolean;
    sentAt: string;
    recipientClient: string;
    recipientStudio: string;
  };
}

export interface EmailNotificationLog {
  id: string;
  bookingId?: string;
  recipientType: 'studio' | 'client' | 'both';
  recipientClient?: string;
  recipientStudio?: string;
  clientSubject: string;
  studioSubject: string;
  status: 'delivered' | 'sent' | 'simulated' | 'failed';
  sentAt: string;
  clientHtml?: string;
  studioHtml?: string;
  bookingSummary: {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    shootType: string;
    date: string;
    startTime: string;
    endTime: string;
    format: string;
    meetingType?: string;
    productionType?: string;
    location?: string;
    meetLink?: string;
    notes?: string;
  };
  deliveryMethod: 'smtp' | 'google_calendar_invitation' | 'built_in_delivery';
}

export interface CalendarTimeSlot {
  time: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export interface StudioAnnouncement {
  id: string;
  isActive: boolean;
  badge: string;
  title: string;
  message: string;
  ctaText: string;
  ctaAction: 'contact' | 'chatbot' | 'whatsapp';
  theme: 'rose' | 'amber' | 'emerald' | 'blue';
  updatedAt: string;
  validUntil?: string;
  discountCode?: string;
  details?: string;
  imageUrl?: string;
}

export interface CategoryClickStat {
  categoryId: string;
  categoryName: string;
  clicks: number;
  views: number;
  percentage?: number;
  lastClickedAt?: string;
}

export interface StudioStats {
  totalVisits: number;
  clientViews: number;
  totalDownloads: number;
  activeGalleries: number;
  monthlyDownloads: { month: string; count: number }[];
  categoryEngagement: { category: string; views: number; clicks?: number }[];
  categoryClicks?: CategoryClickStat[];
}
