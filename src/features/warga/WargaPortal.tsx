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
    Flashlight,
    Minus
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { pollingService } from '../../services/pollingService';
import { agendaService } from '../../services/agendaService';
import PollingParticipation from '../aduan/PollingParticipation';
import { Text } from '../../components/ui/Typography';

export default function WargaPortal() {
    const { user, logout, isLoading: authLoading } = useAuth();
    const { currentScope, currentTenant, isLoading: tenantLoading } = useTenant();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePolls, setActivePolls] = useState<any[]>([]);
    const [agendas, setAgendas] = useState<any[]>([]);
    const [fontScale, setFontScale] = useState(() => {
        const saved = localStorage.getItem('pakrt_font_scale');
        return saved ? parseFloat(saved) : 1;
    });

    useEffect(() => {
        localStorage.setItem('pakrt_font_scale', fontScale.toString());
        document.documentElement.style.fontSize = `${16 * fontScale}px`;
    }, [fontScale]);

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

    if (isLoading || authLoading || tenantLoading) return (
        <div className="min-h-screen bg-slate-50 p-8 text-center animate-pulse flex items-center justify-center">
            <Text.Body className="!text-brand-600 !font-bold">Memuat Dashboard Warga...</Text.Body>
        </div>
    );
    
    if (!user?.warga_id || !data?.warga) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 bg-white shadow-xl rounded-3xl flex items-center justify-center text-slate-300">
                    <User size={48} weight="duotone" />
                </div>
                <div className="text-center">
                    <Text.H1 className="!text-xl">Akun Belum Terhubung</Text.H1>
                    <Text.Body className="max-w-xs mx-auto mt-2">Data warga Anda belum tersinkronisasi. Silakan hubungi pengurus RT Anda.</Text.Body>
                </div>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-8 py-3 bg-brand-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-900/20 active:scale-95 transition-all"
                >
                  <Text.Label className="!text-white">Masuk Kembali</Text.Label>
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
                        <Text.Body className="!text-[0.8125rem] !text-brand-100/90 !font-medium mb-1">
                            {getGreeting()}, Warga!
                        </Text.Body>
                        <Text.H1 className="!text-2xl !text-white !leading-tight line-clamp-1 max-w-[13.75rem] !uppercase">
                            {warga.jenis_kelamin === 'L' ? 'Bpk.' : (warga.jenis_kelamin === 'P' ? 'Ibu' : '')} {warga.nama}
                        </Text.H1>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Font Resizer */}
                        <div className="flex items-center bg-brand-500/50 rounded-full border border-brand-400/30 px-1 py-1">
                            <button onClick={() => setFontScale(s => Math.max(0.8, Number((s - 0.1).toFixed(1))))} className="p-1 text-white hover:text-brand-100 active:scale-95 transition-all">
                                <Minus size={12} weight="bold" />
                            </button>
                            <Text.Label className="!text-[0.5625rem] !font-bold !text-white w-7 text-center tabular-nums">{Math.round(fontScale * 100)}%</Text.Label>
                            <button onClick={() => setFontScale(s => Math.min(1.5, Number((s + 0.1).toFixed(1))))} className="p-1 text-white hover:text-brand-100 active:scale-95 transition-all">
                                <Plus size={12} weight="bold" />
                            </button>
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
                </div>

                {/* Card Status (Floating) - Tagihan Iuran */}
                <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] absolute left-6 right-6 -bottom-14 z-10 transition-all active:scale-[0.98] border border-black/[0.03]">
                    <Text.Label className="mb-2">Status Tagihan Iuran Anda</Text.Label>
                    <div className="flex justify-between items-center">
                        <Text.Amount className="!text-[1.5rem] !leading-none">
                            {data.iuranPendingCount > 0 ? `${data.iuranPendingCount} Bulan Tertagih` : 'Sudah Lunas'}
                        </Text.Amount>
                        <button 
                            onClick={() => navigate('/iuran')}
                            className="bg-brand-50 border border-brand-100 text-brand-600 px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
                        >
                            <Text.Label className="!text-brand-600">{data.iuranPendingCount > 0 ? 'Bayar' : 'Cek'}</Text.Label> <ArrowRight weight="bold" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Body Section */}
            <div className="px-6 pt-24 pb-6 space-y-8">
                {/* Layanan Mandiri */}
                <div className="animate-fade-in-up">
                    <Text.Label className="!text-slate-800 mb-4">Layanan Mandiri</Text.Label>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/surat')}>
                            <div className="w-[60px] h-[60px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.05)] flex items-center justify-center group-active:scale-95 transition-transform">
                                <EnvelopeSimple weight="regular" className="text-[1.8rem] text-blue-600" />
                            </div>
                            <Text.Label className="text-center leading-[1.2]">SURAT</Text.Label>
                        </div>
                        <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/aduan/new')}>
                            <div className="w-[60px] h-[60px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.05)] flex items-center justify-center group-active:scale-95 transition-transform">
                                <Megaphone weight="regular" className="text-[1.8rem] text-rose-500" />
                            </div>
                            <Text.Label className="text-center leading-[1.2]">ADUAN</Text.Label>
                        </div>
                        <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/iuran')}>
                            <div className="w-[60px] h-[60px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.05)] flex items-center justify-center group-active:scale-95 transition-transform">
                                <CurrencyCircleDollar weight="regular" className="text-[1.8rem] text-emerald-600" />
                            </div>
                            <Text.Label className="text-center leading-[1.2]">IURAN</Text.Label>
                        </div>
                        <div className="flex flex-col items-center gap-3 cursor-pointer group" onClick={() => navigate('/agenda')}>
                            <div className="w-[60px] h-[60px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.05)] flex items-center justify-center group-active:scale-95 transition-transform">
                                <CalendarCheck weight="regular" className="text-[1.8rem] text-purple-600" />
                            </div>
                            <Text.Label className="text-center leading-[1.2]">AGENDA</Text.Label>
                        </div>
                    </div>
                </div>

                {/* Jadwal Ronda (Dark Theme Box) */}
                <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    <div className="flex justify-between items-center mb-4">
                        <Text.Label className="!text-slate-800">Jadwal Ronda Anda</Text.Label>
                        <Text.Label onClick={() => navigate('/ronda')} className="!text-brand-600 cursor-pointer !normal-case tracking-normal">Lihat Jadwal</Text.Label>
                    </div>
                    
                    <div onClick={() => navigate('/ronda')} className="bg-[#1e293b] rounded-[1.25rem] p-4 flex items-center gap-4 relative overflow-hidden shadow-lg border border-slate-800 cursor-pointer active:scale-[0.98] transition-transform">
                        <Flashlight weight="fill" className="absolute -right-4 -bottom-4 text-[5rem] text-slate-700/50 -rotate-12" />
                        
                        <div className="bg-slate-700/80 rounded-2xl w-14 h-14 flex flex-col items-center justify-center text-white border border-slate-600 shadow-inner z-10 shrink-0">
                            <Text.Label className="!text-slate-300 !mt-1">Cek</Text.Label>
                            <div className="flex items-center justify-center mt-0.5">
                                <ClockCounterClockwise size={20} weight="bold" className="text-white" />
                            </div>
                        </div>
                        <div className="z-10">
                            <Text.H2 className="!text-white !text-[0.9375rem] mb-0.5">Jadwal Siskamling</Text.H2>
                            <Text.Caption className="!text-slate-400">Pastikan Anda hadir sesuai jadwal blok/RT Anda.</Text.Caption>
                        </div>
                    </div>
                </div>

                {/* Menu Lainnya Section */}
                <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <Text.Label className="!text-slate-800 mb-4">Pintasan Lainnya</Text.Label>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { label: 'WARGA', icon: Users, path: '/warga', color: 'text-amber-600' },
                            { label: 'ASET', icon: Package, path: '/aset', color: 'text-cyan-600' },
                            { label: 'PENGURUS', icon: FileText, path: '/pengurus', extra: { tab: 'ad-art' }, color: 'text-slate-600' },
                            { label: 'LOGOUT', icon: SignOut, isLogout: true, color: 'text-red-500' },
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
                                className="flex flex-col items-center gap-3 cursor-pointer group"
                            >
                                <div className="w-[60px] h-[60px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.05)] flex items-center justify-center group-active:scale-95 transition-transform">
                                    <item.icon weight="regular" className={`text-[1.8rem] ${item.color}`} />
                                </div>
                                <Text.Label className="text-center truncate w-full px-1 group-active:scale-95 transition-transform leading-[1.2]">
                                    {item.label}
                                </Text.Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Agenda / Announcements Section */}
                {agendas.length > 0 && (
                    <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                        <div className="flex justify-between items-center mb-4">
                            <Text.Label className="!text-slate-800">Pengumuman Terbaru</Text.Label>
                            <Text.Label onClick={() => navigate('/agenda')} className="!text-brand-600 cursor-pointer !normal-case tracking-normal">Semua</Text.Label>
                        </div>
                        <div className="space-y-4">
                            {agendas.map((agenda: any) => (
                                <div 
                                    key={agenda.id} 
                                    onClick={() => navigate('/agenda')}
                                    className="bg-brand-600 p-5 rounded-[1.25rem] text-white relative overflow-hidden group shadow-md active:scale-[0.98] transition-all cursor-pointer"
                                >
                                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                                    <div className="relative z-10">
                                        <div className="inline-flex px-3 py-1 bg-white/20 rounded-full mb-4">
                                            <Text.Label className="!text-white !tracking-widest">Penting</Text.Label>
                                        </div>
                                        <Text.H2 className="!text-[1.0625rem] !text-white !leading-tight mb-2">{agenda.judul}</Text.H2>
                                        <Text.Body className="!text-white/80 !text-[0.8125rem] line-clamp-2 !leading-snug mb-4 !font-medium">{agenda.deskripsi}</Text.Body>
                                        <button className="flex items-center gap-2 text-[0.6875rem] font-bold tracking-widest group/btn">
                                            <Text.Label component="span" className="!text-white !tracking-widest">Lihat Detail</Text.Label>
                                            <Plus weight="bold" className="group-hover/btn:rotate-90 transition-transform text-white" />
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
                            <Text.Label className="!text-slate-800">Jajak Pendapat Aktif</Text.Label>
                        </div>
                        <div className="space-y-4">
                            {activePolls.map((p: any) => (
                               <PollingParticipation key={p.id} pollingId={p.id} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
