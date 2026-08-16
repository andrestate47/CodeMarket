'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PresetPeriod, MetricType, getLimaDateKey, getGranularity, getPeriodRange } from './salesAnalyticsUtils';
import { DashboardMetrics, getDashboardMetrics } from '@/lib/services/dashboardService';

import PeriodSelector from './PeriodSelector';
import MetricSelector from './MetricSelector';
import SalesChart from './SalesChart';
import EmptySalesState from './EmptySalesState';

interface SalesPerformanceProps {
    metrics?: DashboardMetrics | null;
    loading?: boolean;
    error?: string | null;
    preset?: PresetPeriod;
    onPresetChange?: (preset: PresetPeriod) => void;
    metric?: MetricType;
    onMetricChange?: (metric: MetricType) => void;
    customStart?: string;
    customEnd?: string;
    onCustomStartChange?: (val: string) => void;
    onCustomEndChange?: (val: string) => void;
    onRetry?: () => void;
}

export default function SalesPerformance({
    metrics: propsMetrics,
    loading: propsLoading,
    error: propsError,
    preset: propsPreset,
    onPresetChange,
    metric: propsMetric,
    onMetricChange,
    customStart: propsCustomStart,
    customEnd: propsCustomEnd,
    onCustomStartChange,
    onCustomEndChange,
    onRetry,
}: SalesPerformanceProps) {
    // Internal state for uncontrolled mode
    const todayStr = useMemo(() => getLimaDateKey(new Date()), []);

    const [internalPreset, setInternalPreset] = useState<PresetPeriod>('30d');
    const [internalMetric, setInternalMetric] = useState<MetricType>('sales');
    const [internalCustomStart, setInternalCustomStart] = useState<string>(todayStr);
    const [internalCustomEnd, setInternalCustomEnd] = useState<string>(todayStr);

    const [internalMetrics, setInternalMetrics] = useState<DashboardMetrics | null>(null);
    const [internalLoading, setInternalLoading] = useState<boolean>(true);
    const [internalError, setInternalError] = useState<string | null>(null);

    const isControlled = propsMetrics !== undefined;

    const activePreset = isControlled ? (propsPreset || '30d') : internalPreset;
    const activeMetric = isControlled ? (propsMetric || 'sales') : internalMetric;
    const activeCustomStart = isControlled ? (propsCustomStart || todayStr) : internalCustomStart;
    const activeCustomEnd = isControlled ? (propsCustomEnd || todayStr) : internalCustomEnd;

    const activeMetrics = isControlled ? propsMetrics : internalMetrics;
    const activeLoading = isControlled ? Boolean(propsLoading) : internalLoading;
    const activeError = isControlled ? (propsError || null) : internalError;

    const granularity = useMemo(() => {
        const { startDate, endDate } = getPeriodRange(activePreset, activeCustomStart, activeCustomEnd);
        return getGranularity(activePreset, startDate, endDate);
    }, [activePreset, activeCustomStart, activeCustomEnd]);

    const fetchInternalMetrics = useCallback(async () => {
        if (isControlled) return;
        setInternalLoading(true);
        setInternalError(null);
        try {
            const data = await getDashboardMetrics(activePreset, activeCustomStart, activeCustomEnd);
            setInternalMetrics(data);
        } catch {
            setInternalError('No pudimos cargar los datos de ventas.');
        } finally {
            setInternalLoading(false);
        }
    }, [isControlled, activePreset, activeCustomStart, activeCustomEnd]);

    useEffect(() => {
        if (!isControlled) {
            fetchInternalMetrics();
        }
    }, [isControlled, fetchInternalMetrics]);

    const handlePresetChange = (newPreset: PresetPeriod) => {
        if (onPresetChange) onPresetChange(newPreset);
        if (!isControlled) setInternalPreset(newPreset);
    };

    const handleMetricChange = (newMetric: MetricType) => {
        if (onMetricChange) onMetricChange(newMetric);
        if (!isControlled) setInternalMetric(newMetric);
    };

    const handleCustomStartChange = (val: string) => {
        if (onCustomStartChange) onCustomStartChange(val);
        if (!isControlled) setInternalCustomStart(val);
    };

    const handleCustomEndChange = (val: string) => {
        if (onCustomEndChange) onCustomEndChange(val);
        if (!isControlled) setInternalCustomEnd(val);
    };

    const hasZeroSales = !activeMetrics || (activeMetrics.paidSales === 0 && activeMetrics.paidOrdersCount === 0);

    return (
        <div style={{ marginBottom: '32px' }}>
            {/* Top Bar Header & Period Selector */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px',
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                        Rendimiento de Ventas
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        Métricas reales de facturación pagada, pedidos y ticket promedio.
                    </p>
                </div>

                <PeriodSelector
                    preset={activePreset}
                    onPresetChange={handlePresetChange}
                    customStart={activeCustomStart}
                    customEnd={activeCustomEnd}
                    onCustomStartChange={handleCustomStartChange}
                    onCustomEndChange={handleCustomEndChange}
                />
            </div>

            {/* Error State */}
            {activeError ? (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1.5px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '16px',
                    padding: '24px',
                    textAlign: 'center',
                    color: '#ef4444',
                }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{activeError}</p>
                    <button
                        type="button"
                        onClick={onRetry || fetchInternalMetrics}
                        style={{
                            marginTop: '12px',
                            padding: '8px 18px',
                            background: '#ef4444',
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                        }}
                    >
                        🔄 Reintentar
                    </button>
                </div>
            ) : activeLoading || !activeMetrics ? (
                /* Skeleton Loader */
                <div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '14px',
                        marginBottom: '20px',
                    }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                style={{
                                    height: '90px',
                                    background: 'var(--card-bg)',
                                    borderRadius: '14px',
                                    border: '1px solid var(--glass-border)',
                                    opacity: 0.6,
                                }}
                            />
                        ))}
                    </div>
                    <div style={{
                        height: '280px',
                        background: 'var(--card-bg)',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        opacity: 0.6,
                    }} />
                </div>
            ) : (
                <>
                    {/* Metric Selector Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <MetricSelector activeMetric={activeMetric} onMetricChange={handleMetricChange} />
                    </div>

                    {/* Chart or Empty State */}
                    {hasZeroSales ? (
                        <EmptySalesState />
                    ) : (
                        <SalesChart
                            data={activeMetrics.dailyPoints}
                            metric={activeMetric}
                            periodAverage={activeMetrics.periodAverage}
                            granularity={granularity}
                            height={265}
                        />
                    )}
                </>
            )}
        </div>
    );
}
