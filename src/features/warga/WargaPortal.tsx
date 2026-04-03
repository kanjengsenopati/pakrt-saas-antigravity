import { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { statsService } from '../../services/statsService';
import { 
    User, 
    FileText, 
    Users, 
    ChartPieSlice, 
    Plus, 
    Package, 
    SignOut,
    Megaphone,
    ClockCounterClockwise,
    ArrowRight,
    EnvelopeSimple,
    CurrencyCircleDollar,
    CalendarCheck,
    Flashlight
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
 
 
    const formatAvatarText = (name: string) => {
        if (!name) return 'W';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="min-h-screen bg-slate-50 font-inter pb-24 transition-all duration-500 overflow-x-hidden" translate="no">
            {/* Blue Header Section */}
            <div className="bg-brand-600 rounded-b-[2.5rem] pt-12 pb-20 px-6 relative z-0 shadow-sm border-b border-brand-700/50">
                {/* Info & Avatar */}
                <div className="flex justify-between items-center mb-6 pt-2">
                    <div>
                        <p className="text-[13px] text-brand-100/90 tracking-tight font-medium mb-1">
                            {getGreeting()}, Warga!
                        </p>
                        <h1 className="text-2xl font-bold text-white tracking-tight leading-tight line-clamp-1 max-w-[220px]">
                            {warga.jenis_kelamin === 'L' ? 'Bpk.' : (warga.jenis_kelamin === 'P' ? 'Ibu' : '')} {warga.nama.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                        </h1>
                    </div>
                    <div 
                        onClick={() => navigate('/profile')} 
                        className="w-12 h-12 rounded-full border-2 border-brand-100/30 bg-brand-500 flex items-center justify-center text-white font-bold text-lg shadow-inner cursor-pointer active:scale-95 transition-transform overflow-hidden shrink-0"
                    >
                        {warga.avatar ? (
                            <img src={warga.avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                            formatAvatarText(warga.nama)
                        )}
                    </div>
                </div>

                {/* Glassmorphism Card (Floating) - Tagihan Iuran */}
                <div className="bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-lg absolute left-6 right-6 -bottom-14 z-10 transition-all active:scale-[0.98]">
                    <p className="text-[11px] text-brand-50 font-medium tracking-tight mb-2 opacity-90">
                        Status Tagihan Iuran Anda
                    </p>
                    <div className="flex justify-between items-center">
                        <h2 className="text-[24px] font-bold text-white tracking-tight leading-none">
                            {data.iuranPendingCount > 0 ? `${data.iuranPendingCount} Bulan Tertagih` : 'Sudah Lunas'}
                        </h2>
                        <button 
                            onClick={() => navigate('/iuran')}
                            className="bg-white text-brand-600 px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                        >
                            {data.iuranPendingCount > 0 ? 'Bayar' : 'Cek'} <ArrowRight weight="bold" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Body Section */}
            <div className="px-6 pt-24 pb-6 space-y-8">
                {/* Layanan Mandiri */}
                <div className="animate-fade-in-up">
                    <h3 className="text-[12px] font-extrabold text-slate-800 tracking-[0.15em] mb-4">LAYANAN MANDIRI</h3>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate('/surat')}>
                            <button className="w-[60px] h-[60px] bg-blue-50/80 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100/50 group-active:scale-95 transition-all">
                                <EnvelopeSimple size={28} weight="duotone" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-600 leading-tight text-center group-active:scale-95 transition-transform">Minta<br/>Surat</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate('/aduan/new')}>
                            <button className="w-[60px] h-[60px] bg-rose-50/80 group-hover:bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100/50 group-active:scale-95 transition-all">
                                <Megaphone size={28} weight="duotone" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-600 leading-tight text-center group-active:scale-95 transition-transform">Lapor<br/>Masalah</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate('/iuran')}>
                            <button className="w-[60px] h-[60px] bg-emerald-50/80 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100/50 group-active:scale-95 transition-all">
                                <CurrencyCircleDollar size={28} weight="duotone" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-600 leading-tight text-center group-active:scale-95 transition-transform">Riwayat<br/>Bayar</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => navigate('/agenda')}>
                            <button className="w-[60px] h-[60px] bg-purple-50/80 group-hover:bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm border border-purple-100/50 group-active:scale-95 transition-all">
                                <CalendarCheck size={28} weight="duotone" />
                            </button>
                            <span className="text-[10px] font-bold text-slate-600 leading-tight text-center group-active:scale-95 transition-transform">Agenda<br/>Warga</span>
                        </div>
                    </div>
                </div>

                {/* Jadwal Ronda (Dark Theme Box) */}
                <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[12px] font-extrabold text-slate-800 tracking-[0.15em]">JADWAL RONDA ANDA</h3>
                        <span className="text-[10px] font-bold text-brand-600 cursor-pointer" onClick={() => navigate('/ronda')}>Lihat Jadwal</span>
                    </div>
                    
                    <div onClick={() => navigate('/ronda')} className="bg-[#1e293b] rounded-[20px] p-4 flex items-center gap-4 relative overflow-hidden shadow-lg border border-slate-800 cursor-pointer active:scale-[0.98] transition-transform">
                        <Flashlight weight="fill" className="absolute -right-4 -bottom-4 text-[80px] text-slate-700/50 -rotate-12" />
                        
                        <div className="bg-slate-700/80 rounded-2xl w-14 h-14 flex flex-col items-center justify-center text-white border border-slate-600 shadow-inner z-10 shrink-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300 mt-1">Cek</span>
                            <span className="text-[18px] leading-none font-black mt-0.5"><ClockCounterClockwise size={20} weight="bold"/></span>
                        </div>
                        <div className="z-10">
                            <h4 className="text-white font-bold text-[15px] tracking-tight mb-0.5">Jadwal Siskamling</h4>
                            <p className="text-slate-400 text-[11px] font-medium leading-tight">Pastikan Anda hadir sesuai jadwal blok/RT Anda.</p>
                        </div>
                    </div>
                </div>

                {/* Menu Lainnya Section */}
                <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <h3 className="text-[12px] font-extrabold text-slate-800 tracking-[0.15em] mb-4">PINTASAN LAINNYA</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'Data Warga', icon: Users, path: '/warga', color: 'bg-amber-50 text-amber-600 border-amber-100', hoverBg: 'group-hover:bg-amber-100' },
                            { label: 'Aset RT', icon: Package, path: '/aset', color: 'bg-cyan-50 text-cyan-600 border-cyan-100', hoverBg: 'group-hover:bg-cyan-100' },
                            { label: 'AD/ART', icon: FileText, path: '/pengurus', extra: { tab: 'ad-art' }, color: 'bg-slate-100 text-slate-600 border-slate-200', hoverBg: 'group-hover:bg-slate-200' },
                            { label: 'Logout', icon: SignOut, isLogout: true, color: 'bg-red-50 text-red-600 border-red-100', hoverBg: 'group-hover:bg-red-100' },
                        ].map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    if (item.isLogout) {
                                        if(window.confirm('Keluar dari aplikasi?')) logout();
                                    } else if (item.extra?.tab) {
                                        navigate(item.path as string, { state: { activeTab: item.extra.tab } });
                                    } else {
                                        navigate(item.path as string);
                                    }
                                }}
                                className="flex flex-col items-center gap-2 group cursor-pointer"
                            >
                                <button className={`w-[60px] h-[60px] ${item.color} ${item.hoverBg} rounded-2xl flex items-center justify-center shadow-sm border group-active:scale-95 transition-all`}>
                                    <item.icon size={26} weight="duotone" />
                                </button>
                                <span className="text-[10px] font-bold text-slate-600 leading-tight text-center group-active:scale-95 transition-transform">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agenda / Announcements Section */}
                {agendas.length > 0 && (
                    <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[12px] font-extrabold text-slate-800 tracking-[0.15em]">PENGUMUMAN TERBARU</h3>
                            <span className="text-[10px] font-bold text-brand-600 cursor-pointer" onClick={() => navigate('/agenda')}>Semua</span>
                        </div>
                        <div className="space-y-4">
                            {agendas.map((agenda: any) => (
                                <div 
                                    key={agenda.id} 
                                    onClick={() => navigate('/agenda')}
                                    className="bg-brand-600 p-5 rounded-[20px] text-white relative overflow-hidden group shadow-md active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                                    <div className="relative z-10">
                                        <div className="inline-flex px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                                            Penting
                                        </div>
                                        <h4 className="text-[17px] font-bold leading-tight mb-2 tracking-tight">{agenda.judul}</h4>
                                        <p className="text-white/80 text-[13px] line-clamp-2 leading-snug mb-4 font-medium">{agenda.deskripsi}</p>
                                        <button className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest group/btn">
                                            Lihat Detail
                                            <Plus weight="bold" className="group-hover/btn:rotate-90 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active Polling (If exists) */}
                {activePolls.length > 0 && (
                    <div className="animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                        <div className="flex items-center gap-2 mb-4">
                            <ChartPieSlice size={20} weight="fill" className="text-brand-500" />
                            <h3 className="text-[12px] font-extrabold text-slate-800 tracking-[0.15em]">JAJAK PENDAPAT AKTIF</h3>
                        </div>
                        <div className="space-y-4">
                            {activePolls.map((p: any) => (
                               <PollingParticipation key={p.id} pollingId={p.id} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <StickyHomeButton />
        </div>
    );
}
