import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { suratService, SuratWithWarga } from '../../services/suratService';
import { dateUtils } from '../../utils/date';
import { CheckCircle, Warning, SealCheck, Info, FileText, User, CalendarBlank, MapPin } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';

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
                    <Text.Body className="!text-slate-500 !font-bold">Memverifikasi Keaslian Dokumen...</Text.Body>
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
                    <Text.H1 className="!text-2xl mb-2">Verifikasi Gagal</Text.H1>
                    <Text.Body className="!text-slate-500 mb-8">{error || "Dokumen ini tidak terdaftar dalam sistem kami."}</Text.Body>
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                        <Text.Label className="!text-red-700">Peringatan: Dokumen Tidak Sah</Text.Label>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6 font-sans">
            <div className="max-w-2xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-brand-100 mb-8 animate-scale-in">
                    <div className="bg-brand-600 p-10 text-center relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-10">
                            <SealCheck weight="fill" className="absolute -right-10 -top-10 w-64 h-64 rotate-12" />
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto shadow-xl ring-4 ring-white/30">
                                <SealCheck weight="fill" className="w-14 h-14 text-white" />
                            </div>
                            <div>
                                <Text.H1 className="!text-3xl !text-white">Dokumen Sah</Text.H1>
                                <Text.Label className="!text-brand-50">Terkonfirmasi Sistem PakRT</Text.Label>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-8">
                        {/* Status Alert */}
                        <div className="flex items-center gap-4 p-5 bg-brand-50 rounded-3xl border border-brand-100 text-brand-800">
                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                <CheckCircle weight="fill" className="w-6 h-6 text-brand-600" />
                            </div>
                            <Text.Label className="!text-brand-800 tracking-normal !normal-case">
                                Data ini ditarik langsung dari database resmi Kelurahan/RT melalui sistem digital.
                            </Text.Label>
                        </div>

                        {/* Document Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <FileText weight="bold" className="w-4 h-4" />
                                    <Text.Label className="!text-slate-400">Jenis Dokumen</Text.Label>
                                </div>
                                <Text.Body className="!font-bold !text-slate-900 !text-lg">{surat.jenis_surat}</Text.Body>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Info weight="bold" className="w-4 h-4" />
                                    <Text.Label className="!text-slate-400">Nomor Surat</Text.Label>
                                </div>
                                <Text.Body className="font-mono !font-bold !text-slate-900">{surat.nomor_surat || 'DALAM PROSES'}</Text.Body>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <User weight="bold" className="w-4 h-4" />
                                    <Text.Label className="!text-slate-400">Nama Pemohon</Text.Label>
                                </div>
                                <Text.Body className="!font-bold !text-slate-900 !text-lg !uppercase">{surat.pemohon?.nama}</Text.Body>
                            </div>

                            <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                                <div className="flex items-center gap-2 text-slate-400">
                                    <CalendarBlank weight="bold" className="w-4 h-4" />
                                    <Text.Label className="!text-slate-400">Tanggal Terbit</Text.Label>
                                </div>
                                <Text.Body className="!font-bold !text-slate-900">
                                    {dateUtils.toDisplay(surat.tanggal)}
                                </Text.Body>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPin weight="bold" className="w-4 h-4" />
                                <Text.Label className="!text-slate-400">Keterangan / Keperluan</Text.Label>
                            </div>
                            <Text.Body className="!text-slate-700 !font-medium">{surat.keperluan}</Text.Body>
                        </div>
                    </div>

                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 text-center">
                        <Text.Caption className="!font-bold !text-slate-400">Hak Cipta © PakRT Digital System</Text.Caption>
                    </div>
                </div>

                <Text.Caption className="text-center !text-slate-400 !font-medium block">
                    Halaman ini dikelola secara ketat oleh sistem keamanan PakRT.<br />
                    Pemanfaatan data dokumen secara ilegal dapat diproses hukum.
                </Text.Caption>
            </div>
        </div>
    );
}
