import { NavLink, useLocation } from 'react-router-dom';
import { Wallet, House, Gear, FileText } from '@phosphor-icons/react';

export function BottomNav() {
    const location = useLocation();

    const NAV_ITEMS = [
        { path: '/dashboard', label: 'Beranda', icon: House },
        { path: '/pengaturan', label: 'Menu', icon: Gear },
        { path: '/keuangan', label: 'Kas', icon: Wallet },
        { path: '/surat', label: 'Surat', icon: FileText },
    ];

    return (
        <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-t-[1.5rem] flex justify-around items-center px-4 py-3 pb-safe shadow-[0_-8px_24px_-4px_rgba(0,80,212,0.05)] md:hidden">
            {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center transition-all duration-300 relative group ${isActive
                                ? 'text-brand-600 scale-110 -translate-y-0.5'
                                : 'text-slate-400 hover:text-slate-600'
                            }`
                        }
                    >
                        <Icon 
                            weight={isActive ? "fill" : "regular"} 
                            className="text-[1.7rem]" 
                        />
                        {isActive && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-600 rounded-full animate-in fade-in zoom-in duration-300" />
                        )}
                    </NavLink>
                );
            })}
        </nav>
    );
}
