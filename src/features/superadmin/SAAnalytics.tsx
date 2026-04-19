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
        <div className="space-y-8">
            <div>
                <Text.H1 className="!text-3xl !font-black !tracking-tight !text-slate-900">Platform Analytics</Text.H1>
                <Text.Caption className="!text-slate-400 !font-black !tracking-widest uppercase !text-[10px] !mt-1.5 flex items-center gap-2">
                    <TrendUp size={14} weight="bold" className="text-emerald-500" />
                    <span>Insights & performance platform PakRT</span>
                </Text.Caption>
            </div>

            {/* Revenue Stats (Refined Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                    { label: 'Total Revenue', value: formatCurrency(revenue?.totalRevenue || 0), icon: CurrencyCircleDollar, text: 'text-emerald-600', bg: 'bg-emerald-50', align: 'left' },
                    { label: 'Verified Invoices', value: (revenue?.invoiceCount || 0).toLocaleString('id-ID'), icon: ChartLineUp, text: 'text-blue-600', bg: 'bg-blue-50', align: 'center' },
                    { label: 'Bulan Aktif Data', value: growth.length.toLocaleString('id-ID'), icon: TrendUp, text: 'text-violet-600', bg: 'bg-violet-50', align: 'center' }
                ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50">
                            <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                                <stat.icon size={20} weight="bold" />
                            </div>
                            <Text.Label className="!text-slate-400 !font-black !normal-case !tracking-widest !text-[10px] truncate leading-none uppercase">{stat.label}</Text.Label>
                        </div>
                        <div className={stat.align === 'center' ? 'text-center' : 'text-left'}>
                            <Text.Amount className={`${stat.text} !text-3xl !font-black leading-none !tracking-tighter`}>
                                {stat.value}
                            </Text.Amount>
                        </div>
                    </div>
                ))}
            </div>

            {/* Revenue Chart */}
            <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CurrencyCircleDollar size={18} weight="bold" />
                    </div>
                    <Text.H2 className="!text-slate-900 !font-black">Revenue per Bulan</Text.H2>
                </div>
                
                {monthlyRevenue.length > 0 ? (
                    <div className="flex items-end gap-3 h-56 pt-8">
                        {monthlyRevenue.map((r: any, i: number) => {
                            const height = (r.amount / maxRevenue) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md mb-2">
                                        {formatCurrency(r.amount).replace('Rp', '').trim()}
                                    </div>
                                    <div
                                        className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-700 shadow-md shadow-emerald-500/10 group-hover:from-emerald-500 group-hover:to-emerald-300"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    />
                                    <Text.Caption className="!text-slate-400 !font-black tracking-widest uppercase !text-[9px] mt-1">{r.month.split('-')[1]}</Text.Caption>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-slate-400 font-bold italic">
                        Belum ada data revenue
                    </div>
                )}
            </div>

            {/* Growth Chart */}
            <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <TrendUp size={18} weight="bold" />
                    </div>
                    <Text.H2 className="!text-slate-900 !font-black">Registrasi Tenant</Text.H2>
                </div>

                {growth.length > 0 ? (
                    <div className="flex items-end gap-3 h-56 pt-8">
                        {growth.map((g, i) => {
                            const maxCount = Math.max(...growth.map(x => x.count), 1);
                            const height = (g.count / maxCount) * 100;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md mb-2">
                                        {g.count} RT
                                    </div>
                                    <div
                                        className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700 shadow-md shadow-blue-500/10 group-hover:from-blue-500 group-hover:to-blue-300"
                                        style={{ height: `${Math.max(height, 8)}%` }}
                                    />
                                    <Text.Caption className="!text-slate-400 !font-black tracking-widest uppercase !text-[9px] mt-1">{g.month.split('-')[1]}</Text.Caption>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-48 text-sm text-slate-400 font-bold italic">
                        Belum ada data pertumbuhan
                    </div>
                )}
            </div>
        </div>
    );
}
