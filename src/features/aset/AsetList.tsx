import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { asetService } from '../../services/asetService';
import { wargaService } from '../../services/wargaService';
import { Aset, Warga } from '../../database/db';
import { Plus, PencilSimple, Trash, Package, Handshake, ArrowUUpLeft, Image as ImageIcon, X, CircleNotch } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { formatRupiah } from '../../utils/currency';
import { dateUtils } from '../../utils/date';
import { useHybridData } from '../../hooks/useHybridData';

export default function AsetList() {
    const { currentTenant, currentScope } = useTenant();
    const navigate = useNavigate();


    const { 
        mergedData: asetItems, 
        isFetching: isAsetLoading, 
        refresh: loadAset 
    } = useHybridData<Aset[]>({
        fetcher: () => asetService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });


    const { 
        mergedData: wargaServerData, 
        isFetching: isWargaLoading 
    } = useHybridData<{ items: Warga[] }>({
        fetcher: () => wargaService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });

    const asetList = asetItems || [];
    const wargaList = wargaServerData?.items || [];
    const isLoading = isAsetLoading || isWargaLoading;

    // ... handle other states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCondition, setFilterCondition] = useState<string>('');
    const [borrowModalOpen, setBorrowModalOpen] = useState(false);
    const [selectedAset, setSelectedAset] = useState<Aset | null>(null);
    const [selectedWargaId, setSelectedWargaId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = (import.meta as any).env.VITE_API_URL || '/api';
    const IMAGE_BASE_URL = API_URL.replace('/api', '');

    const loadData = () => {
        loadAset();
    };

    const handleDelete = async (id: string, namaBarang: string) => {
        if (window.confirm(`Hapus data aset ${namaBarang}?`)) {
            await asetService.delete(id);
            loadData();
        }
    };

    const handleBorrowClick = (aset: Aset) => {
        setSelectedAset(aset);
        setSelectedWargaId('');
        setBorrowModalOpen(true);
    };

    const submitBorrow = async () => {
        if (!selectedAset || !selectedWargaId) return;
        setIsSubmitting(true);
        try {
            await asetService.update(selectedAset.id, {
                status_pinjam: 'dipinjam',
                peminjam_id: selectedWargaId,
                tanggal_pinjam: new Date().toISOString(),
                kondisi: selectedAset.kondisi // Enforce current condition
            });
            setBorrowModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Failed to borrow aset:", error);
            alert("Gagal memproses peminjaman.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReturn = async (aset: Aset) => {
        if (window.confirm(`Konfirmasi pengembalian aset: ${aset.nama_barang}?`)) {
            try {
                await asetService.update(aset.id, {
                    status_pinjam: 'tersedia',
                    peminjam_id: null as any,
                    tanggal_pinjam: null as any,
                    kondisi: aset.kondisi // Enforce current condition
                });
                loadData();
            } catch (error) {
                console.error("Failed to return aset:", error);
                alert("Gagal memproses pengembalian.");
            }
        }
    };

    const filteredAset = asetList.filter(a => {
        const matchesSearch = a.nama_barang.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCondition = filterCondition === '' || a.kondisi === filterCondition;
        return matchesSearch && matchesCondition;
    });

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">Inventaris Aset</h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 tracking-tight">Kelola barang inventaris untuk scope <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span></p>
                </div>
                <HasPermission module="Aset" action="Buat">
                    <button
                        onClick={() => navigate('/aset/new')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[14px] font-normal transition-all shadow-sm hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Tambah Aset</span>
                    </button>
                </HasPermission>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <input
                            type="text"
                            placeholder="Cari nama barang..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                        />
                    </div>
                    <select
                        value={filterCondition}
                        onChange={e => setFilterCondition(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[14px] font-normal transition-colors outline-none focus:ring-2 focus:ring-brand-500"
                    >
                        <option value="">Semua Kondisi</option>
                        <option value="baik">Baik</option>
                        <option value="rusak_ringan">Rusak Ringan</option>
                        <option value="rusak_berat">Rusak Berat</option>
                    </select>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[14px] font-bold tracking-tight border-b border-slate-200">
                                <th className="p-4 font-semibold w-1/3 text-slate-500">Informasi Barang</th>
                                <th className="p-4 font-semibold w-1/4 text-slate-500">Pembelian</th>
                                <th className="p-4 font-semibold w-1/4 text-slate-500">Status Pinjam</th>
                                <th className="p-4 font-semibold text-slate-500 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!(asetItems && wargaServerData) && isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredAset.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Package className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p>Belum ada inventaris yang tercatat di scope ini.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAset.map((aset) => (
                                    <tr key={aset.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                    {aset.foto_barang ? (
                                                        <img src={`${IMAGE_BASE_URL}${aset.foto_barang}`} alt={aset.nama_barang} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-tight mb-1 text-[14px]">{aset.nama_barang}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-tight 
                                                            ${aset.kondisi === 'baik' ? 'bg-brand-50 text-brand-700 border border-brand-200' :
                                                                aset.kondisi === 'rusak_ringan' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                aset.kondisi === 'rusak_berat' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                'bg-slate-50 text-slate-700 border border-slate-200'}
                                                        `}>
                                                            {aset.kondisi === 'baik' ? 'Baik' :
                                                                aset.kondisi === 'rusak_ringan' ? 'Rusak Ringan' :
                                                                aset.kondisi === 'rusak_berat' ? 'Rusak Berat' :
                                                                (aset.kondisi || 'Baik')}
                                                        </span>
                                                        <span className="text-[12px] font-semibold text-slate-500">• {aset.jumlah} Unit</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="space-y-1 text-[14px]">
                                                <p className="text-slate-800 font-bold">{aset.harga_beli ? formatRupiah(aset.harga_beli) : '-'}</p>
                                                <p className="text-slate-500 text-[12px]">{aset.tanggal_beli ? dateUtils.toDisplay(aset.tanggal_beli) : '-'}</p>
                                                {aset.vendor && <p className="text-slate-500 text-[12px] truncate max-w-[150px]" title={aset.vendor}>Toko: {aset.vendor}</p>}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            {aset.status_pinjam === 'dipinjam' ? (
                                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 w-fit">
                                                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-xs mb-1">
                                                        <Handshake className="w-4 h-4" /> Dipinjam Oleh
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{aset.peminjam?.nama || 'Warga (ID: ' + aset.peminjam_id + ')'}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium mt-1">{aset.tanggal_pinjam ? dateUtils.toDisplay(aset.tanggal_pinjam) : ''}</p>
                                                </div>
                                            ) : (
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg py-1.5 px-3 w-fit">
                                                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                                                        <Package className="w-4 h-4" /> Tersedia
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right align-top">
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex gap-2">
                                                    {aset.status_pinjam === 'tersedia' ? (
                                                        <HasPermission module="Aset" action="Ubah">
                                                            <button
                                                                onClick={() => handleBorrowClick(aset)}
                                                                className="flex items-center gap-1 bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                                <Handshake weight="bold" /> Pinjamkan
                                                            </button>
                                                        </HasPermission>
                                                    ) : (
                                                        <HasPermission module="Aset" action="Ubah">
                                                            <button
                                                                onClick={() => handleReturn(aset)}
                                                                className="flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                                <ArrowUUpLeft weight="bold" /> Kembalikan
                                                            </button>
                                                        </HasPermission>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                                    <HasPermission module="Aset" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/aset/edit/${aset.id}`)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100" title="Edit">
                                                            <PencilSimple weight="duotone" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Aset" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(aset.id, aset.nama_barang)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100" title="Hapus">
                                                            <Trash weight="duotone" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE VIEW: CARD GRID */}
                <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
                    {!(asetItems && wargaServerData) && isLoading ? (
                        <div className="py-20 text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                            <CircleNotch size={32} className="animate-spin text-brand-500" />
                            <span>Sinkronisasi...</span>
                        </div>
                    ) : filteredAset.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <Package weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">Belum Ada Aset</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Inventaris anda akan muncul di sini</p>
                            </div>
                        </div>
                    ) : (
                        filteredAset.map((aset) => (
                            <div key={aset.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                <div className="p-4">
                                    <div className="flex gap-4 mb-4">
                                        <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner">
                                            {aset.foto_barang ? (
                                                <img src={`${IMAGE_BASE_URL}${aset.foto_barang}`} alt={aset.nama_barang} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-8 h-8 text-slate-200" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-slate-900 text-[15px] capitalize tracking-tight leading-tight truncate pr-2">{aset.nama_barang}</h3>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-tight border whitespace-nowrap
                                                    ${aset.kondisi === 'baik' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        aset.kondisi === 'rusak_ringan' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        aset.kondisi === 'rusak_berat' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                        'bg-slate-50 text-slate-700 border-slate-100'}
                                                `}>
                                                    {aset.kondisi === 'baik' ? 'Baik' :
                                                        aset.kondisi === 'rusak_ringan' ? 'Rusak Ringan' :
                                                        aset.kondisi === 'rusak_berat' ? 'Rusak Berat' :
                                                        (aset.kondisi || 'Baik')}
                                                </span>
                                            </div>
                                            <p className="text-[11px] font-semibold text-slate-500 mt-1 tracking-tight flex items-center gap-1.5">
                                                <Package weight="fill" className="text-slate-300 w-3.5 h-3.5" />
                                                Stok: {aset.jumlah} Unit
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                <span className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md border border-slate-100 font-bold tracking-tight">
                                                    {aset.harga_beli ? formatRupiah(aset.harga_beli) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Quick Action */}
                                    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 mb-4">
                                        {aset.status_pinjam === 'dipinjam' ? (
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] tracking-tight mb-1">
                                                        <Handshake weight="fill" className="w-3.5 h-3.5" /> SEDANG DIPINJAM
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-900 truncate">{aset.peminjam?.nama || (aset.peminjam_id ? 'Warga ID: ' + aset.peminjam_id : 'Unknown')}</p>
                                                    <p className="text-[9px] text-slate-400 font-medium mt-0.5 italic">{aset.tanggal_pinjam ? dateUtils.toDisplay(aset.tanggal_pinjam) : ''}</p>
                                                </div>
                                                <HasPermission module="Aset" action="Ubah">
                                                    <button
                                                        onClick={() => handleReturn(aset)}
                                                        className="flex items-center justify-center gap-1.5 bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
                                                    >
                                                        <ArrowUUpLeft weight="bold" /> Kembali
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[11px] font-bold text-emerald-600 tracking-tight uppercase">Tersedia Untuk Pinjam</span>
                                                </div>
                                                <HasPermission module="Aset" action="Ubah">
                                                    <button
                                                        onClick={() => handleBorrowClick(aset)}
                                                        className="flex items-center justify-center gap-1.5 bg-brand-600 text-white shadow-md hover:bg-brand-700 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
                                                    >
                                                        <Handshake weight="bold" /> Pinjamkan
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                        <span className="text-[10px] font-medium text-slate-400 tracking-tight italic">
                                            Dibeli: {aset.tanggal_beli ? dateUtils.toDisplay(aset.tanggal_beli) : '-'}
                                        </span>
                                        <div className="flex gap-2">
                                            <HasPermission module="Aset" action="Ubah">
                                                <button
                                                    onClick={() => navigate(`/aset/edit/${aset.id}`)}
                                                    className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all shadow-sm border border-brand-100/50" title="Edit">
                                                    <PencilSimple weight="bold" className="w-4 h-4" />
                                                </button>
                                            </HasPermission>
                                            <HasPermission module="Aset" action="Hapus">
                                                <button
                                                    onClick={() => handleDelete(aset.id, aset.nama_barang)}
                                                    className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-transparent shadow-sm" title="Hapus">
                                                    <Trash weight="bold" className="w-4 h-4" />
                                                </button>
                                            </HasPermission>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {!isLoading && filteredAset.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500 flex justify-between items-center">
                        <span>Menampilkan {filteredAset.length} barang di inventaris</span>
                    </div>
                )}
            </div>

            {/* Modal Peminjaman */}
            {borrowModalOpen && selectedAset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Pinjamkan Aset</h3>
                                <p className="text-xs text-gray-500 font-medium">Form Peminjaman Inventaris</p>
                            </div>
                            <button onClick={() => setBorrowModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-5">
                            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-brand-100 flex items-center justify-center flex-shrink-0">
                                    <Package weight="duotone" className="w-6 h-6 text-brand-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-brand-600 tracking-tight mb-0.5">Barang dipinjam</p>
                                    <p className="font-bold text-gray-900 leading-tight">{selectedAset.nama_barang}</p>
                                    <p className="text-xs text-gray-500 font-medium">Stok total: {selectedAset.jumlah} unit</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    Pilih Warga Peminjam <span className="text-red-500">*</span>
                                </label>
                                <select
                                    className="w-full rounded-xl shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    value={selectedWargaId}
                                    onChange={(e) => setSelectedWargaId(e.target.value)}
                                >
                                    <option value="" disabled>-- Pilih nama warga peminjam --</option>
                                    {wargaList.map(w => (
                                        <option key={w.id} value={w.id}>{w.nama} {w.alamat ? `- ${w.alamat}` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => setBorrowModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={submitBorrow}
                                    disabled={!selectedWargaId || isSubmitting}
                                    className={`px-6 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 font-medium transition-all ${!selectedWargaId || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-700 hover-lift active-press shadow-sm hover:shadow-md'}`}
                                >
                                    <Handshake weight="bold" />
                                    <span>{isSubmitting ? 'Memproses...' : 'Pinjamkan Sekarang'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
