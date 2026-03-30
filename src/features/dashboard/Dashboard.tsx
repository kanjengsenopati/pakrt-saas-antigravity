import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Aktivitas } from '../../database/db';
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
    House
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
        <div className="space-y-6 animate-fade-in pb-32 max-w-4xl mx-auto md:px-0" translate="no">
            {/* Header / Top Navigation Mock (Mobile Style) */}
            <div className="flex items-center justify-between mt-2 md:mt-0">
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors md:hidden">
                        <Users weight="bold" className="w-6 h-6 text-slate-800" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard Pengurus</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Bell weight="bold" className="w-6 h-6 text-slate-800" />
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white">3</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold text-sm">
                        {authUser?.name ? authUser.name.substring(0,2).toUpperCase() : 'RT'}
                    </div>
                </div>
            </div>

            {/* Greeting Section */}
            <div className="pt-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Selamat Pagi, {authUser?.name?.split(' ')[0] || 'Pengurus'}
                </h1>
                <p className="text-sm md:text-base text-slate-500 font-medium mt-1 leading-relaxed">
                    Anda tercatat sebagai {authUser?.role_entity?.name || authUser?.role || 'Pengurus'} di {currentScope}, {currentTenant?.name}.
                </p>
            </div>

            {/* Summary Grid - Compact & Dense for Management Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {/* 1. Total Iuran Card (Royal Blue) */}
                <div 
                    onClick={() => navigate('/iuran')}
                    className="bg-brand-600 rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 text-white shadow-lg shadow-brand-500/10 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <Wallet weight="fill" className="w-20 h-20 md:w-40 md:h-40" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold tracking-wider opacity-80 mb-1">Total Iuran</p>
                            <span className="text-xl md:text-3xl font-bold tracking-tight">{formatRupiah(stats.saldo)}</span>
                            <p className="text-[9px] md:text-[11px] font-medium opacity-90 mt-1 italic">85% Warga Membayar</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 shrink-0 border border-white/30">
                            <Wallet weight="fill" className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                    </div>
                </div>

                {/* 2. Aduan Card (Coral/Red Alert) */}
                <div 
                    onClick={() => navigate('/surat')}
                    className="bg-coral-500 rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 text-white shadow-lg shadow-coral-500/10 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <FileText weight="fill" className="w-20 h-20 md:w-40 md:h-40" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] md:text-xs font-bold tracking-wider opacity-80 mb-1">Aduan Pending</p>
                            <span className="text-xl md:text-3xl font-bold tracking-tight">{stats.pendingSurat} Laporan</span>
                            <p className="text-[9px] md:text-[11px] font-medium opacity-90 mt-1 italic">Tindak Lanjut Segera</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 shrink-0 border border-white/30">
                            <Bell weight="fill" className="w-5 h-5 md:w-7 md:h-7 animate-bounce-subtle" />
                        </div>
                    </div>
                </div>

                {/* 3. Community Spotlight (Deep Navy/Blue) */}
                <div 
                    onClick={() => navigate('/agenda')}
                    className="bg-navy-900 rounded-[1.25rem] md:rounded-[2rem] p-4 md:p-6 text-white shadow-lg shadow-navy-900/10 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <CalendarCheck weight="fill" className="w-20 h-20 md:w-40 md:h-40" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="max-w-[70%]">
                            <p className="text-[10px] md:text-xs font-bold tracking-wider opacity-80 mb-1">Spotlight Agenda</p>
                            <h3 className="text-base md:text-xl font-bold tracking-tight leading-tight truncate">
                                {upcomingAgenda.length > 0 ? upcomingAgenda[0].judul : 'Kerja Bakti Rutin'}
                            </h3>
                            <p className="text-[9px] md:text-[11px] font-medium opacity-90 mt-1 italic truncate">
                                {upcomingAgenda.length > 0 ? upcomingAgenda[0].deskripsi : 'Pembersihan saluran air.'}
                            </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-2 shrink-0 border border-white/30">
                            <CalendarCheck weight="fill" className="w-5 h-5 md:w-7 md:h-7" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Comprehensive Multi-Action Grid (12 Items) - Dense Style */}
            <div className="px-1 md:px-0 mt-2">
                <div className="grid grid-cols-4 md:grid-cols-6 gap-x-2 gap-y-6 md:gap-6">
                    {[
                        // Group 1: Kependudukan
                        { label: 'Warga', icon: Users, color: 'bg-blue-50 text-blue-600', link: '/warga' },
                        { label: 'Pengurus', icon: UserCircle, color: 'bg-slate-50 text-slate-600', link: '/pengurus' },
                        { label: 'Surat', icon: FileText, color: 'bg-slate-50 text-slate-600', link: '/surat' },
                        { label: 'Ronda', icon: ShieldCheck, color: 'bg-slate-50 text-slate-600', link: '/ronda' },
                        
                        // Group 2: Operasional
                        { label: 'Aduan', icon: ChatDots, color: 'bg-coral-50 text-coral-600', link: '/aduan' },
                        { label: 'Agenda', icon: CalendarBlank, color: 'bg-slate-50 text-slate-600', link: '/agenda' },
                        { label: 'Aset RT', icon: Package, color: 'bg-slate-50 text-slate-600', link: '/aset' },
                        { label: 'Notulen', icon: Notebook, color: 'bg-slate-50 text-slate-600', link: '/notulensi' },
                        
                        // Group 3: Keuangan & Admin
                        { label: 'Buku Kas', icon: Money, color: 'bg-emerald-50 text-emerald-600', link: '/keuangan' },
                        { label: 'Iuran', icon: Wallet, color: 'bg-slate-50 text-slate-600', link: '/iuran' },
                        { label: 'Profile', icon: UserCircle, color: 'bg-slate-50 text-slate-600', link: '/profile' },
                        { label: 'Setting', icon: Gear, color: 'bg-slate-50 text-slate-600', link: '/pengaturan' },
                    ].map((action, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 md:gap-3 group">
                            <button 
                                onClick={() => navigate(action.link)}
                                className={`w-14 h-14 md:w-20 md:h-20 ${action.color} rounded-2xl md:rounded-3xl flex items-center justify-center relative shadow-sm border border-slate-100/50 group-hover:shadow-md group-hover:scale-105 active:scale-95 transition-all duration-300`}
                            >
                                <action.icon weight="duotone" className="w-6 h-6 md:w-9 md:h-9" />
                            </button>
                            <span className="text-[9px] md:text-[11px] font-bold text-slate-500 tracking-wide text-center truncate w-full px-1">
                                {action.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed Bottom Navigation - Mobile Experience Refinement */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around z-50 md:hidden pb-1">
                <div className="flex flex-col items-center gap-1.5 text-brand-600">
                    <div className="bg-brand-50 px-5 py-1.5 rounded-full">
                        <House weight="fill" className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-widest">Beranda</span>
                </div>
                <div onClick={() => navigate('/warga')} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-brand-600 transition-colors">
                    <Users weight="bold" className="w-6 h-6" />
                    <span className="text-[10px] font-bold tracking-widest">Warga</span>
                </div>
                <div onClick={() => navigate('/surat')} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-brand-600 transition-colors">
                    <FileText weight="bold" className="w-6 h-6" />
                    <span className="text-[10px] font-bold tracking-widest">Surat</span>
                </div>
                <div onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-slate-400 active:text-brand-600 transition-colors">
                    <UserCircle weight="bold" className="w-6 h-6" />
                    <span className="text-[10px] font-bold tracking-widest">Akun</span>
                </div>
            </div>

            {/* Hidden Activities Section on Mobile (only md:block) */}
            {!isWarga && (
                <div className="mt-8 space-y-6 hidden md:block">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="section-label flex items-center gap-2 !text-slate-800 font-bold tracking-widest">
                                <ClockCounterClockwise size={20} className="text-brand-600" />
                                Aktivitas Terbaru
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {recentActivities.slice(0, 3).map((act: any) => (
                                <div key={act.id} className="flex gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                                        <ArrowRight className="text-brand-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 leading-none">{toTitleCase(act.details)}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 font-medium italic">{formatDate(act.timestamp)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
