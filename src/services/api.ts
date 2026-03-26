import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { syncDb } from '../database/syncDb';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
});

// Helper to check network status
const isOnline = () => navigator.onLine;

// Request Interceptor: Auth only
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Inject Authorization Header
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Basic error handling
api.interceptors.response.use((response: AxiosResponse) => {
    return response;
}, (error) => {
    return Promise.reject(error);
});

export default api;
