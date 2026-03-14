import { NavLink } from 'react-router-dom';
import { SquaresFour, Users, Wallet, List } from '@phosphor-icons/react';
import { useState } from 'react';
import { MobileMenuOverlay } from './MobileMenuOverlay';

export function BottomNav() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const NAV_ITEMS = [
        { path: '/dashboard', label: 'Beranda', icon: SquaresFour },
        { path: '/warga', label: 'Warga', icon: Users },
        { path: '/keuangan', label: 'Keuangan', icon: Wallet },
    ];

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <div className="flex items-center justify-around translate-y-[-2px]">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${isActive
                                        ? 'text-brand-600'
                                        : 'text-slate-500 hover:text-brand-500 hover:bg-slate-50'
                                    }`
                                }
                            >
                                <Icon weight="duotone" className="w-6 h-6" />
                                <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                            </NavLink>
                        );
                    })}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="flex flex-col items-center justify-center w-full py-3 gap-1 text-slate-500 hover:text-brand-500 hover:bg-slate-50 transition-colors"
                    >
                        <List weight="duotone" className="w-6 h-6" />
                        <span className="text-[10px] font-bold tracking-wide">Menu</span>
                    </button>
                </div>
            </div>

            <MobileMenuOverlay isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </>
    );
}
