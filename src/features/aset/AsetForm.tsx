import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { asetService } from '../../services/asetService';
import { Aset } from '../../database/db';
import { ArrowLeft, FloppyDisk, CircleNotch } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';
import { CurrencyInput } from '../../components/ui/CurrencyInput';

type AsetFormData = Omit<Aset, 'id' | 'tenant_id' | 'scope'>;

export default function AsetForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const [fotoBarang, setFotoBarang] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    const { register, handleSubmit, reset, control, formState: { errors } } = useForm<AsetFormData>();

    useEffect(() => {
        if (isEditing && id) {
            asetService.getById(id).then(data => {
                if (data) {
                    reset({
                        nama_barang: data.nama_barang,
                        jumlah: data.jumlah,
                        kondisi: data.kondisi,
                        tanggal_beli: data.tanggal_beli || '',
                        harga_beli: data.harga_beli || undefined,
                        vendor: data.vendor || ''
                    });
                    if (data.foto_barang) setFotoBarang(data.foto_barang);
                }
            });
        }
    }, [id, isEditing, reset]);

    const onSubmit = async (data: AsetFormData) => {
        if (!currentTenant) return;

        try {
            const payload = { ...data, foto_barang: fotoBarang || undefined };
            if (isEditing && id) {
                await asetService.update(id, payload);
            } else {
                await asetService.create({
                    ...payload,
                    status_pinjam: 'tersedia',
                    tenant_id: currentTenant.id,
                    scope: currentScope
                });
            }
            navigate('/aset');
        } catch (error) {
            console.error("Gagal menyimpan data aset:", error);
            alert("Terjadi kesalahan saat menyimpan data inventaris.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/aset')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Ubah Informasi Aset' : 'Tambah Aset Inventaris'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Dicatat untuk scope: <span className="font-semibold text-brand-600">{currentScope}</span>
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Barang <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                {...register('nama_barang', { required: 'Nama barang wajib diisi' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.nama_barang ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                placeholder="Contoh: Tenda Hajatan, Kursi Plastik, dll"
                            />
                            {errors.nama_barang && <p className="text-red-500 text-xs mt-1">{errors.nama_barang.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Kondisi Fisik <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register('kondisi', { required: 'Kondisi wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.kondisi ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="baik">Baik</option>
                                <option value="rusak_ringan">Rusak Ringan</option>
                                <option value="rusak_berat">Rusak Berat</option>
                            </select>
                            {errors.kondisi && <p className="text-red-500 text-xs mt-1">{errors.kondisi.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Jumlah Barang / Nominal Saat Ini <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                {...register('jumlah', { required: 'Jumlah wajib diisi', min: 0, valueAsNumber: true })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.jumlah ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                placeholder="10"
                            />
                            {errors.jumlah && <p className="text-red-500 text-xs mt-1">{errors.jumlah.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Pembelian (Opsional)
                            </label>
                            <input
                                type="date"
                                {...register('tanggal_beli')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Harga Pembelian (Opsional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">Rp</span>
                                <Controller
                                    name="harga_beli"
                                    control={control}
                                    render={({ field }) => (
                                        <CurrencyInput
                                            {...field}
                                            className="w-full p-3 pl-12 bg-white"
                                            placeholder="0"
                                        />
                                    )}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Vendor / Toko (Opsional)
                            </label>
                            <input
                                type="text"
                                {...register('vendor')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                placeholder="Nama Toko / Supplier"
                            />
                        </div>

                        <div>
                            <FileUpload
                                label="Foto Barang (Opsional)"
                                helperText="Format JPG, PNG maksimal 2MB. Diperlukan untuk validasi kondisi fisik aset."
                                existingUrls={fotoBarang ? [fotoBarang] : []}
                                onUploadSuccess={(url) => setFotoBarang(url)}
                                onRemove={() => setFotoBarang('')}
                                onLoadingChange={setIsUploading}
                            />
                        </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/aset')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`px-6 py-2.5 bg-brand-600 text-white rounded-lg flex items-center gap-2 font-medium transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-700 hover-lift active-press shadow-sm hover:shadow-md'}`}
                        >
                            {isUploading ? <CircleNotch weight="bold" className="animate-spin" /> : <FloppyDisk weight="bold" />}
                            <span>{isUploading ? 'Menyimpan...' : 'Simpan Inventaris'}</span>
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
