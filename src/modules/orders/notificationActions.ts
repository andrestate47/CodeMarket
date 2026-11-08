'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/admin';

export interface OrderNotification {
    id: string;
    order_number: string;
    customer_name: string;
    total_amount: number; // céntimos
    payment_status?: string;
    created_at: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: string };

/** Últimos pedidos recibidos (solo admin). Se usa para la campana de notificaciones. */
export async function getRecentOrdersForNotificationsAction(
    accessToken?: string,
    limit = 10
): Promise<Result<OrderNotification[]>> {
    try {
        if (accessToken) {
            await requireAdmin(accessToken);
        }
        const { data, error } = await createAdminClient()
            .from('orders')
            .select('id, order_number, customer_name, total_amount, payment_status, created_at')
            .order('created_at', { ascending: false })
            .limit(Math.min(Math.max(limit, 1), 30));
        if (error) throw new Error(error.message);
        return { success: true, data: (data || []) as OrderNotification[] };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Error inesperado' };
    }
}
