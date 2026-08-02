'use client';

import React from 'react';
import Link from 'next/link';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function AdminSettingsPage() {
    return (
        <div>
            <AdminPageHeader
                title="Configuración de la Tienda"
                description="Ajustes generales, datos fiscales, pagos y envíos de CodeMarket."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <Link
                    href="/admin/configuracion/pagos"
                    style={{
                        padding: '24px',
                        background: '#0e0e14',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        color: 'white',
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    <div style={{ fontSize: '2rem' }}>💳</div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Métodos de Pago</h3>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.88rem' }}>Configura tus cuentas Yape, Plin y transferencia bancaria.</p>
                </Link>

                <Link
                    href="/admin/configuracion/envios"
                    style={{
                        padding: '24px',
                        background: '#0e0e14',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '16px',
                        color: 'white',
                        textDecoration: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    <div style={{ fontSize: '2rem' }}>🚚</div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Envíos y Entregas</h3>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.88rem' }}>Tarifas de envío por zona y opciones de entrega digital.</p>
                </Link>
            </div>
        </div>
    );
}
