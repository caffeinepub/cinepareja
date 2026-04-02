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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Trash2, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MealMenu } from "../backend.d";
import {
  useDeleteMealMenu,
  useGetAllMealMenus,
  useGetTodaysMenu,
  useUpsertMealMenu,
} from "../hooks/useQueries";

function dateToNano(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

function getTodayNano(): bigint {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateToNano(today);
}

function formatMenuDate(nanoTs: bigint): string {
  const ms = Number(nanoTs / 1_000_000n);
  const date = new Date(ms);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isToday(nanoTs: bigint): boolean {
  const ms = Number(nanoTs / 1_000_000n);
  const date = new Date(ms);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

interface MenuFormState {
  breakfast: string;
  lunch: string;
  dinner: string;
  notes: string;
}

const DEFAULT_FORM: MenuFormState = {
  breakfast: "",
  lunch: "",
  dinner: "",
  notes: "",
};

export default function MenuTab() {
  const { data: todaysMenu, isLoading } = useGetTodaysMenu();
  const { data: allMenus = [] } = useGetAllMealMenus();
  const upsertMutation = useUpsertMealMenu();
  const deleteMutation = useDeleteMealMenu();

  const [form, setForm] = useState<MenuFormState>(DEFAULT_FORM);
  const [isEditing, setIsEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (todaysMenu) {
      setForm({
        breakfast: todaysMenu.breakfast,
        lunch: todaysMenu.lunch,
        dinner: todaysMenu.dinner,
        notes: todaysMenu.notes,
      });
      setIsEditing(false);
    } else {
      setForm(DEFAULT_FORM);
      setIsEditing(true);
    }
  }, [todaysMenu]);

  const handleSave = async () => {
    const menu: MealMenu = {
      date: getTodayNano(),
      breakfast: form.breakfast.trim(),
      lunch: form.lunch.trim(),
      dinner: form.dinner.trim(),
      notes: form.notes.trim(),
    };
    try {
      await upsertMutation.mutateAsync(menu);
      toast.success("Menú guardado");
      setIsEditing(false);
    } catch {
      toast.error("Error al guardar el menú");
    }
  };

  const handleDelete = async () => {
    if (!todaysMenu) return;
    try {
      await deleteMutation.mutateAsync(todaysMenu.date);
      toast.success("Menú eliminado");
      setForm(DEFAULT_FORM);
      setIsEditing(true);
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setShowDelete(false);
    }
  };

  const pastMenus = allMenus
    .filter((m) => !isToday(m.date))
    .sort((a, b) => Number(b.date - a.date))
    .slice(0, 7);

  const isSaving = upsertMutation.isPending;

  return (
    <div className="px-4 pt-6 pb-4" data-ocid="menu.section">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-primary" />
          Menú del día
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="menu.loading_state">
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today's date */}
          <p className="text-sm text-muted-foreground capitalize">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>

          {/* Menu form/display */}
          <motion.div
            layout
            className="bg-card rounded-2xl p-5 card-shadow"
            data-ocid="menu.card"
          >
            {isEditing ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">
                  {todaysMenu ? "Editar menú" : "Añadir menú de hoy"}
                </h3>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <span>🌅</span> Desayuno
                  </Label>
                  <Input
                    placeholder="Ej: Tostadas con mermelada"
                    value={form.breakfast}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, breakfast: e.target.value }))
                    }
                    data-ocid="menu.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <span>☀️</span> Comida
                  </Label>
                  <Input
                    placeholder="Ej: Paella valenciana"
                    value={form.lunch}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lunch: e.target.value }))
                    }
                    data-ocid="menu.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <span>🌙</span> Cena
                  </Label>
                  <Input
                    placeholder="Ej: Tortilla de patatas"
                    value={form.dinner}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, dinner: e.target.value }))
                    }
                    data-ocid="menu.input"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Alergias, cambios, preferencias..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={2}
                    data-ocid="menu.textarea"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  {todaysMenu && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-xl"
                      data-ocid="menu.cancel_button"
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 rounded-xl"
                    data-ocid="menu.submit_button"
                  >
                    {isSaving ? "Guardando..." : "Guardar menú"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {form.breakfast && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌅</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Desayuno</p>
                      <p className="text-sm font-medium text-foreground">
                        {form.breakfast}
                      </p>
                    </div>
                  </div>
                )}
                {form.lunch && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">☀️</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Comida</p>
                      <p className="text-sm font-medium text-foreground">
                        {form.lunch}
                      </p>
                    </div>
                  </div>
                )}
                {form.dinner && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌙</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Cena</p>
                      <p className="text-sm font-medium text-foreground">
                        {form.dinner}
                      </p>
                    </div>
                  </div>
                )}
                {form.notes && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-xs text-muted-foreground">Notas</p>
                      <p className="text-sm font-medium text-foreground">
                        {form.notes}
                      </p>
                    </div>
                  </div>
                )}
                {!form.breakfast && !form.lunch && !form.dinner && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Sin detalles en el menú
                  </p>
                )}

                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 rounded-xl"
                    data-ocid="menu.edit_button"
                  >
                    Editar menú
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDelete(true)}
                    className="rounded-xl text-destructive hover:bg-destructive/10 border-destructive/30"
                    data-ocid="menu.delete_button"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          {/* History */}
          {pastMenus.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold text-foreground w-full py-2"
                data-ocid="menu.toggle"
              >
                <span>📅 Menús anteriores ({pastMenus.length})</span>
                {showHistory ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2.5 pt-2">
                      {pastMenus.map((menu, idx) => (
                        <div
                          key={menu.date.toString()}
                          className="bg-card rounded-xl p-4 card-shadow"
                          data-ocid={`menu.item.${idx + 1}`}
                        >
                          <p className="text-xs font-semibold text-primary mb-2 capitalize">
                            {formatMenuDate(menu.date)}
                          </p>
                          <div className="space-y-1.5">
                            {menu.breakfast && (
                              <p className="text-xs text-foreground">
                                <span className="text-muted-foreground">
                                  🌅{" "}
                                </span>
                                {menu.breakfast}
                              </p>
                            )}
                            {menu.lunch && (
                              <p className="text-xs text-foreground">
                                <span className="text-muted-foreground">
                                  ☀️{" "}
                                </span>
                                {menu.lunch}
                              </p>
                            )}
                            {menu.dinner && (
                              <p className="text-xs text-foreground">
                                <span className="text-muted-foreground">
                                  🌙{" "}
                                </span>
                                {menu.dinner}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
          data-ocid="menu.modal"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el menú de hoy?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              data-ocid="menu.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="menu.confirm_button"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
