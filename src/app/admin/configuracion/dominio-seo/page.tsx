'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminDomainSeoPage() {
    return (
        <div>
            <AdminPageHeader
                title="Dominio y SEO"
                description="Configura el nombre SEO, meta descripciones, favicon y preparación de dominio propio."
                action={
                    <Link
                        href="/admin/configuracion"
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
                        ← Volver a Configuración
                    </Link>
                }
            />

            <AdminEmptyState
                icon="🌐"
                title="Módulo preparado"
                description="La configuración de dominio propio y optimización SEO se completará en la fase correspondiente."
            />
        </div>
    );
}
