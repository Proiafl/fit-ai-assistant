import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Zap, Crown, Star, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

const plans = [
    {
        id: "basic",
        name: "Básico",
        price: 29,
        icon: Zap,
        color: "border-border hover:border-primary/40",
        features: [
            "Hasta 100 miembros",
            "Chat WhatsApp manual",
            "Gestión de clases y pagos",
            "Recordatorios automáticos",
            "Reportes básicos",
            "Soporte por email",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        price: 59,
        icon: Star,
        color: "border-primary ring-2 ring-primary/30",
        badge: "Más Popular",
        features: [
            "Miembros ilimitados",
            "Agente IA de WhatsApp 24/7",
            "Reservas automáticas por IA",
            "Analytics avanzados",
            "Recordatorios inteligentes de pago",
            "Soporte prioritario",
        ],
    },
    {
        id: "premium",
        name: "Premium",
        price: 99,
        icon: Crown,
        color: "border-border hover:border-primary/40",
        features: [
            "Todo lo de Pro",
            "Análisis de retención con IA",
            "Reportes personalizados exportables",
            "Onboarding personalizado 1:1",
            "Soporte directo por WhatsApp",
            "Acceso anticipado a nuevas features",
        ],
    },
];

const PricingPage = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const { data: subscription } = useSubscription();

    const handleSelectPlan = async (planId: string) => {
        setLoading(planId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                window.location.href = "/auth?mode=register";
                return;
            }

            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ planType: planId }),
            });

            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || "Error al crear checkout");
            }

            const { checkout_url } = await res.json();
            window.location.href = checkout_url;
        } catch (err: any) {
            toast.error(err.message || "Error al procesar el pago. Intenta nuevamente.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Back button */}
            <div className="container mx-auto px-6 pt-8">
                <Link to="/">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio
                    </Button>
                </Link>
            </div>

            <div className="container mx-auto px-6 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                        <Star className="w-4 h-4" />
                        14 días gratis — sin tarjeta de crédito
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Planes simples y{" "}
                        <span className="text-primary">transparentes</span>
                    </h1>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
                        Empieza gratis. Cancela cuando quieras. Sin compromisos.
                    </p>
                </div>

                {/* Trial status banner */}
                {subscription?.plan_type === 'trial' && (
                    <div className="max-w-2xl mx-auto mb-10 p-4 bg-primary/10 border border-primary/20 rounded-xl text-center">
                        <p className="text-primary font-medium">
                            🎉 Estás en tu período de prueba gratuita. Elige un plan para continuar después de los 14 días.
                        </p>
                    </div>
                )}

                {/* Plans grid */}
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const isCurrentPlan = subscription?.plan_type === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-card rounded-2xl border-2 p-8 flex flex-col transition-all duration-300 ${plan.color}`}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Plan header */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h2 className="text-2xl font-bold">{plan.name}</h2>
                                </div>

                                {/* Price */}
                                <div className="mb-8">
                                    <div className="flex items-end gap-1">
                                        <span className="text-5xl font-extrabold">${plan.price}</span>
                                        <span className="text-muted-foreground text-lg mb-1">/mes</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">facturado mensualmente en USD</p>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 flex-1 mb-8">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex items-start gap-3 text-sm">
                                            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-3 h-3 text-primary" />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <Button
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={loading !== null || isCurrentPlan}
                                    className="w-full h-12 text-base font-semibold"
                                    variant={plan.badge ? "default" : "outline"}
                                >
                                    {loading === plan.id ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Procesando...
                                        </>
                                    ) : isCurrentPlan ? (
                                        "✓ Plan Actual"
                                    ) : (
                                        "Empezar 14 días gratis"
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ / Trust section */}
                <div className="mt-20 text-center">
                    <p className="text-muted-foreground">
                        ¿Preguntas? Escríbenos a{" "}
                        <a href="mailto:soporte@gymiapp.com" className="text-primary hover:underline">
                            soporte@gymiapp.com
                        </a>{" "}
                        o por WhatsApp directo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
