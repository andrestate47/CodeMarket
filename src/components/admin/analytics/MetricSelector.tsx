'use client';

import React from 'react';
import { MetricType } from './salesAnalyticsUtils';

interface MetricSelectorProps {
    activeMetric: MetricType;
    onMetricChange: (metric: MetricType) => void;
}

export default function MetricSelector({ activeMetric, onMetricChange }: MetricSelectorProps) {
    const metrics: { id: MetricType; label: string; icon: string }[] = [
        { id: 'sales', label: 'Ventas', icon: '💵' },
        { id: 'orders', label: 'Pedidos', icon: '📦' },
        { id: 'avg_ticket', label: 'Ticket promedio', icon: '📊' },
        { id: 'refunds', label: 'Reembolsos', icon: '🔄' },
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Métrica:
            </span>

            <div style={{
                display: 'inline-flex',
                background: 'var(--input-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '3px',
                gap: '3px',
            }}>
                {metrics.map((m) => {
                    const isActive = activeMetric === m.id;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => onMetricChange(m.id)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: '7px',
                                border: 'none',
                                background: isActive ? 'var(--card-bg)' : 'transparent',
                                color: isActive ? 'var(--robotina-orange)' : 'var(--text-muted)',
                                fontSize: '0.82rem',
                                fontWeight: isActive ? 800 : 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            <span>{m.icon}</span>
                            <span>{m.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
