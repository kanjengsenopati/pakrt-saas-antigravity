import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Eye, Buildings } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';

export default function SATenantList() {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const data = await superAdminService.getTenants(page, 15, search || undefined, statusFilter || undefined);
            setTenants(data.items || []);
            setTotal(data.total || 0);
        } catch (e) {
            console.error('Failed to load tenants:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadTenants(); }, [page, statusFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadTenants();
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

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Text.H1 className="!text-3xl !font-black !tracking-tight !text-slate-900">Kelola Tenant</Text.H1>
                    <Text.Caption className="!text-slate-500 !mt-1.5 !font-black !tracking-widest uppercase !text-[10px]">{total} RT/RW terdaftar</Text.Caption>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-3">
                    <div className="relative flex-1">
                        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama RT/RW..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-100 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                        />
                    </div>
                    <button type="submit" className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-sm font-bold transition-all shadow-lg shadow-slate-900/10 active:scale-95">
                        Cari
                    </button>
                </form>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-5 py-3 rounded-2xl bg-white border border-slate-100 text-sm text-slate-700 font-medium focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer min-w-[160px]"
                >
                    <option value="">Semua Status</option>
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="SUSPENDED">Suspended</option>
                </select>
            </div>

            {/* Table Container */}
            <div className="rounded-[24px] bg-white border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {loading ? (
                    <div className="flex items-center justify-center h-56">
                        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/30">
                                    <th className="text-left py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-bold">Tenant Details</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6 hidden md:table-cell">
                                        <Text.Label className="!text-slate-400 !font-bold">Warga</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-bold">Subscription</Text.Label>
                                    </th>
                                    <th className="text-center py-4 px-6">
                                        <Text.Label className="!text-slate-400 !font-bold">Aksi</Text.Label>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tenants.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <Text.Body className="!text-slate-900 !font-black !text-[15px]">{t.name}</Text.Body>
                                                <Text.Caption className="!text-slate-400 !font-mono !text-[10px] mt-1 !not-italic">{t.id}</Text.Caption>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center hidden md:table-cell">
                                            <div className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-50 min-w-[40px]">
                                                <Text.Amount className="!text-slate-900 !text-sm !font-black">{t._count?.wargas || 0}</Text.Amount>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${statusBadge(t.subscription_plan)}`}>
                                                    {t.subscription_plan}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadge(t.subscription_status)}`}>
                                                    {t.subscription_status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                                                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-900 text-white hover:bg-black transition-all shadow-md shadow-slate-900/10 active:scale-90"
                                                title="Detail"
                                            >
                                                <Eye size={18} weight="bold" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tenants.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-30">
                                                <Buildings size={48} weight="thin" />
                                                <span className="text-sm font-bold">Tidak ada tenant ditemukan</span>
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
                            className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                                p === page
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                    : 'bg-white border border-slate-100 text-slate-500 hover:bg-slate-50'
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
