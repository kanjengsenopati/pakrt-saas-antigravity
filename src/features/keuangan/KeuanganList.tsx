import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { keuanganService } from '../../services/keuanganService';
import { useAuth } from '../../contexts/AuthContext';
import { Keuangan } from '../../database/db';
import { 
    Plus, 
    Funnel, 
    Trash, 
    ArrowDownRight,
    Image as ImageIcon,
    X
} from '@phosphor-icons/react';
import { formatRupiah } from '../../utils/currency';
import { HasPermission } from '../../components/auth/HasPermission';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';

const getMonthNumber = (monthName: string) => {
    const months = {
        'JANUARI': 1, 'PEBRUARI': 2, 'FEBRUARI': 2, 'MARET': 3, 'APRIL': 4, 'MEI': 5, 'JUNI': 6,
        'JULI': 7, 'AGUSTUS': 8, 'SEPTEMBER': 9, 'OKTOBER': 10, 'NOPEMBER': 11, 'NOVEMBER': 11, 'DESEMBER': 12,
        'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'JUN': 6,
        'JUL': 7, 'AGU': 8, 'SEP': 9, 'OKT': 10, 'NOV': 11, 'DES': 12
    };
    return months[monthName.toUpperCase() as keyof typeof months] || 0;
};

const getMonthNameShort = (monthNumber: number) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString('id-ID', { month: 'short' }).toUpperCase();
};

const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function KeuanganList() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();
    const { user } = useAuth();
    const isWarga = user?.role === 'WARGA';

    const [transactions, setTransactions] = useState<Keuangan[]>([]);
    const [summary, setSummary] = useState({ kasMasuk: 0, kasKeluar: 0, saldo: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProof, setSelectedProof] = useState<string | null>(null);
    const [expandedWargaNames, setExpandedWargaNames] = useState<string[]>([]);

    const toggleHistory = (wargaNama: string) => {
        setExpandedWargaNames(prev => 
            prev.includes(wargaNama) ? prev.filter(n => n !== wargaNama) : [...prev, wargaNama]
        );
    };


    // Data loading handled by Tenant changes
    useEffect(() => {
        if (currentTenant) {
            loadData();
        }
    }, [currentTenant, currentScope]);

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const data = await keuanganService.getAll(currentTenant.id, currentScope);
            setTransactions(data.items || []);

            const sum = await keuanganService.getSummary(currentTenant.id, currentScope);
            setSummary(sum);
        } catch (error) {
            console.error("Failed to load keuangan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
            await keuanganService.delete(id);
            loadData();
        }
    };

    const filteredTransactions = transactions.filter(t =>
        t.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kategori.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filtered transactions data
    const formatFormalId = (dateString: string, itemId: string) => {
        const d = new Date(dateString);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const shortId = itemId.substring(0, 3).toLowerCase();
        return `${yyyy}${mm}${dd}-${shortId}`;
    };

    /**
     * Parses the keterangan field into a display-ready object.
     * Handles both new format: "[Nama Warga] Kategori — Bulan Tahun | ref:id"
     * and legacy formats gracefully.
     */
    const parseKeterangan = (keterangan: string) => {
        // Strip backend ref tag first
        const cleaned = keterangan.replace(/\s*\|\s*ref:[a-f0-9-]+$/i, '').trim();

        // New format: "[Nama Warga] Kategori — Period"
        const newFormatMatch = cleaned.match(/^\[([^\]]+)\]\s+(.+?)\s+—\s+(.+)$/);
        if (newFormatMatch) {
            const periodStr = newFormatMatch[3]; // e.g. "April, Mei 2026"
            const yearMatch = periodStr.match(/\d{4}$/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
            const monthsStr = periodStr.replace(/\d{4}$/, '').trim();
            const monthParts = monthsStr.split(',').map(m => m.trim().toUpperCase().replace(/[^A-Z]/g, ''));
            const months = monthParts.map(getMonthNumber).filter(m => m > 0);

            return {
                wargaNama: newFormatMatch[1],
                label: newFormatMatch[2],
                period: periodStr,
                months,
                year,
                isIuran: true,
                raw: cleaned
            };
        }

        // [AUTO] format
        if (cleaned.startsWith('[AUTO]')) {
            return {
                wargaNama: null,
                label: toTitleCase(cleaned.replace('[AUTO] ', '').split('|')[0].trim()),
                period: null,
                isIuran: false,
                raw: cleaned
            };
        }

        // Plain text fallback
        return {
            wargaNama: null,
            label: toTitleCase(cleaned.split('|')[0].trim()),
            period: null,
            isIuran: false,
            raw: cleaned
        };
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">Kas Masuk & Keluar</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium flex items-center gap-1.5 tracking-normal">
                        Pencatatan keuangan operasional untuk <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {!isWarga && (
                        <HasPermission module="Buku Kas / Transaksi" action="Buat">
                            <button
                                onClick={() => navigate('/keuangan/baru')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[14px] font-normal transition-all shadow-sm hover-lift active-press"
                            >
                                <Plus weight="bold" />
                                <span>Catat Transaksi</span>
                            </button>
                        </HasPermission>
                    )}
                </div>
            </div>
            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 -mt-2">
                {/* KAS MASUK */}
                <div className="bg-white py-3 px-2 sm:px-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kas Masuk</p>
                        <p className="text-[11px] sm:text-lg font-normal text-slate-900 leading-none truncate tabular-nums">{formatRupiah(summary.kasMasuk)}</p>
                    </div>
                </div>

                {/* KAS KELUAR */}
                <div className="bg-white py-3 px-2 sm:px-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-red-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kas Keluar</p>
                        <p className="text-[11px] sm:text-lg font-normal text-slate-900 leading-none truncate tabular-nums">{formatRupiah(summary.kasKeluar)}</p>
                    </div>
                </div>

                {/* SALDO AKHIR */}
                <div className={`py-3 px-2 sm:px-4 rounded-2xl border shadow-lg relative overflow-hidden group transition-all duration-300 hover:shadow-xl ${summary.saldo >= 0 ? 'bg-brand-600 border-brand-500' : 'bg-red-600 border-red-500'}`}>
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/5 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <p className="text-[10px] sm:text-xs font-bold text-white/60 uppercase tracking-widest mb-1.5">Saldo</p>
                        <p className="text-[11px] sm:text-lg font-normal text-white leading-none truncate tabular-nums">{formatRupiah(summary.saldo)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
                        <Funnel className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-500 tracking-normal">
                            <tr>
                                <th className="p-3">Tanggal</th>
                                <th className="p-3">Kategori & Keterangan</th>
                                <th className="p-3 text-right">Masuk (Rp)</th>
                                <th className="p-3 text-right">Keluar (Rp)</th>
                                <th className="p-3 text-center">Bukti</th>
                                <th className="p-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                        Memuat data transaksi...
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-gray-500">
                                        <div className="flex justify-center mb-3">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                                <ArrowDownRight weight="duotone" className="w-8 h-8 text-slate-300" />
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900">Data Tidak Ditemukan</p>
                                        <p className="text-sm text-slate-400 mt-1 tracking-normal">Belum ada riwayat transaksi yang cocok dengan filter aktif.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-brand-50/20 transition-colors group border-b border-slate-50 last:border-0">
                                        <td className="p-3 whitespace-nowrap">
                                            <div className="font-bold text-slate-800 text-[14px]">{dateUtils.toDisplay(trx.tanggal)}</div>
                                            <div className="text-sm text-slate-500 font-medium tracking-normal mt-0.5 font-mono italic">ID: {formatFormalId(trx.tanggal, trx.id)}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className={`text-sm font-semibold tracking-normal mb-0.5 ${trx.tipe === 'pemasukan' ? 'text-brand-600' : 'text-red-600'}`}>
                                                {toTitleCase(trx.kategori)}
                                            </div>
                                            {(() => {
                                                const parsed = parseKeterangan(trx.keterangan);
                                                return (
                                                    <div className="space-y-0.5">
                                                        {parsed.isIuran && parsed.wargaNama ? (
                                                            <>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-100">
                                                                        {parsed.wargaNama}
                                                                    </span>
                                                                </div>
                                                                <div className="text-[12px] font-medium text-slate-500">
                                                                    {parsed.period}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-[14px] font-normal text-slate-800 max-w-xs truncate" title={trx.keterangan}>
                                                                {parsed.label}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-3 text-right whitespace-nowrap">
                                            <span className={`text-[14px] font-normal ${trx.tipe === 'pemasukan' ? 'text-brand-600' : 'text-slate-200'}`}>
                                                {trx.tipe === 'pemasukan' ? formatRupiah(trx.nominal) : 'Rp 0'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right whitespace-nowrap">
                                            <span className={`text-[14px] font-normal ${trx.tipe === 'pengeluaran' ? 'text-red-600' : 'text-slate-200'}`}>
                                                {trx.tipe === 'pengeluaran' ? formatRupiah(trx.nominal) : 'Rp 0'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex justify-center">
                                                {trx.url_bukti ? (
                                                    <button
                                                        onClick={() => setSelectedProof(trx.url_bukti || null)}
                                                        className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors shadow-sm bg-white border border-brand-100"
                                                        title="Lihat Bukti"
                                                    >
                                                        <ImageIcon weight="bold" className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <span className="w-8 h-8 flex items-center justify-center text-slate-200">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!isWarga && (
                                                    <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(trx.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-red-100"
                                                            title="Hapus Transaksi"
                                                        >
                                                            <Trash weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                )}
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
                    {isLoading ? (
                        <div className="py-20 text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Sinkronisasi...</span>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <ArrowDownRight weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">Belum Ada Transaksi</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Riwayat transaksi anda akan muncul di sini</p>
                            </div>
                        </div>
                    ) : (() => {
                        // Hybrid Grouping Algorithm
                        const groupedOutput: any[] = [];
                        const citizenGroups: Record<string, any> = {};

                        filteredTransactions.forEach(trx => {
                            const parsed = parseKeterangan(trx.keterangan);
                            if (parsed.isIuran && parsed.wargaNama) {
                                const key = parsed.wargaNama;
                                if (!citizenGroups[key]) {
                                    citizenGroups[key] = {
                                        type: 'citizen-group',
                                        wargaNama: parsed.wargaNama,
                                        latest: trx,
                                        allPaidMonths: new Set<number>(),
                                        history: []
                                    };
                                    groupedOutput.push(citizenGroups[key]);
                                }
                                (parsed.months || []).forEach(m => citizenGroups[key].allPaidMonths.add(m));
                                citizenGroups[key].history.push({ trx, parsed });
                                if (new Date(trx.tanggal) > new Date(citizenGroups[key].latest.tanggal)) {
                                    citizenGroups[key].latest = trx;
                                }
                            } else {
                                groupedOutput.push({ type: 'transaction', data: trx, parsed });
                            }
                        });

                        // Sort by latest date across all types
                        const sortedOutput = groupedOutput.sort((a, b) => {
                            const dateA = a.type === 'citizen-group' ? new Date(a.latest.tanggal).getTime() : new Date(a.data.tanggal).getTime();
                            const dateB = b.type === 'citizen-group' ? new Date(b.latest.tanggal).getTime() : new Date(b.data.tanggal).getTime();
                            return dateB - dateA;
                        });

                        return sortedOutput.map((item) => {
                            if (item.type === 'citizen-group') {
                                const { wargaNama, latest: trx, allPaidMonths, history } = item;
                                const parsed = parseKeterangan(trx.keterangan);
                                const isExpanded = expandedWargaNames.includes(wargaNama);

                                return (
                                    <div key={`citizen-${wargaNama}`} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex flex-col items-center justify-center border border-brand-100 shadow-inner">
                                                        <span className="text-[8px] font-bold leading-none uppercase">{new Date(trx.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                        <span className="text-sm font-bold leading-none mt-0.5">{new Date(trx.tanggal).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-800 text-[13px] uppercase tracking-tight leading-tight mb-1">{toTitleCase(wargaNama)}</h3>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase italic">ID: {formatFormalId(trx.tanggal, trx.id)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-base font-bold text-brand-600 tabular-nums tracking-tight">
                                                        +{formatRupiah(trx.nominal)}
                                                    </div>
                                                    <p className="text-[9px] text-brand-500 font-bold uppercase tracking-tight mt-0.5">Iuran Warga</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                                        KAS MASUK
                                                    </span>
                                                    {trx.url_bukti && (
                                                        <button
                                                            onClick={() => setSelectedProof(trx.url_bukti || null)}
                                                            className="p-1.5 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all shadow-sm border border-brand-100/30"
                                                            title="Lihat Bukti"
                                                        >
                                                            <ImageIcon weight="bold" className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => toggleHistory(wargaNama)}
                                                    className="text-[10px] font-bold text-brand-600 uppercase tracking-wider hover:underline"
                                                >
                                                    {isExpanded ? 'Tutup Riwayat' : 'Lihat Riwayat'}
                                                </button>
                                            </div>

                                            {/* Expandable History */}
                                            {isExpanded && (
                                                <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 animate-fade-in">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Detail Kas Masuk Iuran</p>
                                                    <div className="space-y-2">
                                                        {history.map((h: any) => (
                                                            <div key={h.trx.id} className="flex justify-between items-center text-[10px] border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                                                <div>
                                                                    <div className="font-bold text-slate-700">{dateUtils.toDisplay(h.trx.tanggal)}</div>
                                                                    <div className="text-slate-400 font-medium">Periode: {h.parsed.period}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-brand-600">+{formatRupiah(h.trx.nominal)}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 mb-4">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 leading-none">Status Terbayar ({parsed.year || ''})</p>
                                                <div className="grid grid-cols-6 gap-1.5">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                                        const isPaid = allPaidMonths.has(month);
                                                        return (
                                                            <div 
                                                                key={month} 
                                                                className={`flex flex-col items-center justify-center p-1 rounded-lg border text-[10px] font-bold transition-all duration-300 shadow-sm
                                                                    ${isPaid 
                                                                        ? 'bg-brand-600 text-white border-brand-700' 
                                                                        : 'bg-white text-slate-200 border-slate-100'
                                                                    }`}
                                                            >
                                                                {getMonthNameShort(month)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex justify-end items-center pt-3 border-t border-slate-50 gap-2">
                                                {!isWarga && (
                                                    <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(trx.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-transparent shadow-sm"
                                                            title="Hapus"
                                                        >
                                                            <Trash weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                const trx = item.data;
                                const parsed = item.parsed;
                                return (
                                    <div key={trx.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center border shadow-inner ${trx.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        <span className="text-[8px] font-bold leading-none uppercase">{new Date(trx.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                        <span className="text-sm font-bold leading-none mt-0.5">{new Date(trx.tanggal).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className={`font-bold text-[13px] uppercase tracking-tight leading-tight mb-1 ${trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>{toTitleCase(trx.kategori)}</h3>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase italic">ID: {formatFormalId(trx.tanggal, trx.id)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={`text-base font-bold tabular-nums tracking-tight ${trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {trx.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 mb-3">
                                                <div className="text-[13px] font-medium text-slate-700 leading-relaxed">
                                                    {parsed.label ? <span className="pl-1 uppercase tracking-tight">{parsed.label}</span> : <span className="text-slate-300 italic font-medium tracking-normal text-xs uppercase pl-1">Tanpa Uraian</span>}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-slate-50 gap-2">
                                                <div className="flex items-center gap-2">
                                                    {trx.tipe === 'pemasukan' ? (
                                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center shadow-sm uppercase tracking-wider">KAS MASUK</span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center shadow-sm uppercase tracking-wider">KAS KELUAR</span>
                                                    )}
                                                    {trx.url_bukti && (
                                                        <button
                                                            onClick={() => setSelectedProof(trx.url_bukti || null)}
                                                            className="p-1.5 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all shadow-sm border border-brand-100/30"
                                                            title="Lihat Bukti"
                                                        >
                                                            <ImageIcon weight="bold" className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                {!isWarga && (
                                                    <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(trx.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-transparent shadow-sm"
                                                            title="Hapus"
                                                        >
                                                            <Trash weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        });
                    })()}
                </div>
            </div>

            {/* PROOF MODAL */}
            {selectedProof && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">Bukti Transaksi</h3>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 flex justify-center bg-gray-100 max-h-[80vh] overflow-y-auto">
                            <img
                                src={getFullUrl(selectedProof)}
                                alt="Bukti Transaksi"
                                className="max-w-full h-auto rounded shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
