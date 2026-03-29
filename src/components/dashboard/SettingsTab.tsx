import { useState } from "react";
import { Building2, Bot } from "lucide-react";
import GymInfoTab from "./settings/GymInfoTab";
import AIAgentTab from "./settings/AIAgentTab";

type SettingsSection = "gym" | "agent";

const sections: { id: SettingsSection; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "gym", label: "Info del Gym", icon: Building2, desc: "Datos generales, contacto y horarios" },
  { id: "agent", label: "Agente IA", icon: Bot, desc: "Personalidad, mensajes y capacidades del bot" },
];

const SettingsTab = () => {
  const [active, setActive] = useState<SettingsSection>("gym");
  const current = sections.find((s) => s.id === active)!;

  return (
    <div className="space-y-6">
      {/* Sub-navigation pills */}
      <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${active === s.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
          >
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Section description */}
      <div className="flex items-center gap-2">
        <current.icon className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{current.desc}</p>
      </div>

      {/* Active tab content */}
      {active === "gym" && <GymInfoTab />}
      {active === "agent" && <AIAgentTab />}
    </div>
  );
};

export default SettingsTab;
