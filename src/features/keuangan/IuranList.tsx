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
import { Text } from '../../components/ui/Typography';


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
    const [expandedHistoryIds, setExpandedHistoryIds] = useState<string[]>([]);

    const toggleHistory = (wargaId: string) => {
        setExpandedHistoryIds(prev => 
            prev.includes(wargaId) ? prev.filter(id => id !== wargaId) : [...prev, wargaId]
        );
    };

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
                    <Text.H1>Pembayaran Iuran</Text.H1>
                    <div className="mt-2 flex flex-col gap-0.5">
                        <Text.Label className="!text-brand-600 !bg-brand-50 !px-2 !py-1 !rounded-[6px] !border !border-brand-100/50 !w-fit">
                            {currentScope}
                        </Text.Label>
                        {currentTenant?.location_detail && (
                            <Text.Caption className="!text-slate-400 !pl-0.5 !italic">
                                {currentTenant.location_detail.split(' • ').slice(1).join(' • ')}
                            </Text.Caption>
                        )}
                    </div>
                </div>
                    <HasPermission module="Iuran Warga" action="Buat">
                        <button
                            onClick={() => navigate('/iuran/baru')}
                            className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                        >
                            <Plus weight="bold" size={18} />
                            <Text.Body component="span" className="!text-white !font-bold">Catat Pembayaran</Text.Body>
                        </button>
                    </HasPermission>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 -mt-2">
                {/* TOTAL KOLEKTIF */}
                <div className="bg-white py-4 px-4 rounded-[20px] border border-slate-100 shadow-premium relative overflow-hidden transition-all duration-300 border-l-[6px] border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <Text.Label className="mb-2 !tracking-tight !text-slate-500">Total Kolektif {filterYear || 'Semua'}</Text.Label>
                        <Text.Amount className="text-sm sm:text-xl lg:text-2xl leading-none truncate">{formatRupiah(totalCollectedYear)}</Text.Amount>
                    </div>
                </div>

                {/* MASUK BULAN INI */}
                <div className="bg-brand-600 py-4 px-4 rounded-[20px] shadow-premium relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-15 h-15 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <Text.Label className="!text-brand-100 mb-2 !tracking-tight">Bulan Ini ({now.toLocaleString('id-ID', { month: 'short' })})</Text.Label>
                        <Text.Amount className="!text-white text-sm sm:text-xl lg:text-2xl leading-none truncate">{formatRupiah(totalCollectedMonth)}</Text.Amount>
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
                                className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm font-medium text-gray-900"
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
                                <Text.Label className="!text-brand-600 !normal-case !tracking-normal">Sinkron Data Kas</Text.Label>
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
                            <Text.Label className="!text-gray-600 !normal-case !tracking-normal">{isExporting ? 'Exporting...' : 'Export'}</Text.Label>
                        </button>
                    </div>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-left"><Text.Label className="!text-slate-700 !text-[12px] !font-semibold">Tanggal Bayar & Kategori</Text.Label></th>
                                <th className="p-4 text-left"><Text.Label className="!text-slate-700 !text-[12px] !font-semibold">Warga Pembayar</Text.Label></th>
                                <th className="p-4 text-left"><Text.Label className="!text-slate-700 !text-[12px] !font-semibold">Periode Terbayar</Text.Label></th>
                                <th className="p-4 text-right"><Text.Label className="!text-slate-700 !text-[12px] !font-semibold">Nominal (Rp)</Text.Label></th>
                                <th className="p-4 text-center"><Text.Label className="!text-slate-700 !text-[12px] !font-semibold">Status</Text.Label></th>
                                <th className="p-4 text-center"><Text.Label className="!text-slate-700 !text-[12px] !font-semibold">Aksi</Text.Label></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {!iuranServerData && isLoading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-20 text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                            <Text.Label className="!text-brand-600">Memuat database...</Text.Label>
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
                                        <Text.H2 className="!text-gray-900">Data Tidak Ditemukan</Text.H2>
                                        <Text.Caption className="!mt-1 italic">Belum ada riwayat pembayaran yang cocok dengan filter aktif.</Text.Caption>
                                    </td>
                                </tr>
                            ) : (
                                filteredIuran.map((iuran) => (
                                    <tr key={iuran.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="p-4 whitespace-nowrap">
                                            <Text.H2 className="!text-slate-900">{dateUtils.toDisplay(iuran.tanggal_bayar)}</Text.H2>
                                            <Text.Caption className="italic mt-0.5 !text-[10px] uppercase">ID: {formatFormalId(iuran.tanggal_bayar, iuran.id)}</Text.Caption>
                                            <Text.Label className="!text-[10px] !text-brand-600 font-bold tracking-normal mt-1 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                                {toTitleCase(iuran.kategori || 'Iuran Bulanan')}
                                            </Text.Label>
                                        </td>
                                        <td className="p-4">
                                            <Text.H2 className="!text-slate-900 group-hover:text-brand-600 transition-colors">{toTitleCase(iuran.warga?.nama || 'Warga Terhapus')}</Text.H2>
                                            <Text.Caption className="font-mono mt-0.5 !text-[10px]">{iuran.warga?.nik}</Text.Caption>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                {iuran.periode_bulan.map(b => (
                                                    <Text.Label key={b} className={`!px-2 !py-0.5 rounded-full !text-[10px] shadow-sm border ${
                                                    iuran.status === 'VERIFIED' ? '!bg-emerald-50 !text-emerald-600 border-emerald-100' :
                                                        iuran.status === 'PENDING' ? '!bg-amber-50 !text-amber-600 border-amber-100' :
                                                        '!bg-rose-50 border-rose-200 !text-rose-600'
                                                    }`}>
                                                        {getMonthName(b).substring(0, 3).toUpperCase()} {iuran.periode_tahun}
                                                    </Text.Label>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Text.Amount className="!text-slate-900">
                                                {formatRupiah(iuran.nominal)}
                                            </Text.Amount>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-center gap-1">
                                                {iuran.status === 'VERIFIED' ? (
                                                    <Text.Label className="!px-3 !py-1.5 rounded-full !bg-emerald-50 !text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm !font-bold">
                                                        <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                        Lunas
                                                    </Text.Label>
                                                ) : iuran.status === 'REJECTED' ? (
                                                    <div className="flex flex-col items-center">
                                                        <Text.Label className="!px-3 !py-1.5 rounded-full !bg-rose-50 !text-rose-600 border border-rose-100 flex items-center gap-1.5 shadow-sm">
                                                            <X weight="bold" className="w-3.5 h-3.5" />
                                                            DITOLAK
                                                        </Text.Label>
                                                        {iuran.alasan_penolakan && (
                                                            <Text.Caption className="!text-rose-400 mt-1 max-w-[120px] text-center italic">{iuran.alasan_penolakan}</Text.Caption>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Text.Label className="!px-3 !py-1.5 rounded-full !bg-amber-50 !text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm animate-pulse">
                                                        <CircleNotch weight="bold" className="w-3.5 h-3.5 animate-spin" />
                                                        PENDING
                                                    </Text.Label>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                                {iuran.status === 'PENDING' && (
                                                    <HasPermission module="Iuran Warga" action="Ubah">
                                                        <button
                                                            onClick={() => setVerifyingId(iuran.id)}
                                                            className="p-2 bg-brand-600 text-white rounded-[10px] hover:bg-brand-700 transition-all shadow-premium"
                                                            title="Verifikasi Pembayaran"
                                                        >
                                                            <CheckCircle weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                )}
                                                {iuran.status === 'REJECTED' && (
                                                    <button
                                                        onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                        className="p-2 bg-amber-500 text-white rounded-[10px] hover:bg-amber-600 transition-all shadow-premium"
                                                        title="Ajukan Ulang"
                                                    >
                                                        <PencilSimple weight="bold" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {(iuran.status === 'PENDING' || iuran.status === 'VERIFIED') && (
                                                    <HasPermission module="Iuran Warga" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                            className="p-2 text-slate-500 bg-slate-50 hover:text-brand-600 hover:bg-brand-50 rounded-[10px] transition-all"
                                                            title="Ubah Data"
                                                        >
                                                            <PencilSimple weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                )}
                                                {iuran.url_bukti && (
                                                    <button
                                                        onClick={() => setViewProofUrl(iuran.url_bukti || null)}
                                                        className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-[10px] transition-all"
                                                        title="Lihat Bukti Bayar"
                                                    >
                                                        <Eye weight="bold" className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <HasPermission module="Iuran Warga" action="Hapus">
                                                    <button
                                                        onClick={() => handleDelete(iuran.id)}
                                                        className="p-2 text-slate-400 bg-slate-50 hover:text-red-500 hover:bg-red-50 rounded-[10px] transition-all"
                                                        title="Hapus / Batalkan"
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
                    {(!iuranServerData && isLoading) ? (
                        <div className="py-20 text-center animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <Text.Caption className="!font-bold !uppercase !tracking-widest">Sinkronisasi...</Text.Caption>
                        </div>
                    ) : filteredIuran.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <CheckCircle weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <Text.H2 className="!text-slate-900">Belum Ada Iuran</Text.H2>
                                <Text.Caption className="!mt-1 italic">Riwayat pembayaran iuran akan muncul di sini</Text.Caption>
                            </div>
                        </div>
                    ) : (() => {
                        // Grouping logic for mobile cards
                        const grouped = Object.values(
                            filteredIuran.reduce((acc, current) => {
                                const wargaId = current.warga_id;
                                if (!acc[wargaId]) {
                                    acc[wargaId] = {
                                        latest: current,
                                        allPaidMonths: new Set<number>(),
                                        history: []
                                    };
                                }
                                current.periode_bulan.forEach(m => acc[wargaId].allPaidMonths.add(m));
                                acc[wargaId].history.push(current);
                                if (new Date(current.tanggal_bayar) > new Date(acc[wargaId].latest.tanggal_bayar)) {
                                    acc[wargaId].latest = current;
                                }
                                return acc;
                            }, {} as Record<string, { latest: IuranWithWarga, allPaidMonths: Set<number>, history: IuranWithWarga[] }>)
                        ).sort((a, b) => new Date(b.latest.tanggal_bayar).getTime() - new Date(a.latest.tanggal_bayar).getTime());

                        return grouped.map(({ latest: iuran, allPaidMonths, history }) => {
                            const expectedMonthCount = filterYear === currentYearNum.toString() || filterYear === '' ? currentMonth : 12;
                            let isFullyPaid = true;
                            let hasPending = false;
                            
                            for (const h of history) {
                                if (h.status === 'PENDING') hasPending = true;
                            }
                            
                            const verifiedMonths = new Set(history.filter(h => h.status === 'VERIFIED').flatMap(h => h.periode_bulan));
                            for (let i = 1; i <= expectedMonthCount; i++) {
                                if (!verifiedMonths.has(i)) {
                                    isFullyPaid = false;
                                    break;
                                }
                            }
                            
                            const overallStatus = hasPending ? 'PENDING' : isFullyPaid ? 'VERIFIED' : history.some(h => h.status === 'REJECTED') ? 'REJECTED' : 'UNPAID';

                            return (
                            <div key={iuran.warga_id} className="bg-white border border-slate-100 rounded-[20px] shadow-premium overflow-hidden flex flex-col transition-all duration-500 hover:shadow-xl active:scale-[0.99]">
                                 <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[16px] bg-brand-50 text-brand-600 flex flex-col items-center justify-center border border-brand-100/50 shadow-inner">
                                                <Text.Caption className="!text-[9px] !font-black leading-none">{new Date(iuran.tanggal_bayar).toLocaleDateString('id-ID', { month: 'short' })}</Text.Caption>
                                                <Text.Amount className="!text-lg leading-none mt-1">{new Date(iuran.tanggal_bayar).getDate()}</Text.Amount>
                                            </div>
                                            <div>
                                                <Text.H2 className="!font-bold uppercase !tracking-tight line-clamp-1">{iuran.warga?.nama || 'Warga Terhapus'}</Text.H2>
                                                <Text.Caption className="italic mt-0.5 !text-[10px] !tracking-normal">ID: {formatFormalId(iuran.tanggal_bayar, iuran.id)}</Text.Caption>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Text.Amount className="!text-brand-600 block !tracking-tight">+{formatRupiah(iuran.nominal)}</Text.Amount>
                                            <Text.Label className="!text-brand-500 !text-[9px] !tracking-tight !font-bold">Iuran Warga</Text.Label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            {overallStatus === 'VERIFIED' ? (
                                                <Text.Label className="!px-3 !py-1.5 rounded-full !bg-emerald-600 !text-white flex items-center gap-1.5 shadow-premium">
                                                    <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                    Lunas
                                                </Text.Label>
                                            ) : overallStatus === 'REJECTED' ? (
                                                <Text.Label className="!px-3 !py-1.5 rounded-full !bg-rose-50 !text-rose-600 border border-rose-100 flex items-center gap-1.5 shadow-sm">
                                                    <X weight="bold" className="w-3.5 h-3.5" />
                                                    Ditolak
                                                </Text.Label>
                                            ) : overallStatus === 'PENDING' ? (
                                                <Text.Label className="!px-3 !py-1.5 rounded-full !bg-amber-50 !text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm animate-pulse">
                                                    <CircleNotch weight="bold" className="w-3.5 h-3.5 animate-spin" />
                                                    Menunggu
                                                </Text.Label>
                                            ) : (
                                                <Text.Label className="!px-3 !py-1.5 rounded-full !bg-slate-50 !text-slate-600 border border-slate-200 flex items-center gap-1.5 shadow-sm">
                                                    Belum Lunas
                                                </Text.Label>
                                            )}
                                            
                                            {!isWarga && (
                                                <div className="flex items-center gap-1 ml-1">
                                                    <HasPermission module="Iuran Warga" action="Ubah">
                                                        <button 
                                                            onClick={() => navigate(`/iuran/edit/${iuran.id}`)}
                                                            className="p-2 text-slate-400 hover:text-brand-600 transition-all active:scale-95 bg-slate-50 rounded-[10px]"
                                                        >
                                                            <PencilSimple weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Iuran Warga" action="Hapus">
                                                        <button 
                                                            onClick={() => handleDelete(iuran.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 transition-all active:scale-95 bg-slate-50 rounded-[10px]"
                                                        >
                                                            <Trash weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            )}

                                            {iuran.url_bukti && (
                                                <button
                                                    onClick={() => setViewProofUrl(iuran.url_bukti || null)}
                                                    className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-[10px] transition-all ml-1 shadow-sm"
                                                >
                                                    <ImageIcon weight="bold" className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => toggleHistory(iuran.warga_id)}
                                            className="px-3 py-1.5 bg-brand-50 text-brand-600 rounded-full hover:bg-brand-100 transition-colors"
                                        >
                                            <Text.Label className="!text-inherit !normal-case !tracking-normal">{expandedHistoryIds.includes(iuran.warga_id) ? 'Tutup' : 'Lihat Riwayat'}</Text.Label>
                                        </button>
                                    </div>

                                    {/* History Panel */}
                                    {expandedHistoryIds.includes(iuran.warga_id) && (
                                        <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 animate-fade-in shadow-inner">
                                            <Text.Label className="!text-slate-400 mb-2">Riwayat Pembayaran {filterYear}</Text.Label>
                                            <div className="space-y-2">
                                                {history.map((h) => (
                                                    <div key={h.id} className="flex justify-between items-center text-[10px] border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                                        <div>
                                                            <Text.Body className="!font-medium !text-slate-700 !text-xs">{dateUtils.toDisplay(h.tanggal_bayar)}</Text.Body>
                                                            <Text.Caption className="!text-slate-500 !font-medium">Bulan: {h.periode_bulan.map(m => getMonthName(m).substring(0, 3)).join(', ')}</Text.Caption>
                                                        </div>
                                                        <div className="text-right">
                                                            <Text.Amount className="!text-slate-900 !text-sm">{formatRupiah(h.nominal)}</Text.Amount>
                                                            {h.status !== 'VERIFIED' && (
                                                                <Text.Label className={`!font-bold ${h.status === 'REJECTED' ? '!text-rose-500' : '!text-amber-500'}`}>
                                                                    {h.status}
                                                                </Text.Label>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-slate-50/50 rounded-[14px] border border-slate-100 p-4 mb-4">
                                        <Text.Label className="block mb-3 !text-[9px] !text-slate-500 !tracking-tight">Status Terbayar ({iuran.periode_tahun})</Text.Label>
                                        <div className="grid grid-cols-6 gap-1.5">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                                const isPaid = allPaidMonths.has(month);
                                                const htx = history.find(h => h.periode_bulan.includes(month));
                                                const status = htx?.status || 'UNPAID';
                                                
                                                return (
                                                    <div 
                                                        key={month} 
                                                        className={`flex aspect-square items-center justify-center rounded-[6px] border text-[8px] font-bold transition-all duration-300
                                                            ${isPaid 
                                                                ? (status === 'VERIFIED' ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' 
                                                                 : status === 'PENDING' ? 'bg-amber-400 text-white border-amber-500 shadow-sm'
                                                                 : 'bg-rose-500 text-white border-rose-600 shadow-sm')
                                                                : 'bg-white text-slate-300 border-slate-100'
                                                            }`}
                                                    >
                                                        {getMonthName(month).substring(0, 3)}
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
                                                    Verifikasi
                                                </button>
                                            </HasPermission>
                                        )}
                                        <div className="flex gap-2">
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                            );
                        });
                    })()}
                </div>
            </div>

            {/* PROOF MODAL */}
            {
                viewProofUrl && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden relative animate-zoom-in">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <Text.H2 className="!flex !items-center !gap-2">
                                    <ImageIcon weight="duotone" className="text-brand-600" />
                                    Bukti Pembayaran Iuran
                                </Text.H2>
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
                            <Text.H2 className="!flex !items-center !gap-2">
                                {isRejecting ? 'Alasan Penolakan' : 'Verifikasi Pembayaran'}
                            </Text.H2>
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
                                        <Text.Body className="!font-bold !text-gray-500">Konfirmasi status iuran ini?</Text.Body>
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
            {/* MOBILE FAB */}
            <HasPermission module="Iuran Warga" action="Buat">
                <button
                    onClick={() => navigate('/iuran/baru')}
                    className="sm:hidden fixed bottom-24 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center hover:bg-brand-700 transition-all active:scale-95 z-[50] border-4 border-white"
                >
                    <Plus weight="bold" size={24} />
                </button>
            </HasPermission>
        </div>
    );
}
