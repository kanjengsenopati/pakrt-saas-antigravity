import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { asetService } from '../../services/asetService';
import { wargaService } from '../../services/wargaService';
import { Aset, Warga } from '../../database/db';
import { Plus, PencilSimple, Trash, Package, Handshake, ArrowUUpLeft, Image as ImageIcon, X, CircleNotch, MagnifyingGlass } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { formatRupiah } from '../../utils/currency';
import { dateUtils } from '../../utils/date';
import { useHybridData } from '../../hooks/useHybridData';
import { Text } from '../../components/ui/Typography';

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
                    <Text.H1>Inventaris Aset</Text.H1>
                    <Text.Body>Kelola barang inventaris untuk scope <Text.Label component="span" className="!inline-flex !font-bold !text-brand-600 bg-brand-50 !px-2 !py-0.5 rounded-lg border border-brand-100">{currentScope}</Text.Label></Text.Body>
                </div>
                <HasPermission module="Aset" action="Buat">
                    <button
                        onClick={() => navigate('/aset/new')}
                        className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <Text.Body component="span" className="!text-white !font-bold">Tambah Aset</Text.Body>
                    </button>
                    
                    {/* MOBILE FAB */}
                    <button
                        onClick={() => navigate('/aset/new')}
                        className="sm:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative w-full sm:w-96 group">
                        <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Cari Nama Barang..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                        />
                    </div>
                    <select
                        value={filterCondition}
                        onChange={e => setFilterCondition(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm"
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
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4"><Text.Label>Informasi Barang</Text.Label></th>
                                <th className="p-4"><Text.Label>Pembelian</Text.Label></th>
                                <th className="p-4"><Text.Label>Status Pinjam</Text.Label></th>
                                <th className="p-4 text-right"><Text.Label>Aksi</Text.Label></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!(asetItems && wargaServerData) && isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        <Text.Body className="!text-slate-400">Sinkronisasi Data...</Text.Body>
                                    </td>
                                </tr>
                            ) : filteredAset.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Package className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <Text.Body className="!text-slate-500">Belum Ada Inventaris Yang Tercatat Di Scope Ini.</Text.Body>
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
                                                    <Text.Body className="font-bold leading-tight mb-1">{aset.nama_barang}</Text.Body>
                                                    <div className="flex items-center gap-2">
                                                        <Text.Label className={`!px-2.5 !py-1 rounded-full border border-slate-100 !text-slate-700
                                                            ${aset.kondisi === 'baik' ? '!bg-emerald-50 !text-emerald-700 !border-emerald-100' :
                                                                aset.kondisi === 'rusak_ringan' ? '!bg-amber-50 !text-amber-700 !border-amber-100' :
                                                                aset.kondisi === 'rusak_berat' ? '!bg-rose-50 !text-rose-700 !border-rose-100' :
                                                                '!bg-slate-50'}
                                                        `}>
                                                            {aset.kondisi === 'baik' ? 'Baik' :
                                                                aset.kondisi === 'rusak_ringan' ? 'Rusak Ringan' :
                                                                aset.kondisi === 'rusak_berat' ? 'Rusak Berat' :
                                                                (aset.kondisi || 'Baik')}
                                                        </Text.Label>
                                                        <Text.Caption>• {aset.jumlah} Unit</Text.Caption>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="space-y-1">
                                                <Text.Body className="font-bold">{aset.harga_beli ? formatRupiah(aset.harga_beli) : '-'}</Text.Body>
                                                <Text.Caption className="block">{aset.tanggal_beli ? dateUtils.toDisplay(aset.tanggal_beli) : '-'}</Text.Caption>
                                                {aset.vendor && <Text.Caption className="block truncate max-w-[150px]" title={aset.vendor}>Toko: {aset.vendor}</Text.Caption>}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            {aset.status_pinjam === 'dipinjam' ? (
                                                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 w-fit">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                    <Handshake className="text-amber-600 w-4 h-4" />
                                                    <Text.Label className="!text-amber-800">Dipinjam Oleh</Text.Label>
                                                </div>
                                                <Text.Body className="truncate max-w-[150px] uppercase font-bold">{aset.peminjam?.nama || ('Warga ID: ' + aset.peminjam_id)}</Text.Body>
                                                <Text.Caption className="block mt-1">{aset.tanggal_pinjam ? dateUtils.toDisplay(aset.tanggal_pinjam) : ''}</Text.Caption>
                                            </div>
                                            ) : (
                                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg py-1.5 px-3 w-fit">
                                                    <div className="flex items-center gap-1.5">
                                                    <Package className="text-emerald-600 w-4 h-4" />
                                                    <Text.Label className="!text-emerald-800">Tersedia</Text.Label>
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
                                                                <Handshake weight="bold" /> <Text.Label className="!text-brand-700">Pinjamkan</Text.Label>
                                                            </button>
                                                        </HasPermission>
                                                    ) : (
                                                        <HasPermission module="Aset" action="Ubah">
                                                            <button
                                                                onClick={() => handleReturn(aset)}
                                                                className="flex items-center gap-1 bg-amber-100 text-amber-800 hover:bg-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                                <ArrowUUpLeft weight="bold" /> <Text.Label className="!text-amber-800">Kembalikan</Text.Label>
                                                            </button>
                                                        </HasPermission>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                                                    <HasPermission module="Aset" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/aset/edit/${aset.id}`)}
                                                            className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all border border-slate-100 shadow-sm active:scale-90" title="Edit">
                                                            <PencilSimple weight="duotone" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Aset" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(aset.id, aset.nama_barang)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 shadow-sm active:scale-90" title="Hapus">
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
                            <Text.Label className="!text-slate-400">Sinkronisasi Data...</Text.Label>
                        </div>
                    ) : filteredAset.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <Package weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <Text.Body className="!font-bold !text-slate-900">Belum Ada Aset</Text.Body>
                                <Text.Caption className="mt-1">Inventaris anda akan muncul di sini</Text.Caption>
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
                                                <Text.H2 className="!text-[15px] truncate pr-2">{aset.nama_barang}</Text.H2>
                                                <Text.Label className={`!px-2 !py-0.5 rounded-lg border
                                                    ${aset.kondisi === 'baik' ? '!bg-emerald-50 !text-emerald-700 !border-emerald-100' :
                                                        aset.kondisi === 'rusak_ringan' ? '!bg-amber-50 !text-amber-700 !border-amber-100' :
                                                        aset.kondisi === 'rusak_berat' ? '!bg-rose-50 !text-rose-700 !border-rose-100' :
                                                        '!bg-slate-50 !text-slate-700 !border-slate-100'}
                                                `}>
                                                    {aset.kondisi === 'baik' ? 'Baik' :
                                                        aset.kondisi === 'rusak_ringan' ? 'Rusak Ringan' :
                                                        aset.kondisi === 'rusak_berat' ? 'Rusak Berat' :
                                                        (aset.kondisi || 'Baik')}
                                                </Text.Label>
                                            </div>
                                            <Text.Caption className="!font-bold !text-slate-500 mt-1 flex items-center gap-1.5">
                                                <Package weight="fill" className="text-slate-300 w-3.5 h-3.5" />
                                                Stok: {aset.jumlah} Unit
                                            </Text.Caption>
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                <Text.Amount component="span" className="!text-[10px] bg-slate-50 !text-slate-500 px-2 py-0.5 rounded-md border border-slate-100 !font-bold">
                                                    {aset.harga_beli ? formatRupiah(aset.harga_beli) : '-'}
                                                </Text.Amount>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Quick Action */}
                                    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 mb-4">
                                        {aset.status_pinjam === 'dipinjam' ? (
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5 text-amber-600 font-bold text-[10px] tracking-tight mb-1">
                                                        <Handshake weight="fill" className="w-3.5 h-3.5" /> <Text.Label className="!text-amber-600">Sedang Dipinjam</Text.Label>
                                                    </div>
                                                    <Text.Body className="!text-xs !font-bold !text-slate-900 truncate uppercase">{aset.peminjam?.nama || (aset.peminjam_id ? 'Warga ID: ' + aset.peminjam_id : 'Unknown')}</Text.Body>
                                                    <Text.Caption className="!text-[9px] !text-slate-400 !font-medium mt-0.5 !italic block">{aset.tanggal_pinjam ? dateUtils.toDisplay(aset.tanggal_pinjam) : ''}</Text.Caption>
                                                </div>
                                                <HasPermission module="Aset" action="Ubah">
                                                    <button
                                                        onClick={() => handleReturn(aset)}
                                                        className="flex items-center justify-center gap-1.5 bg-white text-amber-600 border border-amber-200 hover:bg-amber-50 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
                                                    >
                                                        <ArrowUUpLeft weight="bold" /> <Text.Label className="!text-amber-600">Kembali</Text.Label>
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <Text.Label className="!text-emerald-600">Tersedia Untuk Pinjam</Text.Label>
                                                </div>
                                                <HasPermission module="Aset" action="Ubah">
                                                    <button
                                                        onClick={() => handleBorrowClick(aset)}
                                                        className="flex items-center justify-center gap-1.5 bg-brand-600 text-white shadow-md hover:bg-brand-700 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
                                                    >
                                                        <Handshake weight="bold" /> <Text.Label className="!text-white">Pinjamkan</Text.Label>
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                        <Text.Caption className="!text-[10px] !font-medium !text-slate-400 !tracking-tight !italic">
                                            Dibeli: {aset.tanggal_beli ? dateUtils.toDisplay(aset.tanggal_beli) : '-'}
                                        </Text.Caption>
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
                        <Text.Caption>Menampilkan {filteredAset.length} Barang Di Inventaris</Text.Caption>
                    </div>
                )}
            </div>

            {/* Modal Peminjaman */}
            {borrowModalOpen && selectedAset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100">
                            <div>
                                <Text.H2 className="!text-lg">Pinjamkan Aset</Text.H2>
                                <Text.Caption>Form Peminjaman Inventaris</Text.Caption>
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
                                    <Text.Label className="!text-brand-600 mb-0.5">Barang dipinjam</Text.Label>
                                    <Text.Body className="!font-bold !text-gray-900 !leading-tight">{selectedAset.nama_barang}</Text.Body>
                                    <Text.Caption>Stok total: {selectedAset.jumlah} unit</Text.Caption>
                                </div>
                            </div>

                            <div>
                                <Text.Label className="!text-gray-700 mb-1">
                                    Pilih Warga Peminjam <Text.Body component="span" className="!text-red-500">*</Text.Body>
                                </Text.Label>
                                <select
                                    className="w-full rounded-xl shadow-sm p-3 border border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                    value={selectedWargaId}
                                    onChange={(e) => setSelectedWargaId(e.target.value)}
                                >
                                    <option value="" disabled>-- Pilih Nama Warga Peminjam --</option>
                                    {wargaList.map(w => (
                                        <option key={w.id} value={w.id}>{w.nama.toUpperCase()} {w.alamat ? `- ${w.alamat}` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => setBorrowModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent"
                                >
                                    <Text.Label className="!text-gray-600">Batal</Text.Label>
                                </button>
                                <button
                                    onClick={submitBorrow}
                                    disabled={!selectedWargaId || isSubmitting}
                                    className={`px-6 py-2 bg-brand-600 text-white rounded-lg flex items-center gap-2 font-medium transition-all ${!selectedWargaId || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-700 hover-lift active-press shadow-sm hover:shadow-md'}`}
                                >
                                    <Handshake weight="bold" />
                                    <Text.Label className="!text-white">{isSubmitting ? 'Memproses...' : 'Pinjamkan Sekarang'}</Text.Label>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
