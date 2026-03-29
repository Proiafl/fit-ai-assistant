import { useState, useEffect, useRef } from "react";
import { Search, Send, Phone, MoreVertical, Loader2, ShieldAlert, ShieldCheck, Timer, MessageCircle, Bot, BotOff, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useSecurity } from "@/hooks/useSecurity";

const fetchConversations = async () => {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      members (
        full_name,
        phone
      )
    `)
    .order("last_message_time", { ascending: false });

  if (error) throw error;
  return data;
};

const fetchMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

/** Display name for a conversation: member name OR whatsapp phone OR platform */
function getContactName(chat: any): string {
  if (chat.members?.full_name) return chat.members.full_name;
  if (chat.whatsapp_phone) return chat.whatsapp_phone;
  if (chat.external_id) return chat.external_id;
  return "Contacto desconocido";
}

/** Initials for avatar */
function getInitials(name: string): string {
  if (!name) return "?";
  // If it's a phone number show just 📱
  if (name.startsWith("+")) return "📱";
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

/** Sub-label: phone or whatsapp number */
function getContactSub(chat: any): string {
  if (chat.members?.phone) return chat.members.phone;
  if (chat.whatsapp_phone && chat.members?.full_name) return `WhatsApp: ${chat.whatsapp_phone}`;
  if (chat.whatsapp_phone) return "WhatsApp";
  return chat.platform || "";
}

const MessagesTab = () => {
  const queryClient = useQueryClient();
  const { security, validateMessage } = useSecurity();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: () => fetchMessages(selectedChatId!),
    enabled: !!selectedChatId,
    refetchInterval: 5000, // poll every 5s for new messages
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedChatId) {
      setSelectedChatId(conversations[0].id);
    }
  }, [conversations, selectedChatId]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle AI agent on/off for a conversation
  const toggleAIMutation = useMutation({
    mutationFn: async ({ id, aiEnabled, humanTakeover }: { id: string; aiEnabled: boolean; humanTakeover: boolean }) => {
      const { error } = await supabase
        .from("conversations")
        .update({
          ai_enabled: aiEnabled,
          human_takeover: humanTakeover,
          human_takeover_at: humanTakeover ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (vars.humanTakeover) {
        toast.success("IA pausada — ahora estás respondiendo tú", { icon: "👤" });
      } else {
        toast.success("IA reactivada — el agente vuelve a responder", { icon: "🤖" });
      }
    },
    onError: () => toast.error("Error al cambiar el modo de respuesta"),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const check = validateMessage(content);
      if (!check.safe) {
        throw new Error(check.message || "Mensaje bloqueado por seguridad.");
      }

      const { error } = await supabase
        .from("messages")
        .insert([{
          conversation_id: selectedChatId,
          content: check.sanitized!,
          sender_type: "admin",
        }]);
      if (error) throw error;

      // When admin sends a message manually, auto-enable human takeover
      const conv = conversations?.find(c => c.id === selectedChatId);
      if (conv && conv.ai_enabled && !conv.human_takeover) {
        await supabase
          .from("conversations")
          .update({
            last_message: check.sanitized,
            last_message_time: new Date().toISOString(),
            human_takeover: true,
            human_takeover_at: new Date().toISOString(),
            ai_enabled: false,
          })
          .eq("id", selectedChatId);
      } else {
        await supabase
          .from("conversations")
          .update({
            last_message: check.sanitized,
            last_message_time: new Date().toISOString(),
          })
          .eq("id", selectedChatId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setNewMessage("");
    },
  });

  // Filter: match by name, whatsapp_phone, or external_id
  const filteredChats = conversations?.filter((chat) => {
    const q = searchTerm.toLowerCase();
    if (!q) return true;
    const name = getContactName(chat).toLowerCase();
    const phone = (chat.whatsapp_phone || "").toLowerCase();
    const memberPhone = (chat.members?.phone || "").toLowerCase();
    return name.includes(q) || phone.includes(q) || memberPhone.includes(q);
  }) || [];

  const selectedChat = conversations?.find(c => c.id === selectedChatId);

  if (loadingConvs) {
    return (
      <div className="flex h-full items-center justify-center bg-card rounded-2xl border border-border" style={{ minHeight: "500px" }}>
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-card rounded-2xl border border-border overflow-hidden" style={{ height: "calc(100vh - 160px)", minHeight: "500px" }}>
      {/* Chat list */}
      <div className="w-80 border-r border-border flex flex-col flex-shrink-0">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o número..."
              className="pl-10 bg-secondary border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => {
            const name = getContactName(chat);
            const initials = getInitials(name);
            const sub = getContactSub(chat);
            const isWA = !!chat.whatsapp_phone;
            const isSelected = selectedChatId === chat.id;

            return (
              <button
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50 text-left ${isSelected ? "bg-secondary" : ""}`}
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 relative">
                  <span className="text-primary font-semibold text-sm">{initials}</span>
                  {isWA && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-3 h-3 text-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold truncate text-sm">{name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-1">
                      {chat.last_message_time
                        ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>
                  {sub && <p className="text-xs text-primary/70 mb-0.5">{sub}</p>}
                  <p className="text-xs text-muted-foreground truncate">
                    {chat.ai_enabled ? <span className="inline-flex items-center gap-1"><Bot className="w-3 h-3" />IA</span> : null}
                    {" "}{chat.last_message || "Sin mensajes"}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredChats.length === 0 && (
            <div className="p-8 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No hay conversaciones aún.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Los mensajes de WhatsApp aparecerán aquí cuando el agente reciba uno.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {getInitials(getContactName(selectedChat))}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{getContactName(selectedChat)}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedChat.whatsapp_phone || selectedChat.members?.phone || "Sin número"}
                  </p>
                </div>
              </div>

              {/* AI toggle controls */}
              <div className="flex items-center gap-2">
                {/* Status badge */}
                <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  selectedChat.human_takeover || !selectedChat.ai_enabled
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    : "bg-primary/15 text-primary border border-primary/30"
                }`}>
                  {selectedChat.human_takeover || !selectedChat.ai_enabled
                    ? <><UserCheck className="w-3 h-3" /> Tú respondiendo</>
                    : <><Bot className="w-3 h-3" /> IA activa</>}
                </span>

                {/* Toggle button */}
                {selectedChat.human_takeover || !selectedChat.ai_enabled ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                    disabled={toggleAIMutation.isPending}
                    onClick={() => toggleAIMutation.mutate({
                      id: selectedChat.id,
                      aiEnabled: true,
                      humanTakeover: false,
                    })}
                  >
                    <Bot className="w-4 h-4" />
                    Reactivar IA
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    disabled={toggleAIMutation.isPending}
                    onClick={() => toggleAIMutation.mutate({
                      id: selectedChat.id,
                      aiEnabled: false,
                      humanTakeover: true,
                    })}
                  >
                    <BotOff className="w-4 h-4" />
                    Pausar IA
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages && messages.length > 0 ? (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type !== "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[70%] ${message.sender_type !== "user" ? "chat-bubble-outbound" : "chat-bubble-inbound"}`}>
                        {message.sender_type === "ai" && (
                          <p className="text-xs opacity-60 mb-1 flex items-center gap-1">
                            <Bot className="w-3 h-3" /> Agente IA
                          </p>
                        )}
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.sender_type !== "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Sin mensajes en esta conversación</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-border flex-shrink-0">
              {security.isBlocked && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-destructive">Chat bloqueado por seguridad</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Timer className="w-3 h-3" />
                      Disponible en {Math.ceil(security.minutesRemaining)} minutos
                    </p>
                  </div>
                </div>
              )}
              {!security.isBlocked && (
                <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                  <span>Mensajes protegidos contra inyección</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Input
                  placeholder={security.isBlocked ? `Bloqueado — ${Math.ceil(security.minutesRemaining)} min` : "Escribe un mensaje como admin..."}
                  className={`flex-1 bg-secondary border-border ${security.isBlocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendMessageMutation.isPending || security.isBlocked}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newMessage.trim() && !security.isBlocked) {
                      sendMessageMutation.mutate(newMessage);
                    }
                  }}
                />
                <Button
                  onClick={() => newMessage.trim() && !security.isBlocked && sendMessageMutation.mutate(newMessage)}
                  disabled={sendMessageMutation.isPending || !newMessage.trim() || security.isBlocked}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {security.isBlocked ? <ShieldAlert className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
            <p>Selecciona una conversación para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
