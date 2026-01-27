import { useState } from "react";
import { Search, Plus, Mail, Phone, Calendar, MoreHorizontal } from "lucide-react";
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

// Mock data
const mockMembers = [
  {
    id: 1,
    name: "María García",
    phone: "+52 55 1234 5678",
    email: "maria@email.com",
    plan: "Premium",
    endDate: "2024-02-15",
    status: "active",
  },
  {
    id: 2,
    name: "Carlos López",
    phone: "+52 55 2345 6789",
    email: "carlos@email.com",
    plan: "Básico",
    endDate: "2024-01-20",
    status: "expired",
  },
  {
    id: 3,
    name: "Ana Martínez",
    phone: "+52 55 3456 7890",
    email: "ana@email.com",
    plan: "Premium",
    endDate: "2024-03-01",
    status: "active",
  },
  {
    id: 4,
    name: "Roberto Sánchez",
    phone: "+52 55 4567 8901",
    email: "roberto@email.com",
    plan: "Básico",
    endDate: "2024-01-25",
    status: "pending",
  },
  {
    id: 5,
    name: "Laura Hernández",
    phone: "+52 55 5678 9012",
    email: "laura@email.com",
    plan: "VIP",
    endDate: "2024-04-10",
    status: "active",
  },
  {
    id: 6,
    name: "Diego Torres",
    phone: "+52 55 6789 0123",
    email: "diego@email.com",
    plan: "Premium",
    endDate: "2024-02-28",
    status: "active",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <span className="badge-active">Activo</span>;
    case "expired":
      return <span className="badge-expired">Vencido</span>;
    case "pending":
      return <span className="badge-pending">Pendiente</span>;
    default:
      return null;
  }
};

const MembersTab = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredMembers = mockMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Miembro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Miembros", value: "156", change: "+12 este mes" },
          { label: "Activos", value: "142", change: "91% del total" },
          { label: "Por Vencer", value: "8", change: "Próximos 7 días" },
          { label: "Vencidos", value: "6", change: "Requieren atención" },
        ].map((stat) => (
          <div key={stat.label} className="card-fitness">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
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
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id} className="border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {member.phone}
                    </p>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {member.plan}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(member.endDate).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(member.status)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Renovar Membresía</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MembersTab;
