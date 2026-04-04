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
    Gear,
    CalendarBlank, 
    CalendarCheck,
    Wallet,
    FileText,
    ArrowRight,
    Bell,
    House,
    Minus,
    Plus,
    TrendUp,
    Gavel,
    IdentificationCard,
    Megaphone,
    CaretLeft,
    CaretRight
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
    const [activityPage, setActivityPage] = useState(1);
    const [activeMenuTab, setActiveMenuTab] = useState<'utama' | 'lainnya'>('utama');

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
            // Removed unused agendas fetch
            
            let activities: Aktivitas[] = [];
            if (!isWarga) {
                try {
                    activities = await aktivitasService.getRecent(currentTenant.id, currentScope, 5);
                } catch(e) {
                     console.warn("Dashboard: Skipping aktivitas API due to permissions");
                }
            }
            
            setRecentActivities(activities);
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
        <div className="bg-background text-on-background font-body min-h-screen pb-24 animate-fade-in" translate="no">
            {activeMenuTab === 'utama' ? (
                <>
                    {/* Immersive Header Section */}
                    <div className="relative pb-24">
                        {/* Large Blue Header */}
                        <header className="w-full bg-primary text-white rounded-b-[2rem] shadow-none bg-gradient-to-br from-primary to-primary-dim pt-8 pb-32 px-6">
                            <div className="flex justify-between items-center max-w-4xl mx-auto">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-white/10 flex items-center justify-center font-bold text-lg text-white">
                                        {authUser?.name ? authUser.name.substring(0,2).toUpperCase() : 'RT'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[0.7rem] font-medium text-blue-100/70 uppercase tracking-widest">{authUser?.role_entity?.name || authUser?.role || 'Administrator'}</span>
                                        <div className="flex items-end gap-3">
                                            <h1 className="text-3xl font-extrabold tracking-tight font-headline leading-none">{currentScope || currentTenant?.name || 'Admin RT'}</h1>
                                            {currentTenant?.location_detail && (
                                                <div className="flex flex-col gap-1 mb-[1px]">
                                                    <span className="text-[0.75rem] font-bold text-white tracking-widest uppercase leading-none">
                                                        {currentTenant.location_detail.split(' • ')[0]}
                                                    </span>
                                                    <span className="text-[0.6rem] font-medium text-blue-100/60 uppercase tracking-tight line-clamp-1 leading-none">
                                                        {currentTenant.location_detail.split(' • ').slice(1).join(' • ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 active:scale-95">
                                    <div className="relative">
                                        <Bell weight="fill" className="text-white text-2xl" />
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-primary"></span>
                                    </div>
                                </button>
                            </div>
                        </header>

                        {/* Overlapping Card - Keuangan */}
                        <div className="absolute bottom-0 left-0 w-full px-6 translate-y-16">
                            <div className="max-w-4xl mx-auto">
                                <section className="bg-white rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <p className="text-slate-500 font-label text-xs font-medium mb-1">Total Kas RT</p>
                                                <h2 className="text-2xl font-extrabold font-headline tracking-tight text-slate-900 leading-tight">{formatRupiah(stats.saldo)}</h2>
                                            </div>
                                            <div className="bg-blue-50 p-2.5 rounded-2xl">
                                                <Wallet weight="fill" className="text-primary text-xl" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mb-5">
                                            <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                                <TrendUp weight="bold" className="text-[12px] mr-1" />
                                                Active
                                            </span>
                                            <span className="text-slate-400 text-[10px] font-medium">Update realtime</span>
                                        </div>
                                        <button onClick={() => navigate('/keuangan')} className="w-full py-3 bg-primary text-white font-bold rounded-2xl text-sm transition-all hover:bg-primary-dim active:scale-[0.98] shadow-lg shadow-primary/30">
                                            Lihat Detail Kas
                                        </button>

                                        {/* Informasi Berlangganan Section */}
                                        <div className="border-t border-slate-100 pt-4 mt-4">
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <div className="w-7 h-7 rounded-xl bg-orange-50 shrink-0 flex items-center justify-center">
                                                    <ShieldCheck weight="fill" className="text-orange-500 text-base" />
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-700 truncate">Informasi Berlangganan Aplikasi PakRT</p>
                                            </div>
                                            <div className="flex items-center justify-between pl-9">
                                                <span className="px-2.5 py-1 bg-orange-500 text-white text-[9px] font-black rounded-full shrink-0 uppercase tracking-wider">
                                                    Sisa 15 Hari
                                                </span>
                                                <button 
                                                    onClick={() => navigate('/pengaturan')} 
                                                    className="text-primary font-bold text-[10px] flex items-center gap-1 hover:underline active:scale-95 transition-all"
                                                >
                                                    Detail
                                                    <ArrowRight weight="bold" className="text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Canvas */}
                    <main className="mt-20 px-6 space-y-8 max-w-4xl mx-auto">
                        {/* Stats Bento Grid Section */}
                        <section>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-bold tracking-tight text-on-surface font-headline">Manajemen Warga</h3>
                                <span className="text-primary font-bold text-sm cursor-pointer hover:underline" onClick={() => setActiveMenuTab('lainnya')}>Lihat Semua</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Stats 1: Ajuan Surat */}
                                <div onClick={() => navigate('/surat')} className="col-span-2 bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(0,80,212,0.08)] flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <FileText weight="fill" className="text-primary text-2xl" />
                                        </div>
                                        <div>
                                            <p className="text-[15px] font-bold text-on-surface">Ajuan Surat</p>
                                            <p className="text-on-surface-variant text-xs font-medium">{stats.pendingSurat} Surat Baru</p>
                                        </div>
                                    </div>
                                    <ArrowRight weight="bold" className="text-on-surface-variant" />
                                </div>

                                {/* Stats 2: Aduan Warga */}
                                <div onClick={() => navigate('/aduan')} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(0,80,212,0.08)] flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 shrink-0 rounded-xl bg-red-50 flex items-center justify-center">
                                            <ChatDots weight="fill" className="text-error text-2xl" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-on-surface leading-tight">Aduan</p>
                                            <p className="text-[10px] font-bold text-error uppercase tracking-tight">Aktif</p>
                                        </div>
                                    </div>
                                    <ArrowRight weight="bold" className="text-on-surface-variant text-sm" />
                                </div>

                                {/* Stats 3: Agenda Warga */}
                                <div onClick={() => navigate('/agenda')} className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_12px_32px_-4px_rgba(0,80,212,0.08)] flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 shrink-0 rounded-xl bg-purple-50 flex items-center justify-center">
                                            <CalendarBlank weight="fill" className="text-tertiary text-2xl" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-bold text-on-surface leading-tight">Agenda</p>
                                            <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-tight">{stats.agenda} Event</p>
                                        </div>
                                    </div>
                                    <ArrowRight weight="bold" className="text-on-surface-variant text-sm" />
                                </div>
                            </div>
                        </section>

                        {/* Quick Summary List */}
                        {!isWarga && (
                            <section className="pb-10">
                                <h3 className="text-lg font-bold tracking-tight text-on-surface font-headline mb-5">Aktivitas Terakhir</h3>
                                <div className="space-y-4">
                                    {recentActivities.length > 0 ? (
                                        recentActivities.slice((activityPage - 1) * 5, activityPage * 5).map((act: any) => (
                                            <div key={act.id} className="flex items-center gap-4 p-5 bg-surface-container-low rounded-2xl">
                                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                    {act.tipe === 'KEUANGAN' || act.module === 'Keuangan' ? (
                                                        <Money weight="fill" className="text-primary text-xl" />
                                                    ) : act.module === 'Surat' ? (
                                                        <FileText weight="fill" className="text-tertiary text-xl" />
                                                    ) : (
                                                        <Bell weight="fill" className="text-emerald-500 text-xl" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-on-surface line-clamp-1">{toTitleCase(act.details)}</p>
                                                    <p className="text-[11px] font-medium text-on-surface-variant">{formatDate(act.timestamp)}</p>
                                                </div>
                                                <span className="px-2.5 py-1 bg-surface-container-highest text-on-surface-variant text-[10px] font-extrabold rounded-full">INFO</span>
                                            </div>
                                        ))
                                    ) : (
                                        <Text.Body className="italic py-4 text-center opacity-50">Belum ada informasi terbaru.</Text.Body>
                                    )}
                                </div>
                                {recentActivities.length > 5 && (
                                    <div className="flex justify-center items-center gap-4 mt-6">
                                        <button 
                                            disabled={activityPage === 1}
                                            onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface hover:bg-primary hover:text-white disabled:opacity-50 transition-colors"
                                        >
                                            <CaretLeft weight="bold" />
                                        </button>
                                        <span className="text-sm font-label text-on-surface-variant font-medium">
                                            {activityPage} / {Math.ceil(recentActivities.length / 5)}
                                        </span>
                                        <button 
                                            disabled={activityPage === Math.ceil(recentActivities.length / 5)}
                                            onClick={() => setActivityPage(prev => prev + 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface hover:bg-primary hover:text-white disabled:opacity-50 transition-colors"
                                        >
                                            <CaretRight weight="bold" />
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}
                    </main>
                </>
            ) : (
                <>
                    {/* Semua Layanan Pengurus view */}
                    <header className="bg-blue-700/80 dark:bg-blue-900/80 backdrop-blur-md rounded-b-[1.5rem] w-full sticky top-0 z-50 shadow-[0_12px_32px_-4px_rgba(0,80,212,0.08)] flex justify-between items-center px-6 py-4 max-w-4xl mx-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30 text-white font-bold text-sm">
                                {authUser?.name ? authUser.name.substring(0,2).toUpperCase() : 'RT'}
                            </div>
                            <div>
                                <p className="text-white/70 font-label text-[0.75rem] leading-none mb-1">{authUser?.role_entity?.name || authUser?.role || 'Pengurus'}</p>
                                <div className="flex items-end gap-3">
                                    <h1 className="font-headline font-bold text-white text-3xl tracking-tight leading-none">{currentScope || currentTenant?.name || 'Admin RT'}</h1>
                                    {currentTenant?.location_detail && (
                                        <div className="flex flex-col gap-1 mb-[1px]">
                                            <span className="text-[0.7rem] font-bold text-white tracking-widest uppercase leading-none">
                                                {currentTenant.location_detail.split(' • ')[0]}
                                            </span>
                                            <span className="text-[0.55rem] font-medium text-white/50 uppercase tracking-tight line-clamp-1 leading-none">
                                                {currentTenant.location_detail.split(' • ').slice(1).join(' • ')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white active:scale-90">
                            <Bell weight="bold" className="text-xl" />
                        </button>
                    </header>

                    <main className="pb-24 max-w-4xl mx-auto animate-fade-in-up mt-8">
                        {/* Hero Balance Section */}
                        <section className="px-6 -mt-4">
                            <div className="bg-primary bg-gradient-to-br from-primary to-primary-dim rounded-xl p-6 shadow-[0_12px_32px_-4px_rgba(0,80,212,0.15)] relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white"></path>
                                    </svg>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-white/80 font-label text-[0.75rem] tracking-wider uppercase font-bold">Total Kas RT</p>
                                        <Wallet weight="regular" className="text-white/60 text-xl" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-white/60 font-headline font-semibold text-lg">Rp</span>
                                        <h2 className="text-white font-headline font-extrabold text-3xl tracking-tight">{formatRupiah(stats.saldo).replace('Rp', '').trim()}</h2>
                                    </div>
                                    <div className="mt-6 flex gap-4">
                                        <button onClick={() => navigate('/keuangan/baru?tipe=pemasukan')} className="flex-1 bg-white/20 backdrop-blur-sm py-2.5 rounded-lg text-white font-label text-[0.8rem] font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2 active:scale-95">
                                            <Plus weight="bold" /> Pemasukan
                                        </button>
                                        <button onClick={() => navigate('/keuangan/baru?tipe=pengeluaran')} className="flex-1 bg-white/10 backdrop-blur-sm py-2.5 rounded-lg text-white font-label text-[0.8rem] font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2 active:scale-95">
                                            <Minus weight="bold" /> Pengeluaran
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Services Section Grid 3x3 */}
                        <section className="mt-8 px-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-headline font-bold text-on-surface text-[1.5rem] tracking-tight -ml-0.5">Layanan Pengurus</h3>
                                <span className="px-3 py-1 bg-tertiary-container/30 text-on-tertiary-container rounded-full text-[0.7rem] font-bold font-label">Akses Eksklusif</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-x-4 gap-y-8">
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/keuangan')}>
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-700 dark:text-blue-400 group-active:scale-95 transition-transform">
                                        <Money weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Kas RT</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/aset')}>
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-active:scale-95 transition-transform">
                                        <Package weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Aset RT</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/pengaturan')}>
                                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-700 dark:text-amber-400 group-active:scale-95 transition-transform">
                                        <Gavel weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">AD/ART</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/pengurus')}>
                                    <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-700 dark:text-purple-400 group-active:scale-95 transition-transform">
                                        <IdentificationCard weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Pengurus</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/ronda')}>
                                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-700 dark:text-red-400 group-active:scale-95 transition-transform">
                                        <ShieldCheck weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Ronda</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/notulensi')}>
                                    <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-lg flex items-center justify-center text-sky-700 dark:text-sky-400 group-active:scale-95 transition-transform">
                                        <Notebook weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Notulen</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/aduan')}>
                                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center text-rose-700 dark:text-rose-400 group-active:scale-95 transition-transform">
                                        <Megaphone weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Aduan Warga</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/agenda')}>
                                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-700 dark:text-indigo-400 group-active:scale-95 transition-transform">
                                        <CalendarCheck weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Agenda Warga</span>
                                </div>
                                <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/warga')}>
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300 group-active:scale-95 transition-transform">
                                        <Users weight="fill" className="text-[2rem]" />
                                    </div>
                                    <span className="text-center font-label text-[0.8rem] font-semibold text-on-surface-variant leading-tight">Warga</span>
                                </div>
                            </div>
                        </section>

                        {!isWarga && (
                            <section className="mt-12 px-6">
                                <h4 className="font-headline font-bold text-on-surface-variant text-[1.2rem] mb-4">Aktivitas Terkini</h4>
                                <div className="space-y-4">
                                    {recentActivities.length > 0 ? recentActivities.slice((activityPage - 1) * 5, activityPage * 5).map((act: any) => (
                                        <div key={act.id} className="bg-surface-container-lowest p-4 rounded-xl shadow-[0_8px_24px_-4px_rgba(0,80,212,0.05)] flex gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${act.tipe === 'KEUANGAN' || act.module === 'Keuangan' ? 'bg-secondary-container/30 text-secondary' : 'bg-tertiary-container/20 text-tertiary'}`}>
                                                {act.tipe === 'KEUANGAN' || act.module === 'Keuangan' ? <Money weight="fill" className="text-xl" /> : <ChatDots weight="fill" className="text-xl" />}
                                            </div>
                                            <div>
                                                <p className="font-body text-[0.875rem] font-bold text-on-surface line-clamp-1">{toTitleCase(act.details)}</p>
                                                <p className="font-label text-[0.75rem] text-on-surface-variant">{formatDate(act.timestamp)}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <Text.Body className="italic py-4 text-center opacity-50">Belum ada informasi terbaru.</Text.Body>
                                    )}
                                </div>
                                {recentActivities.length > 5 && (
                                    <div className="flex justify-center items-center gap-4 mt-6">
                                        <button 
                                            disabled={activityPage === 1}
                                            onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-primary-dim hover:text-white disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            <CaretLeft weight="bold" />
                                        </button>
                                        <span className="text-sm font-label text-on-surface-variant font-medium">
                                            {activityPage} / {Math.ceil(recentActivities.length / 5)}
                                        </span>
                                        <button 
                                            disabled={activityPage === Math.ceil(recentActivities.length / 5)}
                                            onClick={() => setActivityPage(prev => prev + 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low text-on-surface hover:bg-primary-dim hover:text-white disabled:opacity-50 transition-colors shadow-sm"
                                        >
                                            <CaretRight weight="bold" />
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}
                    </main>
                </>
            )}

            {/* BottomNavBar */}
            <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-t-[1.5rem] flex justify-around items-center px-4 py-3 pb-safe shadow-[0_-8px_24px_-4px_rgba(0,80,212,0.05)] md:hidden">
                <button onClick={() => setActiveMenuTab('utama')} className={`flex flex-col items-center justify-center transition-all duration-200 ${activeMenuTab === 'utama' ? 'text-blue-700 dark:text-blue-400 scale-110 active:scale-90' : 'text-slate-400 dark:text-slate-500 hover:text-blue-500 active:scale-90'}`}>
                    <House weight={activeMenuTab === 'utama' ? 'fill' : 'regular'} className="text-[1.7rem]" />
                </button>
                <button onClick={() => setActiveMenuTab('lainnya')} className={`flex flex-col items-center justify-center transition-all duration-200 ${activeMenuTab === 'lainnya' ? 'text-blue-700 dark:text-blue-400 scale-110 active:scale-90' : 'text-slate-400 dark:text-slate-500 hover:text-blue-500 active:scale-90'}`}>
                    <Gear weight={activeMenuTab === 'lainnya' ? 'fill' : 'regular'} className="text-[1.7rem]" />
                </button>
                <button onClick={() => navigate('/keuangan')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-all active:scale-90 duration-200">
                    <Wallet weight="regular" className="text-[1.7rem]" />
                </button>
                <button onClick={() => navigate('/surat')} className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-all active:scale-90 duration-200">
                    <FileText weight="regular" className="text-[1.7rem]" />
                </button>
            </nav>
        </div>
    );
}
