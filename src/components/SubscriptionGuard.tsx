import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, isTrialExpired, trialDaysRemaining } from "@/hooks/useSubscription";

interface SubscriptionGuardProps {
    children: ReactNode;
    showBanner?: boolean;
}

export function SubscriptionGuard({ children, showBanner = true }: SubscriptionGuardProps) {
    const { data: subscription, isLoading } = useSubscription();

    // While loading, render children normally (avoid flash)
    if (isLoading) return <>{children}</>;

    // Trial expired — show upgrade wall
    if (isTrialExpired(subscription)) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] gap-6 text-center px-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-glow">
                    <Crown className="w-10 h-10 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold mb-3">Tu prueba gratuita ha terminado</h2>
                    <p className="text-muted-foreground max-w-md text-lg">
                        Activa tu suscripción para seguir gestionando tu gimnasio con Fit IA y no perder ningún dato.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link to="/pricing">
                        <Button size="lg" className="bg-primary text-primary-foreground font-semibold">
                            <Crown className="w-4 h-4 mr-2" />
                            Ver Planes y Precios
                        </Button>
                    </Link>
                </div>
                <p className="text-sm text-muted-foreground">
                    Tus datos están seguros y serán restaurados al activar tu plan.
                </p>
            </div>
        );
    }

    const daysLeft = trialDaysRemaining(subscription);

    return (
        <>
            {showBanner && subscription?.plan_type === 'trial' && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="text-sm text-primary font-medium">
                            🎉 Prueba gratuita activa — quedan <strong>{daysLeft} día{daysLeft !== 1 ? 's' : ''}</strong>
                        </p>
                    </div>
                    <Link to="/pricing">
                        <Button size="sm" className="text-xs whitespace-nowrap">
                            Activar Plan
                        </Button>
                    </Link>
                </div>
            )}
            {children}
        </>
    );
}
