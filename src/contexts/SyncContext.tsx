import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

    // Refresh pending count
    const updatePendingCount = useCallback(async () => {
        const count = await syncDb.syncQueue.count();
        setPendingCount(count);
    }, []);

    // The core sync logic: replay the queue
    const syncNow = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;
        
        const queue = await syncDb.syncQueue.orderBy('timestamp').toArray();
        if (queue.length === 0) return;

        setIsSyncing(true);
        console.log(`Starting sync of ${queue.length} items...`);

        for (const item of queue) {
            try {
                // Re-attempt the request bypassing the offline interceptor
                await axios({
                    method: item.method,
                    url: item.url,
                    data: item.data,
                    headers: item.headers,
                    baseURL: import.meta.env.VITE_API_URL || '/api'
                });
                
                // Success! Remove from queue
                await syncDb.syncQueue.delete(item.id!);
                console.log(`Synced: ${item.url}`);
            } catch (error: any) {
                console.error(`Sync failed for ${item.url}:`, error.message);
                if (error.response?.status >= 400 && error.response?.status < 500) {
                   await syncDb.syncQueue.update(item.id!, { retries: (item.retries || 0) + 1 });
                   if ((item.retries || 0) > 5) {
                       await syncDb.syncQueue.delete(item.id!);
                   }
                }
                break; // Stop syncing other items to preserve order
            }
        }

        await updatePendingCount();
        setIsSyncing(false);
    }, [isSyncing, updatePendingCount]);

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

    return (
        <SyncContext.Provider value={{ isOnline, isSyncing, pendingCount, syncNow }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) throw new Error('useSync must be used within SyncProvider');
    return context;
};
