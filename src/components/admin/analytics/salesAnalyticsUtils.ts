export type PresetPeriod = 'today' | '7d' | '30d' | 'this_month' | 'custom';
export type MetricType = 'sales' | 'orders' | 'avg_ticket' | 'refunds';

export interface RawOrderRecord {
    id: string;
    order_number: string;
    total_amount: number;
    paid_amount?: number;
    payment_status: string;
    created_at: string;
    store_id?: string;
}

export interface DailyAnalyticsPoint {
    dateKey: string;     // YYYY-MM-DD in America/Lima
    dateLabel: string;   // e.g. "14 Ago" or "14/08"
    fullDateLabel: string; // e.g. "14 agosto 2026"
    grossSales: number;
    refunds: number;
    netSales: number;
    paidOrdersCount: number;
    avgTicket: number;
}

export interface PeriodComparison {
    currentVal: number;
    prevVal: number;
    percentChange: number | null;
    trendLabel: string;
    trendType: 'positive' | 'negative' | 'neutral' | 'new';
}

/**
 * Converts UTC timestamp or Date object into YYYY-MM-DD date key in America/Lima (UTC-5) timezone
 */
export function getLimaDateKey(dateInput: string | Date): string {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);

    // Format using Intl in America/Lima
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(d); // Returns YYYY-MM-DD
}

/**
 * Formats a YYYY-MM-DD date key into clean Spanish label e.g. "14 Ago"
 */
export function formatShortDateLabel(dateKey: string): string {
    const parts = dateKey.split('-');
    if (parts.length !== 3) return dateKey;
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = Number(parts[2]);
    const month = monthNames[dateObj.getMonth()];
    return `${day} ${month}`;
}

/**
 * Formats a YYYY-MM-DD date key into full Spanish label e.g. "14 agosto 2026"
 */
export function formatFullDateLabel(dateKey: string): string {
    const parts = dateKey.split('-');
    if (parts.length !== 3) return dateKey;
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    const monthNamesFull = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const day = Number(parts[2]);
    const month = monthNamesFull[dateObj.getMonth()];
    const year = parts[0];
    return `${day} ${month} ${year}`;
}

/**
 * Gets start and end Date objects for a preset period in America/Lima
 */
export function getPeriodRange(preset: PresetPeriod, customStart?: string, customEnd?: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    // Get today's YYYY-MM-DD in Lima
    const todayLimaStr = getLimaDateKey(now);
    const parts = todayLimaStr.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    const endOfToday = new Date(year, month, day, 23, 59, 59, 999);

    if (preset === 'today') {
        const startOfToday = new Date(year, month, day, 0, 0, 0, 0);
        return { startDate: startOfToday, endDate: endOfToday };
    }

    if (preset === '7d') {
        const start = new Date(year, month, day - 6, 0, 0, 0, 0);
        return { startDate: start, endDate: endOfToday };
    }

    if (preset === '30d') {
        const start = new Date(year, month, day - 29, 0, 0, 0, 0);
        return { startDate: start, endDate: endOfToday };
    }

    if (preset === 'this_month') {
        const start = new Date(year, month, 1, 0, 0, 0, 0);
        return { startDate: start, endDate: endOfToday };
    }

    if (preset === 'custom' && customStart && customEnd) {
        const pStart = customStart.split('-');
        const pEnd = customEnd.split('-');
        const start = new Date(Number(pStart[0]), Number(pStart[1]) - 1, Number(pStart[2]), 0, 0, 0, 0);
        const end = new Date(Number(pEnd[0]), Number(pEnd[1]) - 1, Number(pEnd[2]), 23, 59, 59, 999);
        return { startDate: start, endDate: end };
    }

    // Default fallback to 30d
    const defaultStart = new Date(year, month, day - 29, 0, 0, 0, 0);
    return { startDate: defaultStart, endDate: endOfToday };
}

/**
 * Calculates immediately preceding period range of exact equal duration
 */
export function getPreviousPeriodRange(startDate: Date, endDate: Date): { prevStartDate: Date; prevEndDate: Date } {
    const diffMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - diffMs);
    return { prevStartDate, prevEndDate };
}

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';

/**
 * Determines granularity automatically based on period preset or custom date diff
 */
export function getGranularity(preset: PresetPeriod, startDate: Date, endDate: Date): TimeGranularity {
    if (preset === 'today') return 'hour';
    if (preset === '7d' || preset === '30d' || preset === 'this_month') return 'day';

    const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays <= 31) return 'day';
    if (diffDays <= 120) return 'week';
    return 'month';
}

/**
 * Returns dynamic average line label based on granularity and active metric
 */
export function getAverageLabel(granularity: TimeGranularity, metric: MetricType): string {
    const isTicket = metric === 'avg_ticket';

    if (granularity === 'hour') {
        if (isTicket) return 'Ticket promedio por franja';
        return 'Promedio por franja';
    }
    if (granularity === 'week') {
        if (isTicket) return 'Ticket promedio semanal';
        return 'Promedio semanal';
    }
    if (granularity === 'month') {
        if (isTicket) return 'Ticket promedio mensual';
        return 'Promedio mensual';
    }

    if (isTicket) return 'Ticket promedio diario';
    return 'Promedio diario';
}

/**
 * Safe percentage comparison vs previous period with exact rules for zero cases.
 */
export function calculateComparison(currentVal: number, prevVal: number): PeriodComparison {
    if (prevVal <= 0 && currentVal > 0) {
        return {
            currentVal,
            prevVal,
            percentChange: null,
            trendLabel: 'Nuevo',
            trendType: 'new',
        };
    }

    if (prevVal > 0 && currentVal === 0) {
        return {
            currentVal,
            prevVal,
            percentChange: -100,
            trendLabel: '↓ 100%',
            trendType: 'negative',
        };
    }

    if (prevVal <= 0 && currentVal <= 0) {
        return {
            currentVal,
            prevVal,
            percentChange: 0,
            trendLabel: 'Sin cambios',
            trendType: 'neutral',
        };
    }

    const pct = ((currentVal - prevVal) / prevVal) * 100;
    const rounded = Math.round(Math.abs(pct) * 10) / 10;
    const isPositive = pct >= 0;

    return {
        currentVal,
        prevVal,
        percentChange: pct,
        trendLabel: `${isPositive ? '↑' : '↓'} ${rounded} %`,
        trendType: isPositive ? 'positive' : 'negative',
    };
}

/**
 * Calculates dynamic Y axis ceiling based on data max value and metric type
 */
export function calculateDynamicYMax(maxVal: number, isOrdersMetric: boolean = false): number {
    if (maxVal <= 0) return isOrdersMetric ? 5 : 100;
    const withMargin = maxVal * 1.15; // 15% top margin

    if (isOrdersMetric) {
        return Math.max(Math.ceil(withMargin), 5);
    }

    if (withMargin <= 50) return 50;
    if (withMargin <= 100) return 100;
    if (withMargin <= 250) return 250;
    if (withMargin <= 500) return 500;
    if (withMargin <= 1000) return 1000;
    if (withMargin <= 2500) return 2500;
    if (withMargin <= 5000) return 5000;
    if (withMargin <= 10000) return 10000;
    if (withMargin <= 25000) return 25000;
    if (withMargin <= 50000) return 50000;

    return Math.ceil(withMargin / 1000) * 1000;
}

/**
 * Generates realistic sample sales orders for preview / demo mode in development environment only
 */
export function generateDemoSalesOrders(): RawOrderRecord[] {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
        return [];
    }
    const demo: RawOrderRecord[] = [];
    const now = new Date();

    // Past 60 days
    for (let i = 0; i < 60; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

        if (i === 0) {
            // TODAY: Create 4 realistic paid sales at different hours today
            const hours = [8, 11, 14, 18];
            const amounts = [120, 85, 180, 140];

            hours.forEach((hr, idx) => {
                const orderDate = new Date(date);
                orderDate.setHours(hr, 15, 0, 0);

                demo.push({
                    id: `demo-today-order-${idx}`,
                    order_number: `ORD-HOY-${100 + idx}`,
                    total_amount: amounts[idx],
                    paid_amount: amounts[idx],
                    payment_status: 'paid',
                    created_at: orderDate.toISOString(),
                });
            });
            continue;
        }

        // Vary order count by day (some days 0, some days 1-4)
        if (i % 6 === 0) continue; // rest day

        const count = i % 5 === 0 ? 4 : i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1;

        for (let j = 0; j < count; j++) {
            const isRefunded = i === 14 && j === 0;
            const isPeakDay = i === 2; // Best day
            const amount = isPeakDay ? 670 : Math.floor(Math.random() * 120) + 45;

            demo.push({
                id: `demo-sales-order-${i}-${j}`,
                order_number: `ORD-${4000 + i * 10 + j}`,
                total_amount: amount,
                paid_amount: isRefunded ? 0 : amount,
                payment_status: isRefunded ? 'refunded' : 'paid',
                created_at: date.toISOString(),
            });
        }
    }

    return demo;
}
