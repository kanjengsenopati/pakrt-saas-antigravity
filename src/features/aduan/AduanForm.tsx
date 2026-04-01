import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { aduanService, AduanUsulan } from '../../services/aduanService';
import { 
    ArrowLeft, 
    PaperPlaneTilt, 
    ChatTeardropDots, 
    Lightbulb, 
    ShieldCheck, 
    ShieldSlash, 
    Info
} from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';

type AduanFormData = Pick<AduanUsulan, 'tipe' | 'judul' | 'deskripsi' | 'is_anonymous' | 'foto_url'>;

export default function AduanForm() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const [isUploading, setIsUploading] = useState(false);
    const [fotoUrl, setFotoUrl] = useState<string | undefined>();

    const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<AduanFormData>({
        defaultValues: {
            tipe: 'Aduan',
            is_anonymous: false
        }
    });

    const selectedTipe = watch('tipe');
    const isAnonymous = watch('is_anonymous');

    const onSubmit = async (data: AduanFormData) => {
        if (!currentTenant) return;

        try {
            await aduanService.create({
                ...data,
                foto_url: fotoUrl,
                tenant_id: currentTenant.id,
                scope: currentScope
            });
            navigate('/aduan');
        } catch (error) {
            console.error("Gagal mengirim aspirasi:", error);
            alert("Terjadi kesalahan saat mengirim aspirasi Anda.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/aduan')}
                    className="p-2 hover:bg-white bg-slate-50 text-slate-500 hover:text-slate-900 rounded-xl transition-all border border-slate-100 shadow-sm active:scale-95"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Kirim Aspirasi Baru</h1>
                    <p className="text-slate-500 text-xs font-medium mt-1">Scope: <span className="text-brand-600 font-bold">{currentScope}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Tipe Selector */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setValue('tipe', 'Aduan')}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${selectedTipe === 'Aduan' ? 'border-rose-500 bg-rose-50 shadow-md shadow-rose-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                        <div className={`p-3 rounded-xl transition-colors ${selectedTipe === 'Aduan' ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-rose-500'}`}>
                            <ChatTeardropDots weight="fill" className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-semibold tracking-tight ${selectedTipe === 'Aduan' ? 'text-rose-700' : 'text-slate-600'}`}>Aduan</p>
                            <p className="text-xs text-slate-400 font-medium">Laporkan masalah</p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setValue('tipe', 'Usulan')}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 group ${selectedTipe === 'Usulan' ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-100' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                    >
                        <div className={`p-3 rounded-xl transition-colors ${selectedTipe === 'Usulan' ? 'bg-brand-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:text-brand-50'}`}>
                            <Lightbulb weight="fill" className="w-6 h-6" />
                        </div>
                        <div className="text-center">
                            <p className={`text-sm font-semibold tracking-tight ${selectedTipe === 'Usulan' ? 'text-brand-700' : 'text-slate-600'}`}>Usulan</p>
                            <p className="text-xs text-slate-400 font-medium">Ide & Saran warga</p>
                        </div>
                    </button>
                    <input type="hidden" {...register('tipe', { required: true })} />
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-card border border-slate-100 shadow-premium p-6 md:p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 tracking-tight mb-2">Judul Aspirasi</label>
                            <input
                                placeholder={selectedTipe === 'Aduan' ? "Contoh: Lampu jalan mati di Blok A" : "Contoh: Usul pengadaan taman bermain"}
                                {...register('judul', { required: 'Judul wajib diisi' })}
                                className={`w-full rounded-2xl border-2 p-4 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300 ${errors.judul ? 'border-rose-100 bg-rose-50/30' : 'border-slate-50 bg-slate-50/50 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/5'}`}
                            />
                            {errors.judul && <p className="text-rose-500 text-[10px] font-bold mt-2 uppercase tracking-tight">{errors.judul.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 tracking-tight mb-2">Deskripsi Lengkap</label>
                            <textarea
                                rows={5}
                                placeholder="Jelaskan detail aspirasi Anda di sini..."
                                {...register('deskripsi', { required: 'Deskripsi wajib diisi' })}
                                className={`w-full rounded-2xl border-2 p-4 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-300 leading-relaxed ${errors.deskripsi ? 'border-rose-100 bg-rose-50/30' : 'border-slate-50 bg-slate-50/50 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/5'}`}
                            />
                            {errors.deskripsi && <p className="text-rose-500 text-xs font-semibold mt-2">{errors.deskripsi.message}</p>}
                        </div>

                        <div className="pt-2">
                             <FileUpload 
                                label="Foto Pendukung (Opsional)"
                                helperText="Sertakan bukti foto untuk mempercepat proses penanganan."
                                onUploadSuccess={(url) => setFotoUrl(url)}
                                onRemove={() => setFotoUrl(undefined)}
                                onLoadingChange={setIsUploading}
                             />
                        </div>
                    </div>

                    {/* Privacy Option */}
                    <div className="pt-6 border-t border-slate-50">
                        <div 
                            onClick={() => setValue('is_anonymous', !isAnonymous)}
                            className={`p-4 rounded-btn border-2 cursor-pointer transition-all flex items-center justify-between group ${isAnonymous ? 'border-brand-500 bg-brand-50/30 shadow-sm' : 'border-slate-50 bg-slate-50/30 hover:border-slate-200'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl transition-all ${isAnonymous ? 'bg-brand-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}>
                                    {isAnonymous ? <ShieldCheck weight="fill" className="w-5 h-5" /> : <ShieldSlash weight="bold" className="w-5 h-5" />}
                                </div>
                                <div className="space-y-0.5">
                                    <p className={`text-sm font-semibold tracking-tight ${isAnonymous ? 'text-brand-700' : 'text-slate-700'}`}>Sembunyikan Identitas Saya</p>
                                    <p className="text-xs text-slate-500 font-medium leading-tight">Nama Anda tidak akan terlihat oleh warga lain.</p>
                                </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isAnonymous ? 'bg-brand-500 border-brand-500 text-white' : 'border-slate-300 bg-white'}`}>
                                {isAnonymous && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                        </div>
                        <div className="mt-4 flex items-start gap-2 px-2 py-3 bg-amber-50/50 rounded-btn border border-amber-100/50">
                            <Info weight="fill" className="text-amber-500 w-4 h-4 mt-0.5 shrink-0" />
                            <p className="text-caption font-medium leading-relaxed italic">
                                Catatan: Pengurus RT akan tetap memiliki akses ke identitas Anda untuk keperluan koordinasi dan tindak lanjut laporan.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/aduan')}
                            className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all border border-transparent"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-btn flex items-center justify-center gap-3 text-sm font-bold shadow-premium transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Kirim Sekarang</span>
                                    <PaperPlaneTilt weight="fill" className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
