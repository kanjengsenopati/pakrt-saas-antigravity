import { NavLink } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import {
    SquaresFour,
    Users,
    UserList,
    Notebook,
    CalendarCheck,
    Package,
    FileText,
    ShieldCheck,
    Gear,
    Wallet,
    Money,
    X
} from '@phosphor-icons/react';

const MENU_GROUPS = [
    {
        label: 'Menu Utama',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: SquaresFour },
        ]
    },
    {
        label: 'Kependudukan',
        items: [
            { path: '/warga', label: 'Data Warga', icon: Users },
            { path: '/pengurus', label: 'Data Pengurus', icon: UserList },
            { path: '/surat', label: 'Surat Pengantar', icon: FileText },
        ]
    },
    {
        label: 'Operasional',
        items: [
            { path: '/ronda', label: 'Jadwal Ronda', icon: ShieldCheck },
            { path: '/notulensi', label: 'Notulensi', icon: Notebook },
            { path: '/agenda', label: 'Agenda', icon: CalendarCheck },
            { path: '/aset', label: 'Aset RT', icon: Package },
        ]
    },
    {
        label: 'Keuangan',
        items: [
            { path: '/keuangan', label: 'Transaksi', icon: Wallet },
            { path: '/iuran', label: 'Iuran Warga', icon: Money },
        ]
    },
    {
        label: 'Administrasi',
        items: [
            { path: '/pengaturan', label: 'Pengaturan', icon: Gear },
        ]
    }
];

interface MobileMenuOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function MobileMenuOverlay({ isOpen, onClose }: MobileMenuOverlayProps) {
    const { currentTenant } = useTenant();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-slate-900 text-slate-100 flex flex-col shadow-2xl animate-slide-in-right overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent truncate max-w-[180px]" title={currentTenant?.name || 'PAKRT'}>
                            {currentTenant?.name || 'PAKRT'}
                        </h2>
                        <p className="section-label !text-[11px] mt-1">
                            Sistem Manajemen RT
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <X weight="bold" className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto scrollbar-thin pb-24">
                    {MENU_GROUPS.map((group) => (
                        <div key={group.label} className="space-y-1">
                            <h3 className="section-label px-4 mb-3">
                                {group.label}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            onClick={onClose}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isActive
                                                    ? 'bg-brand-600/10 text-brand-400 font-semibold ring-1 ring-brand-500/20 shadow-sm'
                                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                }`
                                            }
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-brand-500/10' : 'group-hover:bg-white/5'}`}>
                                                        <Icon
                                                            weight="duotone"
                                                            className="w-5 h-5 transition-transform group-hover:scale-110 group-active:scale-95 transition-all duration-300"
                                                        />
                                                    </div>
                                                    <span className="text-sm tracking-wide">{item.label}</span>
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </div>
    );
}
