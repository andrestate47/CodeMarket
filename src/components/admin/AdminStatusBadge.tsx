import React from 'react';

interface AdminStatusBadgeProps {
    status: string;
    label?: string;
}

type Tone = 'warning' | 'success' | 'info' | 'danger' | 'neutral';

const TONE_STYLES: Record<Tone, { bg: string; text: string; border: string; dot: string }> = {
    warning: {
        bg: 'rgba(245, 158, 11, 0.1)',
        text: '#d97706',
        border: 'rgba(245, 158, 11, 0.3)',
        dot: '#f59e0b',
    },
    success: {
        bg: 'rgba(22, 163, 74, 0.1)',
        text: '#16a34a',
        border: 'rgba(22, 163, 74, 0.3)',
        dot: '#16a34a',
    },
    info: {
        bg: 'rgba(37, 99, 235, 0.1)',
        text: '#2563eb',
        border: 'rgba(37, 99, 235, 0.3)',
        dot: '#2563eb',
    },
    danger: {
        bg: 'rgba(220, 38, 38, 0.1)',
        text: '#dc2626',
        border: 'rgba(220, 38, 38, 0.3)',
        dot: '#dc2626',
    },
    neutral: {
        bg: 'transparent',
        text: 'var(--foreground)',
        border: 'var(--glass-border)',
        dot: '',
    },
};

const statusConfig: Record<string, { tone: Tone; label: string }> = {
    // ESTADOS DE PEDIDO
    new: { tone: 'warning', label: 'Pendiente' },
    confirmed: { tone: 'success', label: 'Aceptado (En proceso)' },
    processing: { tone: 'info', label: 'En ruta' },
    in_route: { tone: 'info', label: 'En ruta' },
    ready: { tone: 'info', label: 'Listo' },
    completed: { tone: 'success', label: 'Entregado' },
    cancelled: { tone: 'danger', label: 'Cancelado' },

    // ESTADOS DE PAGO
    pending: { tone: 'warning', label: 'Pendiente' },
    partial: { tone: 'warning', label: 'Pago Parcial' },
    under_review: { tone: 'warning', label: 'En Revisión' },
    paid: { tone: 'success', label: 'Pagado' },
    failed: { tone: 'danger', label: 'Fallido' },
    refunded: { tone: 'danger', label: 'Reembolsado' },
    partially_refunded: { tone: 'warning', label: 'Reembolso Parcial' },

    // ESTADOS DE ENVÍO
    unfulfilled: { tone: 'warning', label: 'Pendiente' },
    preparing: { tone: 'success', label: 'En proceso' },
    shipped: { tone: 'info', label: 'En ruta' },
    delivered: { tone: 'success', label: 'Entregado' },
    fulfilled: { tone: 'success', label: 'Entregado' },
    exception: { tone: 'danger', label: 'Incidencia' },
    returned: { tone: 'danger', label: 'Devuelto' },

    // ESTADOS DE PRODUCTO
    active: { tone: 'success', label: 'Activo' },
    draft: { tone: 'neutral', label: 'Apagado' },

    // CANALES (Neutro empresarial en blanco y negro para no saturar de color la tabla)
    online_store: { tone: 'neutral', label: 'Tienda Online' },
    manual: { tone: 'neutral', label: 'Manual' },
    whatsapp: { tone: 'neutral', label: 'WhatsApp' },
    instagram: { tone: 'neutral', label: 'Instagram' },
    facebook: { tone: 'neutral', label: 'Facebook' },
    phone: { tone: 'neutral', label: 'Teléfono' },
    pos: { tone: 'neutral', label: 'Presencial' },
    other: { tone: 'neutral', label: 'Otro' },
};

export default function AdminStatusBadge({ status, label }: AdminStatusBadgeProps) {
    const key = (status || '').toLowerCase().trim();
    const config = statusConfig[key] || {
        tone: 'neutral' as Tone,
        label: status || 'General',
    };
    const style = TONE_STYLES[config.tone];

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 700,
            background: style.bg,
            color: style.text,
            border: `1px solid ${style.border}`,
            whiteSpace: 'nowrap',
        }}>
            {style.dot && (
                <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: style.dot,
                    flexShrink: 0,
                }} />
            )}
            {label || config.label}
        </span>
    );
}
