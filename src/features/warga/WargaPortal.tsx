import { useEffect, useState } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { statsService } from '../../services/statsService';
import { 
    User, 
    HandCoins, 
    FileText, 
    Users, 
    MapPin, 
    IdentificationCard,
    CaretRight,
    ChatDots,
    ChartPieSlice,
    Plus,
    Clock
} from '@phosphor-icons/react';
import { formatRupiah } from '../../utils/currency';
import { useNavigate } from 'react-router-dom';
import { aduanService } from '../../services/aduanService';
import { pollingService } from '../../services/pollingService';
import PollingParticipation from '../aduan/PollingParticipation';

export default function WargaPortal() {
    const { user } = useAuth();
    const { currentScope } = useTenant();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activePolls, setActivePolls] = useState<any[]>([]);
    const [myAspirations, setMyAspirations] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            if (!user?.warga_id) {
                // Not a warga, maybe an admin
                setIsLoading(false);
                return;
            }
            try {
                const [res, polls, aspirations] = await Promise.all([
                    statsService.getWargaPersonalStats(),
                    pollingService.getAll('Aktif', currentScope),
                    aduanService.getAll({ scope: currentScope, limit: 3 })
                ]);
                setData(res);
                setActivePolls(polls);
                setMyAspirations(aspirations.items);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [currentScope]);

    if (isLoading) return <div className="p-8 text-center animate-pulse">Memuat Profil Warga...</div>;
    
    if (!user?.warga_id || !data?.warga) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-xl space-y-4">
                <div className="mx-auto w-20 h-20 bg-slate-50 flex items-center justify-center rounded-full text-slate-300">
                    <User size={40} weight="duotone" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900">Akun Belum Terhubung</h2>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto">Akun Anda belum terhubung ke data warga. Silakan hubungi pengurus RT untuk sinkronisasi data.</p>
                </div>
                <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Kembali ke Dashboard</button>
            </div>
        );
    }

    const { warga, iuranHeader, surat } = data;

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-8">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden shrink-0">
                        {warga.avatar ? (
                            <img src={warga.avatar} alt={warga.nama} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-600 text-white text-3xl font-bold">
                                {warga.nama.charAt(0)}
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center sm:text-left flex-1">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{warga.nama}</h1>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                            <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded-full border border-brand-100 uppercase tracking-wider">
                                {warga.status_penduduk}
                            </span>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                                {currentScope} {warga.tenant_id.split('.').pop()}
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm mt-3 flex items-center justify-center sm:justify-start gap-1.5 font-medium">
                            <MapPin weight="fill" className="text-brand-500" />
                            {warga.alamat}
                        </p>
                    </div>

                    <button 
                        onClick={() => navigate('/settings/profile')}
                        className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2"
                    >
                        <User size={18} />
                        Edit Profil
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Iuran Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <HandCoins weight="duotone" className="text-emerald-600" size={24} />
                            Riwayat Iuran Terakhir
                        </h3>
                        <button onClick={() => navigate('/iuran')} className="text-brand-600 font-bold text-sm hover:underline">Semua</button>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                        {iuranHeader?.length > 0 ? (
                            iuranHeader.map((i: any) => (
                                <div key={i.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{i.kategori}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-1">Bulan {i.periode_bulan.join(', ')} {i.periode_tahun}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">{formatRupiah(i.nominal)}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${i.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {i.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-slate-400 italic">Belum ada riwayat pembayaran.</div>
                        )}
                        <button 
                            onClick={() => navigate('/iuran/baru')}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            Bayar Iuran Baru
                        </button>
                    </div>
                </div>

                {/* Surat Section */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <FileText weight="duotone" className="text-blue-600" size={24} />
                            Pengajuan Surat RT
                        </h3>
                        <button onClick={() => navigate('/surat')} className="text-brand-600 font-bold text-sm hover:underline">Riwayat</button>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                        {surat?.length > 0 ? (
                            surat.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${s.status === 'selesai' ? 'bg-emerald-100 text-emerald-600' : s.status === 'ditolak' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <FileText size={20} weight="fill" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{s.jenis_surat}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{s.status}</p>
                                        </div>
                                    </div>
                                    <CaretRight weight="bold" className="text-slate-300" />
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-slate-400 italic">Belum ada pengajuan surat.</div>
                        )}
                        <button 
                            onClick={() => navigate('/surat/baru')}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                        >
                            Ajukan Surat RT
                        </button>
                    </div>
                </div>
            </div>

            {/* KK Section */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Users weight="duotone" className="text-orange-500" size={24} />
                        Data Anggota Keluarga
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {warga.anggota?.map((a: any) => (
                            <div key={a.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                                    <IdentificationCard size={20} weight="duotone" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{a.nama}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">{a.hubungan}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-bold tracking-wider">{a.nik}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Aspirasi Section */}
                 <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <ChatDots weight="duotone" className="text-brand-500" size={24} />
                            Aspirasi & Laporan Anda
                        </h3>
                        <button onClick={() => navigate('/aduan')} className="text-brand-600 font-bold text-sm hover:underline">Semua</button>
                    </div>
                    <div className="p-6 flex-1 space-y-4">
                        {myAspirations?.length > 0 ? (
                            myAspirations.map((a: any) => (
                                <div key={a.id} className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all decoration-none cursor-pointer" onClick={() => navigate('/aduan')}>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{a.judul}</h4>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                            a.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                                            a.status === 'Proses' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                            {a.status}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-1">{a.deskripsi}</p>
                                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200/50">
                                        <Clock weight="bold" size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-medium text-slate-400 font-mono italic">Diposting: {a.tanggal}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center flex flex-col items-center gap-2">
                                <div className="p-3 bg-slate-50 rounded-full">
                                    <ChatDots weight="duotone" className="text-slate-300 w-8 h-8" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium italic">Anda belum mengirim aspirasi maupun aduan.</p>
                            </div>
                        )}
                        <button 
                            onClick={() => navigate('/aduan/new')}
                            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus weight="bold" />
                            Kirim Aspirasi / Aduan
                        </button>
                    </div>
                 </div>

                 {/* Active Polls Section */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-2 px-2">
                        <ChartPieSlice weight="fill" className="text-brand-600" size={20} />
                        <h3 className="font-black text-slate-900 text-xs uppercase tracking-tight">Jajak Pendapat Aktif</h3>
                    </div>
                    {activePolls?.length > 0 ? (
                        activePolls.map((p: any) => (
                            <PollingParticipation key={p.id} pollingId={p.id} />
                        ))
                    ) : (
                        <div className="p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center gap-3">
                            <Clock weight="duotone" className="text-slate-300 w-10 h-10" />
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Belum ada jajak pendapat aktif untuk saat ini.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
}
