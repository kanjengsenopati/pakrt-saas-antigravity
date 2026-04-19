import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { Buildings, Users, ChartLineUp, CreditCard, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Text } from '../../components/ui/Typography';

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
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            type: 'count'
        },
        {
            label: 'Total Pengguna',
            value: overview?.totalUsers || 0,
            icon: Users,
            bg: 'bg-violet-50',
            text: 'text-violet-600',
            type: 'count'
        },
        {
            label: 'Total Warga',
            value: overview?.totalWarga || 0,
            icon: Users,
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            type: 'count'
        },
        {
            label: 'Active Subs',
            value: overview?.subscriptions?.active || 0,
            icon: CreditCard,
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            type: 'count'
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
                <Text.H1>Platform Dashboard</Text.H1>
                <Text.Body className="!text-slate-500 mt-1">Overview platform PakRT SaaS</Text.Body>
            </div>

            {/* Pending Invoice Alert */}
            {(overview?.pendingInvoices || 0) > 0 && (
                <div 
                    onClick={() => navigate('/super-admin/subscriptions')}
                    className="flex items-center gap-3 px-5 py-3 rounded-[24px] bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100/50 transition-colors shadow-sm shadow-amber-900/5"
                >
                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <CreditCard size={20} weight="bold" />
                    </div>
                    <Text.Body className="!text-amber-700 !font-bold">
                        {overview?.pendingInvoices} invoice menunggu verifikasi pembayaran
                    </Text.Body>
                    <ArrowRight size={16} className="text-amber-500 ml-auto" />
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-50">
                            <div className={`w-8 h-8 rounded-[10px] ${stat.bg} ${stat.text} flex items-center justify-center shrink-0`}>
                                <stat.icon size={18} weight="bold" />
                            </div>
                            <Text.Label className="!text-slate-400 !normal-case !tracking-normal !text-[11px] truncate leading-none">{stat.label}</Text.Label>
                        </div>
                        <div className={stat.type === 'count' ? 'text-center' : 'text-left'}>
                            <Text.Amount className={`${stat.text} !text-2xl !font-black leading-none`}>
                                {stat.value.toLocaleString('id-ID')}
                            </Text.Amount>
                        </div>
                    </div>
                ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Subscription Breakdown */}
                <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-6">
                        <Text.H2>Subscription Status</Text.H2>
                        <CreditCard size={20} className="text-slate-300" weight="bold" />
                    </div>
                    <div className="space-y-4">
                        {subBreakdown.map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between mb-2">
                                    <Text.Label className="!text-slate-500 !normal-case !tracking-normal !font-bold">{item.label}</Text.Label>
                                    <Text.Body className="!text-slate-900 !font-black">{item.value}</Text.Body>
                                </div>
                                <div className="h-2.5 rounded-full bg-slate-50 overflow-hidden border border-slate-100/50 p-[1px]">
                                    <div
                                        className={`h-full rounded-full ${item.color} shadow-sm transition-all duration-700 ease-out`}
                                        style={{ width: `${(item.value / totalSubs) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tenant Growth */}
                <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center justify-between mb-6">
                        <Text.H2>Pertumbuhan Tenant</Text.H2>
                        <ChartLineUp size={20} className="text-slate-300" weight="bold" />
                    </div>
                    {growth.length > 0 ? (
                        <div className="flex items-end gap-2.5 h-44 px-2">
                            {growth.map((g, i) => {
                                const maxCount = Math.max(...growth.map(x => x.count), 1);
                                const height = (g.count / maxCount) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                                        <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10">
                                            {g.count}
                                        </div>
                                        <div 
                                            className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 shadow-sm"
                                            style={{ height: `${Math.max(height, 4)}%` }}
                                        />
                                        <Text.Caption className="!text-slate-400 !text-[8px] !font-bold !not-italic">{g.month.slice(5)}</Text.Caption>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-44 gap-2 text-slate-400">
                            <Buildings size={32} weight="thin" />
                            <span className="text-xs font-medium italic">Belum ada data pertumbuhan</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Kelola Tenant', icon: Buildings, color: 'text-emerald-500', bg: 'bg-emerald-50', path: '/super-admin/tenants' },
                    { label: 'Verifikasi Payment', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-50', path: '/super-admin/subscriptions' },
                    { label: 'Lihat Analytics', icon: ChartLineUp, color: 'text-violet-500', bg: 'bg-violet-50', path: '/super-admin/analytics' }
                ].map((action) => (
                    <button
                        key={action.label}
                        onClick={() => navigate(action.path)}
                        className="flex items-center gap-4 p-5 rounded-[24px] bg-white border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                        <div className={`w-10 h-10 rounded-xl ${action.bg} ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <action.icon size={20} weight="bold" />
                        </div>
                        <Text.Body className="!text-slate-700 !font-bold group-hover:!text-slate-900 transition-colors">{action.label}</Text.Body>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-900 ml-auto transition-all" />
                    </button>
                ))}
            </div>
        </div>
    );
}
