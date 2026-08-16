'use client';

import React from 'react';
import { DailyAnalyticsPoint, MetricType, formatFullDateLabel } from './salesAnalyticsUtils';
import { formatMoney } from '@/lib/money';

interface SalesTooltipProps {
    point: DailyAnalyticsPoint;
    x: number;
    y: number;
    containerWidth: number;
    metric?: MetricType;
}

export default function SalesTooltip({ point, x, containerWidth, metric = 'sales' }: SalesTooltipProps) {
    const fullDate = formatFullDateLabel(point.dateKey);

    const cardWidth = 220;
    let leftPos = x;
    if (leftPos < cardWidth / 2 + 10) leftPos = cardWidth / 2 + 10;
    if (leftPos > containerWidth - cardWidth / 2 - 10) leftPos = containerWidth - cardWidth / 2 - 10;

    return (
        <div
            style={{
                position: 'absolute',
                left: `${leftPos}px`,
                top: '20px',
                transform: 'translateX(-50%)',
                background: '#18181b',
                color: '#f4f4f5',
                border: '1.5px solid var(--robotina-orange)',
                borderRadius: '12px',
                padding: '12px 14px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none',
                zIndex: 20,
                width: `${cardWidth}px`,
            }}
        >
            <div style={{
                fontSize: '0.82rem',
                color: '#a1a1aa',
                fontWeight: 700,
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '6px',
                marginBottom: '8px',
            }}>
                📅 {fullDate}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.82rem' }}>
                {metric === 'orders' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 700 }}>Pedidos:</span>
                            <strong style={{ color: '#38bdf8', fontWeight: 800 }}>{point.paidOrdersCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Pagados:</span>
                            <strong style={{ color: '#22c55e', fontWeight: 700 }}>{point.paidOrdersCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Ventas:</span>
                            <strong style={{ color: 'var(--robotina-orange)', fontWeight: 800 }}>{formatMoney(point.netSales)}</strong>
                        </div>
                    </>
                ) : metric === 'avg_ticket' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 700 }}>Ticket promedio:</span>
                            <strong style={{ color: 'var(--robotina-orange)', fontWeight: 800 }}>{formatMoney(point.avgTicket)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Pedidos pagados:</span>
                            <strong style={{ color: '#38bdf8', fontWeight: 700 }}>{point.paidOrdersCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Ventas:</span>
                            <strong style={{ color: '#22c55e', fontWeight: 700 }}>{formatMoney(point.netSales)}</strong>
                        </div>
                    </>
                ) : metric === 'refunds' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 700 }}>Reembolsos:</span>
                            <strong style={{ color: '#ef4444', fontWeight: 800 }}>{formatMoney(point.refunds)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Ventas netas:</span>
                            <strong style={{ color: '#22c55e', fontWeight: 700 }}>{formatMoney(point.netSales)}</strong>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 700 }}>Ventas:</span>
                            <strong style={{ color: '#22c55e', fontWeight: 800 }}>{formatMoney(point.netSales)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Pedidos pagados:</span>
                            <strong style={{ color: '#38bdf8', fontWeight: 700 }}>{point.paidOrdersCount}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Ticket promedio:</span>
                            <strong style={{ color: 'var(--robotina-orange)', fontWeight: 700 }}>{formatMoney(point.avgTicket)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#d4d4d8', fontWeight: 500 }}>Reembolsos:</span>
                            <strong style={{ color: point.refunds > 0 ? '#ef4444' : '#a1a1aa', fontWeight: 700 }}>{formatMoney(point.refunds)}</strong>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
