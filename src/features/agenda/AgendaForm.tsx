import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { agendaService } from '../../services/agendaService';
import { wargaService } from '../../services/wargaService';
import { Agenda, Warga } from '../../database/db';
import { ArrowLeft, FloppyDisk, Users, Coins, CircleNotch } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
type AgendaFormData = Omit<Agenda, 'id' | 'tenant_id' | 'scope' | 'is_terlaksana' | 'laporan_kegiatan' | 'foto_dokumentasi'>;

export default function AgendaForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
    const [fotoDokumentasi, setFotoDokumentasi] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<AgendaFormData>({
        defaultValues: {
            butuh_pendanaan: false,
            peserta_ids: []
        }
    });

    const [isAllWarga, setIsAllWarga] = useState(true);

    const isButuhPendanaan = watch('butuh_pendanaan');

    useEffect(() => {
        if (!currentTenant) return;
        wargaService.getAll(currentTenant.id, currentScope).then(data => setWargaList(data.items || []));

        if (isEditing && id) {
            agendaService.getById(id).then(data => {
                if (data) {
                    reset({
                        judul: data.judul,
                        tanggal: data.tanggal,
                        deskripsi: data.deskripsi,
                        butuh_pendanaan: data.butuh_pendanaan,
                        nominal_biaya: data.nominal_biaya,
                        sumber_dana: data.sumber_dana,
                        peserta_ids: data.peserta_ids,
                        jenis_kegiatan: data.jenis_kegiatan,
                        perlu_rapat: data.perlu_rapat,
                        keterangan_tambahan: data.keterangan_tambahan
                    });
                    const hasParticipants = data.peserta_ids && data.peserta_ids.length > 0;
                    setSelectedParticipants(data.peserta_ids || []);
                    setIsAllWarga(!hasParticipants);
                    setFotoDokumentasi(data.foto_dokumentasi || []);
                }
            });
        }
    }, [id, isEditing, reset, currentTenant, currentScope]);

    const toggleParticipant = (wargaId: string) => {
        const current = Array.isArray(selectedParticipants) ? selectedParticipants : [];
        const newSelection = current.includes(wargaId)
            ? current.filter(pid => pid !== wargaId)
            : [...current, wargaId];

        setSelectedParticipants(newSelection);
        setValue('peserta_ids', newSelection);
    };

    const onSubmit = async (data: AgendaFormData) => {
        if (!currentTenant) return;

        try {
            const submitData = {
                ...data,
                peserta_ids: isAllWarga ? [] : selectedParticipants,
                foto_dokumentasi: fotoDokumentasi,
                nominal_biaya: data.butuh_pendanaan ? data.nominal_biaya : undefined,
                sumber_dana: data.butuh_pendanaan ? data.sumber_dana : undefined
            };

            if (isEditing && id) {
                await agendaService.update(id, submitData);
            } else {
                await agendaService.create({
                    ...submitData as any,
                    is_terlaksana: false,
                    tenant_id: currentTenant.id,
                    scope: currentScope
                });
            }
            navigate('/agenda');
        } catch (error) {
            console.error("Gagal menyimpan agenda:", error);
            alert("Terjadi kesalahan saat menyimpan jadwal kegiatan.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/agenda')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-normal text-gray-900">
                        {isEditing ? 'Ubah Agenda Kegiatan' : 'Buat Agenda Kegiatan Baru'}
                    </h1>
                    <p className="text-gray-500 mt-1">Dicatat untuk scope: <span className="font-normal text-brand-600">{currentScope}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold tracking-tight text-slate-500 mb-1.5">
                                        Jenis Kegiatan <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('jenis_kegiatan', { required: 'Jenis kegiatan wajib diisi' })}
                                        className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.jenis_kegiatan ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50'}`}
                                    >
                                        <option value="">-- Pilih Jenis --</option>
                                        <option value="Kebersihan">Kebersihan</option>
                                        <option value="Sosial">Sosial</option>
                                        <option value="Kerohanian">Kerohanian</option>
                                        <option value="Keamanan">Keamanan</option>
                                        <option value="Pembangunan">Pembangunan</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                    {errors.jenis_kegiatan && <p className="text-red-500 text-xs mt-1">{errors.jenis_kegiatan.message}</p>}
                                </div>
                                
                                {watch('jenis_kegiatan') && (
                                    <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg border border-brand-100 animate-in fade-in slide-in-from-top-2">
                                        <span className="text-sm font-medium text-brand-900">Perlu Rapat?</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" {...register('perlu_rapat')} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {watch('jenis_kegiatan') && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Keterangan Terkait {watch('jenis_kegiatan')}
                                    </label>
                                    <textarea
                                        rows={3}
                                        {...register('keterangan_tambahan')}
                                        className="w-full rounded-xl p-3 border border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 transition-colors text-sm"
                                        placeholder={`Detail tambahan untuk kegiatan ${watch('jenis_kegiatan')}...`}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-normal text-gray-700 mb-1">
                                    Judul Kegiatan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('judul', { required: 'Judul kegiatan wajib diisi' })}
                                    className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.judul ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50'}`}
                                    placeholder="Contoh: Kerja Bakti Rutin, Lomba 17an, dll"
                                />
                                {errors.judul && <p className="text-red-500 text-xs mt-1">{errors.judul.message}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-normal text-gray-700 mb-1">
                                        Tanggal Pelaksanaan <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...register('tanggal', { required: 'Tanggal wajib diisi' })}
                                        className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.tanggal ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50'}`}
                                    />
                                    {errors.tanggal && <p className="text-red-500 text-xs mt-1">{errors.tanggal.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-normal text-gray-700 mb-1">
                                    Deskripsi Lengkap <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    {...register('deskripsi', { required: 'Deskripsi wajib diisi' })}
                                    className={`w-full rounded-2xl p-4 border transition-all outline-none font-normal leading-relaxed text-slate-700 shadow-sm ${errors.deskripsi ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'}`}
                                    placeholder="Jelaskan detail waktu, tempat kumpul, dan perlengkapan..."
                                />
                                {errors.deskripsi && <p className="text-red-500 text-xs mt-1">{errors.deskripsi.message}</p>}
                            </div>

                            <div className="pt-2">
                                <FileUpload
                                    label="Foto Dokumentasi (Opsional)"
                                    helperText="Unggah foto rencana atau referensi kegiatan."
                                    multiple={true}
                                    existingUrls={fotoDokumentasi}
                                    onUploadSuccess={(url) => setFotoDokumentasi(prev => [...prev, url])}
                                    onRemove={(url) => setFotoDokumentasi(prev => (Array.isArray(prev) ? prev : []).filter(item => item !== url))}
                                    onLoadingChange={setIsUploading}
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Coins weight="duotone" className="w-5 h-5 text-amber-500" />
                                    <span className="font-normal text-gray-900">Butuh Pendanaan?</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" {...register('butuh_pendanaan')} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                                </label>
                            </div>

                            {isButuhPendanaan && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100 animate-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 font-bold z-10 text-xs pointer-events-none">Rp</span>
                                            <Controller
                                                name="nominal_biaya"
                                                control={control}
                                                render={({ field }) => (
                                                    <CurrencyInput
                                                        {...field}
                                                        className="w-full !pl-10 rounded-lg border-amber-200 focus:ring-amber-500 bg-white"
                                                        placeholder="0"
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-normal text-amber-700 capitalize tracking-wider mb-1">
                                            Sumber Dana
                                        </label>
                                        <select
                                            {...register('sumber_dana')}
                                            className="w-full rounded-lg shadow-sm p-2.5 border border-amber-200 focus:ring-2 focus:ring-amber-500 outline-none"
                                        >
                                            <option value="Kas">Kas {currentScope}</option>
                                            <option value="Iuran">Iuran Khusus</option>
                                            <option value="Sponsorship">Sponsorship / Donasi</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/agenda')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-normal transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`px-6 py-2.5 bg-brand-600 text-white rounded-lg flex items-center gap-2 font-normal hover-lift active-press shadow-sm hover:shadow-md transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isUploading ? (
                                <CircleNotch weight="bold" className="animate-spin w-5 h-5" />
                            ) : (
                                <FloppyDisk weight="bold" />
                            )}
                            <span>{isUploading ? 'Mengunggah...' : id ? 'Simpan Perubahan' : 'Buat Agenda'}</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 pb-2">
                            <Users weight="duotone" className="w-5 h-5 text-brand-600" />
                            <h3 className="font-normal text-gray-900 truncate">Peserta Terlibat</h3>
                        </div>

                        <div className="mb-4 p-3 bg-brand-50/50 rounded-xl border border-brand-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-900">Semua Warga</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isAllWarga} 
                                    onChange={(e) => {
                                        setIsAllWarga(e.target.checked);
                                        if (e.target.checked) setSelectedParticipants([]);
                                    }} 
                                    className="sr-only peer" 
                                />
                                <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                        </div>

                        {!isAllWarga && (
                            <>
                                <p className="text-xs text-gray-500 mb-4 italic">
                                    Pilih warga spesifik yang terlibat:
                                </p>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-300">
                                    {wargaList.map((warga) => (
                                        <div
                                            key={warga.id}
                                            onClick={() => toggleParticipant(warga.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedParticipants.includes(warga.id)
                                                ? 'border-brand-500 bg-brand-50'
                                                : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-normal ${selectedParticipants.includes(warga.id) ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                {warga.nama.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-normal truncate ${selectedParticipants.includes(warga.id) ? 'text-brand-900' : 'text-gray-700'}`}>
                                                    {warga.nama}
                                                </p>
                                                <p className="text-[10px] text-gray-400 capitalize tracking-tighter">NIK: {warga.nik.substring(0, 10)}...</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedParticipants.includes(warga.id) ? 'bg-brand-500 border-brand-500' : 'border-gray-300'
                                                }`}>
                                                {selectedParticipants.includes(warga.id) && (
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {wargaList.length === 0 && (
                                        <p className="text-center py-4 text-gray-400 text-xs italic">Belum ada data warga.</p>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50">
                                    <p className="text-xs font-normal text-slate-500 capitalize">Terpilih: <span className="text-brand-600">{selectedParticipants.length} orang</span></p>
                                </div>
                            </>
                        )}
                        
                        {isAllWarga && (
                            <p className="text-[11px] text-slate-400 italic text-center py-4">
                                Pengumuman ini bersifat publik untuk seluruh warga.
                            </p>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
