import React from 'react'
import ReactDOM from 'react-dom/client'

// --- Force Update & Cache Cleanup Logic ---
const APP_VERSION = '1.5.8';
const storedVersion = localStorage.getItem('app_version');

if (storedVersion !== APP_VERSION) {
    console.log(`[PAKRT] New Version Detected (${APP_VERSION}). Cleaning Caches...`);
    
    // Clear Service Workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                registration.unregister();
            }
        });
    }

    // Clear Cache Storage
    if ('caches' in window) {
        caches.keys().then((names) => {
            for (const name of names) {
                caches.delete(name);
            }
        });
    }

    // Update version in storage and reload
    localStorage.setItem('app_version', APP_VERSION);
    
    // Hard refresh after a short delay to allow unregistration
    setTimeout(() => {
        window.location.reload();
    }, 500);
}
// ------------------------------------------
import { MainRouter } from './components/MainRouter.tsx'
import axios from 'axios'
import './index.css'

axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(`API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MainRouter />
    </React.StrictMode>,
)
