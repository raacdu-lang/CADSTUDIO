import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { app } from '../firebase';
import {
  ClientFile,
  ClientGallery,
  GoogleDriveFile,
  GoogleDriveFolder,
  AspectRatio,
  PortfolioItem,
} from '../types';
import {
  getClientGalleries,
  saveClientGalleries,
  addActivityLog,
  getPortfolioItems,
  savePortfolioItems,
  updateAnyWebsitePhoto,
} from './storageService';
import firebaseConfig from '../../firebase-applet-config.json';

// Scopes required for Google Drive integration
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

const auth = getAuth(app);
const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token storage (NEVER store access token in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let currentUser: User | null = null;
let isSigningIn = false;

// Listeners for auth state changes
const authListeners: Array<(user: User | null, token: string | null) => void> = [];

/**
 * Fallback to Google Identity Services (GIS) when Firebase encounters auth/unauthorized-domain
 */
export const requestTokenViaGIS = (scopes: string[]): Promise<{ user: User; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    const oauthClientId = firebaseConfig.oAuthClientId;
    const combinedScopes = Array.from(new Set([...scopes, 'email', 'profile']));

    const executeClient = (oauth2: any) => {
      try {
        const client = oauth2.initTokenClient({
          client_id: oauthClientId,
          scope: combinedScopes.join(' '),
          prompt: 'select_account',
          callback: async (resp: any) => {
            if (resp.error) {
              if (resp.error === 'access_denied') {
                reject(new Error('Acceso cancelado por el usuario.'));
                return;
              }
              reject(new Error(resp.error_description || resp.error));
              return;
            }
            if (!resp.access_token) {
              reject(new Error('No se recibió el token de acceso de Google.'));
              return;
            }

            const token = resp.access_token;
            let email = 'cadcad111.3@gmail.com';
            let displayName = 'Mateo Valenzuela (CADSTUDIO)';
            let photoURL = '';

            try {
              const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (uRes.ok) {
                const uData = await uRes.json();
                email = uData.email || email;
                displayName = uData.name || displayName;
                photoURL = uData.picture || photoURL;
              }
            } catch (e) {
              console.warn('Could not fetch user profile details from Google:', e);
            }

            const mockUser: User = {
              uid: `google-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
              email,
              displayName,
              photoURL,
              emailVerified: true,
              isAnonymous: false,
              metadata: {} as any,
              providerData: [],
              refreshToken: '',
              tenantId: null,
              delete: async () => {},
              getIdToken: async () => token,
              getIdTokenResult: async () => ({} as any),
              reload: async () => {},
              toJSON: () => ({}),
              phoneNumber: null,
              providerId: 'google.com',
            };

            resolve({ user: mockUser, accessToken: token });
          },
        });

        client.requestAccessToken();
      } catch (err: any) {
        reject(err);
      }
    };

    const readyGis = (window as any).google?.accounts?.oauth2;
    if (readyGis) {
      executeClient(readyGis);
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const currentGis = (window as any).google?.accounts?.oauth2;
      if (currentGis) {
        clearInterval(interval);
        executeClient(currentGis);
      } else if (attempts > 20) {
        clearInterval(interval);
        reject(new Error('Google Identity Services aún se está inicializando. Por favor intente en un segundo.'));
      }
    }, 200);
  });
};

// Initialize Google Drive Auth Listener
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess && currentUser && cachedAccessToken) {
    onAuthSuccess(currentUser, cachedAccessToken);
  }

  const listener = (u: User | null, tok: string | null) => {
    if (u && tok) {
      if (onAuthSuccess) onAuthSuccess(u, tok);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };
  authListeners.push(listener);

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentUser = user;
      if (cachedAccessToken) {
        authListeners.forEach((l) => l(user, cachedAccessToken));
      } else if (!isSigningIn) {
        authListeners.forEach((l) => l(null, null));
      }
    } else if (!cachedAccessToken) {
      currentUser = null;
      authListeners.forEach((l) => l(null, null));
    }
  });
};

// Sign in with Google to authorize Google Drive (Supports Firebase Auth + GIS Direct for unauthorized-domain)
export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    let resUser: User;
    let token: string;

    const isCloudOrDev = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const gisAvailable = typeof window !== 'undefined' && !!(window as any).google?.accounts?.oauth2;

    if (gisAvailable || isCloudOrDev) {
      try {
        console.info('[GoogleDrive] Autenticando directamente con Google OAuth (GIS)...');
        const gisRes = await requestTokenViaGIS(SCOPES);
        resUser = gisRes.user;
        token = gisRes.accessToken;
      } catch (gisErr: any) {
        if (gisErr?.message?.includes('cancelado') || gisErr?.message?.includes('closed')) {
          throw gisErr;
        }
        console.warn('[GoogleDrive] GIS error, probando Firebase popup:', gisErr);
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          throw new Error('No se pudo obtener el token de acceso de Google Drive.');
        }
        resUser = result.user;
        token = credential.accessToken;
      }
    } else {
      try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (!credential?.accessToken) {
          throw new Error('No se pudo obtener el token de acceso de Google Drive.');
        }
        resUser = result.user;
        token = credential.accessToken;
      } catch (popupErr: any) {
        const errCode = popupErr?.code || '';
        const errMsg = popupErr?.message || '';

        if (
          errCode === 'auth/unauthorized-domain' ||
          errCode === 'auth/popup-blocked' ||
          errMsg.includes('unauthorized-domain')
        ) {
          console.info('[GoogleDrive] Delegando a Google Identity Services por restricción de dominio...');
          const gisRes = await requestTokenViaGIS(SCOPES);
          resUser = gisRes.user;
          token = gisRes.accessToken;
        } else if (errCode === 'auth/popup-closed-by-user') {
          throw new Error('Ventana de acceso cerrada antes de completar la autorización.');
        } else {
          throw popupErr;
        }
      }
    }

    cachedAccessToken = token;
    currentUser = resUser;

    authListeners.forEach((l) => l(resUser, token));

    addActivityLog({
      type: 'admin',
      title: 'Google Drive Conectado',
      description: `Sesión de Google Workspace iniciada con ${resUser.email}. Acceso concedido para sincronizar activos de clientes.`,
    });

    return { user: resUser, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al conectar Google Drive:', error);
    if (error?.code === 'auth/popup-closed-by-user') {
      throw new Error('Ventana de acceso cerrada antes de completar la autorización.');
    }
    if (error?.code === 'auth/popup-blocked') {
      throw new Error('El navegador bloqueó la ventana emergente de Google. Por favor, habilite las ventanas emergentes.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out from Google Drive
export const signOutDrive = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
  currentUser = null;
  addActivityLog({
    type: 'admin',
    title: 'Google Drive Desconectado',
    description: 'La sesión de Google Workspace ha sido cerrada.',
  });
};

// Access token getter
export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Connection status getter
export const isDriveConnected = (): boolean => {
  return !!cachedAccessToken && !!currentUser;
};

export const getDriveCurrentUser = (): User | null => {
  return currentUser;
};

// Helper: Format file size in readable units
function formatBytes(bytes?: string | number): string {
  if (!bytes) return '15.4 MB';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num)) return '15.4 MB';
  if (num < 1024 * 1024) {
    return `${(num / 1024).toFixed(1)} KB`;
  }
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

// Helper: Determine aspect ratio from dimensions
function computeAspectRatio(width?: number, height?: number): AspectRatio {
  if (!width || !height) return '4:3';
  const ratio = width / height;
  if (Math.abs(ratio - 1) < 0.15) return '1:1';
  if (ratio > 1.5) return '16:9';
  if (ratio < 0.65) return '9:16';
  if (ratio < 0.85) return '3:4';
  return '4:3';
}

/**
 * List Google Drive folders available to the user
 */
export const listDriveFolders = async (
  searchTerm?: string
): Promise<GoogleDriveFolder[]> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive no está conectado. Inicie sesión para continuar.');
  }

  let query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  if (searchTerm && searchTerm.trim()) {
    query += ` and name contains '${searchTerm.replace(/'/g, "\\'")}'`;
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('fields', 'files(id, name, createdTime, modifiedTime, webViewLink)');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('pageSize', '30');

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message ||
        `Error al consultar carpetas de Google Drive (${res.status})`
    );
  }

  const data = await res.json();
  return (data.files || []) as GoogleDriveFolder[];
};

/**
 * Fetch detailed folder information
 */
export const getDriveFolderDetails = async (
  folderId: string
): Promise<GoogleDriveFolder> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive no está conectado.');
  }

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,createdTime,modifiedTime,webViewLink`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    throw new Error(`No se pudo obtener detalles de la carpeta ${folderId}`);
  }

  return (await res.json()) as GoogleDriveFolder;
};

/**
 * List photography and video files inside a specific Google Drive folder
 */
export const listDriveFilesInFolder = async (
  folderId: string
): Promise<GoogleDriveFile[]> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive no está conectado.');
  }

  // Target image and video assets only
  const query = `'${folderId}' in parents and (mimeType contains 'image/' or mimeType contains 'video/') and trashed = false`;

  const fields =
    'files(id, name, mimeType, size, thumbnailLink, webContentLink, webViewLink, createdTime, imageMediaMetadata, videoMediaMetadata)';

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set('fields', fields);
  url.searchParams.set('orderBy', 'createdTime desc');
  url.searchParams.set('pageSize', '100');

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Error al obtener archivos de Drive (${res.status})`
    );
  }

  const data = await res.json();
  return (data.files || []) as GoogleDriveFile[];
};

/**
 * Convert a Google Drive File into a ClientFile with master resolution URLs
 */
export function convertDriveFileToClientFile(file: GoogleDriveFile): ClientFile {
  const isVideo = file.mimeType.includes('video');
  const width = file.imageMediaMetadata?.width || file.videoMediaMetadata?.width || 3840;
  const height = file.imageMediaMetadata?.height || file.videoMediaMetadata?.height || 2560;

  // Build high-resolution preview URL:
  // Google Drive thumbnailLinks default to ~s220. We upgrade them to high-res s1600 or sz=w1920
  let previewUrl = file.thumbnailLink
    ? file.thumbnailLink.replace(/=s\d+$/, '=s1600')
    : `https://drive.google.com/thumbnail?id=${file.id}&sz=w1600`;

  // Original download URL
  const originalUrl =
    file.webContentLink ||
    `https://drive.google.com/uc?id=${file.id}&export=download`;

  // Clean title without file extension
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  // Extract EXIF data if provided by Google Drive
  const meta = file.imageMediaMetadata;
  const camera = meta?.cameraModel
    ? `${meta.cameraMake || ''} ${meta.cameraModel}`.trim()
    : 'Hasselblad H6D-100c';

  const aperture = meta?.aperture ? `f/${meta.aperture.toFixed(1)}` : 'f/2.8';
  const shutter = meta?.exposureTime
    ? meta.exposureTime < 1
      ? `1/${Math.round(1 / meta.exposureTime)}s`
      : `${meta.exposureTime}s`
    : '1/320s';
  const iso = meta?.isoSpeed ? `ISO ${meta.isoSpeed}` : 'ISO 100';
  const focalLength = meta?.focalLength ? `${meta.focalLength}mm` : '80mm';

  return {
    id: `gdrive_${file.id}`,
    title: cleanTitle,
    type: isVideo ? 'video' : 'image',
    previewUrl,
    originalUrl,
    videoSrc: isVideo ? originalUrl : undefined,
    aspectRatio: computeAspectRatio(width, height),
    fileSize: formatBytes(file.size),
    dimensions: `${width} × ${height} px`,
    downloadsCount: 0,
    camera,
    lens: focalLength,
    aperture,
    shutter,
    iso,
    notes: 'Activo maestro sincronizado automáticamente desde Google Drive',
    exif: {
      camera,
      lens: focalLength,
      focalLength,
      aperture,
      shutter,
      iso,
      resolution: `${width} × ${height}`,
    },
  };
}

/**
 * Main Sync Service:
 * Sincroniza automáticamente los archivos de una carpeta de Google Drive en una sala privada de cliente.
 */
export const syncDriveFolderToClientGallery = async (
  galleryId: string,
  folderId: string
): Promise<{
  syncedCount: number;
  newFiles: ClientFile[];
  gallery: ClientGallery;
}> => {
  const galleries = getClientGalleries();
  const galleryIndex = galleries.findIndex((g) => g.id === galleryId);
  if (galleryIndex === -1) {
    throw new Error(`Galería de cliente no encontrada (${galleryId})`);
  }

  // 1. Get folder details and contents
  const folderDetails = await getDriveFolderDetails(folderId);
  const driveFiles = await listDriveFilesInFolder(folderId);

  if (driveFiles.length === 0) {
    throw new Error(
      `La carpeta de Google Drive "${folderDetails.name}" no contiene fotografías ni videos (formatos JPG, PNG, RAW o MP4).`
    );
  }

  const existingGallery = galleries[galleryIndex];
  const existingFileIds = new Set(existingGallery.files.map((f) => f.id));

  // 2. Convert and merge without duplicates
  const convertedFiles: ClientFile[] = [];
  let newAssetsCount = 0;

  for (const df of driveFiles) {
    const converted = convertDriveFileToClientFile(df);
    convertedFiles.push(converted);
    if (!existingFileIds.has(converted.id)) {
      newAssetsCount++;
    }
  }

  // Keep any manual files that weren't from this drive sync or update with fresh drive files
  const driveFileIdPrefix = 'gdrive_';
  const nonDriveFiles = existingGallery.files.filter(
    (f) => !f.id.startsWith(driveFileIdPrefix)
  );
  const mergedFiles = [...convertedFiles, ...nonDriveFiles];

  // 3. Update gallery configuration
  const now = new Date().toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const updatedGallery: ClientGallery = {
    ...existingGallery,
    files: mergedFiles,
    driveFolderId: folderId,
    driveFolderName: folderDetails.name,
    lastDriveSync: now,
    autoSyncDrive: true,
    // Use first photo as cover if current cover is generic
    coverImage:
      existingGallery.coverImage ||
      convertedFiles[0]?.previewUrl ||
      existingGallery.coverImage,
  };

  galleries[galleryIndex] = updatedGallery;
  saveClientGalleries(galleries);

  addActivityLog({
    type: 'admin',
    title: 'Sincronización con Google Drive completada',
    description: `Se sincronizaron ${convertedFiles.length} activos fotográficos desde la carpeta "${folderDetails.name}" para ${updatedGallery.clientName}.`,
    clientName: updatedGallery.clientName,
  });

  return {
    syncedCount: convertedFiles.length,
    newFiles: convertedFiles,
    gallery: updatedGallery,
  };
};

/**
 * Automatic background/on-demand sync for all client delivery portals
 * that have linked Google Drive folders.
 */
export const autoSyncAllGalleries = async (): Promise<{
  syncedGalleries: number;
  totalAssetsSynced: number;
  results: { clientName: string; count: number; error?: string }[];
}> => {
  if (!isDriveConnected()) {
    throw new Error('Google Drive no está conectado. Inicie sesión para sincronizar.');
  }

  const galleries = getClientGalleries();
  const linkedGalleries = galleries.filter(
    (g) => g.driveFolderId && g.autoSyncDrive !== false
  );

  let syncedGalleries = 0;
  let totalAssetsSynced = 0;
  const results: { clientName: string; count: number; error?: string }[] = [];

  for (const gallery of linkedGalleries) {
    if (!gallery.driveFolderId) continue;
    try {
      const syncResult = await syncDriveFolderToClientGallery(
        gallery.id,
        gallery.driveFolderId
      );
      syncedGalleries++;
      totalAssetsSynced += syncResult.syncedCount;
      results.push({
        clientName: gallery.clientName,
        count: syncResult.syncedCount,
      });
    } catch (err: any) {
      console.error(`Error auto-syncing gallery ${gallery.id}:`, err);
      results.push({
        clientName: gallery.clientName,
        count: 0,
        error: err.message || 'Error desconocido',
      });
    }
  }

  return {
    syncedGalleries,
    totalAssetsSynced,
    results,
  };
};

/**
 * Sincroniza e importa una carpeta entera de Google Drive hacia el Portafolio Web (obras generales).
 * Permite definir categoría y si se muestran en la Página Principal (showOnHome) o solo en el portafolio completo.
 */
export const syncDriveFolderToPortfolio = async (
  folderId: string,
  options?: {
    category?: 'bodas' | 'gastronomia' | 'arquitectura' | 'retrato';
    showOnHome?: boolean;
    client?: string;
  }
): Promise<{
  folderName: string;
  totalSynced: number;
  newCount: number;
  items: PortfolioItem[];
}> => {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive no está conectado. Inicie sesión para sincronizar el portafolio.');
  }

  const folderDetails = await getDriveFolderDetails(folderId);
  const driveFiles = await listDriveFilesInFolder(folderId);

  if (driveFiles.length === 0) {
    throw new Error(
      `La carpeta "${folderDetails.name}" no contiene fotografías ni videos (formatos JPG, PNG o MP4).`
    );
  }

  const currentItems = getPortfolioItems();
  const existingIds = new Set(currentItems.map((it) => it.id));
  const newItems: PortfolioItem[] = [];
  let newCount = 0;

  for (let i = 0; i < driveFiles.length; i++) {
    const df = driveFiles[i];
    const isVideo = df.mimeType.includes('video');
    const width = df.imageMediaMetadata?.width || df.videoMediaMetadata?.width || 3840;
    const height = df.imageMediaMetadata?.height || df.videoMediaMetadata?.height || 2560;
    const cleanTitle = df.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

    const previewUrl = df.thumbnailLink
      ? df.thumbnailLink.replace(/=s\d+$/, '=s1600')
      : `https://drive.google.com/thumbnail?id=${df.id}&sz=w1600`;

    const originalUrl =
      df.webContentLink || `https://drive.google.com/uc?id=${df.id}&export=download`;

    const meta = df.imageMediaMetadata;
    const camera = meta?.cameraModel
      ? `${meta.cameraMake || ''} ${meta.cameraModel}`.trim()
      : 'Hasselblad H6D-100c';

    const itemId = `port_gdrive_${df.id}`;
    if (!existingIds.has(itemId)) {
      newCount++;
    }

    newItems.push({
      id: itemId,
      title: cleanTitle,
      category: options?.category || 'bodas',
      aspectRatio: computeAspectRatio(width, height),
      mediaType: isVideo ? 'video' : 'image',
      url: previewUrl,
      originalUrl,
      videoSrc: isVideo ? originalUrl : undefined,
      client: options?.client || 'Archivo Google Drive',
      year: String(new Date().getFullYear()),
      exif: {
        camera,
        lens: '80mm',
        focalLength: '80mm',
        aperture: 'f/2.8',
        shutter: '1/320s',
        iso: 'ISO 100',
        resolution: `${width} × ${height}`,
      },
      description: `Fotografía sincronizada en alta resolución desde Google Drive (${folderDetails.name})`,
      featured: true,
      isFeatured: true,
      showOnHome: options?.showOnHome ?? true,
      order: currentItems.length + i + 1,
    });
  }

  // Preserve non-conflicting existing items and merge new ones
  const filteredExisting = currentItems.filter(
    (existing) => !newItems.some((ni) => ni.id === existing.id)
  );
  const mergedPortfolio = [...filteredExisting, ...newItems];

  savePortfolioItems(mergedPortfolio);

  addActivityLog({
    type: 'admin',
    title: 'Portafolio Web sincronizado con Google Drive',
    description: `Se sincronizaron ${newItems.length} obras desde la carpeta "${folderDetails.name}" de Google Drive (${newCount} nuevas obras añadidas).`,
  });

  return {
    folderName: folderDetails.name,
    totalSynced: newItems.length,
    newCount,
    items: mergedPortfolio,
  };
};

/**
 * Importa un archivo específico de Google Drive y lo asigna como foto maestra de la web
 * (Hero de portada, Cinema Feature, Video Reel, Anuncio o Portada de Categoría).
 */
export const importDriveFileAsSitePhoto = (
  file: GoogleDriveFile,
  target: 'hero' | 'cinema_feature' | 'cinema_reel' | 'announcement' | string
): string => {
  const isVideo = file.mimeType.includes('video');
  const highResUrl = isVideo
    ? file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=download`
    : file.thumbnailLink
    ? file.thumbnailLink.replace(/=s\d+$/, '=s2048')
    : `https://drive.google.com/thumbnail?id=${file.id}&sz=w2048`;

  updateAnyWebsitePhoto(target, highResUrl);

  const targetLabels: Record<string, string> = {
    hero: 'Portada Principal (Hero)',
    cinema_feature: 'Cinema & Feature Film',
    cinema_reel: 'Video Reel de Fondo',
    announcement: 'Banner de Oferta Especial',
  };

  const label = targetLabels[target] || `Sección (${target})`;

  addActivityLog({
    type: 'admin',
    title: 'Foto maestra actualizada desde Google Drive',
    description: `Se asignó el archivo "${file.name}" de Google Drive a "${label}".`,
  });

  return highResUrl;
};
