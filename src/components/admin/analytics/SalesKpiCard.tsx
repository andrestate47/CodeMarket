'use client';

import React from 'react';

interface SalesKpiCardProps {
    title: string;
    value: string;
    trendLabel?: string;
    trendType?: 'positive' | 'negative' | 'neutral' | 'new';
    subtitle?: string;
}

export default function SalesKpiCard({
    title,
    value,
    trendLabel,
    trendType = 'neutral',
    subtitle = 'vs período anterior',
}: SalesKpiCardProps) {
    const getTrendStyle = () => {
        if (trendType === 'positive') {
            return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.25)' };
        }
        if (trendType === 'negative') {
            return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' };
        }
        if (trendType === 'new') {
            return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' };
        }
        return { color: 'var(--text-muted)', bg: 'var(--input-bg)', border: 'var(--glass-border)' };
    };

    const trendStyle = getTrendStyle();

    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1.5px solid var(--glass-border)',
            borderRadius: '14px',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
        }}>
            <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
            }}>
                {title}
            </span>

            <div style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: 'var(--foreground)',
                letterSpacing: '-0.3px',
                lineHeight: 1.1,
            }}>
                {value}
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                flexWrap: 'wrap',
            }}>
                {trendLabel && (
                    <span style={{
                        color: trendStyle.color,
                        background: trendStyle.bg,
                        border: `1px solid ${trendStyle.border}`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                    }}>
                        {trendLabel}
                    </span>
                )}
                {subtitle && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontWeight: 600 }}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );
}
