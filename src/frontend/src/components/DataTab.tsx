import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Camera,
  Download,
  Film,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { WatchStatus } from "../backend.d";
import {
  useDeleteMealMenu,
  useDeletePendingItem,
  useDeleteWatchItem,
  useGetAllAlbumEntries,
  useGetAllMealMenus,
  useGetAllPendingItems,
  useGetAllWatchItems,
} from "../hooks/useQueries";

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

function getBlobUrl(blobId: string): string {
  const storageGatewayUrl =
    (window as any).__caffeineStorageGatewayUrl || "https://blob.caffeine.ai";
  const backendCanisterId = (window as any).__caffeineBackendCanisterId || "";
  const projectId =
    (window as any).__caffeineProjectId || "0000000-0000-0000-0000-00000000000";
  return `${storageGatewayUrl}/v1/blob/?blob_hash=${encodeURIComponent(blobId)}&owner_id=${encodeURIComponent(backendCanisterId)}&project_id=${encodeURIComponent(projectId)}`;
}

export default function DataTab() {
  const { data: watchItems = [], isLoading: loadingWatch } =
    useGetAllWatchItems();
  const { data: pendingItems = [], isLoading: loadingPending } =
    useGetAllPendingItems();
  const { data: mealMenus = [], isLoading: loadingMenus } =
    useGetAllMealMenus();
  const { data: albumEntries = [], isLoading: loadingAlbum } =
    useGetAllAlbumEntries();
  const deleteWatch = useDeleteWatchItem();
  const deletePending = useDeletePendingItem();
  const deleteMeal = useDeleteMealMenu();
  const queryClient = useQueryClient();

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isLoading =
    loadingWatch || loadingPending || loadingMenus || loadingAlbum;

  const totalPhotos = albumEntries.reduce(
    (acc, e) => acc + e.blobIds.length,
    0,
  );

  const stats = {
    watching: watchItems.filter((i) => i.status === WatchStatus.watching)
      .length,
    pending: watchItems.filter((i) => i.status === WatchStatus.pending).length,
    completed: watchItems.filter((i) => i.status === WatchStatus.completed)
      .length,
    pendingItems: pendingItems.length,
    menus: mealMenus.length,
    photos: totalPhotos,
    albumDays: albumEntries.length,
  };

  // Sort entries newest first
  const sortedAlbumEntries = [...albumEntries].sort((a, b) =>
    a.date > b.date ? -1 : 1,
  );

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      watchItems,
      pendingItems,
      mealMenus,
      albumEntries: albumEntries.map((e) => ({
        date: bigintToDate(e.date).toISOString(),
        description: e.description,
        photoCount: e.blobIds.length,
        blobIds: e.blobIds,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cinepareja-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Datos exportados correctamente");
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await Promise.all([
        ...watchItems.map((i) => deleteWatch.mutateAsync(i.id)),
        ...pendingItems.map((i) => deletePending.mutateAsync(i.id)),
        ...mealMenus.map((m) => deleteMeal.mutateAsync(m.date)),
      ]);
      queryClient.invalidateQueries();
      toast.success("Todos los datos han sido eliminados");
    } catch {
      toast.error("Error al resetear los datos");
    } finally {
      setIsResetting(false);
      setShowConfirmReset(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4" data-ocid="data.section">
      <div className="flex items-center gap-2 mb-5">
        <Download size={20} className="text-primary" />
        <h2 className="text-xl font-display font-bold text-foreground">
          Mis datos
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="data.loading_state">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Stats */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Resumen
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="bg-card rounded-xl p-4 card-shadow"
                data-ocid="data.card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Film size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground">Viendo</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.watching}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-card rounded-xl p-4 card-shadow"
                data-ocid="data.card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Film size={16} className="text-yellow-500" />
                  <span className="text-xs text-muted-foreground">
                    En espera
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pending}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl p-4 card-shadow"
                data-ocid="data.card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Film size={16} className="text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    Completadas
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.completed}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-xl p-4 card-shadow"
                data-ocid="data.card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Bookmark size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground">Por ver</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pendingItems}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl p-4 card-shadow"
                data-ocid="data.card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <UtensilsCrossed size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground">
                    Menús guardados
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.menus}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card rounded-xl p-4 card-shadow"
                data-ocid="data.card"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Camera size={16} className="text-primary" />
                  <span className="text-xs text-muted-foreground">Fotos</span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {stats.photos}
                </p>
                <p className="text-xs text-muted-foreground">
                  en {stats.albumDays} día{stats.albumDays !== 1 ? "s" : ""}
                </p>
              </motion.div>
            </div>
          </section>

          {/* Album Photos by Date */}
          {sortedAlbumEntries.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Fotos del álbum
              </h3>
              <div className="space-y-4">
                {sortedAlbumEntries.map((entry, idx) => {
                  const date = bigintToDate(entry.date);
                  return (
                    <motion.div
                      key={entry.date.toString()}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-card rounded-xl card-shadow overflow-hidden"
                      data-ocid={`data.album_entry.${idx + 1}`}
                    >
                      {/* Date header */}
                      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
                        <Camera size={14} className="text-primary" />
                        <div>
                          <p className="text-sm font-semibold text-foreground capitalize">
                            {formatDateES(date)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.blobIds.length} foto
                            {entry.blobIds.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Photo grid */}
                      <div className="p-3 grid grid-cols-3 gap-2">
                        {entry.blobIds.map((blobId, photoIdx) => (
                          <div key={blobId} className="relative aspect-square">
                            <img
                              src={getBlobUrl(blobId)}
                              alt={`Foto ${photoIdx + 1} del ${formatDateES(date)}`}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>

                      {entry.description && (
                        <div className="px-4 pb-3">
                          <p className="text-xs text-muted-foreground italic">
                            {entry.description}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Export */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Exportar
            </h3>
            <div className="bg-card rounded-xl p-4 card-shadow">
              <p className="text-sm text-foreground font-medium mb-1">
                Descarga todos tus datos
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Exporta películas, series, pendientes, menús y el registro del
                álbum en formato JSON.
              </p>
              <Button
                onClick={handleExport}
                className="w-full rounded-xl"
                data-ocid="data.primary_button"
              >
                <Download size={16} className="mr-2" />
                Descargar datos
              </Button>
            </div>
          </section>

          {/* Reset */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Zona de peligro
            </h3>
            <div className="bg-card rounded-xl p-4 card-shadow border border-destructive/20">
              <p className="text-sm text-foreground font-medium mb-1">
                Eliminar todos los datos
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Borra permanentemente todas las listas, películas y menús.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowConfirmReset(true)}
                className="w-full rounded-xl"
                data-ocid="data.delete_button"
              >
                <Trash2 size={16} className="mr-2" />
                Resetear todos los datos
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Confirm Reset */}
      <AlertDialog open={showConfirmReset} onOpenChange={setShowConfirmReset}>
        <AlertDialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
          data-ocid="data.modal"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar TODOS los datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminarán todas las películas,
              series, listas de pendientes y menús.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="data.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isResetting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="data.confirm_button"
            >
              {isResetting ? "Eliminando..." : "Sí, eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
