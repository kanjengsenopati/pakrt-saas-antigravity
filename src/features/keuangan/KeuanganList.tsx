import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { keuanganService } from '../../services/keuanganService';
import { Keuangan } from '../../database/db';
import { 
    Plus, 
    Funnel, 
    Trash, 
    ArrowDownRight,
    MagnifyingGlass,
    Image as ImageIcon,
    X,
    Info
} from '@phosphor-icons/react';
import { formatRupiah } from '../../utils/currency';
import { HasPermission } from '../../components/auth/HasPermission';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';

export default function KeuanganList() {
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();

    const [transactions, setTransactions] = useState<Keuangan[]>([]);
    const [summary, setSummary] = useState({ kasMasuk: 0, kasKeluar: 0, saldo: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProof, setSelectedProof] = useState<string | null>(null);


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
        const shortId = itemId.substring(0, 4).toUpperCase();
        return `${yyyy}${mm}${dd}-${shortId}`;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">Kas Masuk & Keluar</h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                        Pencatatan keuangan operasional untuk <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <HasPermission module="Buku Kas / Transaksi" action="Buat">
                        <button
                            onClick={() => navigate('/keuangan/baru')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[14px] font-normal transition-all shadow-sm hover-lift active-press"
                        >
                            <Plus weight="bold" />
                            <span>Catat Transaksi</span>
                        </button>
                    </HasPermission>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                {/* KAS MASUK */}
                <div className="bg-white py-2 px-2 sm:py-3 sm:px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[9px] sm:text-[12px] font-bold text-slate-500 tracking-wider leading-none uppercase mb-1.5">Kas Masuk</p>
                        <p className="text-sm sm:text-xl font-black text-slate-800 leading-none truncate tabular-nums">{formatRupiah(summary.kasMasuk)}</p>
                    </div>
                </div>

                {/* KAS KELUAR */}
                <div className="bg-white py-2 px-2 sm:py-3 sm:px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-red-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[9px] sm:text-[12px] font-bold text-slate-500 tracking-wider leading-none uppercase mb-1.5">Kas Keluar</p>
                        <p className="text-sm sm:text-xl font-black text-slate-800 leading-none truncate tabular-nums">{formatRupiah(summary.kasKeluar)}</p>
                    </div>
                </div>

                {/* SALDO AKHIR */}
                <div className={`py-2 px-2 sm:py-3 sm:px-4 rounded-xl border shadow-md relative overflow-hidden group transition-all duration-300 hover:shadow-lg ${summary.saldo >= 0 ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-700' : 'bg-red-600 border-red-500 hover:bg-red-700'}`}>
                    <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <p className="text-[9px] sm:text-[11px] font-black text-white/90 tracking-wider leading-none uppercase mb-1.5">Saldo</p>
                        <p className="text-sm sm:text-xl font-black text-white leading-none truncate tabular-nums">{formatRupiah(summary.saldo)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
                    <div className="relative w-full sm:w-80">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari transaksi..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm"
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
                        <thead className="bg-slate-50 border-b border-slate-100 text-[14px] font-semibold capitalize text-slate-500 tracking-wider">
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
                                        <p className="text-lg font-black text-slate-900">Data Tidak Ditemukan</p>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-tight">Belum ada riwayat transaksi yang cocok dengan filter aktif.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-brand-50/20 transition-colors group border-b border-slate-50 last:border-0">
                                        <td className="p-3 whitespace-nowrap">
                                            <div className="font-bold text-slate-800 text-[14px]">{dateUtils.toDisplay(trx.tanggal)}</div>
                                            <div className="text-[12px] text-slate-500 font-medium uppercase tracking-tight mt-0.5 font-mono">ID: {formatFormalId(trx.tanggal, trx.id)}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className={`text-[12px] font-semibold uppercase tracking-widest mb-0.5 ${trx.tipe === 'pemasukan' ? 'text-brand-600' : 'text-red-600'}`}>
                                                {trx.kategori}
                                            </div>
                                            <div className="flex items-center gap-2 group/tooltip">
                                                <div className="text-[14px] font-normal text-slate-800 max-w-xs truncate" title={trx.keterangan}>
                                                    {trx.keterangan.startsWith('[AUTO]') ? trx.keterangan.replace('[AUTO] ', '') : trx.keterangan}
                                                </div>
                                                {trx.keterangan.startsWith('[AUTO]') && (
                                                    <div className="relative cursor-help">
                                                        <Info weight="fill" className="w-3.5 h-3.5 text-brand-400 hover:text-brand-600 transition-colors" />
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-900 text-white text-[10px] font-medium leading-relaxed rounded-xl shadow-xl z-50 animate-fade-in border border-slate-700 backdrop-blur-sm">
                                                            <div className="font-black uppercase tracking-widest text-brand-400 mb-1">Detail Auto-Sync</div>
                                                            {trx.keterangan.split('|')[0].replace('[AUTO] ', '')}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right whitespace-nowrap">
                                            <span className={`text-[14px] font-bold ${trx.tipe === 'pemasukan' ? 'text-brand-600' : 'text-slate-200'}`}>
                                                {trx.tipe === 'pemasukan' ? formatRupiah(trx.nominal) : 'Rp 0'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right whitespace-nowrap">
                                            <span className={`text-[14px] font-bold ${trx.tipe === 'pengeluaran' ? 'text-red-600' : 'text-slate-200'}`}>
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
                                                <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                                    <button
                                                        onClick={() => handleDelete(trx.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white border border-red-100"
                                                        title="Hapus Transaksi"
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
                        <div className="text-center text-gray-500 py-12 font-black text-[10px] uppercase tracking-widest animate-pulse">Memuat riwayat transaksi...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-20 px-6 bg-white border border-slate-100 rounded-2xl flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 mb-4">
                                <ArrowDownRight weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-base font-black text-slate-900 uppercase tracking-tight">Data Kosong</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Belum ada transaksi tercatat</p>
                        </div>
                    ) : (
                        filteredTransactions.map((trx) => (
                            <div key={trx.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:border-brand-300 transition-colors">
                                <div className="p-4 flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-3">
                                            <div>
                                                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${trx.tipe === 'pemasukan' ? 'text-brand-600' : 'text-red-600'}`}>
                                                    {trx.kategori}
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                    {dateUtils.toDisplay(trx.tanggal)} &bull; <span className="font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded ml-1 tracking-wider inline-block">ID:{formatFormalId(trx.tanggal, trx.id)}</span>
                                                </p>
                                            </div>
                                            <div className={`text-lg font-black ${trx.tipe === 'pemasukan' ? 'text-brand-600' : 'text-red-500'}`}>
                                                {trx.tipe === 'pemasukan' ? '+' : '-'}{formatRupiah(trx.nominal)}
                                            </div>
                                        </div>

                                        <div className="text-sm font-bold text-slate-700 leading-relaxed flex items-center gap-2">
                                            {trx.keterangan.startsWith('[AUTO]') ? trx.keterangan.replace('[AUTO] ', '') : (trx.keterangan || <span className="text-slate-300 italic font-medium tracking-tight uppercase text-[10px]">Tanpa Uraian</span>)}
                                            {trx.keterangan.startsWith('[AUTO]') && <Info className="w-3.5 h-3.5 text-brand-400 hover:text-brand-600 transition-colors" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-end items-center gap-2">
                                    {trx.url_bukti && (
                                        <button
                                            onClick={() => setSelectedProof(trx.url_bukti || null)}
                                            className="p-2 text-brand-600 bg-white border border-brand-100 hover:bg-brand-50 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            <ImageIcon weight="bold" className="w-3.5 h-3.5" /> Bukti
                                        </button>
                                    )}
                                    <HasPermission module="Buku Kas / Transaksi" action="Hapus">
                                        <button
                                            onClick={() => handleDelete(trx.id)}
                                            className="p-2 text-red-600 bg-white border border-red-100 hover:bg-red-50 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                                            title="Hapus"
                                        >
                                            <Trash weight="bold" className="w-3.5 h-3.5" /> Hapus
                                        </button>
                                    </HasPermission>
                                </div>
                            </div>
                        ))
                    )}
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
