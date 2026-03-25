import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface FontContextType {
    fontSizeOffset: number;
    increaseFont: () => void;
    decreaseFont: () => void;
    resetFont: () => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Load saved font size offset from localStorage, default to 0
    const [fontSizeOffset, setFontSizeOffset] = useState<number>(() => {
        const saved = localStorage.getItem('font-size-offset');
        return saved ? parseInt(saved, 10) : 0;
    });

    // Apply font size offset to root element
    useEffect(() => {
        const baseSize = 16; // Standard 16px base
        document.documentElement.style.fontSize = `${baseSize + fontSizeOffset}px`;
        localStorage.setItem('font-size-offset', fontSizeOffset.toString());
    }, [fontSizeOffset]);

    const increaseFont = useCallback(() => setFontSizeOffset(prev => Math.min(prev + 1, 10)), []); // Max +10px
    const decreaseFont = useCallback(() => setFontSizeOffset(prev => Math.max(prev - 1, -4)), []);  // Min -4px
    const resetFont = useCallback(() => setFontSizeOffset(0), []);

    const value = useMemo(() => ({
        fontSizeOffset,
        increaseFont,
        decreaseFont,
        resetFont
    }), [fontSizeOffset, increaseFont, decreaseFont, resetFont]);

    return (
        <FontContext.Provider value={value}>
            {children}
        </FontContext.Provider>
    );
};

export const useFont = () => {
    const context = useContext(FontContext);
    if (!context) {
        throw new Error('useFont must be used within a FontProvider');
    }
    return context;
};
