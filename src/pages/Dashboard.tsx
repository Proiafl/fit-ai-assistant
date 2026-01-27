import { useState } from "react";
import { 
  MessageSquare, 
  Users, 
  CreditCard, 
  Calendar, 
  Receipt, 
  Settings,
  Zap,
  LogOut,
  Bell,
  Menu,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MessagesTab from "@/components/dashboard/MessagesTab";
import MembersTab from "@/components/dashboard/MembersTab";
import MembershipsTab from "@/components/dashboard/MembershipsTab";
import ClassesTab from "@/components/dashboard/ClassesTab";
import PaymentsTab from "@/components/dashboard/PaymentsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("messages");

  const tabs = [
    { id: "messages", label: "Mensajes", icon: MessageSquare },
    { id: "members", label: "Miembros", icon: Users },
    { id: "memberships", label: "Membresías", icon: CreditCard },
    { id: "classes", label: "Clases", icon: Calendar },
    { id: "payments", label: "Pagos", icon: Receipt },
    { id: "settings", label: "Configuración", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Fit IA</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">GP</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">Gym Fitness Pro</p>
                <p className="text-sm text-muted-foreground truncate">admin@gym.com</p>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold capitalize">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona tu gimnasio con Fit IA
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Tab content */}
        <div className="p-6 animate-fade-in">
          {activeTab === "messages" && <MessagesTab />}
          {activeTab === "members" && <MembersTab />}
          {activeTab === "memberships" && <MembershipsTab />}
          {activeTab === "classes" && <ClassesTab />}
          {activeTab === "payments" && <PaymentsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
