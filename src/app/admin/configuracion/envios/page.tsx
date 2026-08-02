'use client';

import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminShippingSettingsPage() {
    return (
        <div>
            <AdminPageHeader
                title="Configuración de Envíos"
                description="Tarifas de despacho físico y opciones de entrega digital."
            />

            <AdminEmptyState
                icon="🚚"
                title="Módulo en preparación"
                description="La matriz de tarifas de envío por departamento o ciudad está en fase de diseño."
            />
        </div>
    );
}
