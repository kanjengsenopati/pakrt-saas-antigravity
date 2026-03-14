import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { suratService } from '../../services/suratService';
import { wargaService } from '../../services/wargaService';
import { SuratPengantar, Warga } from '../../database/db';
import { ArrowLeft, PaperPlaneRight } from '@phosphor-icons/react';

type SuratFormData = Omit<SuratPengantar, 'id' | 'tenant_id' | 'scope' | 'status'>;

const JENIS_SURAT_OPTIONS = [
    'Pengantar KTP/KK',
    'Keterangan Domisili',
    'Keterangan Usaha',
    'Keterangan Tidak Mampu',
    'Keterangan Belum Menikah',
    'Pengantar Nikah (N1-N4)',
    'Surat Kuasa',
    'Lainnya'
];

export default function SuratForm() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();

    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const { register, handleSubmit, formState: { errors } } = useForm<SuratFormData>({
        defaultValues: {
            tanggal: new Date().toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        if (currentTenant) {
            wargaService.getAll(currentTenant.id, currentScope).then(data => setWargaList(data.items || []));
        }
    }, [currentTenant, currentScope]);

    const onSubmit = async (data: SuratFormData) => {
        if (!currentTenant) return;

        try {
            await suratService.create({
                ...data,
                tenant_id: currentTenant.id,
                scope: currentScope,
                status: 'proses'
            });
            navigate('/surat');
        } catch (error) {
            console.error("Gagal menyimpan permohonan:", error);
            alert("Terjadi kesalahan saat menyimpan permohonan surat.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/surat')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Buat Permohonan Surat</h1>
                    <p className="text-gray-500 mt-1">
                        Permohonan baru untuk scope: <span className="font-semibold text-brand-600">{currentScope}</span>
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Warga Pemohon <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('warga_id', { required: 'Warga pamohon wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.warga_id ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="">-- Pilih Warga --</option>
                                {wargaList.map(w => (
                                    <option key={w.id} value={w.id}>{w.nama} ({w.nik})</option>
                                ))}
                            </select>
                            {errors.warga_id && <p className="text-red-500 text-xs mt-1">{errors.warga_id.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Pengajuan <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                {...register('tanggal', { required: 'Tanggal wajib diisi' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.tanggal ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            />
                            {errors.tanggal && <p className="text-red-500 text-xs mt-1">{errors.tanggal.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jenis Surat Pengantar <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('jenis_surat', { required: 'Jenis surat wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.jenis_surat ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="">-- Pilih Jenis Surat --</option>
                                {JENIS_SURAT_OPTIONS.map(j => (
                                    <option key={j} value={j}>{j}</option>
                                ))}
                            </select>
                            {errors.jenis_surat && <p className="text-red-500 text-xs mt-1">{errors.jenis_surat.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Detail Keperluan / Keterangan Tambahan <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                {...register('keperluan', { required: 'Keperluan wajib diisi' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.keperluan ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                placeholder="Contoh: Untuk persyaratan pembuatan rekening bank..."
                            />
                            {errors.keperluan && <p className="text-red-500 text-xs mt-1">{errors.keperluan.message}</p>}
                        </div>

                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/surat')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 font-medium hover-lift active-press shadow-sm hover:shadow-md transition-all"
                        >
                            <span>Ajukan Permohonan</span>
                            <PaperPlaneRight weight="bold" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
