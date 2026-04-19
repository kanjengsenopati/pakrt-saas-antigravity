import { useState, useEffect, useMemo } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { MapTrifold, Globe, CaretDown, CaretUp, CheckCircle, WarningCircle, Info, Buildings } from '@phosphor-icons/react';
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
    
    // Split into 4x4 Grid Rows
    const rows = [
        districtList.slice(0, 4),
        districtList.slice(4, 8),
        districtList.slice(8, 12),
        districtList.slice(12, 16)
    ];

    const DistrictCard = ({ d }: { d: any }) => {
        const isActive = expandedDistrict === d.name;
        return (
            <button
                onClick={() => setExpandedDistrict(isActive ? null : d.name)}
                className={`flex flex-col p-4 rounded-[24px] border transition-all relative group
                    ${isActive 
                        ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/20 scale-105 z-10' 
                        : 'bg-white border-white hover:border-emerald-500 hover:shadow-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`}
            >
                <div className="flex items-center justify-between mb-3">
                    <Text.Label className={`!text-[11px] !font-black !tracking-widest uppercase truncate pr-2 ${isActive ? '!text-emerald-400' : '!text-slate-400'}`}>
                        {d.name}
                    </Text.Label>
                    {isActive ? <CaretUp size={14} weight="bold" className="text-emerald-400" /> : <CaretDown size={14} weight="bold" className="text-slate-300" />}
                </div>
                
                <div className="flex items-baseline gap-1.5 mb-3">
                    <span className={`text-2xl font-black tracking-tighter ${isActive ? 'text-white' : 'text-slate-900'}`}>{d.registered}</span>
                    <span className={`text-[11px] font-bold ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>/ {d.total} RT</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5 ring-4 ring-transparent group-hover:ring-emerald-500/5 transition-all">
                    <div 
                        className={`h-full transition-all duration-1000 ${d.percent > 50 ? 'bg-emerald-500' : d.percent > 20 ? 'bg-amber-500' : 'bg-slate-300'}`}
                        style={{ width: `${Math.min(100, d.percent)}%` }}
                    />
                </div>
                <div className={`text-[10px] font-black text-right ${isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {d.percent.toFixed(1)}% Terdaftar
                </div>
            </button>
        );
    };

    const DetailPanel = ({ districtName }: { districtName: string }) => {
        const breakdown = getBreakdown(districtName);
        return (
            <div className="col-span-full my-6 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-2xl relative overflow-hidden ring-1 ring-slate-100">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                                <Globe size={28} weight="bold" />
                            </div>
                            <div>
                                <Text.H1 className="!text-2xl !font-black !text-slate-900 uppercase !tracking-tight">Kecamatan {districtName}</Text.H1>
                                <Text.Caption className="!text-slate-400 !font-black !tracking-widest uppercase !text-[11px] flex items-center gap-2 mt-1">
                                    <Buildings size={14} weight="bold" />
                                    <span>Database-Driven Regional Mapping</span>
                                </Text.Caption>
                            </div>
                        </div>
                        <button 
                            onClick={() => setExpandedDistrict(null)}
                            className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white hover:bg-black transition-all font-black text-[11px] tracking-widest shadow-xl shadow-slate-900/10 active:scale-95"
                        >
                            TUTUP PANEL
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {breakdown.map((b) => (
                            <div key={b.kelurahan} className="p-5 rounded-[24px] border border-slate-50 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all group shadow-sm hover:shadow-xl">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white">
                                    <Text.Body className="!font-black !text-slate-900 !text-[13px] uppercase tracking-tight">{b.kelurahan}</Text.Body>
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[9px] font-black shadow-lg shadow-emerald-500/20">{b.rtCount} RT</span>
                                </div>
                                
                                {b.tenants.length > 0 ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from(new Set(b.tenants.map(t => t.rw))).sort().map(rw => (
                                                <div key={rw} className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm flex flex-col min-w-[50px]">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1.5 border-b border-slate-50 pb-1">RW {rw}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {b.tenants.filter(t => t.rw === rw).map(t => (
                                                            <div key={t.id} className="w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/5" title={`RT ${t.name}`}>
                                                                <CheckCircle size={12} weight="fill" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-4 gap-2 opacity-30">
                                        <Info size={20} weight="bold" className="text-slate-400" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Belum ada RT terdaftar di Kelurahan ini</span>
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
                        <span>Live Database Sync: Kota Semarang</span>
                    </Text.Caption>
                </div>
                <div className="flex items-center gap-6 bg-white p-4 rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
                    <div className="flex flex-col items-end">
                        <Text.Amount className="!text-slate-900 !text-2xl !font-black !tracking-tighter leading-none">
                            {stats.reduce((acc, curr) => acc + curr.registered, 0)}
                        </Text.Amount>
                        <Text.Caption className="!text-slate-400 !font-black !text-[9px] uppercase tracking-widest mt-1.5">RT Terdaftar</Text.Caption>
                    </div>
                    <div className="w-px h-10 bg-slate-100" />
                    <div className="flex flex-col items-end">
                        <Text.Amount className="!text-emerald-600 !text-2xl !font-black !tracking-tighter leading-none">
                            { (stats.reduce((acc, curr) => acc + curr.total, 0) > 0) ? ( (stats.reduce((acc, curr) => acc + curr.registered, 0) / stats.reduce((acc, curr) => acc + curr.total, 0)) * 100 ).toFixed(1) : 0}%
                        </Text.Amount>
                        <Text.Caption className="!text-slate-400 !font-black !text-[9px] uppercase tracking-widest mt-1.5">Cakupan Kota</Text.Caption>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <Text.Label className="animate-pulse !text-slate-900 !text-sm !font-black">DATABASE SYNCHRONIZATION</Text.Label>
                        <Text.Caption className="!text-slate-400 !font-black uppercase tracking-widest !text-[10px]">Agregasi Data Wilayah Real-time...</Text.Caption>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Rows of 4 cards */}
                    {rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {row.map(d => <DistrictCard key={d.name} d={d} />)}
                            
                            {/* Expansion Panel if active district is in THIS row */}
                            {expandedDistrict && row.some(d => d.name === expandedDistrict) && (
                                <DetailPanel districtName={expandedDistrict} />
                            )}
                        </div>
                    ))}
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
