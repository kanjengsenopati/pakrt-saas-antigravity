import { useState, useEffect, useMemo } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { MapTrifold, Globe, CaretDown, CaretUp, CheckCircle, WarningCircle, Info } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
import { semarangDemographics } from '../../data/semarangDemographics';
import { semarangRegions } from '../../data/semarangRegions';

interface DetailedStats {
    kelurahan: string;
    rwCount: number;
    rtCount: number;
    tenants: any[];
}

export default function SAMonitorWilayah() {
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
    const [activeTenants, setActiveTenants] = useState<any[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            // In real world, we'd fetch specific regional stats
            // For now we get all tenants and aggregate manually for high fidelity drill-down
            const data = await superAdminService.getTenants(1, 1000);
            setActiveTenants(data.items || []);
            
            const processed = Object.keys(semarangDemographics).map(name => {
                const regRT = (data.items || []).filter((t: any) => t.kecamatan?.toLowerCase() === name.toLowerCase()).length;
                return {
                    name,
                    registered: regRT,
                    total: semarangDemographics[name].totalRT,
                    percent: (regRT / semarangDemographics[name].totalRT) * 100
                };
            });
            setStats(processed.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (e) {
            console.error('Failed to load monitoring data:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const getBreakdown = (districtName: string): DetailedStats[] => {
        const kelurahans = semarangRegions[districtName] || [];
        return kelurahans.map(kel => {
            const kelTenants = activeTenants.filter(t => 
                t.kecamatan?.toLowerCase() === districtName.toLowerCase() && 
                t.kelurahan?.toLowerCase() === kel.toLowerCase()
            );
            return {
                kelurahan: kel,
                rwCount: new Set(kelTenants.map(t => t.rw)).size,
                rtCount: kelTenants.length,
                tenants: kelTenants
            };
        });
    };

    const districtList = useMemo(() => stats, [stats]);
    const row1 = districtList.slice(0, 8);
    const row2 = districtList.slice(8, 16);

    const DistrictCard = ({ d }: { d: any }) => {
        const isActive = expandedDistrict === d.name;
        return (
            <button
                onClick={() => setExpandedDistrict(isActive ? null : d.name)}
                className={`flex flex-col p-3 rounded-2xl border transition-all relative group
                    ${isActive 
                        ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/20 scale-105 z-10' 
                        : 'bg-white border-slate-100 hover:border-emerald-500 hover:shadow-lg shadow-sm'}`}
            >
                <div className="flex items-center justify-between mb-2">
                    <Text.Label className={`!text-[10px] !font-black !tracking-tighter uppercase truncate pr-2 ${isActive ? '!text-emerald-400' : '!text-slate-400'}`}>
                        {d.name}
                    </Text.Label>
                    {isActive ? <CaretUp size={12} weight="bold" className="text-emerald-400" /> : <CaretDown size={12} weight="bold" className="text-slate-300" />}
                </div>
                
                <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-lg font-black tracking-tighter ${isActive ? 'text-white' : 'text-slate-900'}`}>{d.registered}</span>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>/ {d.total} RT</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div 
                        className={`h-full transition-all duration-1000 ${d.percent > 50 ? 'bg-emerald-500' : d.percent > 20 ? 'bg-amber-500' : 'bg-slate-300'}`}
                        style={{ width: `${Math.min(100, d.percent)}%` }}
                    />
                </div>
                <div className={`text-[9px] font-black text-right ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {d.percent.toFixed(1)}%
                </div>
            </button>
        );
    };

    const DetailPanel = ({ districtName }: { districtName: string }) => {
        const breakdown = getBreakdown(districtName);
        return (
            <div className="col-span-full mt-4 mb-6 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <Globe size={24} weight="bold" />
                            </div>
                            <div>
                                <Text.H2 className="!text-xl !font-black !text-slate-900">Breakdown: Kecamatan {districtName.toUpperCase()}</Text.H2>
                                <Text.Caption className="!text-slate-400 !font-black !tracking-widest uppercase !text-[10px]">Registry Participation Mapping</Text.Caption>
                            </div>
                        </div>
                        <button 
                            onClick={() => setExpandedDistrict(null)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-900 transition-all font-black text-xs"
                        >
                            CLOSE PANEL ✕
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {breakdown.map((b) => (
                            <div key={b.kelurahan} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                    <Text.Body className="!font-black !text-slate-900 !text-[13px] uppercase tracking-tight">{b.kelurahan}</Text.Body>
                                    <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-black">{b.rtCount} RT</span>
                                </div>
                                
                                {b.tenants.length > 0 ? (
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1.5">
                                            {Array.from(new Set(b.tenants.map(t => t.rw))).sort().map(rw => (
                                                <div key={rw} className="px-2 py-1 rounded-md bg-white border border-slate-100 shadow-sm flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">RW {rw}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {b.tenants.filter(t => t.rw === rw).map(t => (
                                                            <div key={t.id} className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center text-white" title={`RT ${t.name}`}>
                                                                <CheckCircle size={10} weight="fill" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 py-2 opacity-30">
                                        <Info size={14} weight="bold" className="text-slate-400" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada RT terdaftar</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <Text.H1 className="!text-3xl !font-black !tracking-tight !text-slate-900">Monitor Wilayah</Text.H1>
                    <Text.Caption className="!text-slate-400 !mt-1.5 !font-black !tracking-widest uppercase !text-[11px] flex items-center gap-2">
                        <MapTrifold size={14} weight="bold" />
                        <span>Coverage Index: Kota Semarang</span>
                    </Text.Caption>
                </div>
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col items-end">
                        <Text.Amount className="!text-slate-900 !text-xl !font-black !tracking-tighter leading-none">
                            {stats.reduce((acc, curr) => acc + curr.registered, 0)}
                        </Text.Amount>
                        <Text.Caption className="!text-slate-400 !font-black !text-[8px] uppercase tracking-widest mt-1">Total Aktif</Text.Caption>
                    </div>
                    <div className="w-px h-8 bg-slate-100" />
                    <div className="flex flex-col items-end">
                        <Text.Amount className="!text-emerald-600 !text-xl !font-black !tracking-tighter leading-none">
                            {( (stats.reduce((acc, curr) => acc + curr.registered, 0) / stats.reduce((acc, curr) => acc + curr.total, 0)) * 100 ).toFixed(1)}%
                        </Text.Amount>
                        <Text.Caption className="!text-slate-400 !font-black !text-[8px] uppercase tracking-widest mt-1">Market Share</Text.Caption>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <Text.Label className="animate-pulse !text-slate-400">AGREGASI DATA WILAYAH...</Text.Label>
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Row 1 Grid (8 columns) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {row1.map(d => <DistrictCard key={d.name} d={d} />)}
                        
                        {/* Expansion Panel if active district is in Row 1 */}
                        {expandedDistrict && row1.some(d => d.name === expandedDistrict) && (
                            <DetailPanel districtName={expandedDistrict} />
                        )}
                    </div>

                    {/* Row 2 Grid (8 columns) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                        {row2.map(d => <DistrictCard key={d.name} d={d} />)}

                        {/* Expansion Panel if active district is in Row 2 */}
                        {expandedDistrict && row2.some(d => d.name === expandedDistrict) && (
                            <DetailPanel districtName={expandedDistrict} />
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && stats.length === 0 && (
                <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-30">
                    <WarningCircle size={64} weight="thin" />
                    <Text.Body className="!font-black uppercase tracking-[0.2em] !text-slate-400">Data Wilayah Tidak Tersedia</Text.Body>
                </div>
            )}
        </div>
    );
}
