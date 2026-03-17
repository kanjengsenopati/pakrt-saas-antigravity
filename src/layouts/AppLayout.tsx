import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/ui/Sidebar';
import { Header } from '../components/ui/Header';
import { BottomNav } from '../components/ui/BottomNav';
import { useTenant } from '../contexts/TenantContext';
import { ThemeManager } from '../components/ThemeManager';

export function AppLayout() {
    const { currentTenant } = useTenant();

    if (!currentTenant) return null;

    return (
        <div className="flex bg-gray-50 min-h-screen">
            <ThemeManager />
            <div className="hidden md:flex">
                <Sidebar />
            </div>
            <div className="flex-1 md:ml-64 flex flex-col pb-[80px] md:pb-0 relative min-h-screen">
                <Header />
                <main className="flex-1 p-3 md:p-8 overflow-y-auto w-full">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
        </div>
    );
}
