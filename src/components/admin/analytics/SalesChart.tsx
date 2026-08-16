'use client';

import React, { useState, useMemo } from 'react';
import {
    DailyAnalyticsPoint,
    MetricType,
    calculateDynamicYMax,
    formatShortDateLabel,
} from './salesAnalyticsUtils';
import { formatMoney } from '@/lib/money';
import SalesTooltip from './SalesTooltip';

interface SalesChartProps {
    data: DailyAnalyticsPoint[];
    metric: MetricType;
    periodAverage: number;
    height?: number;
}

export default function SalesChart({
    data,
    metric,
    periodAverage,
    height = 280,
}: SalesChartProps) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    // Calculate maximum value for dynamic Y-axis scaling
    const maxVal = useMemo(() => {
        if (!data || data.length === 0) return 0;
        return Math.max(...data.map(p => {
            if (metric === 'sales') return p.netSales;
            if (metric === 'orders') return p.paidOrdersCount;
            if (metric === 'avg_ticket') return p.avgTicket;
            if (metric === 'refunds') return p.refunds;
            return p.netSales;
        }), 0);
    }, [data, metric]);

    const yMax = useMemo(() => calculateDynamicYMax(maxVal), [maxVal]);

    // Format Y tick label based on metric
    const formatYTick = (val: number): string => {
        if (metric === 'orders') return val % 1 === 0 ? `${Math.round(val)}` : val.toFixed(1);
        return formatMoney(val);
    };

    // SVG Dimensions
    const containerWidth = 800;
    const padding = { top: 25, right: 25, bottom: 40, left: 75 };
    const chartWidth = containerWidth - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const stepX = chartWidth / Math.max(data.length, 1);
    const barWidth = Math.max(Math.min(stepX * 0.55, 32), 6);

    // Position calculation for period average horizontal line
    const avgY = padding.top + chartHeight - Math.min((periodAverage / yMax), 1) * chartHeight;

    // Hovered point details
    const hoveredPoint = hoveredIdx !== null && data[hoveredIdx] ? data[hoveredIdx] : null;
    const hoveredX = hoveredIdx !== null ? padding.left + (hoveredIdx + 0.5) * stepX : 0;

    const metricLegendName = {
        sales: 'Ventas diarias',
        orders: 'Pedidos diarios',
        avg_ticket: 'Ticket promedio',
        refunds: 'Reembolsos diarios',
    }[metric];

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            background: 'var(--card-bg)',
            border: '1.5px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            marginTop: '16px',
        }}>
            {/* SVG Chart */}
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <svg
                    viewBox={`0 0 ${containerWidth} ${height}`}
                    style={{ width: '100%', height: 'auto', minWidth: '600px', display: 'block' }}
                >
                    {/* Y Gridlines and Ticks */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = padding.top + chartHeight * (1 - ratio);
                        const tickVal = yMax * ratio;
                        return (
                            <g key={ratio}>
                                <line
                                    x1={padding.left}
                                    y1={y}
                                    x2={padding.left + chartWidth}
                                    y2={y}
                                    stroke="var(--glass-border)"
                                    strokeDasharray="3 3"
                                    strokeWidth="1"
                                />
                                <text
                                    x={padding.left - 10}
                                    y={y + 4}
                                    textAnchor="end"
                                    fill="var(--text-muted)"
                                    fontSize="11"
                                    fontWeight="600"
                                >
                                    {formatYTick(tickVal)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Period Average Line */}
                    {periodAverage > 0 && (
                        <g>
                            <line
                                x1={padding.left}
                                y1={avgY}
                                x2={padding.left + chartWidth}
                                y2={avgY}
                                stroke="#FF8A00"
                                strokeWidth="1.8"
                                strokeDasharray="5 4"
                            />
                            <text
                                x={padding.left + chartWidth - 6}
                                y={avgY - 6}
                                textAnchor="end"
                                fill="#FF8A00"
                                fontSize="11"
                                fontWeight="800"
                            >
                                Promedio: {formatYTick(periodAverage)}
                            </text>
                        </g>
                    )}

                    {/* Vertical Bars */}
                    {data.map((p, idx) => {
                        const val = metric === 'sales' ? p.netSales : metric === 'orders' ? p.paidOrdersCount : metric === 'avg_ticket' ? p.avgTicket : p.refunds;
                        const barHeight = Math.min((val / yMax) * chartHeight, chartHeight);
                        const x = padding.left + idx * stepX + (stepX - barWidth) / 2;
                        const y = padding.top + chartHeight - barHeight;
                        const isHovered = hoveredIdx === idx;

                        return (
                            <g
                                key={p.dateKey}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Invisible Hover Trap */}
                                <rect
                                    x={padding.left + idx * stepX}
                                    y={padding.top}
                                    width={stepX}
                                    height={chartHeight}
                                    fill="transparent"
                                />

                                {/* Vertical Bar Rect */}
                                <rect
                                    x={x}
                                    y={val > 0 ? y : padding.top + chartHeight - 2}
                                    width={barWidth}
                                    height={val > 0 ? Math.max(barHeight, 3) : 2}
                                    rx="3"
                                    ry="3"
                                    fill={val > 0 ? (isHovered ? '#FF8A00' : 'var(--robotina-orange)') : 'var(--glass-border)'}
                                    style={{ transition: 'all 0.15s ease' }}
                                />

                                {/* X-Axis Date Label */}
                                {(idx % Math.ceil(data.length / 10) === 0 || idx === data.length - 1) && (
                                    <text
                                        x={padding.left + (idx + 0.5) * stepX}
                                        y={padding.top + chartHeight + 22}
                                        textAnchor="middle"
                                        fill={isHovered ? 'var(--foreground)' : 'var(--text-muted)'}
                                        fontSize="11"
                                        fontWeight={isHovered ? '800' : '600'}
                                    >
                                        {formatShortDateLabel(p.dateKey)}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Hover Tooltip Card */}
                {hoveredPoint && (
                    <SalesTooltip
                        point={hoveredPoint}
                        x={hoveredX}
                        y={0}
                        containerWidth={containerWidth}
                    />
                )}
            </div>

            {/* Minimalist Legend */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginTop: '14px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        width: '12px',
                        height: '12px',
                        background: 'var(--robotina-orange)',
                        borderRadius: '3px',
                        display: 'inline-block',
                    }} />
                    <span>■ {metricLegendName}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        width: '14px',
                        height: '2px',
                        background: '#FF8A00',
                        borderStyle: 'dashed',
                        display: 'inline-block',
                    }} />
                    <span>─ Promedio diario</span>
                </div>
            </div>
        </div>
    );
}
