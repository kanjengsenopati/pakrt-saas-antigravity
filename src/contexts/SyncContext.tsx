import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { syncDb } from '../database/syncDb';
import axios from 'axios';

interface SyncContextType {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const isSyncingRef = useRef(false);

    const updatePendingCount = useCallback(async () => {
        const count = await syncDb.syncQueue.count();
        setPendingCount(count);
    }, []);

    const syncNow = useCallback(async () => {
        if (!navigator.onLine || isSyncingRef.current) return;
        
        const queue = await syncDb.syncQueue.toArray();
        if (queue.length === 0) return;

        isSyncingRef.current = true;
        setIsSyncing(true);
        console.log(`Starting sync of ${queue.length} items...`);

        try {
            const sortedQueue = [...queue].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            
            for (const item of sortedQueue) {
                try {
                    await axios({
                        method: item.method,
                        url: item.url,
                        data: item.data,
                        headers: item.headers,
                        baseURL: import.meta.env.VITE_API_URL || '/api'
                    });
                    
                    await syncDb.syncQueue.delete(item.id!);
                } catch (error: any) {
                    console.error(`Sync failed for ${item.url}:`, error.message);
                    if (error.response?.status >= 400 && error.response?.status < 500) {
                        await syncDb.syncQueue.update(item.id!, { retries: (item.retries || 0) + 1 });
                        if ((item.retries || 0) > 5) {
                            await syncDb.syncQueue.delete(item.id!);
                        }
                    }
                    break;
                }
            }
        } finally {
            await updatePendingCount();
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [updatePendingCount]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncNow();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        updatePendingCount();

        const interval = setInterval(() => {
            if (navigator.onLine) syncNow();
            updatePendingCount();
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [syncNow, updatePendingCount]);

    const value = useMemo(() => ({
        isOnline,
        isSyncing,
        pendingCount,
        syncNow
    }), [isOnline, isSyncing, pendingCount, syncNow]);

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync must be used within SyncProvider');
    return context;
};
