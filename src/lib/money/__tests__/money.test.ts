import { formatMoney, parseMoneyToCents } from '../index';

describe('Money Utilities', () => {
    test('formatMoney formats PEN cents correctly', () => {
        expect(formatMoney(4900, 'PEN')).toBe('S/ 49.00');
        expect(formatMoney(9999, 'PEN')).toBe('S/ 99.99');
        expect(formatMoney(0, 'PEN')).toBe('S/ 0.00');
    });

    test('formatMoney formats USD cents correctly', () => {
        expect(formatMoney(29900, 'USD')).toBe('$ 299.00');
    });

    test('parseMoneyToCents converts string prices to integer cents', () => {
        expect(parseMoneyToCents('$49.00')).toBe(4900);
        expect(parseMoneyToCents('S/ 99.99')).toBe(9999);
        expect(parseMoneyToCents('299')).toBe(29900);
        expect(parseMoneyToCents('')).toBe(0);
    });
});
