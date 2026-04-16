'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '@/data/products';

interface CartItem extends Product {
    cartId: string; // Unique ID for cart instance (in case duplicates are allowed)
}

interface CartContextType {
    items: CartItem[];
    isOpen: boolean;
    addItem: (product: Product) => void;
    removeItem: (cartId: string) => void;
    toggleCart: () => void;
    clearCart: () => void;
    total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addItem = (product: Product) => {
        const newItem: CartItem = { ...product, cartId: Math.random().toString(36).substr(2, 9) };
        setItems((prev) => [...prev, newItem]);
        setIsOpen(true); // Open cart when item is added
    };

    const removeItem = (cartId: string) => {
        setItems((prev) => prev.filter((item) => item.cartId !== cartId));
    };

    const toggleCart = () => setIsOpen((prev) => !prev);
    const clearCart = () => setItems([]);

    // Calculate total (parsing the string price like "$100" to number)
    const total = items.reduce((sum, item) => {
        const priceNum = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
        return sum + priceNum;
    }, 0);

    return (
        <CartContext.Provider value={{ items, isOpen, addItem, removeItem, toggleCart, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
