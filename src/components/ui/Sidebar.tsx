import { NavLink } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { locationService } from '../../services/locationService';
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
    CaretDown
} from '@phosphor-icons/react';

interface MenuItem {
    path: string;
    label: string;
    icon: any;
    permission?: {
        module: string;
        action: string;
    };
}

interface MenuGroup {
    label: string;
    items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
    {
        label: 'Menu Utama',
        items: [
            { path: '/dashboard', label: 'Dashboard', icon: SquaresFour },
        ]
    },
    {
        label: 'Kependudukan',
        items: [
            { path: '/warga', label: 'Data Warga', icon: Users, permission: { module: 'Warga', action: 'Lihat' } },
            { path: '/pengurus', label: 'Data Pengurus', icon: UserList, permission: { module: 'Pengurus', action: 'Lihat' } },
            { path: '/surat', label: 'Surat Pengantar', icon: FileText, permission: { module: 'Surat / Cetak', action: 'Lihat' } },
        ]
    },
    {
        label: 'Operasional',
        items: [
            { path: '/ronda', label: 'Jadwal Ronda', icon: ShieldCheck, permission: { module: 'Jadwal Ronda', action: 'Lihat' } },
            { path: '/notulensi', label: 'Notulensi', icon: Notebook, permission: { module: 'Notulensi', action: 'Lihat' } },
            { path: '/agenda', label: 'Agenda', icon: CalendarCheck, permission: { module: 'Agenda', action: 'Lihat' } },
            { path: '/aset', label: 'Aset RT', icon: Package, permission: { module: 'Aset', action: 'Lihat' } },
        ]
    },
    {
        label: 'Keuangan',
        items: [
            { path: '/keuangan', label: 'Transaksi', icon: Wallet, permission: { module: 'Buku Kas / Transaksi', action: 'Lihat' } },
            { path: '/iuran', label: 'Iuran Warga', icon: Money, permission: { module: 'Iuran Warga', action: 'Lihat' } },
        ]
    },
    {
        label: 'Administrasi',
        items: [
            { path: '/pengaturan', label: 'Pengaturan', icon: Gear, permission: { module: 'Setup / Pengaturan', action: 'Lihat' } },
        ]
    }
];

export function Sidebar() {
    const { currentTenant } = useTenant();
    const { hasPermission } = useAuth();
    const [kelurahanName, setKelurahanName] = useState<string>('');
    const [expandedGroups, setExpandedGroups] = useState<string[]>(MENU_GROUPS.map(g => g.label));

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => 
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    useEffect(() => {
        const fetchWilayahData = async () => {
            if (currentTenant?.id) {
                try {
                    const ids = currentTenant.id.split('.');
                    if (ids.length >= 4) {
                        const kelId = ids.slice(0, 4).join('.');
                        const kel = await locationService.getWilayahById(kelId);
                        if (kel) setKelurahanName(kel.name);
                    }
                } catch (error) {
                    console.error('Failed to fetch wilayah name for sidebar:', error);
                }
            }
        };
        fetchWilayahData();
    }, [currentTenant]);

    const getRtRwLabel = () => {
        if (!currentTenant?.id) return 'PAKRT';
        const ids = currentTenant.id.split('.');
        if (ids.length >= 6) {
            const rw = ids[ids.length - 2];
            const rt = ids[ids.length - 1];
            return `RT ${rt} / RW ${rw}`;
        }
        return currentTenant.name;
    };

    const filteredMenuGroups = MENU_GROUPS.map(group => ({
        ...group,
        items: group.items.filter(item => 
            !item.permission || hasPermission(item.permission.module, item.permission.action)
        )
    })).filter(group => group.items.length > 0);

    return (
        <aside className="w-64 bg-white text-slate-800 flex flex-col h-screen fixed left-0 top-0 overflow-hidden shadow-sm border-r border-slate-100 z-50">
            <div className="p-6 border-b border-slate-100/80">
                <h2 className="text-[20px] font-bold text-slate-800 truncate tracking-tight" title={currentTenant?.name || 'PAKRT'}>
                    {getRtRwLabel()}
                </h2>
                <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-normal font-bold truncate">
                    {kelurahanName || 'Sistem Manajemen RT'}
                </p>
            </div>

            <nav className="flex-1 px-4 py-3 space-y-3 overflow-y-auto scrollbar-thin pb-6">
                {filteredMenuGroups.map((group) => {
                    const isExpanded = expandedGroups.includes(group.label);
                    return (
                    <div key={group.label} className="space-y-0.5 mb-2">
                        <button 
                            onClick={() => toggleGroup(group.label)}
                            className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-normal rounded-lg transition-colors group/header"
                        >
                            <span>{group.label}</span>
                            <CaretDown weight="bold" className={`w-3.5 h-3.5 text-slate-400 group-hover/header:text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                        </button>
                        
                        <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 group ${isActive
                                                ? 'bg-brand-50 text-brand-700 font-bold border border-brand-100/50 shadow-sm'
                                                : 'text-slate-800 hover:bg-slate-50 font-normal'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-white text-brand-600 shadow-sm ring-1 ring-brand-100' : 'text-slate-500 group-hover:text-brand-500'}`}>
                                                    <Icon
                                                        weight={isActive ? "fill" : "duotone"}
                                                        className="w-5 h-5 transition-transform group-hover:scale-110 group-active:scale-95 duration-300"
                                                    />
                                                </div>
                                                <span className="text-[14px] tracking-normal">{item.label}</span>
                                            </>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                )})}
            </nav>
        </aside>
    );
}

