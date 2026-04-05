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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Edit2, Star, Trash2, Tv } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { WatchItem } from "../backend.d";
import { WatchStatus, WatchType } from "../backend.d";
import {
  useDeleteWatchItem,
  useGetAllWatchItems,
  useUpdateWatchItem,
} from "../hooks/useQueries";

const STATUS_LABELS: Record<WatchStatus, string> = {
  [WatchStatus.watching]: "Viendo",
  [WatchStatus.pending]: "Pendiente",
  [WatchStatus.completed]: "Completada",
};

const STATUS_ORDER = [
  WatchStatus.watching,
  WatchStatus.pending,
  WatchStatus.completed,
];

interface EditFormState {
  rating: number;
  review: string;
  status: WatchStatus;
}

// Star rating selector component
function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(value === star ? 0 : star)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          aria-label={`${star} estrella${star !== 1 ? "s" : ""}`}
        >
          <Star
            size={22}
            className={`transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-xs text-muted-foreground ml-1">{value}/5</span>
      )}
    </div>
  );
}

// Inline display of stars (read-only)
function StarDisplay({ value }: { value: number }) {
  if (!value || value <= 0) return null;
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={12}
          className={`${
            star <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/25"
          }`}
        />
      ))}
    </span>
  );
}

// Poster thumbnail with error fallback
function PosterImage({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [error, setError] = useState(false);
  const prevSrcRef = useRef(src);

  useEffect(() => {
    if (prevSrcRef.current !== src) {
      setError(false);
      prevSrcRef.current = src;
    }
  }, [src]);

  if (error) return <>{fallback}</>;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
}

export default function FinishedTab() {
  const { data: allItems = [], isLoading } = useGetAllWatchItems();
  const updateMutation = useUpdateWatchItem();
  const deleteMutation = useDeleteWatchItem();

  const [editItem, setEditItem] = useState<WatchItem | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    rating: 0,
    review: "",
    status: WatchStatus.completed,
  });
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  const completedItems = allItems.filter(
    (item) => item.status === WatchStatus.completed,
  );

  const openEdit = (item: WatchItem) => {
    setEditItem(item);
    setEditForm({
      rating: Number(item.rating ?? 0n),
      review: item.review ?? "",
      status: item.status,
    });
  };

  const handleSave = async () => {
    if (!editItem) return;
    const updated: WatchItem = {
      ...editItem,
      rating: BigInt(editForm.rating),
      review: editForm.review.trim(),
      status: editForm.status,
    };
    try {
      await updateMutation.mutateAsync({ id: editItem.id, item: updated });
      toast.success("Reseña guardada");
      setEditItem(null);
    } catch {
      toast.error("Error al guardar");
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleteId(null);
    }
  };

  const isMutating = updateMutation.isPending;

  return (
    <div className="px-4 pt-6 pb-4" data-ocid="finished.section">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 size={20} className="text-green-500" />
          Terminados
        </h2>
        {completedItems.length > 0 && (
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
            {completedItems.length} título
            {completedItems.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3" data-ocid="finished.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : completedItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="finished.empty_state"
        >
          <span className="text-5xl mb-3">🏆</span>
          <p className="text-base font-semibold text-foreground">
            Todavía no habéis terminado ningún título
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
            ¡A por ello! Cuando acabéis una película o serie aparecerá aquí.
          </p>
          <p className="text-xs text-primary mt-4 font-medium">
            Márcala como &quot;Completada&quot; desde la pestaña Viendo
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {completedItems.map((item, idx) => (
              <motion.div
                key={item.id.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card rounded-2xl p-4 card-shadow border border-green-100/60 dark:border-green-900/20"
                data-ocid={`finished.item.${idx + 1}`}
              >
                <div className="flex items-start gap-3">
                  {/* Poster or emoji */}
                  <div className="flex-shrink-0 mt-0.5">
                    {item.posterUrl ? (
                      <PosterImage
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-12 h-[68px] rounded-lg object-cover shadow-sm"
                        fallback={
                          <span className="text-2xl">
                            {item.watchType === WatchType.movie ? "🎬" : "📺"}
                          </span>
                        }
                      />
                    ) : (
                      <span className="text-2xl">
                        {item.watchType === WatchType.movie ? "🎬" : "📺"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <p className="font-semibold text-sm text-foreground leading-snug">
                      {item.title}
                    </p>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge
                        variant="outline"
                        className="text-xs border bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                      >
                        <CheckCircle2 size={9} className="mr-1" />
                        Completada
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {item.watchType === WatchType.movie
                          ? "Película"
                          : "Serie"}
                      </Badge>
                      {item.currentEpisode && (
                        <span className="flex items-center gap-1 text-xs bg-primary/8 text-primary border border-primary/20 rounded-full px-2 py-0.5">
                          <Tv size={10} />
                          {item.currentEpisode}
                        </span>
                      )}
                      {Number(item.rating ?? 0n) > 0 && (
                        <StarDisplay value={Number(item.rating)} />
                      )}
                    </div>

                    {/* Full review — not truncated */}
                    {item.review && item.review.trim() !== "" && (
                      <blockquote className="mt-2.5 pl-3 border-l-[3px] border-primary/50 italic text-xs text-muted-foreground leading-relaxed">
                        &ldquo;{item.review}&rdquo;
                      </blockquote>
                    )}

                    {/* Notes if any */}
                    {item.notes && item.notes.trim() !== "" && (
                      <p className="text-xs text-muted-foreground/70 mt-1.5">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1 ml-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      data-ocid={`finished.edit_button.${idx + 1}`}
                      aria-label="Editar reseña"
                    >
                      <Edit2 size={14} className="text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      data-ocid={`finished.delete_button.${idx + 1}`}
                      aria-label="Eliminar"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Dialog — only rating, review, and status */}
      <Dialog
        open={editItem !== null}
        onOpenChange={(o) => !o && setEditItem(null)}
      >
        <DialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="finished.dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editItem?.posterUrl ? (
                <img
                  src={editItem.posterUrl}
                  alt={editItem.title}
                  className="w-8 h-11 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ) : (
                <span className="text-lg">
                  {editItem?.watchType === WatchType.movie ? "🎬" : "📺"}
                </span>
              )}
              {editItem?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Status change */}
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setEditForm((p) => ({ ...p, status: s }))}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      editForm.status === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:bg-muted"
                    }`}
                    data-ocid="finished.toggle"
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Star rating */}
            <div className="space-y-1.5">
              <Label>Puntuación</Label>
              <StarSelector
                value={editForm.rating}
                onChange={(v) => setEditForm((p) => ({ ...p, rating: v }))}
              />
            </div>

            {/* Review textarea */}
            <div className="space-y-1.5">
              <Label>Reseña / Opinión</Label>
              <Textarea
                placeholder="¿Qué os pareció? ¿Lo recomendaríais?"
                value={editForm.review}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, review: e.target.value }))
                }
                rows={4}
                data-ocid="finished.textarea"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setEditItem(null)}
                className="flex-1 rounded-xl"
                data-ocid="finished.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isMutating}
                className="flex-1 rounded-xl"
                data-ocid="finished.save_button"
              >
                {isMutating ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
          data-ocid="finished.modal"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este título?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="finished.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="finished.confirm_button"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
