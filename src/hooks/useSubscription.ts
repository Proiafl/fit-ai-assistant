import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type PlanType = 'trial' | 'basic' | 'pro' | 'premium';

export interface Subscription {
    id: string;
    gym_id: string;
    plan_type: PlanType;
    status: 'active' | 'expired' | 'cancelled' | 'past_due';
    trial_ends_at: string;
    current_period_start: string;
    current_period_end: string | null;
    mercadopago_subscription_id: string | null;
    stripe_subscription_id: string | null;
    created_at: string;
    updated_at: string;
}

export function useSubscription() {
    return useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            const { data: gym } = await supabase
                .from('gyms')
                .select('id')
                .single();

            if (!gym) return null;

            const { data, error } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('gym_id', gym.id)
                .single();

            if (error) return null;
            return data as Subscription;
        },
        staleTime: 60 * 1000, // 1 min cache
    });
}

/** Returns true si el trial ya expiró (y el plan sigue siendo 'trial') */
export function isTrialExpired(subscription: Subscription | null | undefined): boolean {
    if (!subscription) return false; // No subscription yet = not expired (still loading)
    if (subscription.plan_type !== 'trial') return false; // Paid plan, never expires here
    if (subscription.status !== 'active') return true;
    return new Date(subscription.trial_ends_at) < new Date();
}

/** Days remaining in trial. Returns 0 if expired or not trial. */
export function trialDaysRemaining(subscription: Subscription | null | undefined): number {
    if (!subscription || subscription.plan_type !== 'trial') return 0;
    const diff = new Date(subscription.trial_ends_at).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
}

/** Feature access matrix by plan */
export function hasFeature(subscription: Subscription | null | undefined, feature: string): boolean {
    const planFeatures: Record<string, string[]> = {
        trial: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings'],
        basic: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings'],
        pro: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings', 'analytics', 'ai_agent'],
        premium: ['messages', 'members', 'memberships', 'classes', 'payments', 'settings', 'analytics', 'ai_agent', 'priority_support'],
    };

    const plan = subscription?.plan_type || 'trial';
    return planFeatures[plan]?.includes(feature) ?? false;
}
