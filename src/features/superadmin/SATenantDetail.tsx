import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { superAdminService } from '../../services/superAdminService';
import { ArrowLeft, Users, CreditCard, Calendar, Prohibit, CheckCircle } from '@phosphor-icons/react';

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
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!tenant) {
        return <div className="text-center text-slate-400 py-12">Tenant tidak ditemukan</div>;
    }

    const moduleStats = tenant.module_stats || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/super-admin/tenants')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-white">{tenant.name}</h1>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{tenant.id}</p>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4">
                    <Users size={18} className="text-emerald-400 mb-2" weight="duotone" />
                    <div className="text-lg font-bold text-white">{tenant._count?.wargas || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Warga</div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4">
                    <Users size={18} className="text-blue-400 mb-2" weight="duotone" />
                    <div className="text-lg font-bold text-white">{tenant._count?.users || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Users</div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4">
                    <Calendar size={18} className="text-violet-400 mb-2" weight="duotone" />
                    <div className="text-lg font-bold text-white">{moduleStats.agendaCount || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Agenda</div>
                </div>
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4">
                    <CreditCard size={18} className="text-amber-400 mb-2" weight="duotone" />
                    <div className="text-lg font-bold text-white">{moduleStats.iuranCount || 0}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Iuran</div>
                </div>
            </div>

            {/* Admin Info */}
            {tenant.admin && (
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-5">
                    <h2 className="text-sm font-semibold text-white mb-3">Admin RT</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div><span className="text-slate-500">Nama:</span> <span className="text-white font-medium ml-2">{tenant.admin.name}</span></div>
                        <div><span className="text-slate-500">Email:</span> <span className="text-white font-medium ml-2">{tenant.admin.email}</span></div>
                        <div><span className="text-slate-500">Kontak:</span> <span className="text-white font-medium ml-2">{tenant.admin.kontak || '-'}</span></div>
                    </div>
                </div>
            )}

            {/* Subscription Management */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Kelola Subscription</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Plan</label>
                        <select
                            value={subForm.plan}
                            onChange={(e) => setSubForm({ ...subForm, plan: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="FREE">FREE</option>
                            <option value="PREMIUM">PREMIUM</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Status</label>
                        <select
                            value={subForm.status}
                            onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        >
                            <option value="TRIAL">TRIAL</option>
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Berlaku Hingga</label>
                        <input
                            type="date"
                            value={subForm.until}
                            onChange={(e) => setSubForm({ ...subForm, until: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSaveSub}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <CheckCircle size={16} />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                    {tenant.subscription_status !== 'SUSPENDED' ? (
                        <button
                            onClick={handleSuspend}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-medium border border-red-500/20 transition-colors"
                        >
                            <Prohibit size={16} />
                            Suspend Tenant
                        </button>
                    ) : (
                        <button
                            onClick={handleUnsuspend}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-sm font-medium border border-emerald-500/20 transition-colors"
                        >
                            <CheckCircle size={16} />
                            Unsuspend
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
