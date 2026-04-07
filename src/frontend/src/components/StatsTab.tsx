import {
  BarChart2,
  Clock,
  Eye,
  Film,
  Star,
  TrendingDown,
  TrendingUp,
  Tv,
} from "lucide-react";
import { motion } from "motion/react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { WatchStatus, WatchType } from "../backend.d";
import { useGetAllWatchItems } from "../hooks/useQueries";

function StarRow({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          // biome-ignore lint/suspicious/noArrayIndexKey: static fixed-length star row
          key={i}
          size={13}
          className={
            i < count
              ? "text-amber-400 fill-amber-400"
              : "text-muted-foreground/30"
          }
        />
      ))}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-card card-shadow rounded-2xl p-4 flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        <Icon size={18} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-none mb-1">
          {label}
        </p>
        <p className="text-xl font-bold text-foreground leading-tight">
          {value}
        </p>
        {sub && <div className="mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

const PIE_COLORS = ["oklch(0.54 0.135 10)", "oklch(0.88 0.05 290)"];

export default function StatsTab() {
  const { data: items = [], isLoading } = useGetAllWatchItems();

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(4)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center"
        data-ocid="stats.empty"
      >
        <BarChart2 size={52} className="text-primary/30 mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Sin estadísticas aún
        </h2>
        <p className="text-sm text-muted-foreground">
          Añade películas y series en la pestaña "Viendo" para ver vuestras
          estadísticas aquí.
        </p>
      </div>
    );
  }

  // Computed stats
  const completed = items.filter((i) => i.status === WatchStatus.completed);
  const watching = items.filter((i) => i.status === WatchStatus.watching);
  const rated = items.filter((i) => Number(i.rating) > 0);

  const totalMinutes = items.reduce((acc, item) => {
    if (item.pausedAtMin && Number(item.pausedAtMin) > 0) {
      return acc + Number(item.pausedAtMin);
    }
    if (item.watchType === WatchType.movie) return acc + 100;
    const eps = item.currentEpisode
      ? Number.parseInt(item.currentEpisode, 10)
      : 1;
    return acc + (Number.isNaN(eps) ? 25 : eps * 25);
  }, 0);

  const totalHours = Math.floor(totalMinutes / 60);
  const remMinutes = totalMinutes % 60;

  const avgRating =
    rated.length > 0
      ? rated.reduce((a, i) => a + Number(i.rating), 0) / rated.length
      : 0;

  const best = rated.reduce<(typeof rated)[0] | null>((a, i) => {
    if (!a) return i;
    return Number(i.rating) >= Number(a.rating) ? i : a;
  }, null);

  const worst = rated.reduce<(typeof rated)[0] | null>((a, i) => {
    if (!a) return i;
    return Number(i.rating) <= Number(a.rating) ? i : a;
  }, null);

  const moviesCount = items.filter(
    (i) => i.watchType === WatchType.movie,
  ).length;
  const seriesCount = items.filter(
    (i) => i.watchType === WatchType.series,
  ).length;
  const pieData = [
    { name: "Películas", value: moviesCount },
    { name: "Series", value: seriesCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="px-4 pt-6 pb-4 space-y-3" data-ocid="stats.container">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <h1 className="text-2xl font-bold text-foreground">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">
          Vuestro historial juntos 🎬
        </p>
      </motion.div>

      {/* Row: Completados + En progreso */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Film}
          label="Completados"
          value={completed.length}
          sub={<span className="text-xs text-muted-foreground">títulos</span>}
          delay={0.05}
        />
        <StatCard
          icon={Eye}
          label="En progreso"
          value={watching.length}
          sub={
            <span className="text-xs text-muted-foreground">viendo ahora</span>
          }
          delay={0.1}
        />
      </div>

      {/* Horas vistas */}
      <StatCard
        icon={Clock}
        label="Horas vistas estimadas"
        value={`${totalHours}h ${remMinutes}min`}
        sub={
          <span className="text-xs text-muted-foreground">
            {totalMinutes} minutos en total
          </span>
        }
        delay={0.15}
      />

      {/* Puntuación media */}
      {rated.length > 0 && (
        <StatCard
          icon={Star}
          label="Puntuación media"
          value={avgRating.toFixed(1)}
          sub={
            <div className="flex items-center gap-1.5">
              <StarRow count={Math.round(avgRating)} />
              <span className="text-xs text-muted-foreground">
                sobre {rated.length} valorados
              </span>
            </div>
          }
          delay={0.2}
        />
      )}

      {/* Mejor valorado */}
      {best && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="bg-card card-shadow rounded-2xl p-4 flex items-center gap-3"
          data-ocid="stats.best"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-none mb-1">
              Mejor valorado
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {best.title}
            </p>
            <StarRow count={Number(best.rating)} />
          </div>
          {best.posterUrl && (
            <img
              src={best.posterUrl}
              alt={best.title}
              className="w-10 h-14 object-cover rounded-lg shrink-0"
            />
          )}
        </motion.div>
      )}

      {/* Peor valorado (only show if different from best) */}
      {worst && best && worst.id !== best.id && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="bg-card card-shadow rounded-2xl p-4 flex items-center gap-3"
          data-ocid="stats.worst"
        >
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <TrendingDown size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-none mb-1">
              Peor valorado
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {worst.title}
            </p>
            <StarRow count={Number(worst.rating)} />
          </div>
          {worst.posterUrl && (
            <img
              src={worst.posterUrl}
              alt={worst.title}
              className="w-10 h-14 object-cover rounded-lg shrink-0"
            />
          )}
        </motion.div>
      )}

      {/* Distribución Películas vs Series */}
      {pieData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.35 }}
          className="bg-card card-shadow rounded-2xl p-4"
          data-ocid="stats.typechart"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Tv size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide leading-none">
                Películas vs Series
              </p>
              <p className="text-sm font-semibold text-foreground">
                {moviesCount} películas · {seriesCount} series
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.015 60)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2">
              {pieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                    }}
                  />
                  <span className="text-sm text-foreground font-medium">
                    {entry.name}
                  </span>
                  <span className="text-sm text-muted-foreground ml-auto pl-2">
                    {entry.value}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground mt-1">
                Total: {items.length} títulos
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="h-4" />
    </div>
  );
}
