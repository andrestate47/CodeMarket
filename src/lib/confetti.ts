'use client';

import confetti from 'canvas-confetti';

/**
 * Lanza confeti desde la posición del elemento clicado (o desde el centro si no hay evento).
 */
export function fireAddToCartConfetti(e?: { clientX: number; clientY: number }) {
    if (typeof window === 'undefined') return;
    try {
        const origin = e && (e.clientX || e.clientY)
            ? { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
            : { x: 0.5, y: 0.6 };
        confetti({
            particleCount: 90,
            spread: 70,
            startVelocity: 35,
            origin,
            colors: ['#FF6B00', '#facc15', '#ef4444', '#ffffff'],
            zIndex: 99999,
        });
    } catch (err) {
        console.error('Confetti error:', err);
    }
}
