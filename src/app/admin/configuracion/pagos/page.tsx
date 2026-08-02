'use client';

import React from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

export default function AdminPaymentSettingsPage() {
    return (
        <div>
            <AdminPageHeader
                title="Métodos de Pago"
                description="Configura los números de Yape, Plin y cuentas bancarias mostradas en el checkout."
            />

            <AdminEmptyState
                icon="💳"
                title="Módulo en preparación"
                description="El formulario para actualizar los números QR e instrucciones de transferencia bancaria estará activo próximamente."
            />
        </div>
    );
}
