import React, { useState, useEffect } from 'react';
import {
  signInWithGoogleDrive,
  signOutDrive,
  isDriveConnected,
  getDriveCurrentUser,
  listDriveFolders,
  listDriveFilesInFolder,
  syncDriveFolderToClientGallery,
  autoSyncAllGalleries,
  syncDriveFolderToPortfolio,
  importDriveFileAsSitePhoto,
} from '../services/googleDriveService';
import { ClientGallery, GoogleDriveFolder, GoogleDriveFile } from '../types';
import {
  FolderSync,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Folder,
  Search,
  Layers,
  Sparkles,
  Loader2,
  X,
  Compass,
  Image as ImageIcon,
  Star,
  Film,
  Eye,
  Check,
} from 'lucide-react';

export type DriveSyncMode = 'galleries' | 'portfolio' | 'master_photos';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleries: ClientGallery[];
  initialSelectedGalleryId?: string;
  initialMode?: DriveSyncMode;
  onSyncComplete: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  galleries,
  initialSelectedGalleryId,
  initialMode = 'portfolio',
  onSyncComplete,
}) => {
  const [activeMode, setActiveMode] = useState<DriveSyncMode>(initialMode);
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

  // Portfolio sync options
  const [portfolioCategory, setPortfolioCategory] = useState<
    'bodas' | 'gastronomia' | 'arquitectura' | 'retrato'
  >('bodas');
  const [portfolioShowOnHome, setPortfolioShowOnHome] = useState<boolean>(true);

  // Master Photos picker state
  const [folderFiles, setFolderFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [lastAssignedTarget, setLastAssignedTarget] = useState<string | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Batch auto-sync state
  const [isBatchSyncing, setIsBatchSyncing] = useState<boolean>(false);
  const [batchSyncResult, setBatchSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialMode) setActiveMode(initialMode);
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
  }, [isOpen, initialSelectedGalleryId, initialMode]);

  const selectedGallery = galleries.find((g) => g.id === selectedGalleryId);

  useEffect(() => {
    if (activeMode === 'galleries' && selectedGallery?.driveFolderId) {
      setSelectedFolderId(selectedGallery.driveFolderId);
    }
  }, [selectedGalleryId, selectedGallery, activeMode]);

  // When a folder is picked in master_photos mode, load files in that folder
  useEffect(() => {
    if (activeMode === 'master_photos' && selectedFolderId && isConnected) {
      loadFilesForFolder(selectedFolderId);
    }
  }, [selectedFolderId, activeMode, isConnected]);

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

  const loadFilesForFolder = async (folderId: string) => {
    setIsLoadingFiles(true);
    try {
      const files = await listDriveFilesInFolder(folderId);
      setFolderFiles(files);
    } catch (err: any) {
      console.error('Error al cargar archivos de la carpeta:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogleDrive();
      if (res?.user) {
        setIsConnected(true);
        setCurrentUserEmail(res.user.email);
        await loadFolders();
      }
    } catch (err: any) {
      setAuthError(err.message || 'No se pudo autorizar el acceso a Google Drive.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutDrive();
    setIsConnected(false);
    setCurrentUserEmail(null);
    setFolders([]);
    setFolderFiles([]);
    setSelectedFolderId('');
  };

  // Sync to Client Gallery
  const handleSyncClientGallery = async () => {
    if (!selectedGalleryId || !selectedFolderId) {
      setSyncError('Seleccione una sala de cliente y una carpeta de Google Drive.');
      return;
    }

    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setSyncError(null);

    try {
      const result = await syncDriveFolderToClientGallery(
        selectedGalleryId,
        selectedFolderId
      );
      setSyncSuccessMsg(
        `¡Sincronización exitosa! Se importaron ${result.syncedCount} archivos en alta resolución para ${result.gallery.clientName}.`
      );
      onSyncComplete();
    } catch (err: any) {
      console.error('Error de sincronización:', err);
      setSyncError(err.message || 'Ocurrió un error al sincronizar la carpeta de Google Drive.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync to Web Portfolio
  const handleSyncPortfolio = async () => {
    if (!selectedFolderId) {
      setSyncError('Seleccione una carpeta de Google Drive para sincronizar con el portafolio.');
      return;
    }

    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setSyncError(null);

    try {
      const result = await syncDriveFolderToPortfolio(selectedFolderId, {
        category: portfolioCategory,
        showOnHome: portfolioShowOnHome,
      });

      setSyncSuccessMsg(
        `¡Portafolio Web actualizado! Se importaron ${result.totalSynced} obras en alta resolución (${result.newCount} nuevas obras añadidas) desde la carpeta "${result.folderName}".`
      );
      onSyncComplete();
    } catch (err: any) {
      console.error('Error al sincronizar portafolio con Drive:', err);
      setSyncError(err.message || 'Ocurrió un error al sincronizar las fotos con el portafolio.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Assign photo as site asset
  const handleAssignSitePhoto = (
    file: GoogleDriveFile,
    target: 'hero' | 'cinema_feature' | 'cinema_reel' | 'announcement' | string
  ) => {
    try {
      importDriveFileAsSitePhoto(file, target);
      setLastAssignedTarget(`${file.name} asignada a ${target}`);
      setSyncSuccessMsg(`¡Foto actualizada con éxito desde Google Drive!`);
      onSyncComplete();
    } catch (err: any) {
      setSyncError('Error al asignar la foto: ' + (err.message || 'Error desconocido'));
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#101014] border border-[#272733] rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-5 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500/20 via-emerald-500/10 to-yellow-500/10 border border-blue-500/30 text-blue-400">
              <FolderSync className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                  Google Drive · CDN & Almacén Maestro de Fotos
                </h3>
                <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold uppercase">
                  Workspace
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Almacena fotos en máxima calidad en Google Drive y úsalas en el Portafolio, la Portada o Galerías de Clientes.
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
          <div className="p-6 rounded-2xl bg-[#14141a] border border-[#272733] text-center space-y-4 my-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <svg className="w-7 h-7" viewBox="0 0 87.3 78" fill="currentColor">
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
                Conectar con tu cuenta de Google Drive
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                Autorice a CADSTUDIO para acceder a sus carpetas fotográficas y sincronizar fotos y videos en alta resolución (JPG, PNG, RAW, TIFF o MP4).
              </p>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 max-w-md mx-auto text-left">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="px-6 py-3 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-lg flex items-center justify-center gap-2.5 mx-auto disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Conectando con Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Iniciar Sesión y Autorizar Google Drive</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Connected State & Operations */
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Account Status Card */}
            <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <div>
                  <span className="text-zinc-200 font-semibold text-xs block">
                    Google Workspace Conectado
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
                  <span>Refrescar</span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-rose-400 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  Desconectar
                </button>
              </div>
            </div>

            {/* TAB SELECTOR: Mode Navigation */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('portfolio');
                  setSyncSuccessMsg(null);
                  setSyncError(null);
                }}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${
                  activeMode === 'portfolio'
                    ? 'bg-[#2B7574] text-white shadow font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Portafolio Web</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('master_photos');
                  setSyncSuccessMsg(null);
                  setSyncError(null);
                }}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${
                  activeMode === 'master_photos'
                    ? 'bg-[#2B7574] text-white shadow font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Fotos de la Web</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('galleries');
                  setSyncSuccessMsg(null);
                  setSyncError(null);
                }}
                className={`py-2 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-all ${
                  activeMode === 'galleries'
                    ? 'bg-[#2B7574] text-white shadow font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Galerías de Clientes</span>
              </button>
            </div>

            {/* MODE 1: PORTFOLIO WORKS SYNC */}
            {activeMode === 'portfolio' && (
              <div className="space-y-4 p-4 rounded-2xl bg-[#14141a] border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white">
                      Importar y Sincronizar Obras al Portafolio
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-data text-emerald-400">
                    Alta Resolución Directa (Sin compresión)
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Elija una carpeta de Google Drive. Todas sus fotografías y videos se agregarán al portafolio de la web con sus títulos y metadatos EXIF (cámara, lente, proporciones).
                </p>

                {/* Settings: Category & Show on Home */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-mono-data text-zinc-400 mb-1">
                      CATEGORÍA ASIGNADA:
                    </label>
                    <select
                      value={portfolioCategory}
                      onChange={(e) => setPortfolioCategory(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="bodas">Bodas & Parejas</option>
                      <option value="gastronomia">Gastronomía & Autor</option>
                      <option value="arquitectura">Arquitectura & Espacios</option>
                      <option value="retrato">Retrato Editorial</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-data text-zinc-400 mb-1">
                      VISIBILIDAD EN PÁGINA PRINCIPAL:
                    </label>
                    <div
                      onClick={() => setPortfolioShowOnHome(!portfolioShowOnHome)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                        portfolioShowOnHome
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <span>
                        {portfolioShowOnHome
                          ? '✓ Mostrar en Portada de Inicio'
                          : 'Solo en Portafolio Completo'}
                      </span>
                      <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {portfolioShowOnHome ? 'En Portada' : 'Oculto en Home'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Folder Selector */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono-data text-zinc-400">
                      SELECCIONE LA CARPETA DE DRIVE:
                    </label>
                    <span className="text-[10px] font-mono-data text-zinc-500">
                      {folders.length} carpetas
                    </span>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={folderSearchTerm}
                      onChange={(e) => {
                        setFolderSearchTerm(e.target.value);
                        loadFolders(e.target.value);
                      }}
                      placeholder="Buscar carpeta en Drive (ej. Bodas 2026, Retratos, Portafolio)..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="max-h-40 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0e0e12] divide-y divide-zinc-800/60">
                    {isLoadingFolders ? (
                      <div className="p-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
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
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                              isSelected
                                ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                                : 'hover:bg-zinc-800/40 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Folder
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  isSelected ? 'text-emerald-400' : 'text-blue-400'
                                }`}
                              />
                              <span className="font-medium truncate">{folder.name}</span>
                            </div>
                            {isSelected ? (
                              <span className="text-[10px] font-mono-data px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-semibold shrink-0">
                                Seleccionada
                              </span>
                            ) : (
                              <span className="text-[10px] text-zinc-500 shrink-0">Elegir</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSyncPortfolio}
                  disabled={!selectedFolderId || isSyncing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sincronizando fotos de Google Drive con el Portafolio...</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      <span>Sincronizar e Importar Obras al Portafolio Web</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* MODE 2: MASTER SITE PHOTOS (Hero, Cinema, Categories) */}
            {activeMode === 'master_photos' && (
              <div className="space-y-4 p-4 rounded-2xl bg-[#14141a] border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white">
                      Fotos Maestras de la Web desde Google Drive
                    </span>
                  </div>
                  <span className="text-[11px] font-mono-data text-cyan-400">
                    Hero · Cinema · Categorías
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Selecciona una carpeta para ver sus fotos. Con un solo clic puedes asignar cualquier foto de Google Drive como la imagen de portada principal (Hero), el fotograma de Cinema Feature, o la portada de una categoría.
                </p>

                {/* Folder picker */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={folderSearchTerm}
                      onChange={(e) => {
                        setFolderSearchTerm(e.target.value);
                        loadFolders(e.target.value);
                      }}
                      placeholder="Buscar carpeta con imágenes del sitio..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="max-h-28 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0e0e12] divide-y divide-zinc-800/60">
                    {folders.map((folder) => {
                      const isSelected = selectedFolderId === folder.id;
                      return (
                        <div
                          key={folder.id}
                          onClick={() => setSelectedFolderId(folder.id)}
                          className={`p-2 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                            isSelected
                              ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-cyan-500'
                              : 'hover:bg-zinc-800/40 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Folder
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-cyan-400' : 'text-zinc-500'
                              }`}
                            />
                            <span className="font-medium truncate">{folder.name}</span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-mono-data text-cyan-400">
                              Activa
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Photos Grid inside selected folder */}
                {selectedFolderId && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                    <span className="text-[11px] font-mono-data text-zinc-400 block">
                      FOTOGRAFÍAS ENCONTRADAS EN LA CARPETA ({folderFiles.length}):
                    </span>

                    {isLoadingFiles ? (
                      <div className="p-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Cargando imágenes de Google Drive...</span>
                      </div>
                    ) : folderFiles.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500">
                        Esta carpeta no tiene archivos de imagen o video.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                        {folderFiles.map((file) => {
                          const preview = file.thumbnailLink
                            ? file.thumbnailLink.replace(/=s\d+$/, '=s400')
                            : `https://drive.google.com/thumbnail?id=${file.id}&sz=w400`;

                          return (
                            <div
                              key={file.id}
                              className="group p-2 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col space-y-2 relative"
                            >
                              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-black/60 relative">
                                <img
                                  src={preview}
                                  alt={file.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                              </div>

                              <span className="text-[10px] text-zinc-300 truncate font-mono-data block">
                                {file.name}
                              </span>

                              <div className="grid grid-cols-1 gap-1 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAssignSitePhoto(file, 'hero')}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-cyan-600 text-white rounded text-[10px] font-medium transition-colors text-center"
                                >
                                  Usar en Portada Hero
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAssignSitePhoto(file, 'cinema_feature')}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-emerald-600 text-white rounded text-[10px] font-medium transition-colors text-center"
                                >
                                  Usar en Cinema Feature
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MODE 3: CLIENT GALLERIES SYNC */}
            {activeMode === 'galleries' && (
              <div className="space-y-4 p-4 rounded-2xl bg-[#14141a] border border-zinc-800/80">
                {/* Step 1: Select Target Client Gallery */}
                <div className="space-y-2">
                  <label className="block text-xs font-mono-data text-zinc-400">
                    1. SELECCIONE LA SALA PRIVADA DEL CLIENTE:
                  </label>
                  <select
                    value={selectedGalleryId}
                    onChange={(e) => setSelectedGalleryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-medium focus:outline-none focus:border-rose-500"
                  >
                    {galleries.map((gal) => (
                      <option key={gal.id} value={gal.id}>
                        {gal.clientName} — {gal.title} ({gal.files.length} archivos actuales)
                        {gal.driveFolderName ? ` · 📁 ${gal.driveFolderName}` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedGallery && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-data text-zinc-400">
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
                          Sin carpeta de Drive vinculada aún
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2: Choose Google Drive Folder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono-data text-zinc-400">
                      2. SELECCIONE LA CARPETA DEL CLIENTE EN DRIVE:
                    </label>
                    <span className="text-[10px] font-mono-data text-zinc-500">
                      {folders.length} carpetas
                    </span>
                  </div>

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

                  <div className="max-h-36 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0e0e12] divide-y divide-zinc-800/60">
                    {isLoadingFolders ? (
                      <div className="p-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
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
                            className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                              isSelected
                                ? 'bg-rose-950/40 text-rose-200 border-l-2 border-rose-500'
                                : 'hover:bg-zinc-800/40 text-zinc-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Folder
                                className={`w-3.5 h-3.5 shrink-0 ${
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

                {/* Client gallery sync buttons */}
                <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleBatchAutoSync}
                    disabled={isBatchSyncing || isSyncing}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isBatchSyncing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>Sincronizar Todas las Salas</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncClientGallery}
                    disabled={!selectedFolderId || isSyncing || isBatchSyncing}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Sincronizando...</span>
                      </>
                    ) : (
                      <>
                        <FolderSync className="w-3.5 h-3.5" />
                        <span>Sincronizar a Galería del Cliente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Sync Notifications */}
            {syncSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{syncSuccessMsg}</span>
              </div>
            )}

            {syncError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
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
          </div>
        )}
      </div>
    </div>
  );
};
