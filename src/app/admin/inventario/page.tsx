'use client';

import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminInventoryPage() {
    return (
        <div>
            <AdminPageHeader
                title="Control de Inventario"
                description="Monitoreo de movimientos de stock, alertas de agotado y ajustes rápidos."
            />

            <AdminEmptyState
                icon="🏬"
                title="Módulo en preparación"
                description="La vista de auditoría de movimientos de almacén e historial de reabastecimiento estará lista en la siguiente entrega."
            />
        </div>
    );
}
