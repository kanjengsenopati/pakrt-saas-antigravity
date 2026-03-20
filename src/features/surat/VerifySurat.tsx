import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { suratService, SuratWithWarga } from '../../services/suratService';
import { dateUtils } from '../../utils/date';
import { CheckCircle, Warning, SealCheck, Info, FileText, User, CalendarBlank, MapPin } from '@phosphor-icons/react';

export default function VerifySurat() {
    const { id } = useParams<{ id: string }>();
    const [surat, setSurat] = useState<SuratWithWarga | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const data = await suratService.getById(id);
                if (data) {
                    setSurat(data);
                } else {
                    setError("Dokumen tidak ditemukan atau tidak valid.");
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError("Gagal memverifikasi dokumen.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center space-y-4 animate-pulse">
                    <div className="w-16 h-16 bg-brand-200 rounded-full mx-auto"></div>
                    <p className="text-slate-500 font-medium">Memverifikasi Keaslian Dokumen...</p>
                </div>
            </div>
        );
    }

    if (error || !surat) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border border-red-100">
                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
                        <Warning weight="fill" className="w-12 h-12" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Verifikasi Gagal</h1>
                    <p className="text-slate-500 mb-8">{error || "Dokumen ini tidak terdaftar dalam sistem kami."}</p>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-red-700 text-xs font-bold tracking-normal">
                        Peringatan: Dokumen Tidak Sah
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6 font-sans">
            <div className="max-w-2xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-emerald-100 mb-8 animate-scale-in">
                    <div className="bg-emerald-500 p-10 text-center relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <SealCheck weight="fill" className="absolute -right-10 -top-10 w-64 h-64 rotate-12" />
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto shadow-xl ring-4 ring-white/30">
                                <SealCheck weight="fill" className="w-14 h-14 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Dokumen Sah</h1>
                                <p className="text-emerald-50 font-bold tracking-normal text-xs">Terkonfirmasi Sistem PakRT</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        {/* Status Alert */}
                        <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-3xl border border-emerald-100 text-emerald-800">
                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                <CheckCircle weight="fill" className="w-6 h-6 text-emerald-500" />
                            </div>
                            <p className="text-sm font-bold leading-tight">
                                Data ini ditarik langsung dari database resmi Kelurahan/RT melalui sistem digital.
                            </p>
                        </div>

                        {/* Document Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <FileText weight="bold" className="w-4 h-4" />
                                    <span className="text-[10px] font-bold text-slate-400 tracking-normal">Jenis Dokumen</span>
                                </div>
                                <p className="font-bold text-slate-900 text-lg leading-tight">{surat.jenis_surat}</p>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Info weight="bold" className="w-4 h-4" />
                                    <span className="text-[10px] font-bold text-slate-400 tracking-normal">Nomor Surat</span>
                                </div>
                                <p className="font-mono font-bold text-slate-900">{surat.nomor_surat || 'DALAM PROSES'}</p>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <User weight="bold" className="w-4 h-4" />
                                    <span className="text-[10px] font-bold text-slate-400 tracking-normal">Nama Pemohon</span>
                                </div>
                                <p className="font-bold text-slate-900 text-lg">{surat.pemohon?.nama}</p>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <CalendarBlank weight="bold" className="w-4 h-4" />
                                    <span className="text-[10px] font-bold text-slate-400 tracking-normal">Tanggal Terbit</span>
                                </div>
                                <p className="font-bold text-slate-900 leading-tight">
                                    {dateUtils.toDisplay(surat.tanggal)}
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPin weight="bold" className="w-4 h-4" />
                                <span className="text-[10px] font-bold text-slate-400 tracking-normal">Keterangan / Keperluan</span>
                            </div>
                            <p className="text-slate-700 font-medium leading-relaxed">{surat.keperluan}</p>
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 text-center">
                        <p className="text-[10px] font-bold text-slate-400 tracking-normal">Hak Cipta © PakRT Digital System</p>
                    </div>
                </div>

                <p className="text-center text-slate-400 text-xs font-medium">
                    Halaman ini dikelola secara ketat oleh sistem keamanan PakRT.<br />
                    Pemanfaatan data dokumen secara ilegal dapat diproses hukum.
                </p>
            </div>
        </div>
    );
}
