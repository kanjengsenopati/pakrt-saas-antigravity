import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { superAdminService } from '../../services/superAdminService';
import { ArrowLeft, Users, CreditCard, Calendar, Prohibit, CheckCircle } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';

export default function SATenantDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [subForm, setSubForm] = useState({ plan: '', status: '', until: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await superAdminService.getTenantDetail(id!);
                setTenant(data);
                setSubForm({
                    plan: data?.subscription_plan || 'FREE',
                    status: data?.subscription_status || 'TRIAL',
                    until: data?.subscription_until?.split('T')[0] || ''
                });
            } catch (e) {
                console.error('Failed to load tenant:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleSaveSub = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await superAdminService.updateSubscription(id, subForm);
            alert('Subscription berhasil diperbarui!');
        } catch (e) {
            alert('Gagal memperbarui subscription');
        } finally {
            setSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!id) return;
        const newPass = prompt('Masukkan password baru (kosongkan untuk default: pakrt123):');
        if (newPass === null) return;
        
        try {
            const result = await superAdminService.resetTenantPassword(id, newPass || undefined);
            alert(`Password berhasil direset!\nEmail: ${result.email}\nPassword: ${result.password}`);
        } catch (e) {
            alert('Gagal reset password');
        }
    };

    const handleSuspend = async () => {
        if (!id) return;
        const reason = prompt('Alasan suspend:');
        if (!reason) return;
        try {
            await superAdminService.suspendTenant(id, reason);
            setTenant((prev: any) => ({ ...prev, subscription_status: 'SUSPENDED', suspended_reason: reason }));
        } catch (e) {
            alert('Gagal suspend tenant');
        }
    };

    const handleUnsuspend = async () => {
        if (!id) return;
        try {
            await superAdminService.unsuspendTenant(id);
            setTenant((prev: any) => ({ ...prev, subscription_status: 'ACTIVE', suspended_reason: null }));
        } catch (e) {
            alert('Gagal unsuspend tenant');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!tenant) {
        return <div className="text-center text-slate-400 py-12 font-bold uppercase tracking-widest text-[11px]">Tenant tidak ditemukan</div>;
    }

    const moduleStats = tenant.module_stats || {};

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-5">
                <button 
                    onClick={() => navigate('/super-admin/tenants')} 
                    className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-slate-900 hover:shadow-md transition-all active:scale-90"
                >
                    <ArrowLeft size={22} weight="bold" />
                </button>
                <div>
                    <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">{tenant.name}</h1>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[11px] font-bold text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{tenant.id}</span>
                        {tenant.kelurahan && (
                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
                                KEL: {tenant.kelurahan}
                            </span>
                        )}
                        {tenant.kecamatan && (
                            <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                KEC: {tenant.kecamatan}
                            </span>
                        )}
                        {tenant.kota && (
                            <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {tenant.kota}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Grid (Refined Summary Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Warga', value: tenant._count?.wargas || 0, icon: Users, text: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Users', value: tenant._count?.users || 0, icon: Users, text: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Agenda', value: moduleStats.agendaCount || 0, icon: Calendar, text: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Iuran', value: moduleStats.iuranCount || 0, icon: CreditCard, text: 'text-amber-600', bg: 'bg-amber-50' }
                ].map((card) => (
                    <div key={card.label} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-50">
                            <div className={`w-8 h-8 rounded-xl ${card.bg} ${card.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                                <card.icon size={18} weight="bold" />
                            </div>
                            <span className="text-[14px] font-semibold text-slate-700 truncate leading-none">{card.label}</span>
                        </div>
                        <div className="text-center">
                            <Text.Amount className={`${card.text} !text-3xl !font-black leading-none !tracking-tighter`}>
                                {card.value.toLocaleString('id-ID')}
                            </Text.Amount>
                        </div>
                    </div>
                ))}
            </div>

            {/* Admin Info */}
            {tenant.admin && (
                <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <Users size={18} weight="bold" />
                        </div>
                        <h3 className="text-[16px] font-semibold text-slate-800">Admin Pengurus</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Nama Lengkap</span>
                            <p className="text-[14px] font-semibold text-slate-800 mt-0.5">{tenant.admin.name}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Email Address</span>
                            <p className="text-[14px] font-medium text-slate-600 mt-0.5">{tenant.admin.email}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Kontak</span>
                            <p className="text-[14px] font-semibold text-slate-800 font-mono mt-0.5">{tenant.admin.kontak || '-'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Authentication & Access */}
            <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                        <Users size={18} weight="bold" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-slate-800">Authentication & Access</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Login Credential</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700">{tenant.admin?.email || 'N/A'}</span>
                            <span className="text-[10px] text-slate-400 font-medium italic">Used for tenant login</span>
                        </div>
                    </div>
                    <button
                        onClick={handleResetPassword}
                        className="px-8 py-3.5 rounded-[24px] bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        Reset Password Admin
                    </button>
                </div>
            </div>

            {/* Subscription Management */}
            <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CreditCard size={18} weight="bold" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-slate-800">Kelola Subscription</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Subscription Plan</span>
                        <select
                            value={subForm.plan}
                            onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                        >
                            <option value="FREE">FREE PLAN</option>
                            <option value="PREMIUM">PREMIUM PLAN</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Account Status</span>
                        <select
                            value={subForm.status}
                            onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[14px] font-semibold text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all cursor-pointer appearance-none"
                        >
                            <option value="TRIAL">TRIAL PERIOD</option>
                            <option value="ACTIVE">ACTIVE SUBS</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Valid Until</span>
                        <input
                            type="date"
                            value={subForm.until}
                            onChange={(e) => setSubForm({ ...subForm, until: e.target.value })}
                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSaveSub}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3.5 rounded-[24px] bg-blue-600 text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle size={20} weight="bold" />
                        )}
                        {saving ? 'Saving...' : 'Simpan Perubahan'}
                    </button>
                    {tenant.subscription_status !== 'SUSPENDED' ? (
                        <button
                            onClick={handleSuspend}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-[24px] bg-red-50 text-red-600 hover:bg-red-100 text-sm font-bold transition-all border border-red-100 active:scale-95"
                        >
                            <Prohibit size={20} weight="bold" />
                            Suspend Tenant
                        </button>
                    ) : (
                        <button
                            onClick={handleUnsuspend}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-[24px] bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-sm font-bold transition-all border border-emerald-100 active:scale-95"
                        >
                            <CheckCircle size={20} weight="bold" />
                            Unsuspend
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
