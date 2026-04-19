import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { ChartLineUp, CurrencyCircleDollar, TrendUp } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';

export default function SAAnalytics() {
    const [revenue, setRevenue] = useState<any>(null);
    const [growth, setGrowth] = useState<{ month: string; count: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [rev, gr] = await Promise.all([
                    superAdminService.getRevenue(),
                    superAdminService.getGrowth()
                ]);
                setRevenue(rev);
                setGrowth(gr);
            } catch (e) {
                console.error('Failed to load analytics:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const monthlyRevenue = revenue?.monthlyRevenue || [];
    const maxRevenue = Math.max(...monthlyRevenue.map((r: any) => r.amount), 1);

    return (
        <div className="space-y-6">
            <div>
                <Text.H1 className="!text-white">Analytics</Text.H1>
                <Text.Caption className="!text-slate-500 !mt-1 !font-medium !tracking-normal">Insights & performance platform</Text.Caption>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-[24px] bg-slate-900/80 border border-white/5 p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                        <CurrencyCircleDollar size={22} weight="duotone" className="text-emerald-400" />
                    </div>
                    <Text.Amount className="!text-emerald-400 !text-2xl block tracking-tighter">
                        {formatCurrency(revenue?.totalRevenue || 0)}
                    </Text.Amount>
                    <Text.Label className="!text-slate-500 !mt-1 block uppercase tracking-widest">Total Revenue</Text.Label>
                </div>
                <div className="rounded-[24px] bg-slate-900/80 border border-white/5 p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
                        <ChartLineUp size={22} weight="duotone" className="text-blue-400" />
                    </div>
                    <Text.Amount className="!text-white !text-2xl block">{revenue?.invoiceCount || 0}</Text.Amount>
                    <Text.Label className="!text-slate-500 !mt-1 block uppercase tracking-widest">Verified Invoices</Text.Label>
                </div>
                <div className="rounded-[24px] bg-slate-900/80 border border-white/5 p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3">
                        <TrendUp size={22} weight="duotone" className="text-violet-400" />
                    </div>
                    <Text.Amount className="!text-white !text-2xl block">{growth.length}</Text.Amount>
                    <Text.Label className="!text-slate-500 !mt-1 block uppercase tracking-widest">Bulan Aktif Data</Text.Label>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="rounded-[24px] bg-slate-900/80 border border-white/5 p-6 shadow-sm">
                <Text.H2 className="!text-white mb-4">Revenue per Bulan</Text.H2>
                {monthlyRevenue.length > 0 ? (
                    <div className="flex items-end gap-3 h-48">
                        {monthlyRevenue.map((r: any, i: number) => {
                            const height = (r.amount / maxRevenue) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <Text.Caption className="!text-emerald-400 !font-bold !text-[8px] whitespace-nowrap">
                                        {formatCurrency(r.amount).replace('Rp', '').trim()}
                                    </Text.Caption>
                                    <div
                                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                    <Text.Caption className="!text-slate-600 !text-[8px]">{r.month.slice(5)}</Text.Caption>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-slate-500">
                        Belum ada data revenue
                    </div>
                )}
            </div>

            {/* Growth Chart */}
            <div className="rounded-[24px] bg-slate-900/80 border border-white/5 p-6 shadow-sm">
                <Text.H2 className="!text-white mb-4">Registrasi Tenant per Bulan</Text.H2>
                {growth.length > 0 ? (
                    <div className="flex items-end gap-3 h-48">
                        {growth.map((g, i) => {
                            const maxCount = Math.max(...growth.map(x => x.count), 1);
                            const height = (g.count / maxCount) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <Text.Caption className="!text-blue-400 !font-bold !text-[8px]">{g.count}</Text.Caption>
                                    <div
                                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                    <Text.Caption className="!text-slate-600 !text-[8px]">{g.month.slice(5)}</Text.Caption>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-slate-500">
                        Belum ada data pertumbuhan
                    </div>
                )}
            </div>
        </div>
    );
}
