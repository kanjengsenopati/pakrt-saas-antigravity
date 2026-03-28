import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { iuranService, IuranWithWarga } from '../../services/iuranService';
import { 
    Plus, 
    Trash, 
    CheckCircle, 
    Eye, 
    X, 
    Image as ImageIcon,
    PencilSimple,
    CircleNotch,
    FileArrowDown
} from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { formatRupiah } from '../../utils/currency';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';
import { useHybridData } from '../../hooks/useHybridData';


const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function IuranList() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const { user: authUser } = useAuth();
    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';


    const {
        mergedData: iuranServerData,
        isFetching: isLoading,
        refresh: loadData
    } = useHybridData<{ items: IuranWithWarga[] }>({
        fetcher: () => iuranService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });

    const iuranList = iuranServerData?.items || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
    const [verifyingId, setVerifyingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isSubmittingVerify, setIsSubmittingVerify] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        if (!currentTenant) return;
        setIsExporting(true);
        try {
            await iuranService.exportToXlsx(currentTenant.id, currentScope);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Gagal melakukan export data.");
        } finally {
            setIsExporting(false);
        }
    };


    useEffect(() => {
        if (iuranList.length > 0) {
            // Extract unique years
            const years = Array.from(new Set(iuranList.map(i => i.periode_tahun))).sort((a, b) => b - a);
            // Ensure current year is in the list
            const currentYear = new Date().getFullYear();
            if (!years.includes(currentYear)) {
                years.unshift(currentYear);
            }
            setAvailableYears(years);
        }
    }, [iuranList]);

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
        const shortId = itemId.substring(0, 3).toLowerCase();
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
                    <p className="text-xs font-semibold text-gray-400 tracking-normal mt-1 italic">
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 -mt-2">
                {/* TOTAL KOLEKTIF */}
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <CheckCircle weight="fill" className="text-brand-500 w-3 h-3" />
                            Total Kolektif {filterYear || 'Semua'}
                        </p>
                        <p className="text-[13px] sm:text-lg font-black text-slate-900 leading-none truncate tabular-nums">{formatRupiah(totalCollectedYear)}</p>
                    </div>
                </div>

                {/* MASUK BULAN INI */}
                <div className="bg-brand-600 p-3 sm:p-4 rounded-2xl border border-brand-500 shadow-lg relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-15 h-15 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <p className="text-[10px] sm:text-xs font-bold text-brand-100 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <Plus weight="bold" className="text-white w-3 h-3" />
                            Bulan Ini ({now.toLocaleString('id-ID', { month: 'short' })})
                        </p>
                        <p className="text-[13px] sm:text-lg font-black text-white leading-none truncate tabular-nums">{formatRupiah(totalCollectedMonth)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
                    {!isWarga && (
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Cari nama warga atau NIK..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm font-medium text-gray-900"
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
                        <button 
                            onClick={handleExport}
                            disabled={isExporting}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all w-full sm:w-auto shadow-sm border ${
                                isExporting ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            {isExporting ? <CircleNotch weight="bold" className="w-4 h-4 animate-spin" /> : <FileArrowDown weight="bold" className="w-4 h-4" />}
                            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
                        </button>
                    </div>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500 tracking-normal">
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
                            {!iuranServerData && isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-sm font-bold text-brand-600 tracking-normal">Memuat database...</span>
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
                                        <p className="text-sm text-gray-400 mt-1 tracking-normal italic">Belum ada riwayat pembayaran yang cocok dengan filter aktif.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredIuran.map((iuran) => (
                                    <tr key={iuran.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50 last:border-0 text-sm">
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-900">{dateUtils.toDisplay(iuran.tanggal_bayar)}</div>
                                            <div className="text-sm text-gray-400 font-mono mt-0.5 whitespace-nowrap tracking-normal italic">ID: {formatFormalId(iuran.tanggal_bayar, iuran.id)}</div>
                                            <div className="text-xs text-brand-600 font-bold tracking-normal mt-1">{toTitleCase(iuran.kategori || 'Iuran Bulanan')}</div>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-semibold text-gray-900">{toTitleCase(iuran.warga?.nama || 'Warga Terhapus')}</p>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">{iuran.warga?.nik}</p>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                {iuran.periode_bulan.map(b => (
                                                    <span key={b} className={`inline-flex px-1.5 py-0.5 rounded-lg text-sm font-semibold tracking-normal shadow-sm border ${
                                                        iuran.status === 'VERIFIED' ? 'bg-emerald-500 text-white border-emerald-600' :
                                                        iuran.status === 'PENDING' ? 'bg-yellow-400 text-black border-yellow-500' :
                                                        'bg-red-50 border-red-200 text-red-600'
                                                    }`}>
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
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white border border-emerald-600 flex items-center gap-1 shadow-sm">
                                                        <CheckCircle weight="fill" className="w-3 h-3" />
                                                        Diterima
                                                    </span>
                                                ) : iuran.status === 'REJECTED' ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100 flex items-center gap-1 shadow-sm">
                                                            <X weight="bold" className="w-3 h-3" />
                                                            Ditolak
                                                        </span>
                                                        {iuran.alasan_penolakan && (
                                                            <p className="text-sm text-red-400 mt-1 max-w-[120px] text-center italic">{iuran.alasan_penolakan}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-black border border-yellow-500 flex items-center gap-1 shadow-sm animate-pulse">
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
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                                                            title="Verifikasi Pembayaran"
                                                        >
                                                            Verifikasi
                                                        </button>
                                                    </HasPermission>
                                                )}
                                                {iuran.status === 'REJECTED' && (
                                                    isWarga ? (
                                                        <button
                                                            onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                                                            title="Edit & Ajukan Ulang"
                                                        >
                                                            Ajukan Ulang
                                                        </button>
                                                    ) : (
                                                        <HasPermission module="Iuran Warga" action="Ubah">
                                                            <button
                                                                onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold transition-all shadow-sm"
                                                                title="Edit & Ajukan Ulang"
                                                            >
                                                                Ajukan Ulang
                                                            </button>
                                                        </HasPermission>
                                                    )
                                                )}
                                                {(iuran.status === 'PENDING' || iuran.status === 'VERIFIED') && (
                                                    <HasPermission module="Iuran Warga" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm bg-white border border-blue-100"
                                                            title="Ubah Data"
                                                        >
                                                            <PencilSimple weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                )}
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
                <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
                    {!iuranServerData && isLoading ? (
                        <div className="py-20 text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Sinkronisasi...</span>
                        </div>
                    ) : filteredIuran.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <CheckCircle weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">Belum Ada Iuran</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Riwayat pembayaran iuran akan muncul di sini</p>
                            </div>
                        </div>
                    ) : (
                        filteredIuran.map((iuran) => (
                            <div key={iuran.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex flex-col items-center justify-center border border-brand-100 shadow-inner">
                                                <span className="text-[8px] font-bold leading-none uppercase">{new Date(iuran.tanggal_bayar).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                <span className="text-sm font-black leading-none mt-0.5">{new Date(iuran.tanggal_bayar).getDate()}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-[14px] capitalize tracking-tight leading-tight mb-1">{toTitleCase(iuran.warga?.nama || 'Warga Terhapus')}</h3>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase italic">ID: {formatFormalId(iuran.tanggal_bayar, iuran.id)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-base font-black text-brand-600 tabular-nums tracking-tight">
                                                {formatRupiah(iuran.nominal)}
                                            </div>
                                            <p className="text-[9px] text-brand-500 font-bold uppercase tracking-tight mt-0.5">{toTitleCase(iuran.kategori || 'Iuran Bulanan')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        {iuran.status === 'VERIFIED' ? (
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                                <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                Verified
                                            </span>
                                        ) : iuran.status === 'REJECTED' ? (
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                                <X weight="bold" className="w-3.5 h-3.5" />
                                                Rejected
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider animate-pulse">
                                                <CircleNotch weight="bold" className="w-3.5 h-3.5 animate-spin" />
                                                Pending
                                            </span>
                                        )}
                                        {iuran.status === 'REJECTED' && iuran.alasan_penolakan && (
                                            <span className="text-[10px] text-rose-400 italic font-medium truncate max-w-[150px]">
                                                {iuran.alasan_penolakan}
                                            </span>
                                        )}
                                    </div>

                                    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 mb-4">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Bulan Terbayar ({iuran.periode_tahun})</p>
                                        <div className="grid grid-cols-6 gap-1.5">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                                const isPaid = iuran.periode_bulan.includes(month);
                                                return (
                                                    <div 
                                                        key={month} 
                                                        className={`flex flex-col items-center justify-center p-1 rounded-lg border text-[10px] font-black transition-all duration-300 shadow-sm
                                                            ${isPaid 
                                                                ? (iuran.status === 'VERIFIED' ? 'bg-emerald-500 text-white border-emerald-400' 
                                                                 : iuran.status === 'PENDING' ? 'bg-amber-400 text-slate-900 border-amber-300'
                                                                 : 'bg-rose-500 text-white border-rose-400')
                                                                : 'bg-white text-slate-200 border-slate-100'
                                                            }`}
                                                    >
                                                        {getMonthName(month).substring(0, 3).toUpperCase()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center pt-3 border-t border-slate-50 gap-2">
                                        {iuran.status === 'PENDING' && (
                                            <HasPermission module="Iuran Warga" action="Ubah">
                                                <button
                                                    onClick={() => setVerifyingId(iuran.id)}
                                                    className="flex-1 py-2 bg-brand-600 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-tighter shadow-md active:scale-95"
                                                >
                                                    <CheckCircle weight="bold" className="w-4 h-4" />
                                                    VERIFIKASI
                                                </button>
                                            </HasPermission>
                                        )}
                                        <div className="flex gap-2">
                                            {iuran.url_bukti && (
                                                <button
                                                    onClick={() => setViewProofUrl(iuran.url_bukti || null)}
                                                    className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all shadow-sm border border-brand-100/50"
                                                    title="Lihat Bukti"
                                                >
                                                    <ImageIcon weight="bold" className="w-4 h-4" />
                                                </button>
                                            )}
                                            {iuran.status === 'REJECTED' && (
                                                isWarga ? (
                                                    <button
                                                        onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                        className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex-1 md:flex-none justify-center"
                                                        title="Edit & Ajukan Ulang"
                                                    >
                                                        Ajukan Ulang
                                                    </button>
                                                ) : (
                                                    <HasPermission module="Iuran Warga" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                            className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex-1 md:flex-none justify-center"
                                                            title="Edit & Ajukan Ulang"
                                                        >
                                                            Ajukan Ulang
                                                        </button>
                                                    </HasPermission>
                                                )
                                            )}
                                            {(iuran.status === 'PENDING' || iuran.status === 'VERIFIED') && (
                                                <HasPermission module="Iuran Warga" action="Ubah">
                                                    <button
                                                        onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                        className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all shadow-sm border border-brand-100/50 flex-1 md:flex-none flex items-center justify-center"
                                                    >
                                                        <PencilSimple weight="bold" className="w-4 h-4" />
                                                    </button>
                                                </HasPermission>
                                            )}
                                            <HasPermission module="Iuran Warga" action="Hapus">
                                                <button
                                                    onClick={() => handleDelete(iuran.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-transparent shadow-sm"
                                                    title="Hapus / Batalkan"
                                                >
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
                                            className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl text-xs font-semibold tracking-normal hover:bg-brand-700 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingVerify ? <CircleNotch className="w-4 h-4 animate-spin" /> : <CheckCircle weight="bold" className="w-4 h-4" />}
                                            Diterima / Sah
                                        </button>
                                        <button
                                            disabled={isSubmittingVerify}
                                            onClick={() => setIsRejecting(true)}
                                            className="w-full px-4 py-3 bg-white border border-red-200 text-red-600 rounded-xl text-xs font-semibold tracking-normal hover:bg-red-50 transition-all disabled:opacity-50"
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
                                            className="flex-1 px-3 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-semibold tracking-normal hover:bg-gray-200 transition-all"
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
                                            className="flex-[2] px-3 py-2.5 bg-red-600 text-white rounded-xl text-xs font-semibold tracking-normal hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
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
