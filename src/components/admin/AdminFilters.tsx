'use client';

import React from 'react';

interface AdminFiltersProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;
    filterOptions?: { label: string; value: string }[];
    selectedFilter?: string;
    onFilterChange?: (value: string) => void;
    children?: React.ReactNode;
}

export default function AdminFilters({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Buscar...',
    filterOptions,
    selectedFilter,
    onFilterChange,
    children,
}: AdminFiltersProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '20px',
                flexWrap: 'wrap',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                <div
                    style={{
                        position: 'relative',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            left: '14px',
                            color: 'var(--text-muted)',
                            fontSize: '0.9rem',
                            pointerEvents: 'none',
                        }}
                    >
                        🔍
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 38px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '10px',
                            color: 'var(--input-text)',
                            fontSize: '0.88rem',
                            outline: 'none',
                        }}
                    />
                </div>

                {filterOptions && onFilterChange && (
                    <select
                        value={selectedFilter || ''}
                        onChange={(e) => onFilterChange(e.target.value)}
                        style={{
                            padding: '10px 14px',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '10px',
                            color: 'var(--input-text)',
                            fontSize: '0.88rem',
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {filterOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {children && <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{children}</div>}
        </div>
    );
}
