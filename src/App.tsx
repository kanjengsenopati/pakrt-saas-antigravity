import { useEffect } from 'react';
import { useTenant } from './contexts/TenantContext';
import LandingPage from './features/landing/LandingPage';
import { syncDb } from './database/syncDb';

function App() {
    const { isLoading } = useTenant();

    // Cleanup IndexedDB and add Global Error Safeguard
    useEffect(() => {
        const cleanup = async () => {
            console.log("Cleaning up old offline caches...");
            try {
                await Promise.all([
                    syncDb.apiCache.clear(),
                    syncDb.syncQueue.clear()
                ]);
                console.log("Cache cleared successfully.");
            } catch (err) {
                console.error("Failed to clear cache:", err);
            }
        };

        const handleGlobalError = (event: ErrorEvent) => {
            // Catch the specific Recharts/React19 internal "Activity" error
            if (event.message?.includes("'Activity'") || event.message?.includes("undefined (setting 'Activity')")) {
                console.warn("Caught and suppressed Recharts/React19 Activity instability error.");
                event.preventDefault();
                event.stopPropagation();
            }
        };

        cleanup();
        window.addEventListener('error', handleGlobalError);
        return () => window.removeEventListener('error', handleGlobalError);
    }, []);

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    }

    return <LandingPage />;
}

export default App;
