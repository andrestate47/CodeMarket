'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminCustomerDetailPage() {
    return (
        <div>
            <AdminPageHeader
                title="Detalle de Cliente"
                description="Perfil de comprador, historial de pedidos y direcciones guardadas."
                action={
                    <Link
                        href="/admin/clientes"
                        style={{
                            padding: '8px 14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            fontWeight: 600,
                        }}
                    >
                        ← Volver a Clientes
                    </Link>
                }
            />

            <AdminEmptyState
                icon="👥"
                title="Módulo en preparación"
                description="La ficha individualizada con métricas de valor de cliente (LTV) y direcciones asociadas está en construcción."
            />
        </div>
    );
}
