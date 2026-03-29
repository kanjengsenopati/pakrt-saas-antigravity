import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { aduanService, AduanUsulan } from '../../services/aduanService';
import { 
    ArrowLeft, 
    Plus, 
    Trash, 
    CheckCircle,
    Info,
    CalendarBlank
} from '@phosphor-icons/react';

export default function PollingForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [usulan, setUsulan] = useState<AduanUsulan | null>(null);
    const [pertanyaan, setPertanyaan] = useState('');
    const [opsi, setOpsi] = useState<string[]>(['Setuju', 'Tidak Setuju']);
    const [tanggalSelesai, setTanggalSelesai] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (id) {
            aduanService.getById(id).then(setUsulan);
        }
    }, [id]);

    const handleAddOpsi = () => setOpsi([...opsi, '']);
    const handleRemoveOpsi = (index: number) => setOpsi(opsi.filter((_, i) => i !== index));
    const handleOpsiChange = (index: number, value: string) => {
        const newOpsi = [...opsi];
        newOpsi[index] = value;
        setOpsi(newOpsi);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !pertanyaan || opsi.some(o => !o.trim())) return;

        setIsSubmitting(true);
        try {
            await aduanService.convertToPolling(id, {
                pertanyaan,
                opsi,
                tanggal_selesai: tanggalSelesai || undefined
            });
            navigate('/aduan');
        } catch (error) {
            alert("Gagal membuat polling.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!usulan) return <div className="p-10 text-center animate-pulse text-slate-400 font-bold uppercase tracking-widest">Memuat Data Usulan...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-20">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/aduan')}
                    className="p-2 hover:bg-white bg-slate-50 text-slate-500 rounded-xl transition-all border border-slate-100 shadow-sm"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Buat Jajak Pendapat</h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Eskalasi dari usulan warga</p>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <Info weight="fill" className="text-amber-500 w-5 h-5 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900 uppercase tracking-tight">Usulan Asal</p>
                    <p className="text-xs text-amber-700 leading-relaxed font-medium italic">"{usulan.judul}"</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8 space-y-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 leading-none italic">Pertanyaan Polling</label>
                        <textarea
                            value={pertanyaan}
                            onChange={(e) => setPertanyaan(e.target.value)}
                            required
                            placeholder="Apa yang ingin Anda tanyakan kepada warga terkait usulan ini?"
                            rows={3}
                            className="w-full rounded-2xl border-2 border-slate-50 bg-slate-50/50 p-4 text-sm font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/5 transition-all"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 leading-none italic">Pilihan Jawaban</label>
                        <div className="space-y-3">
                            {opsi.map((o, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="flex-1 relative group">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-400" />
                                        <input
                                            value={o}
                                            onChange={(e) => handleOpsiChange(index, e.target.value)}
                                            required
                                            placeholder={`Opsi ${index + 1}`}
                                            className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50/30 text-xs font-bold text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                    {opsi.length > 2 && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveOpsi(index)}
                                            className="p-3 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl transition-all"
                                        >
                                            <Trash weight="bold" className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleAddOpsi}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all"
                        >
                            <Plus weight="bold" />
                            Tambah Opsi Lainnya
                        </button>
                    </div>

                    <div className="pt-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 leading-none italic">Batas Waktu Polling (Opsional)</label>
                        <div className="relative">
                            <CalendarBlank weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                value={tanggalSelesai}
                                onChange={(e) => setTanggalSelesai(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-50 bg-slate-50/30 text-xs font-black text-slate-700 outline-none focus:border-brand-500 focus:bg-white transition-all"
                            />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 italic">*Kosongkan jika polling bersifat terbuka tanpa batas waktu tertentu.</p>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/aduan')}
                        className="flex-1 py-3 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-[2] py-4 bg-emerald-600 border-b-4 border-emerald-800 text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:translate-y-1 active:border-b-0 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CheckCircle weight="fill" className="w-5 h-5" />
                                Terbitkan Polling
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
