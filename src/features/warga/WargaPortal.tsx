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
    House, 
    Wallet, 
    Lightbulb, 
    Checks, 
    Package, 
    UserCircle, 
    CaretLeft,
    SignOut,
    Megaphone
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { pollingService } from '../../services/pollingService';
import { agendaService } from '../../services/agendaService';
import PollingParticipation from '../aduan/PollingParticipation';

export default function WargaPortal() {
    const { user, logout } = useAuth();
    const { currentScope, currentTenant } = useTenant();
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
            if (!user?.warga_id || !currentTenant) {
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
    }, [currentScope, currentTenant, user?.warga_id]);

    if (isLoading) return <div className="min-h-screen bg-[#F5F7F6] p-8 text-center animate-pulse flex items-center justify-center text-[#004D40] font-bold">Memuat Dashboard Warga...</div>;
    
    if (!user?.warga_id || !data?.warga) {
        return (
            <div className="min-h-screen bg-[#F5F7F6] p-6 flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 bg-white shadow-xl rounded-3xl flex items-center justify-center text-slate-300">
                    <User size={48} weight="duotone" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-900 font-outfit uppercase tracking-tight">Akun Belum Terhubung</h2>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Data warga Anda belum tersinkronisasi. Silakan hubungi pengurus RT Anda.</p>
                </div>
                <button 
                  onClick={() => navigate('/login')} 
                  className="px-8 py-3 bg-[#004D40] text-white rounded-2xl text-sm font-bold shadow-lg shadow-teal-900/20 active:scale-95 transition-all"
                >
                  Masuk Kembali
                </button>
            </div>
        );
    }

    const { warga } = data;

    const menuItems = [
        { label: 'Depan', icon: House, path: '/warga-portal', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Profil', icon: UserCircle, path: '/profile', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Bayar', icon: HandCoins, path: '/iuran/baru', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Keuangan', icon: Wallet, path: '/iuran', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Aduan', icon: Megaphone, path: '/aduan/new', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Usulan', icon: Lightbulb, path: '/aduan/new', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Surat', icon: Checks, path: '/surat', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Ronda', icon: ShieldCheck, path: '/ronda', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Aset', icon: Package, path: '/aset', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'Pengurus', icon: Users, path: '/pengurus', color: 'bg-[#E0F2F1] text-[#004D40]' },
        { label: 'AD/ART', icon: FileText, path: '/pengurus', color: 'bg-[#E0F2F1] text-[#004D40]', extra: { tab: 'ad-art' } },
        { label: 'Lapor Tamu', icon: User, path: '/aduan/new', color: 'bg-[#E0F2F1] text-[#004D40]' },
    ];

    return (
        <div className="min-h-screen bg-[#F5F7F6] font-inter pb-24 transition-all duration-500 overflow-x-hidden" translate="no">
            {/* Top Navigation Bar */}
            <div className="sticky top-0 z-50 bg-[#F5F7F6]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-black/5">
                <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 text-[#004D40] flex items-center gap-2 group">
                    <CaretLeft size={24} weight="bold" />
                    <span className="text-xs font-bold font-outfit uppercase tracking-wider group-active:translate-x-1 transition-transform">Kembali</span>
                </button>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => { if(window.confirm('Keluar dari aplikasi?')) logout(); }}
                        className="p-2 text-[#004D40] hover:bg-[#E0F2F1] rounded-full transition-colors"
                        title="Keluar"
                    >
                        <SignOut size={22} weight="bold" />
                    </button>
                    <div 
                        onClick={() => navigate('/profile')} 
                        className="w-10 h-10 rounded-xl border-2 border-[#004D40]/20 overflow-hidden cursor-pointer shadow-sm active:scale-95 transition-all"
                    >
                        {warga.avatar ? (
                            <img src={warga.avatar} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                            <div className="w-full h-full bg-[#E0F2F1] text-[#004D40] flex items-center justify-center font-bold">
                                {warga.nama.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dashboard Title Row */}
            <div className="px-6 pt-4 pb-2">
                <h2 className="text-sm font-black text-[#004D40] uppercase tracking-[0.2em] font-outfit opacity-60">
                    Dashboard Warga
                </h2>
            </div>

            {/* Hero Section */}
            <div className="px-6 pt-4 pb-2">
                <p className="text-lg font-bold text-[#004D40] tracking-tight leading-none mb-1">
                    {getGreeting()}, {warga.jenis_kelamin === 'L' ? 'Bapak' : (warga.jenis_kelamin === 'P' ? 'Ibu' : '')} {warga.nama.split(' ')[0]}
                </p>
                <div className="mt-4 mb-8 p-5 bg-white border border-teal-600/5 rounded-[28px] shadow-sm">
                    <p className="text-[13px] text-[#004D40]/70 leading-relaxed font-medium">
                        Anda terdaftar sebagai warga <strong>RT {currentTenant?.config?.rt || '-'}</strong>, <strong>RW {currentTenant?.config?.rw || '-'}</strong>, Kel {currentTenant?.config?.kelurahan || '-'}, Kec {currentTenant?.config?.kecamatan || '-'}, {currentTenant?.config?.kota || '-'}.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-2">
                    {/* Iuran Card */}
                    <div className={`flex flex-col gap-1 px-5 py-5 rounded-[32px] shadow-sm border transition-all active:scale-[0.98] ${
                        data.iuranPendingCount > 0 
                            ? 'bg-red-50/70 border-red-100 text-red-900 group shadow-red-900/5' 
                            : 'bg-emerald-50/70 border-emerald-200/50 text-emerald-900 group shadow-emerald-900/5'
                    }`}>
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2.5 rounded-2xl ${data.iuranPendingCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                <Wallet size={20} weight="fill" />
                            </div>
                            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                                data.iuranPendingCount > 0 ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                            }`}>
                                {data.iuranPendingCount > 0 ? 'Tertunggak' : 'Lancar'}
                            </span>
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5`}>Tagihan Iuran</p>
                        <h4 className="text-[15px] font-bold leading-tight font-outfit">
                            {data.iuranPendingCount > 0 ? `${data.iuranPendingCount} Bulan Belum Bayar` : 'Semua Sudah Terbayar'}
                        </h4>
                    </div>
                    
                    {/* Surat Card */}
                    <div className="flex flex-col gap-1 px-5 py-5 bg-blue-50/70 border-blue-100/50 border rounded-[32px] shadow-sm shadow-blue-900/5 text-blue-900 group active:scale-[0.98] transition-all">
                        <div className="flex items-center justify-between mb-3">
                            <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                                <FileText size={20} weight="fill" />
                            </div>
                            <span className="text-[10px] font-black uppercase px-3 py-1 bg-blue-600 text-white rounded-full">
                                {data.suratProsesCount > 0 ? 'Proses' : 'Selesai'}
                            </span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Surat Keterangan</p>
                        <h4 className="text-[15px] font-bold leading-tight font-outfit">
                            {data.suratProsesCount > 0 ? `${data.suratProsesCount} Surat Diproses` : 'Tidak Ada Ajuan Aktif'}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Grid Menu Actions (4 Columns) */}
            <div className="px-6 py-6">
                <div className="grid grid-cols-4 gap-x-3 gap-y-6">
                    {menuItems.map((item, idx) => (
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
                            <div className={`w-full aspect-square bg-[#004D40]/5 rounded-[22px] flex items-center justify-center group-active:scale-[0.85] transition-all border border-black/[0.03] group-hover:bg-[#004D40]/10`}>
                                <item.icon size={26} weight="duotone" className="text-[#004D40]/80" />
                            </div>
                            <span className="text-[13.8px] font-bold text-[#004D40]/80 leading-none text-center whitespace-nowrap">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Announcement Section */}
            <div className="px-6 py-8">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xs font-black text-[#004D40] uppercase tracking-[0.2em] font-outfit opacity-60">Pengumuman Terbaru</h3>
                    <button onClick={() => navigate('/agenda')} className="text-[11px] font-bold text-[#004D40]/80 underline decoration-[#004D40]/30 offset-2">Lihat Semua</button>
                </div>
                
                <div className="space-y-4">
                    {agendas.length > 0 ? (
                        agendas.map((agenda: any) => (
                            <div 
                                key={agenda.id} 
                                onClick={() => navigate('/agenda')}
                                className="bg-[#004D40] p-6 rounded-[28px] text-white relative overflow-hidden group shadow-2xl shadow-teal-950/20 active:scale-[0.98] transition-all"
                            >
                                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                                <div className="relative z-10">
                                    <div className="inline-flex px-3 py-1 bg-[#4DB6AC] rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                        Penting
                                    </div>
                                    <h4 className="text-xl font-bold leading-tight mb-2 font-outfit">{agenda.judul}</h4>
                                    <p className="text-teal-50/70 text-sm line-clamp-2 leading-relaxed mb-6 font-medium">{agenda.deskripsi}</p>
                                    <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest group/btn">
                                        Lihat Detail
                                        <Plus weight="bold" className="group-hover/btn:rotate-90 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-6 rounded-[28px] text-center border-2 border-dashed border-teal-100 py-12">
                            <Megaphone size={40} weight="duotone" className="mx-auto text-teal-100 mb-2" />
                            <p className="text-xs font-bold text-teal-200 uppercase tracking-widest">Belum ada pengumuman.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Polling (If exists) */}
            {activePolls.length > 0 && (
                <div className="px-6 py-6 border-t border-black/5">
                    <div className="flex items-center gap-2 mb-4">
                        <ChartPieSlice size={18} weight="fill" className="text-brand-500" />
                        <h3 className="text-xs font-black text-[#004D40] uppercase tracking-widest font-outfit">Jajak Pendapat Aktif</h3>
                    </div>
                    <div className="space-y-4">
                        {activePolls.map((p: any) => (
                           <PollingParticipation key={p.id} pollingId={p.id} />
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
