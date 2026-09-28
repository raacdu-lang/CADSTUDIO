import React, { useState, useEffect } from 'react';
import {
  signInWithGoogleDrive,
  signOutDrive,
  isDriveConnected,
  getDriveCurrentUser,
  listDriveFolders,
  syncDriveFolderToClientGallery,
  autoSyncAllGalleries,
} from '../services/googleDriveService';
import { ClientGallery, GoogleDriveFolder } from '../types';
import {
  FolderSync,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Folder,
  ArrowRight,
  Search,
  ExternalLink,
  Layers,
  Lock,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleries: ClientGallery[];
  initialSelectedGalleryId?: string;
  onSyncComplete: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  galleries,
  initialSelectedGalleryId,
  onSyncComplete,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(isDriveConnected());
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(
    getDriveCurrentUser()?.email || null
  );
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Gallery selection & folder navigation
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    initialSelectedGalleryId || galleries[0]?.id || ''
  );
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
  const [folderSearchTerm, setFolderSearchTerm] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Batch auto-sync state
  const [isBatchSyncing, setIsBatchSyncing] = useState<boolean>(false);
  const [batchSyncResult, setBatchSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const connected = isDriveConnected();
      setIsConnected(connected);
      setCurrentUserEmail(getDriveCurrentUser()?.email || null);
      if (initialSelectedGalleryId) {
        setSelectedGalleryId(initialSelectedGalleryId);
      }
      if (connected) {
        loadFolders();
      }
    }
  }, [isOpen, initialSelectedGalleryId]);

  const selectedGallery = galleries.find((g) => g.id === selectedGalleryId);

  useEffect(() => {
    if (selectedGallery?.driveFolderId) {
      setSelectedFolderId(selectedGallery.driveFolderId);
    }
  }, [selectedGalleryId, selectedGallery]);

  const loadFolders = async (search?: string) => {
    setIsLoadingFolders(true);
    setAuthError(null);
    try {
      const list = await listDriveFolders(search);
      setFolders(list);
    } catch (err: any) {
      console.error('Error al cargar carpetas de Drive:', err);
      setAuthError(err.message || 'No se pudieron listar las carpetas de Google Drive.');
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogleDrive();
      if (res) {
        setIsConnected(true);
        setCurrentUserEmail(res.user.email);
        await loadFolders();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error al iniciar sesión con Google Workspace.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutDrive();
    setIsConnected(false);
    setCurrentUserEmail(null);
    setFolders([]);
  };

  const handleSyncSelected = async () => {
    if (!selectedGalleryId || !selectedFolderId) return;

    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setSyncError(null);

    try {
      const result = await syncDriveFolderToClientGallery(
        selectedGalleryId,
        selectedFolderId
      );
      setSyncSuccessMsg(
        `¡Sincronización exitosa! Se importaron ${result.syncedCount} activos fotográficos en alta resolución para ${result.gallery.clientName}.`
      );
      onSyncComplete();
    } catch (err: any) {
      console.error('Error de sincronización:', err);
      setSyncError(err.message || 'Ocurrió un error al sincronizar la carpeta de Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBatchAutoSync = async () => {
    setIsBatchSyncing(true);
    setBatchSyncResult(null);
    try {
      const res = await autoSyncAllGalleries();
      setBatchSyncResult(
        `Sincronización en lote terminada: ${res.syncedGalleries} salas privadas actualizadas con ${res.totalAssetsSynced} fotos y videos.`
      );
      onSyncComplete();
    } catch (err: any) {
      setBatchSyncResult(`Error en sincronización en lote: ${err.message}`);
    } finally {
      setIsBatchSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#101014] border border-[#272733] rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 via-emerald-500/10 to-yellow-500/10 border border-blue-500/30 text-blue-400">
              <FolderSync className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-white tracking-tight">
                  Sincronización con Google Drive API
                </h3>
                <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold uppercase">
                  Service Layer
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Importe y sincronice activos de fotografía y video directamente a las suites privadas de sus clientes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth State & Connection Panel */}
        {!isConnected ? (
          <div className="p-6 rounded-2xl bg-[#14141a] border border-[#272733] text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" fill="currentColor">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">
                Conectar con Google Drive
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                Permita que CADSTUDIO acceda a sus carpetas fotográficas de Google Drive para cargar automáticamente los archivos de los eventos en las galerías de los clientes.
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Official Google Material Button per guidelines */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 font-semibold text-xs shadow-xl transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                    <span>Iniciando autorización...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Conectar con Google Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Connected State & Operations */
          <div className="space-y-6">
            {/* Account Status Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <span className="text-zinc-200 font-semibold block">
                    Conectado a Google Workspace
                  </span>
                  <span className="text-zinc-400 font-mono-data text-[11px]">
                    {currentUserEmail}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadFolders(folderSearchTerm)}
                  disabled={isLoadingFolders}
                  className="px-2.5 py-1 text-[11px] text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center gap-1 transition-colors"
                  title="Recargar carpetas"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingFolders ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-rose-400 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Desconectar
                </button>
              </div>
            </div>

            {/* Step 1: Select Target Client Gallery */}
            <div className="space-y-2">
              <label className="block text-xs font-mono-data text-zinc-400">
                1. SELECCIONE LA SALA PRIVADA DEL CLIENTE:
              </label>
              <select
                value={selectedGalleryId}
                onChange={(e) => setSelectedGalleryId(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
              >
                {galleries.map((gal) => (
                  <option key={gal.id} value={gal.id}>
                    {gal.clientName} — {gal.title} ({gal.files.length} archivos actuales)
                    {gal.driveFolderName ? ` · 📁 ${gal.driveFolderName}` : ''}
                  </option>
                ))}
              </select>

              {selectedGallery && (
                <div className="p-3 rounded-xl bg-[#14141a] border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-data text-zinc-400">
                  <span>
                    Token: <span className="text-zinc-200">{selectedGallery.token}</span>
                  </span>
                  {selectedGallery.driveFolderName ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Vinculada con: <strong>{selectedGallery.driveFolderName}</strong>
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Aún no tiene carpeta de Drive vinculada
                    </span>
                  )}
                  {selectedGallery.lastDriveSync && (
                    <span>Última sincr: {selectedGallery.lastDriveSync}</span>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Choose Google Drive Folder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono-data text-zinc-400">
                  2. SELECCIONE LA CARPETA DE FOTOGRAFÍAS EN DRIVE:
                </label>
                <span className="text-[10px] font-mono-data text-zinc-500">
                  {folders.length} carpetas encontradas
                </span>
              </div>

              {/* Search folder input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={folderSearchTerm}
                  onChange={(e) => {
                    setFolderSearchTerm(e.target.value);
                    loadFolders(e.target.value);
                  }}
                  placeholder="Buscar carpeta por nombre (ej. Boda Sofia, Sesion...)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Folders List Container */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0e0e12] divide-y divide-zinc-800/60">
                {isLoadingFolders ? (
                  <div className="p-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    <span>Consultando Google Drive...</span>
                  </div>
                ) : folders.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500">
                    No se encontraron carpetas con ese nombre.
                  </div>
                ) : (
                  folders.map((folder) => {
                    const isSelected = selectedFolderId === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => setSelectedFolderId(folder.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? 'bg-rose-950/40 text-rose-200 border-l-2 border-rose-500'
                            : 'hover:bg-zinc-800/40 text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Folder
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-rose-400' : 'text-blue-400'
                            }`}
                          />
                          <span className="font-medium truncate">{folder.name}</span>
                        </div>

                        {isSelected ? (
                          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-semibold shrink-0">
                            Seleccionada
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            Elegir
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sync Notifications */}
            {syncSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}

            {syncError && (
              <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}

            {batchSyncResult && (
              <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-800 text-blue-200 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{batchSyncResult}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBatchAutoSync}
                disabled={isBatchSyncing || isSyncing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                title="Sincroniza automáticamente todas las salas privadas que tengan carpetas vinculadas"
              >
                {isBatchSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>Sincronizar Todas las Salas Vinculadas</span>
              </button>

              <button
                type="button"
                onClick={handleSyncSelected}
                disabled={!selectedFolderId || isSyncing || isBatchSyncing}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Descargando metadatos & sincronizando...</span>
                  </>
                ) : (
                  <>
                    <FolderSync className="w-4 h-4" />
                    <span>Sincronizar Carpeta a Portal de Cliente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
