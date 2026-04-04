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
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
                months: months as number[],
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
                months: [] as number[],
                year: null,
                isIuran: false,
                raw: cleaned
            };
        }

        return {
            wargaNama: null,
            label: toTitleCase(cleaned.split('|')[0].trim()),
            period: null,
            months: [] as number[],
            year: null,
            isIuran: false,
            raw: cleaned
        };
    };

    return (
        <div className="space-y-8 animate-fade-in relative px-3 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <Text.H1>Informasi Transaksi Kas</Text.H1>
                    <Text.Body className="mt-1">Laporan arus kas masuk dan keluar RT</Text.Body>
                </div>
                {!isWarga && (
                    <HasPermission module="Buku Kas / Transaksi" action="Buat">
                        <button
                            onClick={() => navigate('/keuangan/baru')}
                            className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                        >
                            <Plus weight="bold" size={18} />
                            <span>Catat Transaksi</span>
                        </button>
                        
                        {/* MOBILE FAB */}
                        <button
                            onClick={() => navigate('/keuangan/baru')}
                            className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                        >
                            <Plus weight="bold" size={24} />
                        </button>
                    </HasPermission>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4 -mt-2">
                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
                    <Text.Label className="text-sm font-bold text-slate-900 tracking-tight mb-1">Kas Masuk</Text.Label>
                    <Text.Amount className="text-sm sm:text-xl lg:text-2xl font-bold tracking-tighter text-brand-600 leading-none">{formatRupiah(summary.kasMasuk)}</Text.Amount>
                </div>

                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-400" />
                    <Text.Label className="text-sm font-bold text-slate-900 tracking-tight mb-1">Kas Keluar</Text.Label>
                    <Text.Amount className="text-sm sm:text-xl lg:text-2xl font-bold tracking-tighter text-red-600 leading-none">{formatRupiah(summary.kasKeluar)}</Text.Amount>
                </div>

                <div className={`p-4 rounded-[24px] border shadow-premium relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-center text-center ${summary.saldo >= 0 ? 'bg-white border-slate-100' : 'bg-red-900 border-red-800'}`}>
                    <Text.Label className={`text-sm font-bold tracking-tight mb-1 ${summary.saldo >= 0 ? 'text-slate-900' : 'text-white/70'}`}>Saldo</Text.Label>
                    <Text.Amount className={`text-sm sm:text-xl lg:text-2xl font-bold tracking-tighter leading-none ${summary.saldo >= 0 ? 'text-brand-600' : 'text-white'}`}>{formatRupiah(summary.saldo)}</Text.Amount>
                </div>
            </div>

            <div className="bg-white rounded-[24px] shadow-premium border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white">
                    <div className="relative w-full sm:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500 transition-colors">
                            <Funnel weight="bold" className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-[16px] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:bg-white transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-medium"
                        />
                    </div>
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
                {/* MOBILE VIEW: CHRONOLOGICAL LIST */}
                <div className="md:hidden divide-y divide-slate-50 bg-white">
                    {isLoading ? (
                        <div className="py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                <Text.Caption className="font-bold uppercase tracking-widest">Sinkronisasi...</Text.Caption>
                            </div>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="rounded-[20px] p-20 text-center flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[20px] flex items-center justify-center">
                                <ArrowDownRight weight="duotone" className="w-10 h-10 text-slate-200" />
                            </div>
                            <Text.H2>Belum Ada Transaksi</Text.H2>
                        </div>
                    ) : (
                        filteredTransactions
                            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                            .map((trx) => {
                                const parsed = parseKeterangan(trx.keterangan);
                                return (
                                    <div key={trx.id} className="border-b border-slate-50 last:border-0">
                                        <div 
                                            onClick={() => setExpandedId(expandedId === trx.id ? null : trx.id)}
                                            className={`p-5 transition-all duration-300 active:bg-slate-100 cursor-pointer ${expandedId === trx.id ? 'bg-slate-50/80 shadow-inner' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex gap-4 min-w-0">
                                                    <div className={`w-12 h-12 rounded-[16px] shrink-0 flex flex-col items-center justify-center border shadow-sm ${trx.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : 'bg-rose-50 text-rose-600 border-rose-100/50'}`}>
                                                        <span className={`text-[9px] font-bold uppercase leading-none ${trx.tipe === 'pemasukan' ? 'text-emerald-500' : 'text-rose-500'}`}>{new Date(trx.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                        <span className="text-lg font-bold leading-none mt-0.5">{new Date(trx.tanggal).getDate()}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${trx.tipe === 'pemasukan' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                                                {trx.tipe === 'pemasukan' ? 'Masuk' : 'Keluar'}
                                                            </span>
                                                            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight truncate opacity-60">ID: {formatFormalId(trx.tanggal, trx.id)}</span>
                                                        </div>
                                                        <Text.H2 className="!font-medium line-clamp-1 !text-slate-900 !leading-snug">{toTitleCase(trx.kategori)}</Text.H2>
                                                        <p className="text-[12px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                                                            {parsed.wargaNama ? (
                                                                <><span className="font-bold text-brand-600">{parsed.wargaNama}</span> {parsed.isIuran && '— Iuran'}</>
                                                            ) : (
                                                                parsed.label || "Tanpa Keterangan"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0 gap-1.5 pt-1">
                                                    <div className={`text-base font-normal tabular-nums tracking-tighter ${trx.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {trx.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {trx.url_bukti && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setSelectedProof(trx.url_bukti || null); }}
                                                                className="p-1.5 text-brand-600 bg-brand-50 rounded-lg border border-brand-100 transition-opacity hover:opacity-70"
                                                            >
                                                                <ImageIcon weight="bold" className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {!isWarga && (
                                                            <HasPermission module="Buku Kas / Transaksi" action="Ubah">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/keuangan/edit/${trx.id}`); }}
                                                                    className="p-1.5 text-slate-400 bg-white rounded-lg border border-slate-200 transition-all active:scale-90"
                                                                >
                                                                    <PencilSimple weight="bold" className="w-3.5 h-3.5" />
                                                                </button>
                                                            </HasPermission>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedId === trx.id && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="space-y-3">
                                                        <div className="flex flex-col gap-1 text-left">
                                                            <Text.Caption className="!text-[10px] !font-bold uppercase tracking-tight text-slate-400">Keterangan Lengkap</Text.Caption>
                                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{parsed.raw}</p>
                                                        </div>

                                                        {parsed.isIuran && (
                                                            <div className="flex flex-col gap-2 text-left">
                                                                <Text.Caption className="!text-[10px] !font-bold tracking-tight text-brand-600">Bulan Dibayar ({parsed.year})</Text.Caption>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {(() => {
                                                                        const allMonthsPlayedByCitizen = transactions
                                                                            .filter(t => {
                                                                                const p = parseKeterangan(t.keterangan);
                                                                                return p.wargaNama === parsed.wargaNama && p.year === parsed.year && p.isIuran;
                                                                            })
                                                                            .flatMap(t => parseKeterangan(t.keterangan).months);

                                                                        return ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'].map((m, idx) => {
                                                                            const monthNum = idx + 1;
                                                                            const isCurrent = parsed.months.includes(monthNum);
                                                                            const isPaid = allMonthsPlayedByCitizen.includes(monthNum);
                                                                            
                                                                            let colorStates = "bg-rose-50 text-rose-500 border border-rose-100/50 opacity-100 font-medium"; // Unpaid (Smooth Red Card)
                                                                            if (isCurrent) {
                                                                                colorStates = "bg-brand-600 text-white shadow-sm border-brand-500 scale-110 z-10 font-black";
                                                                            } else if (isPaid) {
                                                                                colorStates = "bg-blue-50 text-blue-500 border border-blue-100 font-bold opacity-100";
                                                                            }

                                                                            return (
                                                                                <span 
                                                                                    key={m}
                                                                                    className={`px-2 py-1 rounded-lg text-[9px] transition-all tracking-tighter ${colorStates}`}
                                                                                >
                                                                                    {m}
                                                                                </span>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                    )}
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
