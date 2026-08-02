import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const createServerClient = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
        },
        global: {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
    });
};
