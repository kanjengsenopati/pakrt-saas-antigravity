import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { syncDb } from '../database/syncDb';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Helper to check network status
const isOnline = () => navigator.onLine;

// Request Interceptor: Offline Queueing for Mutations
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const isMutation = ['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase() || '');
    
    if (!isOnline() && isMutation) {
        // Queue the request for later
        await syncDb.syncQueue.add({
            url: config.url || '',
            method: (config.method?.toUpperCase() as any) || 'POST',
            data: config.data,
            headers: config.headers as any,
            timestamp: Date.now(),
            retries: 0
        });
        
        // Return a mock success response so the UI doesn't break
        // We'll throw an "OfflineQueued" error to be handled if needed, 
        // or just return a response that mimics success.
        // For now, let's treat it as "Accepted" (202)
        return Promise.reject({
            message: 'Offline: Request queued for sync',
            isOffline: true,
            status: 202,
            config
        });
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Caching for GET requests
api.interceptors.response.use(async (response: AxiosResponse) => {
    const isGet = response.config.method?.toLowerCase() === 'get';
    
    if (isGet && response.status === 200) {
        // Cache the result
        await syncDb.apiCache.put({
            url: response.config.url || '',
            data: response.data,
            timestamp: Date.now(),
            expiresAt: Date.now() + (1000 * 60 * 60 * 24) // 24h cache
        });
    }
    
    return response;
}, async (error) => {
    const originalRequest = error.config;
    const isGet = originalRequest?.method?.toLowerCase() === 'get';
    
    // If GET fails due to network (or offline), try to serve from cache
    if ((!isOnline() || error.code === 'ERR_NETWORK') && isGet) {
        const cached = await syncDb.apiCache.get(originalRequest.url || '');
        if (cached) {
            console.log('Serving from local cache:', originalRequest.url);
            return {
                ...error,
                data: cached.data,
                status: 200,
                statusText: 'OK (Cached)',
                config: originalRequest,
                isCached: true
            };
        }
    }
    
    return Promise.reject(error);
});

export default api;
