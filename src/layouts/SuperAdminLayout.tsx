import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    House, Buildings, CreditCard, ChartLineUp,
    UsersThree, SignOut, List, X, GearSix
} from '@phosphor-icons/react';

const navItems = [
    { path: '/super-admin', label: 'Dashboard', icon: House, end: true },
    { path: '/super-admin/tenants', label: 'Kelola Tenant', icon: Buildings },
    { path: '/super-admin/subscriptions', label: 'Subscription', icon: CreditCard },
    { path: '/super-admin/affiliates', label: 'Affiliate', icon: UsersThree },
    { path: '/super-admin/analytics', label: 'Analytics', icon: ChartLineUp },
];

export function SuperAdminLayout() {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-slate-950">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-950
                border-r border-white/5 transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                        <GearSix size={20} weight="bold" className="text-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white tracking-wide">PakRT</div>
                        <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">Super Admin</div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto md:hidden text-white/40 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="px-3 py-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium
                                transition-all duration-200
                                ${isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            <item.icon size={20} weight="duotone" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User section at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <SignOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-14 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center px-5 gap-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden text-white/60 hover:text-white"
                    >
                        <List size={22} />
                    </button>
                    <h1 className="text-sm font-semibold text-white/80">Platform Management</h1>
                </header>

                {/* Page Content */}
                <div className="p-5 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
