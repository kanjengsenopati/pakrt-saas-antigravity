import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { iuranService, IuranWithWarga } from '../../services/iuranService';
import { 
    Plus, 
    MagnifyingGlass, 
    Funnel, 
    Trash, 
    CheckCircle, 
    Eye, 
    X, 
    Image as ImageIcon,
    PencilSimple
} from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { formatRupiah } from '../../utils/currency';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';


export default function IuranList() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();

    const [iuranList, setIuranList] = useState<IuranWithWarga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);


    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant]);

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const data = await iuranService.getAll(currentTenant.id);
            const items = data.items || [];
            setIuranList(items);

            // Extract unique years
            const years = Array.from(new Set(items.map(i => i.periode_tahun))).sort((a, b) => b - a);
            // Ensure current year is in the list
            const currentYear = new Date().getFullYear();
            if (!years.includes(currentYear)) {
                years.unshift(currentYear);
            }
            setAvailableYears(years);
        } catch (error) {
            console.error("Failed to load iuran:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus data pembayaran ini? Entri Kas Masuk terkait juga akan dihapus.")) {
            await iuranService.delete(id, currentTenant!.id, currentScope);
            loadData();
        }
    };

    const filteredIuran = iuranList.filter(i => {
        const matchesSearch = i.warga?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.warga?.nik.includes(searchQuery);
        const matchesYear = filterYear === '' || i.periode_tahun.toString() === filterYear;
        return matchesSearch && matchesYear;
    });

    // Stats calculations
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();

    const totalCollectedYear = filteredIuran.reduce((sum, item) => sum + item.nominal, 0);
    const totalCollectedMonth = iuranList
        .filter(i => {
            const payDate = new Date(i.tanggal_bayar);
            return payDate.getMonth() + 1 === currentMonth && payDate.getFullYear() === currentYearNum;
        })
        .reduce((sum, item) => sum + item.nominal, 0);

    const transactionCount = filteredIuran.length;

    // Filtered iuran data


    const getMonthName = (monthNumber: number) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('id-ID', { month: 'long' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pembayaran Iuran</h1>
                    <p className="text-gray-500 mt-1">
                        Rekapitulasi pembayaran iuran wajib bulanan warga
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <HasPermission module="Iuran Warga" action="Buat">
                        <button
                            onClick={() => navigate('/iuran/baru')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold transition-all shadow-md shadow-brand-600/20 active:scale-95"
                        >
                            <Plus weight="bold" />
                            <span>Catat Pembayaran</span>
                        </button>
                    </HasPermission>
                </div>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* TOTAL KOLEKTIF */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle weight="bold" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Kolektif {filterYear || 'Semua'}</p>
                            <p className="text-lg font-black text-slate-900 leading-tight truncate">{formatRupiah(totalCollectedYear)}</p>
                            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full w-fit italic">
                                * Filter tahun aktif
                            </div>
                        </div>
                    </div>
                </div>

                {/* MASUK BULAN INI */}
                <div className="bg-brand-600 p-4 rounded-xl border border-brand-500 shadow-md relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-white/20 text-white rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-md border border-white/20">
                            <Plus weight="bold" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-white/70 uppercase tracking-widest leading-none">Masuk Bulan Ini ({now.toLocaleString('id-ID', { month: 'short' })})</p>
                            <p className="text-lg font-black text-white leading-tight truncate">{formatRupiah(totalCollectedMonth)}</p>
                            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-white bg-white/10 px-1.5 py-0.5 rounded-full w-fit border border-white/10">
                                <span className="w-1 h-1 rounded-full bg-emerald-300 animate-pulse" />
                                Bulan Berjalan
                            </div>
                        </div>
                    </div>
                </div>

                {/* JUMLAH TRANSAKSI */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-brand-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MagnifyingGlass weight="bold" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Jumlah Transaksi</p>
                            <p className="text-lg font-black text-slate-900 leading-tight">{transactionCount}</p>
                            <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded-full w-fit italic">
                                * Frekuensi pembayaran
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
                    <div className="relative w-full md:w-80">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari nama warga atau NIK..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <select
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                            className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto cursor-pointer shadow-sm"
                        >
                            <option value="">Semua Tahun</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>Tahun {year}</option>
                            ))}
                        </select>
                        <HasPermission module="Buku Kas / Transaksi" action="Buat">
                            <button
                                onClick={async () => {
                                    if (window.confirm("Sinkronkan semua data iuran ke Kas Masuk? (Hanya entri yang belum ada yang akan ditambahkan)")) {
                                        setIsLoading(true);
                                        await iuranService.syncAllToKeuangan(currentTenant!.id, currentScope);
                                        await loadData();
                                        alert("Sinkronisasi data selesai.");
                                    }
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg hover:bg-brand-100 transition-colors w-full sm:w-auto shadow-sm"
                            >
                                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                <span>Sinkron Data Kas</span>
                            </button>
                        </HasPermission>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto shadow-sm">
                            <Funnel className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                            <tr>
                                <th className="p-3">Tanggal Bayar & Kategori</th>
                                <th className="p-3">Warga Pembayar</th>
                                <th className="p-3">Periode Terbayar</th>
                                <th className="p-3 text-right">Nominal (Rp)</th>
                                <th className="p-3 text-center px-6">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-bold text-brand-600 uppercase tracking-widest">Memuat database...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredIuran.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-gray-500">
                                        <div className="flex justify-center mb-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                                <CheckCircle weight="duotone" className="w-8 h-8 text-slate-300" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-slate-900">Data Tidak Ditemukan</p>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-tight">Belum ada riwayat pembayaran yang cocok dengan filter aktif.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredIuran.map((iuran) => (
                                    <tr key={iuran.id} className="hover:bg-brand-50/20 transition-colors group border-b border-slate-50 last:border-0">
                                        <td className="p-3">
                                            <div className="font-bold text-slate-900 text-xs">{dateUtils.toDisplay(iuran.tanggal_bayar)}</div>
                                            <div className="text-[10px] text-brand-600 font-bold uppercase tracking-tight mt-0.5">{iuran.kategori || 'Iuran Bulanan'}</div>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-bold text-slate-900 text-xs">{iuran.warga?.nama || 'Warga Terhapus'}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{iuran.warga?.nik}</p>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {iuran.periode_bulan.map(b => (
                                                    <span key={b} className="inline-flex px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-white text-blue-700 border border-blue-200 uppercase tracking-widest shadow-sm">
                                                        {getMonthName(b).substring(0, 3)} {iuran.periode_tahun}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="text-sm font-black text-slate-900">
                                                {formatRupiah(iuran.nominal)}
                                            </span>
                                        </td>
                                        <td className="p-3 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                <HasPermission module="Iuran Warga" action="Ubah">
                                                    <button
                                                        onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm bg-white border border-blue-100"
                                                        title="Ubah Data"
                                                    >
                                                        <PencilSimple weight="bold" className="w-4 h-4" />
                                                    </button>
                                                </HasPermission>
                                                {iuran.url_bukti && (
                                                    <button
                                                        onClick={() => setViewProofUrl(iuran.url_bukti || null)}
                                                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors shadow-sm bg-white border border-brand-100"
                                                        title="Lihat Bukti Bayar"
                                                    >
                                                        <Eye weight="bold" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <HasPermission module="Iuran Warga" action="Hapus">
                                                    <button
                                                        onClick={() => handleDelete(iuran.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-red-100"
                                                        title="Hapus / Batalkan Bayar"
                                                    >
                                                        <Trash weight="bold" className="w-4 h-4" />
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE VIEW: CARD GRID */}
                <div className="md:hidden space-y-4 p-4 bg-gray-50">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-8 font-bold text-xs uppercase animate-pulse">Memuat data...</div>
                    ) : filteredIuran.length === 0 ? (
                        <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                            <CheckCircle weight="duotone" className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="font-bold text-slate-900 uppercase tracking-tight">Data Kosong</p>
                        </div>
                    ) : (
                        filteredIuran.map((iuran) => (
                            <div key={iuran.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:border-brand-300 transition-colors">
                                <div className="p-4 flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                                            <div>
                                                <h3 className="font-black text-slate-900 text-base">{iuran.warga?.nama || 'Warga Terhapus'}</h3>
                                                <p className="text-[10px] text-slate-400 tracking-widest font-mono mt-0.5">{iuran.warga?.nik}</p>
                                            </div>
                                            <div className="text-lg font-black text-brand-600">
                                                {formatRupiah(iuran.nominal)}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end mt-3">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Periode Dibayar</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {iuran.periode_bulan.map(b => (
                                                        <span key={b} className="inline-flex px-1.5 py-0.5 rounded-lg text-[10px] font-black bg-slate-50 text-blue-700 border border-slate-200 uppercase tracking-widest">
                                                            {getMonthName(b).substring(0, 3)} '{iuran.periode_tahun.toString().substring(2)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold text-brand-600">{iuran.kategori || 'Iuran Bulanan'}</p>
                                                <p className="text-xs font-bold text-slate-700">{dateUtils.toDisplay(iuran.tanggal_bayar)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-end items-center gap-2">
                                    <HasPermission module="Iuran Warga" action="Ubah">
                                        <button
                                            onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                            className="p-2 text-blue-600 bg-white border border-blue-100 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Ubah
                                        </button>
                                    </HasPermission>
                                    {iuran.url_bukti && (
                                        <button
                                            onClick={() => setViewProofUrl(iuran.url_bukti || null)}
                                            className="p-2 text-brand-600 bg-white border border-brand-100 hover:bg-brand-50 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <Eye weight="bold" className="w-3.5 h-3.5" /> Bukti
                                        </button>
                                    )}
                                    <HasPermission module="Iuran Warga" action="Hapus">
                                        <button
                                            onClick={() => handleDelete(iuran.id)}
                                            className="p-2 text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest" title="Hapus / Batalkan Bayar">
                                            <Trash weight="bold" className="w-3.5 h-3.5" /> Batal Bayar
                                        </button>
                                    </HasPermission>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* PROOF MODAL */}
            {
                viewProofUrl && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative animate-zoom-in">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm flex items-center gap-2">
                                    <ImageIcon weight="duotone" className="text-brand-600" />
                                    Bukti Pembayaran Iuran
                                </h3>
                                <button
                                    onClick={() => setViewProofUrl(null)}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X weight="bold" className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[80vh] flex justify-center bg-slate-50">
                                <img
                                    src={getFullUrl(viewProofUrl)}
                                    alt="Bukti Pembayaran"
                                    className="max-w-full h-auto rounded-lg shadow-lg border border-white"
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
