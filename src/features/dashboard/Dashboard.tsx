import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { Aktivitas } from '../../database/db';
import { 
    Users, 
    ShieldCheck, 
    CalendarBlank, 
    CalendarCheck,
    ClockCounterClockwise,
    Wallet,
    FileText,
    HandCoins,
    CreditCard,
    ArrowRight
} from '@phosphor-icons/react';
import { formatRupiah } from '../../utils/currency';
import { aktivitasService } from '../../services/aktivitasService';
import { rondaService, RondaWithWarga } from '../../services/rondaService';
import { wargaService } from '../../services/wargaService';
import { pengurusService } from '../../services/pengurusService';
import { asetService } from '../../services/asetService';
import { agendaService } from '../../services/agendaService';
import { keuanganService } from '../../services/keuanganService';
import { suratService } from '../../services/suratService';
import { iuranService, IuranWithWarga } from '../../services/iuranService';
import { dateUtils } from '../../utils/date';

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
    const [loadingActivities, setLoadingActivities] = useState(true);
    const [upcomingRonda, setUpcomingRonda] = useState<RondaWithWarga[]>([]);
    const [recentIuran, setRecentIuran] = useState<IuranWithWarga[]>([]);
    const [upcomingAgenda, setUpcomingAgenda] = useState<any[]>([]);
    const [wargaIuranStats, setWargaIuranStats] = useState({ totalPaid: 0, expected: 0, rate: 0, paidMonths: [] as number[] });

    // Memoize role-derived values to prevent useEffect from looping on every background auth refresh
    const isWarga = useMemo(() =>
        authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga',
    [authUser?.role, authUser?.role_entity?.name]);

    const wargaId = useMemo(() =>
        authUser?.id && isWarga ? (authUser as any).warga_id || authUser.id : null,
    [authUser?.id, isWarga]);

    useEffect(() => {
        const fetchStats = async () => {
            if (!currentTenant) return;
            try {
                if (!isWarga) {
                    const [wargaCount, pengurusCount, asetCount, agendaCount, finSummary, allSurat, allIuran] = await Promise.all([
                        wargaService.count(currentTenant.id, currentScope),
                        pengurusService.count(currentTenant.id, currentScope),
                        asetService.count(currentTenant.id, currentScope),
                        agendaService.count(currentTenant.id, currentScope),
                        keuanganService.getSummary(currentTenant.id, currentScope),
                        suratService.getAll(currentTenant.id, currentScope),
                        iuranService.getAll(currentTenant.id),
                    ]);
                    setStats({
                        warga: wargaCount,
                        pengurus: pengurusCount,
                        aset: asetCount,
                        agenda: agendaCount,
                        saldo: finSummary.saldo,
                        pendingSurat: (allSurat || []).filter(s => s.status === 'proses').length,
                        pendingIuran: (allIuran.items || []).filter(i => i.status === 'PENDING').length
                    });
                } else if (wargaId) {
                    // Warga specific stats using getBillingSummary
                    const summary = await iuranService.getBillingSummary(wargaId, new Date().getFullYear(), undefined, currentScope);
                    setWargaIuranStats({
                        totalPaid: summary.totalPaid,
                        expected: summary.expectedTotal,
                        rate: summary.rate,
                        paidMonths: summary.paidMonths
                    });
                    
                    // Also fetch pending surat for warga
                    const allSurat = await suratService.getAll(currentTenant.id, currentScope);
                    setStats(prev => ({
                        ...prev,
                        pendingSurat: (allSurat || []).filter(s => s.warga_id === wargaId && s.status === 'proses').length
                    }));
                }
            } catch (error) {
                console.error("Dashboard: Error fetching stats:", error);
            }
        };

        const fetchActivities = async () => {
            if (!currentTenant) return;
            setLoadingActivities(true);
            try {
                const [allRonda, allIuran, agendas] = await Promise.all([
                    rondaService.getAll(currentTenant.id, currentScope),
                    iuranService.getAll(currentTenant.id, currentScope),
                    agendaService.getUpcoming(currentTenant.id, currentScope, 3)
                ]);
                
                let activities: Aktivitas[] = [];
                if (!isWarga) {
                    try {
                        activities = await aktivitasService.getRecent(currentTenant.id, currentScope, 5);
                    } catch(e) {
                         console.warn("Dashboard: Skipping aktivitas API due to permissions");
                    }
                }
                
                setRecentActivities(activities);
                
                if (isWarga && wargaId) {
                    setRecentIuran((allIuran.items || []).filter(i => i.warga_id === wargaId).slice(0, 4));
                    const myRonda = (allRonda || []).filter(r => r.warga_ids?.includes(wargaId));
                    const todayStr = new Date().toISOString().split('T')[0];
                    setUpcomingRonda(
                        myRonda
                            .filter(r => r.tanggal >= todayStr)
                            .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
                            .slice(0, 3)
                    );
                } else {
                    setRecentIuran((allIuran.items || []).slice(0, 4));
                    const todayStr = new Date().toISOString().split('T')[0];
                    const upcoming = (allRonda || [])
                        .filter(r => r.tanggal >= todayStr)
                        .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
                        .slice(0, 3);
                    setUpcomingRonda(upcoming);
                }
                
                setUpcomingAgenda(agendas);
            } catch (error) {
                console.error("Dashboard: Error fetching activities:", error);
            } finally {
                setLoadingActivities(false);
            }
        };

        fetchStats();
        fetchActivities();
        const interval = setInterval(() => { fetchStats(); fetchActivities(); }, 30000);
        return () => clearInterval(interval);
    }, [currentTenant, currentScope, isWarga, wargaId]);

    interface DashboardCard {
        title: string;
        count: string | number;
        icon: any;
        color: string;
        bar: string;
        link: string;
        isCurrency?: boolean;
        subtitle?: string;
    }

    const getRondaSubtitle = () => {
        if (upcomingRonda.length === 0) return '';
        const teammates = upcomingRonda[0].anggota_warga?.filter(w => w.id !== wargaId).map(w => w.nama.split(' ')[0]);
        if (!teammates || teammates.length === 0) return 'Regu Anda';
        return `Rekan: ${teammates.join(', ')}`;
    };

    const getRondaCount = () => {
        if (upcomingRonda.length === 0) return 'Tidak ada';
        const d = upcomingRonda[0].tanggal;
        return d.split('-').reverse().join('-');
    };

    const adminCards: DashboardCard[] = [
        { title: 'Total Warga', count: stats.warga, icon: Users, color: 'bg-blue-500', bar: '', link: '/warga' },
        { title: 'Kas Aktif', count: stats.saldo, icon: Wallet, color: 'bg-emerald-500', bar: '', isCurrency: true, link: '/keuangan' },
        { title: 'Surat Pending', count: stats.pendingSurat, icon: FileText, color: 'bg-red-500', bar: '', link: '/surat' },
        { title: 'Verifikasi Iuran', count: stats.pendingIuran, icon: HandCoins, color: 'bg-amber-500', bar: '', link: '/iuran' },
    ];

    const wargaCards: DashboardCard[] = [
        { title: 'Sisa Tagihan', count: Math.max(0, wargaIuranStats.expected - wargaIuranStats.totalPaid), icon: CreditCard, color: 'bg-red-500', bar: '', isCurrency: true, link: '/iuran', subtitle: 'Hingga akhir tahun' },
        { title: 'Ronda Terdekat', count: getRondaCount(), icon: ShieldCheck, color: 'bg-blue-500', bar: '', link: '/ronda', subtitle: getRondaSubtitle() },
        { title: 'Agenda', count: upcomingAgenda.length, icon: CalendarCheck, color: 'bg-[#a855f7]', bar: '', link: '/agenda' },
        { title: 'Surat Saya', count: stats.pendingSurat, icon: FileText, color: 'bg-[#10b981]', bar: '', link: '/surat' },
    ];

    const cards = isWarga ? wargaCards : adminCards;

    // Unified formatRupiah imported from utils/currency

    const formatDate = (timestamp: number) => {
        return dateUtils.toDisplay(new Date(timestamp));
    };

    return (
        <div className="space-y-4 animate-fade-in pb-6">
            {/* Header */}
            <div className="flex items-baseline gap-3">
                <h1 className="page-title">Dashboard</h1>
                <span className="text-sm text-gray-500 font-medium">Scope: <span className="font-semibold text-brand-600 tracking-wide">{currentScope}</span></span>
            </div>

            {/* STAT CARDS — compact horizontal layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => navigate(card.link)}
                            className={`${card.color} rounded-[18px] p-4 shadow-sm border border-transparent cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] group relative overflow-hidden flex flex-col justify-between min-h-[135px]`}
                        >
                            {/* Decorative bg icon */}
                            <div className="absolute -right-3 -bottom-3 opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500 select-none pointer-events-none">
                                <Icon weight="fill" className="w-[110px] h-[110px] text-white" />
                            </div>

                            {/* Top row: Icon + Title */}
                            <div className="flex items-center gap-2 mb-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm shadow-inner shrink-0 border border-white/20 text-white">
                                    <Icon weight="duotone" className="w-4 h-4" />
                                </div>
                                <p className="font-bold tracking-wide text-white text-[11px] uppercase drop-shadow-sm">{card.title}</p>
                            </div>

                            {/* Middle: Big number */}
                            <div className={`relative z-10 flex-1 flex flex-col justify-center mb-2 overflow-hidden ${['Agenda', 'Surat Saya'].includes(card.title) ? 'items-center text-center' : 'items-start text-left'}`}>
                                <div className="text-[26px] font-extrabold text-white leading-none tracking-tight drop-shadow-sm w-full truncate">
                                    {card.isCurrency ? (
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-2xl font-black">{formatRupiah(card.count as number)}</span>
                                            {card.subtitle && (
                                                <span className="text-[10px] text-white/90 font-medium italic drop-shadow-sm leading-none">{card.subtitle}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="whitespace-nowrap">{card.count}</span>
                                    )}
                                </div>
                                {!card.isCurrency && card.subtitle && (
                                    <p className="text-[10px] text-white/90 font-medium mt-1.5 line-clamp-2 leading-tight drop-shadow-sm">{card.subtitle}</p>
                                )}
                            </div>

                            {/* Bottom: Link Button */}
                            <div className={`relative z-10 flex items-center justify-between w-max gap-3 border border-white/30 hover:bg-white/10 transition-colors rounded-full pl-3 pr-1.5 py-1 ${['Agenda', 'Surat Saya'].includes(card.title) ? 'mx-auto' : ''}`}>
                                <span className="text-[9px] font-bold tracking-wider text-white uppercase drop-shadow-sm">Lihat Detil</span>
                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                                    <ArrowRight weight="bold" className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* UPCOMING AGENDA */}
                <div className={`${isWarga ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                        <h3 className="section-label flex items-center gap-1.5">
                            <CalendarCheck size={16} className="text-purple-600" />
                            Agenda Mendatang
                        </h3>
                        <button
                            className="text-sm font-semibold text-brand-600 tracking-normal hover:bg-brand-50 px-2 py-1 rounded-lg transition-all"
                            onClick={() => navigate('/agenda')}
                        >
                            Lihat Semua
                        </button>
                    </div>

                    <div className="p-3 space-y-2">
                        {loadingActivities ? (
                            [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-xl" />)
                        ) : upcomingAgenda.length > 0 ? (
                            upcomingAgenda.map((agenda) => {
                                return (
                                    <div
                                        key={agenda.id}
                                        onClick={() => navigate('/agenda')}
                                        className="flex justify-between items-center px-3 py-2 rounded-xl bg-gray-50/30 hover:bg-white border border-transparent hover:border-purple-100 hover:shadow-sm transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex flex-col items-center justify-center shrink-0 border border-purple-100 shadow-sm">
                                                <span className="text-sm font-bold">
                                                    {dateUtils.toDisplay(agenda.tanggal).split('-')[0]}
                                                </span>
                                                <span className="text-[10px] font-bold tracking-normal">
                                                    {dateUtils.toDisplay(agenda.tanggal).split('-')[1]}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm font-semibold text-gray-900 leading-none truncate group-hover:text-purple-600 transition-colors">
                                                    {agenda.judul}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-sm text-gray-500 truncate max-w-[150px] font-medium">
                                                        {agenda.deskripsi}
                                                    </span>
                                                    {agenda.butuh_pendanaan && (
                                                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1 rounded-sm border border-amber-100">
                                                            {formatRupiah(agenda.nominal_biaya || 0)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 items-center shrink-0 ml-2">
                                            <span className="text-sm font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">
                                                {agenda.peserta_ids?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-8 text-gray-400 border border-dashed border-gray-200 bg-gray-50/50 rounded-xl flex flex-col items-center justify-center">
                                <CalendarBlank size={28} weight="duotone" className="mb-1 opacity-20" />
                                <p className="text-sm">Belum ada agenda mendatang.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AKTIVITAS (Hidden for Warga) */}
                {!isWarga && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                        <ClockCounterClockwise size={16} className="text-brand-600" />
                        <h3 className="section-label">Aktivitas</h3>
                    </div>

                    <div className="p-3">
                        {loadingActivities ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-lg" />)}
                            </div>
                        ) : recentActivities.length > 0 ? (
                            <div className="space-y-3">
                                {recentActivities.map((act: Aktivitas) => (
                                    <div key={act.id} className="pl-3 border-l-2 border-brand-200 hover:border-brand-500 transition-all">
                                        <p className="text-sm font-semibold text-brand-600 tracking-normal leading-none capitalize">{act.action.toLowerCase()}</p>
                                        <p className="text-sm font-medium text-gray-700 leading-snug mt-1">{toTitleCase(act.details)}</p>
                                        <p className="text-sm text-gray-400 mt-1 font-medium italic">{formatDate(act.timestamp)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-sm italic">Belum ada aktivitas.</p>
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>

            {/* RONDA + IURAN ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RONDA */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                        <ShieldCheck size={16} className="text-brand-600" />
                        <h3 className="section-label">Ronda Terdekat</h3>
                    </div>

                    <div className="p-3 space-y-2">
                        {loadingActivities ? (
                            [1, 2].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />)
                        ) : upcomingRonda.length > 0 ? (
                            upcomingRonda.map((ronda: RondaWithWarga) => (
                                <div
                                    key={`dash-${ronda.id}`}
                                    className="flex items-center justify-between px-3 py-2.5 border border-gray-100 rounded-xl bg-gray-50/20 hover:border-brand-300 hover:bg-white transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm leading-none">
                                            {dateUtils.toDisplay(ronda.tanggal)}
                                        </p>
                                        <p className="text-sm font-medium text-gray-500 mt-1 truncate max-w-[180px]">
                                            {ronda.anggota_warga?.map((w: any) => w.nama).join(', ')}
                                        </p>
                                    </div>
                                    <span className="text-sm bg-blue-600 text-white px-2.5 py-1 rounded-full font-bold tracking-normal shrink-0 shadow-sm">
                                        {ronda.regu}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 flex flex-col items-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                <ShieldCheck size={28} weight="duotone" className="text-gray-300 mb-1" />
                                <p className="text-sm">Tidak ada jadwal ronda.</p>
                            </div>
                        )}
                    </div>
                </div>                {/* IURAN / BILLING SUMMARY for Warga */}
                <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${isWarga ? 'md:col-span-1' : ''}`}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-gray-50/20">
                        <div className="flex items-center gap-1.5">
                            <HandCoins size={16} className="text-emerald-600" />
                            <h3 className="section-label">{isWarga ? 'Data Tagihan Iuran' : 'Iuran Terakhir'}</h3>
                        </div>
                        {!isWarga ? (
                            <button
                                className="text-sm font-semibold text-brand-600 tracking-normal hover:underline"
                                onClick={() => navigate('/iuran')}
                            >
                                Lihat Semua
                            </button>
                        ) : (
                            <button
                                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold tracking-normal transition-all shadow-sm active:scale-95"
                                onClick={() => navigate('/iuran/baru')}
                            >
                                Bayar Iuran
                            </button>
                        )}
                    </div>

                    <div className="p-3">
                        {loadingActivities ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-lg" />)}
                            </div>
                        ) : isWarga ? (
                            <div className="space-y-4 py-1">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                                        <p className="text-sm font-semibold text-emerald-600 tracking-normal mb-1">Terbayar</p>
                                        <p className="text-sm font-bold text-emerald-700">{formatRupiah(wargaIuranStats.totalPaid)}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                                        <p className="text-sm font-semibold text-amber-600 tracking-normal mb-1">Sisa Tagihan</p>
                                        <p className="text-sm font-bold text-amber-700">{formatRupiah(Math.max(0, wargaIuranStats.expected - wargaIuranStats.totalPaid))}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-sm font-semibold text-gray-400 tracking-normal">Progress Pembayaran {new Date().getFullYear()}</span>
                                        <span className="text-sm font-semibold text-brand-600">{wargaIuranStats.paidMonths.length} / 12 Bln</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 justify-between">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                                            <div 
                                                key={m} 
                                                className={`w-[26px] h-[26px] rounded-lg flex items-center justify-center text-xs font-semibold transition-all border ${
                                                    wargaIuranStats.paidMonths.includes(m) 
                                                        ? 'bg-brand-600 text-white border-brand-500 shadow-sm' 
                                                        : 'bg-white text-gray-300 border-gray-100 hover:border-gray-300'
                                                }`}
                                                title={wargaIuranStats.paidMonths.includes(m) ? 'Sudah Lunas' : 'Belum Bayar'}
                                            >
                                                {m}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm font-semibold text-gray-500 italic">Tarif Bulanan:</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{formatRupiah(wargaIuranStats.rate)}</span>
                                </div>
                            </div>
                        ) : recentIuran.length > 0 ? (
                            <div className="space-y-1.5">
                                {recentIuran.map((iuran: IuranWithWarga) => (
                                    <div
                                        key={iuran.id}
                                        className="flex justify-between items-center px-3 py-2 rounded-xl bg-gray-50/30 hover:bg-white border border-transparent hover:border-emerald-100 hover:shadow-sm transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold border border-emerald-200 shrink-0 shadow-sm">
                                                {iuran.warga?.nama.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 leading-none">
                                                    {toTitleCase(iuran.warga?.nama || 'Warga')}
                                                </p>
                                                <p className="text-sm text-gray-400 mt-1 tracking-normal font-medium italic">
                                                    Bln {iuran.periode_bulan.join(',')} '{iuran.periode_tahun.toString().substring(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-emerald-600">{formatRupiah(iuran.nominal)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm italic bg-gray-50/50 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                                <HandCoins size={28} weight="duotone" className="text-gray-300 mb-1" />
                                <p>Belum ada iuran.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
}
