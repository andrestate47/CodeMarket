import { supabase } from '@/lib/supabase';
import { minorUnitsToDecimal } from '@/lib/money';
import {
    PresetPeriod,
    DailyAnalyticsPoint,
    PeriodComparison,
    getPeriodRange,
    getPreviousPeriodRange,
    getLimaDateKey,
    formatShortDateLabel,
    calculateComparison,
    generateDemoSalesOrders,
    getGranularity,
} from '@/components/admin/analytics/salesAnalyticsUtils';

export interface PaymentMethodBreakdown {
    name: string;
    key: string;
    count: number;
    amount: number;
    percentage: number;
}

export interface SalesChannelBreakdown {
    name: string;
    key: string;
    count: number;
    amount: number;
    percentage: number;
}

export interface LowStockProductItem {
    id: string;
    name: string;
    sku: string;
    stock: number;
    threshold: number;
    variantName?: string;
}

export interface DBOrderRecord {
    id: string;
    order_number: string;
    customer_name: string;
    customer_email: string;
    total_amount: number;
    paid_amount?: number;
    payment_status: string;
    fulfillment_status: string;
    payment_method: string;
    source: string;
    created_at: string;
    currency: string;
}

export interface DashboardMetrics {
    // Current Period KPIs
    paidSales: number;            // Soles decimal
    netSales: number;             // Soles decimal
    createdOrdersCount: number;   // Total orders in period
    paidOrdersCount: number;      // Paid orders count
    averageTicket: number;        // Soles decimal
    paymentRate: number;          // Percentage (paid / created * 100)
    bestDayAmount: number;        // Soles decimal
    bestDayLabel: string;         // e.g. "14 Ago"
    totalRefunds: number;         // Soles decimal
    diffCreatedOrders: number;    // Absolute diff vs previous period
    diffPaidSales: number;        // Absolute diff vs previous period
    isDemoData: boolean;

    // Trends vs Previous Period
    paidSalesTrend: PeriodComparison;
    createdOrdersTrend: PeriodComparison;
    avgTicketTrend: PeriodComparison;
    paymentRateTrend: PeriodComparison;

    // Chart Data & Average
    dailyPoints: DailyAnalyticsPoint[];
    periodAverage: number;

    // Real Breakdowns
    paymentMethods: PaymentMethodBreakdown[];
    salesChannels: SalesChannelBreakdown[];

    // Operational Items
    lowStockProducts: LowStockProductItem[];
    lowStockCount: number;
    recentOrders: DBOrderRecord[];
}

export async function getDashboardMetrics(
    preset: PresetPeriod = 'today',
    customStart?: string,
    customEnd?: string
): Promise<DashboardMetrics> {
    const { startDate, endDate } = getPeriodRange(preset, customStart, customEnd);
    const { prevStartDate, prevEndDate } = getPreviousPeriodRange(startDate, endDate);

    let allOrders: DBOrderRecord[] = [];
    let isDemoData = false;

    try {
        const { data: localOrdersStr } = { data: null };
        const localOrders: DBOrderRecord[] = [];

        const { data: dbOrders, error } = await supabase
            .from('orders')
            .select('id, order_number, customer_name, customer_email, total_amount, paid_amount, payment_status, fulfillment_status, payment_method, source, created_at, currency')
            .order('created_at', { ascending: false })
            .limit(400);

        const toSoles = (val: number | undefined | null) => {
            if (!val) return 0;
            return Number.isInteger(val) && Math.abs(val) >= 100 ? val / 100 : val;
        };

        const dbList = (dbOrders || []).map((o) => ({
            ...o,
            total_amount: toSoles(o.total_amount),
            paid_amount: o.paid_amount ? toSoles(o.paid_amount) : toSoles(o.total_amount),
            payment_method: o.payment_method || 'yape',
            source: o.source || 'online_store',
            currency: o.currency || 'PEN',
        }));

        const localList = localOrders.map((o) => ({
            ...o,
            total_amount: toSoles(o.total_amount),
            paid_amount: o.paid_amount ? toSoles(o.paid_amount) : toSoles(o.total_amount),
            payment_method: o.payment_method || 'yape',
            source: o.source || 'online_store',
            currency: o.currency || 'PEN',
        }));

        allOrders = [...localList, ...dbList].filter(
            (ord, idx, self) => idx === self.findIndex((o) => o.id === ord.id || o.order_number === ord.order_number)
        );

        if (allOrders.length === 0) {
            const demos = generateDemoSalesOrders();
            if (demos.length > 0) {
                isDemoData = true;
                allOrders = demos.map((o) => ({
                    id: o.id,
                    order_number: o.order_number,
                    customer_name: 'Cliente Demo',
                    customer_email: 'demo@codemarket.pe',
                    total_amount: o.total_amount,
                    paid_amount: o.paid_amount,
                    payment_status: o.payment_status,
                    fulfillment_status: o.payment_status === 'paid' ? 'delivered' : 'unfulfilled',
                    payment_method: Math.random() > 0.4 ? 'yape' : Math.random() > 0.5 ? 'transfer' : 'card',
                    source: Math.random() > 0.3 ? 'online_store' : Math.random() > 0.5 ? 'whatsapp' : 'instagram',
                    created_at: o.created_at,
                    currency: 'PEN',
                }));
            }
        }
    } catch {
        const demos = generateDemoSalesOrders();
        if (demos.length > 0) {
            isDemoData = true;
            allOrders = demos.map((o) => ({
                id: o.id,
                order_number: o.order_number,
                customer_name: 'Cliente Demo',
                customer_email: 'demo@codemarket.pe',
                total_amount: o.total_amount,
                paid_amount: o.paid_amount,
                payment_status: o.payment_status,
                fulfillment_status: o.payment_status === 'paid' ? 'delivered' : 'unfulfilled',
                payment_method: 'yape',
                source: 'online_store',
                created_at: o.created_at,
                currency: 'PEN',
            }));
        }
    }

    // 2. Filter Current & Previous Period Orders
    const currentOrders = allOrders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= startDate && d <= endDate;
    });

    const prevOrders = allOrders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= prevStartDate && d <= prevEndDate;
    });

    // 3. Current Period Aggregation
    const createdOrdersCount = currentOrders.length;
    const paidOrdersList = currentOrders.filter((o) => o.payment_status === 'paid');
    const refundedOrdersList = currentOrders.filter((o) => o.payment_status === 'refunded');

    const paidOrdersCount = paidOrdersList.length;
    const paidSales = paidOrdersList.reduce((sum, o) => sum + Number(o.paid_amount || o.total_amount || 0), 0);
    const totalRefunds = refundedOrdersList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const netSales = Math.max(paidSales - totalRefunds, 0);

    const averageTicket = paidOrdersCount > 0 ? paidSales / paidOrdersCount : 0;
    const paymentRate = createdOrdersCount > 0 ? (paidOrdersCount / createdOrdersCount) * 100 : 0;

    // 4. Daily / Hourly / Weekly / Monthly Chart Points Aggregation (America/Lima)
    const dailyMap: Record<string, DailyAnalyticsPoint> = {};
    const granularity = getGranularity(preset, startDate, endDate);

    if (granularity === 'hour') {
        const hourSlots = ['04:00', '08:00', '12:00', '16:00', '20:00', '22:00'];
        hourSlots.forEach((hr) => {
            dailyMap[hr] = {
                dateKey: hr,
                dateLabel: hr,
                fullDateLabel: `Hoy ${hr} hrs`,
                grossSales: 0,
                refunds: 0,
                netSales: 0,
                paidOrdersCount: 0,
                avgTicket: 0,
            };
        });

        currentOrders.forEach((o) => {
            const d = new Date(o.created_at);
            const hrNum = d.getHours();
            let slotKey = '04:00';
            if (hrNum >= 21) slotKey = '22:00';
            else if (hrNum >= 18) slotKey = '20:00';
            else if (hrNum >= 14) slotKey = '16:00';
            else if (hrNum >= 10) slotKey = '12:00';
            else if (hrNum >= 6) slotKey = '08:00';

            const amount = Number(o.paid_amount || o.total_amount || 0);
            if (o.payment_status === 'paid') {
                dailyMap[slotKey].grossSales += amount;
                dailyMap[slotKey].paidOrdersCount += 1;
            } else if (o.payment_status === 'refunded') {
                dailyMap[slotKey].refunds += amount;
            }
        });
    } else if (granularity === 'week') {
        let curr = new Date(startDate);
        let weekIdx = 1;
        while (curr <= endDate) {
            const weekKey = `Sem ${weekIdx}`;
            dailyMap[weekKey] = {
                dateKey: weekKey,
                dateLabel: weekKey,
                fullDateLabel: `Semana ${weekIdx}`,
                grossSales: 0,
                refunds: 0,
                netSales: 0,
                paidOrdersCount: 0,
                avgTicket: 0,
            };
            curr = new Date(curr.getTime() + 7 * 24 * 60 * 60 * 1000);
            weekIdx++;
        }

        currentOrders.forEach((o) => {
            const d = new Date(o.created_at);
            const diffDays = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
            const wIdx = Math.min(Math.floor(diffDays / 7) + 1, Object.keys(dailyMap).length);
            const weekKey = `Sem ${wIdx}`;
            if (!dailyMap[weekKey]) return;

            const amount = Number(o.paid_amount || o.total_amount || 0);
            if (o.payment_status === 'paid') {
                dailyMap[weekKey].grossSales += amount;
                dailyMap[weekKey].paidOrdersCount += 1;
            } else if (o.payment_status === 'refunded') {
                dailyMap[weekKey].refunds += amount;
            }
        });
    } else if (granularity === 'month') {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const curr = new Date(startDate);
        while (curr <= endDate) {
            const monthKey = `${monthNames[curr.getMonth()]} ${curr.getFullYear().toString().slice(-2)}`;
            if (!dailyMap[monthKey]) {
                dailyMap[monthKey] = {
                    dateKey: monthKey,
                    dateLabel: monthKey,
                    fullDateLabel: monthKey,
                    grossSales: 0,
                    refunds: 0,
                    netSales: 0,
                    paidOrdersCount: 0,
                    avgTicket: 0,
                };
            }
            curr.setMonth(curr.getMonth() + 1);
        }

        currentOrders.forEach((o) => {
            const d = new Date(o.created_at);
            const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            if (!dailyMap[monthKey]) return;

            const amount = Number(o.paid_amount || o.total_amount || 0);
            if (o.payment_status === 'paid') {
                dailyMap[monthKey].grossSales += amount;
                dailyMap[monthKey].paidOrdersCount += 1;
            } else if (o.payment_status === 'refunded') {
                dailyMap[monthKey].refunds += amount;
            }
        });
    } else {
        const currDate = new Date(startDate);
        while (currDate <= endDate) {
            const dateKey = getLimaDateKey(currDate);
            if (!dailyMap[dateKey]) {
                dailyMap[dateKey] = {
                    dateKey,
                    dateLabel: formatShortDateLabel(dateKey),
                    fullDateLabel: dateKey,
                    grossSales: 0,
                    refunds: 0,
                    netSales: 0,
                    paidOrdersCount: 0,
                    avgTicket: 0,
                };
            }
            currDate.setDate(currDate.getDate() + 1);
        }

        currentOrders.forEach((o) => {
            const dateKey = getLimaDateKey(o.created_at);
            if (!dailyMap[dateKey]) return;

            const amount = Number(o.paid_amount || o.total_amount || 0);
            if (o.payment_status === 'paid') {
                dailyMap[dateKey].grossSales += amount;
                dailyMap[dateKey].paidOrdersCount += 1;
            } else if (o.payment_status === 'refunded') {
                dailyMap[dateKey].refunds += amount;
            }
        });
    }

    let bestDayAmount = 0;
    let bestDayLabel = '—';

    const dailyPoints = Object.values(dailyMap).map((point) => {
        const pointNetSales = Math.max(point.grossSales - point.refunds, 0);
        const pointAvgTicket = point.paidOrdersCount > 0 ? pointNetSales / point.paidOrdersCount : 0;

        if (pointNetSales > bestDayAmount) {
            bestDayAmount = pointNetSales;
            bestDayLabel = point.dateLabel;
        }

        return {
            ...point,
            netSales: pointNetSales,
            avgTicket: pointAvgTicket,
        };
    });

    const totalDays = Math.max(dailyPoints.length, 1);
    const periodAverage = netSales / totalDays;

    // 5. Previous Period Aggregation
    const prevCreatedOrdersCount = prevOrders.length;
    const prevPaidOrdersList = prevOrders.filter((o) => o.payment_status === 'paid');
    const prevRefundedOrdersList = prevOrders.filter((o) => o.payment_status === 'refunded');

    const prevPaidOrdersCount = prevPaidOrdersList.length;
    const prevPaidSales = Math.max(
        prevPaidOrdersList.reduce((sum, o) => sum + Number(o.paid_amount || o.total_amount || 0), 0) -
        prevRefundedOrdersList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        0
    );
    const prevAvgTicket = prevPaidOrdersCount > 0 ? prevPaidSales / prevPaidOrdersCount : 0;
    const prevPaymentRate = prevCreatedOrdersCount > 0 ? (prevPaidOrdersCount / prevCreatedOrdersCount) * 100 : 0;

    // Trends
    const paidSalesTrend = calculateComparison(paidSales, prevPaidSales);
    const createdOrdersTrend = calculateComparison(createdOrdersCount, prevCreatedOrdersCount);
    const avgTicketTrend = calculateComparison(averageTicket, prevAvgTicket);
    const paymentRateTrend = calculateComparison(paymentRate, prevPaymentRate);

    // 6. Payment Methods Breakdown (REAL DATA)
    const pmMap: Record<string, { count: number; amount: number; label: string }> = {};
    paidOrdersList.forEach((o) => {
        const rawMethod = (o.payment_method || 'yape').toLowerCase();
        let key = 'otro';
        let label = 'Otro';

        if (rawMethod.includes('yape') || rawMethod.includes('plin')) {
            key = 'yape';
            label = 'Yape / Plin';
        } else if (rawMethod.includes('transfer') || rawMethod.includes('banco') || rawMethod.includes('bcp')) {
            key = 'transfer';
            label = 'Transferencia Bancaria';
        } else if (rawMethod.includes('card') || rawMethod.includes('tarjeta') || rawMethod.includes('culqi')) {
            key = 'card';
            label = 'Tarjeta Débito/Crédito';
        } else if (rawMethod.includes('cash') || rawMethod.includes('efectivo')) {
            key = 'cash';
            label = 'Efectivo';
        }

        if (!pmMap[key]) {
            pmMap[key] = { count: 0, amount: 0, label };
        }
        pmMap[key].count += 1;
        pmMap[key].amount += Number(o.paid_amount || o.total_amount || 0);
    });

    const paymentMethods: PaymentMethodBreakdown[] = Object.entries(pmMap).map(([key, val]) => ({
        name: val.label,
        key,
        count: val.count,
        amount: val.amount,
        percentage: paidOrdersCount > 0 ? Math.round((val.count / paidOrdersCount) * 1000) / 10 : 0,
    })).sort((a, b) => b.count - a.count);

    // 7. Sales Channels Breakdown (REAL DATA)
    const chMap: Record<string, { count: number; amount: number; label: string }> = {};
    currentOrders.forEach((o) => {
        const rawSource = (o.source || 'online_store').toLowerCase();
        let key = 'online_store';
        let label = 'Tienda Online';

        if (rawSource.includes('whatsapp')) {
            key = 'whatsapp';
            label = 'WhatsApp';
        } else if (rawSource.includes('instagram')) {
            key = 'instagram';
            label = 'Instagram';
        } else if (rawSource.includes('pos') || rawSource.includes('presencial')) {
            key = 'pos';
            label = 'Venta Presencial / POS';
        } else if (rawSource.includes('manual') || rawSource.includes('phone') || rawSource.includes('telefono')) {
            key = 'manual';
            label = 'Teléfono / Manual';
        }

        if (!chMap[key]) {
            chMap[key] = { count: 0, amount: 0, label };
        }
        chMap[key].count += 1;
        chMap[key].amount += Number(o.total_amount || 0);
    });

    const salesChannels: SalesChannelBreakdown[] = Object.entries(chMap).map(([key, val]) => ({
        name: val.label,
        key,
        count: val.count,
        amount: val.amount,
        percentage: createdOrdersCount > 0 ? Math.round((val.count / createdOrdersCount) * 1000) / 10 : 0,
    })).sort((a, b) => b.count - a.count);

    // 8. Low Stock Products & Recent Orders
    let lowStockProducts: LowStockProductItem[] = [
        { id: 'p-1', name: 'Laptop Pro 15', sku: 'SKU-LAP-001', stock: 2, threshold: 5 },
        { id: 'p-2', name: 'Mouse Inalámbrico RGB', sku: 'SKU-MOU-002', stock: 4, threshold: 5 },
    ];

    try {
        const { data: dbProds } = await supabase
            .from('products')
            .select('id, name, sku, stock_quantity')
            .lte('stock_quantity', 5)
            .limit(10);

        if (dbProds && dbProds.length > 0) {
            lowStockProducts = dbProds.map((p) => ({
                id: p.id,
                name: p.name,
                sku: p.sku || 'SKU-NE',
                stock: p.stock_quantity ?? 0,
                threshold: 5,
            }));
        }
    } catch {
        // Fallback demo low stock list
    }

    const diffCreatedOrders = createdOrdersCount - prevCreatedOrdersCount;
    const diffPaidSales = paidSales - prevPaidSales;
    const recentOrders = allOrders.slice(0, 5);

    return {
        paidSales,
        netSales,
        createdOrdersCount,
        paidOrdersCount,
        averageTicket,
        paymentRate,
        bestDayAmount,
        bestDayLabel,
        totalRefunds,
        diffCreatedOrders,
        diffPaidSales,
        isDemoData,
        paidSalesTrend,
        createdOrdersTrend,
        avgTicketTrend,
        paymentRateTrend,
        dailyPoints,
        periodAverage,
        paymentMethods,
        salesChannels,
        lowStockProducts,
        lowStockCount: lowStockProducts.length,
        recentOrders,
    };
}
