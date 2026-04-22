import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    withCredentials: true, // Crucial for HttpOnly cookies
});


// Request Interceptor: Metadata only (no token in headers)
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
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
