'use client';

import React from 'react';
import Link from 'next/link';

export default function EmptySalesState() {
    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1.5px dashed var(--glass-border)',
            borderRadius: '16px',
            padding: '28px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '16px',
        }}>
            <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(255, 107, 0, 0.1)',
                border: '1px solid rgba(255, 107, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
            }}>
                📊
            </div>

            <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--foreground)' }}>
                    Aún no hay ventas en este período
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '420px' }}>
                    Cuando registres tus primeros pedidos pagados, aquí podrás ver la evolución de tus ventas.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                <Link
                    href="/admin/pedidos"
                    style={{
                        padding: '8px 16px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--foreground)',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                    }}
                >
                    Ver pedidos
                </Link>

                <Link
                    href="/admin/pedidos/nuevo"
                    style={{
                        padding: '8px 16px',
                        background: 'var(--gradient-main)',
                        color: '#FFFFFF',
                        borderRadius: '8px',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(255, 107, 0, 0.3)',
                    }}
                >
                    + Pedido manual
                </Link>
            </div>
        </div>
    );
}
