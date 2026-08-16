'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CustomerOption {
    id: string;
    name: string;
    email: string;
    phone?: string;
    document_type?: string;
    document_number?: string;
    address_line?: string;
    district?: string;
    province?: string;
    department?: string;
    reference?: string;
}

interface CustomerSearchAutocompleteProps {
    onSelectCustomer: (customer: CustomerOption) => void;
    selectedCustomer: CustomerOption | null;
    onClearSelected: () => void;
    onCreateNewCustomerClick?: (suggestedName?: string) => void;
    onApplyKnownAddress?: (customer: CustomerOption) => void;
    hasKnownAddress?: boolean;
    placeholder?: string;
    label?: string;
}

export default function CustomerSearchAutocomplete({
    onSelectCustomer,
    selectedCustomer,
    onClearSelected,
    onCreateNewCustomerClick,
    onApplyKnownAddress,
    hasKnownAddress = false,
    placeholder = 'Buscar cliente por nombre, DNI/RUC, teléfono o email...',
    label = 'Buscar Cliente Existente',
}: CustomerSearchAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CustomerOption[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Perform debounced live prediction search
    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setResults([]);
            setIsOpen(false);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setIsOpen(true);

        const timer = setTimeout(async () => {
            try {
                // Search across name, email, phone, and document_number
                const { data, error } = await supabase
                    .from('customers')
                    .select('*')
                    .or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,document_number.ilike.%${trimmed}%`)
                    .limit(7);

                if (error) {
                    console.error('Error buscando clientes:', error);
                    setResults([]);
                } else {
                    setResults(data || []);
                    setActiveIndex(-1);
                }
            } catch (err) {
                console.error('Error al realizar búsqueda de clientes:', err);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [query]);

    // Handle Keyboard Navigation (ArrowUp, ArrowDown, Enter, Esc)
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                setIsOpen(true);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < results.length) {
                handleSelect(results[activeIndex]);
            } else if (results.length > 0) {
                handleSelect(results[0]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const handleSelect = (customer: CustomerOption) => {
        onSelectCustomer(customer);
        setQuery('');
        setIsOpen(false);
        setResults([]);
    };

    const handleClearInput = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
        inputRef.current?.focus();
    };

    // Helper to highlight matching text in predictions
    const renderHighlightedText = (text: string | undefined, searchQuery: string) => {
        if (!text) return null;
        if (!searchQuery.trim()) return <span>{text}</span>;

        const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return (
            <span>
                {parts.map((part, idx) =>
                    regex.test(part) ? (
                        <mark
                            key={idx}
                            style={{
                                background: 'rgba(249, 115, 22, 0.25)',
                                color: '#f97316',
                                fontWeight: 800,
                                padding: '0 2px',
                                borderRadius: '3px',
                            }}
                        >
                            {part}
                        </mark>
                    ) : (
                        <span key={idx}>{part}</span>
                    )
                )}
            </span>
        );
    };

    // Determine why a result matched for pill tag
    const getMatchReasonBadge = (c: CustomerOption, q: string) => {
        const lowerQ = q.toLowerCase();
        if (c.document_number && c.document_number.toLowerCase().includes(lowerQ)) {
            return <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', borderRadius: '4px', fontWeight: 700 }}>🆔 Documento</span>;
        }
        if (c.phone && c.phone.toLowerCase().includes(lowerQ)) {
            return <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', borderRadius: '4px', fontWeight: 700 }}>📞 Teléfono</span>;
        }
        if (c.email && c.email.toLowerCase().includes(lowerQ)) {
            return <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', borderRadius: '4px', fontWeight: 700 }}>✉️ Email</span>;
        }
        return <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(249, 115, 22, 0.15)', color: '#f97316', borderRadius: '4px', fontWeight: 700 }}>👤 Nombre</span>;
    };

    return (
        <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
            {/* Selected Customer View */}
            {selectedCustomer ? (
                <div
                    style={{
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)',
                        border: '1.5px solid rgba(34, 197, 94, 0.4)',
                        borderRadius: '14px',
                        padding: '16px 20px',
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: '0 4px 16px rgba(34, 197, 94, 0.08)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                flexShrink: 0,
                            }}
                        >
                            {(selectedCustomer.name || 'C').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span
                                    style={{
                                        fontSize: '0.72rem',
                                        background: '#10b981',
                                        color: 'white',
                                        fontWeight: 800,
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        letterSpacing: '0.5px',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    ✓ Cliente Seleccionado
                                </span>
                                {selectedCustomer.document_number && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                                        {selectedCustomer.document_type || 'DOC'}: {selectedCustomer.document_number}
                                    </span>
                                )}
                            </div>
                            <div style={{ fontWeight: 800, color: 'var(--foreground)', fontSize: '1.05rem', marginTop: '4px' }}>
                                {selectedCustomer.name}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '2px', flexWrap: 'wrap' }}>
                                {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                                {selectedCustomer.email && <span>✉️ {selectedCustomer.email}</span>}
                                {(selectedCustomer.district || selectedCustomer.province) && (
                                    <span>📍 {selectedCustomer.district || selectedCustomer.province}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {hasKnownAddress && onApplyKnownAddress && (
                            <button
                                type="button"
                                onClick={() => onApplyKnownAddress(selectedCustomer)}
                                style={{
                                    padding: '8px 14px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                }}
                            >
                                📍 Usar dirección habitual
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClearSelected}
                            style={{
                                padding: '8px 14px',
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1.5px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                borderRadius: '8px',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            🔄 Cambiar cliente
                        </button>
                    </div>
                </div>
            ) : (
                /* Search Box Input with Lupita Icon and Predictive Dropdown */
                <div style={{ marginBottom: '14px' }}>
                    {label && (
                        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span>🔍 {label}</span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                Escribe para predicción activa
                            </span>
                        </label>
                    )}

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        {/* Lupita 🔍 Icon */}
                        <div
                            style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: query ? 'var(--robotina-orange)' : 'var(--text-muted)',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>

                        {/* Input Field */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => {
                                if (query.trim() && results.length > 0) setIsOpen(true);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            style={{
                                width: '100%',
                                padding: '12px 42px 12px 44px',
                                background: 'var(--input-bg)',
                                border: isOpen ? '1.5px solid var(--robotina-orange)' : '1.5px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'var(--input-text)',
                                fontSize: '0.92rem',
                                fontWeight: 500,
                                outline: 'none',
                                boxShadow: isOpen ? '0 0 0 3px rgba(249, 115, 22, 0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s ease',
                            }}
                        />

                        {/* Right side controls: Loading spinner or Clear (✕) button */}
                        <div
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            {isLoading ? (
                                <div
                                    style={{
                                        width: '18px',
                                        height: '18px',
                                        border: '2px solid rgba(249, 115, 22, 0.2)',
                                        borderTopColor: 'var(--robotina-orange)',
                                        borderRadius: '50%',
                                        animation: 'spin 0.6s linear infinite',
                                    }}
                                />
                            ) : query ? (
                                <button
                                    type="button"
                                    onClick={handleClearInput}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '22px',
                                        height: '22px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                    }}
                                >
                                    ✕
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* Active Predictive Dropdown Popover */}
                    {isOpen && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                zIndex: 60,
                                background: 'var(--card-bg)',
                                border: '1.5px solid var(--glass-border)',
                                borderRadius: '14px',
                                marginTop: '6px',
                                maxHeight: '340px',
                                overflowY: 'auto',
                                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
                                backdropFilter: 'blur(16px)',
                            }}
                        >
                            {/* Header Summary */}
                            <div
                                style={{
                                    padding: '8px 14px',
                                    background: 'var(--input-bg)',
                                    borderBottom: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.76rem',
                                    color: 'var(--text-muted)',
                                }}
                            >
                                <span>
                                    {results.length > 0
                                        ? `⚡ ${results.length} coincidencia(s) encontrada(s)`
                                        : 'Sin coincidencias'}
                                </span>
                                <span>Usa ↑ ↓ Enter para elegir</span>
                            </div>

                            {/* Predictive Results List */}
                            {results.length > 0 ? (
                                results.map((c, index) => {
                                    const isActive = index === activeIndex;
                                    return (
                                        <div
                                            key={c.id}
                                            onClick={() => handleSelect(c)}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--glass-border)',
                                                background: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                                                borderLeft: isActive ? '4px solid var(--robotina-orange)' : '4px solid transparent',
                                                transition: 'all 0.12s ease',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '12px',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {/* Customer Avatar */}
                                                <div
                                                    style={{
                                                        width: '38px',
                                                        height: '38px',
                                                        borderRadius: '50%',
                                                        background: isActive ? 'var(--robotina-orange)' : 'var(--gradient-main, #3b82f6)',
                                                        color: 'white',
                                                        fontWeight: 800,
                                                        fontSize: '0.9rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {(c.name || 'C').slice(0, 2).toUpperCase()}
                                                </div>

                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.95rem' }}>
                                                        {renderHighlightedText(c.name, query)}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                                                        {c.phone && <span>📞 {renderHighlightedText(c.phone, query)}</span>}
                                                        {c.email && <span>✉️ {renderHighlightedText(c.email, query)}</span>}
                                                        {c.document_number && <span>🆔 {c.document_type || 'DOC'}: {renderHighlightedText(c.document_number, query)}</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reason Badge */}
                                            <div>{getMatchReasonBadge(c, query)}</div>
                                        </div>
                                    );
                                })
                            ) : !isLoading ? (
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🔍</div>
                                    <div style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: '0.92rem' }}>
                                        No se encontró ningún cliente con &quot;{query}&quot;
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '14px' }}>
                                        Verifica la ortografía o registra los datos del nuevo cliente.
                                    </div>
                                    {onCreateNewCustomerClick && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsOpen(false);
                                                onCreateNewCustomerClick(query);
                                            }}
                                            style={{
                                                padding: '8px 16px',
                                                background: 'var(--robotina-orange)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '0.84rem',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ➕ Crear nuevo cliente &quot;{query}&quot;
                                        </button>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
