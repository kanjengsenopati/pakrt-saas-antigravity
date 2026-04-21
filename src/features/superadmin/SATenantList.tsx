import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Eye, Buildings, Users, MapPin, MapTrifold, CheckCircle } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
import { semarangRegions } from '../../data/semarangRegions';

export default function SATenantList() {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [kecamatan, setKecamatan] = useState('');
    const [kelurahan, setKelurahan] = useState('');
    const [rw, setRw] = useState('');
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tenantData, overviewData] = await Promise.all([
                superAdminService.getTenants(page, 15, search || undefined, statusFilter || undefined, kecamatan || undefined, kelurahan || undefined, rw || undefined),
                superAdminService.getOverview()
            ]);
            setTenants(tenantData.items || []);
            setTotal(tenantData.total || 0);
            setOverview(overviewData);
        } catch (e) {
            console.error('Failed to load tenants:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [page, statusFilter, kecamatan, kelurahan, rw]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadData();
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            TRIAL: 'bg-sky-50 text-sky-600 border-sky-100',
            ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            EXPIRED: 'bg-red-50 text-red-600 border-red-100',
            SUSPENDED: 'bg-orange-50 text-orange-600 border-orange-100',
            FREE: 'bg-slate-50 text-slate-600 border-slate-100'
        };
        return map[status] || 'bg-slate-50 text-slate-500 border-slate-100';
    };

    const stats = [
        { label: 'Total RT/RW', value: total, icon: Buildings, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Active Tenants', value: overview?.subscriptions?.active || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Total Warga', value: overview?.totalWarga || 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: 'Trial Period', value: overview?.subscriptions?.trial || 0, icon: MapTrifold, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <Text.H1 className="!text-3xl !font-black !tracking-tight !text-slate-900">Platform Management</Text.H1>
                    <Text.Caption className="!text-slate-400 !mt-1.5 !font-black !tracking-widest uppercase !text-[11px] flex items-center gap-2">
                        <MapPin size={14} weight="bold" />
                        <span>Inventory & Coverage Monitoring</span>
                    </Text.Caption>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white rounded-[24px] border border-slate-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group">
                        <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-50">
                            <div className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                                <s.icon size={18} weight="bold" />
                            </div>
                            <Text.H2 className="!text-slate-800 !font-bold !tracking-tight !text-[16px] truncate leading-none uppercase">{s.label}</Text.H2>
                        </div>
                        <div className="text-center">
                            <Text.Amount className={`${s.color} !text-3xl !font-black leading-none !tracking-tighter`}>
                                {s.value.toLocaleString('id-ID')}
                            </Text.Amount>
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Filters Section */}
            <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="relative flex-1 group">
                        <MagnifyingGlass size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama RT/RW atau ID Tenant..."
                            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-100 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
                        />
                    </div>
                    <button type="submit" className="px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white text-sm font-black transition-all shadow-lg shadow-slate-900/20 active:scale-95">
                        Cari
                    </button>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-6 py-3.5 rounded-2xl bg-white border border-slate-100 text-sm font-black text-slate-700 hover:border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer min-w-[160px] shadow-sm"
                    >
                        <option value="">Status Berlangganan</option>
                        <option value="TRIAL">TRIAL PERIOD</option>
                        <option value="ACTIVE">ACTIVE SUBS</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                </form>

                {/* Location Cascading Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="relative">
                        <select
                            value={kecamatan}
                            onChange={(e) => { setKecamatan(e.target.value); setKelurahan(''); setPage(1); }}
                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-black text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">Pilih Kecamatan (Semarang)</option>
                            {Object.keys(semarangRegions).map(k => (
                                <option key={k} value={k}>{k.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            value={kelurahan}
                            disabled={!kecamatan}
                            onChange={(e) => { setKelurahan(e.target.value); setPage(1); }}
                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-black text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                            <option value="">Pilih Kelurahan</option>
                            {kecamatan && semarangRegions[kecamatan].map(kel => (
                                <option key={kel} value={kel}>{kel.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={rw}
                            onChange={(e) => { setRw(e.target.value); setPage(1); }}
                            placeholder="Filter nomor RW (misal: 01)"
                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[13px] font-black text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="rounded-[24px] bg-white border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg" />
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <th className="py-4 px-6 w-16">
                                        <Text.Label className="!text-slate-400 !font-black !text-center block">#</Text.Label>
                                    </th>
                                    <th className="text-left py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-black">Tenant Information</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6 hidden md:table-cell">
                                        <Text.Label className="!text-slate-400 !font-black">Inventory</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-black">Plans & status</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6 w-24">
                                        <Text.Label className="!text-slate-400 !font-black">Actions</Text.Label>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tenants.map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-[12px] font-black text-slate-300">{(page - 1) * 15 + idx + 1}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-1.5">
                                                <Text.Body className="!text-slate-900 !font-black !text-[15px] leading-tight">{t.name}</Text.Body>
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-[9px] font-black text-slate-500 font-mono tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">{t.id}</span>
                                                    {t.kelurahan && (
                                                        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/50 flex items-center gap-1 uppercase tracking-widest leading-none">
                                                            <MapPin size={10} weight="fill" />
                                                            {t.kelurahan}
                                                        </span>
                                                    )}
                                                    {t.kecamatan && (
                                                        <span className="text-[9px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded-md border border-slate-100 uppercase tracking-widest leading-none shadow-sm">
                                                            {t.kecamatan}
                                                        </span>
                                                    )}
                                                    {(!t.kelurahan && !t.kecamatan) && (
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">WILAYAH LOKAL</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center hidden md:table-cell">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <Text.Amount className="!text-slate-900 !text-xl !font-black leading-none">{t._count?.wargas || 0}</Text.Amount>
                                                <Text.Caption className="!text-slate-400 !font-black uppercase !text-[8px] tracking-widest">Warga Terdata</Text.Caption>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${statusBadge(t.subscription_plan)}`}>
                                                    {t.subscription_plan}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter ${statusBadge(t.subscription_status)}`}>
                                                    {t.subscription_status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-black transition-all shadow-md shadow-slate-900/10 active:scale-90"
                                            >
                                                <Eye size={18} weight="bold" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tenants.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Buildings size={40} className="text-slate-300" />
                                                </div>
                                                <Text.Body className="!font-black !text-slate-400 uppercase tracking-widest">No matching tenants found in {kecamatan || 'Semarang'}</Text.Body>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-11 h-11 rounded-2xl text-[13px] font-black transition-all ${
                                p === page
                                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20'
                                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50 hover:shadow-md'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
