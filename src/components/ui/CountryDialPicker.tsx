'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';

export interface CountryDialItem {
    iso: string;
    name: string;
    dial: string;
}

export const COUNTRY_DIAL_CODES: CountryDialItem[] = [
    { iso: 'pe', name: 'Perú', dial: '+51' },
    { iso: 'cl', name: 'Chile', dial: '+56' },
    { iso: 'co', name: 'Colombia', dial: '+57' },
    { iso: 'ec', name: 'Ecuador', dial: '+593' },
    { iso: 'bo', name: 'Bolivia', dial: '+591' },
    { iso: 'ar', name: 'Argentina', dial: '+54' },
    { iso: 'mx', name: 'México', dial: '+52' },
    { iso: 'us', name: 'Estados Unidos', dial: '+1' },
    { iso: 'es', name: 'España', dial: '+34' },
    { iso: 'br', name: 'Brasil', dial: '+55' },
    { iso: 'uy', name: 'Uruguay', dial: '+598' },
    { iso: 'py', name: 'Paraguay', dial: '+595' },
    { iso: 've', name: 'Venezuela', dial: '+58' },
    { iso: 'pa', name: 'Panamá', dial: '+507' },
    { iso: 'cr', name: 'Costa Rica', dial: '+506' },
    { iso: 'gt', name: 'Guatemala', dial: '+502' },
    { iso: 'sv', name: 'El Salvador', dial: '+503' },
    { iso: 'hn', name: 'Honduras', dial: '+504' },
    { iso: 'ni', name: 'Nicaragua', dial: '+505' },
    { iso: 'do', name: 'Rep. Dominicana', dial: '+1' },
    { iso: 'ca', name: 'Canadá', dial: '+1' },
    { iso: 'it', name: 'Italia', dial: '+39' },
    { iso: 'fr', name: 'Francia', dial: '+33' },
    { iso: 'de', name: 'Alemania', dial: '+49' },
    { iso: 'gb', name: 'Reino Unido', dial: '+44' },
];

interface CountryDialPickerProps {
    value: string;
    onChange: (dial: string) => void;
    className?: string;
    compact?: boolean;
}

export default function CountryDialPicker({
    value,
    onChange,
    className,
    compact = false,
}: CountryDialPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    const current = useMemo(() => {
        return COUNTRY_DIAL_CODES.find(c => c.dial === value) || COUNTRY_DIAL_CODES[0];
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return COUNTRY_DIAL_CODES;
        return COUNTRY_DIAL_CODES.filter(
            c => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.iso.includes(q)
        );
    }, [search]);

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} className={className}>
            <button
                type="button"
                onClick={() => {
                    setOpen(prev => !prev);
                    setSearch('');
                }}
                title={`Prefijo telefónico: ${current.name} (${current.dial})`}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: compact ? '6px' : '8px',
                    height: '48px',
                    padding: compact ? '0 10px' : '0 14px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--glass-border, #e2e8f0)',
                    background: 'var(--card-bg, #ffffff)',
                    color: 'var(--foreground, #0f172a)',
                    cursor: 'pointer',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    outline: 'none',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
            >
                {/* Real Country Flag from FlagCDN */}
                <img
                    src={`https://flagcdn.com/w40/${current.iso}.png`}
                    alt={current.name}
                    width={20}
                    height={14}
                    style={{
                        width: '20px',
                        height: '14px',
                        objectFit: 'cover',
                        borderRadius: '3px',
                        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.15)',
                        flexShrink: 0,
                    }}
                />
                <span style={{ letterSpacing: '0.2px' }}>{current.dial}</span>
                <span
                    style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted, #64748b)',
                        transform: open ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    ▼
                </span>
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        width: '270px',
                        maxHeight: '280px',
                        background: 'var(--card-bg, #ffffff)',
                        border: '1.5px solid var(--structural-border, var(--glass-border, #e2e8f0))',
                        borderRadius: '12px',
                        boxShadow: '0 14px 35px rgba(0, 0, 0, 0.18)',
                        zIndex: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.15s ease-out',
                    }}
                >
                    {/* Search bar inside dropdown */}
                    <div
                        style={{
                            padding: '8px 10px',
                            borderBottom: '1px solid var(--glass-border, #e2e8f0)',
                            background: 'var(--background, #f8fafc)',
                        }}
                    >
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar país o prefijo (+51)..."
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                fontSize: '0.82rem',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border, #e2e8f0)',
                                background: 'var(--card-bg, #ffffff)',
                                color: 'var(--foreground, #0f172a)',
                                outline: 'none',
                            }}
                        />
                    </div>

                    {/* Scrollable list */}
                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                        {filtered.length === 0 ? (
                            <div
                                style={{
                                    padding: '16px',
                                    textAlign: 'center',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted, #64748b)',
                                }}
                            >
                                No se encontraron países
                            </div>
                        ) : (
                            filtered.map(c => {
                                const isSelected = c.dial === current.dial && c.iso === current.iso;
                                return (
                                    <button
                                        key={c.iso}
                                        type="button"
                                        onClick={() => {
                                            onChange(c.dial);
                                            setOpen(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            padding: '8px 12px',
                                            border: 'none',
                                            background: isSelected
                                                ? 'rgba(255, 107, 0, 0.12)'
                                                : 'transparent',
                                            color: isSelected
                                                ? 'var(--robotina-orange, #ff6b00)'
                                                : 'var(--foreground, #0f172a)',
                                            cursor: 'pointer',
                                            fontSize: '0.84rem',
                                            fontWeight: isSelected ? 800 : 500,
                                            textAlign: 'left',
                                            transition: 'background 0.15s ease',
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <img
                                            src={`https://flagcdn.com/w40/${c.iso}.png`}
                                            alt={c.name}
                                            width={18}
                                            height={12}
                                            style={{
                                                width: '18px',
                                                height: '12px',
                                                objectFit: 'cover',
                                                borderRadius: '2px',
                                                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {c.name}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                color: isSelected ? 'var(--robotina-orange, #ff6b00)' : 'var(--text-muted, #64748b)',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {c.dial}
                                        </span>
                                        {isSelected && <span style={{ fontSize: '0.8rem' }}>✓</span>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

