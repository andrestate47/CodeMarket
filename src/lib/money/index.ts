/**
 * Money utilities for CodeMarket
 * Formats numbers, strings, cents or soles cleanly with consistent currency symbol (S/).
 */

export const formatMoney = (val: number | string | undefined | null, currency: string = 'PEN'): string => {
    if (val === undefined || val === null) return 'S/ 0.00';
    const symbol = currency === 'USD' ? '$' : 'S/';

    if (typeof val === 'string') {
        const clean = parseFloat(val.replace(/[^0-9.]/g, ''));
        if (isNaN(clean)) return `${symbol} 0.00`;
        return `${symbol} ${clean.toFixed(2)}`;
    }

    if (typeof val === 'number') {
        // Integer amount >= 100 represents DB cents (e.g., 4900 = S/ 49.00).
        // Float or amount < 100 represents Soles (e.g. 49 = S/ 49.00 or 49.90 = S/ 49.90).
        const isCents = Number.isInteger(val) && val >= 100;
        const soles = isCents ? val / 100 : val;
        return `${symbol} ${soles.toFixed(2)}`;
    }

    return `${symbol} 0.00`;
};

export const parseMoneyToCents = (priceString: string | number): number => {
    if (!priceString) return 0;
    if (typeof priceString === 'number') {
        const isCents = Number.isInteger(priceString) && priceString >= 100;
        return isCents ? priceString : Math.round(priceString * 100);
    }
    const clean = priceString.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
};
