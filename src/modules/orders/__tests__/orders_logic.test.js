import test from 'node:test';
import assert from 'node:assert/strict';

// Helper logic for money calculations & minimum integer units
function parseMoneyToCents(priceString) {
    if (!priceString) return 0;
    if (typeof priceString === 'number') {
        const isCents = Number.isInteger(priceString) && priceString >= 100;
        return isCents ? priceString : Math.round(priceString * 100);
    }
    const clean = String(priceString).replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (isNaN(num)) return 0;
    return Math.round(num * 100);
}

function calculateOrderTotals(subtotalCents, discountType, discountValue, shippingCents) {
    let discountCents = 0;
    if (discountType === 'percentage' && discountValue > 0) {
        discountCents = Math.round((subtotalCents * discountValue) / 100);
    } else if (discountType === 'fixed' && discountValue > 0) {
        discountCents = parseMoneyToCents(discountValue);
    }
    const totalCents = Math.max(0, subtotalCents + shippingCents - discountCents);
    return { subtotalCents, discountCents, shippingCents, totalCents };
}

function validateStockAvailability(currentStock, reservedStock, requestedQty) {
    const available = currentStock - (reservedStock || 0);
    return available >= requestedQty;
}

test('Money parsing to minimum integer cents', () => {
    assert.equal(parseMoneyToCents('49.90'), 4990);
    assert.equal(parseMoneyToCents(4990), 4990);
    assert.equal(parseMoneyToCents(15.5), 1550);
    assert.equal(parseMoneyToCents(0), 0);
});

test('Order total calculation with percentage discount', () => {
    // Subtotal: S/ 100.00 (10000 cents), Discount: 10%, Shipping: S/ 10.00 (1000 cents)
    const result = calculateOrderTotals(10000, 'percentage', 10, 1000);
    assert.equal(result.subtotalCents, 10000);
    assert.equal(result.discountCents, 1000);
    assert.equal(result.shippingCents, 1000);
    assert.equal(result.totalCents, 10000); // 100 + 10 - 10 = 100 => 10000 cents
});

test('Order total calculation with fixed discount', () => {
    // Subtotal: S/ 150.00 (15000 cents), Discount: S/ 20.00 (2000 cents), Shipping: S/ 15.00 (1500 cents)
    const result = calculateOrderTotals(15000, 'fixed', 20, 1500);
    assert.equal(result.discountCents, 2000);
    assert.equal(result.totalCents, 14500); // 150 - 20 + 15 = 145 => 14500 cents
});

test('Stock availability calculation', () => {
    assert.equal(validateStockAvailability(10, 3, 5), true); // Available: 7 >= 5 -> OK
    assert.equal(validateStockAvailability(10, 3, 8), false); // Available: 7 < 8 -> FAIL
    assert.equal(validateStockAvailability(5, 0, 5), true); // Available: 5 >= 5 -> OK
});
