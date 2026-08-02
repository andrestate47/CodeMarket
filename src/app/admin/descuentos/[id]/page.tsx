'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminEditDiscountPage() {
    return (
        <div>
            <AdminPageHeader
                title="Editar Descuento"
                description="Modifica los parámetros y límites del cupón o regla de oferta."
                action={
                    <Link
                        href="/admin/descuentos"
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
                        ← Volver a Descuentos
                    </Link>
                }
            />

            <AdminEmptyState
                icon="🎟️"
                title="Módulo preparado"
                description="La edición de reglas de descuento activas se completará en la siguiente fase de desarrollo."
            />
        </div>
    );
}
