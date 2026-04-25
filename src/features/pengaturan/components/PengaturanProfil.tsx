import { useFormContext } from 'react-hook-form';
import { Text } from '../../../components/ui/Typography';
import { Palette, CheckCircle } from '@phosphor-icons/react';
import { PengaturanFormData } from '../types';

interface PengaturanProfilProps {
    currentScope: string;
    handleSyncProfile: () => void;
    jabatanOptions: string[];
    periodeOptions: string[];
    allPengurus: any[];
    newJabatan: string;
    setNewJabatan: (v: string) => void;
    newPeriode: string;
    setNewPeriode: (v: string) => void;
    addCategory: (type: 'jabatan' | 'periode') => void;
    removeCategory: (type: 'jabatan' | 'periode', val: string) => void;
    jabatanSaving: boolean;
    periodeSaving: boolean;
}

export default function PengaturanProfil({
    currentScope,
    handleSyncProfile,
    jabatanOptions,
    periodeOptions,
    allPengurus,
    newJabatan,
    setNewJabatan,
    newPeriode,
    setNewPeriode,
    addCategory,
    removeCategory,
    jabatanSaving,
    periodeSaving
}: PengaturanProfilProps) {
    const { register, watch, reset, formState: { errors } } = useFormContext<PengaturanFormData>();

    return (
        <div className="p-6 md:p-8 animate-fade-in">
            <div className="grid grid-cols-1 gap-8">
                <div className="md:col-span-2 flex justify-between items-end gap-4">
                    <div className="flex-1">
                        <Text.Body className="!font-bold mb-1">Nama Wilayah / Institusi ({currentScope})</Text.Body>
                        <input type="text" {...register('nama_wilayah', { required: 'Wajib diisi' })} className="w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none" />
                        {errors.nama_wilayah && <Text.Caption className="!text-red-500 mt-1">{errors.nama_wilayah.message}</Text.Caption>}
                    </div>
                    <button
                        type="button"
                        onClick={handleSyncProfile}
                        className="mb-[2px] flex items-center gap-2 px-4 py-3 bg-brand-50 text-brand-700 rounded-xl text-xs font-bold hover:bg-brand-100 transition-all border border-brand-200/50 whitespace-nowrap"
                    >
                        <CheckCircle weight="bold" />
                        Sinkron dari Onboarding
                    </button>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Sekretariat Lengkap</label>
                    <textarea rows={2} {...register('alamat_sekretariat')} className="w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Sambutan Utama</label>
                    <input type="text" {...register('pesan_sambutan')} className="w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-8">
                <div className="flex items-center gap-2 mb-4">
                    <Palette weight="fill" className="text-brand-500 w-5 h-5" />
                    <label className="block text-sm font-bold text-gray-900 tracking-normal">Aksen Warna Tema Sistem</label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-200/50">
                    <div>
                        <Text.Body className="!text-sm !text-gray-600 mb-4">Pilih warna primer yang mewakili identitas wilayah <Text.Label component="span" className="!text-brand-700">{currentScope}</Text.Label>.</Text.Body>
                        <div className="flex flex-wrap gap-3">
                            {['blue', 'rose', 'indigo', 'amber', 'sky', 'slate'].map((color) => {
                                const colorMap: Record<string, string> = {
                                    blue: 'bg-brand-500',
                                    rose: 'bg-rose-500',
                                    indigo: 'bg-indigo-500',
                                    amber: 'bg-amber-500',
                                    sky: 'bg-sky-500',
                                    slate: 'bg-slate-700'
                                };
                                const activeColor = watch('warna_tema');
                                return (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => reset({ ...watch(), warna_tema: color })}
                                        className={`w-10 h-10 rounded-full ${colorMap[color]} transition-all flex items-center justify-center hover:scale-110 shadow-sm ${activeColor === color || (color === 'blue' && (activeColor === 'emerald' || !activeColor)) ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : ''}`}
                                    >
                                        {activeColor === color && <CheckCircle weight="bold" className="text-white w-6 h-6" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs`}>A</div>
                            <div className="flex-1">
                                <div className="h-2 w-24 bg-gray-100 rounded mb-1"></div>
                                <div className="h-1.5 w-16 bg-gray-50 rounded"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="h-2 w-16 bg-brand-200 rounded"></div>
                                <div className="h-4 w-8 bg-brand-500 rounded-full"></div>
                            </div>
                            <div className="h-8 w-full bg-brand-600 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                {/* JABATAN */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-bold text-gray-900 tracking-normal">Daftar Jabatan {currentScope}</label>
                        {jabatanSaving && <Text.Label className="!text-brand-500 !animate-pulse !normal-case !tracking-normal">● Menyimpan...</Text.Label>}
                        {!jabatanSaving && jabatanOptions.length > 0 && <Text.Label className="!text-brand-600 !normal-case !tracking-normal">✓ Tersimpan</Text.Label>}
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newJabatan}
                            onChange={e => setNewJabatan(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory('jabatan'))}
                            className="flex-1 rounded-lg shadow-sm p-2 border focus:border-brand-500 outline-none text-sm"
                            placeholder="Contoh: Koordinator"
                        />
                        <button type="button" onClick={() => addCategory('jabatan')} className="px-3 bg-brand-100 text-brand-700 hover:bg-brand-200 rounded-lg text-sm font-medium transition-colors">Tambah</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {jabatanOptions.length === 0 && <Text.Caption className="!italic">Belum Ada Jabatan. Tambahkan Di Atas.</Text.Caption>}
                        {jabatanOptions.map(jab => {
                            const usageCount = allPengurus.filter(p => p.jabatan === jab && p.status === 'aktif').length;
                            return (
                                <Text.Label key={jab} className={`!inline-flex !items-center !gap-1.5 !px-3 !py-1 !rounded-md !border !shadow-sm !normal-case !tracking-normal ${usageCount > 0 ? '!bg-brand-50 !text-brand-700 !border-brand-200' : '!bg-white !text-gray-700 !border-gray-200'}`}>
                                    {jab}
                                    {usageCount > 0 && <Text.Label component="span" className="!ml-1 !bg-brand-200 !text-brand-800 !rounded-full !px-1.5">{usageCount}</Text.Label>}
                                    <button type="button" onClick={() => removeCategory('jabatan', jab)} className="w-4 h-4 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center font-bold text-[10px] transition-colors">&times;</button>
                                </Text.Label>
                            );
                        })}
                    </div>
                </div>

                {/* PERIODE */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <label className="block text-sm font-bold text-gray-900 tracking-normal">Periode ({currentScope})</label>
                        {periodeSaving && <Text.Label className="!text-brand-500 !animate-pulse !normal-case !tracking-normal">● Menyimpan...</Text.Label>}
                        {!periodeSaving && periodeOptions.length > 0 && <Text.Label className="!text-brand-600 !normal-case !tracking-normal">✓ Tersimpan</Text.Label>}
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newPeriode}
                            onChange={e => setNewPeriode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory('periode'))}
                            className="flex-1 rounded-lg shadow-sm p-2 border focus:border-brand-500 outline-none text-sm"
                            placeholder="Contoh: 2024 - 2027"
                        />
                        <button type="button" onClick={() => addCategory('periode')} className="px-3 bg-brand-100 text-brand-700 hover:bg-brand-200 rounded-lg text-sm font-medium transition-colors">Tambah</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {periodeOptions.length === 0 && <Text.Caption className="!italic">Belum Ada Periode. Tambahkan Di Atas.</Text.Caption>}
                        {periodeOptions.map(per => {
                            const total = allPengurus.filter(p => p.periode === per).length;
                            const aktif = allPengurus.filter(p => p.periode === per && p.status === 'aktif').length;
                            return (
                                <Text.Label key={per} className={`!inline-flex !items-center !gap-1.5 !px-3 !py-1 !rounded-md !border !shadow-sm !normal-case !tracking-normal ${aktif > 0 ? '!bg-brand-50 !text-brand-700 !border-brand-200' : total > 0 ? '!bg-gray-50 !text-gray-600 !border-gray-200' : '!bg-white !text-gray-700 !border-gray-200'}`}>
                                    {per}
                                    {total > 0 && <Text.Label component="span" className={`!ml-1 !rounded-full !px-1.5 ${aktif > 0 ? '!bg-brand-200 !text-brand-800' : '!bg-gray-200 !text-gray-600'}`}>{aktif > 0 ? `${aktif} Aktif` : `${total} Riwayat`}</Text.Label>}
                                    <button type="button" onClick={() => removeCategory('periode', per)} className="w-4 h-4 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center font-bold text-[10px] transition-colors">&times;</button>
                                </Text.Label>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
