import React from 'react';

interface AdminStatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: string;
    trend?: string;
    accentColor?: string;
    compact?: boolean;
}

export default function AdminStatCard({
    title,
    value,
    icon,
    subtitle,
    trend,
    accentColor = '#ff6b00',
    compact = true,
}: AdminStatCardProps) {
    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1.5px solid var(--glass-border)',
            borderRadius: '14px',
            padding: compact ? '12px 14px' : '18px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'var(--transition)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: compact ? '0.76rem' : '0.84rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
                <div style={{
                    width: compact ? '30px' : '36px',
                    height: compact ? '30px' : '36px',
                    minWidth: compact ? '30px' : '36px',
                    borderRadius: '8px',
                    background: `${accentColor}18`,
                    border: `1px solid ${accentColor}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: compact ? '0.95rem' : '1.1rem',
                }}>
                    {icon}
                </div>
            </div>

            <div style={{ fontSize: compact ? '1.25rem' : '1.6rem', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value}
            </div>

            {(subtitle || trend) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: compact ? '0.72rem' : '0.78rem', color: 'var(--text-description)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {trend && <span style={{ color: '#22c55e', fontWeight: 700 }}>{trend}</span>}
                    {subtitle && <span>{subtitle}</span>}
                </div>
            )}
        </div>
    );
}
