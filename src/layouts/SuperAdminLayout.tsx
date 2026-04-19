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
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-slate-900
                border-r border-slate-800 transform transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <GearSix size={22} weight="bold" className="text-white" />
                    </div>
                    <div>
                        <div className="text-[15px] font-black text-white tracking-tight">PakRT</div>
                        <div className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">Super Admin</div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto md:hidden text-white/40 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="px-3 py-6 space-y-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-bold
                                transition-all duration-300 group
                                ${isActive
                                    ? 'bg-white/10 text-white shadow-xl shadow-black/20'
                                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                }
                            `}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon 
                                        size={20} 
                                        weight={isActive ? "bold" : "duotone"} 
                                        className={isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"} 
                                    />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User section at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-black ring-2 ring-emerald-500/10">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white truncate">{user?.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                            title="Logout"
                        >
                            <SignOut size={18} weight="bold" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 min-h-screen">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-5 gap-4 shadow-sm shadow-slate-900/5">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                        <List size={22} weight="bold" />
                    </button>
                    <div className="flex items-center gap-2 text-slate-400 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100/50">
                        <Buildings size={14} weight="bold" />
                        <span className="text-[11px] font-black uppercase tracking-widest leading-none">Platform Management</span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-5 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
