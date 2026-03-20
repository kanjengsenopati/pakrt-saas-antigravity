import { NavLink, useLocation } from 'react-router-dom';
import { Wallet, List, House, UserList, Money } from '@phosphor-icons/react';
import { useState } from 'react';
import { MobileMenuOverlay } from './MobileMenuOverlay';

export function BottomNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const NAV_ITEMS = [
        { path: '/dashboard', label: 'Beranda', icon: House, activeIcon: House, weight: "duotone" },
        { path: '/warga', label: 'Warga', icon: UserList, activeIcon: UserList, weight: "duotone" },
        { path: '/keuangan', label: 'Kas', icon: Wallet, activeIcon: Wallet, weight: "duotone" },
        { path: '/iuran', label: 'Iuran', icon: Money, activeIcon: Money, weight: "duotone" },
    ];

    return (
        <>
            <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white/80 backdrop-blur-xl border border-white/20 z-40 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-2 py-2 mb-safe">
                <div className="flex items-center justify-around relative">
                    {NAV_ITEMS.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = isActive ? item.activeIcon : item.icon;
                        
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 relative group ${isActive
                                        ? 'text-brand-600'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`
                                }
                            >
                                <div className={`relative transition-all duration-300 ${isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'}`}>
                                    <Icon 
                                        weight={isActive ? "fill" : "duotone"} 
                                        className={`w-6 h-6 transition-colors ${isActive ? 'text-brand-600' : 'text-slate-400'}`} 
                                    />
                                    {isActive && (
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-600 rounded-full animate-in fade-in zoom-in duration-300" />
                                    )}
                                </div>
                                <span className={`text-sm mt-1 transition-all duration-300 ${isActive ? 'font-bold opacity-100 text-slate-900' : 'font-semibold opacity-60 text-slate-400'}`}>
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                    
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center justify-center py-2 px-3 rounded-2xl text-slate-400 hover:text-slate-600 transition-all active:scale-95 group"
                    >
                        <List weight="duotone" className="w-6 h-6 transition-colors group-hover:text-slate-600" />
                        <span className="text-sm font-semibold mt-1 opacity-60 text-slate-400 group-hover:text-slate-600 transition-all">Menu</span>
                    </button>
                </div>
            </div>

            <MobileMenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
}
