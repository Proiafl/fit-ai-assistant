import { useState } from "react";
import { Search, Download, CreditCard, Banknote, Building2, Calendar } from "lucide-react";
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

// Mock data
const mockPayments = [
  {
    id: 1,
    member: "María García",
    amount: 799,
    date: "2024-01-15",
    method: "card",
    status: "paid",
    plan: "Premium",
  },
  {
    id: 2,
    member: "Carlos López",
    amount: 499,
    date: "2024-01-14",
    method: "cash",
    status: "paid",
    plan: "Básico",
  },
  {
    id: 3,
    member: "Ana Martínez",
    amount: 799,
    date: "2024-01-14",
    method: "transfer",
    status: "pending",
    plan: "Premium",
  },
  {
    id: 4,
    member: "Roberto Sánchez",
    amount: 1299,
    date: "2024-01-13",
    method: "card",
    status: "paid",
    plan: "VIP",
  },
  {
    id: 5,
    member: "Laura Hernández",
    amount: 799,
    date: "2024-01-12",
    method: "transfer",
    status: "paid",
    plan: "Premium",
  },
  {
    id: 6,
    member: "Diego Torres",
    amount: 499,
    date: "2024-01-12",
    method: "cash",
    status: "pending",
    plan: "Básico",
  },
];

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

  const filteredPayments = mockPayments.filter((payment) => {
    const matchesSearch = payment.member.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPaid = mockPayments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = mockPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Ingresos del Mes</p>
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
          <p className="text-2xl font-bold">{mockPayments.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Este mes</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Promedio</p>
          <p className="text-2xl font-bold">
            ${Math.round(totalPaid / mockPayments.filter((p) => p.status === "paid").length).toLocaleString()}
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
                        {payment.member.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <span className="font-medium">{payment.member}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {payment.plan}
                  </span>
                </TableCell>
                <TableCell className="font-semibold">
                  ${payment.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(payment.date).toLocaleDateString("es-MX", {
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
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentsTab;
