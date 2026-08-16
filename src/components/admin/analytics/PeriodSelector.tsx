'use client';

import React from 'react';
import { PresetPeriod } from './salesAnalyticsUtils';

interface PeriodSelectorProps {
    preset: PresetPeriod;
    onPresetChange: (preset: PresetPeriod) => void;
    customStart: string;
    customEnd: string;
    onCustomStartChange: (val: string) => void;
    onCustomEndChange: (val: string) => void;
}

export default function PeriodSelector({
    preset,
    onPresetChange,
    customStart,
    customEnd,
    onCustomStartChange,
    onCustomEndChange,
}: PeriodSelectorProps) {
    const presetsList: { id: PresetPeriod; label: string }[] = [
        { id: 'today', label: 'Hoy' },
        { id: '7d', label: '7 días' },
        { id: '30d', label: '30 días' },
        { id: 'this_month', label: 'Este mes' },
        { id: 'custom', label: 'Personalizado' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
            {/* Presets Pills */}
            <div style={{
                display: 'inline-flex',
                background: 'var(--input-bg)',
                border: '1.5px solid var(--glass-border)',
                borderRadius: '10px',
                padding: '3px',
                gap: '3px',
                flexWrap: 'wrap',
            }}>
                {presetsList.map((p) => {
                    const isActive = preset === p.id;
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => onPresetChange(p.id)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '7px',
                                border: 'none',
                                background: isActive ? 'var(--gradient-main)' : 'transparent',
                                color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                                fontSize: '0.82rem',
                                fontWeight: isActive ? 800 : 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: isActive ? '0 2px 8px rgba(255, 107, 0, 0.3)' : 'none',
                            }}
                        >
                            {p.label}
                        </button>
                    );
                })}
            </div>

            {/* Custom Date Pickers */}
            {preset === 'custom' && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--glass-border)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Desde:</span>
                    <input
                        type="date"
                        value={customStart}
                        onChange={(e) => onCustomStartChange(e.target.value)}
                        style={{
                            padding: '4px 8px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                        }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Hasta:</span>
                    <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => onCustomEndChange(e.target.value)}
                        style={{
                            padding: '4px 8px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '6px',
                            color: 'var(--foreground)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                        }}
                    />
                </div>
            )}
        </div>
    );
}
