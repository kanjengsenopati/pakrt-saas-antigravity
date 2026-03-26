import { useState, useEffect, useCallback, useRef } from 'react';
import { useSync } from '../contexts/SyncContext';
import { syncDb } from '../database/syncDb';

interface HybridDataOptions<T> {
    cacheKey: string;
    fetcher: () => Promise<T>;
    enabled?: boolean;
}

export function useHybridData<T>({ cacheKey, fetcher, enabled = true }: HybridDataOptions<T>) {
    const { isOnline, isSyncing } = useSync();
    
    // 3. Separate state clearly
    const [localData, setLocalData] = useState<T | null>(null);
    const [serverData, setServerData] = useState<T | null>(null);
    const [mergedData, setMergedData] = useState<T | null>(null);
    
    // 1 & 2. Add guards
    const [isFetching, setIsFetching] = useState(false);
    const isFetchingRef = useRef(false);
    const initialFetchDone = useRef(false);

    // Fetch from local cache (IndexedDB)
    const fetchLocal = useCallback(async () => {
        try {
            const cached = await syncDb.apiCache.get(cacheKey);
            if (cached) {
                const dataWithSource = Array.isArray(cached.data) 
                    ? cached.data.map((item: any) => ({ ...item, source: 'local' }))
                    : { ...cached.data, source: 'local' };
                
                setLocalData(dataWithSource);
                // If we don't have server data yet, use local as merged
                if (!serverData) setMergedData(dataWithSource);
            }
        } catch (error) {
            console.error("Local fetch failed:", error);
        }
    }, [cacheKey, serverData]);

    // Fetch from server (Cloud)
    const fetchServer = useCallback(async () => {
        if (isFetchingRef.current || !navigator.onLine) return;
        
        console.log("FETCH TRIGGER", cacheKey);
        setIsFetching(true);
        isFetchingRef.current = true;

        try {
            const result = await fetcher();
            const dataWithSource = Array.isArray(result)
                ? result.map((item: any) => ({ ...item, source: 'server' }))
                : { ...result as any, source: 'server' };
            
            setServerData(dataWithSource);
            setMergedData(dataWithSource);
            
            // Update local cache is handled by api interceptor
        } catch (error) {
            console.error("Server fetch failed:", error);
            // Fallback to local if server fails
            if (localData) setMergedData(localData);
        } finally {
            setIsFetching(false);
            isFetchingRef.current = false;
        }
    }, [cacheKey, fetcher, localData]);

    // Initial load
    useEffect(() => {
        if (!enabled) return;
        
        fetchLocal();
        
        // Anti-loop: Only trigger server fetch if not already done or if online status changes to true
        if (!initialFetchDone.current && navigator.onLine) {
            fetchServer();
            initialFetchDone.current = true;
        }
    }, [enabled, fetchLocal, fetchServer]);

    // Sync trigger: When syncing status ends or online status returns
    useEffect(() => {
        if (enabled && isOnline && !isSyncing && initialFetchDone.current) {
            // After a sync completes, we should refresh from server to get authoritative data
            fetchServer();
        }
    }, [isOnline, isSyncing, enabled, fetchServer]);

    return {
        localData,
        serverData,
        mergedData,
        isFetching,
        isSyncing,
        isOnline,
        refresh: fetchServer
    };
}
