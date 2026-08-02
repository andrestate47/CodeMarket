'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminIntegrationsPage() {
    return (
        <div>
            <AdminPageHeader
                title="Integraciones Externa"
                description="Conecta Meta Pixel, Google Analytics, WhatsApp y herramientas de análisis."
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
                icon="🔌"
                title="Módulo preparado. Requiere configuración externa."
                description="Las tarjetas de integración (Meta Pixel, Google Tag Manager, Analytics) se completarán en la fase correspondiente."
            />
        </div>
    );
}
