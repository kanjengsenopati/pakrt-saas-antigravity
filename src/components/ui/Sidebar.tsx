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
    CaretDown,
    CaretLeft,
    CaretRight,
    DotsThree,
    UserCircle,
    ChatDots,
    CrownSimple
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
            { path: '/warga-portal', label: 'Portal Warga', icon: UserCircle },
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
            { path: '/aduan', label: 'Aduan & Usulan', icon: ChatDots, permission: { module: 'Aduan & Usulan', action: 'Lihat' } },
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
            { path: '/subscription', label: 'Berlangganan', icon: CrownSimple },
            { path: '/pengaturan', label: 'Pengaturan', icon: Gear, permission: { module: 'Setup / Pengaturan', action: 'Lihat' } },
        ]
    }
];

interface SidebarProps {
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
    const { currentTenant, currentScope } = useTenant();
    const { hasPermission } = useAuth();
    const [kelurahanName, setKelurahanName] = useState<string>('');
    const [kecamatanName, setKecamatanName] = useState<string>('');
    const [pendingIuranCount, setPendingIuranCount] = useState<number>(0);
    const [expandedGroups, setExpandedGroups] = useState<string[]>(MENU_GROUPS.map(g => g.label));

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev => 
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    useEffect(() => {
        const fetchPendingIuran = async () => {
            if (currentTenant?.id && hasPermission('Iuran Warga', 'Ubah')) {
                try {
                    const { iuranService } = await import('../../services/iuranService');
                    const count = await iuranService.getPendingCount(currentScope);
                    setPendingIuranCount(count);
                } catch (error) {
                    console.error('Failed to fetch pending iuran count:', error);
                }
            }
        };
        fetchPendingIuran();
        
        const interval = setInterval(fetchPendingIuran, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [currentTenant, hasPermission, currentScope]);

    useEffect(() => {
        const fetchWilayahData = async () => {
            if (currentTenant?.id) {
                try {
                    const ids = currentTenant.id.split('.');
                    // Kelurahan is segment 4 (index 0,1,2,3)
                    if (ids.length >= 4) {
                        const kelId = ids.slice(0, 4).join('.');
                        const kel = await locationService.getWilayahById(kelId);
                        if (kel) setKelurahanName(kel.name.split(' ').map((w: any) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));
                    }
                    // Kecamatan is segment 3 (index 0,1,2)
                    if (ids.length >= 3) {
                        const kecId = ids.slice(0, 3).join('.');
                        const kec = await locationService.getWilayahById(kecId);
                        if (kec) setKecamatanName(kec.name.split(' ').map((w: any) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '));
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
        <aside className={`bg-white text-gray-900 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto overflow-x-hidden shadow-sm border-r border-gray-100 z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`p-4 sm:px-6 sm:py-5 border-b border-gray-100/80 flex items-center h-[78px] ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}>
                    <h2 className="text-[1.25rem] font-semibold text-gray-900 truncate tracking-tight" title={currentTenant?.name || 'PAKRT'}>
                        {getRtRwLabel()}
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5 tracking-tight font-medium truncate">
                        {kelurahanName ? `${kelurahanName}${kecamatanName ? `, ${kecamatanName}` : ''}` : 'Sistem Manajemen RT'}
                    </p>
                </div>
                {onToggle && (
                    <button onClick={onToggle} className="shrink-0 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title={isCollapsed ? "Buka Sidebar" : "Kecilkan Sidebar"}>
                        {isCollapsed ? <CaretRight weight="bold" className="w-5 h-5" /> : <CaretLeft weight="bold" className="w-5 h-5"/>}
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 sm:px-4 py-2 space-y-1.5 pb-6">
                {filteredMenuGroups.map((group) => {
                    const isExpanded = isCollapsed || expandedGroups.includes(group.label);
                    return (
                    <div key={group.label} className="space-y-0.5 mb-1">
                        {isCollapsed ? (
                            <div className="flex justify-center py-2 text-gray-300">
                                <DotsThree weight="bold" className="w-5 h-5" />
                            </div>
                        ) : (
                             <button 
                                onClick={() => toggleGroup(group.label)}
                                className="w-full flex items-center justify-between px-3 py-1 text-xs font-semibold text-gray-500 hover:text-gray-900 tracking-normal rounded-lg transition-colors group/header"
                            >
                                <span>{group.label}</span>
                                <CaretDown weight="bold" className={`w-3 h-3 text-gray-400 group-hover/header:text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                            </button>
                        )}
                        
                        <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        title={isCollapsed ? item.label : undefined}
                                        className={({ isActive }) =>
                                            `flex items-center rounded-xl transition-all duration-200 group overflow-hidden ${isCollapsed ? 'justify-center p-2 mx-1' : 'gap-2.5 px-3 py-1.5'} ${isActive
                                                ? 'bg-gray-50 text-gray-900 font-semibold border border-gray-100 shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                            }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className={`shrink-0 p-1 rounded-lg transition-all ${isActive ? 'bg-white text-brand-600 shadow-sm ring-1 ring-brand-100' : 'text-gray-400 group-hover:text-brand-500'}`}>
                                                    <Icon
                                                        weight={isActive ? "fill" : "duotone"}
                                                        className="w-[18px] h-[18px] transition-transform group-hover:scale-110 group-active:scale-95 duration-300"
                                                    />
                                                </div>
                                                <span className={`text-sm tracking-normal whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}>{item.label}</span>
                                                {!isCollapsed && item.label === 'Iuran Warga' && pendingIuranCount > 0 && (
                                                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
                                                        {pendingIuranCount}
                                                    </span>
                                                )}
                                                {isCollapsed && item.label === 'Iuran Warga' && pendingIuranCount > 0 && (
                                                    <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm animate-pulse" />
                                                )}
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

