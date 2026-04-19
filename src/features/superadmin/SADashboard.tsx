import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { Buildings, Users, ChartLineUp, CreditCard, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

interface OverviewData {
    totalTenants: number;
    totalUsers: number;
    totalWarga: number;
    subscriptions: { active: number; trial: number; expired: number; premium: number };
    pendingInvoices: number;
}

export default function SADashboard() {
    const navigate = useNavigate();
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [growth, setGrowth] = useState<{ month: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [ov, gr] = await Promise.all([
                    superAdminService.getOverview(),
                    superAdminService.getGrowth()
                ]);
                setOverview(ov);
                setGrowth(gr);
            } catch (e) {
                console.error('Failed to load SA dashboard:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const stats = [
        {
            label: 'Total RT/RW',
            value: overview?.totalTenants || 0,
            icon: Buildings,
            color: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-500/10',
            text: 'text-blue-400'
        },
        {
            label: 'Total Pengguna',
            value: overview?.totalUsers || 0,
            icon: Users,
            color: 'from-violet-500 to-violet-600',
            bg: 'bg-violet-500/10',
            text: 'text-violet-400'
        },
        {
            label: 'Total Warga',
            value: overview?.totalWarga || 0,
            icon: Users,
            color: 'from-emerald-500 to-emerald-600',
            bg: 'bg-emerald-500/10',
            text: 'text-emerald-400'
        },
        {
            label: 'Active Subscriptions',
            value: overview?.subscriptions?.active || 0,
            icon: CreditCard,
            color: 'from-amber-500 to-amber-600',
            bg: 'bg-amber-500/10',
            text: 'text-amber-400'
        }
    ];

    const subBreakdown = [
        { label: 'Trial', value: overview?.subscriptions?.trial || 0, color: 'bg-sky-500' },
        { label: 'Active', value: overview?.subscriptions?.active || 0, color: 'bg-emerald-500' },
        { label: 'Premium', value: overview?.subscriptions?.premium || 0, color: 'bg-amber-500' },
        { label: 'Expired', value: overview?.subscriptions?.expired || 0, color: 'bg-red-500' },
    ];

    const totalSubs = subBreakdown.reduce((s, b) => s + b.value, 0) || 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
                <p className="text-sm text-slate-400 mt-1">Overview platform PakRT SaaS</p>
            </div>

            {/* Pending Invoice Alert */}
            {(overview?.pendingInvoices || 0) > 0 && (
                <div 
                    onClick={() => navigate('/super-admin/subscriptions')}
                    className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/15 transition-colors"
                >
                    <CreditCard size={22} className="text-amber-400" weight="duotone" />
                    <span className="text-sm font-medium text-amber-300">
                        {overview?.pendingInvoices} invoice menunggu verifikasi pembayaran
                    </span>
                    <ArrowRight size={16} className="text-amber-400 ml-auto" />
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="relative overflow-hidden rounded-2xl bg-slate-900/80 border border-white/5 p-5">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                            <stat.icon size={22} weight="duotone" className={stat.text} />
                        </div>
                        <div className="text-2xl font-bold text-white">{stat.value.toLocaleString('id-ID')}</div>
                        <div className="text-xs font-medium text-slate-400 mt-1">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Breakdown */}
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Subscription Breakdown</h2>
                    <div className="space-y-3">
                        {subBreakdown.map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-slate-400">{item.label}</span>
                                    <span className="text-xs font-bold text-white">{item.value}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                                        style={{ width: `${(item.value / totalSubs) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tenant Growth */}
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-6">
                    <h2 className="text-sm font-semibold text-white mb-4">Pertumbuhan Tenant (12 Bulan)</h2>
                    {growth.length > 0 ? (
                        <div className="flex items-end gap-2 h-40">
                            {growth.map((g, i) => {
                                const maxCount = Math.max(...growth.map(x => x.count), 1);
                                const height = (g.count / maxCount) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-bold text-emerald-400">{g.count}</span>
                                        <div 
                                            className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
                                            style={{ height: `${Math.max(height, 4)}%` }}
                                        />
                                        <span className="text-[9px] text-slate-500">{g.month.slice(5)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-sm text-slate-500">
                            Belum ada data pertumbuhan
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/super-admin/tenants')}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-emerald-500/30 transition-all group"
                >
                    <Buildings size={20} className="text-slate-400 group-hover:text-emerald-400 transition-colors" weight="duotone" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Kelola Tenant</span>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 ml-auto transition-colors" />
                </button>
                <button
                    onClick={() => navigate('/super-admin/subscriptions')}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-amber-500/30 transition-all group"
                >
                    <CreditCard size={20} className="text-slate-400 group-hover:text-amber-400 transition-colors" weight="duotone" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Verifikasi Payment</span>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-amber-400 ml-auto transition-colors" />
                </button>
                <button
                    onClick={() => navigate('/super-admin/analytics')}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-violet-500/30 transition-all group"
                >
                    <ChartLineUp size={20} className="text-slate-400 group-hover:text-violet-400 transition-colors" weight="duotone" />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Lihat Analytics</span>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-violet-400 ml-auto transition-colors" />
                </button>
            </div>
        </div>
    );
}
