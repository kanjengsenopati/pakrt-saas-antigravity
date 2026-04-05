import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/ui/Sidebar';
import { Header } from '../components/ui/Header';
import { useTenant } from '../contexts/TenantContext';
import { ThemeManager } from '../components/ThemeManager';
import { BottomNav } from '../components/ui/BottomNav';

export function AppLayout() {
    const { currentTenant } = useTenant();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    if (!currentTenant) return null;

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <ThemeManager />
            <div className="hidden md:flex">
                <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
            </div>
            <div className={`flex-1 flex flex-col relative min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                <Header />
                <main className="flex-1 px-5 py-4 md:p-8 overflow-y-auto w-full transition-all duration-300">
                    <Outlet />
                </main>
            </div>
            <BottomNav />
        </div>
    );
}
