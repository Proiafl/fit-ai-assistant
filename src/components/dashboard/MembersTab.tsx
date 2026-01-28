import { useState } from "react";
import { Search, Plus, Mail, Phone, Calendar, MoreHorizontal, Loader2, UserPlus, Trash2, Eye, RefreshCw, AlertTriangle, User, Edit2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const fetchMembers = async () => {
  const { data, error } = await supabase
    .from("members")
    .select(`
      *,
      membership_plans (
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

const fetchPlans = async () => {
  const { data, error } = await supabase.from("membership_plans").select("id, name");
  if (error) throw error;
  return data;
};

const getMemberStatus = (startDateStr: string) => {
  const start = new Date(startDateStr);
  const expiration = new Date(start);
  expiration.setMonth(expiration.getMonth() + 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiration);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Vencido", class: "badge-expired", type: "expired" };
  if (diffDays <= 10) return { label: "Próximo a vencer", class: "bg-amber-500/20 text-amber-500 border-amber-500/20", type: "warning" };
  return { label: "Activo", class: "badge-active", type: "active" };
};

const MembersTab = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    full_name: "",
    email: "",
    phone: "",
    plan_id: "",
    status: "active" as const
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });

  const { data: plans } = useQuery({
    queryKey: ["membership_plans_simple"],
    queryFn: fetchPlans,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (member: typeof newMember) => {
      const { error } = await supabase.from("members").insert([member]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Miembro añadido correctamente");
      setIsAddDialogOpen(false);
      setNewMember({ full_name: "", email: "", phone: "", plan_id: "", status: "active" });
    }
  });

  const renewMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from("members")
        .update({ start_date: today, status: 'active' })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Membresía renovada por 1 mes");
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Miembro eliminado");
      setIsDeleteDialogOpen(false);
    }
  });

  const updateMemberPlanMutation = useMutation({
    mutationFn: async ({ id, plan_id }: { id: string, plan_id: string }) => {
      const { error } = await supabase
        .from("members")
        .update({ plan_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      toast.success("Plan actualizado correctamente");
      setIsEditPlanOpen(false);
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  const filteredMembers = members?.filter(
    (member) =>
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Cargando miembros...</p>
      </div>
    );
  }

  const totalMembers = members?.length || 0;
  const activeMembers = members?.filter(m => getMemberStatus(m.start_date).type === 'active').length || 0;
  const warningMembers = members?.filter(m => getMemberStatus(m.start_date).type === 'warning').length || 0;
  const expiredMembers = members?.filter(m => getMemberStatus(m.start_date).type === 'expired').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar miembro..."
            className="pl-10 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Miembro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Registrar Nuevo Miembro
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={newMember.full_name}
                  onChange={(e) => setNewMember({ ...newMember, full_name: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="juan@ejemplo.com"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="+52 55..."
                  className="bg-secondary border-border"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plan">Plan de Membresía</Label>
                <Select
                  value={newMember.plan_id}
                  onValueChange={(val) => setNewMember({ ...newMember, plan_id: val })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecciona un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => addMemberMutation.mutate(newMember)}
                disabled={addMemberMutation.isPending || !newMember.full_name || !newMember.email}
                className="w-full"
              >
                {addMemberMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Finalizar Registro
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Miembros", value: totalMembers, color: "text-foreground" },
          { label: "Activos", value: activeMembers, color: "text-primary" },
          { label: "Próximos a Vencer", value: warningMembers, color: "text-amber-500" },
          { label: "Vencidos", value: expiredMembers, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="card-fitness">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card-fitness overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Miembro</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => {
              const status = getMemberStatus(member.start_date);
              const expDate = new Date(member.start_date);
              expDate.setMonth(expDate.getMonth() + 1);

              return (
                <TableRow key={member.id} className="border-border group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">
                          {member.full_name.split(" ").map((n: string) => n[0]).join("")}
                        </span>
                      </div>
                      <span className="font-medium">{member.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-sm">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {member.phone || "Sin teléfono"}
                      </p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                      {member.membership_plans?.name || "Sin plan"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(member.start_date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="w-3 h-3 text-primary" />
                      {expDate.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.class}`}>
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsProfileOpen(true); }} className="gap-2">
                          <Eye className="w-4 h-4" /> Ver Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => renewMemberMutation.mutate(member.id)} className="gap-2 text-primary">
                          <RefreshCw className="w-4 h-4" /> Renovar Mes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsEditPlanOpen(true); }} className="gap-2">
                          <Edit2 className="w-4 h-4" /> Editar Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setSelectedMember(member); setIsDeleteDialogOpen(true); }} className="text-destructive gap-2">
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Cambiar Plan de Membresía
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona el nuevo plan para <strong>{selectedMember?.full_name}</strong>.
            </p>
            <div className="grid gap-2">
              <Label>Nuevo Plan</Label>
              <Select
                value={selectedMember?.plan_id}
                onValueChange={(val) => setSelectedMember({ ...selectedMember, plan_id: val })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditPlanOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => updateMemberPlanMutation.mutate({ id: selectedMember.id, plan_id: selectedMember.plan_id })}
              disabled={updateMemberPlanMutation.isPending}
            >
              {updateMemberPlanMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Actualizar Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="bg-card border-border sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Perfil del Miembro
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-6 pt-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary mb-2">
                  {selectedMember.full_name[0]}
                </div>
                <h3 className="text-xl font-bold">{selectedMember.full_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getMemberStatus(selectedMember.start_date).class}`}>
                  {getMemberStatus(selectedMember.start_date).label}
                </span>
              </div>
              <div className="grid gap-4 bg-secondary/50 p-4 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedMember.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{selectedMember.phone || "No registrado"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Inició el {new Date(selectedMember.start_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              ¿Eliminar miembro?
            </DialogTitle>
          </DialogHeader>
          <p className="py-4 text-muted-foreground">
            Estás a punto de eliminar a <strong>{selectedMember?.full_name}</strong>. Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteMemberMutation.mutate(selectedMember.id)} className="flex-1">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersTab;
