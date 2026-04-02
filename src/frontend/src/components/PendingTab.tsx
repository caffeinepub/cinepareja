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
import { Bookmark, Edit2, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { PendingItem } from "../backend.d";
import { WatchType } from "../backend.d";
import {
  useCreatePendingItem,
  useDeletePendingItem,
  useGetAllPendingItems,
  useUpdatePendingItem,
} from "../hooks/useQueries";

interface FormState {
  title: string;
  watchType: WatchType;
  notes: string;
}

const DEFAULT_FORM: FormState = {
  title: "",
  watchType: WatchType.movie,
  notes: "",
};

export default function PendingTab() {
  const { data: pendingItems = [], isLoading } = useGetAllPendingItems();
  const createMutation = useCreatePendingItem();
  const updateMutation = useUpdatePendingItem();
  const deleteMutation = useDeletePendingItem();

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PendingItem | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const openAdd = () => {
    setForm(DEFAULT_FORM);
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item: PendingItem) => {
    setEditItem(item);
    setForm({
      title: item.title,
      watchType: item.watchType,
      notes: item.notes,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    const item: PendingItem = {
      id: editItem?.id ?? 0n,
      title: form.title.trim(),
      watchType: form.watchType,
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
      toast.success("Eliminado de pendientes");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleteId(null);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="px-4 pt-6 pb-4" data-ocid="pending.section">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <Bookmark size={20} className="text-primary" />
          Por ver
        </h2>
        <Button
          size="sm"
          onClick={openAdd}
          className="rounded-xl"
          data-ocid="pending.primary_button"
        >
          <Plus size={16} className="mr-1" />
          Añadir
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="pending.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : pendingItems.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="pending.empty_state"
        >
          <span className="text-5xl mb-3">🎞️</span>
          <p className="text-base font-semibold text-foreground">
            ¡La lista está vacía!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Guarda películas y series que queréis ver
          </p>
          <Button
            className="mt-4 rounded-xl"
            onClick={openAdd}
            data-ocid="pending.secondary_button"
          >
            <Plus size={16} className="mr-1" /> Añadir el primero
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-muted-foreground mb-2">
            {pendingItems.length}{" "}
            {pendingItems.length === 1 ? "título" : "títulos"} en la lista
          </p>
          <AnimatePresence>
            {pendingItems.map((item, idx) => (
              <motion.div
                key={item.id.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-card rounded-xl p-4 card-shadow"
                data-ocid={`pending.item.${idx + 1}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {item.watchType === WatchType.movie ? "🎬" : "📺"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.watchType === WatchType.movie
                          ? "Película"
                          : "Serie"}
                      </Badge>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      data-ocid={`pending.edit_button.${idx + 1}`}
                      aria-label="Editar"
                    >
                      <Edit2 size={14} className="text-muted-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                      data-ocid={`pending.delete_button.${idx + 1}`}
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

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => !o && setShowForm(false)}>
        <DialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
          data-ocid="pending.dialog"
        >
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Editar" : "Añadir"} a la lista
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input
                placeholder="Ej: Inception"
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                data-ocid="pending.input"
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
                  data-ocid="pending.toggle"
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
                  data-ocid="pending.toggle"
                >
                  📺 Serie
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea
                placeholder="¿Por qué queréis verla?"
                value={form.notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={2}
                data-ocid="pending.textarea"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-xl"
                data-ocid="pending.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isMutating}
                className="flex-1 rounded-xl"
                data-ocid="pending.submit_button"
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
          data-ocid="pending.modal"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este título?</AlertDialogTitle>
            <AlertDialogDescription>
              Se quitará de tu lista de pendientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="pending.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="pending.confirm_button"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
