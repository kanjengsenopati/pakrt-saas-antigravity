import { useState, useEffect } from 'react';
import { superAdminService } from '../../services/superAdminService';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Eye } from '@phosphor-icons/react';
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
            TRIAL: 'bg-sky-500/10 text-sky-400',
            ACTIVE: 'bg-emerald-500/10 text-emerald-400',
            EXPIRED: 'bg-red-500/10 text-red-400',
            SUSPENDED: 'bg-orange-500/10 text-orange-400',
            FREE: 'bg-slate-500/10 text-slate-400'
        };
        return map[status] || 'bg-slate-500/10 text-slate-400';
    };

    const totalPages = Math.ceil(total / 15);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <Text.H1 className="!text-white">Kelola Tenant</Text.H1>
                    <Text.Caption className="!text-slate-500 !mt-1 !font-medium !tracking-normal">{total} RT/RW terdaftar</Text.Caption>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama RT/RW..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-white/5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
                        Cari
                    </button>
                </form>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 border border-white/5 text-sm text-white focus:outline-none"
                >
                    <option value="">Semua Status</option>
                    <option value="TRIAL">Trial</option>
                    <option value="ACTIVE">Active</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="SUSPENDED">Suspended</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-[24px] bg-slate-900/80 border border-white/5 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Nama</Text.Label>
                                    </th>
                                    <th className="text-left py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500 hidden md:table-cell">
                                        <Text.Label className="!text-slate-500">Tenant ID</Text.Label>
                                    </th>
                                    <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Warga</Text.Label>
                                    </th>
                                    <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Plan</Text.Label>
                                    </th>
                                    <th className="text-center py-3 px-5 text-[11px) font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Status</Text.Label>
                                    </th>
                                    <th className="text-center py-3 px-5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                                        <Text.Label className="!text-slate-500">Aksi</Text.Label>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((t) => (
                                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-5">
                                            <Text.Body className="!text-white !font-bold">{t.name}</Text.Body>
                                            <Text.Caption className="!text-slate-600 md:hidden block mt-0.5">{t.id}</Text.Caption>
                                        </td>
                                        <td className="py-3 px-5 hidden md:table-cell">
                                            <Text.Caption className="!text-slate-500 font-mono">{t.id}</Text.Caption>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <Text.Body className="!text-white !font-bold tabular-nums">{t._count?.wargas || 0}</Text.Body>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(t.subscription_plan)}`}>
                                                {t.subscription_plan}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusBadge(t.subscription_status)}`}>
                                                {t.subscription_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => navigate(`/super-admin/tenants/${t.id}`)}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all"
                                                    title="Detail"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tenants.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-sm text-slate-500">
                                            Tidak ada tenant ditemukan
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
                <div className="flex items-center justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                p === page
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
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
