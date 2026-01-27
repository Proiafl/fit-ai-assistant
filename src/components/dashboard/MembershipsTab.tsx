import { Plus, Users, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data
const mockMemberships = [
  {
    id: 1,
    name: "Básico",
    price: 499,
    duration: 30,
    benefits: ["Acceso al gimnasio", "Horario regular", "Casillero básico"],
    activeMembers: 45,
    color: "from-slate-500 to-slate-600",
  },
  {
    id: 2,
    name: "Premium",
    price: 799,
    duration: 30,
    benefits: [
      "Acceso 24/7",
      "Clases grupales",
      "Casillero premium",
      "1 sesión PT/mes",
      "Toallas incluidas",
    ],
    activeMembers: 78,
    color: "from-primary to-emerald-600",
    popular: true,
  },
  {
    id: 3,
    name: "VIP",
    price: 1299,
    duration: 30,
    benefits: [
      "Todo Premium",
      "4 sesiones PT/mes",
      "Área VIP exclusiva",
      "Nutriólogo incluido",
      "Estacionamiento",
      "Invitados gratis",
    ],
    activeMembers: 23,
    color: "from-amber-500 to-orange-600",
  },
  {
    id: 4,
    name: "Anual Premium",
    price: 7999,
    duration: 365,
    benefits: [
      "Todo Premium",
      "2 meses gratis",
      "Congelamiento 30 días",
      "Descuento en productos",
    ],
    activeMembers: 34,
    color: "from-violet-500 to-purple-600",
  },
];

const MembershipsTab = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Planes de Membresía</h2>
          <p className="text-muted-foreground">Gestiona los planes disponibles para tus miembros</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Plan
        </Button>
      </div>

      {/* Membership cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockMemberships.map((membership) => (
          <div
            key={membership.id}
            className={`relative rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
              membership.popular ? "ring-2 ring-primary" : ""
            }`}
          >
            {membership.popular && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                <Star className="w-3 h-3" />
                Popular
              </div>
            )}

            {/* Header gradient */}
            <div className={`h-24 bg-gradient-to-br ${membership.color} p-6`}>
              <h3 className="text-2xl font-bold text-white">{membership.name}</h3>
            </div>

            {/* Content */}
            <div className="p-6 bg-card">
              {/* Price */}
              <div className="mb-6">
                <span className="text-3xl font-bold">${membership.price.toLocaleString()}</span>
                <span className="text-muted-foreground">
                  /{membership.duration === 365 ? "año" : "mes"}
                </span>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 mb-6">
                {membership.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* Active members */}
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

      {/* Summary stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Ingresos Mensuales Recurrentes</p>
          <p className="text-3xl font-bold text-primary">$125,430</p>
          <p className="text-sm text-muted-foreground mt-2">+15% vs mes anterior</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Ticket Promedio</p>
          <p className="text-3xl font-bold">$784</p>
          <p className="text-sm text-muted-foreground mt-2">Por membresía</p>
        </div>
        <div className="card-fitness">
          <p className="text-sm text-muted-foreground mb-1">Tasa de Renovación</p>
          <p className="text-3xl font-bold">87%</p>
          <p className="text-sm text-muted-foreground mt-2">Últimos 3 meses</p>
        </div>
      </div>
    </div>
  );
};

export default MembershipsTab;
