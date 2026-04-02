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
import { Clock, Edit2, Film, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { WatchItem } from "../backend.d";
import { WatchStatus, WatchType } from "../backend.d";
import {
  useCreateWatchItem,
  useDeleteWatchItem,
  useGetAllWatchItems,
  useUpdateWatchItem,
} from "../hooks/useQueries";

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
}

const DEFAULT_FORM: FormState = {
  title: "",
  watchType: WatchType.movie,
  status: WatchStatus.watching,
  pausedAtMin: "",
  notes: "",
};

export default function WatchingTab() {
  const { data: watchItems = [], isLoading } = useGetAllWatchItems();
  const createMutation = useCreateWatchItem();
  const updateMutation = useUpdateWatchItem();
  const deleteMutation = useDeleteWatchItem();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<WatchItem | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditItem(null);
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
    });
    setShowForm(true);
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
                        <span className="text-2xl mt-0.5">
                          {item.watchType === WatchType.movie ? "🎬" : "📺"}
                        </span>
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
                          </div>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                              {item.notes}
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
              <Input
                placeholder="Ej: Breaking Bad"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                data-ocid="watching.input"
              />
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
