import { useTenant } from './contexts/TenantContext';
import LandingPage from './features/landing/LandingPage';

function App() {
    const { isLoading } = useTenant();

    // Removed auto-redirect to dashboard to allow Landing page to show by default

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
    }

    return <LandingPage />;
}

export default App;
