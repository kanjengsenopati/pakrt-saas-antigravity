import { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { statsService } from '../../services/statsService';
import { 
    User, 
    HandCoins, 
    FileText, 
    Users, 
    ShieldCheck, 
    ChartPieSlice, 
    Plus, 
    Wallet, 
    Lightbulb, 
    Checks, 
    Package, 
    UserCircle, 
    CaretLeft,
    SignOut,
    Megaphone,
    ClockCounterClockwise
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { pollingService } from '../../services/pollingService';
import { agendaService } from '../../services/agendaService';
import PollingParticipation from '../aduan/PollingParticipation';
import { StickyHomeButton } from '../../components/ui/StickyHomeButton';

export default function WargaPortal() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const { currentScope, currentTenant, isLoading: tenantLoading } = useTenant();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePolls, setActivePolls] = useState<any[]>([]);
    const [agendas, setAgendas] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'utama' | 'lainnya'>('utama');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 19) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    useEffect(() => {
        const load = async () => {
            // Wait for core contexts to resolve before we even try to load dashboard data
            if (authLoading || tenantLoading) return;
            
            if (!user?.warga_id || !currentTenant) {
                // Once contexts are ready, if we still have no data, we stop local loading
                setIsLoading(false);
                return;
            }
            try {
                // Fetch essential data. Wrap Polling in a separate try to isolate 403s.
                const [res, upcomingAgendas] = await Promise.all([
                    statsService.getWargaPersonalStats(),
                    agendaService.getUpcoming(currentTenant.id, currentScope, 2)
                ]);

                setData(res);
                setAgendas(upcomingAgendas);

                // Attempt fetching polls, but don't fail the whole dashboard on 403/errors
                try {
                    const polls = await pollingService.getAll('Aktif', currentScope);
                    setActivePolls(polls);
                } catch (pe) {
                    console.log("Polling permission restricted or unavailable:", pe);
                }
            } catch (err) {
                console.error("Critical dashboard data fetch failed:", err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [currentScope, currentTenant, user?.warga_id, authLoading, tenantLoading]);

    if (isLoading || authLoading || tenantLoading) return <div className="min-h-screen bg-[var(--warga-bg)] p-8 text-center animate-pulse flex items-center justify-center text-[var(--warga-primary)] font-bold">Memuat Dashboard Warga...</div>;
    
    if (!user?.warga_id || !data?.warga) {
        return (
            <div className="min-h-screen bg-[var(--warga-bg)] p-6 flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 bg-white shadow-xl rounded-3xl flex items-center justify-center text-slate-300">
                    <User size={48} weight="duotone" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit uppercase tracking-tight">Akun Belum Terhubung</h2>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Data warga Anda belum tersinkronisasi. Silakan hubungi pengurus RT Anda.</p>
                </div>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-8 py-3 bg-[var(--warga-primary)] text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
                >
                  Masuk Kembali
                </button>
            </div>
        );
    }
 
    const { warga } = data;
 
 
    return (
        <div className="min-h-screen bg-[var(--warga-bg)] font-inter pb-6 transition-all duration-500 overflow-x-hidden" translate="no">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-black/5">
                <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-brand-600 flex items-center gap-2 group">
                    <CaretLeft size={24} weight="bold" />
                    <span className="text-caption font-bold group-active:translate-x-1 transition-transform">Kembali</span>
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { if(window.confirm('Keluar dari aplikasi?')) logout(); }}
                        className="p-2 text-[var(--warga-primary)] hover:bg-[var(--warga-accent)] rounded-full transition-colors"
                        title="Keluar"
                    >
                        <SignOut size={22} weight="bold" />
                    </button>
                    <div 
                        onClick={() => navigate('/profile')} 
                        className="w-10 h-10 rounded-xl border-2 border-[var(--warga-primary)]/20 overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                        {warga.avatar ? (
                            <img src={warga.avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                            <div className="w-full h-full bg-[var(--warga-accent)] text-[var(--warga-primary)] flex items-center justify-center font-bold">
                                {warga.nama.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dashboard Title Row */}
            <div className="px-5 pt-4 pb-2">
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Dashboard Warga
                </h2>
            </div>
 
            {/* Hero Section */}
            <div className="px-5 pt-4 pb-2">
                <h1 className="page-title mb-1">
                    {getGreeting()}, {warga.jenis_kelamin === 'L' ? 'Bapak' : (warga.jenis_kelamin === 'P' ? 'Ibu' : '')} {warga.nama.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                </h1>
                <div className="mt-4 mb-8 p-5 bg-white border border-brand-100/50 rounded-card shadow-premium relative overflow-hidden group active:scale-[0.99] transition-all">
                    {/* Subtle aesthetic backdrop */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-brand-600/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
                    
                    <div className="flex gap-4 items-center relative z-10">
                        <div className="flex-shrink-0 w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm border border-brand-100/50 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                            <ShieldCheck size={26} weight="duotone" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between mb-1.5 gap-x-2 gap-y-0.5">
                                <p className="text-[11px] font-bold text-brand-600 tracking-tighter flex items-center gap-1.5 whitespace-nowrap">
                                    Anggota Terverifikasi
                                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse shrink-0" />
                                </p>
                                <span className="text-[10px] font-bold text-slate-400/80 tracking-tighter italic whitespace-nowrap">Warga RT {currentTenant?.config?.rt || '-'} / RW {currentTenant?.config?.rw || '-'}</span>
                            </div>

                            <p className="text-body !text-slate-700 leading-tight">
                                Terdaftar di <span className="font-bold text-slate-900 border-b-2 border-brand-100">Kel {currentTenant?.config?.kelurahan || '-'}</span>, Kec {currentTenant?.config?.kecamatan || '-'}, {currentTenant?.config?.kota || '-'}
                            </p>
                        </div>
                    </div>
                </div>


                <div className="grid grid-cols-2 gap-4 mb-2">
                    {/* Iuran Card */}
                    <div className={`flex flex-col gap-1 p-4 rounded-card border transition-all active:scale-[0.98] ${
                        data.iuranPendingCount > 0 
                            ? 'bg-red-50/70 border-red-100 text-red-900 group shadow-premium shadow-red-900/5' 
                            : 'bg-brand-50/70 border-brand-200/50 text-brand-900 group shadow-premium shadow-brand-900/5'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-btn ${data.iuranPendingCount > 0 ? 'bg-red-100 text-red-600' : 'bg-brand-100 text-brand-600'}`}>
                                <Wallet size={20} weight="fill" />
                            </div>
                            <span className={`text-caption font-bold uppercase px-3 py-1 rounded-full ${
                                data.iuranPendingCount > 0 ? 'bg-red-600 text-white' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {data.iuranPendingCount > 0 ? 'Tertunggak' : 'Lancar'}
                            </span>
                        </div>
                        <p className="text-caption font-bold tracking-wider opacity-80 mb-1">Tagihan Iuran</p>
                        <h4 className="text-lg font-bold leading-tight tracking-tight">
                            {data.iuranPendingCount > 0 ? `${data.iuranPendingCount} Bulan` : 'Lancar'}
                        </h4>
                    </div>
                    
                    {/* Surat Card */}
                    <div className="flex flex-col gap-1 p-4 bg-blue-50/70 border-blue-100/50 border rounded-card shadow-premium shadow-blue-900/5 text-blue-900 group active:scale-[0.98] transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-btn">
                                <FileText size={20} weight="fill" />
                            </div>
                            <span className="text-caption font-bold uppercase px-3 py-1 bg-blue-600 text-white rounded-full">
                                {data.suratProsesCount > 0 ? 'Proses' : 'Selesai'}
                            </span>
                        </div>
                        <p className="text-caption font-bold tracking-wider opacity-80 mb-1">Surat Keterangan</p>
                        <h4 className="text-lg font-bold leading-tight tracking-tight">
                            {data.suratProsesCount > 0 ? `${data.suratProsesCount} Surat` : 'Selesai'}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Tabbed Menu Redesign */}
            <div className="px-5 py-6">
                {/* Tabs Switcher */}
                <div className="flex items-center gap-2 mb-6 p-1 bg-white/50 backdrop-blur-sm rounded-btn w-fit">
                    <button 
                        onClick={() => setActiveTab('utama')}
                        className={`px-6 py-2.5 rounded-btn text-sm font-bold transition-all duration-300 ${
                            activeTab === 'utama' 
                            ? 'bg-brand-600 text-white shadow-md' 
                            : 'text-brand-600/60 hover:bg-brand-600/5'
                        }`}
                    >
                        Menu Utama
                    </button>
                    <button 
                        onClick={() => setActiveTab('lainnya')}
                        className={`px-6 py-2.5 rounded-btn text-sm font-bold transition-all duration-300 ${
                            activeTab === 'lainnya' 
                            ? 'bg-brand-600 text-white shadow-md' 
                            : 'text-brand-600/60 hover:bg-brand-600/5'
                        }`}
                    >
                        Lainnya
                    </button>
                </div>

                {activeTab === 'utama' ? (
                    <div className="space-y-10 animate-fade-in">
                        {/* 4 Column Menu Utama */}
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { label: 'Iuran', icon: HandCoins, path: '/iuran/baru' },
                                { label: 'Kas', icon: Wallet, path: '/iuran' },
                                { label: 'Agenda', icon: Checks, path: '/agenda' },
                                { label: 'Surat', icon: FileText, path: '/surat' },
                            ].map((item, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => navigate(item.path)}
                                    className="flex flex-col items-center gap-1.5 group cursor-pointer"
                                >
                                    <div className={`w-full aspect-square bg-brand-600/5 rounded-card flex items-center justify-center group-active:scale-[0.85] transition-all border border-black/[0.03] shadow-premium`}>
                                        <item.icon size={26} weight="duotone" className="text-brand-600/80" />
                                    </div>
                                    <p className="text-body !text-slate-800 leading-none text-center whitespace-nowrap">{item.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Announcement Section moved here for Menu Utama */}
                        <div className="py-2 animate-fade-in-up">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="section-label flex items-center gap-2">
                                    <ClockCounterClockwise size={20} className="text-brand-600" />
                                    Informasi Terbaru
                                </h3>
                                <button onClick={() => navigate('/agenda')} className="text-caption font-bold text-brand-600/80 underline decoration-brand-600/30 underline-offset-4">Lihat Semua</button>
                            </div>
                            
                            <div className="space-y-4">
                                {agendas.length > 0 ? (
                                    agendas.map((agenda: any) => (
                                        <div 
                                            key={agenda.id} 
                                            onClick={() => navigate('/agenda')}
                                            className="bg-brand-600 p-5 rounded-card text-white relative overflow-hidden group shadow-premium active:scale-[0.98] transition-all"
                                        >
                                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                                            <div className="relative z-10">
                                                <div className="inline-flex px-3 py-1 bg-white/20 rounded-full text-caption font-bold uppercase tracking-widest mb-4">
                                                    Penting
                                                </div>
                                                <h4 className="text-lg font-bold leading-tight mb-2">{agenda.judul}</h4>
                                                <p className="text-white/80 text-sm line-clamp-2 leading-relaxed mb-6 font-medium">{agenda.deskripsi}</p>
                                                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest group/btn">
                                                    Lihat Detail
                                                    <Plus weight="bold" className="group-hover/btn:rotate-90 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white p-6 rounded-card text-center border-2 border-dashed border-slate-100 py-12 shadow-premium">
                                        <Megaphone size={40} weight="duotone" className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-caption font-bold text-slate-300 tracking-tight">Belum ada pengumuman.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-3 animate-fade-in">
                        {/* Tab Lainnya: 4 Columns x 2 Rows with 1.5x Scale */}
                        {[
                            { label: 'Warga', icon: Users, path: '/warga' },
                            { label: 'Pengurus', icon: Users, path: '/pengurus' },
                            { label: 'Profile', icon: UserCircle, path: '/profile' },
                            { label: 'Aduan', icon: Megaphone, path: '/aduan/new' },
                            { label: 'Usulan', icon: Lightbulb, path: '/aduan/new' },
                            { label: 'Ronda', icon: ShieldCheck, path: '/ronda' },
                            { label: 'Aset', icon: Package, path: '/aset' },
                            { label: 'AD/ART', icon: FileText, path: '/pengurus', extra: { tab: 'ad-art' } },
                        ].map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    if (item.extra?.tab) {
                                        navigate(item.path, { state: { activeTab: item.extra.tab } });
                                    } else {
                                        navigate(item.path);
                                    }
                                }}
                                className="flex flex-col items-center gap-1.5 group cursor-pointer"
                            >
                                <div className={`w-full aspect-square bg-brand-600/5 rounded-card flex items-center justify-center group-active:scale-[0.85] transition-all border border-black/[0.03] shadow-premium`}>
                                    <item.icon size={26} weight="duotone" className="text-brand-600/80" />
                                </div>
                                <p className="text-body !text-slate-800 leading-none text-center whitespace-nowrap">{item.label}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Active Polling (If exists) */}
            {activePolls.length > 0 && (
                <div className="px-5 py-6 border-t border-black/5">
                    <div className="flex items-center gap-2 mb-4">
                        <ChartPieSlice size={18} weight="fill" className="text-brand-500" />
                        <h3 className="text-caption font-bold uppercase tracking-widest">Jajak Pendapat Aktif</h3>
                    </div>
                    <div className="space-y-4">
                        {activePolls.map((p: any) => (
                           <PollingParticipation key={p.id} pollingId={p.id} />
                        ))}
                    </div>
                </div>
            )}

            <StickyHomeButton />
        </div>
    );
}
