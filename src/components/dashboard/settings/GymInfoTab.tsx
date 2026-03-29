import { useState, useEffect } from "react";
import { Save, Building2, Clock, MapPin, Phone, Instagram, MessageCircle, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const GymInfoTab = () => {
  const queryClient = useQueryClient();
  const [gymId, setGymId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    gymName: "",
    address: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    website: "",
    openingTime: "06:00",
    closingTime: "22:00",
  });

  const { data: gymData, isLoading } = useQuery({
    queryKey: ["gym_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gyms").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (gymData) {
      setGymId(gymData.id);
      const s = gymData.settings || {};
      setConfig({
        gymName: gymData.name || "",
        address: gymData.address || "",
        phone: s.phone || "",
        whatsapp: s.whatsapp || "",
        instagram: s.instagram || "",
        website: s.website || "",
        openingTime: s.openingTime || "06:00",
        closingTime: s.closingTime || "22:00",
      });
    }
  }, [gymData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentSettings = gymData?.settings || {};
      const { error } = await supabase
        .from("gyms")
        .update({
          name: config.gymName,
          address: config.address,
          settings: {
            ...currentSettings,
            phone: config.phone,
            whatsapp: config.whatsapp,
            instagram: config.instagram,
            website: config.website,
            openingTime: config.openingTime,
            closingTime: config.closingTime,
          },
        })
        .eq("id", gymId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Información guardada correctamente");
      queryClient.invalidateQueries({ queryKey: ["gym_settings"] });
    },
    onError: () => toast.error("Error al guardar"),
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
      {/* Gym Info */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Datos del Gimnasio</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gymName">Nombre del gimnasio</Label>
            <Input
              id="gymName"
              value={config.gymName}
              onChange={(e) => setConfig({ ...config, gymName: e.target.value })}
              className="bg-secondary border-border"
              placeholder="Ej: Fitness Pro Club"
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
                placeholder="Calle, número, ciudad"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Phone className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Contacto y Redes Sociales</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="phone" value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                className="pl-10 bg-secondary border-border" placeholder="+54 9 11 1234-5678" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="whatsapp" value={config.whatsapp}
                onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                className="pl-10 bg-secondary border-border" placeholder="+54 9 11 1234-5678" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="instagram" value={config.instagram}
                onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                className="pl-10 bg-secondary border-border" placeholder="@migym" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Sitio Web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="website" value={config.website}
                onChange={(e) => setConfig({ ...config, website: e.target.value })}
                className="pl-10 bg-secondary border-border" placeholder="https://migym.com" />
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="card-fitness space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold">Horarios de Atención</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openingTime">Hora de apertura</Label>
            <Input id="openingTime" type="time" value={config.openingTime}
              onChange={(e) => setConfig({ ...config, openingTime: e.target.value })}
              className="bg-secondary border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closingTime">Hora de cierre</Label>
            <Input id="closingTime" type="time" value={config.closingTime}
              onChange={(e) => setConfig({ ...config, closingTime: e.target.value })}
              className="bg-secondary border-border" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-primary text-primary-foreground">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};

export default GymInfoTab;
