'use client';

import { CartProvider } from '@/context/CartContext';
import { ThemeProvider } from '@/context/ThemeContext';
import CartDrawer from '@/components/CartDrawer';
import StickyMobileCartBar from '@/components/public/social/StickyMobileCartBar';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CartProvider>
                {children}
                <StickyMobileCartBar />
                <CartDrawer />
            </CartProvider>
        </ThemeProvider>
    );
}
