/**
 * Money utilities for CodeMarket
 * All prices in database are stored as integer amounts in minimum currency units (cents).
 * E.g., 4900 = S/ 49.00 or $49.00
 */

export const formatMoney = (amountInCents: number, currency: string = 'PEN'): string => {
    const symbol = currency === 'PEN' ? 'S/' : '$';
    const dollars = (amountInCents / 100).toFixed(2);
    return `${symbol} ${dollars}`;
};

export const parseMoneyToCents = (priceString: string): number => {
    if (!priceString) return 0;
    // Remove symbols, spaces and keep digits and decimal point
    const clean = priceString.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
};
