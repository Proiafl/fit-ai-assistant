import { useState } from "react";
import { Search, Send, Phone, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data for chats
const mockChats = [
  {
    id: 1,
    name: "María García",
    phone: "+52 55 1234 5678",
    lastMessage: "Gracias, ya reservé mi clase",
    time: "10:45",
    unread: 0,
    avatar: "MG",
  },
  {
    id: 2,
    name: "Carlos López",
    phone: "+52 55 2345 6789",
    lastMessage: "¿Cuándo vence mi membresía?",
    time: "09:30",
    unread: 2,
    avatar: "CL",
  },
  {
    id: 3,
    name: "Ana Martínez",
    phone: "+52 55 3456 7890",
    lastMessage: "Quiero inscribirme al gimnasio",
    time: "Ayer",
    unread: 1,
    avatar: "AM",
  },
  {
    id: 4,
    name: "Roberto Sánchez",
    phone: "+52 55 4567 8901",
    lastMessage: "¿Tienen clases de yoga?",
    time: "Ayer",
    unread: 0,
    avatar: "RS",
  },
  {
    id: 5,
    name: "Laura Hernández",
    phone: "+52 55 5678 9012",
    lastMessage: "Perfecto, ahí estaré",
    time: "Lun",
    unread: 0,
    avatar: "LH",
  },
];

const mockMessages = [
  {
    id: 1,
    direction: "inbound",
    content: "Hola, quiero saber el horario de las clases de spinning",
    time: "10:30",
  },
  {
    id: 2,
    direction: "outbound",
    content: "¡Hola María! 🏋️ Las clases de Spinning están disponibles:\n\n🕐 Lunes, Miércoles y Viernes: 7:00 AM y 6:00 PM\n🕐 Martes y Jueves: 8:00 AM y 7:00 PM\n🕐 Sábado: 9:00 AM\n\n¿Te gustaría reservar alguna?",
    time: "10:31",
  },
  {
    id: 3,
    direction: "inbound",
    content: "Sí, quiero la de mañana a las 6 PM",
    time: "10:35",
  },
  {
    id: 4,
    direction: "outbound",
    content: "✅ ¡Listo María! Te he reservado en la clase de Spinning para mañana miércoles a las 6:00 PM con el instructor Carlos.\n\nDetalles:\n📅 Miércoles 15 de Enero\n🕕 6:00 PM\n👤 Instructor: Carlos\n📍 Sala de Spinning\n\nTe enviaré un recordatorio 2 horas antes. ¡Nos vemos! 💪",
    time: "10:35",
  },
  {
    id: 5,
    direction: "inbound",
    content: "Gracias, ya reservé mi clase",
    time: "10:45",
  },
];

const MessagesTab = () => {
  const [selectedChat, setSelectedChat] = useState(mockChats[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const filteredChats = mockChats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.phone.includes(searchTerm)
  );

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
              onClick={() => setSelectedChat(chat)}
              className={`w-full p-4 flex items-start gap-3 hover:bg-secondary/50 transition-colors border-b border-border/50 ${
                selectedChat.id === chat.id ? "bg-secondary" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-semibold">{chat.avatar}</span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold truncate">{chat.name}</span>
                  <span className="text-xs text-muted-foreground">{chat.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">{selectedChat.avatar}</span>
            </div>
            <div>
              <h3 className="font-semibold">{selectedChat.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {selectedChat.phone}
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
            {mockMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.direction === "outbound"
                      ? "chat-bubble-outbound"
                      : "chat-bubble-inbound"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.direction === "outbound"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {message.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Message input */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-secondary border-border"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newMessage.trim()) {
                  // TODO: Send message
                  setNewMessage("");
                }
              }}
            />
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesTab;
