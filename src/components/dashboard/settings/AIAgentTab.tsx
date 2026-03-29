import { useState, useEffect } from "react";
import { Save, Bot, Sparkles, MessageSquare, ListChecks, Sliders, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const RESPONSE_STYLES = [
  { value: "formal", label: "Formal" },
  { value: "amigable", label: "Amigable" },
  { value: "motivador", label: "Motivador" },
  { value: "conciso", label: "Conciso" },
];

const AIAgentTab = () => {
  const queryClient = useQueryClient();
  const [gymId, setGymId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  const [form, setForm] = useState({
    agent_name: "GymBot",
    agent_personality: "",
    welcome_message: "",
    custom_instructions: "",
    outside_hours_message: "",
    response_style: "amigable",
    use_emojis: true,
    max_response_length: 300,
    business_hours_enabled: false,
    business_hours_start: "06:00",
    business_hours_end: "22:00",
    can_check_schedules: true,
    can_check_prices: true,
    can_book_classes: false,
    can_check_payments: false,
    can_answer_general: true,
    ai_model: "gpt-4o-mini",
    temperature: 0.7,
  });

  const { data: gymData } = useQuery({
    queryKey: ["gym_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gyms").select("id").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: agentData, isLoading } = useQuery({
    queryKey: ["ai_agent_config"],
    enabled: !!gymData?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_agent_config")
        .select("*")
        .eq("gym_id", gymData!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (gymData) setGymId(gymData.id);
  }, [gymData]);

  useEffect(() => {
    if (agentData) {
      setConfigId(agentData.id);
      setForm({
        agent_name: agentData.agent_name || "GymBot",
        agent_personality: agentData.agent_personality || "",
        welcome_message: agentData.welcome_message || "",
        custom_instructions: agentData.custom_instructions || "",
        outside_hours_message: agentData.outside_hours_message || "",
        response_style: agentData.response_style || "amigable",
        use_emojis: agentData.use_emojis ?? true,
        max_response_length: agentData.max_response_length || 300,
        business_hours_enabled: agentData.business_hours_enabled ?? false,
        business_hours_start: agentData.business_hours_start || "06:00",
        business_hours_end: agentData.business_hours_end || "22:00",
        can_check_schedules: agentData.can_check_schedules ?? true,
        can_check_prices: agentData.can_check_prices ?? true,
        can_book_classes: agentData.can_book_classes ?? false,
        can_check_payments: agentData.can_check_payments ?? false,
        can_answer_general: agentData.can_answer_general ?? true,
        ai_model: agentData.ai_model || "gpt-4o-mini",
        temperature: Number(agentData.temperature) || 0.7,
      });
    }
  }, [agentData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, gym_id: gymId };
      if (configId) {
        const { error } = await supabase.from("ai_agent_config").update(payload).eq("id", configId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ai_agent_config").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configuración del agente guardada");
      queryClient.invalidateQueries({ queryKey: ["ai_agent_config"] });
    },
    onError: () => toast.error("Error al guardar la configuración"),
  });

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Identity */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Identidad del Agente</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentName">Nombre del agente</Label>
            <Input id="agentName" value={form.agent_name}
              onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
              className="bg-secondary border-border" placeholder="Ej: GymBot, Max, Asistente..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality">Personalidad</Label>
            <Textarea id="personality" value={form.agent_personality}
              onChange={(e) => setForm({ ...form, agent_personality: e.target.value })}
              className="bg-secondary border-border min-h-[100px]"
              placeholder="Eres un asistente amable, motivador y profesional de un gimnasio. Ayudas a los socios con información sobre horarios, precios y clases." />
            <p className="text-xs text-muted-foreground">Descripción base del comportamiento del bot (system prompt).</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instrucciones personalizadas</Label>
            <Textarea id="instructions" value={form.custom_instructions}
              onChange={(e) => setForm({ ...form, custom_instructions: e.target.value })}
              className="bg-secondary border-border min-h-[80px]"
              placeholder="Reglas específicas: nunca des precios sin que el usuario los pida, siempre menciona las promociones vigentes, etc." />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Mensajes Automáticos</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeMsg">Mensaje de bienvenida</Label>
            <Textarea id="welcomeMsg" value={form.welcome_message}
              onChange={(e) => setForm({ ...form, welcome_message: e.target.value })}
              className="bg-secondary border-border min-h-[100px]"
              placeholder="¡Hola! 👋 Soy GymBot, el asistente de [nombre del gym]. ¿En qué te puedo ayudar?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="awayMsg">Mensaje fuera de horario</Label>
            <Textarea id="awayMsg" value={form.outside_hours_message}
              onChange={(e) => setForm({ ...form, outside_hours_message: e.target.value })}
              className="bg-secondary border-border min-h-[100px]"
              placeholder="Estamos fuera de horario. Te responderemos cuando abra el gym. ¡Nos vemos pronto!" />
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary/50">
          <div>
            <p className="text-sm font-medium">Respetar horarios de atención</p>
            <p className="text-xs text-muted-foreground">Fuera de horario usa el mensaje de arriba en vez de la IA</p>
          </div>
          <Switch checked={form.business_hours_enabled}
            onCheckedChange={(v) => setForm({ ...form, business_hours_enabled: v })} />
        </div>

        {form.business_hours_enabled && (
          <div className="grid sm:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/30">
            <div className="space-y-2">
              <Label htmlFor="bhStart">Inicio atención</Label>
              <Input id="bhStart" type="time" value={form.business_hours_start}
                onChange={(e) => setForm({ ...form, business_hours_start: e.target.value })}
                className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bhEnd">Fin atención</Label>
              <Input id="bhEnd" type="time" value={form.business_hours_end}
                onChange={(e) => setForm({ ...form, business_hours_end: e.target.value })}
                className="bg-secondary border-border" />
            </div>
          </div>
        )}
      </div>

      {/* Capabilities */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <ListChecks className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Capacidades del Agente</h3>
          <p className="text-xs text-muted-foreground ml-auto">Qué puede responder</p>
        </div>
        <div className="space-y-3">
          {[
            { key: "can_check_schedules", label: "Informar horarios de clases", desc: "El bot puede decir los horarios disponibles" },
            { key: "can_check_prices", label: "Informar precios y planes", desc: "El bot puede compartir precios de membresías" },
            { key: "can_answer_general", label: "Responder preguntas generales", desc: "FAQs, ubicación, información del gym" },
            { key: "can_book_classes", label: "Reservar clases (avanzado)", desc: "Requiere integración adicional" },
            { key: "can_check_payments", label: "Consultar estado de pagos", desc: "Requiere integración adicional" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={form[key as keyof typeof form] as boolean}
                onCheckedChange={(v) => setForm({ ...form, [key]: v })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Model settings */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Sliders className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Parámetros del Modelo</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aiModel">Modelo IA</Label>
            <select id="aiModel" value={form.ai_model}
              onChange={(e) => setForm({ ...form, ai_model: e.target.value })}
              className="w-full h-10 px-3 rounded-md bg-secondary border border-border text-sm">
              <option value="gpt-4o-mini">GPT-4o Mini (económico)</option>
              <option value="gpt-4o">GPT-4o (más preciso)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (básico)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="temperature">Creatividad ({form.temperature})</Label>
            <input id="temperature" type="range" min="0" max="1" step="0.1"
              value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
              className="w-full accent-primary" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Preciso</span><span>Creativo</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLength">Máx. caracteres resp.</Label>
            <Input id="maxLength" type="number" min={100} max={1000} step={50}
              value={form.max_response_length}
              onChange={(e) => setForm({ ...form, max_response_length: parseInt(e.target.value) })}
              className="bg-secondary border-border" />
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary/50">
          <div>
            <p className="text-sm font-medium">Usar emojis en las respuestas</p>
            <p className="text-xs text-muted-foreground">El agente incluirá emojis para hacer los mensajes más amenos</p>
          </div>
          <Switch checked={form.use_emojis}
            onCheckedChange={(v) => setForm({ ...form, use_emojis: v })} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground">
          {saveMutation.isPending
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <Save className="w-4 h-4 mr-2" />}
          Guardar Configuración del Agente
        </Button>
      </div>
    </div>
  );
};

export default AIAgentTab;
