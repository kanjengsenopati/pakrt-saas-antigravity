import { useEffect } from 'react';
import { useTenant } from './contexts/TenantContext';
import LandingPage from './features/landing/LandingPage';
import { syncDb } from './database/syncDb';
import { pushNotificationUtil } from './utils/pushNotification';

function App() {
    const { isLoading } = useTenant();

    // Global UI Cache Buster & Error Safeguard
    useEffect(() => {
        const UI_VERSION = 'v1.2.6-verif-fix';
        const storedVersion = localStorage.getItem('app_ui_version');

        const forceCleanup = async () => {
            console.log(`UI Version Change Detected: ${storedVersion} -> ${UI_VERSION}`);
            try {
                // Clear Service Worker if possible
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }
                
                // Clear IndexedDB via syncDb
                await Promise.all([
                    syncDb.apiCache.clear(),
                    syncDb.syncQueue.clear()
                ]);

                // Clear all localStorage except auth
                const authToken = localStorage.getItem('auth_token');
                const authUser = localStorage.getItem('auth_user');
                localStorage.clear();
                if (authToken) localStorage.setItem('auth_token', authToken);
                if (authUser) localStorage.setItem('auth_user', authUser);

                localStorage.setItem('app_ui_version', UI_VERSION);
                console.log("Global cache cleared. Reloading...");
                window.location.reload();
            } catch (err) {
                console.error("Failed to force cleanup:", err);
            }
        };

        if (storedVersion !== UI_VERSION) {
            forceCleanup();
        }

        const handleGlobalError = (event: ErrorEvent) => {
            if (event.message?.includes("'Activity'") || event.message?.includes("undefined (setting 'Activity')")) {
                console.warn("Caught and suppressed Recharts/React19 Activity instability error.");
                event.preventDefault();
                event.stopPropagation();
            }
        };

        // Initialize Push Notification Foreground Handler
        pushNotificationUtil.initForegroundHandler((payload) => {
            console.log("Foreground Notification Received:", payload);
            // You can trigger a global toast/alert here if needed
        });

        window.addEventListener('error', handleGlobalError);
        return () => window.removeEventListener('error', handleGlobalError);
    }, []);

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    }

    return <LandingPage />;
}

export default App;
