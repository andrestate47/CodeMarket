'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminNewDiscountPage() {
    return (
        <div>
            <AdminPageHeader
                title="Crear Nuevo Descuento"
                description="Configura cupones porcentuales, montos fijos o descuentos automáticos."
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
                icon="🛠️"
                title="Módulo preparado"
                description="La creación interactiva de cupones y reglas de descuento avanzadas se completará en la siguiente fase de desarrollo."
            />
        </div>
    );
}
