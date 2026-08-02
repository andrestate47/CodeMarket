'use client';

import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getThemeSnapshot = (): Theme => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme') as Theme;
        if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
};

const getServerSnapshot = (): Theme => 'dark';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = React.useSyncExternalStore(
        (callback) => {
            window.addEventListener('storage', callback);
            return () => window.removeEventListener('storage', callback);
        },
        getThemeSnapshot,
        getServerSnapshot
    );

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        window.dispatchEvent(new Event('storage'));
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
