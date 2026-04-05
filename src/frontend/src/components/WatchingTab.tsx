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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  Edit2,
  Film,
  Loader2,
  Plus,
  Star,
  Trash2,
  Tv,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { WatchItem } from "../backend.d";
import { WatchStatus, WatchType } from "../backend.d";
import {
  useCreateWatchItem,
  useDeleteWatchItem,
  useGetAllWatchItems,
  useUpdateWatchItem,
} from "../hooks/useQueries";
import { useTMDBPoster } from "../hooks/useTMDBPoster";

const STATUS_LABELS: Record<WatchStatus, string> = {
  [WatchStatus.watching]: "Viendo",
  [WatchStatus.pending]: "Pendiente",
  [WatchStatus.completed]: "Completada",
};

const STATUS_COLORS: Record<WatchStatus, string> = {
  [WatchStatus.watching]: "bg-primary/10 text-primary border-primary/20",
  [WatchStatus.pending]: "bg-yellow-50 text-yellow-700 border-yellow-200",
  [WatchStatus.completed]: "bg-green-50 text-green-700 border-green-200",
};

const STATUS_ORDER = [
  WatchStatus.watching,
  WatchStatus.pending,
  WatchStatus.completed,
];

interface FormState {
  title: string;
  watchType: WatchType;
  status: WatchStatus;
  pausedAtMin: string;
  notes: string;
  currentEpisode: string;
  review: string;
  rating: number;
  posterUrl: string;
}

const DEFAULT_FORM: FormState = {
  title: "",
  watchType: WatchType.movie,
  status: WatchStatus.watching,
  pausedAtMin: "",
  notes: "",
  currentEpisode: "",
  review: "",
  rating: 0,
  posterUrl: "",
};

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
          size={11}
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

export default function WatchingTab() {
  const { data: watchItems = [], isLoading } = useGetAllWatchItems();
  const createMutation = useCreateWatchItem();
  const updateMutation = useUpdateWatchItem();
  const deleteMutation = useDeleteWatchItem();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<WatchItem | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [posterManuallyCleared, setPosterManuallyCleared] = useState(false);

  const { posterUrl: tmdbPosterUrl, isLoading: tmdbLoading } = useTMDBPoster(
    showForm ? form.title : "",
    form.watchType,
  );

  // Auto-fill poster from TMDB when it resolves (unless manually cleared)
  useEffect(() => {
    if (!posterManuallyCleared && tmdbPosterUrl && showForm) {
      setForm((p) => ({ ...p, posterUrl: tmdbPosterUrl }));
    }
  }, [tmdbPosterUrl, posterManuallyCleared, showForm]);

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditItem(null);
    setPosterManuallyCleared(false);
    setShowForm(true);
  };

  const openEdit = (item: WatchItem) => {
    setEditItem(item);
    setForm({
      title: item.title,
      watchType: item.watchType,
      status: item.status,
      pausedAtMin:
        item.pausedAtMin !== undefined && item.pausedAtMin !== null
          ? String(Number(item.pausedAtMin))
          : "",
      notes: item.notes,
      currentEpisode: item.currentEpisode ?? "",
      review: item.review ?? "",
      rating: Number(item.rating ?? 0n),
      posterUrl: item.posterUrl ?? "",
    });
    // If item already has a poster, don't auto-overwrite unless user clears it
    setPosterManuallyCleared(false);
    setShowForm(true);
  };

  const handleClearPoster = () => {
    setForm((p) => ({ ...p, posterUrl: "" }));
    setPosterManuallyCleared(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    const item: WatchItem = {
      id: editItem?.id ?? 0n,
      title: form.title.trim(),
      watchType: form.watchType,
      status: form.status,
      pausedAtMin: form.pausedAtMin
        ? BigInt(Math.max(0, Number.parseInt(form.pausedAtMin, 10)))
        : undefined,
      notes: form.notes.trim(),
      currentEpisode: form.currentEpisode.trim() || undefined,
      review: form.review.trim(),
      rating: BigInt(form.rating),
      posterUrl: form.posterUrl.trim() || undefined,
    };
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, item });
        toast.success("Actualizado correctamente");
      } else {
        await createMutation.mutateAsync(item);
        toast.success("Añadido a la lista");
      }
      setShowForm(false);
      setForm(DEFAULT_FORM);
    } catch (e) {
      toast.error(
        `Error al guardar: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Eliminado");
    } catch (e) {
      toast.error(
        `Error al eliminar: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      setDeleteId(null);
    }
  };

  const groupedItems = STATUS_ORDER.map((status) => ({
    status,
    items: watchItems.filter((i) => i.status === status),
  })).filter((g) => g.items.length > 0);

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="px-4 pt-6 pb-4" data-ocid="watching.section">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <Film size={20} className="text-primary" />
          Viendo
        </h2>
        <Button
          size="sm"
          onClick={openAdd}
          className="rounded-xl"
          data-ocid="watching.primary_button"
        >
          <Plus size={16} className="mr-1" />
          Añadir
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="watching.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : watchItems.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="watching.empty_state"
        >
          <span className="text-5xl mb-3">🎬</span>
          <p className="text-base font-semibold text-foreground">
            ¡Empieza tu lista!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Añade lo que estáis viendo ahora
          </p>
          <Button
            className="mt-4 rounded-xl"
            onClick={openAdd}
            data-ocid="watching.secondary_button"
          >
            <Plus size={16} className="mr-1" /> Añadir el primero
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedItems.map(({ status, items }) => (
            <section key={status}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
                {STATUS_LABELS[status]} ({items.length})
              </h3>
              <div className="space-y-2.5">
                <AnimatePresence>
                  {items.map((item, idx) => (
                    <motion.div
                      key={item.id.toString()}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-card rounded-xl p-4 card-shadow"
                      data-ocid={`watching.item.${idx + 1}`}
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
                                  {item.watchType === WatchType.movie
                                    ? "🎬"
                                    : "📺"}
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
                          <p className="font-semibold text-sm text-foreground truncate">
                            {item.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <Badge
                              variant="outline"
                              className={`text-xs border ${STATUS_COLORS[item.status]}`}
                            >
                              {STATUS_LABELS[item.status]}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {item.watchType === WatchType.movie
                                ? "Película"
                                : "Serie"}
                            </Badge>
                            {item.pausedAtMin !== undefined &&
                              item.pausedAtMin !== null && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock size={10} />
                                  Min. {Number(item.pausedAtMin)}
                                </span>
                              )}
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
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                              {item.notes}
                            </p>
                          )}
                          {item.review && (
                            <p className="text-xs text-muted-foreground/80 italic mt-1.5 border-l-2 border-primary/30 pl-2 line-clamp-2">
                              &ldquo;{item.review}&rdquo;
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-1">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            data-ocid={`watching.edit_button.${idx + 1}`}
                            aria-label="Editar"
                          >
                            <Edit2
                              size={14}
                              className="text-muted-foreground"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            data-ocid={`watching.delete_button.${idx + 1}`}
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
            </section>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="watching.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar" : "Añadir"} película o serie
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Ej: Breaking Bad"
                  value={form.title}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, title: e.target.value }));
                    setPosterManuallyCleared(false);
                  }}
                  data-ocid="watching.input"
                  className="flex-1"
                />
                {/* Poster preview */}
                {(form.posterUrl || tmdbLoading) && (
                  <div className="relative flex-shrink-0">
                    {tmdbLoading && !form.posterUrl ? (
                      <div className="w-[42px] h-[60px] rounded-lg bg-muted flex items-center justify-center">
                        <Loader2
                          size={14}
                          className="animate-spin text-muted-foreground"
                        />
                      </div>
                    ) : form.posterUrl ? (
                      <>
                        <PosterImage
                          src={form.posterUrl}
                          alt="Póster"
                          className="w-[42px] h-[60px] rounded-lg object-cover shadow-md"
                          fallback={
                            <div className="w-[42px] h-[60px] rounded-lg bg-muted flex items-center justify-center text-lg">
                              🎬
                            </div>
                          }
                        />
                        <button
                          type="button"
                          onClick={handleClearPoster}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
                          aria-label="Quitar póster"
                        >
                          <X size={9} />
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
              {form.posterUrl && (
                <p className="text-xs text-muted-foreground">
                  🎞️ Carátula encontrada automáticamente
                </p>
              )}
              {tmdbLoading && !form.posterUrl && (
                <p className="text-xs text-muted-foreground">
                  Buscando carátula...
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, watchType: WatchType.movie }))
                  }
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.watchType === WatchType.movie
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                  data-ocid="watching.toggle"
                >
                  🎬 Película
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, watchType: WatchType.series }))
                  }
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.watchType === WatchType.series
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-foreground hover:bg-muted"
                  }`}
                  data-ocid="watching.toggle"
                >
                  📺 Serie
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setForm((p) => ({ ...p, status: s }))}
                    className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                      form.status === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-foreground hover:bg-muted"
                    }`}
                    data-ocid="watching.toggle"
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Puntuación</Label>
              <StarSelector
                value={form.rating}
                onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Minuto donde os quedasteis</Label>
              <div className="relative">
                <Clock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  type="number"
                  min="0"
                  placeholder="Ej: 42"
                  value={form.pausedAtMin}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, pausedAtMin: e.target.value }))
                  }
                  className="pl-9"
                  data-ocid="watching.input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Episodio actual</Label>
              <div className="relative">
                <Tv
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Ej: T2 E5 o Episodio 12"
                  value={form.currentEpisode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, currentEpisode: e.target.value }))
                  }
                  className="pl-9"
                  data-ocid="watching.input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Reseña / Opinión</Label>
              <Textarea
                placeholder="¿Qué os está pareciendo?"
                value={form.review}
                onChange={(e) =>
                  setForm((p) => ({ ...p, review: e.target.value }))
                }
                rows={3}
                data-ocid="watching.textarea"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                placeholder="Comentarios, temporada, episodio..."
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                data-ocid="watching.textarea"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl"
                data-ocid="watching.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isMutating}
                className="flex-1 rounded-xl"
                data-ocid="watching.submit_button"
              >
                {isMutating ? "Guardando..." : editItem ? "Guardar" : "Añadir"}
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
          data-ocid="watching.modal"
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
              data-ocid="watching.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="watching.confirm_button"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
