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
import {
  Bookmark,
  Clock,
  Edit2,
  Film,
  Heart,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { WatchStatus, WatchType } from "../backend.d";
import {
  useGetAllPendingItems,
  useGetAllWatchItems,
  useGetTodaysMenu,
} from "../hooks/useQueries";

type TabId = "inicio" | "viendo" | "pendientes" | "menu" | "datos";

interface HomeTabProps {
  onTabChange: (tab: TabId) => void;
}

export default function HomeTab({ onTabChange }: HomeTabProps) {
  const [editNames, setEditNames] = useState(false);
  const [name1, setName1] = useState(
    () => localStorage.getItem("partnerName1") || "",
  );
  const [name2, setName2] = useState(
    () => localStorage.getItem("partnerName2") || "",
  );
  const [tempName1, setTempName1] = useState(name1);
  const [tempName2, setTempName2] = useState(name2);

  const { data: watchItems = [] } = useGetAllWatchItems();
  const { data: todaysMenu } = useGetTodaysMenu();
  const { data: pendingItems = [] } = useGetAllPendingItems();

  const watchingItems = watchItems.filter(
    (i) => i.status === WatchStatus.watching,
  );
  const currentlyWatching = watchingItems[0] || null;
  const pendingCount = pendingItems.length;

  const handleSaveNames = () => {
    const n1 = tempName1.trim();
    const n2 = tempName2.trim();
    localStorage.setItem("partnerName1", n1);
    localStorage.setItem("partnerName2", n2);
    setName1(n1);
    setName2(n2);
    setEditNames(false);
  };

  const formatMin = (min: bigint | undefined) => {
    if (min === undefined || min === null) return null;
    const m = Number(min);
    const h = Math.floor(m / 60);
    const mins = m % 60;
    if (h > 0) return `${h}h ${mins}m`;
    return `${m}m`;
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5" data-ocid="home.section">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <Heart size={16} className="text-primary fill-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground">
              CinePareja
            </h1>
          </div>
          {name1 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {name1}
              {name2 ? ` & ${name2}` : ""}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setTempName1(name1);
            setTempName2(name2);
            setEditNames(true);
          }}
          data-ocid="home.edit_button"
          className="rounded-xl"
        >
          <Edit2 size={16} />
        </Button>
      </div>

      {/* Hero watching card */}
      {currentlyWatching ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-gradient rounded-2xl p-5 text-white card-shadow"
          data-ocid="home.card"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                Viendo ahora
              </p>
              <h2 className="text-xl font-display font-bold mt-1 leading-tight">
                {currentlyWatching.title}
              </h2>
              <div className="flex items-center gap-2 mt-3">
                <Badge className="bg-white/20 text-white border-none text-xs">
                  {currentlyWatching.watchType === WatchType.movie
                    ? "🎬 Película"
                    : "📺 Serie"}
                </Badge>
                {currentlyWatching.pausedAtMin !== undefined &&
                  currentlyWatching.pausedAtMin !== null && (
                    <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5">
                      <Clock size={11} className="text-white" />
                      <span className="text-xs text-white">
                        Min. {formatMin(currentlyWatching.pausedAtMin)}
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <div className="text-4xl ml-2">
              {currentlyWatching.watchType === WatchType.movie ? "🎬" : "📺"}
            </div>
          </div>
          {currentlyWatching.notes && (
            <p className="mt-3 text-white/80 text-xs line-clamp-2">
              {currentlyWatching.notes}
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-gradient rounded-2xl p-5 text-white card-shadow"
          data-ocid="home.card"
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">🎬</span>
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                Nada en marcha
              </p>
              <h2 className="text-lg font-display font-bold text-white mt-0.5">
                ¿Qué ponemos hoy?
              </h2>
              <button
                type="button"
                onClick={() => onTabChange("viendo")}
                className="mt-2 text-xs text-white/90 underline underline-offset-2"
              >
                Añadir algo →
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Viendo ahora section */}
      {watchingItems.length > 0 && (
        <section>
          <h3 className="text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Film size={16} className="text-primary" />
            Viendo ahora
          </h3>
          <div className="space-y-2.5">
            {watchingItems.map((item) => (
              <motion.div
                key={item.id.toString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl p-4 card-shadow flex items-center justify-between"
              >
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
                    {item.pausedAtMin !== undefined &&
                      item.pausedAtMin !== null && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={11} />
                          Min. {Number(item.pausedAtMin)}
                        </span>
                      )}
                  </div>
                </div>
                <span className="text-2xl ml-2">
                  {item.watchType === WatchType.movie ? "🎬" : "📺"}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Menu de hoy */}
      <section>
        <h3 className="text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <UtensilsCrossed size={16} className="text-primary" />
          Menú de hoy
        </h3>
        {todaysMenu ? (
          <div
            className="bg-card rounded-xl p-4 card-shadow space-y-2"
            data-ocid="home.panel"
          >
            {todaysMenu.breakfast && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🌅</span>
                <div>
                  <p className="text-xs text-muted-foreground">Desayuno</p>
                  <p className="text-sm font-medium text-foreground">
                    {todaysMenu.breakfast}
                  </p>
                </div>
              </div>
            )}
            {todaysMenu.lunch && (
              <div className="flex items-center gap-3">
                <span className="text-lg">☀️</span>
                <div>
                  <p className="text-xs text-muted-foreground">Comida</p>
                  <p className="text-sm font-medium text-foreground">
                    {todaysMenu.lunch}
                  </p>
                </div>
              </div>
            )}
            {todaysMenu.dinner && (
              <div className="flex items-center gap-3">
                <span className="text-lg">🌙</span>
                <div>
                  <p className="text-xs text-muted-foreground">Cena</p>
                  <p className="text-sm font-medium text-foreground">
                    {todaysMenu.dinner}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="bg-card rounded-xl p-4 card-shadow flex items-center justify-between"
            data-ocid="home.empty_state"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍽️</span>
              <p className="text-sm text-muted-foreground">Sin menú para hoy</p>
            </div>
            <button
              type="button"
              onClick={() => onTabChange("menu")}
              className="text-xs text-primary font-medium"
            >
              Añadir →
            </button>
          </div>
        )}
      </section>

      {/* Pendientes */}
      <section>
        <h3 className="text-base font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Bookmark size={16} className="text-primary" />
          Pendientes por ver
        </h3>
        <div
          className="bg-card rounded-xl p-4 card-shadow flex items-center justify-between"
          data-ocid="home.panel"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {pendingCount}{" "}
                {pendingCount === 1 ? "título pendiente" : "títulos pendientes"}
              </p>
              <p className="text-xs text-muted-foreground">Lista de deseos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("pendientes")}
            className="text-xs text-primary font-medium"
          >
            Ver lista →
          </button>
        </div>
      </section>

      {/* Edit names modal */}
      <Dialog open={editNames} onOpenChange={(o) => !o && setEditNames(false)}>
        <DialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
          data-ocid="home.dialog"
        >
          <DialogHeader>
            <DialogTitle>Vuestros nombres</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Tu nombre</Label>
              <Input
                value={tempName1}
                onChange={(e) => setTempName1(e.target.value)}
                placeholder="Tu nombre"
                data-ocid="home.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre de tu pareja</Label>
              <Input
                value={tempName2}
                onChange={(e) => setTempName2(e.target.value)}
                placeholder="Nombre de tu pareja"
                data-ocid="home.input"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setEditNames(false)}
                className="flex-1 rounded-xl"
                data-ocid="home.cancel_button"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveNames}
                className="flex-1 rounded-xl"
                data-ocid="home.save_button"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
