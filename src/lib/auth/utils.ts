import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'admin' | 'customer';
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) return null;

        // Fetch profile using service role to bypass RLS issues during initial check
        const adminClient = createAdminClient();
        const { data: profile } = await adminClient
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (!profile) {
            return {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || null,
                role: (session.user.user_metadata?.role as 'admin' | 'customer') || 'customer',
            };
        }

        return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role || 'customer',
        };
    } catch {
        return null;
    }
}

export async function checkIsAdmin(): Promise<boolean> {
    const profile = await getCurrentUserProfile();
    return profile?.role === 'admin';
}
