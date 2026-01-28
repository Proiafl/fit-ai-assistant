import { useState } from "react";
import { Plus, Users, Check, Star, Loader2, DollarSign, ListChecks, X, Edit2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PLAN_GRADIENTS = [
  "from-primary to-emerald-600",
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-orange-500 to-red-600",
];

const fetchPlans = async () => {
  const { data, error } = await supabase
    .from("membership_plans")
    .select(`
      *,
      members (
        id,
        status
      )
    `);

  if (error) throw error;

  const basePlans = data.map(plan => ({
    ...plan,
    activeMembers: plan.members?.filter((m: any) => m.status === 'active').length || 0,
    benefits: plan.features || []
  }));

  const maxActive = Math.max(...basePlans.map(p => p.activeMembers));

  return basePlans.map((plan, index) => ({
    ...plan,
    color: PLAN_GRADIENTS[index % PLAN_GRADIENTS.length],
    popular: maxActive > 0 ? plan.activeMembers === maxActive : false,
  }));
};

const MembershipsTab = () => {
  const queryClient = useQueryClient();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const [planForm, setPlanForm] = useState({
    name: "",
    price: "",
    features_text: ""
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ["membership_plans"],
    queryFn: fetchPlans,
  });

  const selectedPlan = plans?.find(p => p.id === selectedPlanId);

  // Mutations
  const addPlanMutation = useMutation({
    mutationFn: async () => {
      const features = planForm.features_text.split("\n").filter(f => f.trim() !== "");
      const { error } = await supabase.from("membership_plans").insert([{
        name: planForm.name,
        price: parseFloat(planForm.price),
        features: features
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership_plans"] });
      toast.success("Plan creado correctamente");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const updatePlanMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlanId) return;
      const features = planForm.features_text.split("\n").filter(f => f.trim() !== "");
      const { error } = await supabase.from("membership_plans").update({
        name: planForm.name,
        price: parseFloat(planForm.price),
        features: features
      }).eq("id", selectedPlanId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership_plans"] });
      toast.success("Plan actualizado correctamente");
      setIsEditDialogOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("membership_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["membership_plans"] });
      toast.success("Plan eliminado");
      setIsDeleteDialogOpen(false);
      if (selectedPlanId === planToDelete) setSelectedPlanId(null);
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const resetForm = () => {
    setPlanForm({ name: "", price: "", features_text: "" });
  };

  const handleEditOpen = () => {
    if (selectedPlan) {
      setPlanForm({
        name: selectedPlan.name,
        price: selectedPlan.price.toString(),
        features_text: selectedPlan.benefits.join("\n")
      });
      setIsEditDialogOpen(true);
    } else {
      toast.error("Selecciona un plan para editar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Cargando planes...</p>
      </div>
    );
  }

  const totalMRR = plans?.reduce((sum, p) => sum + (p.price * p.activeMembers), 0) || 0;
  const totalMembers = plans?.reduce((sum, p) => sum + p.activeMembers, 0) || 0;
  const avgTicket = totalMembers > 0 ? Math.round(totalMRR / totalMembers) : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Planes de Membresía</h2>
          <p className="text-muted-foreground">Gestiona los planes disponibles para tus miembros</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={handleEditOpen}
            disabled={!selectedPlanId}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Editar Plan
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-bold">
                  <Plus className="w-5 h-5 text-primary" />
                  Crear Nuevo Plan
                </DialogTitle>
              </DialogHeader>
              <PlanFormFields form={planForm} setForm={setPlanForm} />
              <DialogFooter>
                <Button
                  onClick={() => addPlanMutation.mutate()}
                  disabled={addPlanMutation.isPending || !planForm.name || !planForm.price}
                  className="w-full bg-primary"
                >
                  {addPlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Guardar Plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Membership cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans?.map((membership) => (
          <div
            key={membership.id}
            onClick={() => setSelectedPlanId(membership.id)}
            className={`group relative rounded-2xl border-2 overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.02] ${selectedPlanId === membership.id
              ? "border-primary shadow-[0_0_20px_rgba(34,197,94,0.3)] bg-primary/5"
              : "border-border"
              }`}
          >
            {/* Delete button (X) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlanToDelete(membership.id);
                setIsDeleteDialogOpen(true);
              }}
              className="absolute -top-1 -right-1 z-20 p-1.5 bg-red-500 text-white rounded-bl-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>

            {membership.popular && (
              <div className="absolute top-4 right-6 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 z-10">
                <Star className="w-3 h-3" />
                Popular
              </div>
            )}

            {/* Header gradient */}
            <div className={`h-24 bg-gradient-to-br ${membership.color} p-6`}>
              <h3 className="text-2xl font-bold text-white">{membership.name}</h3>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <span className="text-3xl font-bold">${membership.price.toLocaleString()}</span>
                <span className="text-muted-foreground">/mes</span>
              </div>

              <ul className="space-y-3 mb-6 min-h-[100px]">
                {membership.benefits.map((benefit: string) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {membership.activeMembers} miembros activos
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-primary">
              <Edit2 className="w-5 h-5" />
              Editar Plan: {selectedPlan?.name}
            </DialogTitle>
          </DialogHeader>
          <PlanFormFields form={planForm} setForm={setPlanForm} />
          <DialogFooter>
            <Button
              onClick={() => updatePlanMutation.mutate()}
              disabled={updatePlanMutation.isPending || !planForm.name || !planForm.price}
              className="w-full bg-primary"
            >
              {updatePlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Actualizar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              ¿Eliminar plan?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Esta acción eliminará el plan permanentemente. Los miembros asociados quedarán sin plan asignado.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => planToDelete && deletePlanMutation.mutate(planToDelete)}
              className="flex-1"
              disabled={deletePlanMutation.isPending}
            >
              {deletePlanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar Definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Ingresos Mensuales Recurrentes (MRR)</p>
          <p className="text-3xl font-bold text-primary">${totalMRR.toLocaleString()}</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Ticket Promedio</p>
          <p className="text-3xl font-bold">${avgTicket.toLocaleString()}</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Total Miembros en Planes</p>
          <p className="text-3xl font-bold">{totalMembers}</p>
        </div>
      </div>
    </div>
  );
};

const PlanFormFields = ({ form, setForm }: any) => (
  <div className="grid gap-4 py-4">
    <div className="grid gap-2">
      <Label htmlFor="plan-name">Nombre del Plan</Label>
      <Input
        id="plan-name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Ej. Plan Familiar"
        className="bg-secondary border-border"
      />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="plan-price">Precio Mensual ($)</Label>
      <div className="relative">
        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="plan-price"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="999"
          className="pl-10 bg-secondary border-border"
        />
      </div>
    </div>
    <div className="grid gap-2">
      <Label htmlFor="plan-features">Beneficios (uno por línea)</Label>
      <div className="relative">
        <ListChecks className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Textarea
          id="plan-features"
          value={form.features_text}
          onChange={(e) => setForm({ ...form, features_text: e.target.value })}
          placeholder="Acceso 24/7&#10;Área de pesas&#10;Entrenador personal"
          className="pl-10 bg-secondary border-border min-h-[120px]"
        />
      </div>
    </div>
  </div>
);

export default MembershipsTab;
