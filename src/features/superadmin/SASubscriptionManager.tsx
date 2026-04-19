import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { Eye, CheckCircle, XCircle, Clock, Upload, Receipt } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';

export default function SASubscriptionManager() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await superAdminService.getInvoices(page, 15, statusFilter || undefined);
            setInvoices(data.items || []);
            setTotal(data.total || 0);
        } catch (e) {
            console.error('Failed to load invoices:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadInvoices(); }, [page, statusFilter]);

    const handleVerify = async (id: string, action: 'VERIFY' | 'REJECT') => {
        const reason = action === 'REJECT' ? prompt('Alasan penolakan:') || undefined : undefined;
        if (action === 'REJECT' && !reason) return;

        try {
            await superAdminService.verifyInvoice(id, action, reason);
            loadInvoices();
        } catch (e) {
            alert('Gagal memproses invoice');
        }
    };

    const statusBadge = (status: string) => {
        const map: Record<string, { class: string; icon: any }> = {
            PENDING: { class: 'bg-slate-50 text-slate-500 border-slate-100', icon: Clock },
            UPLOADED: { class: 'bg-amber-50 text-amber-600 border-amber-100', icon: Upload },
            VERIFIED: { class: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle },
            REJECTED: { class: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
            EXPIRED: { class: 'bg-slate-50 text-slate-400 border-slate-100', icon: Clock },
        };
        return map[status] || map.PENDING;
    };

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="space-y-6">
            <div>
                <Text.H1 className="!text-3xl !font-black !tracking-tight !text-slate-900">Subscription & Invoices</Text.H1>
                <Text.Caption className="!text-slate-500 !mt-1.5 !font-black !tracking-widest uppercase !text-[10px]">Kelola pembayaran subscription tenant</Text.Caption>
            </div>

            {/* Filter */}
            <div className="flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-5 py-3 rounded-2xl bg-white border border-slate-100 text-sm text-slate-700 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer min-w-[200px] shadow-sm"
                >
                    <option value="">Semua Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="UPLOADED">Uploaded (Verify Needed)</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Invoice Table */}
            <div className="rounded-[24px] bg-white border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {loading ? (
                    <div className="flex items-center justify-center h-56">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="text-left py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-bold">Invoice & Tenant</Text.Label>
                                    </th>
                                    <th className="text-right py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-bold">Nominal</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-bold">Status</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-bold">Aksi</Text.Label>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map((inv) => {
                                    const badge = statusBadge(inv.status);
                                    const BadgeIcon = badge.icon;
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <Text.Body className="!text-slate-900 !font-black font-mono !text-[14px] leading-none">{inv.invoice_number}</Text.Body>
                                                    <Text.Body className="!text-slate-700 !text-sm !font-bold mt-1.5">{inv.tenant?.name || inv.tenant_id}</Text.Body>
                                                    <Text.Caption className="!text-slate-400 block mt-1 uppercase tracking-tighter !font-bold !not-italic">
                                                        {inv.plan} • {inv.duration_months} bulan
                                                    </Text.Caption>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <Text.Amount className="!text-slate-900 !text-[15px] !font-black">{formatCurrency(inv.total_amount)}</Text.Amount>
                                                    <div className="flex items-center gap-1.5 mt-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                                        <Text.Caption className="!text-amber-700 !font-black font-mono !not-italic">Unique: {inv.unique_code}</Text.Caption>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${badge.class}`}>
                                                    <BadgeIcon size={12} weight="bold" />
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {inv.status === 'UPLOADED' && (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleVerify(inv.id, 'VERIFY')}
                                                            className="p-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-md shadow-emerald-500/20 active:scale-90"
                                                            title="Verifikasi"
                                                        >
                                                            <CheckCircle size={18} weight="bold" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerify(inv.id, 'REJECT')}
                                                            className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100 active:scale-95"
                                                            title="Tolak"
                                                        >
                                                            <XCircle size={18} weight="bold" />
                                                        </button>
                                                        {inv.payment_proof && (
                                                            <a
                                                                href={inv.payment_proof}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-black transition-all shadow-md shadow-slate-900/10 active:scale-95"
                                                                title="Lihat Bukti"
                                                            >
                                                                <Eye size={18} weight="bold" />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {inv.status === 'VERIFIED' && (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-black border border-emerald-100">
                                                        <CheckCircle size={14} weight="bold" />
                                                        VERIFIED
                                                    </div>
                                                )}
                                                {inv.status === 'PENDING' && (
                                                    <span className="text-[11px] text-slate-400 font-bold italic">Waiting for upload...</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-24 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-20">
                                                <Receipt size={48} weight="thin" />
                                                <span className="text-sm font-bold">Tidak ada invoice ditemukan</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                                p === page
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
