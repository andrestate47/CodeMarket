'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

interface DBCustomer {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<DBCustomer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setLoading(true);
            const { data } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (isMounted) {
                setCustomers(data || []);
                setLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    const columns = [
        {
            header: 'Cliente',
            cell: (customer: DBCustomer) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                        color: 'white',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                    }}>
                        {(customer.name || 'C').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'white' }}>{customer.name || 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.78rem', color: '#71717a' }}>{customer.email}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Teléfono',
            cell: (customer: DBCustomer) => (
                <span style={{ color: '#d4d4d8' }}>{customer.phone || 'No registrado'}</span>
            ),
        },
        {
            header: 'Fecha Registro',
            cell: (customer: DBCustomer) => (
                <span style={{ color: '#a1a1aa' }}>
                    {new Date(customer.created_at).toLocaleDateString('es-PE')}
                </span>
            ),
        },
        {
            header: 'Acción',
            cell: (customer: DBCustomer) => (
                <Link
                    href={`/admin/clientes/${customer.id}`}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        fontWeight: 600,
                    }}
                >
                    Ver Historial
                </Link>
            ),
        },
    ];

    return (
        <div>
            <AdminPageHeader
                title="Base de Clientes"
                description="Consulta la lista de compradores registrados y su información de contacto."
            />

            {customers.length === 0 && !loading ? (
                <AdminEmptyState
                    title="No hay clientes registrados"
                    description="Cuando los usuarios registren sus datos en el checkout o creen una cuenta, sus datos aparecerán en esta lista."
                />
            ) : (
                <AdminDataTable
                    columns={columns}
                    data={customers}
                    keyExtractor={c => c.id}
                    loading={loading}
                />
            )}
        </div>
    );
}
