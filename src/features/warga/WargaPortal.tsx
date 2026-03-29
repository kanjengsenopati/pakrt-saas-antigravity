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
    Bell, 
    Envelope, 
    Wallet, 
    Lightbulb, 
    Checks, 
    Package, 
    UserCircle, 
    CaretLeft,
    SignOut,
    Megaphone
} from '@phosphor-icons/react';
import { formatRupiah } from '../../utils/currency';
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
    const [totalKas, setTotalKas] = useState(0);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 11) return 'SELAMAT PAGI';
        if (hour < 15) return 'SELAMAT SIANG';
        if (hour < 19) return 'SELAMAT SORE';
        return 'SELAMAT MALAM';
    };

    useEffect(() => {
        const load = async () => {
            if (!user?.warga_id || !currentTenant) {
                setIsLoading(false);
                return;
            }
            try {
                const [res, polls, upcomingAgendas, dashboardStats] = await Promise.all([
                    statsService.getWargaPersonalStats(),
                    pollingService.getAll('Aktif', currentScope),
                    agendaService.getUpcoming(currentTenant.id, currentScope, 2),
                    statsService.getDashboardStats(currentScope)
                ]);
                setData(res);
                setActivePolls(polls);
                setAgendas(upcomingAgendas);
                
                // Calculate total kas (Pemasukan - Pengeluaran)
                const kas = dashboardStats.financialTrend?.reduce((acc: any, curr: any) => 
                    curr.tipe === 'pemasukan' ? acc + (curr._sum.nominal || 0) : acc - (curr._sum.nominal || 0), 0) || 0;
                setTotalKas(kas);
            } catch (err) {
                console.error(err);
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
                <button onClick={() => navigate('/')} className="p-2 -ml-2 text-[#004D40]">
                    <CaretLeft size={24} weight="bold" />
                </button>
                <h2 className="text-sm font-black text-[#004D40] uppercase tracking-widest font-outfit">Dashboard Warga</h2>
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
                        className="w-10 h-10 rounded-full border-2 border-[#004D40] overflow-hidden cursor-pointer shadow-sm active:scale-90 transition-transform"
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

            {/* Hero Section */}
            <div className="px-6 pt-6 pb-4">
                <p className="text-[10px] font-bold text-[#546E7A] uppercase tracking-[0.2em]">{getGreeting()}, {warga.nama.split(' ')[0]}</p>
                <h1 className="text-3xl font-black text-[#004D40] leading-[1.15] mt-2 mb-6 font-outfit tracking-tight">
                    Lingkungan Aman,<br />Hati Tenang.
                </h1>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-[#FFF3E0] rounded-full shrink-0 shadow-sm border border-amber-100">
                        <ShieldCheck size={16} weight="fill" className="text-[#5D4037]" />
                        <span className="text-[11px] font-bold text-[#5D4037] whitespace-nowrap">Security Guard on Patrol</span>
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-2 bg-[#E0F2F1] rounded-full shrink-0 shadow-sm border border-teal-100">
                        <Wallet size={16} weight="fill" className="text-[#004D40]" />
                        <span className="text-[11px] font-bold text-[#004D40] whitespace-nowrap">Kas {currentScope}: {formatRupiah(totalKas)}</span>
                    </div>
                </div>
            </div>

            {/* Grid Menu Actions */}
            <div className="px-6 py-4">
                <div className="grid grid-cols-3 gap-4">
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
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className={`w-full aspect-square md:w-16 md:h-16 ${item.color} rounded-[24px] flex items-center justify-center shadow-lg shadow-teal-900/5 group-active:scale-90 transition-all border border-white`}>
                                <item.icon size={28} weight="duotone" />
                            </div>
                            <span className="text-[11px] font-bold text-[#004D40]/80 uppercase tracking-tighter text-center leading-none mt-1">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Announcement Section */}
            <div className="px-6 py-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-black text-[#004D40] uppercase tracking-widest font-outfit">Pengumuman Terbaru</h3>
                    <button onClick={() => navigate('/agenda')} className="text-[10px] font-bold text-[#004D40]/60 uppercase tracking-wider">Lihat Semua</button>
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

            {/* Bottom Navigation */}
            <div className="fixed bottom-6 left-6 right-6 z-[60]">
                <div className="bg-[#004D40] rounded-[32px] p-2 flex items-center justify-between shadow-2xl shadow-teal-950/40">
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-white transition-all scale-110"
                    >
                        <div className="p-2.5 bg-white/10 rounded-2xl">
                             <House size={22} weight="fill" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest">Beranda</span>
                    </button>
                    
                    <button 
                        onClick={() => navigate('/aduan')}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-teal-50/50 hover:text-white transition-all"
                    >
                        <Bell size={22} weight="bold" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100">Notif</span>
                    </button>

                    <button 
                        onClick={() => navigate('/surat')}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-teal-50/50 hover:text-white transition-all"
                    >
                        <Envelope size={22} weight="bold" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-0">Pesan</span>
                    </button>

                    <button 
                        onClick={() => navigate('/profile')}
                        className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-teal-50/50 hover:text-white transition-all"
                    >
                        <UserCircle size={22} weight="bold" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-0">Profil</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

