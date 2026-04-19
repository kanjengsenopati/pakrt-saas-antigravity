import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { Trophy, Gift, Clock } from '@phosphor-icons/react';

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
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-bold text-white">Program Afiliasi</h1>
                <p className="text-xs text-slate-400 mt-0.5">Kelola reward dan referral antar tenant</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl bg-slate-900/80 border border-white/5 p-5">
                        <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                            <s.icon size={22} weight="duotone" className={s.color} />
                        </div>
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Top Referrers */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-white mb-4">🏆 Top Referrers</h2>
                {data?.topReferrers?.length > 0 ? (
                    <div className="space-y-3">
                        {data.topReferrers.map((ref: any, i: number) => (
                            <div key={ref.tenantId} className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    i === 0 ? 'bg-amber-500/20 text-amber-400' :
                                    i === 1 ? 'bg-slate-400/20 text-slate-300' :
                                    i === 2 ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-slate-700 text-slate-400'
                                }`}>
                                    #{i + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{ref.tenantName}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{ref.tenantId}</div>
                                </div>
                                <div className="text-sm font-bold text-emerald-400">{ref.count} referral</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-slate-500">
                        Belum ada data referral
                    </div>
                )}
            </div>

            {/* Recent Rewards */}
            <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Recent Rewards</h2>
                {data?.recentRewards?.length > 0 ? (
                    <div className="space-y-2">
                        {data.recentRewards.map((rw: any) => (
                            <div key={rw.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                                <div className="text-xs text-slate-400 flex-1">
                                    <span className="text-white font-medium">{rw.referrer_tenant}</span>
                                    {' → '}
                                    <span className="text-emerald-400">{rw.referred_tenant}</span>
                                </div>
                                <span className="text-xs font-medium text-amber-400">{rw.reward_type}</span>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                    rw.status === 'CLAIMED' ? 'bg-emerald-500/10 text-emerald-400' :
                                    rw.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-slate-500/10 text-slate-400'
                                }`}>{rw.status}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-sm text-slate-500">
                        Belum ada reward
                    </div>
                )}
            </div>
        </div>
    );
}
