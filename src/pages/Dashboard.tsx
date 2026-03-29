import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Users, CreditCard, Calendar,
  Receipt, Settings, Zap, LogOut, Bell, Menu,
  AlertCircle, UserX, MessageCircleWarning, X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MessagesTab from "@/components/dashboard/MessagesTab";
import MembersTab from "@/components/dashboard/MembersTab";
import MembershipsTab from "@/components/dashboard/MembershipsTab";
import ClassesTab from "@/components/dashboard/ClassesTab";
import PaymentsTab from "@/components/dashboard/PaymentsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { useQuery } from "@tanstack/react-query";

interface Notification {
  id: string;
  type: "expiring_member" | "new_message" | "expired_member";
  title: string;
  body: string;
  time: string;
  tab?: string;
}

const useNotifications = () => {
  return useQuery<Notification[]>({
    queryKey: ["dashboard_notifications"],
    refetchInterval: 60_000,
    queryFn: async () => {
      const notes: Notification[] = [];
      const now = new Date();
      const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Get gym_id first
      const { data: gym } = await supabase.from("gyms").select("id").single();
      if (!gym) return notes;

      // 1. Members expiring in the next 7 days
      const { data: expiring } = await supabase
        .from("members")
        .select("id, full_name, membership_end_date")
        .eq("gym_id", gym.id)
        .eq("status", "active")
        .gte("membership_end_date", now.toISOString().split("T")[0])
        .lte("membership_end_date", soon.toISOString().split("T")[0])
        .limit(5);

      expiring?.forEach((m) => {
        const daysLeft = Math.ceil(
          (new Date(m.membership_end_date).getTime() - now.getTime()) / 86400000
        );
        notes.push({
          id: `exp_${m.id}`,
          type: "expiring_member",
          title: "Membresía por vencer",
          body: `${m.full_name} vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`,
          time: m.membership_end_date,
          tab: "members",
        });
      });

      // 2. Members already expired
      const { data: expired } = await supabase
        .from("members")
        .select("id, full_name, membership_end_date")
        .eq("gym_id", gym.id)
        .eq("status", "active")
        .lt("membership_end_date", now.toISOString().split("T")[0])
        .limit(3);

      expired?.forEach((m) => {
        notes.push({
          id: `expd_${m.id}`,
          type: "expired_member",
          title: "Membresía vencida",
          body: `${m.full_name} — vencida el ${new Date(m.membership_end_date).toLocaleDateString("es-AR")}`,
          time: m.membership_end_date,
          tab: "members",
        });
      });

      // 3. New WhatsApp conversations (last 24h)
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const { data: newConvs } = await supabase
        .from("conversations")
        .select("id, whatsapp_phone, last_message, last_message_time, members(full_name)")
        .eq("gym_id", gym.id)
        .gte("last_message_time", yesterday)
        .order("last_message_time", { ascending: false })
        .limit(5);

      newConvs?.forEach((c) => {
        const name = (c.members as any)?.full_name || c.whatsapp_phone || "Nuevo contacto";
        notes.push({
          id: `msg_${c.id}`,
          type: "new_message",
          title: "Mensaje de WhatsApp",
          body: `${name}: "${(c.last_message || "").substring(0, 50)}${(c.last_message || "").length > 50 ? "…" : ""}"`,
          time: c.last_message_time,
          tab: "messages",
        });
      });

      // Sort by time desc
      return notes.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    },
  });
};

const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  if (type === "expiring_member") return <AlertCircle className="w-4 h-4 text-amber-400" />;
  if (type === "expired_member") return <UserX className="w-4 h-4 text-red-400" />;
  return <MessageCircleWarning className="w-4 h-4 text-primary" />;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");
  const [user, setUser] = useState<any>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate("/auth");
      else setUser(user);
    };
    checkUser();
  }, [navigate]);

  // Close notifications dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Error al cerrar sesión");
    else { toast.success("Sesión cerrada"); navigate("/auth"); }
  };

  const tabs = [
    { id: "messages", label: "Mensajes", icon: MessageSquare },
    { id: "members", label: "Miembros", icon: Users },
    { id: "memberships", label: "Membresías", icon: CreditCard },
    { id: "classes", label: "Clases", icon: Calendar },
    { id: "payments", label: "Pagos", icon: Receipt },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full border-r border-border">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">GymIApp</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border bg-sidebar-accent/30">
            <div className="flex items-center gap-3 px-2 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/10">
                <span className="text-primary font-semibold">
                  {user?.user_metadata?.gym_name?.[0] || user?.email?.[0]?.toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate text-sm">{user?.user_metadata?.gym_name || "Mi Gimnasio"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-background/80 backdrop-blur-xl border-b border-border z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
                <p className="text-xs text-muted-foreground">Gestiona tu gimnasio con inteligencia artificial</p>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-secondary"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                    {notifications.length > 9 ? "9+" : notifications.length}
                  </span>
                )}
              </Button>

              {/* Notifications dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl shadow-black/20 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        Todo en orden, sin alertas.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors border-b border-border/50 text-left"
                          onClick={() => {
                            if (n.tab) setActiveTab(n.tab);
                            setNotifOpen(false);
                          }}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            <NotificationIcon type={n.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{n.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{n.body}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-auto p-6">
          <SubscriptionGuard>
            {activeTab === "messages" && <MessagesTab />}
            {activeTab === "members" && <MembersTab />}
            {activeTab === "memberships" && <MembershipsTab />}
            {activeTab === "classes" && <ClassesTab />}
            {activeTab === "payments" && <PaymentsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </SubscriptionGuard>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
