import React from 'react';

interface AdminStatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    trend?: string;
    accentColor?: string;
}

export default function AdminStatCard({
    title,
    value,
    icon,
    subtitle,
    trend,
    accentColor = '#ff6b00',
}: AdminStatCardProps) {
    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'var(--transition)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>{title}</span>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: `${accentColor}18`,
                    border: `1px solid ${accentColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                }}>
                    {icon}
                </div>
            </div>

            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px' }}>
                {value}
            </div>

            {(subtitle || trend) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-description)' }}>
                    {trend && <span style={{ color: '#22c55e', fontWeight: 600 }}>{trend}</span>}
                    {subtitle && <span>{subtitle}</span>}
                </div>
            )}
        </div>
    );
}
