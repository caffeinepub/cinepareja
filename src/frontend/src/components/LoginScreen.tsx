import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Heart, Link2, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

function getUrlParameter(name: string): string | null {
  const url = window.location.href;
  const regex = new RegExp(`[?&&#]${name}=([^&#]*)`);
  const results = regex.exec(url);
  return results ? decodeURIComponent(results[1].replace(/\+/g, " ")) : null;
}

export default function LoginScreen() {
  const { login, isInitializing, isLoggingIn } = useInternetIdentity();
  const inviteCode = getUrlParameter("code");

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-full hero-gradient flex items-center justify-center">
              <Heart size={28} className="text-white fill-white" />
            </div>
            <div className="absolute inset-0 rounded-full hero-gradient opacity-30 animate-ping" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Cargando...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-[430px] min-h-screen flex flex-col">
        {/* Hero gradient top section */}
        <div className="hero-gradient flex-shrink-0 flex flex-col items-center justify-center pt-20 pb-16 px-6 relative overflow-hidden">
          {/* Background decorative circles */}
          <div className="absolute top-[-40px] right-[-40px] w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute bottom-[-20px] left-[-20px] w-24 h-24 rounded-full bg-white/10" />

          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.1,
            }}
            className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg"
          >
            <Heart size={44} className="text-white fill-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-4xl font-display font-bold text-white tracking-tight">
              CinePareja
            </h1>
            <p className="text-white/80 text-base mt-2 font-body">
              El espacio de los dos
            </p>
          </motion.div>
        </div>

        {/* Bottom white card section */}
        <div className="flex-1 bg-background rounded-t-3xl -mt-6 px-6 pt-8 pb-10 flex flex-col">
          <AnimatePresence>
            {inviteCode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-secondary rounded-2xl p-4 flex items-start gap-3"
                data-ocid="login.panel"
              >
                <div className="w-9 h-9 rounded-full hero-gradient flex items-center justify-center flex-shrink-0">
                  <Link2 size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Tu pareja te ha invitado
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inicia sesión para acceder al espacio compartido de
                    CinePareja
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <h2 className="text-2xl font-display font-bold text-foreground">
              {inviteCode ? "¡Bienvenido/a!" : "¡Hola!"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1.5 mb-8">
              {inviteCode
                ? "Inicia sesión para ver lo mismo que tu pareja en tiempo real."
                : "Inicia sesión para acceder a vuestra app de pareja compartida."}
            </p>

            <div className="space-y-3">
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full h-12 rounded-2xl text-base font-semibold hero-gradient border-none text-white shadow-md"
                data-ocid="login.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Heart size={18} className="mr-2 fill-white" />
                    Iniciar sesión
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground px-4">
                Usamos Internet Identity para proteger tu privacidad de forma
                segura y sin contraseñas.
              </p>
            </div>
          </motion.div>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 space-y-3"
          >
            {[
              { emoji: "🎬", text: "Seguimiento de películas y series" },
              { emoji: "📋", text: "Lista de pendientes compartida" },
              { emoji: "🍽️", text: "Planificador de menú diario" },
              { emoji: "📸", text: "Álbum de fotos por día" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-xl w-7 text-center">{f.emoji}</span>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
