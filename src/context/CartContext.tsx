'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/data/products';

export interface CartItem extends Product {
    cartId: string;
    quantity: number;
    selectedVariant?: { id: string; name: string; price: string };
}

interface CartContextType {
    items: CartItem[];
    isOpen: boolean;
    addItem: (product: Product, quantity?: number, selectedVariant?: { id: string; name: string; price: string }) => void;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, delta: number) => void;
    setQuantity: (cartId: string, quantity: number) => void;
    removeItemByProductId: (productId: string) => void;
    toggleCart: () => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function parseItemPrice(priceStrOrNum: string | number): number {
    if (typeof priceStrOrNum === 'number') {
        return priceStrOrNum;
    }
    const clean = String(priceStrOrNum).replace(/[^0-9.]/g, '');
    const val = parseFloat(clean);
    return isNaN(val) ? 0 : val;
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem('codemarket_cart');
            if (savedCart) {
                const parsed = JSON.parse(savedCart);
                if (Array.isArray(parsed)) {
                    setItems(parsed);
                }
            }
        } catch (e) {
            console.error('Failed to load cart from localStorage', e);
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage on changes
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem('codemarket_cart', JSON.stringify(items));
        } catch (e) {
            console.error('Failed to save cart to localStorage', e);
        }
    }, [items, isLoaded]);

    const addItem = (
        product: Product, 
        qtyToAdd: number = 1, 
        selectedVariant?: { id: string; name: string; price: string }
    ) => {
        const addAmount = Math.max(1, qtyToAdd);
        setItems((prev) => {
            const existingIndex = prev.findIndex((item) => {
                const sameId = item.id === product.id;
                const sameVariant = selectedVariant 
                    ? item.selectedVariant?.id === selectedVariant.id 
                    : !item.selectedVariant;
                return sameId && sameVariant;
            });

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: updated[existingIndex].quantity + addAmount
                };
                return updated;
            } else {
                const newItem: CartItem = {
                    ...product,
                    price: selectedVariant?.price || product.price,
                    cartId: `${product.id}-${selectedVariant?.id || 'default'}-${Math.random().toString(36).substr(2, 6)}`,
                    quantity: addAmount,
                    selectedVariant
                };
                return [...prev, newItem];
            }
        });
        setIsOpen(true);
    };

    const updateQuantity = (cartId: string, delta: number) => {
        setItems((prev) => {
            return prev.map((item) => {
                if (item.cartId === cartId) {
                    const newQty = item.quantity + delta;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter((item): item is CartItem => item !== null);
        });
    };

    const setQuantity = (cartId: string, qty: number) => {
        if (qty <= 0) {
            removeItem(cartId);
            return;
        }
        setItems((prev) =>
            prev.map((item) => (item.cartId === cartId ? { ...item, quantity: qty } : item))
        );
    };

    const removeItem = (cartId: string) => {
        setItems((prev) => prev.filter((item) => item.cartId !== cartId));
    };

    const removeItemByProductId = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));
    };

    const toggleCart = () => setIsOpen((prev) => !prev);
    const clearCart = () => setItems([]);

    const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const total = items.reduce((sum, item) => {
        const itemPriceStr = item.selectedVariant?.price || item.price;
        const priceNum = parseItemPrice(itemPriceStr);
        return sum + priceNum * (item.quantity || 1);
    }, 0);

    return (
        <CartContext.Provider 
            value={{ 
                items, 
                isOpen, 
                addItem, 
                removeItem, 
                updateQuantity, 
                setQuantity,
                removeItemByProductId, 
                toggleCart, 
                clearCart, 
                total,
                itemCount 
            }}
        >
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
