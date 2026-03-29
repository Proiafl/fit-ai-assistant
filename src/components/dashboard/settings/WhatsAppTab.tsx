import { useState, useEffect } from "react";
import { Save, MessageCircle, ExternalLink, Copy, CheckCircle2, AlertCircle, Loader2, Shield, Zap, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const WEBHOOK_URL = "https://veassqgbyrupvxuyplur.supabase.co/functions/v1/whatsapp-webhook";

const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
      <span className="text-sm font-bold text-primary">{number}</span>
    </div>
    <div className="flex-1 pb-6 border-b border-border/50 last:border-0">
      <p className="font-medium text-sm mb-2">{title}</p>
      <div className="text-sm text-muted-foreground space-y-1">{children}</div>
    </div>
  </div>
);

const WhatsAppTab = () => {
  const queryClient = useQueryClient();
  const [gymId, setGymId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [form, setForm] = useState({
    twilio_account_sid: "",
    twilio_auth_token: "",
    twilio_phone_number: "",
  });

  const { data: gymData } = useQuery({
    queryKey: ["gym_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gyms").select("id").single();
      if (error) throw error;
      return data;
    },
  });

  const { data: wpConfig, isLoading } = useQuery({
    queryKey: ["whatsapp_config"],
    enabled: !!gymData?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("whatsapp_config")
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
    if (wpConfig) {
      setConfigId(wpConfig.id);
      setForm({
        twilio_account_sid: wpConfig.twilio_account_sid || "",
        twilio_auth_token: wpConfig.twilio_auth_token || "",
        twilio_phone_number: wpConfig.twilio_phone_number || "",
      });
    }
  }, [wpConfig]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        gym_id: gymId,
        is_connected: !!(form.twilio_account_sid && form.twilio_phone_number),
        connected_at: form.twilio_account_sid ? new Date().toISOString() : null,
      };
      if (configId) {
        const { error } = await supabase.from("whatsapp_config").update(payload).eq("id", configId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("whatsapp_config").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Configuración de WhatsApp guardada");
      queryClient.invalidateQueries({ queryKey: ["whatsapp_config"] });
    },
    onError: () => toast.error("Error al guardar la configuración"),
  });

  const copyWebhook = () => {
    navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    toast.success("URL copiada al portapapeles");
    setTimeout(() => setCopied(false), 3000);
  };

  const isConnected = wpConfig?.is_connected && wpConfig?.twilio_phone_number;

  if (isLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Status Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isConnected
          ? "bg-green-500/10 border-green-500/30 text-green-400"
          : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
        {isConnected
          ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
        <div>
          <p className="font-semibold text-sm">
            {isConnected ? "Agente conectado a WhatsApp" : "WhatsApp no configurado"}
          </p>
          <p className="text-xs opacity-80">
            {isConnected
              ? `Número activo: ${wpConfig?.twilio_phone_number}`
              : "Sigue los pasos a continuación para activar el agente de IA"}
          </p>
        </div>
      </div>

      {/* MVP Notice */}
      <div className="flex gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-300">
          <p className="font-semibold mb-1">Modo MVP — Número Twilio Sandbox</p>
          <p className="text-xs opacity-80 leading-relaxed">
            En esta versión, el agente responde desde un número de Twilio (no el tuyo propio).
            Tus clientes deben primero enviar <strong className="text-blue-200">"join [código]"</strong> al número de Twilio para unirse al sandbox.
            Próximamente: conexión con tu número real de WhatsApp Business.
          </p>
        </div>
      </div>

      {/* Step-by-step Guide */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Zap className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Guía de Configuración (Twilio Sandbox)</h3>
        </div>
        <div className="space-y-0">
          <Step number={1} title="Crear cuenta gratuita en Twilio">
            <p>Visita <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1">
              twilio.com/try-twilio <ExternalLink className="w-3 h-3" />
            </a> y registrate gratis.</p>
            <p>No se requiere tarjeta de crédito para el sandbox de WhatsApp.</p>
          </Step>

          <Step number={2} title="Activar el Sandbox de WhatsApp">
            <p>Dentro de tu consola de Twilio, ve a:</p>
            <p className="font-mono text-xs bg-secondary px-2 py-1 rounded mt-1 inline-block">
              Messaging → Try it out → Send a WhatsApp message
            </p>
            <p className="mt-2">Sigue las instrucciones para activar el sandbox. Te darán un número y un código de unión.</p>
          </Step>

          <Step number={3} title="Obtener tus credenciales de Twilio">
            <p>En tu <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1">
              consola de Twilio <ExternalLink className="w-3 h-3" />
            </a>, busca en la pantalla principal:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Account SID</strong> — empieza con <span className="font-mono text-xs">AC...</span></li>
              <li><strong>Auth Token</strong> — haz click en el ícono del ojo para verlo</li>
              <li><strong>Número WhatsApp</strong> — el sandbox usa el número <span className="font-mono text-xs">+14155238886</span></li>
            </ul>
          </Step>

          <Step number={4} title="Configurar el Webhook en Twilio">
            <p>En Twilio, ve al sandbox de WhatsApp y en el campo <strong>"When a message comes in"</strong>, pega esta URL:</p>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 text-xs bg-secondary px-3 py-2 rounded-lg font-mono break-all">{WEBHOOK_URL}</code>
              <Button size="sm" variant="outline" onClick={copyWebhook}>
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="mt-2">Asegúrate que el método sea <strong>HTTP POST</strong> y guarda los cambios en Twilio.</p>
          </Step>

          <Step number={5} title="Ingresa tus credenciales aquí abajo y guarda">
            <p>Completa el formulario de abajo con tu Account SID, Auth Token y número de Twilio.</p>
          </Step>
        </div>
      </div>

      {/* Credentials Form */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Credenciales de Twilio</h3>
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="w-3 h-3" /> Almacenadas de forma segura
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accountSid">Account SID</Label>
            <Input
              id="accountSid"
              value={form.twilio_account_sid}
              onChange={(e) => setForm({ ...form, twilio_account_sid: e.target.value })}
              className="bg-secondary border-border font-mono text-sm"
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="authToken">Auth Token</Label>
            <div className="relative">
              <Input
                id="authToken"
                type={showToken ? "text" : "password"}
                value={form.twilio_auth_token}
                onChange={(e) => setForm({ ...form, twilio_auth_token: e.target.value })}
                className="bg-secondary border-border font-mono text-sm pr-24"
                placeholder="••••••••••••••••••••••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                {showToken ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Este token se guarda cifrado y nunca se muestra en la interfaz una vez guardado.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twilioNumber">Número de WhatsApp (Twilio)</Label>
            <Input
              id="twilioNumber"
              value={form.twilio_phone_number}
              onChange={(e) => setForm({ ...form, twilio_phone_number: e.target.value })}
              className="bg-secondary border-border font-mono text-sm"
              placeholder="+14155238886"
            />
            <p className="text-xs text-muted-foreground">
              Formato con código de país. El sandbox de Twilio usa <span className="font-mono">+14155238886</span>
            </p>
          </div>
        </div>

        {/* Sandbox tip */}
        <div className="flex gap-3 p-3 rounded-lg bg-secondary/60 border border-border">
          <MessageCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Para clientes del sandbox:</strong> cada usuario que quiera hablar con el agente debe primero enviar el mensaje{" "}
            <span className="font-mono text-primary">join [tu-código]</span> al número de Twilio para activar la conexión.
            Twilio te provee este código cuando activas el sandbox.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground">
          {saveMutation.isPending
            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            : <Save className="w-4 h-4 mr-2" />}
          Guardar Configuración de WhatsApp
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppTab;
