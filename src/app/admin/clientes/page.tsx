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
    const [searchQuery, setSearchQuery] = useState('');

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

    // Filter customers based on search query
    const filteredCustomers = customers.filter(c => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q))
        );
    });

    const columns = [
        {
            header: 'Cliente',
            cell: (customer: DBCustomer) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: 'var(--gradient-main, linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%))',
                        color: 'white',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                    }}>
                        {(customer.name || 'C').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--foreground)' }}>{customer.name || 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{customer.email}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Teléfono',
            cell: (customer: DBCustomer) => (
                <span style={{ color: 'var(--foreground)', fontSize: '0.88rem' }}>{customer.phone || 'No registrado'}</span>
            ),
        },
        {
            header: 'Fecha Registro',
            cell: (customer: DBCustomer) => (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
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
                        padding: '6px 14px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        color: 'var(--foreground)',
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
                action={
                    <Link
                        href="/admin/pedidos/nuevo"
                        style={{
                            padding: '10px 18px',
                            background: 'var(--robotina-orange, #f97316)',
                            color: 'white',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                        }}
                    >
                        ➕ Pedido Manual / Préstamo
                    </Link>
                }
            />

            {/* Buscador con Lupita 🔍 */}
            <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '520px' }}>
                <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: searchQuery ? 'var(--robotina-orange)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar cliente por nombre, teléfono o correo..."
                    style={{
                        width: '100%',
                        padding: '11px 36px 11px 42px',
                        background: 'var(--input-bg)',
                        border: '1.5px solid var(--glass-border)',
                        borderRadius: '12px',
                        color: 'var(--input-text)',
                        fontSize: '0.9rem',
                        outline: 'none',
                    }}
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>

            {customers.length === 0 && !loading ? (
                <AdminEmptyState
                    title="No hay clientes registrados"
                    description="Cuando los usuarios registren sus datos en el checkout o se agreguen manualmente, sus datos aparecerán en esta lista."
                />
            ) : filteredCustomers.length === 0 && searchQuery ? (
                <div style={{ padding: '30px', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔍</div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>No se encontraron clientes para &quot;{searchQuery}&quot;</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>Intenta buscar con otro nombre, correo o teléfono.</div>
                </div>
            ) : (
                <AdminDataTable
                    columns={columns}
                    data={filteredCustomers}
                    keyExtractor={c => c.id}
                    loading={loading}
                />
            )}
        </div>
    );
}
