import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Heart, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ChatMessage } from "../backend.d";
import {
  useCreateChatMessage,
  useGetAllChatMessages,
  useGetLastUpdated,
} from "../hooks/useQueries";

function formatTime(timestamp: bigint): string {
  // Backend timestamp is in nanoseconds
  const ms = Number(timestamp / 1_000_000n);
  const date = new Date(ms);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: ChatMessage;
  isOwn: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 max-w-[78%] ${isOwn ? "items-end self-end" : "items-start self-start"}`}
    >
      <span className="text-[10px] font-semibold text-muted-foreground px-1">
        {message.senderName}
      </span>
      <div
        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-card border border-border text-foreground rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
      <span className="text-[9px] text-muted-foreground px-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}

export default function ChatTab() {
  const { identity } = useInternetIdentity();
  const { data: lastUpdated } = useGetLastUpdated();
  const { data: messages, isLoading } = useGetAllChatMessages(lastUpdated);
  const createMessage = useCreateChatMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const myPrincipal = identity?.getPrincipal().toText();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;
    setInput("");
    try {
      await createMessage.mutateAsync(content);
    } catch {
      toast.error("No se pudo enviar el mensaje. Inténtalo de nuevo.");
      setInput(content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sorted = messages
    ? [...messages].sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
    : [];

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      {/* Header */}
      <div className="bg-card border-b border-border/50 px-4 py-3 flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
          <Heart size={16} className="text-primary" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-foreground">
            Chat privado
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Solo para vosotros dos 💌
          </p>
        </div>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide"
        data-ocid="chat.messages-list"
      >
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {(["left-2/3", "right-1/2", "left-3/4", "right-2/5"] as const).map(
              (side) => (
                <div
                  key={side}
                  className={`flex ${side.startsWith("left") ? "justify-start" : "justify-end"}`}
                >
                  <Skeleton
                    className={`h-10 rounded-2xl ${side.startsWith("left") ? "w-2/3" : "w-1/2"}`}
                  />
                </div>
              ),
            )}
          </div>
        ) : sorted.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3 text-center px-6"
            data-ocid="chat.empty-state"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart size={28} className="text-primary" fill="currentColor" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Aún no hay mensajes.
              <br />
              ¡Escribe algo a tu pareja! 💌
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((msg) => (
              <MessageBubble
                key={msg.id.toString()}
                message={msg}
                isOwn={msg.sender.toText() === myPrincipal}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="bg-card border-t border-border/50 px-3 py-3 shrink-0 safe-bottom">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full bg-background border-border text-sm h-10"
            data-ocid="chat.message-input"
            maxLength={500}
            disabled={createMessage.isPending}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || createMessage.isPending}
            size="icon"
            className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            data-ocid="chat.send-button"
            aria-label="Enviar mensaje"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
