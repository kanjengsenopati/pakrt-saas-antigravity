import { useEffect } from 'react';
import { useTenant } from './contexts/TenantContext';
import LandingPage from './features/landing/LandingPage';
import { syncDb } from './database/syncDb';

function App() {
    const { isLoading } = useTenant();

    // Cleanup IndexedDB on startup for online-only mode
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
        cleanup();
    }, []);

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    }

    return <LandingPage />;
}

export default App;
