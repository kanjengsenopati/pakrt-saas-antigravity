import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Aktivitas } from '../../database/db';
import { Text } from '../../components/ui/Typography';
import { 
    Users, 
    ShieldCheck,
    Package,
    ChatDots,
    Notebook,
    Money,
    UserCircle,
    Gear,
    CalendarBlank, 
    CalendarCheck,
    ClockCounterClockwise,
    Wallet,
    FileText,
    ArrowRight,
    Bell,
    House,
    Minus,
    Plus
} from '@phosphor-icons/react';
import { formatRupiah } from '../../utils/currency';
import { dateUtils } from '../../utils/date';
import { aktivitasService } from '../../services/aktivitasService';
import { agendaService } from '../../services/agendaService';
import { statsService } from '../../services/statsService';
import { pengurusService } from '../../services/pengurusService';

const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function Dashboard() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { currentTenant, currentScope } = useTenant();
    
    const [stats, setStats] = useState({ warga: 0, pengurus: 0, aset: 0, agenda: 0, saldo: 0, pendingSurat: 0, pendingIuran: 0 });
    const [recentActivities, setRecentActivities] = useState<Aktivitas[]>([]);
    const [upcomingAgenda, setUpcomingAgenda] = useState<any[]>([]);
    const [activeMenuTab, setActiveMenuTab] = useState<'utama' | 'lainnya'>('utama');
    const [fontScale, setFontScale] = useState(() => {
        const saved = localStorage.getItem('pakrt_font_scale');
        return saved ? parseFloat(saved) : 1;
    });

    useEffect(() => {
        localStorage.setItem('pakrt_font_scale', fontScale.toString());
        document.documentElement.style.fontSize = `${16 * fontScale}px`;
    }, [fontScale]);

    const isWarga = useMemo(() =>
        authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga',
    [authUser?.role, authUser?.role_entity?.name]);


    const fetchStats = useCallback(async () => {
        if (!currentTenant) return;
        try {
            if (!isWarga) {
                const data = await statsService.getDashboardStats(currentScope);
                setStats(prev => ({
                    ...prev,
                    warga: data.totalWarga || 0,
                    aset: data.totalAset || 0,
                    saldo: data.financialTrend?.reduce((acc: any, curr: any) => 
                        curr.tipe === 'pemasukan' ? acc + (curr._sum.nominal || 0) : acc - (curr._sum.nominal || 0), 0) || 0,
                    pendingSurat: data.totalSuratPending || 0,
                    pendingIuran: data.iuranPending || 0
                }));
                
                const [pengurusCount, agendaCount] = await Promise.all([
                    pengurusService.count(currentTenant.id, currentScope),
                    agendaService.count(currentTenant.id, currentScope)
                ]);
                
                setStats(prev => ({
                    ...prev,
                    pengurus: pengurusCount || 0,
                    agenda: agendaCount || 0
                }));

            }
        } catch (error) {
            console.error("Dashboard: Unexpected error in fetchStats:", error);
        }
    }, [currentTenant, currentScope, isWarga]);

    const fetchActivities = useCallback(async () => {
        if (!currentTenant) return;
        try {
            const agendas = await agendaService.getUpcoming(currentTenant.id, currentScope, 3);
            
            let activities: Aktivitas[] = [];
            if (!isWarga) {
                try {
                    activities = await aktivitasService.getRecent(currentTenant.id, currentScope, 5);
                } catch(e) {
                     console.warn("Dashboard: Skipping aktivitas API due to permissions");
                }
            }
            
            setRecentActivities(activities);
            setUpcomingAgenda(agendas || []);
        } catch (error) {
            console.error("Dashboard: Error fetching activities:", error);
        }
    }, [currentTenant, currentScope, isWarga]);

    useEffect(() => {
        if (currentTenant?.id && authUser?.id) {
            // Protective redirect for Warga to the new Warga Portal
            if (isWarga) {
                navigate('/warga-portal', { replace: true });
                return;
            }

            // Initial fetch for non-warga
            fetchStats();
            fetchActivities();
        }
    }, [currentTenant?.id, currentScope, authUser?.id, isWarga, navigate, fetchStats, fetchActivities]);

    useEffect(() => {
        const interval = setInterval(() => { 
            if (currentTenant?.id && authUser?.id && document.visibilityState === 'visible') {
                fetchStats(); 
                fetchActivities(); 
            }
        }, 120000);
        return () => clearInterval(interval);
    }, [currentTenant?.id, currentScope, authUser?.id, fetchStats, fetchActivities]);

    const formatDate = (timestamp: number) => {
        return dateUtils.toDisplay(new Date(timestamp));
    };

    return (
        <div className="space-y-8 animate-fade-in pb-32 max-w-4xl mx-auto px-5 md:px-0" translate="no">
            {/* Header / Top Navigation Mock (Mobile Style) */}
            <div className="flex items-center justify-between mt-2 md:mt-0">
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-[0.75rem] hover:bg-slate-100 transition-colors md:hidden">
                        <Users weight="bold" className="w-6 h-6 text-slate-800" />
                    </button>
                    <Text.Label className="!text-slate-500">Dashboard Pengurus</Text.Label>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bell weight="bold" className="w-6 h-6 text-slate-800" />
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[0.625rem] font-bold text-white">3</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white shadow-premium flex items-center justify-center text-white font-bold text-sm">
                        {authUser?.name ? authUser.name.substring(0,2).toUpperCase() : 'RT'}
                    </div>
                </div>
            </div>

            {/* Greeting Section */}
            <div className="pt-2 flex justify-between items-end">
                <div>
                    <Text.H1>
                        Selamat Pagi, {authUser?.name?.split(' ')[0] || 'Pengurus'}
                    </Text.H1>
                    <Text.Body className="mt-1">
                        Anda tercatat sebagai {authUser?.role_entity?.name || authUser?.role || 'Pengurus'} di {currentScope}, {currentTenant?.name}.
                    </Text.Body>
                </div>
                <div className="flex items-center bg-slate-200/50 rounded-full px-1.5 py-1 mb-1">
                    <button onClick={() => setFontScale(s => Math.max(0.8, Number((s - 0.1).toFixed(1))))} className="p-1 text-slate-500 hover:text-slate-800 active:scale-95 transition-all">
                        <Minus size={14} weight="bold" />
                    </button>
                    <span className="text-[0.625rem] font-bold text-slate-700 w-8 text-center tabular-nums">{Math.round(fontScale * 100)}%</span>
                    <button onClick={() => setFontScale(s => Math.min(1.5, Number((s + 0.1).toFixed(1))))} className="p-1 text-slate-500 hover:text-slate-800 active:scale-95 transition-all">
                        <Plus size={14} weight="bold" />
                    </button>
                </div>
            </div>

            {/* Summary Grid - Compact & Dense for Management Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-4">
                {/* 1. Total Iuran Card (Royal Blue) */}
                <div 
                    onClick={() => navigate('/iuran')}
                    className="bg-brand-600 rounded-[1.125rem] p-4 text-white shadow-premium shadow-brand-500/20 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <Wallet weight="fill" className="w-16 h-16 md:w-32 md:h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-2">
                            <Text.Label className="!text-white opacity-80 !text-[0.625rem] md:!text-xs uppercase !tracking-tight">Total Iuran</Text.Label>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-1.5 border border-white/20">
                                <Wallet weight="fill" className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                        </div>
                        <div>
                            <Text.Amount className="!text-white text-base md:text-2xl lg:text-3xl tracking-tighter leading-none block">
                                {formatRupiah(stats.saldo)}
                            </Text.Amount>
                            <Text.Caption className="!text-white font-medium opacity-80 mt-1 !text-[0.5625rem] md:!text-[0.6875rem] italic block !tracking-tight">
                                85% Warga Membayar
                            </Text.Caption>
                        </div>
                    </div>
                </div>

                {/* 2. Aduan Card (Coral/Red Alert) */}
                <div 
                    onClick={() => navigate('/surat')}
                    className="bg-coral-500 rounded-[1.125rem] p-4 text-white shadow-premium shadow-coral-500/20 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <FileText weight="fill" className="w-16 h-16 md:w-32 md:h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-2">
                            <Text.Label className="!text-white opacity-80 !text-[0.625rem] md:!text-xs uppercase !tracking-tight">Aduan Pending</Text.Label>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-1.5 border border-white/20">
                                <Bell weight="fill" className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                        </div>
                        <div>
                            <Text.Amount className="!text-white text-base md:text-2xl lg:text-3xl tracking-tighter leading-none block">
                                {stats.pendingSurat} Laporan
                            </Text.Amount>
                            <Text.Caption className="!text-white font-medium opacity-80 mt-1 !text-[0.5625rem] md:!text-[0.6875rem] italic block !tracking-tight">
                                Tindak Lanjut Segera
                            </Text.Caption>
                        </div>
                    </div>
                </div>

                {/* 3. Community Spotlight (Deep Navy/Blue) */}
                <div 
                    onClick={() => navigate('/agenda')}
                    className="bg-navy-900 rounded-[1.125rem] p-4 text-white shadow-premium shadow-navy-900/20 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98] col-span-2 md:col-span-1"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <CalendarCheck weight="fill" className="w-16 h-16 md:w-32 md:h-32" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-2">
                            <Text.Label className="!text-white opacity-80 !text-[0.625rem] md:!text-xs uppercase !tracking-tight">Spotlight Agenda</Text.Label>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-1.5 border border-white/20">
                                <CalendarCheck weight="fill" className="w-4 h-4 md:w-6 md:h-6" />
                            </div>
                        </div>
                        <div>
                            <Text.H2 className="!text-white text-base md:text-xl leading-tight line-clamp-1 mb-1 !font-bold">
                                {upcomingAgenda.length > 0 ? upcomingAgenda[0].judul : 'Kerja Bakti Rutin'}
                            </Text.H2>
                            <Text.Caption className="!text-white font-medium opacity-80 italic line-clamp-1 block !text-[0.625rem] md:!text-[0.75rem] !tracking-tight">
                                {upcomingAgenda.length > 0 ? upcomingAgenda[0].deskripsi : 'Pembersihan saluran air.'}
                            </Text.Caption>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabbed Multi-Action Grid - Redesigned Interface */}
            <div className="px-1 md:px-0 mt-4">
                {/* Tabs Switcher */}
                <div className="flex items-center gap-2 mb-8 p-1.5 bg-slate-100/50 rounded-[0.875rem] w-fit mx-auto md:mx-0">
                    <button 
                        onClick={() => setActiveMenuTab('utama')}
                        className={`px-8 py-2.5 rounded-[0.75rem] text-sm font-bold transition-all duration-300 ${
                            activeMenuTab === 'utama' 
                            ? 'bg-white text-brand-600 shadow-premium border border-slate-200/50' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Menu Utama
                    </button>
                    <button 
                        onClick={() => setActiveMenuTab('lainnya')}
                        className={`px-8 py-2.5 rounded-[0.75rem] text-sm font-bold transition-all duration-300 ${
                            activeMenuTab === 'lainnya' 
                            ? 'bg-white text-brand-600 shadow-premium border border-slate-200/50' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Lainnya
                    </button>
                </div>

                {activeMenuTab === 'utama' ? (
                    <div className="space-y-12 animate-fade-in">
                        {/* 4 Column Menu Utama */}
                        <div className="grid grid-cols-4 gap-4 md:gap-8">
                            {[
                                { label: 'Buku Kas', icon: Money, color: 'bg-brand-50 text-brand-600', link: '/keuangan' },
                                { label: 'Iuran', icon: Wallet, color: 'bg-emerald-50 text-emerald-600', link: '/iuran' },
                                { label: 'Agenda', icon: CalendarBlank, color: 'bg-blue-50 text-blue-600', link: '/agenda' },
                                { label: 'Notulen', icon: Notebook, color: 'bg-amber-50 text-amber-600', link: '/notulensi' },
                            ].map((action, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 group">
                                    <button 
                                        onClick={() => navigate(action.link)}
                                        className={`w-14 h-14 md:w-20 md:h-20 ${action.color} rounded-[1.25rem] flex items-center justify-center relative shadow-premium border border-slate-100/50 group-hover:shadow-md group-hover:scale-105 active:scale-95 transition-all duration-300`}
                                    >
                                        <action.icon weight="duotone" className="w-6 h-6 md:w-10 md:h-10" />
                                    </button>
                                    <Text.Label className="text-center truncate w-full px-1">
                                        {action.label}
                                    </Text.Label>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activities moved here for Menu Utama */}
                        {!isWarga && (
                            <div className="animate-fade-in-up">
                                <div className="bg-white rounded-[1.25rem] p-6 shadow-premium border border-slate-100">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <ClockCounterClockwise size={20} className="text-brand-600" />
                                            <Text.Label className="!text-slate-800">Informasi Terbaru</Text.Label>
                                        </div>
                                    </div>
                                    <div className="space-y-5">
                                        {recentActivities.slice(0, 3).length > 0 ? (
                                            recentActivities.slice(0, 3).map((act: any) => (
                                                <div key={act.id} className="flex gap-4 p-4 rounded-[1rem] hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                    <div className="w-10 h-10 rounded-[0.75rem] bg-brand-50 flex items-center justify-center shrink-0">
                                                        <ArrowRight className="text-brand-600" />
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <Text.H2 className="!font-bold !text-slate-900 leading-tight">{toTitleCase(act.details)}</Text.H2>
                                                        <Text.Caption className="mt-1 italic">{formatDate(act.timestamp)}</Text.Caption>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <Text.Body className="italic py-4 text-center opacity-50">Belum ada informasi terbaru.</Text.Body>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Tab Lainnya: 4 Columns x 2 Rows with 1.5x Scale */
                    <div className="grid grid-cols-4 gap-4 md:gap-8 animate-fade-in">
                        {[
                            { label: 'Warga', icon: Users, color: 'bg-blue-50 text-blue-600', link: '/warga' },
                            { label: 'Pengurus', icon: UserCircle, color: 'bg-brand-50 text-brand-600', link: '/pengurus' },
                            { label: 'Surat', icon: FileText, color: 'bg-indigo-50 text-indigo-600', link: '/surat' },
                            { label: 'Ronda', icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600', link: '/ronda' },
                            { label: 'Aduan', icon: ChatDots, color: 'bg-coral-50 text-coral-600', link: '/aduan' },
                            { label: 'Aset RT', icon: Package, color: 'bg-amber-50 text-amber-600', link: '/aset' },
                            { label: 'Profile', icon: UserCircle, color: 'bg-slate-50 text-slate-400', link: '/profile' },
                            { label: 'Setting', icon: Gear, color: 'bg-slate-50 text-slate-400', link: '/pengaturan' },
                        ].map((action, i) => (
                            <div key={i} className="flex flex-col items-center gap-3 group">
                                <button 
                                    onClick={() => navigate(action.link)}
                                    className={`w-14 h-14 md:w-20 md:h-20 ${action.color} rounded-[1.25rem] flex items-center justify-center relative shadow-premium border border-slate-100 group-hover:shadow-md group-hover:scale-105 active:scale-95 transition-all duration-300`}
                                >
                                    <action.icon weight="duotone" className="w-6 h-6 md:w-10 md:h-10" />
                                </button>
                                <Text.Label className="text-center truncate w-full px-1">
                                    {action.label}
                                </Text.Label>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Fixed Bottom Navigation - Mobile Experience Refinement */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around z-50 md:hidden pb-1">
                <div className="flex flex-col items-center gap-1.5 text-brand-600">
                    <div className="bg-brand-50 px-5 py-1.5 rounded-[0.75rem] transition-all active:scale-95">
                        <House weight="fill" className="w-6 h-6" />
                    </div>
                    <Text.Caption className="!text-brand-600 font-bold">Beranda</Text.Caption>
                </div>
                <div onClick={() => navigate('/warga')} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-brand-600 transition-colors">
                    <Users weight="bold" className="w-6 h-6" />
                    <Text.Caption>Warga</Text.Caption>
                </div>
                <div onClick={() => navigate('/surat')} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-brand-600 transition-colors">
                    <FileText weight="bold" className="w-6 h-6" />
                    <Text.Caption>Surat</Text.Caption>
                </div>
                <div onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-brand-600 transition-colors">
                    <UserCircle weight="bold" className="w-6 h-6" />
                    <Text.Caption>Akun</Text.Caption>
                </div>
            </div>

        </div>
    );
}
