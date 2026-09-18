'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { CustomerService, CustomerProfile, CustomerOrderDetail } from '@/lib/services/customerService';
import { formatMoney } from '@/lib/money';

export default function AdminCustomerDetailPage() {
    const params = useParams();
    const id = params?.id as string;

    const [customer, setCustomer] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<CustomerOrderDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!id) return;
            setLoading(true);
            const { customer: cust, orders: ords } = await CustomerService.getCustomerDetails(id);
            if (isMounted) {
                setCustomer(cust);
                setOrders(ords);
                setLoading(false);
            }
        })();
        return () => { isMounted = false; };
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Cargando ficha del cliente...
            </div>
        );
    }

    if (!customer) {
        return (
            <div>
                <AdminPageHeader
                    title="Cliente No Encontrado"
                    description="El cliente solicitado no existe o fue eliminado."
                    action={
                        <Link href="/admin/clientes" style={{ padding: '8px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', textDecoration: 'none', color: 'var(--foreground)', fontWeight: 600 }}>
                            ← Volver a Clientes
                        </Link>
                    }
                />
            </div>
        );
    }

    const rawPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
    const waNumber = rawPhone.length === 9 ? `51${rawPhone}` : rawPhone;

    return (
        <div style={{ paddingBottom: '60px', maxWidth: '900px' }}>
            <AdminPageHeader
                title={`Ficha de Cliente: ${customer.name}`}
                description="Información de contacto, notas CRM del cliente e historial completo de pedidos."
                action={
                    <Link
                        href="/admin/clientes"
                        style={{
                            padding: '8px 14px',
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            color: 'var(--foreground)',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        ← Volver al Directorio
                    </Link>
                }
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                {/* Left Card: Customer Profile Summary */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)', height: 'fit-content' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'var(--gradient-main)',
                            color: 'white',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.4rem',
                            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                            marginBottom: '12px',
                        }}>
                            {(customer.name || 'C').slice(0, 2).toUpperCase()}
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                            {customer.name}
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{customer.email}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', fontSize: '0.88rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teléfono</span>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{customer.phone || 'No registrado'}</span>
                                {rawPhone && (
                                    <a
                                        href={`https://wa.me/${waNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: '0.75rem', color: '#25d366', fontWeight: 700, textDecoration: 'none' }}
                                    >
                                        💬 Mensaje
                                    </a>
                                )}
                            </div>
                        </div>

                        {customer.document_number && (
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Documento</span>
                                <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{customer.document_type || 'DNI'}: {customer.document_number}</span>
                            </div>
                        )}

                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gasto Total Acumulado</span>
                            <span style={{ fontWeight: 800, color: 'var(--robotina-orange)', fontSize: '1.1rem' }}>
                                {formatMoney(customer.total_spent_cents / 100, 'PEN')}
                            </span>
                        </div>

                        <div>
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total de Pedidos</span>
                            <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{customer.total_orders} compras registradas</span>
                        </div>

                        {customer.notes && (
                            <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--robotina-orange)', marginBottom: '4px' }}>📝 Nota CRM:</span>
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--foreground)', lineHeight: '1.4' }}>{customer.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Card: Order History */}
                <div style={{ background: 'var(--card-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--foreground)' }}>
                        📦 Historial de Pedidos ({orders.length})
                    </h3>

                    {orders.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Este cliente aún no registra compras asociadas.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {orders.map((ord) => (
                                <div
                                    key={ord.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '14px 16px',
                                        background: 'var(--input-bg)',
                                        borderRadius: '10px',
                                        border: '1px solid var(--glass-border)',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '0.95rem' }}>
                                            {ord.order_number}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {new Date(ord.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 800, color: 'var(--robotina-orange)', fontSize: '0.95rem' }}>
                                            {formatMoney(ord.total_amount / 100, 'PEN')}
                                        </div>
                                        <span style={{
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: ord.payment_status === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                            color: ord.payment_status === 'paid' ? '#22c55e' : '#f59e0b',
                                            display: 'inline-block',
                                            marginTop: '4px',
                                        }}>
                                            {ord.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
