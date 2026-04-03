import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AlbumEntry } from "../backend.d";
import { loadConfig } from "../config";
import { useActor } from "../hooks/useActor";
import {
  useAddPhotoToAlbumEntry,
  useCreateAlbumEntry,
  useGetAllAlbumEntries,
  useRemovePhotoFromAlbumEntry,
} from "../hooks/useQueries";
import { StorageClient } from "../utils/StorageClient";

// Convert a JS Date (local) to a nanosecond bigint truncated to day
function dateToDayBigint(date: Date): bigint {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return BigInt(d.getTime()) * 1_000_000n;
}

// Convert nanosecond bigint to JS Date
function bigintToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

// Format date in Spanish
function formatDateES(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Format date for input[type=date] (YYYY-MM-DD)
function dateToInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface StorageConfig {
  storageGatewayUrl: string;
  backendCanisterId: string;
  projectId: string;
}

interface PhotoViewerProps {
  photos: string[];
  initialIndex: number;
  date: Date;
  onClose: () => void;
  onDelete: (blobId: string) => void;
  getBlobUrl: (blobId: string) => string;
}

function PhotoViewer({
  photos,
  initialIndex,
  date,
  onClose,
  onDelete,
  getBlobUrl,
}: PhotoViewerProps) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : photos.length - 1));
  const next = () => setCurrent((c) => (c < photos.length - 1 ? c + 1 : 0));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-[calc(100%-32px)] max-w-sm rounded-2xl p-0 overflow-hidden"
        data-ocid="album.modal"
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-medium text-muted-foreground">
              {formatDateES(date)}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 hover:bg-muted transition-colors"
              data-ocid="album.close_button"
            >
              <X size={18} />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {current + 1} / {photos.length}
          </p>
        </DialogHeader>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.img
              key={current}
              src={getBlobUrl(photos[current])}
              alt={`Foto ${current + 1}`}
              className="w-full aspect-square object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
                data-ocid="album.pagination_prev"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
                data-ocid="album.pagination_next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        <div className="px-4 pb-4 pt-3">
          <Button
            variant="destructive"
            size="sm"
            className="w-full rounded-xl"
            onClick={() => {
              onDelete(photos[current]);
              if (photos.length === 1) {
                onClose();
              } else {
                setCurrent((c) => (c > 0 ? c - 1 : 0));
              }
            }}
            data-ocid="album.delete_button"
          >
            <Trash2 size={14} className="mr-2" />
            Eliminar foto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AddPhotosDialogProps {
  onClose: () => void;
  onUpload: (date: bigint, files: File[]) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

function AddPhotosDialog({
  onClose,
  onUpload,
  isUploading,
  uploadProgress,
}: AddPhotosDialogProps) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(dateToInputValue(today));
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    const dateObj = new Date(`${selectedDate}T00:00:00`);
    const dateBigint = dateToDayBigint(dateObj);
    await onUpload(dateBigint, selectedFiles);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !isUploading && onClose()}>
      <DialogContent
        className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
        data-ocid="album.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-display font-bold">
            📸 Añadir al álbum
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date picker */}
          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="album-date"
            >
              Fecha
            </label>
            <input
              id="album-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              data-ocid="album.input"
            />
          </div>

          {/* File picker */}
          <div className="space-y-1.5">
            <label
              htmlFor="album-file-input"
              className="text-sm font-medium text-foreground"
            >
              Fotos
            </label>
            <input
              id="album-file-input"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setSelectedFiles(Array.from(e.target.files));
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
              data-ocid="album.dropzone"
            >
              {selectedFiles.length > 0 ? (
                <>
                  <Camera size={24} className="text-primary" />
                  <span className="text-sm font-medium text-primary">
                    {selectedFiles.length} foto
                    {selectedFiles.length !== 1 ? "s" : ""} seleccionada
                    {selectedFiles.length !== 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <>
                  <Camera size={24} className="text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Toca para seleccionar fotos
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="space-y-1.5" data-ocid="album.loading_state">
              <p className="text-xs text-muted-foreground text-center">
                Subiendo... {uploadProgress}%
              </p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
              disabled={isUploading}
              data-ocid="album.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || isUploading}
              data-ocid="album.confirm_button"
            >
              {isUploading ? "Subiendo..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DayGroupProps {
  entry: AlbumEntry;
  onPhotoClick: (blobIds: string[], index: number, date: Date) => void;
  onAddPhoto: (date: bigint) => void;
  onDeletePhoto: (date: bigint, blobId: string) => void;
  getBlobUrl: (blobId: string) => string;
  index: number;
}

function DayGroup({
  entry,
  onPhotoClick,
  onAddPhoto,
  onDeletePhoto,
  getBlobUrl,
  index,
}: DayGroupProps) {
  const date = bigintToDate(entry.date);
  const [hoveredPhoto, setHoveredPhoto] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl card-shadow overflow-hidden"
      data-ocid={`album.item.${index + 1}`}
    >
      {/* Date header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div>
          <p className="text-sm font-semibold text-foreground capitalize">
            {formatDateES(date)}
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.blobIds.length} foto{entry.blobIds.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddPhoto(entry.date)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg"
          data-ocid="album.secondary_button"
        >
          <Plus size={14} />
          Añadir
        </button>
      </div>

      {/* Photo grid */}
      <div className="p-3 grid grid-cols-3 gap-2">
        {entry.blobIds.map((blobId, photoIdx) => (
          <button
            key={blobId}
            type="button"
            className="relative aspect-square cursor-pointer group"
            onMouseEnter={() => setHoveredPhoto(blobId)}
            onMouseLeave={() => setHoveredPhoto(null)}
            onClick={() => onPhotoClick(entry.blobIds, photoIdx, date)}
          >
            <img
              src={getBlobUrl(blobId)}
              alt={`Foto ${photoIdx + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            {/* Delete overlay */}
            <AnimatePresence>
              {hoveredPhoto === blobId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto(entry.date, blobId);
                    }}
                    className="bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md"
                    data-ocid="album.delete_button"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export default function AlbumTab() {
  const { data: entries, isLoading } = useGetAllAlbumEntries();
  const createAlbumEntry = useCreateAlbumEntry();
  const addPhoto = useAddPhotoToAlbumEntry();
  const removePhoto = useRemovePhotoFromAlbumEntry();
  const { actor } = useActor();

  const [configReady, setConfigReady] = useState(false);
  const [storageConfig, setStorageConfig] = useState<StorageConfig>({
    storageGatewayUrl: "https://blob.caffeine.ai",
    backendCanisterId: "",
    projectId: "0000000-0000-0000-0000-00000000000",
  });

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewer, setViewer] = useState<{
    photos: string[];
    index: number;
    date: Date;
  } | null>(null);

  const quickAddFileRef = useRef<HTMLInputElement>(null);
  const quickAddDateRef = useRef<bigint | null>(null);

  // Load storage config on mount so photo URLs work even without prior upload
  useEffect(() => {
    loadConfig()
      .then((config) => {
        setStorageConfig({
          storageGatewayUrl: config.storage_gateway_url,
          backendCanisterId: config.backend_canister_id,
          projectId: config.project_id,
        });
      })
      .catch(() => {
        // keep defaults if config fails
      })
      .finally(() => {
        setConfigReady(true);
      });
  }, []);

  // Sort entries newest first
  const sortedEntries = entries
    ? [...entries].sort((a, b) => (a.date > b.date ? -1 : 1))
    : [];

  const getBlobUrl = (blobId: string): string => {
    if (!configReady) return "";
    const { storageGatewayUrl, backendCanisterId, projectId } = storageConfig;
    return `${storageGatewayUrl}/v1/blob/?blob_hash=${encodeURIComponent(blobId)}&owner_id=${encodeURIComponent(backendCanisterId)}&project_id=${encodeURIComponent(projectId)}`;
  };

  const initStorageConfig = async () => {
    if ((window as any).__caffeineStorageGatewayUrl) return;
    try {
      const config = await loadConfig();
      (window as any).__caffeineStorageGatewayUrl = config.storage_gateway_url;
      (window as any).__caffeineBackendCanisterId = config.backend_canister_id;
      (window as any).__caffeineProjectId = config.project_id;
    } catch {
      // use defaults
    }
  };

  const uploadPhotos = async (dateBigint: bigint, files: File[]) => {
    if (!actor) {
      toast.error("No hay conexión con el servidor");
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);
    try {
      await initStorageConfig();
      const config = await loadConfig();
      const { HttpAgent } = await import("@icp-sdk/core/agent");
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }
      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );

      const existingEntry = await actor.getAlbumEntryByDate(dateBigint);
      if (!existingEntry) {
        await createAlbumEntry.mutateAsync({
          date: dateBigint,
          description: "",
        });
      }

      const total = files.length;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes, (pct) => {
          setUploadProgress(Math.round(((i + pct / 100) / total) * 100));
        });
        await actor.uploadPhoto(hash);
        await addPhoto.mutateAsync({ date: dateBigint, blobId: hash });
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }

      (window as any).__caffeineStorageGatewayUrl = config.storage_gateway_url;
      (window as any).__caffeineBackendCanisterId = config.backend_canister_id;
      (window as any).__caffeineProjectId = config.project_id;

      toast.success(
        `${files.length} foto${files.length !== 1 ? "s" : ""} añadida${files.length !== 1 ? "s" : ""} al álbum`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al subir las fotos. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddPhotoForDate = (date: bigint) => {
    quickAddDateRef.current = date;
    setShowAddDialog(true);
  };

  const handleDeletePhoto = async (date: bigint, blobId: string) => {
    try {
      await removePhoto.mutateAsync({ date, blobId });
      if (actor) {
        await actor.deletePhoto(blobId);
      }
      toast.success("Foto eliminada");
    } catch {
      toast.error("Error al eliminar la foto");
    }
  };

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            📷 Álbum
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vuestros recuerdos juntos
          </p>
        </div>
        <Button
          onClick={() => {
            setShowAddDialog(true);
          }}
          className="rounded-xl gap-1.5"
          size="sm"
          data-ocid="album.primary_button"
        >
          <Plus size={16} />
          Añadir
        </Button>
      </div>

      {/* Content */}
      {isLoading || !configReady ? (
        <div className="space-y-4" data-ocid="album.loading_state">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-xl card-shadow overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-border/50">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="p-3 grid grid-cols-3 gap-2">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : sortedEntries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="album.empty_state"
        >
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Vuestro álbum está vacío
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Añadid vuestras primeras fotos juntos y empezad a crear recuerdos
          </p>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="rounded-xl gap-2"
            data-ocid="album.open_modal_button"
          >
            <Camera size={16} />
            Añadir primera foto
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {sortedEntries.map((entry, idx) => (
            <DayGroup
              key={entry.date.toString()}
              entry={entry}
              index={idx}
              getBlobUrl={getBlobUrl}
              onPhotoClick={(photos, photoIdx, date) =>
                setViewer({ photos, index: photoIdx, date })
              }
              onAddPhoto={handleAddPhotoForDate}
              onDeletePhoto={handleDeletePhoto}
            />
          ))}
        </div>
      )}

      {/* Hidden quick-add file input */}
      <input
        ref={quickAddFileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files && quickAddDateRef.current !== null) {
            const files = Array.from(e.target.files);
            await uploadPhotos(quickAddDateRef.current, files);
          }
          e.target.value = "";
        }}
      />

      {/* Add Photos Dialog */}
      <AnimatePresence>
        {showAddDialog && (
          <AddPhotosDialog
            onClose={() => setShowAddDialog(false)}
            onUpload={uploadPhotos}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        )}
      </AnimatePresence>

      {/* Photo Viewer */}
      <AnimatePresence>
        {viewer && (
          <PhotoViewer
            photos={viewer.photos}
            initialIndex={viewer.index}
            date={viewer.date}
            onClose={() => setViewer(null)}
            onDelete={(blobId) => {
              const entry = sortedEntries.find((e) =>
                e.blobIds.includes(blobId),
              );
              if (entry) {
                handleDeletePhoto(entry.date, blobId);
              }
              const newPhotos = viewer.photos.filter((p) => p !== blobId);
              if (newPhotos.length === 0) {
                setViewer(null);
              } else {
                setViewer((v) =>
                  v
                    ? {
                        ...v,
                        photos: newPhotos,
                        index: Math.min(v.index, newPhotos.length - 1),
                      }
                    : null,
                );
              }
            }}
            getBlobUrl={getBlobUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
