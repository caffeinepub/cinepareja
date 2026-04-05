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
  Film,
  ImageDown,
  Loader2,
  Trash2,
  Tv,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WatchStatus, WatchType } from "../backend.d";
import { loadConfig } from "../config";
import {
  useDeleteMealMenu,
  useDeletePendingItem,
  useDeleteWatchItem,
  useGetAllAlbumEntries,
  useGetAllMealMenus,
  useGetAllPendingItems,
  useGetAllWatchItems,
} from "../hooks/useQueries";

function bigintToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

function formatDateES(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function roundRectClip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

interface AlbumEntryData {
  date: bigint;
  description: string;
  blobIds: string[];
}

interface StatsData {
  watching: number;
  pending: number;
  completed: number;
  pendingItems: number;
  photos: number;
}

interface WatchingItemData {
  title: string;
  watchType: string;
  currentEpisode?: string;
  review: string;
}

async function generateRomanticCollage(
  albumEntries: AlbumEntryData[],
  stats: StatsData,
  getBlobUrl: (blobId: string) => string,
  watchingItems: WatchingItemData[],
): Promise<Blob> {
  const W = 1080;
  const H = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#4a1530");
  bgGrad.addColorStop(0.35, "#9b3a5c");
  bgGrad.addColorStop(0.65, "#e8829a");
  bgGrad.addColorStop(1, "#fde8d8");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Scattered hearts
  const heartPositions = [
    { x: 80, y: 160, size: 28, alpha: 0.18 },
    { x: 980, y: 220, size: 20, alpha: 0.14 },
    { x: 50, y: 450, size: 16, alpha: 0.12 },
    { x: 1020, y: 500, size: 24, alpha: 0.16 },
    { x: 140, y: 720, size: 18, alpha: 0.1 },
    { x: 960, y: 780, size: 30, alpha: 0.13 },
    { x: 60, y: 1000, size: 22, alpha: 0.11 },
    { x: 1000, y: 1050, size: 16, alpha: 0.15 },
    { x: 100, y: 1280, size: 26, alpha: 0.12 },
    { x: 950, y: 1340, size: 20, alpha: 0.1 },
    { x: 540, y: 90, size: 18, alpha: 0.09 },
    { x: 300, y: 1700, size: 22, alpha: 0.1 },
    { x: 750, y: 1750, size: 18, alpha: 0.08 },
    { x: 540, y: 1850, size: 28, alpha: 0.1 },
  ];
  for (const h of heartPositions) {
    ctx.save();
    ctx.globalAlpha = h.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.font = `${h.size * 2}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\u2665", h.x, h.y);
    ctx.restore();
  }

  // Vignette
  const vignette = ctx.createRadialGradient(
    W / 2,
    H / 2,
    H * 0.3,
    W / 2,
    H / 2,
    H * 0.85,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Header
  let cursorY = 90;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fff8f0";
  ctx.font = "italic bold 88px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("CinePareja", W / 2, cursorY);
  ctx.restore();
  cursorY += 106;

  ctx.save();
  ctx.fillStyle = "rgba(255,240,230,0.85)";
  ctx.font = "italic 42px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Nuestros Recuerdos", W / 2, cursorY);
  ctx.restore();
  cursorY += 64;

  // Decorative line with heart
  const lineY = cursorY + 12;
  ctx.save();
  ctx.strokeStyle = "rgba(255,220,200,0.5)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(100, lineY);
  ctx.lineTo(W / 2 - 30, lineY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W / 2 + 30, lineY);
  ctx.lineTo(W - 100, lineY);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.fillStyle = "rgba(255,180,160,0.9)";
  ctx.font = "26px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\u2665", W / 2, lineY);
  ctx.restore();
  cursorY += 40;

  // Date
  const today = new Date();
  const todayStr = today.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  ctx.save();
  ctx.fillStyle = "rgba(255,220,200,0.75)";
  ctx.font = "italic 30px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(todayStr, W / 2, cursorY);
  ctx.restore();
  cursorY += 60;

  // ---- Viendo ahora section ----
  const itemsToShow = watchingItems.slice(0, 3);
  if (itemsToShow.length > 0) {
    // Section header
    ctx.save();
    ctx.fillStyle = "rgba(255,240,230,0.95)";
    ctx.font = "italic bold 38px Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 8;
    ctx.fillText("\uD83D\uDCFA Viendo ahora", 60, cursorY);
    ctx.restore();
    cursorY += 54;

    for (const wi of itemsToShow) {
      if (cursorY > H - 400) break;

      const typeEmoji =
        wi.watchType === WatchType.movie ? "\uD83C\uDFAC" : "\uD83D\uDCFA";
      const titleLine = `${typeEmoji} ${wi.title}${wi.currentEpisode ? ` — ${wi.currentEpisode}` : ""}`;

      ctx.save();
      ctx.fillStyle = "rgba(255,240,225,0.9)";
      ctx.font = "bold 30px Georgia, serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(titleLine, 70, cursorY);
      ctx.restore();
      cursorY += 40;

      if (wi.review) {
        const snippet =
          wi.review.length > 80 ? `${wi.review.slice(0, 80)}…` : wi.review;
        ctx.save();
        ctx.fillStyle = "rgba(255,215,195,0.8)";
        ctx.font = "italic 26px Georgia, serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(`\u201c${snippet}\u201d`, 80, cursorY);
        ctx.restore();
        cursorY += 38;
      }

      cursorY += 12;
    }

    // Divider
    ctx.save();
    ctx.strokeStyle = "rgba(255,200,180,0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(80, cursorY);
    ctx.lineTo(W - 80, cursorY);
    ctx.stroke();
    ctx.restore();
    cursorY += 28;
  }

  // Album entries
  const sortedEntries = [...albumEntries]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 6);

  for (const entry of sortedEntries) {
    if (cursorY > H - 320) break;

    const entryDate = bigintToDate(entry.date);
    const dateLabel = formatDateES(entryDate);

    ctx.save();
    ctx.fillStyle = "rgba(255,240,230,0.9)";
    ctx.font = "italic bold 34px Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 8;
    ctx.fillText(dateLabel, 60, cursorY);
    ctx.restore();
    cursorY += 50;

    if (entry.description) {
      ctx.save();
      ctx.fillStyle = "rgba(255,220,200,0.75)";
      ctx.font = "italic 26px Georgia, serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`\u201c${entry.description}\u201d`, 70, cursorY);
      ctx.restore();
      cursorY += 40;
    }

    const photosToShow = entry.blobIds.slice(0, 4);
    const photoCount = photosToShow.length;
    if (photoCount > 0) {
      const padding = 60;
      const gap = 14;
      const totalGap = gap * (photoCount - 1);
      const photoW = (W - padding * 2 - totalGap) / photoCount;
      const photoH = photoW;
      const cornerR = 18;

      for (let i = 0; i < photoCount; i++) {
        const px = padding + i * (photoW + gap);
        const py = cursorY;

        let bitmap: HTMLImageElement | null = null;
        try {
          const url = getBlobUrl(photosToShow[i]);
          if (url) {
            bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error("Image load failed"));
              img.src = `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}`;
            });
          }
        } catch {
          bitmap = null;
        }

        // White border shadow
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        roundRectClip(ctx, px - 4, py - 4, photoW + 8, photoH + 8, cornerR + 3);
        ctx.fill();
        ctx.restore();

        // Draw photo with rounded clip
        ctx.save();
        roundRectClip(ctx, px, py, photoW, photoH, cornerR);
        ctx.clip();

        if (bitmap) {
          const srcAspect = bitmap.naturalWidth / bitmap.naturalHeight;
          const dstAspect = photoW / photoH;
          let sx = 0;
          let sy = 0;
          let sw = bitmap.naturalWidth;
          let sh = bitmap.naturalHeight;
          if (srcAspect > dstAspect) {
            sw = bitmap.naturalHeight * dstAspect;
            sx = (bitmap.naturalWidth - sw) / 2;
          } else {
            sh = bitmap.naturalWidth / dstAspect;
            sy = (bitmap.naturalHeight - sh) / 2;
          }
          ctx.drawImage(bitmap, sx, sy, sw, sh, px, py, photoW, photoH);
        } else {
          const phGrad = ctx.createLinearGradient(
            px,
            py,
            px + photoW,
            py + photoH,
          );
          phGrad.addColorStop(0, "#e8829a");
          phGrad.addColorStop(1, "#c45a78");
          ctx.fillStyle = phGrad;
          ctx.fillRect(px, py, photoW, photoH);
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = `${photoH * 0.35}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("\u2665", px + photoW / 2, py + photoH / 2);
        }

        ctx.restore();
      }

      cursorY += photoH + 28;
    }

    cursorY += 24;
  }

  // Footer stats
  const footerTop = H - 230;

  ctx.save();
  ctx.strokeStyle = "rgba(255,200,180,0.35)";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(80, footerTop);
  ctx.lineTo(W - 80, footerTop);
  ctx.stroke();
  ctx.restore();

  const statsY = footerTop + 30;
  const statItems = [
    { icon: "\uD83C\uDFAC", label: "Viendo", value: stats.watching },
    { icon: "\u2705", label: "Completadas", value: stats.completed },
    { icon: "\uD83D\uDCCB", label: "Por ver", value: stats.pendingItems },
    { icon: "\uD83D\uDCF8", label: "Fotos", value: stats.photos },
  ];
  const colW = W / statItems.length;
  ctx.save();
  for (let i = 0; i < statItems.length; i++) {
    const s = statItems[i];
    const cx = colW * i + colW / 2;
    ctx.font = "32px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(s.icon, cx, statsY);
    ctx.fillStyle = "#fff8f0";
    ctx.font = "bold 38px Georgia, serif";
    ctx.textBaseline = "top";
    ctx.fillText(String(s.value), cx, statsY + 42);
    ctx.fillStyle = "rgba(255,220,200,0.75)";
    ctx.font = "italic 22px Georgia, serif";
    ctx.fillText(s.label, cx, statsY + 86);
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(255,210,190,0.8)";
  ctx.font = "italic 30px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 8;
  ctx.fillText("\u2764  Creado con amor  \u2764", W / 2, H - 50);
  ctx.restore();

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No se pudo generar la imagen"));
    }, "image/png");
  });
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
  const [isExporting, setIsExporting] = useState(false);

  // Load storage config on mount so album photos display correctly
  const [storageConfig, setStorageConfig] = useState<{
    storageGatewayUrl: string;
    backendCanisterId: string;
    projectId: string;
  } | null>(null);

  useEffect(() => {
    loadConfig()
      .then((config) => {
        setStorageConfig({
          storageGatewayUrl: config.storage_gateway_url,
          backendCanisterId: config.backend_canister_id,
          projectId: config.project_id,
        });
        (window as any).__caffeineStorageGatewayUrl =
          config.storage_gateway_url;
        (window as any).__caffeineBackendCanisterId =
          config.backend_canister_id;
        (window as any).__caffeineProjectId = config.project_id;
      })
      .catch(() => {
        setStorageConfig({
          storageGatewayUrl:
            (window as any).__caffeineStorageGatewayUrl ||
            "https://blob.caffeine.ai",
          backendCanisterId: (window as any).__caffeineBackendCanisterId || "",
          projectId:
            (window as any).__caffeineProjectId ||
            "0000000-0000-0000-0000-00000000000",
        });
      });
  }, []);

  const getBlobUrl = (blobId: string): string => {
    if (!blobId) return "";
    const cfg = storageConfig || {
      storageGatewayUrl:
        (window as any).__caffeineStorageGatewayUrl ||
        "https://blob.caffeine.ai",
      backendCanisterId: (window as any).__caffeineBackendCanisterId || "",
      projectId:
        (window as any).__caffeineProjectId ||
        "0000000-0000-0000-0000-00000000000",
    };
    return `${cfg.storageGatewayUrl}/v1/blob/?blob_hash=${encodeURIComponent(blobId)}&owner_id=${encodeURIComponent(cfg.backendCanisterId)}&project_id=${encodeURIComponent(cfg.projectId)}`;
  };

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

  const sortedAlbumEntries = [...albumEntries].sort((a, b) =>
    a.date > b.date ? -1 : 1,
  );

  const currentlyWatching = watchItems.filter(
    (i) => i.status === WatchStatus.watching,
  );

  const handleExportPhoto = async () => {
    setIsExporting(true);
    try {
      const blob = await generateRomanticCollage(
        albumEntries,
        stats,
        getBlobUrl,
        currentlyWatching.map((i) => ({
          title: i.title,
          watchType: i.watchType,
          currentEpisode: i.currentEpisode,
          review: i.review ?? "",
        })),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cinepareja-recuerdos-${
        new Date().toISOString().split("T")[0]
      }.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("\u00a1Imagen rom\u00e1ntica descargada! \uD83D\uDC95");
    } catch (err) {
      console.error(err);
      toast.error("No se pudo generar la imagen");
    } finally {
      setIsExporting(false);
    }
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
        <ImageDown size={20} className="text-primary" />
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
                    Men\u00fas guardados
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
                  en {stats.albumDays} d\u00eda
                  {stats.albumDays !== 1 ? "s" : ""}
                </p>
              </motion.div>
            </div>
          </section>

          {/* Currently Watching */}
          {currentlyWatching.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Viendo ahora
              </h3>
              <div className="space-y-2.5">
                {currentlyWatching.map((item, idx) => (
                  <motion.div
                    key={item.id.toString()}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-card rounded-xl p-4 card-shadow"
                    data-ocid={`data.item.${idx + 1}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">
                        {item.watchType === WatchType.movie ? "🎬" : "📺"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">
                          {item.title}
                        </p>
                        {item.currentEpisode && (
                          <p className="flex items-center gap-1 text-xs text-primary mt-0.5">
                            <Tv size={10} />
                            {item.currentEpisode}
                          </p>
                        )}
                        {item.review && (
                          <p className="text-xs text-muted-foreground italic mt-1.5 border-l-2 border-primary/30 pl-2 line-clamp-3">
                            &ldquo;
                            {item.review.length > 100
                              ? `${item.review.slice(0, 100)}…`
                              : item.review}
                            &rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Album Photos by Date */}
          {sortedAlbumEntries.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Fotos del \u00e1lbum
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

                      <div className="p-3 grid grid-cols-3 gap-2">
                        {entry.blobIds.map((blobId, photoIdx) => {
                          const url = getBlobUrl(blobId);
                          return (
                            <div
                              key={blobId}
                              className="relative aspect-square"
                            >
                              {url ? (
                                <img
                                  src={url}
                                  alt={`Foto ${photoIdx + 1} del ${formatDateES(date)}`}
                                  className="w-full h-full object-cover rounded-lg"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                                  <Camera
                                    size={20}
                                    className="text-muted-foreground"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
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

          {/* Export as Photo */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Exportar
            </h3>
            <div className="bg-card rounded-xl p-4 card-shadow">
              <p className="text-sm text-foreground font-medium mb-1">
                Descarga tus recuerdos
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Genera una imagen bonita con lo que estáis viendo, vuestros
                recuerdos, fotos del álbum y estadísticas en un diseño
                romántico.
              </p>
              <Button
                onClick={handleExportPhoto}
                disabled={isExporting}
                className="w-full rounded-xl"
                data-ocid="data.primary_button"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Generando imagen...
                  </>
                ) : (
                  <>
                    <ImageDown size={16} className="mr-2" />
                    Descargar como imagen
                  </>
                )}
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
                Borra permanentemente todas las listas, pel\u00edculas y
                men\u00fas.
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

      <AlertDialog open={showConfirmReset} onOpenChange={setShowConfirmReset}>
        <AlertDialogContent
          className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
          data-ocid="data.modal"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>\u00bfEliminar TODOS los datos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acci\u00f3n es irreversible. Se eliminar\u00e1n todas las
              pel\u00edculas, series, listas de pendientes y men\u00fas.
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
              {isResetting ? "Eliminando..." : "S\u00ed, eliminar todo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
