import { useState, useEffect, useCallback, useRef } from 'react';
import { useSync } from '../contexts/SyncContext';
import { syncDb } from '../database/syncDb';

interface HybridDataOptions<T> {
    fetcher: () => Promise<T>;
    enabled?: boolean;
}

export function useHybridData<T>({ fetcher, enabled = true }: HybridDataOptions<T>) {
    const { isOnline } = useSync();
    const [data, setData] = useState<T | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const isFetchingRef = useRef(false);
    const initialFetchDone = useRef(false);

    const refresh = useCallback(async () => {
        if (isFetchingRef.current || !navigator.onLine) return;
        
        setIsFetching(true);
        isFetchingRef.current = true;

        try {
            const result = await fetcher();
            setData(result);
        } catch (error) {
            console.error("Fetch failed:", error);
        } finally {
            setIsFetching(false);
            isFetchingRef.current = false;
        }
    }, [fetcher]);

    useEffect(() => {
        if (enabled && !initialFetchDone.current && navigator.onLine) {
            refresh();
            initialFetchDone.current = true;
        }
    }, [enabled, refresh]);

    return {
        localData: data, // Keep for compatibility
        serverData: data, // Keep for compatibility
        mergedData: data, // Keep for compatibility
        isFetching,
        isSyncing: false, // No longer syncing in online-only mode
        isOnline,
        refresh
    };
}
