import { useState, useEffect } from "react";
import { Save, Building2, Clock, MapPin, Link, Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const SettingsTab = () => {
  const queryClient = useQueryClient();
  const [gymId, setGymId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    gymName: "",
    address: "",
    openingTime: "06:00",
    closingTime: "22:00",
    webhookUrl: "",
  });

  const [newPlan, setNewPlan] = useState("");
  const [newClass, setNewClass] = useState("");

  // 1. Fetch Gym Data
  const { data: gymData, isLoading: loadingGym } = useQuery({
    queryKey: ["gym_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gyms").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch Plans
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ["membership_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("membership_plans").select("*");
      if (error) throw error;
      return data;
    },
  });

  // 3. Fetch Classes
  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (gymData) {
      setGymId(gymData.id);
      setConfig({
        gymName: gymData.name || "",
        address: gymData.address || "",
        openingTime: gymData.settings?.openingTime || "06:00",
        closingTime: gymData.settings?.closingTime || "22:00",
        webhookUrl: gymData.settings?.webhookUrl || "",
      });
    }
  }, [gymData]);

  // Mutations
  const updateGymMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("gyms")
        .update({
          name: config.gymName,
          address: config.address,
          settings: {
            openingTime: config.openingTime,
            closingTime: config.closingTime,
            webhookUrl: config.webhookUrl,
          },
        })
        .eq("id", gymId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      queryClient.invalidateQueries({ queryKey: ["gym_settings"] });
    },
  });

  const addPlanMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("membership_plans")
        .insert([{ name, price: 0, features: [] }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership_plans"] });
      setNewPlan("");
      toast.success("Plan añadido");
    },
  });

  const removePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membership_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership_plans"] });
      toast.success("Plan eliminado");
    },
  });

  const addClassMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from("classes")
        .insert([{ name, instructor: "Coach", color: "bg-primary" }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setNewClass("");
      toast.success("Clase registrada");
    },
  });

  const removeClassMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("classes").delete().eq("name", name);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Clase eliminada");
    },
  });

  if (loadingGym || loadingPlans || loadingClasses) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const uniqueClassNames = Array.from(new Set(classesData?.map(c => c.name) || []));

  return (
    <div className="max-w-3xl space-y-8 pb-10">
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
          {plansData?.map((plan) => (
            <span
              key={plan.id}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20"
            >
              {plan.name}
              <button
                onClick={() => removePlanMutation.mutate(plan.id)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                disabled={removePlanMutation.isPending}
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
            onKeyDown={(e) => e.key === "Enter" && newPlan.trim() && addPlanMutation.mutate(newPlan.trim())}
            className="bg-secondary border-border"
          />
          <Button
            onClick={() => newPlan.trim() && addPlanMutation.mutate(newPlan.trim())}
            disabled={addPlanMutation.isPending}
            variant="outline"
          >
            {addPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Classes */}
      <div className="card-fitness space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h3 className="text-lg font-semibold">Clases Disponibles</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {uniqueClassNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-foreground border border-border"
            >
              {name}
              <button
                onClick={() => removeClassMutation.mutate(name)}
                className="hover:bg-muted rounded-full p-0.5"
                disabled={removeClassMutation.isPending}
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
            onKeyDown={(e) => e.key === "Enter" && newClass.trim() && addClassMutation.mutate(newClass.trim())}
            className="bg-secondary border-border"
          />
          <Button
            onClick={() => newClass.trim() && addClassMutation.mutate(newClass.trim())}
            disabled={addClassMutation.isPending}
            variant="outline"
          >
            {addClassMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => updateGymMutation.mutate()}
          disabled={updateGymMutation.isPending}
          className="bg-primary text-primary-foreground"
        >
          {updateGymMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
};

export default SettingsTab;
