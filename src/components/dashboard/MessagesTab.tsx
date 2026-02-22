import { useState, useEffect } from "react";
import { Search, Send, Phone, MoreVertical, Loader2, ShieldAlert, ShieldCheck, Timer } from "lucide-react";
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

const MessagesTab = () => {
  const queryClient = useQueryClient();
  const { security, validateMessage } = useSecurity();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: () => fetchMessages(selectedChatId!),
    enabled: !!selectedChatId,
  });

  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedChatId) {
      setSelectedChatId(conversations[0].id);
    }
  }, [conversations, selectedChatId]);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Security validation before sending
      const check = validateMessage(content);
      if (!check.safe) {
        throw new Error(check.message || 'Mensaje bloqueado por seguridad.');
      }

      const { error } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: selectedChatId,
            content: check.sanitized!, // Use sanitized version
            sender_type: "admin",
          },
        ]);
      if (error) throw error;

      // Update last message in conversation
      await supabase
        .from("conversations")
        .update({
          last_message: check.sanitized,
          last_message_time: new Date().toISOString()
        })
        .eq("id", selectedChatId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setNewMessage("");
    },
  });

  const filteredChats = conversations?.filter(
    (chat) =>
      chat.members?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.members?.phone.includes(searchTerm)
  ) || [];

  const selectedChat = conversations?.find(c => c.id === selectedChatId);

  if (loadingConvs) {
    return (
      <div className="flex h-[calc(100vh-180px)] items-center justify-center bg-card rounded-2xl border border-border">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-180px)] bg-card rounded-2xl border border-border overflow-hidden">
      {/* Chat list */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversación..."
              className="pl-10 bg-secondary border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${selectedChatId === chat.id ? "bg-secondary" : ""
                }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold">
                  {chat.members?.full_name.split(" ").map((n: string) => n[0]).join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{chat.members?.full_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {chat.last_message_time ? new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{chat.last_message || "Sin mensajes"}</p>
              </div>
            </button>
          ))}
          {filteredChats.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay conversaciones.
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {selectedChat.members?.full_name.split(" ").map((n: string) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{selectedChat.members?.full_name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedChat.members?.phone}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type !== 'user' ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${message.sender_type !== 'user'
                          ? "chat-bubble-outbound"
                          : "chat-bubble-inbound"
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${message.sender_type !== 'user'
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                            }`}
                        >
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t border-border">
              {/* Security block banner */}
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
                  placeholder={security.isBlocked ? `Bloqueado — ${Math.ceil(security.minutesRemaining)} min restantes` : "Escribe un mensaje..."}
                  className={`flex-1 bg-secondary border-border ${security.isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <p>Selecciona una conversación para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
