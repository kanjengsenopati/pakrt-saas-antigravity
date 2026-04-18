import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Users, 
    ShieldCheck,
    Package,
    Notebook,
    Money,
    CalendarCheck,
    Wallet,
    HandCoins,

    ArrowRight,
    Bell,
    IdentificationCard,
    Megaphone,
    User,
    SignOut,
    GearSix
} from '@phosphor-icons/react';
import { formatRupiah } from '../../utils/currency';
import { agendaService } from '../../services/agendaService';
import { statsService } from '../../services/statsService';
import { pengurusService } from '../../services/pengurusService';
import { Text } from '../../components/ui/Typography';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { currentTenant, currentScope } = useTenant();
    
    const [stats, setStats] = useState({ warga: 0, pengurus: 0, aset: 0, agenda: 0, saldo: 0, pendingSurat: 0, pendingIuran: 0 });
    
    const subscriptionDaysRemaining = useMemo(() => {
        if (!currentTenant?.subscription_until) return 0;
        const until = new Date(currentTenant.subscription_until).getTime();
        const diff = until - Date.now();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }, [currentTenant?.subscription_until]);

    const isSubscriptionExpired = useMemo(() => {
        return currentTenant?.subscription_status === 'EXPIRED' || subscriptionDaysRemaining <= 0;
    }, [currentTenant?.subscription_status, subscriptionDaysRemaining]);

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

    useEffect(() => {
        if (currentTenant?.id && authUser?.id) {
            if (isWarga) {
                navigate('/warga-portal', { replace: true });
                return;
            }
            fetchStats();
        }
    }, [currentTenant?.id, currentScope, authUser?.id, isWarga, navigate, fetchStats]);

    useEffect(() => {
        const interval = setInterval(() => { 
            if (currentTenant?.id && authUser?.id && document.visibilityState === 'visible') {
                fetchStats(); 
            }
        }, 120000);
        return () => clearInterval(interval);
    }, [currentTenant?.id, currentScope, authUser?.id, fetchStats]);

    return (
        <div className="bg-background text-on-background font-body min-h-screen pb-24 animate-fade-in" translate="no">
            <>
                {/* Immersive Header Section */}
                <div className="bg-primary bg-gradient-to-br from-primary to-primary-dim rounded-b-[2rem] pb-20">
                    {/* Large Blue Header */}
                    <header className="w-full text-white pt-8 px-6">
                        <div className="flex justify-between items-center max-w-4xl mx-auto">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden shadow-lg bg-white/10 flex items-center justify-center font-bold text-lg text-white">
                                    {authUser?.name ? authUser.name.substring(0,2).toUpperCase() : 'RT'}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Text.H1 className="!text-white !text-3xl">RT</Text.H1>
                                    <div className="flex flex-col border-l border-white/20 pl-3">
                                        <Text.H2 className="!text-white !text-[0.9rem] leading-none mb-1 whitespace-nowrap">
                                            {currentTenant?.location_detail ? currentTenant.location_detail.split(' • ')[0] : 'RT 00 / RW 00'}
                                        </Text.H2>
                                        {currentTenant?.location_detail && (
                                            <Text.Caption className="!text-white/50 !text-[0.65rem] !font-bold uppercase tracking-tight line-clamp-1 leading-none">
                                                {currentTenant.location_detail.split(' • ').slice(1).map(s => s.replace(/KEL\.\s*|KEC\.\s*/g, '')).join(' ')}
                                            </Text.Caption>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white active:scale-90" onClick={() => navigate('/profile')}>
                                    <User weight="bold" className="text-xl" />
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white active:scale-90" onClick={() => navigate('/notifications')}>
                                    <Bell weight="bold" className="text-xl" />
                                </button>
                                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white active:scale-90" onClick={() => navigate('/logout')}>
                                    <SignOut weight="bold" className="text-xl" />
                                </button>
                            </div>
                        </div>
                    </header>
                </div>

                {/* Floating Balance Card - Now using negative margin for controlled overlap */}
                <div className="px-6 -mt-16 relative z-10 max-w-4xl mx-auto">
                    <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white dark:border-white/10">
                        <div className="flex justify-between items-center mb-1">
                            <Text.Label className="!text-on-surface-variant !text-[0.8rem]">Total Kas RT</Text.Label>
                            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                <Wallet weight="fill" className="text-on-surface-variant text-xl" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <Text.Amount className="!text-on-surface !text-4xl tracking-tight">{formatRupiah(stats.saldo)}</Text.Amount>
                        </div>
                        
                        <button onClick={() => navigate('/keuangan')} className="w-full bg-primary py-4 rounded-2xl text-white font-headline font-bold text-[1rem] shadow-[0_12px_24px_-6px_rgba(0,80,212,0.3)] hover:shadow-[0_12px_32px_-6px_rgba(0,80,212,0.4)] transition-all active:scale-[0.98]">
                            Lihat Detail Kas
                        </button>

                        {/* Subscription Status Section - Minimize gap with mt-4 pt-4 */}
                        <div className="mt-4 pt-4 border-t border-slate-100/80 dark:border-white/5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSubscriptionExpired ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-primary'}`}>
                                    <ShieldCheck weight="bold" className="text-lg" />
                                </div>
                                <Text.Body className="!text-[12px] !font-bold !text-on-surface-variant">Informasi Berlangganan Aplikasi PakRT</Text.Body>
                            </div>
                            <div className="grid grid-cols-2 gap-4 items-center">
                                <div className="flex items-center">
                                    <Text.Label className={`!px-3 !py-1 !rounded-full !text-center !w-full !text-white ${isSubscriptionExpired ? '!bg-red-500' : '!bg-emerald-500'}`}>
                                        {isSubscriptionExpired ? 'Masa Berlaku Habis' : `${subscriptionDaysRemaining} Hari Tersisa`}
                                    </Text.Label>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={() => navigate('/billing')} className="flex items-center gap-1 text-primary hover:underline transition-colors shrink-0">
                                        <Text.Label className="!text-primary !normal-case !tracking-normal">Lihat Detil</Text.Label>
                                        <ArrowRight weight="bold" className="text-[10px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Canvas */}
                <main className="mt-8 px-6 space-y-8 max-w-4xl mx-auto pb-12">
                    {/* Stats Bento Grid Section */}
                    <section>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Stats 1: Surat */}
                            <div onClick={() => navigate('/surat')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(0,80,212,0.08)] flex flex-col cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]">
                                <div>
                                    <Text.Body className="!text-[13px] !font-bold !text-on-surface !leading-tight">Surat</Text.Body>
                                    <Text.Caption className="!text-on-surface-variant !text-[9px] !font-bold uppercase tracking-tight line-clamp-1">{stats.pendingSurat} Baru</Text.Caption>
                                </div>
                            </div>

                            {/* Stats 2: Aduan */}
                            <div onClick={() => navigate('/aduan')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(0,80,212,0.08)] flex flex-col cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]">
                                <div>
                                    <Text.Body className="!text-[13px] !font-bold !text-on-surface !leading-tight">Aduan</Text.Body>
                                    <Text.Caption className="!text-[9px] !font-bold !text-error uppercase tracking-tight">Aktif</Text.Caption>
                                </div>
                            </div>

                            {/* Stats 3: Agenda */}
                            <div onClick={() => navigate('/agenda')} className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_8px_24px_-4px_rgba(0,80,212,0.08)] flex flex-col cursor-pointer hover:scale-[1.02] transition-transform active:scale-[0.98]">
                                <div>
                                    <Text.Body className="!text-[13px] !font-bold !text-on-surface !leading-tight">Agenda</Text.Body>
                                    <Text.Caption className="!text-[9px] !font-medium !text-on-surface-variant uppercase tracking-tight line-clamp-1">{stats.agenda} Event</Text.Caption>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Services Section Grid 3x3 - Now without header for cleaner look */}
                    <section className="pb-10">
                        <div className="grid grid-cols-3 gap-x-4 gap-y-7">
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/iuran/baru')}>
                                <div className="w-16 h-16 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg flex items-center justify-center text-cyan-700 dark:text-cyan-400 group-active:scale-95 transition-transform">
                                    <HandCoins weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Iuran</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/keuangan')}>
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-700 dark:text-blue-400 group-active:scale-95 transition-transform">
                                    <Money weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Kas RT</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/aset')}>
                                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-active:scale-95 transition-transform">
                                    <Package weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Aset RT</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/pengaturan')}>
                                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-700 dark:text-amber-400 group-active:scale-95 transition-transform">
                                    <GearSix weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Pengaturan</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/pengurus')}>
                                <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-700 dark:text-purple-400 group-active:scale-95 transition-transform">
                                    <IdentificationCard weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Pengurus</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/ronda')}>
                                <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-700 dark:text-red-400 group-active:scale-95 transition-transform">
                                    <ShieldCheck weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Ronda</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/notulensi')}>
                                <div className="w-16 h-16 bg-sky-50 dark:bg-sky-900/20 rounded-lg flex items-center justify-center text-sky-700 dark:text-sky-400 group-active:scale-95 transition-transform">
                                    <Notebook weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Notulen</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/aduan')}>
                                <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center text-rose-700 dark:text-rose-400 group-active:scale-95 transition-transform">
                                    <Megaphone weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Aduan</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/agenda')}>
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-700 dark:text-indigo-400 group-active:scale-95 transition-transform">
                                    <CalendarCheck weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Agenda</Text.Label>
                            </div>
                            <div className="flex flex-col items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/warga')}>
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-300 group-active:scale-95 transition-transform">
                                    <Users weight="fill" className="text-[1.8rem]" />
                                </div>
                                <Text.Label className="text-center !text-on-surface-variant !normal-case !text-[0.8rem] !font-semibold leading-tight">Warga</Text.Label>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        </div>
    );
}
