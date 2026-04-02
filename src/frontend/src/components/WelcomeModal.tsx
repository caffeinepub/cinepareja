import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");

  const handleSave = () => {
    if (!name1.trim()) return;
    localStorage.setItem("partnerName1", name1.trim());
    localStorage.setItem("partnerName2", name2.trim());
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="w-[calc(100%-32px)] max-w-sm rounded-2xl"
        data-ocid="welcome.dialog"
      >
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <span className="text-5xl">💑</span>
          </div>
          <DialogTitle className="text-center text-xl font-display font-bold">
            ¡Bienvenidos a CinePareja!
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            Personaliza la app con vuestros nombres
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name1">Tu nombre</Label>
            <Input
              id="name1"
              placeholder="Ej: María"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              data-ocid="welcome.input"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name2">Nombre de tu pareja</Label>
            <Input
              id="name2"
              placeholder="Ej: Carlos"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              data-ocid="welcome.input"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <Button
            onClick={handleSave}
            className="w-full rounded-xl"
            disabled={!name1.trim()}
            data-ocid="welcome.submit_button"
          >
            💕 ¡Empezar juntos!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
