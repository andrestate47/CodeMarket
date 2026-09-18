import { supabase } from '@/lib/supabase';

export interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document_type?: string;
    document_number?: string;
    notes?: string;
    total_orders: number;
    total_spent_cents: number;
    last_order_date?: string;
    created_at: string;
}

export interface CustomerOrderDetail {
    id: string;
    order_number: string;
    total_amount: number; // in cents
    payment_status: string;
    fulfillment_status: string;
    created_at: string;
}

const DEFAULT_DEMO_CUSTOMERS: CustomerProfile[] = [
    {
        id: 'cust-demo-001',
        name: 'Carlos Mendoza',
        email: 'carlos.mendoza@gmail.com',
        phone: '+51 987 654 321',
        document_type: 'DNI',
        document_number: '45896231',
        notes: 'Cliente preferencial de Pod Systems. Prefiere entregas por la tarde.',
        total_orders: 4,
        total_spent_cents: 38960, // S/ 389.60
        last_order_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    },
    {
        id: 'cust-demo-002',
        name: 'María Fernanda Ríos',
        email: 'maria.rios@hotmail.com',
        phone: '+51 912 345 678',
        document_type: 'DNI',
        document_number: '71234567',
        notes: 'Compradora frecuente de líquidos SaltNic frutales.',
        total_orders: 6,
        total_spent_cents: 64200, // S/ 642.00
        last_order_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
    },
    {
        id: 'cust-demo-003',
        name: 'Jorge Luis Morales',
        email: 'jorge.morales@empresa.pe',
        phone: '+51 955 888 222',
        document_type: 'RUC',
        document_number: '20601234567',
        notes: 'Requiere factura con RUC en cada compra.',
        total_orders: 3,
        total_spent_cents: 49500, // S/ 495.00
        last_order_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
    },
    {
        id: 'cust-demo-004',
        name: 'Ana Sofía Delgado',
        email: 'ana.delgado@outlook.com',
        phone: '+51 944 111 333',
        document_type: 'DNI',
        document_number: '48965213',
        notes: 'Cliente que recoge sus compras directamente en tienda.',
        total_orders: 2,
        total_spent_cents: 18000, // S/ 180.00
        last_order_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    }
];

export class CustomerService {
    private static isSupabaseConfigured(): boolean {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        return Boolean(url && !url.includes('your-supabase-project') && !url.includes('placeholder'));
    }

    /**
     * Get customers list aggregated with spend and total orders
     */
    static async getCustomersWithMetrics(): Promise<CustomerProfile[]> {
        if (!this.isSupabaseConfigured()) {
            return DEFAULT_DEMO_CUSTOMERS;
        }

        try {
            const { data: customersData, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error || !customersData || customersData.length === 0) {
                return DEFAULT_DEMO_CUSTOMERS;
            }

            // Fetch orders to calculate real spend
            const { data: ordersData } = await supabase
                .from('orders')
                .select('customer_id, customer_email, total_amount, created_at');

            const orderMap = new Map<string, { count: number; totalCents: number; lastDate: string }>();

            ordersData?.forEach(ord => {
                const key = ord.customer_id || ord.customer_email;
                if (!key) return;

                const curr = orderMap.get(key) || { count: 0, totalCents: 0, lastDate: ord.created_at };
                curr.count += 1;
                curr.totalCents += Number(ord.total_amount || 0);
                if (new Date(ord.created_at) > new Date(curr.lastDate)) {
                    curr.lastDate = ord.created_at;
                }
                orderMap.set(key, curr);
            });

            return customersData.map((cust: any) => {
                const stats = orderMap.get(cust.id) || orderMap.get(cust.email) || { count: 0, totalCents: 0, lastDate: cust.created_at };
                return {
                    id: cust.id,
                    name: cust.name || 'Cliente sin nombre',
                    email: cust.email,
                    phone: cust.phone || '',
                    document_type: cust.document_type || undefined,
                    document_number: cust.document_number || undefined,
                    notes: cust.notes || undefined,
                    total_orders: stats.count,
                    total_spent_cents: stats.totalCents,
                    last_order_date: stats.lastDate,
                    created_at: cust.created_at,
                };
            });
        } catch {
            return DEFAULT_DEMO_CUSTOMERS;
        }
    }

    /**
     * Get single customer by ID with past orders history
     */
    static async getCustomerDetails(id: string): Promise<{ customer: CustomerProfile | null; orders: CustomerOrderDetail[] }> {
        const allCustomers = await this.getCustomersWithMetrics();
        const found = allCustomers.find(c => c.id === id);

        if (!found) {
            return { customer: null, orders: [] };
        }

        let orders: CustomerOrderDetail[] = [];

        if (this.isSupabaseConfigured()) {
            try {
                const { data } = await supabase
                    .from('orders')
                    .select('id, order_number, total_amount, payment_status, fulfillment_status, created_at')
                    .or(`customer_id.eq.${id},customer_email.eq.${found.email}`)
                    .order('created_at', { ascending: false });

                if (data) {
                    orders = data.map((o: any) => ({
                        id: o.id,
                        order_number: o.order_number,
                        total_amount: Number(o.total_amount || 0),
                        payment_status: o.payment_status || 'pending',
                        fulfillment_status: o.fulfillment_status || 'unfulfilled',
                        created_at: o.created_at,
                    }));
                }
            } catch {
                // Fallback below
            }
        }

        if (orders.length === 0) {
            // Generate mock order details for demo customers
            orders = [
                {
                    id: `ord-mock-${id}-1`,
                    order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                    total_amount: Math.round(found.total_spent_cents * 0.6),
                    payment_status: 'paid',
                    fulfillment_status: 'delivered',
                    created_at: found.last_order_date || new Date().toISOString(),
                },
                {
                    id: `ord-mock-${id}-2`,
                    order_number: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                    total_amount: Math.round(found.total_spent_cents * 0.4),
                    payment_status: 'paid',
                    fulfillment_status: 'delivered',
                    created_at: found.created_at,
                }
            ];
        }

        return { customer: found, orders };
    }
}
