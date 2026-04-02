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
    PencilSimple,
    ArrowDownRight,
    Image as ImageIcon,
    X
} from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
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

    const formatFormalId = (dateString: string, itemId: string) => {
        const d = new Date(dateString);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const shortId = itemId.substring(0, 3).toLowerCase();
        return `${yyyy}${mm}${dd}-${shortId}`;
    };

    const parseKeterangan = (keterangan: string) => {
        const cleaned = keterangan.replace(/\s*\|\s*ref:[a-f0-9-]+$/i, '').trim();
        const newFormatMatch = cleaned.match(/^\[([^\]]+)\]\s+(.+?)\s+—\s+(.+)$/);
        if (newFormatMatch) {
            const periodStr = newFormatMatch[3]; 
            const yearMatch = periodStr.match(/\d{4}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
            const monthsStr = periodStr.replace(/\d{4}/, '').trim();
            const monthParts = monthsStr.split(/[,\s]+/)
                .map(m => m.trim().toUpperCase().replace(/[^A-Z]/g, ''))
                .filter(m => m.length > 0);
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

        if (cleaned.toUpperCase().startsWith('[AUTO]')) {
            return {
                wargaNama: null,
                label: toTitleCase(cleaned.replace(/\[AUTO\]\s*/i, '').split('|')[0].trim()),
                period: null,
                isIuran: false,
                raw: cleaned
            };
        }

        return {
            wargaNama: null,
            label: toTitleCase(cleaned.split('|')[0].trim()),
            period: null,
            isIuran: false,
            raw: cleaned
        };
    };

    return (
        <div className="space-y-8 animate-fade-in px-5 md:px-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Text.H1>Kas Masuk & Keluar</Text.H1>
                    <Text.Body className="mt-1 flex items-center gap-1.5">
                        Pencatatan keuangan operasional untuk <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-[8px] border border-brand-100">{currentScope}</span>
                    </Text.Body>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {!isWarga && (
                        <HasPermission module="Buku Kas / Transaksi" action="Buat">
                            <button
                                onClick={() => navigate('/keuangan/baru')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] text-sm font-semibold transition-all shadow-premium hover-lift active-press"
                            >
                                <Plus weight="bold" />
                                <span>Catat Transaksi</span>
                            </button>
                        </HasPermission>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4 -mt-2">
                <div className="bg-white py-4 px-4 rounded-[20px] border border-slate-100 shadow-premium relative overflow-hidden transition-all duration-300 border-l-[6px] border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <Text.Label className="mb-2 !tracking-tight !text-slate-500">Kas Masuk</Text.Label>
                        <Text.Amount className="text-sm sm:text-xl lg:text-2xl leading-none truncate">{formatRupiah(summary.kasMasuk)}</Text.Amount>
                    </div>
                </div>

                <div className="bg-white py-4 px-4 rounded-[20px] border border-slate-100 shadow-premium relative overflow-hidden transition-all duration-300 border-l-[6px] border-l-red-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <Text.Label className="mb-2 !tracking-tight !text-slate-500">Kas Keluar</Text.Label>
                        <Text.Amount className="text-sm sm:text-xl lg:text-2xl leading-none truncate">{formatRupiah(summary.kasKeluar)}</Text.Amount>
                    </div>
                </div>

                <div className={`py-4 px-4 rounded-[20px] border shadow-premium relative overflow-hidden transition-all duration-300 ${summary.saldo >= 0 ? 'bg-brand-600 border-brand-500' : 'bg-red-600 border-red-500'}`}>
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <Text.Label className="!text-white opacity-90 mb-2 !tracking-tight">Saldo</Text.Label>
                        <Text.Amount className="!text-white text-sm sm:text-xl lg:text-2xl leading-none truncate">{formatRupiah(summary.saldo)}</Text.Amount>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[20px] shadow-premium border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/30">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-4 py-2.5 border border-slate-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm font-medium"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-[12px] hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center shadow-sm">
                        <Funnel className="w-4 h-4" />
                        <Text.Label className="!text-slate-700 !tracking-normal">Filter</Text.Label>
                    </button>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-4"><Text.Label className="!text-slate-400">Tanggal</Text.Label></th>
                                <th className="p-4"><Text.Label className="!text-slate-400">Kategori & Keterangan</Text.Label></th>
                                <th className="p-4 text-right"><Text.Label className="!text-slate-400">Masuk</Text.Label></th>
                                <th className="p-4 text-right"><Text.Label className="!text-slate-400">Keluar</Text.Label></th>
                                <th className="p-4 text-center"><Text.Label className="!text-slate-400">Bukti</Text.Label></th>
                                <th className="p-4 text-center"><Text.Label className="!text-slate-400">Aksi</Text.Label></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                            <Text.Caption className="font-bold uppercase tracking-widest">Sinkronisasi Data...</Text.Caption>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-20 h-20 bg-slate-50 rounded-[20px] flex items-center justify-center border-2 border-dashed border-slate-200">
                                                <ArrowDownRight weight="duotone" className="w-10 h-10 text-slate-300" />
                                            </div>
                                            <div>
                                                <Text.H2>Data Tidak Ditemukan</Text.H2>
                                                <Text.Caption className="mt-1">Belum ada riwayat transaksi yang tersedia.</Text.Caption>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="p-4 whitespace-nowrap">
                                            <Text.H2 className="!text-slate-900">{dateUtils.toDisplay(trx.tanggal)}</Text.H2>
                                            <Text.Caption className="italic mt-0.5">ID: {formatFormalId(trx.tanggal, trx.id)}</Text.Caption>
                                        </td>
                                        <td className="p-4">
                                            <Text.Label className={`block mb-1.5 !tracking-normal ${trx.tipe === 'pemasukan' ? '!text-brand-600' : '!text-red-500'}`}>
                                                {toTitleCase(trx.kategori)}
                                            </Text.Label>
                                            {(() => {
                                                const parsed = parseKeterangan(trx.keterangan);
                                                return (
                                                    <div className="space-y-1">
                                                        {parsed.isIuran && parsed.wargaNama ? (
                                                            <>
                                                                <span className="inline-flex px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-[11px] font-bold border border-brand-100/50 uppercase tracking-tight">
                                                                    {parsed.wargaNama}
                                                                </span>
                                                                <Text.Caption className="block font-medium">{parsed.period}</Text.Caption>
                                                            </>
                                                        ) : (
                                                            <Text.Body className="truncate max-w-xs !text-slate-800" title={trx.keterangan}>
                                                                {parsed.label}
                                                            </Text.Body>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            {trx.tipe === 'pemasukan' ? (
                                                <Text.Amount className="!text-brand-600 font-bold">{formatRupiah(trx.nominal)}</Text.Amount>
                                            ) : (
                                                <Text.Amount className="!text-slate-200">Rp 0</Text.Amount>
                                            )}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            {trx.tipe === 'pengeluaran' ? (
                                                <Text.Amount className="!text-red-500 font-bold">{formatRupiah(trx.nominal)}</Text.Amount>
                                            ) : (
                                                <Text.Amount className="!text-slate-200">Rp 0</Text.Amount>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                {trx.url_bukti ? (
                                                    <button
                                                        onClick={() => setSelectedProof(trx.url_bukti || null)}
                                                        className="p-2.5 text-brand-600 bg-white hover:bg-brand-50 rounded-[12px] border border-slate-200 hover:border-brand-200 transition-all shadow-premium"
                                                        title="Lihat Bukti"
                                                    >
                                                        <ImageIcon weight="bold" className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <Text.Caption className="opacity-30">—</Text.Caption>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!isWarga && (
                                                    <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(trx.id)}
                                                            className="p-2.5 text-red-500 bg-white hover:bg-red-50 rounded-[12px] border border-slate-200 hover:border-red-200 transition-all shadow-premium"
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
                <div className="md:hidden space-y-4 p-5 bg-slate-50/30">
                    {isLoading ? (
                        <div className="py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                <Text.Caption className="font-bold uppercase tracking-widest">Sinkronisasi...</Text.Caption>
                            </div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[20px] p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[20px] flex items-center justify-center">
                                <ArrowDownRight weight="duotone" className="w-10 h-10 text-slate-200" />
                            </div>
                            <Text.H2>Belum Ada Transaksi</Text.H2>
                        </div>
                    ) : (() => {
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

                        const sortedOutput = groupedOutput.sort((a, b) => {
                            const dateA = a.type === 'citizen-group' ? new Date(a.latest.tanggal).getTime() : new Date(a.data.tanggal).getTime();
                            const dateB = b.type === 'citizen-group' ? new Date(b.latest.tanggal).getTime() : new Date(b.data.tanggal).getTime();
                            return dateB - dateA;
                        });

                        return sortedOutput.map((item, idx) => {
                            if (item.type === 'citizen-group') {
                                const { wargaNama, latest: trx, allPaidMonths, history } = item;
                                const parsed = parseKeterangan(trx.keterangan);
                                const isExpanded = expandedWargaNames.includes(wargaNama);

                                return (
                                    <div key={`citizen-${wargaNama}-${idx}`} className="bg-white border border-slate-100 rounded-[20px] shadow-premium overflow-hidden flex flex-col transition-all duration-300">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[16px] bg-brand-50 text-brand-600 flex flex-col items-center justify-center border border-brand-100/50 shadow-inner">
                                                        <Text.Caption className="!text-[9px] !font-bold leading-none uppercase">{new Date(trx.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</Text.Caption>
                                                        <Text.H2 className="!text-lg leading-none mt-1">{new Date(trx.tanggal).getDate()}</Text.H2>
                                                    </div>
                                                    <div>
                                                        <Text.H2 className="!font-bold uppercase tracking-tight line-clamp-1">{toTitleCase(wargaNama)}</Text.H2>
                                                        <Text.Caption className="italic uppercase !text-[10px]">ID: {formatFormalId(trx.tanggal, trx.id)}</Text.Caption>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Text.Amount className="!text-brand-600 block">+{formatRupiah(trx.nominal)}</Text.Amount>
                                                    <Text.Label className="!text-brand-500 !text-[9px] !tracking-tight uppercase">Iuran Warga</Text.Label>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100/50 uppercase tracking-tight leading-none whitespace-nowrap">
                                                        KAS MASUK
                                                    </span>
                                                    
                                                    {!isWarga && (
                                                        <div className="flex items-center gap-1">
                                                            <HasPermission module="Buku Kas / Transaksi" action="Ubah">
                                                                <button 
                                                                    onClick={() => navigate(`/keuangan/edit/${trx.id}`)}
                                                                    className="p-1.5 text-slate-400 hover:text-brand-600 transition-all active:scale-90"
                                                                >
                                                                    <PencilSimple weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                            <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                                <button 
                                                                    onClick={() => handleDelete(trx.id)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 transition-all active:scale-90"
                                                                >
                                                                    <Trash weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                        </div>
                                                    )}

                                                    {trx.url_bukti && (
                                                        <button
                                                            onClick={() => setSelectedProof(trx.url_bukti || null)}
                                                            className="p-1.5 text-brand-600 hover:opacity-70 transition-opacity"
                                                        >
                                                            <ImageIcon weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>

                                                <button 
                                                    onClick={() => toggleHistory(wargaNama)}
                                                    className="text-[10px] font-bold text-brand-600 uppercase tracking-tight bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-colors"
                                                >
                                                    {isExpanded ? 'Tutup' : 'Lihat Riwayat'}
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="mb-4 bg-slate-50 border border-slate-100 rounded-[14px] p-4 animate-fade-in">
                                                    <Text.Label className="block mb-3 !text-[9px] opacity-70 !tracking-tight uppercase">Riwayat Pembayaran</Text.Label>
                                                    <div className="space-y-3">
                                                        {history.map((h: any, hIdx: number) => (
                                                            <div key={hIdx} className="flex justify-between items-center text-[10px] border-b border-slate-200/30 pb-3 last:border-0 last:pb-0">
                                                                <div>
                                                                    <Text.H2 className="!text-[11px]">{dateUtils.toDisplay(h.trx.tanggal)}</Text.H2>
                                                                    <Text.Caption className="font-medium !text-[10px]">Periode: {h.parsed.period}</Text.Caption>
                                                                </div>
                                                                <Text.Amount className="!text-[11px] !text-brand-600">+{formatRupiah(h.trx.nominal)}</Text.Amount>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-slate-50/50 rounded-[14px] border border-slate-100 p-4">
                                                <Text.Label className="block mb-3 !text-[9px] opacity-60 !tracking-tight uppercase">Status Terbayar ({parsed.year})</Text.Label>
                                                <div className="grid grid-cols-6 gap-1.5">
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                                        const isPaid = allPaidMonths.has(month);
                                                        return (
                                                            <div 
                                                                key={month} 
                                                                className={`flex aspect-square items-center justify-center rounded-[6px] border text-[8px] font-bold transition-all
                                                                    ${isPaid 
                                                                        ? 'bg-brand-600 text-white border-brand-700 shadow-sm' 
                                                                        : 'bg-white text-slate-300 border-slate-100'
                                                                    }`}
                                                            >
                                                                {getMonthNameShort(month)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            } else {
                                const trx = item.data;
                                const parsed = item.parsed;
                                return (
                                    <div key={trx.id} className="bg-white border border-slate-100 rounded-[20px] shadow-premium overflow-hidden flex flex-col transition-all duration-300">
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-[16px] flex flex-col items-center justify-center border shadow-inner ${trx.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-rose-50 text-rose-600 border-rose-100/50'}`}>
                                                        <Text.Caption className={`!text-[9px] !font-bold leading-none uppercase ${trx.tipe === 'pemasukan' ? '!text-emerald-500' : '!text-rose-500'}`}>{new Date(trx.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</Text.Caption>
                                                        <Text.H2 className={`!text-lg font-bold leading-none mt-1 ${trx.tipe === 'pemasukan' ? '!text-emerald-700' : '!text-rose-700'}`}>{new Date(trx.tanggal).getDate()}</Text.H2>
                                                    </div>
                                                    <div>
                                                        <Text.H2 className={`!font-bold uppercase tracking-tight line-clamp-1 ${trx.tipe === 'pemasukan' ? '!text-emerald-600' : '!text-rose-600'}`}>{toTitleCase(trx.kategori)}</Text.H2>
                                                        <Text.Caption className="italic uppercase !text-[10px]">ID: {formatFormalId(trx.tanggal, trx.id)}</Text.Caption>
                                                    </div>
                                                </div>
                                                <div className={`text-lg font-bold tabular-nums tracking-tight ${trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {trx.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4">
                                                {trx.tipe === 'pemasukan' ? (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100/50 uppercase tracking-tight leading-none whitespace-nowrap">KAS MASUK</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold border border-rose-100/50 uppercase tracking-tight leading-none whitespace-nowrap">KAS KELUAR</span>
                                                )}

                                                {!isWarga && (
                                                    <div className="flex items-center gap-1">
                                                        <HasPermission module="Buku Kas / Transaksi" action="Ubah">
                                                            <button 
                                                                onClick={() => navigate(`/keuangan/edit/${trx.id}`)}
                                                                className="p-1.5 text-slate-400 hover:text-brand-600 transition-all active:scale-90"
                                                            >
                                                                <PencilSimple weight="bold" className="w-4 h-4" />
                                                            </button>
                                                        </HasPermission>
                                                        <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                            <button 
                                                                onClick={() => handleDelete(trx.id)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-all active:scale-90"
                                                            >
                                                                <Trash weight="bold" className="w-4 h-4" />
                                                            </button>
                                                        </HasPermission>
                                                    </div>
                                                )}

                                                {trx.url_bukti && (
                                                    <button
                                                        onClick={() => setSelectedProof(trx.url_bukti || null)}
                                                        className="p-1.5 text-brand-600 hover:opacity-70 transition-opacity"
                                                    >
                                                        <ImageIcon weight="bold" className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="bg-slate-50/50 rounded-[14px] border border-slate-100 p-4">
                                                <Text.Body className="!text-slate-700 leading-relaxed italic !text-[12px]">
                                                    {parsed.label || "Tanpa Keterangan"}
                                                </Text.Body>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        });
                    })()}
                </div>
            </div>

            {selectedProof && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative max-w-4xl w-full bg-white rounded-[24px] shadow-2xl overflow-hidden animate-zoom-in">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <Text.H2>Bukti Transaksi</Text.H2>
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <X weight="bold" className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-10 flex justify-center bg-slate-100 max-h-[80vh] overflow-y-auto">
                            <img
                                src={getFullUrl(selectedProof)}
                                alt="Bukti Transaksi"
                                className="max-w-full h-auto rounded-[16px] shadow-premium"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
