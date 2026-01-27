import { useState } from "react";
import { Save, Building2, Clock, MapPin, Link, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const SettingsTab = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState({
    gymName: "Gym Fitness Pro",
    address: "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
    timezone: "America/Mexico_City",
    openingTime: "06:00",
    closingTime: "22:00",
    webhookUrl: "",
  });

  const [plans, setPlans] = useState(["Básico", "Premium", "VIP"]);
  const [classes, setClasses] = useState(["Spinning", "Yoga", "CrossFit", "Zumba", "HIIT", "Pilates"]);
  const [newPlan, setNewPlan] = useState("");
  const [newClass, setNewClass] = useState("");

  const handleSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Los cambios se han aplicado correctamente.",
    });
  };

  const addPlan = () => {
    if (newPlan.trim() && !plans.includes(newPlan.trim())) {
      setPlans([...plans, newPlan.trim()]);
      setNewPlan("");
    }
  };

  const removePlan = (plan: string) => {
    setPlans(plans.filter((p) => p !== plan));
  };

  const addClass = () => {
    if (newClass.trim() && !classes.includes(newClass.trim())) {
      setClasses([...classes, newClass.trim()]);
      setNewClass("");
    }
  };

  const removeClass = (cls: string) => {
    setClasses(classes.filter((c) => c !== cls));
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Gym Info */}
      <div className="card-fitness space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Información del Gimnasio</h3>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="gymName">Nombre del gimnasio</Label>
            <Input
              id="gymName"
              value={config.gymName}
              onChange={(e) => setConfig({ ...config, gymName: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                id="address"
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                className="pl-10 bg-secondary border-border min-h-[80px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="card-fitness space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Horarios</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openingTime">Hora de apertura</Label>
            <Input
              id="openingTime"
              type="time"
              value={config.openingTime}
              onChange={(e) => setConfig({ ...config, openingTime: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closingTime">Hora de cierre</Label>
            <Input
              id="closingTime"
              type="time"
              value={config.closingTime}
              onChange={(e) => setConfig({ ...config, closingTime: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="card-fitness space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3 className="text-lg font-semibold">Planes Disponibles</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {plans.map((plan) => (
            <span
              key={plan}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {plan}
              <button
                onClick={() => removePlan(plan)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Nuevo plan..."
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPlan()}
            className="bg-secondary border-border"
          />
          <Button onClick={addPlan} variant="outline" className="border-border">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Classes */}
      <div className="card-fitness space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3 className="text-lg font-semibold">Clases Disponibles</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {classes.map((cls) => (
            <span
              key={cls}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground border border-border"
            >
              {cls}
              <button
                onClick={() => removeClass(cls)}
                className="hover:bg-muted rounded-full p-0.5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Nueva clase..."
            value={newClass}
            onChange={(e) => setNewClass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addClass()}
            className="bg-secondary border-border"
          />
          <Button onClick={addClass} variant="outline" className="border-border">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Webhook */}
      <div className="card-fitness space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Link className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Integración WhatsApp</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookUrl">URL del Webhook (Twilio)</Label>
          <Input
            id="webhookUrl"
            placeholder="https://tu-proyecto.supabase.co/functions/v1/twilio-webhook"
            value={config.webhookUrl}
            onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            className="bg-secondary border-border"
          />
          <p className="text-sm text-muted-foreground">
            Configura esta URL en tu cuenta de Twilio para recibir mensajes de WhatsApp.
          </p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
