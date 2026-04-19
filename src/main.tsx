import React from 'react'
import ReactDOM from 'react-dom/client'

// --- Force Update & Cache Cleanup Logic ---
const APP_VERSION = '1.6.0';
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

axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(`API Error [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);

// --- Safe Root Initialization ---
const container = document.getElementById('root');
if (container) {
    const root = (window as any)._reactRoot || ReactDOM.createRoot(container);
    (window as any)._reactRoot = root;
    root.render(
        <React.StrictMode>
            <MainRouter />
        </React.StrictMode>,
    );
}
// --------------------------------
