'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminDiscountsListPage() {
    return (
        <div>
            <AdminPageHeader
                title="Descuentos y Cupones"
                description="Administra códigos promocionales, ofertas automáticas y descuentos por volumen."
                action={
                    <Link
                        href="/admin/descuentos/nuevo"
                        style={{
                            padding: '10px 18px',
                            background: 'var(--gradient-main)',
                            color: 'white',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)',
                        }}
                    >
                        <span>🎟️</span> Nuevo Descuento
                    </Link>
                }
            />

            <AdminEmptyState
                icon="🎟️"
                title="No hay descuentos activos"
                description="Crea cupones de porcentaje, monto fijo o envío gratis para tus clientes."
                action={
                    <Link
                        href="/admin/descuentos/nuevo"
                        style={{
                            padding: '10px 18px',
                            background: 'var(--robotina-orange)',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 700,
                        }}
                    >
                        Crear Primer Cupón
                    </Link>
                }
            />
        </div>
    );
}
