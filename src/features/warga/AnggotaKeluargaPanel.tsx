import { useState, useEffect } from 'react';
import { AnggotaKeluarga } from '../../database/db';
import { anggotaKeluargaService } from '../../services/anggotaKeluargaService';
import { useForm } from 'react-hook-form';
import { Plus, PencilSimple, Trash, FloppyDisk, Users } from '@phosphor-icons/react';
import { dateUtils } from '../../utils/date';
import { Text } from '../../components/ui/Typography';
import { toTitleCase } from '../../utils/text';
import { useConfirm } from '../../hooks/useConfirm';

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
    const { confirm, ConfirmDialog } = useConfirm();

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
        const ok = await confirm({ title: 'Hapus Anggota Keluarga', message: `Hapus data "${nama}" dari daftar anggota keluarga?`, confirmText: 'HAPUS', variant: 'danger' });
        if (ok) {
            await anggotaKeluargaService.delete(id);
            loadData();
        }
    };

    return (
        <>
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
                        <Text.Label className="!text-brand-700 !normal-case !tracking-tight">Tambah Data</Text.Label>
                    </button>
                )}
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl border border-brand-100 shadow-xl shadow-brand-900/5 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 lg:grid-cols-10 gap-x-6 gap-y-4">
                            <div className="col-span-2 lg:col-span-3">
                                <Text.Label className="mb-1 !normal-case !tracking-tight !text-slate-600">NIK <span className="text-red-500">*</span></Text.Label>
                                <input
                                    type="text"
                                    {...register('nik', { required: 'Wajib diisi', pattern: /^[0-9]{16}$/ })}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                    placeholder="16 Digit NIK"
                                />
                            </div>
                            <div className="col-span-2 lg:col-span-10">
                                <Text.Label className="mb-1 !normal-case !tracking-tight !text-slate-600">Nama Lengkap <span className="text-red-500">*</span></Text.Label>
                                <input
                                    type="text"
                                    {...register('nama', { required: 'Wajib diisi' })}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                    placeholder="Sesuai KTP / Akta"
                                />
                            </div>

                            <div className="col-span-2 lg:col-span-5">
                                <Text.Label className="mb-1 !normal-case !tracking-tight !text-slate-600">Status Hubungan <span className="text-red-500">*</span></Text.Label>
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
                                <Text.Label className="mb-1 !normal-case !tracking-tight !text-slate-600">Tempat Lahir</Text.Label>
                                <input
                                    type="text"
                                    {...register('tempat_lahir')}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                    placeholder="Kota / Kabupaten"
                                />
                            </div>

                            <div className="col-span-2 lg:col-span-5">
                                <Text.Label className="mb-1 !normal-case !tracking-tight !text-slate-600">Tanggal Lahir</Text.Label>
                                <input
                                    type="date"
                                    {...register('tanggal_lahir')}
                                    className="w-full rounded-lg shadow-sm p-3 border border-slate-200 focus:border-brand-500 bg-slate-50 focus:bg-white text-sm outline-none transition-all"
                                />
                            </div>
                            <div className="col-span-2 lg:col-span-5">
                                <Text.Label className="mb-1 !normal-case !tracking-tight !text-slate-600">Pendidikan</Text.Label>
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
                                <Text.Label className="mb-1 !normal-case !tracking-tight !text-slate-600">Pekerjaan</Text.Label>
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
                                <Text.Label className="!text-inherit !normal-case !tracking-tight">Batal</Text.Label>
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-all shadow-md shadow-brand-600/20"
                            >
                                <FloppyDisk weight="bold" />
                                <Text.Label className="!text-white !normal-case !tracking-tight">Simpan Data</Text.Label>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!isFormOpen && (
                <div className="animate-fade-in">
                    {isLoading ? (
                        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                            <Text.Caption className="!font-bold !tracking-widest">Sinkronisasi Data...</Text.Caption>
                        </div>
                    ) : anggotaList.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center gap-4 group">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users size={32} weight="duotone" className="text-slate-200" />
                            </div>
                            <div>
                                <Text.H2 className="!text-slate-400">Belum Ada Anggota</Text.H2>
                                <Text.Caption className="mt-1">Daftar tanggungan keluarga akan muncul di sini.</Text.Caption>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 w-12 text-center"><Text.Label className="!normal-case !tracking-tight !text-slate-500">No</Text.Label></th>
                                                <th className="p-4"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Identitas & Hubungan</Text.Label></th>
                                                <th className="p-4"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Tempat, Tgl Lahir</Text.Label></th>
                                                <th className="p-4"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Pendidikan & Pekerjaan</Text.Label></th>
                                                <th className="p-4 text-right"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Aksi</Text.Label></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {anggotaList.map((anggota, index) => (
                                                <tr key={anggota.id} className="hover:bg-brand-50/20 transition-colors group">
                                                    <td className="p-4 text-center">
                                                        <Text.Caption className="!font-bold !text-xs">{(index + 1).toString().padStart(2, '0')}</Text.Caption>
                                                    </td>
                                                    <td className="p-4">
                                                        <Text.Body className="!font-bold !text-slate-900">{toTitleCase(anggota.nama)}</Text.Body>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Text.Caption component="span" className="!text-[10px] bg-slate-100 !text-slate-500 px-1.5 py-0.5 rounded font-mono !font-normal tracking-[1px]">{anggota.nik}</Text.Caption>
                                                            <Text.Label className={`!px-2 !py-0.5 rounded-full !normal-case !tracking-tight ${anggota.hubungan === 'Istri' || anggota.hubungan === 'Suami' ? '!bg-rose-50 !text-rose-600' :
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
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {anggotaList.map((anggota, index) => (
                                    <div key={anggota.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden active:bg-slate-50 transition-colors">
                                        <div className="absolute top-0 right-0 p-3 flex gap-1">
                                            <button
                                                onClick={() => openEditForm(anggota)}
                                                className="p-2 text-blue-600 bg-blue-50 rounded-lg active:scale-90 transition-transform"
                                            >
                                                <PencilSimple weight="bold" size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(anggota.id, anggota.nama)}
                                                className="p-2 text-rose-600 bg-rose-50 rounded-lg active:scale-90 transition-transform"
                                            >
                                                <Trash weight="bold" size={16} />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Text.Caption className="!font-black text-brand-600">#{(index + 1).toString().padStart(2, '0')}</Text.Caption>
                                                    <Text.Label className={`!px-2 !py-0.5 rounded-full !text-[10px] !normal-case !tracking-tight ${anggota.hubungan === 'Istri' || anggota.hubungan === 'Suami' ? '!bg-rose-50 !text-rose-600' :
                                                                anggota.hubungan === 'Anak' ? '!bg-blue-50 !text-blue-600' : '!bg-slate-100 !text-slate-600'
                                                            }`}>
                                                        {anggota.hubungan}
                                                    </Text.Label>
                                                </div>
                                                <Text.H2 className="!text-[15px] !font-bold text-slate-900">{toTitleCase(anggota.nama)}</Text.H2>
                                                <Text.Caption className="font-mono tracking-[1px] mt-0.5">{anggota.nik}</Text.Caption>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                                <div className="space-y-1">
                                                    <Text.Label className="!text-[9px] !text-slate-400 !normal-case !tracking-tight">Lahir</Text.Label>
                                                    <Text.Body className="!text-xs !font-bold !text-slate-700 leading-tight">
                                                        {anggota.tempat_lahir || '-'},<br />
                                                        {dateUtils.toDisplay(anggota.tanggal_lahir)}
                                                    </Text.Body>
                                                </div>
                                                <div className="space-y-1">
                                                    <Text.Label className="!text-[9px] !text-slate-400 !normal-case !tracking-tight">Pekerjaan</Text.Label>
                                                    <Text.Body className="!text-xs !font-bold !text-slate-700 leading-tight">
                                                        {anggota.pendidikan || '-'}<br />
                                                        <span className="!font-normal text-slate-500">{anggota.pekerjaan || '-'}</span>
                                                    </Text.Body>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
        <ConfirmDialog />
        </>
    );
}
