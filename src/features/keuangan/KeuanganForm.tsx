import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { keuanganService } from '../../services/keuanganService';
import { pengaturanService } from '../../services/pengaturanService';
import { Keuangan } from '../../database/db';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { ArrowLeft, FloppyDisk, CircleNotch } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';

type KeuanganFormData = Omit<Keuangan, 'id' | 'tenant_id' | 'scope'>;

export default function KeuanganForm() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const [fotoBukti, setFotoBukti] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    const [pemasukanCategories, setPemasukanCategories] = useState<string[]>(['Lainnya']);
    const [pengeluaranCategories, setPengeluaranCategories] = useState<string[]>(['Lainnya']);

    const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm<KeuanganFormData>({
        defaultValues: {
            tanggal: new Date().toISOString().split('T')[0],
            tipe: 'pemasukan',
            url_bukti: ''
        }
    });

    const handleFileSuccess = (url: string) => {
        setFotoBukti(url);
        setValue('url_bukti', url);
    };

    const handleFileRemove = () => {
        setFotoBukti('');
        setValue('url_bukti', '');
    };

    const tipeWatch = watch('tipe');

    useEffect(() => {
        if (currentTenant) {
            pengaturanService.getAll(currentTenant.id, currentScope).then(items => {
                const config: any = {};
                items.forEach(i => config[i.key] = i.value);
                if (config.kategori_pemasukan) {
                    try { setPemasukanCategories(JSON.parse(config.kategori_pemasukan)); } catch { }
                }
                if (config.kategori_pengeluaran) {
                    try { setPengeluaranCategories(JSON.parse(config.kategori_pengeluaran)); } catch { }
                }
            });
        }
    }, [currentTenant]);

    const onSubmit = async (data: KeuanganFormData) => {
        if (!currentTenant) return;

        try {
            await keuanganService.create({
                ...data,
                tenant_id: currentTenant.id,
                scope: currentScope
            });
            navigate('/keuangan');
        } catch (error) {
            console.error("Gagal menyimpan transaksi:", error);
            alert("Terjadi kesalahan saat menyimpan transaksi keuangan.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/keuangan')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Catat Transaksi Kas</h1>
                    <p className="text-gray-500 mt-1">Pembukuan penerimaan atau pengeluaran kas <span className="font-semibold text-brand-600">{currentScope}</span></p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Jenis Transaksi <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex justify-center items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${tipeWatch === 'pemasukan' ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <input type="radio" value="pemasukan" {...register('tipe')} className="sr-only" />
                                    <span>Kas Masuk</span>
                                </label>
                                <label className={`flex-1 flex justify-center items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${tipeWatch === 'pengeluaran' ? 'border-red-500 bg-red-50 text-red-700 font-semibold' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                    <input type="radio" value="pengeluaran" {...register('tipe')} className="sr-only" />
                                    <span>Kas Keluar</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Transaksi <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                {...register('tanggal', { required: 'Tanggal wajib diisi' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.tanggal ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            />
                            {errors.tanggal && <p className="text-red-500 text-sm mt-1">{errors.tanggal.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kategori <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('kategori', { required: 'Kategori wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.kategori ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {(tipeWatch === 'pemasukan' ? pemasukanCategories : pengeluaranCategories).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {errors.kategori && <p className="text-red-500 text-sm mt-1">{errors.kategori.message}</p>}
                            <p className="text-sm text-gray-400 mt-1">Kategori dapat diatur di menu Pengaturan.</p>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nominal Transaksi (Rp) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">Rp</span>
                                <Controller
                                    name="nominal"
                                    control={control}
                                    rules={{ required: 'Nominal wajib diisi', min: { value: 1, message: 'Nominal tidak boleh 0' } }}
                                    render={({ field }) => (
                                        <CurrencyInput
                                            {...field}
                                            className="w-full !pl-12 bg-white"
                                            error={!!errors.nominal}
                                        />
                                    )}
                                />
                            </div>
                            {errors.nominal && <p className="text-red-500 text-sm mt-1">{errors.nominal.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Keterangan / Uraian Singkat <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                {...register('keterangan', { required: 'Keterangan wajib diisi' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.keterangan ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                placeholder="Contoh: Pembelian lampu pos ronda..."
                            />
                            {errors.keterangan && <p className="text-red-500 text-sm mt-1">{errors.keterangan.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <FileUpload
                                label="Bukti Transaksi (Opsional)"
                                helperText="Unggah foto struk, kwitansi, atau bukti transfer."
                                multiple={false}
                                existingUrls={fotoBukti ? [fotoBukti] : []}
                                onUploadSuccess={handleFileSuccess}
                                onRemove={handleFileRemove}
                                onLoadingChange={setIsUploading}
                            />
                        </div>

                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/keuangan')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`px-6 py-2.5 text-white rounded-lg flex items-center gap-2 font-medium hover-lift active-press shadow-sm hover:shadow-md transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : (tipeWatch === 'pemasukan' ? 'bg-brand-600 hover:bg-brand-700' : 'bg-red-600 hover:bg-red-700')}`}
                        >
                            {isUploading ? (
                                <CircleNotch weight="bold" className="animate-spin w-5 h-5" />
                            ) : (
                                <FloppyDisk weight="bold" />
                            )}
                            <span>{isUploading ? 'Mengunggah...' : 'Simpan Transaksi Kas'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
