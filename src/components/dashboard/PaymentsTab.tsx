import { useState } from "react";
import { Search, Download, CreditCard, Banknote, Building2, Calendar, Loader2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const fetchPayments = async () => {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      members (
        full_name,
        membership_plans (
          name
        )
      )
    `)
    .order("payment_date", { ascending: false });

  if (error) throw error;
  return data;
};

const getMethodIcon = (method: string) => {
  switch (method) {
    case "card":
      return <CreditCard className="w-4 h-4" />;
    case "cash":
      return <Banknote className="w-4 h-4" />;
    case "transfer":
      return <Building2 className="w-4 h-4" />;
    default:
      return null;
  }
};

const getMethodLabel = (method: string) => {
  switch (method) {
    case "card":
      return "Tarjeta";
    case "cash":
      return "Efectivo";
    case "transfer":
      return "Transferencia";
    default:
      return method;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <span className="badge-active">Pagado</span>;
    case "pending":
      return <span className="badge-pending">Pendiente</span>;
    default:
      return null;
  }
};

const PaymentsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  });

  const filteredPayments = payments?.filter((payment) => {
    const memberName = payment.members?.full_name || "";
    const matchesSearch = memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPaid = payments
    ?.filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const totalPending = payments
    ?.filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Cargando pagos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-fitness border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-destructive font-semibold">Error al cargar los pagos</p>
        <p className="text-sm text-muted-foreground mt-2">{(error as any).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
          <p className="text-2xl font-bold text-primary">${totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Cobrado</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Por Cobrar</p>
          <p className="text-2xl font-bold text-warning">${totalPending.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">Pendiente</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Transacciones</p>
          <p className="text-2xl font-bold">{payments?.length || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Historial total</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Promedio</p>
          <p className="text-2xl font-bold">
            ${Math.round(totalPaid / (payments?.filter((p) => p.status === "paid").length || 1)).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Por pago</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pago..."
              className="pl-10 bg-card border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-card border-border">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="paid">Pagados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="border-border">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Table */}
      <div className="card-fitness overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Miembro</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {payment.members?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                      </span>
                    </div>
                    <span className="font-medium">{payment.members?.full_name || "Membro borrado"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {payment.members?.membership_plans?.name || "Sin plan"}
                  </span>
                </TableCell>
                <TableCell className="font-semibold">
                  ${payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(payment.payment_date).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getMethodIcon(payment.method)}
                    <span className="text-sm">{getMethodLabel(payment.method)}</span>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
              </TableRow>
            ))}
            {filteredPayments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron pagos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentsTab;
