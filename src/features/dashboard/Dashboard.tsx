import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Aktivitas } from '../../database/db';
import { 
    Users, 
    CalendarBlank, 
    CalendarCheck,
    ClockCounterClockwise,
    Wallet,
    FileText,
    ArrowRight,
    Bell,
    ChartLineUp,
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
        <div className="space-y-6 animate-fade-in pb-10 max-w-4xl mx-auto md:px-0" translate="no">
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

            {/* Summary Grid - Stitch High-Impact Style */}
            <div className="grid grid-cols-1 gap-4">
                {/* 1. Total Iuran Card (Royal Blue) */}
                <div 
                    onClick={() => navigate('/iuran')}
                    className="bg-brand-600 rounded-[2rem] p-6 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <Wallet weight="fill" className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Total Iuran Terkumpul</p>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl font-bold tracking-tight">{formatRupiah(stats.saldo)}</span>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 shrink-0 border border-white/30 ml-auto">
                                <Wallet weight="fill" className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs font-medium opacity-90 italic">Bulan {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date())} • 85% Warga Membayar</p>
                    </div>
                </div>

                {/* 2. Aduan Card (Coral/Red Alert) */}
                <div 
                    onClick={() => navigate('/surat')}
                    className="bg-[#ef5350] rounded-[2rem] p-6 text-white shadow-xl shadow-red-500/20 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <FileText weight="fill" className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Aduan Belum Selesai</p>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl font-bold tracking-tight">{stats.pendingSurat} Laporan</span>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 shrink-0 border border-white/30 ml-auto">
                                <Bell weight="fill" className="w-6 h-6 animate-bounce-subtle" />
                            </div>
                        </div>
                        <p className="text-xs font-medium opacity-90 italic">Butuh Tindak Lanjut Segera</p>
                    </div>
                </div>

                {/* 3. Community Spotlight (Deep Navy/Blue) */}
                <div 
                    onClick={() => navigate('/agenda')}
                    className="bg-[#1e3a8a] rounded-[2rem] p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group cursor-pointer transition-transform active:scale-[0.98]"
                >
                    <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-all duration-500">
                        <CalendarCheck weight="fill" className="w-40 h-40" />
                    </div>
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-2">Community Spotlight</p>
                        <div className="flex items-baseline gap-2 mb-2">
                            <h3 className="text-2xl font-bold tracking-tight leading-tight">
                                {upcomingAgenda.length > 0 ? upcomingAgenda[0].judul : 'Kerja Bakti Rutin'}
                            </h3>
                            <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 shrink-0 border border-white/30 ml-auto">
                                <CalendarCheck weight="fill" className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-sm font-medium opacity-90 leading-relaxed mb-3 line-clamp-2 max-w-[80%]">
                            {upcomingAgenda.length > 0 ? upcomingAgenda[0].deskripsi : 'Pembersihan saluran air di wilayah RT untuk persiapan musim hujan.'}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Kegiatan Mendatang</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Action Grid - Stitch Style Squares */}
            <div className="grid grid-cols-4 gap-4 px-2">
                {[
                    { label: 'Warga', icon: Users, color: 'bg-blue-50 text-blue-600', link: '/warga', badge: 5 },
                    { label: 'Surat', icon: FileText, color: 'bg-slate-50 text-slate-600', link: '/surat' },
                    { label: 'Stats', icon: ChartLineUp, color: 'bg-slate-50 text-slate-600', link: '/keuangan' },
                    { label: 'Agenda', icon: CalendarBlank, color: 'bg-slate-50 text-slate-600', link: '/agenda', badge: 3 },
                ].map((action, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <button 
                            onClick={() => navigate(action.link)}
                            className={`w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center relative shadow-sm border border-slate-100 hover:shadow-md hover:scale-105 active:scale-95 transition-all`}
                        >
                            <action.icon weight="duotone" className="w-7 h-7" />
                            {action.badge && (
                                <span className="absolute -top-1.5 -right-1.5 bg-[#ef5350] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    {action.badge}
                                </span>
                            )}
                        </button>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{action.label}</span>
                    </div>
                ))}
            </div>

            {/* Bottom Navigation Mock - Mobile Experience Refinement */}
            <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 flex items-center justify-around z-50 md:hidden">
                <div className="flex flex-col items-center gap-1.5 text-brand-600">
                    <div className="bg-brand-50 px-5 py-1.5 rounded-full">
                        <House weight="fill" className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest">Beranda</span>
                </div>
                <div onClick={() => navigate('/warga')} className="flex flex-col items-center gap-1.5 text-slate-400">
                    <Users weight="bold" className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Warga</span>
                </div>
                <div onClick={() => navigate('/surat')} className="flex flex-col items-center gap-1.5 text-slate-400">
                    <FileText weight="bold" className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Laporan</span>
                </div>
                <div onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-slate-400">
                    <Users weight="bold" className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Akun</span>
                </div>
            </div>

            {/* Existing Sections Merged Below */}
            {!isWarga && (
                <div className="mt-8 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="section-label flex items-center gap-2 !text-slate-800 font-bold uppercase tracking-widest">
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
