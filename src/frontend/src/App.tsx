import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Camera,
  CheckCircle2,
  Download,
  Film,
  Home,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import AlbumTab from "./components/AlbumTab";
import DataTab from "./components/DataTab";
import FinishedTab from "./components/FinishedTab";
import HomeTab from "./components/HomeTab";
import LoginScreen from "./components/LoginScreen";
import MenuTab from "./components/MenuTab";
import PendingTab from "./components/PendingTab";
import WatchingTab from "./components/WatchingTab";
import WelcomeModal from "./components/WelcomeModal";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetLastUpdated } from "./hooks/useQueries";

type TabId =
  | "inicio"
  | "viendo"
  | "pendientes"
  | "menu"
  | "album"
  | "terminados"
  | "datos";

const TABS = [
  { id: "inicio" as TabId, label: "Inicio", icon: Home },
  { id: "viendo" as TabId, label: "Viendo", icon: Film },
  { id: "pendientes" as TabId, label: "Pendientes", icon: Bookmark },
  { id: "menu" as TabId, label: "Menú", icon: UtensilsCrossed },
  { id: "album" as TabId, label: "Álbum", icon: Camera },
  { id: "terminados" as TabId, label: "Terminados", icon: CheckCircle2 },
  { id: "datos" as TabId, label: "Datos", icon: Download },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("inicio");
  const [showWelcome, setShowWelcome] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();
  const lastUpdatedRef = useRef<bigint | null>(null);
  const { data: lastUpdated } = useGetLastUpdated();
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated =
    identity !== undefined && !identity.getPrincipal().isAnonymous();

  useEffect(() => {
    if (!isAuthenticated) return;
    const name1 = localStorage.getItem("partnerName1");
    if (!name1) {
      setShowWelcome(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (lastUpdated === undefined || lastUpdated === null) return;
    if (lastUpdatedRef.current === null) {
      lastUpdatedRef.current = lastUpdated;
      return;
    }
    if (lastUpdated !== lastUpdatedRef.current) {
      lastUpdatedRef.current = lastUpdated;
      setIsSyncing(true);
      queryClient.invalidateQueries({ queryKey: ["watchItems"] });
      queryClient.invalidateQueries({ queryKey: ["pendingItems"] });
      queryClient.invalidateQueries({ queryKey: ["todaysMenu"] });
      queryClient.invalidateQueries({ queryKey: ["mealMenus"] });
      queryClient.invalidateQueries({ queryKey: ["albumEntries"] });
      setTimeout(() => setIsSyncing(false), 1500);
    }
  }, [lastUpdated, queryClient]);

  // Show full-screen spinner only while initializing AND not yet determined
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <Toaster position="top-center" richColors />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-[430px] relative flex flex-col min-h-screen">
        {/* Sync indicator */}
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full shadow-md"
            >
              🔄 Sincronizando...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === "inicio" && (
              <motion.div
                key="inicio"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <HomeTab onTabChange={setActiveTab} />
              </motion.div>
            )}
            {activeTab === "viendo" && (
              <motion.div
                key="viendo"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <WatchingTab />
              </motion.div>
            )}
            {activeTab === "pendientes" && (
              <motion.div
                key="pendientes"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <PendingTab />
              </motion.div>
            )}
            {activeTab === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <MenuTab />
              </motion.div>
            )}
            {activeTab === "album" && (
              <motion.div
                key="album"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <AlbumTab />
              </motion.div>
            )}
            {activeTab === "terminados" && (
              <motion.div
                key="terminados"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <FinishedTab />
              </motion.div>
            )}
            {activeTab === "datos" && (
              <motion.div
                key="datos"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <DataTab />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Bottom tab navigation */}
        <nav
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] tab-bar-bg border-t border-border/50 safe-bottom z-40"
          data-ocid="nav.tab"
        >
          <div className="flex items-center justify-around h-16">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  data-ocid={`nav.${tab.id}.link`}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all"
                  aria-label={tab.label}
                >
                  <Icon
                    size={17}
                    className={
                      isActive ? "text-primary" : "text-muted-foreground"
                    }
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  <span
                    className={`text-[8px] font-medium ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-tab-dot"
                      className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Welcome Modal */}
        <WelcomeModal
          open={showWelcome}
          onClose={() => setShowWelcome(false)}
        />

        <Toaster position="top-center" richColors />
      </div>
    </div>
  );
}
