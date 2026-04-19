import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { Eye, CheckCircle, XCircle, Clock, Upload } from '@phosphor-icons/react';
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
            PENDING: { class: 'bg-slate-500/10 text-slate-400', icon: Clock },
            UPLOADED: { class: 'bg-amber-500/10 text-amber-400', icon: Upload },
            VERIFIED: { class: 'bg-emerald-500/10 text-emerald-400', icon: CheckCircle },
            REJECTED: { class: 'bg-red-500/10 text-red-400', icon: XCircle },
            EXPIRED: { class: 'bg-slate-500/10 text-slate-500', icon: Clock },
        };
        return map[status] || map.PENDING;
    };

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="space-y-5">
            <div>
                <Text.H1 className="!text-white">Subscription & Invoices</Text.H1>
                <Text.Caption className="!text-slate-500 !mt-1 !font-medium !tracking-normal">Kelola pembayaran subscription tenant</Text.Caption>
            </div>

            {/* Filter */}
            <div className="flex gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 border border-white/5 text-sm text-white focus:outline-none"
                >
                    <option value="">Semua Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="UPLOADED">Uploaded (Menunggu Verifikasi)</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Invoice Table */}
            <div className="rounded-[24px] bg-slate-900/80 border border-white/5 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Invoice</Text.Label>
                                    </th>
                                    <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Tenant</Text.Label>
                                    </th>
                                    <th className="text-right py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Total</Text.Label>
                                    </th>
                                    <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Kode Unik</Text.Label>
                                    </th>
                                    <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Status</Text.Label>
                                    </th>
                                    <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Aksi</Text.Label>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => {
                                    const badge = statusBadge(inv.status);
                                    const BadgeIcon = badge.icon;
                                    return (
                                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="py-3 px-5">
                                                <Text.Body className="!text-white !font-bold font-mono">{inv.invoice_number}</Text.Body>
                                                <Text.Caption className="!text-slate-600 block mt-0.5 uppercase tracking-tighter">
                                                    {inv.plan} • {inv.duration_months} bulan
                                                </Text.Caption>
                                            </td>
                                            <td className="py-3 px-5">
                                                <Text.Body className="!text-white">{inv.tenant?.name || inv.tenant_id}</Text.Body>
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                <Text.Amount className="!text-emerald-400 !text-sm block">{formatCurrency(inv.total_amount)}</Text.Amount>
                                                <Text.Caption className="!text-slate-600 block">Base: {formatCurrency(inv.base_amount)}</Text.Caption>
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                <Text.H3 className="!text-amber-400 font-mono tracking-widest">{inv.unique_code}</Text.H3>
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${badge.class}`}>
                                                    <BadgeIcon size={12} />
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-5 text-center">
                                                {inv.status === 'UPLOADED' && (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleVerify(inv.id, 'VERIFY')}
                                                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all"
                                                            title="Verifikasi"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleVerify(inv.id, 'REJECT')}
                                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                                                            title="Tolak"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                        {inv.payment_proof && (
                                                            <a
                                                                href={inv.payment_proof}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-all"
                                                                title="Lihat Bukti"
                                                            >
                                                                <Eye size={16} />
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                                {inv.status === 'VERIFIED' && (
                                                    <span className="text-[10px] text-emerald-400 font-medium">Verified ✓</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                                            Tidak ada invoice
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
                <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                p === page ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
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
