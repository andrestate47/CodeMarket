'use client';

import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminReportsPage() {
    return (
        <div>
            <AdminPageHeader
                title="Reportes y Analítica"
                description="Métricas reales de ventas, conversión, ticket promedio y productos más vendidos."
            />

            <AdminEmptyState
                icon="📈"
                title="Módulo preparado"
                description="Los reportes avanzados y analíticas por periodo (7 días, 30 días, mes actual) se completarán en la fase correspondiente."
            />
        </div>
    );
}
