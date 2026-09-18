'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminDataTable from '@/components/admin/AdminDataTable';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import { CustomerService, CustomerProfile } from '@/lib/services/customerService';
import { formatMoney } from '@/lib/money';

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<CustomerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        let isMounted = true;
        (async () => {
            setLoading(true);
            const data = await CustomerService.getCustomersWithMetrics();
            if (isMounted) {
                setCustomers(data);
                setLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, []);

    // Filter customers based on search query
    const filteredCustomers = useMemo(() => {
        if (!searchQuery.trim()) return customers;
        const q = searchQuery.toLowerCase().trim();
        return customers.filter(c =>
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.phone && c.phone.toLowerCase().includes(q)) ||
            (c.document_number && c.document_number.includes(q))
        );
    }, [customers, searchQuery]);

    // Calculate CRM Metrics
    const metrics = useMemo(() => {
        const totalCount = customers.length;
        const repeatCount = customers.filter(c => c.total_orders > 1).length;
        const totalRevenueCents = customers.reduce((sum, c) => sum + c.total_spent_cents, 0);
        const avgSpentCents = totalCount > 0 ? Math.round(totalRevenueCents / totalCount) : 0;

        return {
            totalCount,
            repeatCount,
            totalRevenueCents,
            avgSpentCents,
        };
    }, [customers]);

    const columns = [
        {
            header: 'Cliente',
            cell: (customer: CustomerProfile) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--gradient-main)',
                        color: 'white',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.88rem',
                        boxShadow: '0 2px 8px rgba(255, 107, 0, 0.25)',
                        flexShrink: 0,
                    }}>
                        {(customer.name || 'C').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--foreground)' }}>{customer.name || 'Sin nombre'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{customer.email}</div>
                    </div>
                </div>
            ),
        },
        {
            header: 'Contacto / WhatsApp',
            cell: (customer: CustomerProfile) => {
                const rawPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
                const waNumber = rawPhone.length === 9 ? `51${rawPhone}` : rawPhone;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--foreground)', fontSize: '0.86rem', fontWeight: 600 }}>
                            {customer.phone || 'Sin teléfono'}
                        </span>
                        {rawPhone && (
                            <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hola ${customer.name}, te escribimos desde TiendaVir.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: '4px 8px',
                                    background: 'rgba(37, 211, 102, 0.12)',
                                    border: '1px solid rgba(37, 211, 102, 0.3)',
                                    color: '#25d366',
                                    borderRadius: '6px',
                                    fontSize: '0.74rem',
                                    fontWeight: 700,
                                    textDecoration: 'none',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                                title="Enviar mensaje de WhatsApp"
                            >
                                💬 WhatsApp
                            </a>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Pedidos Realizados',
            cell: (customer: CustomerProfile) => (
                <span style={{
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    background: customer.total_orders > 1 ? 'rgba(34, 197, 94, 0.15)' : 'var(--glass-bg)',
                    color: customer.total_orders > 1 ? '#22c55e' : 'var(--foreground)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid var(--glass-border)',
                }}>
                    {customer.total_orders} {customer.total_orders === 1 ? 'pedido' : 'pedidos'}
                </span>
            ),
        },
        {
            header: 'Gasto Acumulado',
            cell: (customer: CustomerProfile) => (
                <span style={{ fontWeight: 800, color: 'var(--robotina-orange)', fontSize: '0.92rem' }}>
                    {formatMoney(customer.total_spent_cents / 100, 'PEN')}
                </span>
            ),
        },
        {
            header: 'Acción',
            cell: (customer: CustomerProfile) => (
                <Link
                    href={`/admin/clientes/${customer.id}`}
                    style={{
                        padding: '6px 14px',
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--foreground)',
                        textDecoration: 'none',
                    }}
                >
                    👤 Ficha Cliente
                </Link>
            ),
        },
    ];

    return (
        <div style={{ paddingBottom: '60px' }}>
            <AdminPageHeader
                title="Gestión de Clientes (CRM)"
                description="Directorio unificado de clientes, historial de compras, gasto acumulado y contacto directo."
            />

            {/* Top KPI Metrics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
            }}>
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Clientes</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '4px' }}>{metrics.totalCount}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase' }}>Clientes Recurrentes</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#22c55e', marginTop: '4px' }}>{metrics.repeatCount}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gasto Promedio por Cliente</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--robotina-orange)', marginTop: '4px' }}>{formatMoney(metrics.avgSpentCents / 100, 'PEN')}</div>
                </div>

                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '14px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Facturación Acumulada</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--foreground)', marginTop: '4px' }}>{formatMoney(metrics.totalRevenueCents / 100, 'PEN')}</div>
                </div>
            </div>

            {/* Search Input Bar */}
            <div style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 Buscar cliente por nombre, correo, teléfono o DNI/RUC..."
                    style={{
                        maxWidth: '420px',
                        width: '100%',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        color: 'var(--foreground)',
                        outline: 'none',
                    }}
                />
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando directorio de clientes...
                </div>
            ) : filteredCustomers.length === 0 ? (
                <AdminEmptyState
                    icon="👥"
                    title="No se encontraron clientes"
                    description="Los clientes se registrarán automáticamente al realizar pedidos en la tienda o desde el panel."
                />
            ) : (
                <AdminDataTable
                    columns={columns}
                    data={filteredCustomers}
                    keyExtractor={(item) => item.id}
                    emptyText="No hay clientes coincidentes."
                />
            )}
        </div>
    );
}
