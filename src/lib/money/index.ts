export const minorUnitsToDecimal = (amount: number | undefined | null): number => {
    if (amount === undefined || amount === null || isNaN(amount)) return 0;
    return amount;
};

export const formatMoney = (val: number | string | undefined | null, currency: string = 'PEN', isCents: boolean = false): string => {
    if (val === undefined || val === null) return 'S/ 0.00';
    const symbol = currency === 'USD' ? '$' : 'S/';

    const formatNum = (num: number) => {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    if (typeof val === 'string') {
        const clean = parseFloat(val.replace(/[^0-9.]/g, ''));
        if (isNaN(clean)) return `${symbol} 0.00`;
        return `${symbol} ${formatNum(clean)}`;
    }

    if (typeof val === 'number') {
        const soles = isCents ? val / 100 : val;
        return `${symbol} ${formatNum(soles)}`;
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
