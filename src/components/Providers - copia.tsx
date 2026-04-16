'use client';

import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import CartDrawer from '@/components/CartDrawer';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CartProvider>
                {children}
                <CartDrawer />
            </CartProvider>
        </ThemeProvider>
    );
}
