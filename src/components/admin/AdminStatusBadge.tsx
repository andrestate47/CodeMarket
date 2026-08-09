import React from 'react';

interface AdminStatusBadgeProps {
    status: string;
    label?: string;
}

const statusConfig: Record<string, { bg: string; color: string; border: string; label: string }> = {
    // ESTADOS DE PEDIDO
    new: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)', label: 'Nuevo' },
    confirmed: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(52, 211, 153, 0.3)', label: 'Confirmado' },
    processing: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)', label: 'Preparando' },
    ready: { bg: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', border: 'rgba(34, 211, 238, 0.3)', label: 'Listo' },
    completed: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(74, 222, 128, 0.3)', label: 'Completado' },
    cancelled: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(248, 113, 113, 0.3)', label: 'Cancelado' },

    // ESTADOS DE PAGO
    pending: { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(250, 204, 21, 0.3)', label: 'Pendiente' },
    partial: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)', label: 'Pago Parcial' },
    under_review: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(192, 132, 252, 0.3)', label: 'En Revisión' },
    paid: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(74, 222, 128, 0.3)', label: 'Pagado' },
    failed: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(248, 113, 113, 0.3)', label: 'Fallido' },
    refunded: { bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'rgba(203, 213, 225, 0.3)', label: 'Reembolsado' },
    partially_refunded: { bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'rgba(203, 213, 225, 0.3)', label: 'Reembolso Parcial' },

    // ESTADOS DE ENVÍO
    unfulfilled: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(251, 146, 60, 0.3)', label: 'Sin Enviar' },
    preparing: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)', label: 'Preparando' },
    shipped: { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(96, 165, 250, 0.3)', label: 'En Tránsito' },
    delivered: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(74, 222, 128, 0.3)', label: 'Entregado' },
    fulfilled: { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: 'rgba(74, 222, 128, 0.3)', label: 'Entregado' },
    exception: { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(248, 113, 113, 0.3)', label: 'Incidencia' },
    returned: { bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(192, 132, 252, 0.3)', label: 'Devuelto' },

    // CANALES
    online_store: { bg: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd', border: 'rgba(147, 197, 253, 0.25)', label: 'Tienda Online' },
    manual: { bg: 'rgba(107, 114, 128, 0.15)', color: '#d1d5db', border: 'rgba(209, 213, 219, 0.25)', label: 'Manual' },
    whatsapp: { bg: 'rgba(34, 197, 94, 0.15)', color: '#86efac', border: 'rgba(134, 239, 172, 0.3)', label: 'WhatsApp' },
    instagram: { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: 'rgba(244, 114, 182, 0.3)', label: 'Instagram' },
    facebook: { bg: 'rgba(37, 99, 235, 0.15)', color: '#93c5fd', border: 'rgba(147, 197, 253, 0.3)', label: 'Facebook' },
    phone: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: 'rgba(252, 211, 77, 0.3)', label: 'Teléfono' },
    pos: { bg: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: 'rgba(110, 231, 183, 0.3)', label: 'Presencial' },
    other: { bg: 'rgba(107, 114, 128, 0.15)', color: '#d1d5db', border: 'rgba(209, 213, 219, 0.25)', label: 'Otro' },
};

export default function AdminStatusBadge({ status, label }: AdminStatusBadgeProps) {
    const key = (status || '').toLowerCase().trim();
    const config = statusConfig[key] || {
        bg: 'rgba(255, 255, 255, 0.08)',
        color: '#e4e4e7',
        border: 'rgba(255, 255, 255, 0.15)',
        label: status || 'General',
    };

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 700,
            background: config.bg,
            color: config.color,
            border: `1px solid ${config.border}`,
            whiteSpace: 'nowrap',
        }}>
            {label || config.label}
        </span>
    );
}

