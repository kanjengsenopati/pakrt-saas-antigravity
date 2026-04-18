import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { wargaService } from '../../services/wargaService';
import { Warga } from '../../database/db';
import { ArrowLeft, FloppyDisk, X, CheckCircle, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { dateUtils } from '../../utils/date';
import { FileUpload } from '../../components/ui/FileUpload';


const AGAMA_OPTIONS = [
    'Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya'
];

type WargaFormData = Omit<Warga, 'id' | 'tenant_id' | 'scope'>;

export default function WargaForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [wargasList, setWargasList] = useState<Warga[]>([]);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<WargaFormData>();
    const urlKk = watch('url_kk');


    useEffect(() => {
        if (isEditing && id) {
            wargaService.getById(id).then(data => {
                if (data) {
                    reset({
                        nik: data.nik,
                        nama: data.nama,
                        kontak: data.kontak,
                        alamat: data.alamat,
                        tempat_lahir: data.tempat_lahir || '',
                        tanggal_lahir: dateUtils.toInput(data.tanggal_lahir),
                        pendidikan: data.pendidikan || '',
                        jenis_kelamin: data.jenis_kelamin || 'Laki-laki',
                        agama: data.agama || 'Islam',
                        status_penduduk: data.status_penduduk || 'Tetap',
                        status_rumah: data.status_rumah || 'Dihuni',
                        url_kk: data.url_kk || '',
                        pekerjaan: data.pekerjaan || '',
                        status_domisili: data.status_domisili || 'Aktif',
                        alamat_pindah: data.alamat_pindah || '',
                        tanggal_meninggal: dateUtils.toInput(data.tanggal_meninggal),
                        lokasi_makam: data.lokasi_makam || '',
                        pj_tipe: data.pj_tipe || 'Luar',
                        pj_warga_id: data.pj_warga_id || '',
                        pj_nama: data.pj_nama || '',
                        pj_kontak: data.pj_kontak || ''
                    });
                }
            });
        }
    }, [id, isEditing, reset]);

    useEffect(() => {
        if (currentTenant) {
            wargaService.getAll(currentTenant.id, currentScope)
                .then(data => {
                    const list = data.items || [];
                    setWargasList(list.filter(w => w.id !== id));
                })
                .finally(() => { });
        }
    }, [currentTenant, currentScope, id]);

    const onSubmit = async (data: WargaFormData) => {
        if (!currentTenant) return;
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            const submitData = { ...data };
            if (submitData.tanggal_lahir && submitData.tanggal_lahir.split('-')[0].length === 4) {
                // Convert YYYY-MM-DD to DD-MM-YYYY
                const [y, m, d] = submitData.tanggal_lahir.split('-');
                submitData.tanggal_lahir = `${d}-${m}-${y}`;
            }

            if (submitData.tanggal_meninggal && submitData.tanggal_meninggal.split('-')[0].length === 4) {
                // Convert YYYY-MM-DD to DD-MM-YYYY
                const [y, m, d] = submitData.tanggal_meninggal.split('-');
                submitData.tanggal_meninggal = `${d}-${m}-${y}`;
            }

            if (isEditing && id) {
                await wargaService.update(id, submitData);
            } else {
                await wargaService.create({
                    ...submitData,
                    tenant_id: currentTenant.id,
                    scope: currentScope
                });
            }
            navigate('/warga');
        } catch (error: any) {
            console.error('Gagal menyimpan data:', error);
            const serverDetails = error?.response?.data?.details;
            const msg = error?.response?.data?.error || error?.message || 'Terjadi kesalahan tidak diketahui.';
            setSubmitError(`Gagal menyimpan data: ${msg}${serverDetails ? ` (${serverDetails})` : ''}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/warga')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <Text.H1>
                        {isEditing ? 'Edit Data Warga' : 'Tambah Warga Baru'}
                    </Text.H1>
                    <Text.Body className="!text-slate-500 !mt-1">
                        Scope Aktif: <Text.Body component="span" className="!font-bold !text-brand-600">{currentScope}</Text.Body>
                    </Text.Body>
                </div>
            </div>

            {submitError && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-fade-in">
                    <Warning weight="fill" className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
                    <div>
                        <Text.H2 className="!text-red-700 !font-bold">Gagal Menyimpan</Text.H2>
                        <Text.Body className="!text-red-600 !mt-0.5">{submitError}</Text.Body>
                    </div>
                    <button onClick={() => setSubmitError(null)} className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors">
                        <X weight="bold" className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Text.Label className="block mb-1">
                                Nomor Induk Kependudukan (NIK) <Text.Body component="span" className="!text-red-500">*</Text.Body>
                            </Text.Label>
                            <input
                                type="text"
                                {...register('nik', {
                                    required: 'NIK wajib diisi',
                                    pattern: { value: /^[0-9]{16}$/, message: 'NIK harus 16 digit angka' }
                                })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.nik ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                placeholder="16 digit angka"
                            />
                            {errors.nik && <p className="text-red-500 text-xs mt-1">{errors.nik.message}</p>}
                        </div>

                        <div>
                            <Text.Label className="block mb-1">
                                Nama Lengkap <Text.Body component="span" className="!text-red-500">*</Text.Body>
                            </Text.Label>
                            <input
                                type="text"
                                {...register('nama', { required: 'Nama wajib diisi' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.nama ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                placeholder="Sesuai KTP"
                            />
                            {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama.message}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <Text.Label className="block mb-1">
                                Nomor Telepon / WhatsApp
                            </Text.Label>
                            <input
                                type="text"
                                {...register('kontak')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                placeholder="Contoh: 081234567890"
                            />
                        </div>

                        <div>
                            <Text.Label className="block mb-1">Tempat Lahir</Text.Label>
                            <input
                                type="text"
                                {...register('tempat_lahir')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                placeholder="Kota / Kabupaten"
                            />
                        </div>

                        <div>
                            <Text.Label className="block mb-1">Tanggal Lahir</Text.Label>
                            <input
                                type="date"
                                {...register('tanggal_lahir')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <Text.Label className="block mb-1">Jenis Kelamin</Text.Label>
                            <div className="flex gap-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="Laki-laki" {...register('jenis_kelamin')} className="text-brand-600 focus:ring-brand-500" />
                                    <Text.Body>Laki-Laki</Text.Body>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="Perempuan" {...register('jenis_kelamin')} className="text-brand-600 focus:ring-brand-500" />
                                    <Text.Body>Perempuan</Text.Body>
                                </label>
                            </div>
                        </div>

                        <div>
                            <Text.Label className="block mb-1">Status Domisili</Text.Label>
                            <select
                                {...register('status_domisili')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            >
                                <option value="Aktif">Aktif</option>
                                <option value="Pindah">Pindah</option>
                                <option value="Meninggal Dunia">Meninggal Dunia</option>
                            </select>
                        </div>

                        <div>
                            <Text.Label className="block mb-1">Agama</Text.Label>
                            <select
                                {...register('agama')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            >
                                <option value="">-- Pilih Agama --</option>
                                {AGAMA_OPTIONS.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Text.Label className="block mb-1">Pendidikan Terakhir</Text.Label>
                            <select
                                {...register('pendidikan')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                            >
                                <option value="">-- Pilih Pendidikan --</option>
                                <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                                <option value="SD/Sederajat">SD/Sederajat</option>
                                <option value="SMP/Sederajat">SMP/Sederajat</option>
                                <option value="SMA/Sederajat">SMA/Sederajat</option>
                                <option value="D1-D3">Diploma (D1-D3)</option>
                                <option value="S1/D4">Sarjana (S1/D4)</option>
                                <option value="S2/S3">Pascasarjana (S2/S3)</option>
                            </select>
                        </div>

                        <div>
                            <Text.Label className="block mb-1">Pekerjaan</Text.Label>
                            <input
                                type="text"
                                {...register('pekerjaan')}
                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                placeholder="Contoh: Karyawan Swasta, Guru, dll"
                            />
                        </div>


                        <div>
                            <Text.Label className="block mb-1">Status Penduduk</Text.Label>
                            <div className="flex gap-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="Tetap" {...register('status_penduduk')} className="text-brand-600 focus:ring-brand-500" />
                                    <Text.Body>Tetap</Text.Body>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="Kontrak" {...register('status_penduduk')} className="text-brand-600 focus:ring-brand-500" />
                                    <Text.Body>Kontrak</Text.Body>
                                </label>
                            </div>
                        </div>

                        {watch('status_penduduk') === 'Kontrak' && (
                            <div className="md:col-span-2 p-4 bg-brand-50/50 border border-brand-100 rounded-xl space-y-4 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <CheckCircle weight="fill" className="text-brand-800 w-4 h-4" />
                                    <Text.H2 className="!text-brand-800">Informasi Penanggung Jawab</Text.H2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-2">Tipe Penanggung Jawab</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200">
                                                <input type="radio" value="Warga" {...register('pj_tipe')} className="text-brand-600 focus:ring-brand-500" />
                                                <Text.Body>Dari Data Warga RT</Text.Body>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200">
                                                <input type="radio" value="Luar" {...register('pj_tipe')} className="text-brand-600 focus:ring-brand-500" />
                                                <Text.Body>Orang Luar / Manual</Text.Body>
                                            </label>
                                        </div>
                                    </div>

                                    {watch('pj_tipe') === 'Warga' ? (
                                        <div className="md:col-span-2">
                                            <Text.Label className="block mb-1">Pilih Warga</Text.Label>
                                            <select
                                                {...register('pj_warga_id')}
                                                className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                            >
                                                <option value="">-- Cari/Pilih Warga --</option>
                                                {wargasList.map(w => (
                                                    <option key={w.id} value={w.id}>{w.nama} - {w.nik}</option>
                                                ))}
                                            </select>
                                            <Text.Caption className="!mt-1 italic">* Pilih warga yang bertanggung jawab atas rumah ini</Text.Caption>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <Text.Label className="block mb-1">Nama Penanggung Jawab</Text.Label>
                                                <input
                                                    type="text"
                                                    {...register('pj_nama')}
                                                    className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                                    placeholder="Nama lengkap"
                                                />
                                            </div>
                                            <div>
                                                <Text.Label className="block mb-1">No. Kontak / WA</Text.Label>
                                                <input
                                                    type="text"
                                                    {...register('pj_kontak')}
                                                    className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                                    placeholder="0812..."
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div>
                            <Text.Label className="block mb-1">Status Rumah</Text.Label>
                            <div className="flex gap-4 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="Dihuni" {...register('status_rumah')} className="text-brand-600 focus:ring-brand-500" />
                                    <Text.Body>Dihuni</Text.Body>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" value="Kosong" {...register('status_rumah')} className="text-brand-600 focus:ring-brand-500" />
                                    <Text.Body>Kosong</Text.Body>
                                </label>
                            </div>
                        </div>

                        {watch('status_domisili') === 'Pindah' && (
                            <div className="md:col-span-2 animate-fade-in">
                                <Text.Label className="block mb-1">Alamat Pindah</Text.Label>
                                <textarea
                                    rows={2}
                                    {...register('alamat_pindah')}
                                    className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors resize-none"
                                    placeholder="Alamat lengkap tempat pindah"
                                />
                            </div>
                        )}

                        {watch('status_domisili') === 'Meninggal Dunia' && (
                            <>
                                <div className="animate-fade-in">
                                    <Text.Label className="block mb-1">Tanggal Meninggal</Text.Label>
                                    <input
                                        type="date"
                                        {...register('tanggal_meninggal')}
                                        className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                    />
                                </div>
                                <div className="animate-fade-in">
                                    <Text.Label className="block mb-1">Lokasi Makam</Text.Label>
                                    <input
                                        type="text"
                                        {...register('lokasi_makam')}
                                        className="w-full rounded-lg shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                        placeholder="Nama TPU / Lokasi Pemakaman"
                                    />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-2 space-y-3">
                            <FileUpload
                                existingUrls={urlKk ? [urlKk] : []}
                                onUploadSuccess={(url) => setValue('url_kk', url)}
                                onRemove={() => setValue('url_kk', '')}
                                label="Dokumen KK / KTP / Identitas"
                                helperText="JPG, PNG maksimal 1MB · Dioptimalkan otomatis"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Text.Label className="block mb-1">
                                Alamat Lengkap <Text.Body component="span" className="!text-red-500">*</Text.Body>
                            </Text.Label>
                            <textarea
                                rows={3}
                                {...register('alamat', { required: 'Alamat wajib diisi' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors resize-none ${errors.alamat ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                placeholder="Nama jalan, gang, nomor rumah"
                            />
                            {errors.alamat && <p className="text-red-500 text-xs mt-1">{errors.alamat.message}</p>}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/warga')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Text.Label className="!text-inherit">Batal</Text.Label>
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg flex items-center gap-2 font-medium hover-lift active-press shadow-sm hover:shadow-md transition-all"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <Text.Label className="!text-white">Menyimpan...</Text.Label>
                                </>
                            ) : (
                                <>
                                    <FloppyDisk weight="bold" />
                                    <Text.Label className="!text-white">Simpan Data</Text.Label>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
