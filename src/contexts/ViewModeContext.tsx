import React, { createContext, useContext, useState, useEffect } from 'react';

export type ViewMode = 'mobile' | 'tablet' | 'desktop';

interface ViewModeContextType {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [viewMode, setViewModeState] = useState<ViewMode>(() => {
        const saved = localStorage.getItem('pakrt_view_mode');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return 'desktop';
            }
        }
        return 'desktop';
    });

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode);
        localStorage.setItem('pakrt_view_mode', JSON.stringify(mode));
    };

    return (
        <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
            {children}
        </ViewModeContext.Provider>
    );
};

export const useViewMode = () => {
    const context = useContext(ViewModeContext);
    if (context === undefined) {
        throw new Error('useViewMode must be used within a ViewModeProvider');
    }
    return context;
};
