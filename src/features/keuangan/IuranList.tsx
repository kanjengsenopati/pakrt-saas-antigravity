import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
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
    PencilSimple,
    CircleNotch
} from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { formatRupiah } from '../../utils/currency';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';


export default function IuranList() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const { user: authUser } = useAuth();
    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';

    const [iuranList, setIuranList] = useState<IuranWithWarga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);


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
        const matchesStatus = filterStatus === '' || i.status === filterStatus;
        return matchesSearch && matchesYear && matchesStatus;
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

    // Filtered iuran data
    const formatFormalId = (dateString: string, itemId: string) => {
        const d = new Date(dateString);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const shortId = itemId.substring(0, 4).toUpperCase();
        return `${yyyy}${mm}${dd}-${shortId}`;
    };

    const getMonthName = (monthNumber: number) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('id-ID', { month: 'long' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">Pembayaran Iuran</h1>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">
                        Rekapitulasi pembayaran iuran wajib bulanan warga
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <HasPermission module="Iuran Warga" action="Buat">
                        <button
                            onClick={() => navigate('/iuran/baru')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover-lift active-press"
                        >
                            <Plus weight="bold" />
                            <span>Catat Pembayaran</span>
                        </button>
                    </HasPermission>
                </div>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-2">
                {/* TOTAL KOLEKTIF */}
                <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute -right-4 -top-4 w-12 h-12 sm:w-20 sm:h-20 bg-brand-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex w-10 h-10 bg-brand-50 text-brand-600 rounded-lg items-center justify-center flex-shrink-0">
                            <CheckCircle weight="bold" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-500 tracking-normal leading-none uppercase">Total Kolektif {filterYear || 'Semua'}</p>
                            <p className="text-lg font-semibold text-gray-900 leading-tight truncate mt-1">{formatRupiah(totalCollectedYear)}</p>
                            <div className="hidden sm:flex items-center gap-1 mt-1 text-xs font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full w-fit italic">
                                * Filter tahun aktif
                            </div>
                        </div>
                    </div>
                </div>

                {/* MASUK BULAN INI */}
                <div className="bg-brand-600 p-2 sm:p-4 rounded-xl border border-brand-500 shadow-md relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-15 h-15 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 text-white">
                        <div className="hidden sm:flex w-10 h-10 bg-white/20 text-white rounded-lg items-center justify-center flex-shrink-0 backdrop-blur-md border border-white/20">
                            <Plus weight="bold" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white/80 tracking-normal leading-none uppercase">Bulan Ini ({now.toLocaleString('id-ID', { month: 'short' })})</p>
                            <p className="text-lg font-semibold text-white leading-tight truncate mt-1">{formatRupiah(totalCollectedMonth)}</p>
                            <div className="hidden sm:flex items-center gap-1 mt-1 text-xs font-medium text-white bg-white/10 px-1.5 py-0.5 rounded-full w-fit border border-white/10">
                                <span className="w-1 h-1 rounded-full bg-emerald-300 animate-pulse" />
                                Bulan Berjalan
                            </div>
                        </div>
                    </div>
                </div>

                {/* JUMLAH TRANSAKSI */}
                <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute -right-4 -top-4 w-12 h-12 sm:w-20 sm:h-20 bg-brand-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
                        <div className="hidden sm:flex w-10 h-10 bg-brand-50 text-brand-600 rounded-lg items-center justify-center flex-shrink-0">
                            <MagnifyingGlass weight="bold" className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 w-full">
                            <p className="text-xs font-semibold text-gray-500 tracking-normal leading-none uppercase">Jumlah Transaksi</p>
                            <p className="text-lg font-semibold text-gray-900 leading-tight truncate mt-1">{filteredIuran.length} Trx</p>
                            <div className="hidden sm:flex items-center gap-1 mt-1 text-[9px] font-medium text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded-full w-fit italic mx-auto sm:mx-0">
                                * Frekuensi pembayaran
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
                    {!isWarga && (
                        <div className="relative w-full md:w-80">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari nama warga atau NIK..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm font-medium text-gray-900"
                            />
                        </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                        <select
                            value={filterYear}
                            onChange={e => setFilterYear(e.target.value)}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto cursor-pointer shadow-sm"
                        >
                            <option value="">Semua Tahun</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>Tahun {year}</option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto cursor-pointer shadow-sm"
                        >
                            <option value="">Semua Status</option>
                            <option value="PENDING">Menunggu Verifikasi</option>
                            <option value="VERIFIED">Diterima (Selesai)</option>
                            <option value="REJECTED">Ditolak</option>
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
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-lg hover:bg-brand-100 transition-colors w-full sm:w-auto shadow-sm"
                            >
                                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                <span>Sinkron Data Kas</span>
                            </button>
                        </HasPermission>
                        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto shadow-sm">
                            <Funnel className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-sm font-medium uppercase text-gray-600 tracking-wider">
                            <tr>
                                <th className="p-3">Tanggal Bayar & Kategori</th>
                                <th className="p-3">Warga Pembayar</th>
                                <th className="p-3">Periode Terbayar</th>
                                <th className="p-3 text-right">Nominal (Rp)</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center px-6">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
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
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                                                <CheckCircle weight="duotone" className="w-8 h-8 text-gray-300" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-semibold text-gray-900">Data Tidak Ditemukan</p>
                                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight">Belum ada riwayat pembayaran yang cocok dengan filter aktif.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredIuran.map((iuran) => (
                                    <tr key={iuran.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50 last:border-0 text-sm">
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-900">{dateUtils.toDisplay(iuran.tanggal_bayar)}</div>
                                            <div className="text-[10px] text-gray-400 font-mono mt-0.5 whitespace-nowrap tracking-wider">ID: {formatFormalId(iuran.tanggal_bayar, iuran.id)}</div>
                                            <div className="text-xs text-brand-600 font-semibold uppercase tracking-tight mt-1">{iuran.kategori || 'Iuran Bulanan'}</div>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-semibold text-gray-900">{iuran.warga?.nama || 'Warga Terhapus'}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{iuran.warga?.nik}</p>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {iuran.periode_bulan.map(b => (
                                                    <span key={b} className="inline-flex px-1.5 py-0.5 rounded-lg text-[10px] font-semibold bg-white text-blue-700 border border-blue-200 uppercase tracking-widest shadow-sm">
                                                        {getMonthName(b).substring(0, 3)} {iuran.periode_tahun}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="font-semibold text-gray-900">
                                                {formatRupiah(iuran.nominal)}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-col items-center gap-1">
                                                {iuran.status === 'VERIFIED' ? (
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                                                        <CheckCircle weight="fill" className="w-3 h-3" />
                                                        Diterima
                                                    </span>
                                                ) : iuran.status === 'REJECTED' ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                                                            <X weight="bold" className="w-3 h-3" />
                                                            Ditolak
                                                        </span>
                                                        {iuran.alasan_penolakan && (
                                                            <p className="text-[9px] text-red-400 mt-1 max-w-[120px] text-center italic">{iuran.alasan_penolakan}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1 animate-pulse">
                                                        <CircleNotch weight="bold" className="w-3 h-3 animate-spin" />
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 px-6">
                                            <div className="flex items-center justify-center gap-2">
                                                {iuran.status === 'PENDING' && (
                                                    <HasPermission module="Iuran Warga" action="Ubah">
                                                        <button
                                                            onClick={() => setVerifyingId(iuran.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                                                            title="Verifikasi Pembayaran"
                                                        >
                                                            Verifikasi
                                                        </button>
                                                    </HasPermission>
                                                )}
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
                        <div className="text-center text-gray-500 py-8 font-bold text-xs animate-pulse">Memuat data...</div>
                    ) : filteredIuran.length === 0 ? (
                        <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                            <CheckCircle weight="duotone" className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="font-semibold text-gray-900 tracking-tight">Data Kosong</p>
                        </div>
                    ) : (
                        filteredIuran.map((iuran) => (
                            <div key={iuran.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col hover:border-brand-300 transition-colors">
                                <div className="p-4 flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-sm leading-tight">{iuran.warga?.nama || 'Warga Terhapus'}</h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <p className="text-[10px] text-gray-400 tracking-wider font-mono shrink-0">{iuran.warga?.nik}</p>
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded font-mono font-medium tracking-tight leading-none truncate border border-gray-100">
                                                        {formatFormalId(iuran.tanggal_bayar, iuran.id)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="text-sm font-semibold text-brand-600">
                                                    {formatRupiah(iuran.nominal)}
                                                </div>
                                                <div className="text-[10px] font-medium text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 leading-none">
                                                    {dateUtils.toDisplay(iuran.tanggal_bayar)}
                                                </div>
                                                <p className="text-[10px] text-brand-600 font-semibold mt-0.5 uppercase tracking-tight">{iuran.kategori || 'Iuran Bulanan'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3">
                                            {iuran.status === 'VERIFIED' ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                                    <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                    Diterima
                                                </span>
                                            ) : iuran.status === 'REJECTED' ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100 flex items-center gap-1.5 shadow-sm">
                                                    <X weight="bold" className="w-3.5 h-3.5" />
                                                    Ditolak
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm animate-pulse">
                                                    <CircleNotch weight="bold" className="w-3.5 h-3.5 animate-spin" />
                                                    Pending
                                                </span>
                                            )}
                                            {iuran.status === 'REJECTED' && iuran.alasan_penolakan && (
                                                <span className="text-[9px] text-red-400 italic font-medium truncate max-w-[150px]">
                                                    {iuran.alasan_penolakan}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col mt-4 pt-4 border-t border-gray-50">
                                            <p className="text-sm text-gray-900 font-semibold mb-2">Periode Dibayar</p>
                                            <div className="flex gap-2 items-center w-full">
                                                <div className="grid grid-cols-6 gap-1 flex-1 mt-1">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                                        const isPaid = iuran.periode_bulan.includes(month);
                                                        return (
                                                            <span 
                                                                key={month} 
                                                                className={`inline-flex px-1 py-1 rounded-md text-[13px] font-semibold border items-center justify-center shadow-sm transition-all duration-300
                                                                    ${isPaid 
                                                                        ? 'bg-brand-600 text-white border-brand-700 ring-1 ring-brand-500/20' 
                                                                        : 'bg-gray-50 text-gray-400 border-gray-100/50'
                                                                    }`}
                                                            >
                                                                {getMonthName(month).substring(0, 3)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                                {iuran.url_bukti && (
                                                    <button
                                                        onClick={() => setViewProofUrl(iuran.url_bukti!)}
                                                        className="flex flex-col items-center justify-center gap-1 p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all shadow-sm group active:scale-95"
                                                        title="Lihat Bukti"
                                                    >
                                                        <Eye weight="bold" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">Bukti</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 border-t border-gray-100 p-2 flex justify-end items-center gap-2">
                                    {iuran.status === 'PENDING' && (
                                        <HasPermission module="Iuran Warga" action="Ubah">
                                            <button
                                                onClick={() => setVerifyingId(iuran.id)}
                                                className="px-3 py-1.5 bg-brand-600 text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                                            >
                                                <CheckCircle weight="bold" className="w-3.5 h-3.5" />
                                                Verifikasi
                                            </button>
                                        </HasPermission>
                                    )}
                                    <HasPermission module="Iuran Warga" action="Ubah">
                                        <button
                                            onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                            className="p-2 text-blue-600 bg-white border border-blue-100 hover:bg-blue-50 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
                                        >
                                            Ubah
                                        </button>
                                    </HasPermission>
                                    {iuran.url_bukti && (
                                        <button
                                            onClick={() => setViewProofUrl(iuran.url_bukti || null)}
                                            className="p-2 text-brand-600 bg-white border border-brand-100 hover:bg-brand-50 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
                                        >
                                            <Eye weight="bold" className="w-3.5 h-3.5" /> Bukti
                                        </button>
                                    )}
                                    <HasPermission module="Iuran Warga" action="Hapus">
                                        <button
                                            onClick={() => handleDelete(iuran.id)}
                                            className="p-2 text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" title="Hapus / Batalkan Bayar">
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
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative animate-zoom-in">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h3 className="section-label flex items-center gap-2">
                                    <ImageIcon weight="duotone" className="text-brand-600" />
                                    Bukti Pembayaran Iuran
                                </h3>
                                <button
                                    onClick={() => setViewProofUrl(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X weight="bold" className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            <div className="p-4 overflow-auto max-h-[80vh] flex justify-center bg-gray-50">
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

            {/* VERIFICATION MODAL */}
            {verifyingId && (
                <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden animate-zoom-in border border-gray-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="section-label flex items-center gap-2">
                                {isRejecting ? 'Alasan Penolakan' : 'Verifikasi Pembayaran'}
                            </h3>
                            <button
                                onClick={() => { setVerifyingId(null); setRejectReason(''); setIsRejecting(false); }}
                                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X weight="bold" className="w-3.5 h-3.5 text-gray-400" />
                            </button>
                        </div>
                        
                        <div className="p-4">
                            {!isRejecting ? (
                                <div className="space-y-4">
                                    <div className="text-center py-2">
                                        <p className="text-xs font-semibold text-gray-500">Konfirmasi status iuran ini?</p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            disabled={isSubmittingVerify}
                                            onClick={async () => {
                                                if (!verifyingId) return;
                                                setIsSubmittingVerify(true);
                                                try {
                                                    await iuranService.verify(verifyingId, 'VERIFY');
                                                    setVerifyingId(null);
                                                    loadData();
                                                } finally {
                                                    setIsSubmittingVerify(false);
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-brand-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingVerify ? <CircleNotch className="w-4 h-4 animate-spin" /> : <CheckCircle weight="bold" className="w-4 h-4" />}
                                            Diterima / Sah
                                        </button>
                                        <button
                                            disabled={isSubmittingVerify}
                                            onClick={() => setIsRejecting(true)}
                                            className="w-full px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-50 transition-all disabled:opacity-50"
                                        >
                                            Tolak
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <textarea
                                        autoFocus
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Tulis alasan penolakan..."
                                        className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none h-24"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setIsRejecting(false); setRejectReason(''); }}
                                            className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-gray-200 transition-all"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            disabled={isSubmittingVerify}
                                            onClick={async () => {
                                                if (!verifyingId) return;
                                                setIsSubmittingVerify(true);
                                                try {
                                                    await iuranService.verify(verifyingId, 'REJECT', rejectReason || 'Ditolak oleh Bendahara');
                                                    setVerifyingId(null);
                                                    setRejectReason('');
                                                    setIsRejecting(false);
                                                    loadData();
                                                } finally {
                                                    setIsSubmittingVerify(false);
                                                }
                                            }}
                                            className="flex-[2] px-3 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                                        >
                                            Konfirmasi Tolak
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
