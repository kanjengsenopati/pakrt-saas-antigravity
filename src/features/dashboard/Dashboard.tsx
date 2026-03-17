import { useEffect, useState } from 'react';
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
    CreditCard
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
import { pengaturanService } from '../../services/pengaturanService';
import { dateUtils } from '../../utils/date';

export default function Dashboard() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { currentTenant, currentScope } = useTenant();
    const [stats, setStats] = useState({ warga: 0, pengurus: 0, aset: 0, agenda: 0, saldo: 0, pendingSurat: 0 });
    const [recentActivities, setRecentActivities] = useState<Aktivitas[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);
    const [upcomingRonda, setUpcomingRonda] = useState<RondaWithWarga[]>([]);
    const [recentIuran, setRecentIuran] = useState<IuranWithWarga[]>([]);
    const [upcomingAgenda, setUpcomingAgenda] = useState<any[]>([]);
    const [wargaIuranStats, setWargaIuranStats] = useState({ totalPaid: 0, expected: 0 });

    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';
    const wargaId = authUser?.id && isWarga ? (authUser as any).warga_id || authUser.id : null;

    useEffect(() => {
        const fetchStats = async () => {
            if (!currentTenant) return;
            try {
                if (!isWarga) {
                    const [wargaCount, pengurusCount, asetCount, agendaCount, finSummary, allSurat] = await Promise.all([
                        wargaService.count(currentTenant.id, currentScope),
                        pengurusService.count(currentTenant.id, currentScope),
                        asetService.count(currentTenant.id, currentScope),
                        agendaService.count(currentTenant.id, currentScope),
                        keuanganService.getSummary(currentTenant.id, currentScope),
                        suratService.getAll(currentTenant.id, currentScope),
                    ]);
                    setStats({
                        warga: wargaCount,
                        pengurus: pengurusCount,
                        aset: asetCount,
                        agenda: agendaCount,
                        saldo: finSummary.saldo,
                        pendingSurat: (allSurat || []).filter(s => s.status === 'proses').length
                    });
                } else if (wargaId) {
                    // Warga specific stats
                    const [config, allIuran] = await Promise.all([
                        pengaturanService.getAll(currentTenant.id, currentScope),
                        iuranService.getAll(currentTenant.id)
                    ]);
                    
                    const citizen = await wargaService.getById(wargaId);
                    if (citizen) {
                        const statusKey = `${citizen.status_penduduk || 'Tetap'}-${citizen.status_rumah || 'Dihuni'}`;
                        const rateField = `iuran_${statusKey.toLowerCase().replace('-', '_')}`;
                        const rate = Number(config[rateField] || config.iuran_per_bulan || 0);
                        
                        const myIuran = (allIuran.items || []).filter(i => i.warga_id === wargaId);
                        const paidTotal = myIuran.reduce((sum, curr) => sum + curr.nominal, 0);
                        
                        setWargaIuranStats({
                            totalPaid: paidTotal,
                            expected: rate * 12
                        });
                    }
                }
            } catch (error) {
                console.error("Dashboard: Error fetching stats:", error);
            }
        };

        const fetchActivities = async () => {
            if (!currentTenant) return;
            setLoadingActivities(true);
            try {
                const [activities, allRonda, allIuran, agendas] = await Promise.all([
                    aktivitasService.getRecent(currentTenant.id, currentScope, 5),
                    rondaService.getAll(currentTenant.id, currentScope),
                    iuranService.getAll(currentTenant.id, currentScope),
                    agendaService.getUpcoming(currentTenant.id, currentScope, 3)
                ]);
                
                setRecentActivities(activities);
                
                if (isWarga && wargaId) {
                    setRecentIuran((allIuran.items || []).filter(i => i.warga_id === wargaId).slice(0, 4));
                    const myRonda = (allRonda || []).filter(r => r.warga_ids?.includes(wargaId));
                    const todayStr = new Date().toISOString().split('T')[0];
                    setUpcomingRonda(myRonda.filter(r => r.tanggal >= todayStr).slice(0, 3));
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

    const adminCards: DashboardCard[] = [
        { title: 'Total Warga', count: stats.warga, icon: Users, color: 'bg-blue-100 text-blue-600', bar: 'bg-blue-500', link: '/warga' },
        { title: 'Kas Aktif', count: stats.saldo, icon: Wallet, color: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500', isCurrency: true, link: '/keuangan' },
        { title: 'Surat Pending', count: stats.pendingSurat, icon: FileText, color: 'bg-rose-100 text-rose-600', bar: 'bg-rose-500', link: '/surat' },
        { title: 'Agenda', count: stats.agenda, icon: CalendarCheck, color: 'bg-purple-100 text-purple-600', bar: 'bg-purple-500', link: '/agenda' },
    ];

    const wargaCards: DashboardCard[] = [
        { title: 'Tagihan Saya', count: Math.max(0, wargaIuranStats.expected - wargaIuranStats.totalPaid), icon: CreditCard, color: 'bg-rose-100 text-rose-600', bar: 'bg-rose-500', isCurrency: true, link: '/iuran/new', subtitle: 'Hingga akhir tahun' },
        { title: 'Ronda Terdekat', count: upcomingRonda.length > 0 ? dateUtils.toDisplay(upcomingRonda[0].tanggal) : 'Tidak ada', icon: ShieldCheck, color: 'bg-blue-100 text-blue-600', bar: 'bg-blue-500', link: '/ronda' },
        { title: 'Agenda', count: upcomingAgenda.length, icon: CalendarCheck, color: 'bg-purple-100 text-purple-600', bar: 'bg-purple-500', link: '/agenda' },
        { title: 'Surat Saya', count: stats.pendingSurat, icon: FileText, color: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500', link: '/surat' },
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
                <span className="text-[12px] text-slate-500">Scope: <span className="font-semibold text-brand-600">{currentScope}</span></span>
            </div>

            {/* STAT CARDS — compact horizontal layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            onClick={() => navigate(card.link)}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer transition-all hover:border-brand-300 hover:shadow-md active:scale-[0.98] group relative overflow-hidden"
                        >
                            {/* Decorative bg icon */}
                            <div className="absolute -right-1 -bottom-1 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-300">
                                <Icon weight="fill" className="w-16 h-16" />
                            </div>

                            {/* Icon + Title on the same row */}
                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <div className={`p-2 rounded-lg ${card.color} shrink-0`}>
                                    <Icon weight="duotone" className="w-4 h-4" />
                                </div>
                                <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-tight leading-tight">{card.title}</p>
                            </div>

                            {/* Center-aligned big number */}
                            <div className="relative z-10 text-center py-1">
                                <p className="text-[24px] font-bold text-slate-800 leading-tight">
                                    {card.isCurrency ? (
                                        <span className="text-[20px] font-black">{formatRupiah(card.count as number)}</span>
                                    ) : card.count}
                                </p>
                                {card.subtitle && (
                                    <p className="text-[10px] text-slate-400 font-medium mt-1">{card.subtitle}</p>
                                )}
                            </div>

                            {/* Progress bar accent */}
                            <div className="mt-3 h-0.5 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                                <div className={`h-full w-1/3 rounded-full ${card.bar} opacity-50 group-hover:w-full transition-all duration-700`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* UPCOMING AGENDA */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                        <h3 className="text-[14px] font-semibold flex items-center gap-1.5 text-slate-800">
                            <CalendarCheck size={16} className="text-purple-600" />
                            Agenda Mendatang
                        </h3>
                        <button
                            className="text-[12px] font-semibold text-brand-600 uppercase tracking-wider hover:bg-brand-50 px-2 py-1 rounded-lg transition-all"
                            onClick={() => navigate('/agenda')}
                        >
                            Lihat Semua
                        </button>
                    </div>

                    <div className="p-3 space-y-2">
                        {loadingActivities ? (
                            [1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />)
                        ) : upcomingAgenda.length > 0 ? (
                            upcomingAgenda.map((agenda) => {
                                return (
                                    <div
                                        key={agenda.id}
                                        onClick={() => navigate('/agenda')}
                                        className="flex justify-between items-center px-3 py-2 rounded-xl bg-slate-50/30 hover:bg-white border border-transparent hover:border-purple-100 hover:shadow-sm transition-all group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex flex-col items-center justify-center shrink-0 border border-purple-100 shadow-sm">
                                                <span className="text-[10px] font-black">
                                                    {dateUtils.toDisplay(agenda.tanggal).split('-')[0]}
                                                </span>
                                                <span className="text-[8px] font-bold uppercase">
                                                    {dateUtils.toDisplay(agenda.tanggal).split('-')[1]}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[14px] font-semibold text-slate-800 leading-none truncate group-hover:text-purple-600 transition-colors">
                                                    {agenda.judul}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] text-slate-400 truncate max-w-[120px]">
                                                        {agenda.deskripsi}
                                                    </span>
                                                    {agenda.butuh_pendanaan && (
                                                        <span className="flex items-center gap-0.5 text-[8px] font-black text-amber-600 bg-amber-50 px-1 rounded-sm border border-amber-100">
                                                            {formatRupiah(agenda.nominal_biaya || 0)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 items-center shrink-0 ml-2">
                                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">
                                                {agenda.peserta_ids?.length || 0}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full text-center py-8 text-slate-400 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center">
                                <CalendarBlank size={28} weight="duotone" className="mb-1 opacity-20" />
                                <p className="text-xs">Belum ada agenda mendatang.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AKTIVITAS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-50">
                        <ClockCounterClockwise size={16} className="text-brand-600" />
                        <h3 className="text-[14px] font-semibold text-slate-800">Aktivitas</h3>
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
                                        <p className="text-[11px] font-bold text-brand-600 uppercase tracking-tight leading-none">{act.action}</p>
                                        <p className="text-[14px] text-slate-700 leading-snug mt-0.5">{act.details}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{formatDate(act.timestamp)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <p className="text-xs italic">Belum ada aktivitas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RONDA + IURAN ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RONDA */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-50">
                        <ShieldCheck size={16} className="text-brand-600" />
                        <h3 className="text-[14px] font-semibold text-slate-800">Ronda Terdekat</h3>
                    </div>

                    <div className="p-3 space-y-2">
                        {loadingActivities ? (
                            [1, 2].map(i => <div key={i} className="h-12 bg-gray-50 animate-pulse rounded-lg" />)
                        ) : upcomingRonda.length > 0 ? (
                            upcomingRonda.map((ronda: RondaWithWarga) => (
                                <div
                                    key={`dash-${ronda.id}`}
                                    className="flex items-center justify-between px-3 py-2.5 border border-slate-100 rounded-xl bg-slate-50/20 hover:border-brand-300 hover:bg-white transition-colors"
                                >
                                    <div>
                                        <p className="font-bold text-slate-900 text-xs leading-none">
                                            {dateUtils.toDisplay(ronda.tanggal)}
                                        </p>
                                        <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                                            {ronda.anggota_warga?.map((w: any) => w.nama).join(', ')}
                                        </p>
                                    </div>
                                    <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wide shrink-0">
                                        {ronda.regu}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 flex flex-col items-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <ShieldCheck size={28} weight="duotone" className="text-gray-300 mb-1" />
                                <p className="text-xs">Tidak ada jadwal ronda.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* IURAN */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                        <div className="flex items-center gap-1.5">
                            <HandCoins size={16} className="text-emerald-600" />
                            <h3 className="text-[14px] font-semibold text-slate-800">Iuran Terakhir</h3>
                        </div>
                        <button
                            className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:underline"
                            onClick={() => navigate('/iuran')}
                        >
                            Lihat Semua
                        </button>
                    </div>

                    <div className="p-3 space-y-1.5">
                        {loadingActivities ? (
                            [1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 animate-pulse rounded-lg" />)
                        ) : recentIuran.length > 0 ? (
                            recentIuran.map((iuran: IuranWithWarga) => (
                                <div
                                    key={iuran.id}
                                    className="flex justify-between items-center px-3 py-2 rounded-xl bg-slate-50/30 hover:bg-white border border-transparent hover:border-emerald-100 hover:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                                            {iuran.warga?.nama.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900 leading-none">{iuran.warga?.nama}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider font-medium">
                                                Bln {iuran.periode_bulan.join(',')} '{iuran.periode_tahun.toString().substring(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-emerald-600">{formatRupiah(iuran.nominal)}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                                <HandCoins size={28} weight="duotone" className="text-slate-300 mb-1" />
                                <p>Belum ada iuran.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
