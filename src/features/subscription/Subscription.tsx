import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService } from '../../services/subscriptionService';
import {
    CrownSimple, CheckCircle, Clock, XCircle, Upload,
    CreditCard, ArrowRight, Star, Receipt, ArrowLeft
} from '@phosphor-icons/react';

interface Plan {
    id: string;
    name: string;
    plan: string;
    duration_months: number;
    base_amount: number;
    description: string;
    badge?: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    unique_code: number;
    plan: string;
    duration_months: number;
    base_amount: number;
    total_amount: number;
    status: string;
    payment_proof: string | null;
    payment_method: string | null;
    createdAt: string;
    expiresAt: string;
    rejected_reason: string | null;
}

type Tab = 'status' | 'plans' | 'history';

export default function Subscription() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<Tab>('status');
    const [subStatus, setSubStatus] = useState<any>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);

    // Invoice creation state
    const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
    const [uploadMethod, setUploadMethod] = useState('BCA');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [status, planData, invoiceData] = await Promise.all([
                    subscriptionService.getStatus(),
                    subscriptionService.getPlans(),
                    subscriptionService.getInvoices()
                ]);
                setSubStatus(status);
                setPlans(planData.plans || []);
                setBankAccounts(planData.bank_accounts || []);
                setInvoices(invoiceData || []);

                // Check for pending invoice
                const pending = (invoiceData || []).find((i: Invoice) => i.status === 'PENDING' || i.status === 'UPLOADED');
                if (pending) setActiveInvoice(pending);
            } catch (e) {
                console.error('Failed to load subscription data:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSelectPlan = async (plan: Plan) => {
        if (activeInvoice) {
            alert('Anda masih memiliki invoice aktif. Selesaikan atau tunggu expired terlebih dahulu.');
            return;
        }
        setSubmitting(true);
        try {
            const invoice = await subscriptionService.createInvoice({
                plan: plan.plan,
                duration_months: plan.duration_months,
                base_amount: plan.base_amount
            });
            setActiveInvoice(invoice);
            setTab('status');
        } catch (e) {
            alert('Gagal membuat invoice');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUploadProof = async () => {
        if (!activeInvoice || !selectedFile) return;
        setSubmitting(true);
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(selectedFile);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });

            await subscriptionService.uploadProof(activeInvoice.id, base64, uploadMethod);
            setActiveInvoice({ ...activeInvoice, status: 'UPLOADED', payment_proof: base64, payment_method: uploadMethod });
            alert('Bukti pembayaran berhasil diunggah! Mohon tunggu verifikasi dari admin.');
            setSelectedFile(null);
        } catch (e) {
            alert('Gagal mengunggah bukti');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const statusInfo = () => {
        const s = subStatus?.subscription_status;
        if (s === 'ACTIVE') return { color: 'emerald', label: 'Aktif', icon: CheckCircle };
        if (s === 'TRIAL') return { color: 'sky', label: 'Trial', icon: Clock };
        if (s === 'EXPIRED') return { color: 'red', label: 'Kedaluwarsa', icon: XCircle };
        return { color: 'slate', label: s || 'N/A', icon: Clock };
    };

    const info = statusInfo();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: 'status', label: 'Status' },
        { key: 'plans', label: 'Paket Harga' },
        { key: 'history', label: 'Riwayat' },
    ];

    return (
        <div className="space-y-6 pb-20 pt-12 px-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeft size={20} weight="bold" />
                </button>
                <div>
                    <h1 className="text-[22px] font-bold text-slate-900">Berlangganan</h1>
                    <p className="text-[14px] text-slate-500 mt-0.5">Kelola paket langganan PakRT Premium</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                            tab === t.key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── TAB: STATUS ── */}
            {tab === 'status' && (
                <div className="space-y-5">
                    {/* Current Plan Card */}
                    <div className="rounded-[24px] bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <CrownSimple size={22} weight="fill" className="text-amber-300" />
                                <span className="text-xs font-bold uppercase tracking-widest text-white/60">Langganan Anda</span>
                            </div>
                            <h2 className="text-2xl font-bold">{subStatus?.subscription_plan || 'FREE'}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15`}>
                                    <info.icon size={14} weight="fill" />
                                    {info.label}
                                </span>
                            </div>
                            {subStatus?.subscription_until && (
                                <p className="text-sm text-white/70 mt-3">
                                    Berlaku hingga: <span className="text-white font-semibold">{formatDate(subStatus.subscription_until)}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Active Invoice Card */}
                    {activeInvoice && (
                        <div className="rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[16px] font-semibold text-slate-800">Invoice Aktif</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    activeInvoice.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                    activeInvoice.status === 'UPLOADED' ? 'bg-blue-100 text-blue-700' :
                                    activeInvoice.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                    {activeInvoice.status}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">No. Invoice</span>
                                    <p className="text-[14px] font-semibold text-slate-800 font-mono mt-0.5">{activeInvoice.invoice_number}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Kode Unik</span>
                                    <p className="text-[18px] font-bold text-amber-600 mt-0.5">{activeInvoice.unique_code}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[14px] text-slate-600">Harga paket</span>
                                    <span className="text-[14px] text-slate-800">{formatCurrency(activeInvoice.base_amount)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[14px] text-slate-600">Kode unik</span>
                                    <span className="text-[14px] text-amber-600 font-semibold">+ {activeInvoice.unique_code}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                                    <span className="text-[14px] font-bold text-slate-900">Total Transfer</span>
                                    <span className="text-[18px] font-bold text-emerald-600">{formatCurrency(activeInvoice.total_amount)}</span>
                                </div>
                            </div>

                            {/* Bank Info */}
                            {activeInvoice.status === 'PENDING' && bankAccounts.length > 0 && (
                                <div className="space-y-2">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Transfer ke</span>
                                    {bankAccounts.map((bank: any) => (
                                        <div key={bank.bank} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                {bank.bank}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[14px] font-semibold text-slate-800 font-mono">{bank.account}</p>
                                                <p className="text-[12px] text-slate-500">{bank.name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Upload Proof */}
                            {activeInvoice.status === 'PENDING' && (
                                <div className="space-y-3 pt-2 border-t border-slate-100">
                                    <h4 className="text-[14px] font-semibold text-slate-700">Upload Bukti Transfer</h4>
                                    <select
                                        value={uploadMethod}
                                        onChange={(e) => setUploadMethod(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border-0 text-[14px] text-slate-800 focus:ring-2 focus:ring-blue-200"
                                    >
                                        {bankAccounts.map((b: any) => (
                                            <option key={b.bank} value={b.bank}>{b.bank}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setSelectedFile(e.target.files[0]);
                                            }
                                        }}
                                        className="w-full rounded-xl bg-slate-50 border border-slate-200 text-[14px] text-slate-800 focus:ring-2 focus:ring-blue-200 file:mr-4 file:py-3 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
                                    />
                                    <button
                                        onClick={handleUploadProof}
                                        disabled={!selectedFile || submitting}
                                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-[14px] transition-colors disabled:opacity-50"
                                    >
                                        <Upload size={18} weight="bold" />
                                        {submitting ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                                    </button>
                                </div>
                            )}

                            {activeInvoice.status === 'UPLOADED' && (
                                <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-4">
                                    <Clock size={20} className="text-blue-500" weight="duotone" />
                                    <p className="text-[14px] text-blue-700 font-medium">
                                        Bukti pembayaran sedang diverifikasi. Estimasi 1x24 jam.
                                    </p>
                                </div>
                            )}

                            {activeInvoice.status === 'REJECTED' && (
                                <div className="bg-red-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <XCircle size={18} className="text-red-500" weight="fill" />
                                        <span className="text-[14px] font-semibold text-red-700">Pembayaran Ditolak</span>
                                    </div>
                                    <p className="text-[12px] text-red-600">{activeInvoice.rejected_reason || 'Bukti tidak valid'}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CTAs when no active invoice */}
                    {!activeInvoice && (subStatus?.subscription_status === 'TRIAL' || subStatus?.subscription_status === 'EXPIRED' || subStatus?.subscription_plan === 'FREE') && (
                        <div className="rounded-[24px] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <Star size={20} weight="fill" className="text-amber-500" />
                                <h3 className="text-[16px] font-semibold text-slate-800">
                                    {subStatus?.subscription_status === 'EXPIRED' ? 'Perpanjang Langganan' : 'Upgrade ke Premium'}
                                </h3>
                            </div>
                            <p className="text-[14px] text-slate-600">
                                Dapatkan akses ke semua fitur premium PakRT: laporan keuangan, cetak surat, push notification, dan lainnya.
                            </p>
                            <button
                                onClick={() => setTab('plans')}
                                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold text-[14px] transition-colors"
                            >
                                Lihat Paket Harga
                                <ArrowRight size={16} weight="bold" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: PLANS ── */}
            {tab === 'plans' && (
                <div className="space-y-4">
                    {plans.map((plan) => {
                        const perMonth = Math.round(plan.base_amount / plan.duration_months);
                        return (
                            <div
                                key={plan.id}
                                className={`rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 relative overflow-hidden transition-all ${
                                    plan.badge === 'Populer' ? 'ring-2 ring-blue-500/20' : ''
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            plan.badge === 'Best Value' ? 'bg-emerald-100 text-emerald-700' :
                                            plan.badge === 'Populer' ? 'bg-blue-100 text-blue-700' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>{plan.badge}</span>
                                    </div>
                                )}
                                <h3 className="text-[16px] font-semibold text-slate-800">{plan.name}</h3>
                                <p className="text-[12px] text-slate-500 mt-0.5">{plan.description}</p>
                                <div className="mt-3 flex items-end gap-1">
                                    <span className="text-[18px] font-bold text-emerald-600">{formatCurrency(plan.base_amount)}</span>
                                    <span className="text-[12px] text-slate-400 mb-0.5">/ {plan.duration_months} bulan</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    ≈ {formatCurrency(perMonth)}/bulan
                                </p>
                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={submitting || !!activeInvoice}
                                    className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-[14px] transition-colors disabled:opacity-50"
                                >
                                    <CreditCard size={18} weight="bold" />
                                    {activeInvoice ? 'Ada Invoice Aktif' : 'Pilih Paket'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── TAB: HISTORY ── */}
            {tab === 'history' && (
                <div className="space-y-3">
                    {invoices.length === 0 ? (
                        <div className="rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 text-center">
                            <Receipt size={40} className="text-slate-300 mx-auto mb-3" weight="duotone" />
                            <p className="text-[14px] text-slate-500">Belum ada riwayat pembayaran</p>
                        </div>
                    ) : (
                        invoices.map((inv) => (
                            <div key={inv.id} className="rounded-[24px] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[14px] font-semibold text-slate-800 font-mono">{inv.invoice_number}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        inv.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                        inv.status === 'UPLOADED' ? 'bg-blue-100 text-blue-700' :
                                        inv.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        inv.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {inv.status}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[12px] text-slate-400 italic">{formatDate(inv.createdAt)}</p>
                                        <p className="text-[12px] text-slate-500">{inv.plan} • {inv.duration_months} bulan</p>
                                    </div>
                                    <span className="text-[18px] font-bold text-emerald-600">{formatCurrency(inv.total_amount)}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
