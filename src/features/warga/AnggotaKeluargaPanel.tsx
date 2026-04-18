import { useState, useEffect } from 'react';
import { AnggotaKeluarga } from '../../database/db';
import { anggotaKeluargaService } from '../../services/anggotaKeluargaService';
import { useForm } from 'react-hook-form';
import { Plus, PencilSimple, Trash, FloppyDisk, Users } from '@phosphor-icons/react';
import { dateUtils } from '../../utils/date';

interface Props {
    wargaId: string;
    tenantId: string;
    initialData?: AnggotaKeluarga[];
}

type AnggotaFormData = Omit<AnggotaKeluarga, 'id' | 'tenant_id' | 'warga_id'>;

export default function AnggotaKeluargaPanel({ wargaId, tenantId, initialData }: Props) {
    const [anggotaList, setAnggotaList] = useState<AnggotaKeluarga[]>(initialData || []);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const { register, handleSubmit, reset } = useForm<AnggotaFormData>();

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await anggotaKeluargaService.getAllByWargaId(wargaId);
            setAnggotaList(data);
        } catch (error) {
            console.error("Failed to load anggota keluarga:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!initialData) {
            loadData();
        } else {
            setAnggotaList(initialData);
            setIsLoading(false);
        }
    }, [wargaId, initialData]);

    const openCreateForm = () => {
        setEditingId(null);
        reset({ nik: '', nama: '', hubungan: 'Anak', tempat_lahir: '', tanggal_lahir: '', pendidikan: '', pekerjaan: '' });
        setIsFormOpen(true);
    };

    const openEditForm = (anggota: AnggotaKeluarga) => {
        setEditingId(anggota.id);

        reset({
            nik: anggota.nik,
            nama: anggota.nama,
            hubungan: anggota.hubungan,
            tempat_lahir: anggota.tempat_lahir || '',
            tanggal_lahir: dateUtils.toInput(anggota.tanggal_lahir),
            pendidikan: anggota.pendidikan || '',
            pekerjaan: anggota.pekerjaan || ''
        });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        reset();
    };

    const onSubmit = async (data: AnggotaFormData) => {
        try {
            const submitData = { ...data };
            if (submitData.tanggal_lahir && submitData.tanggal_lahir.split('-')[0].length === 4) {
                const [y, m, d] = submitData.tanggal_lahir.split('-');
                submitData.tanggal_lahir = `${d}-${m}-${y}`;
            }

            if (editingId) {
                await anggotaKeluargaService.update(editingId, submitData);
            } else {
                await anggotaKeluargaService.create({
                    ...submitData,
                    tenant_id: tenantId,
                    warga_id: wargaId
                });
            }
            closeForm();
            loadData();
        } catch (error) {
            console.error("Gagal menyimpan anggota keluarga:", error);
            alert("Terjadi kesalahan saat menyimpan data.");
        }
    };

    const handleDelete = async (id: string, nama: string) => {
        if (window.confirm(`Hapus data ${nama} dari daftar keluarga?`)) {
            await anggotaKeluargaService.delete(id);
            loadData();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full"></div>
                    <Text.H2 className="!text-sm">Anggota Keluarga / Tanggungan</Text.H2>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={openCreateForm}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                        <Plus weight="bold" />
                        <Text.Label className="!text-brand-700">Tambah Data</Text.Label>
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border border-brand-100 shadow-xl shadow-brand-900/5 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-10 gap-x-6 gap-y-4">
                            <div className="col-span-2 lg:col-span-3">
                                <Text.Label className="mb-1">NIK <span className="text-red-500">*</span></Text.Label>
                                <input
                                    type="text"
                                    {...register('nik', { required: 'Wajib diisi', pattern: /^[0-9]{16}$/ })}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                    placeholder="16 Digit NIK"
                                />
                            </div>
                            <div className="col-span-2 lg:col-span-10">
                                <Text.Label className="mb-1">Nama Lengkap <span className="text-red-500">*</span></Text.Label>
                                <input
                                    type="text"
                                    {...register('nama', { required: 'Wajib diisi' })}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                    placeholder="Sesuai KTP / Akta"
                                />
                            </div>

                            <div className="col-span-2 lg:col-span-5">
                                <Text.Label className="mb-1">Status Hubungan <span className="text-red-500">*</span></Text.Label>
                                <select
                                    {...register('hubungan', { required: true })}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                >
                                    <option value="Suami">Suami</option>
                                    <option value="Istri">Istri</option>
                                    <option value="Anak">Anak</option>
                                    <option value="Orang Tua">Orang Tua</option>
                                    <option value="Mertua">Mertua</option>
                                    <option value="Menantu">Menantu</option>
                                    <option value="Cucu">Cucu</option>
                                    <option value="Famili Lain">Famili Lain</option>
                                </select>
                            </div>
                            <div className="col-span-2 lg:col-span-5">
                                <Text.Label className="mb-1">Tempat Lahir</Text.Label>
                                <input
                                    type="text"
                                    {...register('tempat_lahir')}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                    placeholder="Kota / Kabupaten"
                                />
                            </div>

                            <div className="col-span-2 lg:col-span-5">
                                <Text.Label className="mb-1">Tanggal Lahir</Text.Label>
                                <input
                                    type="date"
                                    {...register('tanggal_lahir')}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                />
                            </div>
                            <div className="col-span-2 lg:col-span-5">
                                <Text.Label className="mb-1">Pendidikan</Text.Label>
                                <select
                                    {...register('pendidikan')}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                >
                                    <option value="">-- Pilih --</option>
                                    <option value="Tidak/Belum Sekolah">Tidak/Belum Sekolah</option>
                                    <option value="SD/Sederajat">SD/Sederajat</option>
                                    <option value="SMP/Sederajat">SMP/Sederajat</option>
                                    <option value="SMA/Sederajat">SMA/Sederajat</option>
                                    <option value="D1-D3">Diploma (D1-D3)</option>
                                    <option value="S1/D4">Sarjana (S1/D4)</option>
                                    <option value="S2/S3">Pascasarjana (S2/S3)</option>
                                </select>
                            </div>

                            <div className="col-span-2 lg:col-span-10">
                                <Text.Label className="mb-1">Pekerjaan</Text.Label>
                                <input
                                    type="text"
                                    {...register('pekerjaan')}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                    placeholder="Contoh: Pegawai Swasta, Wiraswasta"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="px-5 py-2 hover:bg-slate-50 text-slate-600 rounded-lg transition-all"
                            >
                                <Text.Label className="!text-inherit">Batal</Text.Label>
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-all shadow-md shadow-brand-600/20"
                            >
                                <FloppyDisk weight="bold" />
                                <Text.Label className="!text-white">Simpan Data</Text.Label>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isFormOpen && (
                <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500 text-xs font-medium">Memuat data...</div>
                    ) : anggotaList.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs font-medium flex flex-col items-center gap-2">
                            <Users size={32} weight="duotone" className="opacity-20" />
                            <Text.Body>Belum ada tanggungan keluarga yang tercatat.</Text.Body>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-4 w-12 text-center"><Text.Label>No</Text.Label></th>
                                        <th className="p-4"><Text.Label>Identitas & Hubungan</Text.Label></th>
                                        <th className="p-4"><Text.Label>Tempat, Tgl Lahir</Text.Label></th>
                                        <th className="p-4"><Text.Label>Pendidikan & Pekerjaan</Text.Label></th>
                                        <th className="p-4 text-right"><Text.Label>Aksi</Text.Label></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {anggotaList.map((anggota, index) => (
                                        <tr key={anggota.id} className="hover:bg-brand-50/20 transition-colors group">
                                            <td className="p-4 text-center">
                                                <Text.Caption className="!font-bold !text-xs">{(index + 1).toString().padStart(2, '0')}</Text.Caption>
                                            </td>
                                            <td className="p-4">
                                                <Text.Body className="!font-bold !text-slate-900 uppercase">{anggota.nama}</Text.Body>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Text.Caption component="span" className="!text-[10px] bg-slate-100 !text-slate-500 px-1.5 py-0.5 rounded font-mono">{anggota.nik}</Text.Caption>
                                                    <Text.Label className={`!px-2 !py-0.5 rounded-full ${anggota.hubungan === 'Istri' || anggota.hubungan === 'Suami' ? '!bg-rose-50 !text-rose-600' :
                                                            anggota.hubungan === 'Anak' ? '!bg-blue-50 !text-blue-600' : '!bg-slate-100 !text-slate-600'
                                                        }`}>
                                                        {anggota.hubungan}
                                                    </Text.Label>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Text.Body className="!text-xs !font-medium !text-slate-700">{anggota.tempat_lahir || '-'}</Text.Body>
                                                <Text.Caption className="mt-0.5">{dateUtils.toDisplay(anggota.tanggal_lahir)}</Text.Caption>
                                            </td>
                                            <td className="p-4">
                                                <Text.Body className="!text-xs !font-bold !text-slate-700">{anggota.pendidikan || '-'}</Text.Body>
                                                <Text.Caption className="!text-xs mt-0.5">{anggota.pekerjaan || '-'}</Text.Caption>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openEditForm(anggota)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Data">
                                                        <PencilSimple weight="bold" size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(anggota.id, anggota.nama)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Data">
                                                        <Trash weight="bold" size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
