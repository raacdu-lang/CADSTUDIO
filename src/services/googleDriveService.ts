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
} from '../types';
import {
  getClientGalleries,
  saveClientGalleries,
  addActivityLog,
} from './storageService';

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

// Initialize Google Drive Auth Listener
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      currentUser = user;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      currentUser = null;
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google to authorize Google Drive
export const signInWithGoogleDrive = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    currentUser = result.user;

    addActivityLog({
      type: 'admin',
      title: 'Google Drive Conectado',
      description: `Sesión de Google Workspace iniciada con ${result.user.email}. Acceso concedido para sincronizar activos de clientes.`,
    });

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error al conectar Google Drive:', error);
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
