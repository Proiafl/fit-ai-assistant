import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Returns the current user's gym ID.
 * Used across all dashboard tabs to scope inserts and queries to the correct gym.
 */
export function useGymId() {
    return useQuery({
        queryKey: ['gym_id'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('gyms')
                .select('id')
                .single();
            if (error) throw error;
            return data?.id as string;
        },
        staleTime: 5 * 60 * 1000, // 5 min cache — gym_id never changes mid-session
    });
}
