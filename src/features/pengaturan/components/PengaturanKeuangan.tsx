
import { useFormContext, Controller } from 'react-hook-form';
import { Text } from '../../../components/ui/Typography';
import { Money, Plus, Trash, X } from '@phosphor-icons/react';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { PengaturanFormData, JenisPemasukan } from '../types';

interface PengaturanKeuanganProps {
    newPemasukan: string;
    setNewPemasukan: (v: string) => void;
    newPemasukanType: 'BULANAN' | 'INSIDENTIL';
    setNewPemasukanType: (v: 'BULANAN' | 'INSIDENTIL') => void;
    newPemasukanNominal: number;
    setNewPemasukanNominal: (v: number) => void;
    newPemasukanMandatory: boolean;
    setNewPemasukanMandatory: (v: boolean) => void;
    jenisPemasukan: JenisPemasukan[];
    
    newPengeluaran: string;
    setNewPengeluaran: (v: string) => void;
    pengeluaranCategories: string[];
    
    newTahun: string;
    setNewTahun: (v: string) => void;
    tahunIuran: number[];
    
    addCategory: (type: 'masuk' | 'keluar' | 'tahun') => void;
    removeCategory: (type: 'masuk' | 'keluar' | 'tahun', val: string | number) => void;
}

export default function PengaturanKeuangan({
    newPemasukan, setNewPemasukan,
    newPemasukanType, setNewPemasukanType,
    newPemasukanNominal, setNewPemasukanNominal,
    newPemasukanMandatory, setNewPemasukanMandatory,
    jenisPemasukan,
    newPengeluaran, setNewPengeluaran, pengeluaranCategories,
    newTahun, setNewTahun, tahunIuran,
    addCategory, removeCategory
}: PengaturanKeuanganProps) {
    const { register, control, watch } = useFormContext<PengaturanFormData>();
    const dendaRondaAktif = watch('denda_ronda_aktif');

    return (
        <div className="p-6 md:p-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Money weight="fill" className="text-brand-600 w-5 h-5" />
                            <h3 className="text-sm font-bold text-gray-900 tracking-normal">Jenis Pemasukan (Database Driven)</h3>
                        </div>
                        <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-7 shadow-sm space-y-7">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Nama Item Iuran / Pemasukan</label>
                                    <input
                                        type="text"
                                        value={newPemasukan}
                                        onChange={(e) => setNewPemasukan(e.target.value)}
                                        placeholder="Contoh: Iuran Sampah, Agenda Jalan Sehat"
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Tipe</label>
                                    <select 
                                        value={newPemasukanType}
                                        onChange={(e) => setNewPemasukanType(e.target.value as any)}
                                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white transition-all shadow-sm"
                                    >
                                        <option value="BULANAN">Bulanan (Rutin)</option>
                                        <option value="INSIDENTIL">Insidentil (Acara)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Nominal (Jika Flat)</label>
                                    <CurrencyInput 
                                        value={newPemasukanNominal}
                                        onChange={(val) => setNewPemasukanNominal(val)}
                                        className="bg-white p-3 border-gray-200 rounded-xl"
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center justify-between bg-white/50 p-3 rounded-xl border border-dashed border-gray-200">
                                    <div>
                                        <p className="text-xs font-bold text-gray-700">Wajib bagi semua warga?</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">Jika aktif, akan masuk ke perhitungan Target Statistik.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={newPemasukanMandatory}
                                            onChange={(e) => setNewPemasukanMandatory(e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => addCategory('masuk')}
                                    className="md:col-span-2 w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 font-bold text-sm"
                                >
                                    <Plus weight="bold" className="w-4 h-4" />
                                    Tambah Jenis Pemasukan
                                </button>
                                
                                <div className="md:col-span-2 space-y-4 pt-6 border-t border-gray-100">
                                    {jenisPemasukan.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between bg-white border border-gray-200 p-5 rounded-2xl shadow-sm hover:border-brand-200 hover:shadow-md transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${item.tipe === 'BULANAN' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    <Money weight="fill" className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Text.Body className="!font-bold !text-gray-900">{item.nama}</Text.Body>
                                                        {item.is_mandatory && <Text.Label className="!px-2.5 !py-1 !bg-brand-50 !text-brand-600 !rounded-full !border !border-brand-100 uppercase tracking-normal">Wajib</Text.Label>}
                                                    </div>
                                                    <Text.Caption className="!font-medium">
                                                        {item.tipe} • Rp {item.nominal.toLocaleString('id-ID')}
                                                    </Text.Caption>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCategory('masuk', item.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                            >
                                                <Trash weight="bold" className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {jenisPemasukan.length === 0 && (
                                        <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                                            <Text.Caption className="!font-medium !italic">Belum Ada Jenis Pemasukan Terkonfigurasi.</Text.Caption>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Money weight="fill" className="text-brand-500 w-5 h-5" />
                                <Text.H2 className="!font-bold">Kategori Pengeluaran</Text.H2>
                            </div>
                            <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-7 shadow-sm space-y-5">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newPengeluaran}
                                        onChange={(e) => setNewPengeluaran(e.target.value)}
                                        placeholder="Contoh: Perbaikan Jalan"
                                        className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white transition-all shadow-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory('keluar'))}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addCategory('keluar')}
                                        className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95"
                                    >
                                        <Plus weight="bold" className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2.5 min-h-[44px]">
                                    {pengeluaranCategories.map((cat, i) => (
                                        <Text.Label key={i} className={`flex items-center gap-2 px-4 py-1.5 !bg-brand-50 !text-brand-700 !rounded-full !border !border-brand-100 group hover:!bg-brand-100 transition-all !normal-case !tracking-normal`}>
                                            {cat}
                                            <button
                                                type="button"
                                                onClick={() => removeCategory('keluar', cat)}
                                                className="text-brand-400 hover:text-red-500 transition-colors"
                                            >
                                                <X weight="bold" className="w-3 h-3" />
                                            </button>
                                        </Text.Label>
                                    ))}
                                    {pengeluaranCategories.length === 0 && <Text.Caption className="!italic">Belum Ada Kategori Pengeluaran</Text.Caption>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                            <Text.H2 className="!font-bold">Aturan Iuran Berdasarkan Status Hunian</Text.H2>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Text.Label className="!text-gray-400 mb-2 uppercase block">Status Rumah Berpenghuni</Text.Label>
                                    <Controller
                                        name="iuran_tetap_dihuni"
                                        control={control}
                                        render={({ field }) => (
                                            <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                        )}
                                    />
                                </div>
                                <div>
                                    <Text.Label className="!text-gray-400 mb-2 uppercase block">Status Rumah Kosong / Lahan</Text.Label>
                                    <Controller
                                        name="iuran_tetap_kosong"
                                        control={control}
                                        render={({ field }) => (
                                            <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                        )}
                                    />
                                </div>
                                <div>
                                    <Text.Label className="!text-gray-400 mb-2 uppercase block">Kontrak - Dihuni</Text.Label>
                                    <Controller
                                        name="iuran_kontrak_dihuni"
                                        control={control}
                                        render={({ field }) => (
                                            <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                        )}
                                    />
                                </div>
                                <div>
                                    <Text.Label className="!text-gray-400 mb-2 uppercase block">Kontrak - Kosong</Text.Label>
                                    <Controller
                                        name="iuran_kontrak_kosong"
                                        control={control}
                                        render={({ field }) => (
                                            <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <Text.Label className="!text-gray-700 mb-3 block">Opsi Tahun Pembayaran</Text.Label>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="number"
                                        value={newTahun}
                                        onChange={e => setNewTahun(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory('tahun'))}
                                        className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm"
                                        placeholder="2026"
                                    />
                                    <button type="button" onClick={() => addCategory('tahun')} className="p-3 bg-brand-100 text-brand-700 rounded-xl hover:bg-brand-200 transition-all font-bold text-xs shadow-sm">Tambah</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tahunIuran.map(tahun => (
                                        <Text.Label key={tahun} className="!flex !items-center !gap-2 !px-3 !py-1.5 !bg-brand-50 !text-brand-700 !rounded-full !border !border-brand-200 !normal-case !tracking-normal">
                                            {tahun}
                                            <button type="button" onClick={() => removeCategory('tahun', tahun)} className="text-brand-300 hover:text-red-500 transition-colors">&times;</button>
                                        </Text.Label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white rounded-2xl p-7 space-y-5 shadow-xl shadow-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <Text.H2 className="!text-white !font-bold">Sistem Denda Ronda</Text.H2>
                                <Text.Caption className="!text-slate-400 mt-1">Terapkan Denda Otomatis Bagi Yang Tidak Hadir.</Text.Caption>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" {...register('denda_ronda_aktif')} className="sr-only peer" />
                                <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                            </label>
                        </div>

                        {dendaRondaAktif && (
                            <div className="animate-fade-in pt-4 border-t border-slate-700">
                                <Text.Label className="!text-slate-400 mb-2 uppercase block">Nominal Denda Per Ketidakhadiran</Text.Label>
                                <Controller
                                    name="denda_ronda_nominal"
                                    control={control}
                                    render={({ field }) => (
                                        <CurrencyInput {...field} className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-xl p-4 focus:ring-brand-500" />
                                    )}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
