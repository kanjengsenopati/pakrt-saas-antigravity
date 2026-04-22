import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { Eye, CheckCircle, XCircle, Clock, Upload, Receipt, CaretUp, CurrencyCircleDollar, WarningCircle } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';

export default function SASubscriptionManager() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [zoomImg, setZoomImg] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<any>(null);

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const [data, revenueData] = await Promise.all([
                superAdminService.getInvoices(page, 15, statusFilter || undefined),
                superAdminService.getRevenue()
            ]);
            setInvoices(data.items || []);
            setTotal(data.total || 0);
            setStatsData(revenueData);
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

    const stats = [
        { label: 'Total Revenue', value: statsData?.totalRevenue || 0, icon: CurrencyCircleDollar, color: 'text-emerald-600', bg: 'bg-emerald-50', isAmount: true },
        { label: 'Wait Verify', value: invoices.filter(i => i.status === 'UPLOADED').length, icon: Upload, color: 'text-amber-600', bg: 'bg-amber-50', isAmount: false },
        { label: 'Total Invoices', value: total, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50', isAmount: false },
        { label: 'Rejected', value: invoices.filter(i => i.status === 'REJECTED').length, icon: WarningCircle, color: 'text-red-600', bg: 'bg-red-50', isAmount: false },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Subscription & Invoices</h1>
                <p className="text-[14px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Receipt size={14} weight="bold" />
                    Financial Control Panel
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-50">
                            <div className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                                <s.icon size={18} weight="bold" />
                            </div>
                            <span className="text-[14px] font-semibold text-slate-700 truncate leading-none">{s.label}</span>
                        </div>
                        <div className={s.isAmount ? 'text-left' : 'text-center'}>
                            <Text.Amount className={`${s.color} !text-2xl !font-black leading-none !tracking-tighter`}>
                                {s.isAmount ? formatCurrency(s.value) : s.value.toLocaleString('id-ID')}
                            </Text.Amount>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-6 py-3.5 rounded-2xl bg-white border border-slate-100 text-sm font-black text-slate-700 hover:border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer min-w-[220px] shadow-sm"
                >
                    <option value="">STATUS PEMBAYARAN</option>
                    <option value="PENDING">PENDING (Waiting Pay)</option>
                    <option value="UPLOADED">UPLOADED (Verify Needed)</option>
                    <option value="VERIFIED">VERIFIED (Paid)</option>
                    <option value="REJECTED">REJECTED (Issue)</option>
                </select>
            </div>

            {/* Invoice Table */}
            <div className="rounded-[24px] bg-white border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg" />
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-50">
                                    <th className="py-4 px-6 w-16 text-center">
                                        <Text.Label className="!text-slate-500 !font-black">#</Text.Label>
                                    </th>
                                    <th className="text-left py-4 px-6">
                                        <Text.Label className="!text-slate-500 !font-black">Invoice & Tenant</Text.Label>
                                    </th>
                                    <th className="text-right py-4 px-6">
                                        <Text.Label className="!text-slate-500 !font-black">Nominal</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6">
                                        <Text.Label className="!text-slate-500 !font-black">Status</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6 w-32">
                                        <Text.Label className="!text-slate-500 !font-black">Aksi</Text.Label>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map((inv, idx) => {
                                    const isExpanded = expandedRowId === inv.id;
                                    const badge = statusBadge(inv.status);
                                    const BadgeIcon = badge.icon;
                                    return (
                                        <React.Fragment key={inv.id}>
                                            <tr className={`hover:bg-slate-50/50 transition-colors ${isExpanded ? 'bg-slate-50/80' : ''}`}>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-[12px] font-black text-slate-300">{(page - 1) * 15 + idx + 1}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[14px] font-semibold text-slate-900 font-mono leading-none">{inv.invoice_number}</span>
                                                        <span className="text-[14px] font-medium text-slate-600 mt-1.5">{inv.tenant?.name || inv.tenant_id}</span>
                                                        <Text.Caption className="!text-slate-500 block mt-1 uppercase tracking-tighter !font-bold !not-italic">
                                                            {inv.plan} • {inv.duration_months} bulan
                                                        </Text.Caption>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <Text.Amount className="!text-slate-900 !text-[15px] !font-black">{formatCurrency(inv.total_amount)}</Text.Amount>
                                                        <div className="flex items-center gap-1.5 mt-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                                            <Text.Caption className="!text-amber-700 !font-black font-mono !not-italic !text-[10px]">Code: {inv.unique_code}</Text.Caption>
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
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setExpandedRowId(isExpanded ? null : inv.id)}
                                                            className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${isExpanded ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-100'}`}
                                                            title="Lihat Detail"
                                                        >
                                                            {isExpanded ? <CaretUp size={18} weight="bold" /> : <Eye size={18} weight="bold" />}
                                                        </button>
                                                        {inv.status === 'UPLOADED' && (
                                                            <button
                                                                 onClick={() => handleVerify(inv.id, 'VERIFY')}
                                                                 className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-90"
                                                                 title="Verifikasi"
                                                            >
                                                                <CheckCircle size={18} weight="bold" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-50/80">
                                                    <td colSpan={5} className="px-6 pb-6 pt-0">
                                                        <div className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-inner flex flex-col md:flex-row gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            {/* Details */}
                                                            <div className="flex-1 space-y-6">
                                                                <div className="grid grid-cols-2 gap-6">
                                                                    <div className="space-y-1">
                                                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Metode Pembayaran</span>
                                                                        <p className="text-[14px] font-semibold text-slate-800 mt-0.5 uppercase">{inv.payment_method || 'BANK TRANSFER'}</p>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Waktu Upload</span>
                                                                        <p className="text-[14px] font-semibold text-slate-800 mt-0.5">{inv.updated_at ? new Date(inv.updated_at).toLocaleString('id-ID') : '-'}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                                    <Text.Label className="!text-slate-500 !tracking-widest !text-[10px] !font-black uppercase">Catatan Pembayaran</Text.Label>
                                                                    <Text.Body className="!text-slate-600 !italic !text-[13px] !font-medium">
                                                                        {inv.user_notes || "Tidak ada catatan tambahan dari tenant."}
                                                                    </Text.Body>
                                                                </div>
                                                                {inv.status === 'UPLOADED' && (
                                                                    <div className="flex gap-3">
                                                                        <button
                                                                            onClick={() => handleVerify(inv.id, 'VERIFY')}
                                                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[24px] bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                                                                        >
                                                                            <CheckCircle size={18} weight="bold" />
                                                                            VERIFIKASI SEKARANG
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleVerify(inv.id, 'REJECT')}
                                                                            className="px-8 py-3 rounded-[24px] bg-red-50 text-red-600 text-[13px] font-bold hover:bg-red-100 transition-all border border-red-100 active:scale-95"
                                                                        >
                                                                            TOLAK
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Proof Image */}
                                                            <div className="w-full md:w-64 space-y-2">
                                                                <Text.Label className="!text-slate-500 !tracking-widest !text-[10px] !font-black uppercase mb-1 block">Bukti Transfer</Text.Label>
                                                                {inv.payment_proof ? (
                                                                    <div 
                                                                        className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-slate-200 cursor-zoom-in group shadow-sm"
                                                                        onClick={() => setZoomImg(inv.payment_proof)}
                                                                    >
                                                                        <img src={inv.payment_proof} alt="Proof" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                                            <Eye size={32} weight="bold" />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="aspect-[3/4] rounded-2xl bg-slate-100 border border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-400">
                                                                        <Receipt size={32} weight="thin" />
                                                                        <span className="text-[10px] font-bold uppercase tracking-widest">No Proof Image</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-20">
                                                <Receipt size={64} weight="thin" />
                                                <span className="text-sm font-black uppercase tracking-widest text-slate-500">No transactions found</span>
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
                            className={`w-11 h-11 rounded-[24px] text-[13px] font-bold transition-all ${
                                p === page
                                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 hover:shadow-md'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            {/* Zoom Modal */}
            {zoomImg && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setZoomImg(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center p-2 rounded-3xl bg-white/10 border border-white/20 shadow-2xl">
                        <img 
                            src={zoomImg} 
                            alt="Refined Proof Zoom" 
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl animate-in zoom-in-95 duration-300 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-2xl bg-white text-slate-900 shadow-xl hover:scale-110 active:scale-90 transition-all font-black"
                            onClick={() => setZoomImg(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

import React from 'react';
