import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { Trophy, Gift, Clock } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';

export default function SAAffiliate() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await superAdminService.getAffiliates();
                setData(res);
            } catch (e) {
                console.error('Failed to load affiliates:', e);
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
        { label: 'Total Rewards', value: data?.totalRewards || 0, icon: Gift, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { label: 'Pending', value: data?.pendingRewards || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        { label: 'Claimed', value: data?.claimedRewards || 0, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <Text.H1 className="!text-3xl !font-black !tracking-tight !text-slate-900">Program Afiliasi</Text.H1>
                <Text.Caption className="!text-slate-400 !font-black !tracking-widest uppercase !text-[10px] !mt-1.5 flex items-center gap-2">
                    <Trophy size={14} weight="bold" className="text-emerald-500" />
                    <span>Kelola reward dan referral antar tenant</span>
                </Text.Caption>
            </div>

            {/* Stats (Refined Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((s, idx) => (
                    <div key={s.label} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-50">
                            <div className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                                <s.icon size={18} weight="bold" />
                            </div>
                            <Text.Label className="!text-slate-400 !font-black !normal-case !tracking-tight !text-[12.5px] truncate leading-none uppercase">{s.label}</Text.Label>
                        </div>
                        <div className={idx === 0 ? 'text-left' : 'text-center'}>
                            <Text.Amount className={`${s.color} !text-3xl !font-black leading-none !tracking-tighter`}>
                                {idx === 0 ? `Rp ${s.value.toLocaleString('id-ID')}` : s.value.toLocaleString('id-ID')}
                            </Text.Amount>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Referrers */}
                <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                            <Trophy size={18} weight="bold" />
                        </div>
                        <Text.H2 className="!text-slate-900 !font-black">Top Referrers</Text.H2>
                    </div>

                    {data?.topReferrers?.length > 0 ? (
                        <div className="space-y-4">
                            {data.topReferrers.map((ref: any, i: number) => (
                                <div key={ref.tenantId} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-110 transition-transform ${
                                        i === 0 ? 'bg-amber-500 text-white shadow-amber-500/20' :
                                        i === 1 ? 'bg-slate-200 text-slate-600' :
                                        i === 2 ? 'bg-orange-100 text-orange-600' :
                                        'bg-slate-50 text-slate-400'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <Text.Body className="!font-black !text-slate-900 !text-[15px]">{ref.tenantName}</Text.Body>
                                        <Text.Caption className="!text-slate-400 !font-black !tracking-widest uppercase !text-[9px]">{ref.tenantId}</Text.Caption>
                                    </div>
                                    <div className="text-right">
                                        <Text.Body className="!font-black !text-emerald-600 tabular-nums">{ref.count}</Text.Body>
                                        <Text.Caption className="!text-slate-400 !text-[10px]">referrals</Text.Caption>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Text.Caption className="!text-slate-400">Belum ada data referral</Text.Caption>
                        </div>
                    )}
                </div>

                {/* Recent Rewards */}
                <div className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-50">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Gift size={18} weight="bold" />
                        </div>
                        <Text.H2 className="!text-slate-900 !font-black">Recent Rewards</Text.H2>
                    </div>

                    {data?.recentRewards?.length > 0 ? (
                        <div className="space-y-4">
                            {data.recentRewards.map((rw: any) => (
                                <div key={rw.id} className="flex items-center gap-4 p-3 rounded-2xl border border-slate-50 hover:border-emerald-100 transition-all hover:shadow-md">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[13px] font-black text-slate-900">{rw.referrer_tenant}</span>
                                            <Clock size={12} className="text-slate-300" />
                                            <span className="text-[13px] font-bold text-emerald-600">{rw.referred_tenant}</span>
                                        </div>
                                        <Text.Caption className="!text-slate-400 !font-black !tracking-widest uppercase !text-[9px]">{rw.reward_type}</Text.Caption>
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase border ${
                                        rw.status === 'CLAIMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                        rw.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        'bg-slate-50 text-slate-400 border-slate-100'
                                    }`}>
                                        {rw.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Text.Caption className="!text-slate-400">Belum ada data reward</Text.Caption>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
