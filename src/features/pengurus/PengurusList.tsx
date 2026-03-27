import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { pengurusService, PengurusWithWarga } from '../../services/pengurusService';
import { pengaturanService } from '../../services/pengaturanService';
import { Plus, MagnifyingGlass, Funnel, PencilSimple, Trash, UserList, ListDashes, SquaresFour, WarningCircle } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { getFullUrl } from '../../utils/url';

export default function PengurusList() {
    const { currentTenant, currentScope } = useTenant();
    const [pengurusList, setPengurusList] = useState<PengurusWithWarga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [jabatanSettings, setJabatanSettings] = useState<string[]>([]);
    const [periodeSettings, setPeriodeSettings] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat'>('aktif');
    const navigate = useNavigate();


    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const [data, jabSettingsRaw, perSettingsRaw] = await Promise.all([
                pengurusService.getAll(currentTenant.id, currentScope),
                pengaturanService.getByKey(currentTenant.id, currentScope, 'jabatan_pengurus'),
                pengaturanService.getByKey(currentTenant.id, currentScope, 'periode_pengurus')
            ]);
            setPengurusList(data);

            if (jabSettingsRaw) {
                try {
                    const parsed = typeof jabSettingsRaw === 'string' ? JSON.parse(jabSettingsRaw) : jabSettingsRaw;
                    if (Array.isArray(parsed)) setJabatanSettings(parsed);
                } catch (e) { console.error("Error parsing jabatan settings:", e); }
            }
            if (perSettingsRaw) {
                try {
                    const parsed = typeof perSettingsRaw === 'string' ? JSON.parse(perSettingsRaw) : perSettingsRaw;
                    if (Array.isArray(parsed)) setPeriodeSettings(parsed);
                } catch (e) { console.error("Error parsing periode settings:", e); }
            }
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant, currentScope]);

    const handleDelete = async (id: string, namaJabatan: string) => {
        if (window.confirm(`Hapus data jabatan ${namaJabatan}?`)) {
            await pengurusService.delete(id);
            loadData();
        }
    };

    const filteredPengurus = pengurusList.filter(p => {
        const matchesSearch = p.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.warga?.nama && p.warga.nama.toLowerCase().includes(searchQuery.toLowerCase()));

        const statusMatch = activeTab === 'aktif'
            ? (p.status === 'aktif' || !p.status) // Fallback for old data without status
            : p.status === 'tidak aktif';

        return matchesSearch && statusMatch;
    });

    const groupedRiwayat = activeTab === 'riwayat'
        ? filteredPengurus.reduce((acc, p) => {
            const key = p.periode || 'Tanpa Periode';
            if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        }, {} as Record<string, typeof filteredPengurus>)
        : {};

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">
                        {activeTab === 'aktif' ? 'Struktur Pengurus Aktif' : 'Riwayat Kepengurusan'}
                    </h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 tracking-normal">
                        Scope: <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                        {activeTab === 'riwayat' && ' • Arsip Pejabat Terdahulu'}
                    </p>
                </div>
                <HasPermission module="Data Pengurus" action="Buat">
                    <button
                        onClick={() => navigate('/pengurus/new')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-all shadow-sm hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Tambah Jabatan</span>
                    </button>
                </HasPermission>
            </div>

            {/* TABS: AKTIF vs RIWAYAT */}
            <div className="flex border-b border-gray-200 gap-8">
                <button
                    onClick={() => setActiveTab('aktif')}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'aktif' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Struktur Aktif
                    {activeTab === 'aktif' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-t-full shadow-[0_-2px_8px_rgba(var(--brand-600-rgb),0.4)]" />}
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'riwayat' ? 'text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Riwayat Kepengurusan
                    {activeTab === 'riwayat' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-600 rounded-t-full shadow-[0_-2px_8px_rgba(var(--brand-600-rgb),0.4)]" />}
                </button>
            </div>

            {activeTab === 'aktif' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                        <div className="relative w-full sm:w-96">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari berdasarkan Jabatan atau Nama..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Tampilan List"
                                >
                                    <ListDashes weight={viewMode === 'list' ? 'bold' : 'regular'} className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    title="Tampilan Grid"
                                >
                                    <SquaresFour weight={viewMode === 'grid' ? 'bold' : 'regular'} className="w-5 h-5" />
                                </button>
                            </div>
                            <button className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                <Funnel weight="fill" className="text-gray-400" />
                                <span className="hidden sm:inline">Filter Tambahan</span>
                            </button>
                        </div>
                    </div>

                    {/* DESKTOP VIEW: TABLE */}
                    <div className={`overflow-x-auto ${viewMode === 'list' ? 'hidden md:block' : 'hidden'}`}>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[14px] font-bold border-b border-slate-200">
                                    <th className="p-4 font-semibold">Nama Jabatan</th>
                                    <th className="p-4 font-semibold">Dijabat Oleh</th>
                                    <th className="p-4 font-semibold">Periode</th>
                                    <th className="p-4 font-semibold text-center">Status</th>
                                    <th className="p-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">Memuat data...</td>
                                    </tr>
                                ) : filteredPengurus.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <UserList className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p>Belum ada struktur kepengurusan aktif.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPengurus.map((pengurus) => (
                                        <tr key={pengurus.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[14px] font-bold text-brand-700">{pengurus.jabatan}</p>
                                                    {!jabatanSettings.includes(pengurus.jabatan) && pengurus.status === 'aktif' && (
                                                        <span className="group relative">
                                                            <WarningCircle size={14} className="text-amber-500 animate-pulse" weight="fill" />
                                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                                Jabatan ini belum terdaftar di Pengaturan Sistem.
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-[14px] font-bold text-slate-800">{pengurus.warga?.nama || <span className="text-red-500 italic">Data warga tidak ditemukan</span>}</p>
                                                {pengurus.warga?.kontak && <p className="text-[12px] text-slate-500 mt-0.5">{pengurus.warga.kontak}</p>}
                                            </td>
                                            <td className="p-4 text-slate-600 text-[14px]">
                                                <div className="flex items-center gap-2">
                                                    <span>{pengurus.periode}</span>
                                                    {!periodeSettings.includes(pengurus.periode) && (
                                                        <span className="group relative">
                                                            <WarningCircle size={14} className="text-amber-500" weight="fill" />
                                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left">
                                                                Periode ini belum terdaftar di Pengaturan Sistem.
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-normal ${pengurus.status === 'tidak aktif' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                    {pengurus.status || 'aktif'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <HasPermission module="Data Pengurus" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/pengurus/edit/${pengurus.id}`)}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                                                            <PencilSimple weight="duotone" className="w-5 h-5" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Data Pengurus" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(pengurus.id, pengurus.jabatan)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                                                            <Trash weight="duotone" className="w-5 h-5" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE VIEW OR GRID CARD VIEW */}
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50' : 'md:hidden space-y-4 p-4 bg-gray-50'}`}>
                        {isLoading ? (
                            <div className="text-center text-gray-500 py-8">Memuat data...</div>
                        ) : filteredPengurus.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                                <UserList className="w-10 h-10 text-gray-300 mb-2" />
                                <p>Belum ada struktur kepengurusan aktif.</p>
                            </div>
                        ) : (
                            filteredPengurus.map((pengurus) => (
                                <div key={pengurus.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 flex gap-4">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{pengurus.jabatan}</h3>
                                                    <div className="mt-1 flex items-center gap-2">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                                                            Periode {pengurus.periode}
                                                        </span>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-normal ${pengurus.status === 'tidak aktif' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {pengurus.status || 'aktif'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <HasPermission module="Data Pengurus" action="Ubah">
                                                        <button onClick={() => navigate(`/pengurus/edit/${pengurus.id}`)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                            <PencilSimple weight="duotone" className="w-5 h-5" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Data Pengurus" action="Hapus">
                                                        <button onClick={() => handleDelete(pengurus.id, pengurus.jabatan)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                                            <Trash weight="duotone" className="w-5 h-5" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            </div>

                                            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold overflow-hidden border border-brand-200 shrink-0">
                                                    {pengurus.warga?.avatar ? (
                                                        <img src={getFullUrl(pengurus.warga.avatar)} alt={pengurus.warga.nama} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{pengurus.warga?.nama?.charAt(0) || '?'}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">{pengurus.warga?.nama || <span className="text-red-500 italic">Data warga tidak ditemukan</span>}</p>
                                                    {pengurus.warga?.kontak && <p className="text-xs text-gray-500 truncate">{pengurus.warga.kontak}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">Memuat data...</div>
                    ) : Object.keys(groupedRiwayat).length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <ListDashes className="w-6 h-6 text-gray-400" />
                                </div>
                                <p>Belum ada riwayat kepengurusan.</p>
                            </div>
                        </div>
                    ) : (
                        Object.entries(groupedRiwayat)
                            .sort(([a], [b]) => b.localeCompare(a)) // Sort by period descending
                            .map(([periode, members]) => (
                                <div key={periode} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                            <div className="w-2 h-6 bg-brand-500 rounded-full" />
                                            Periode {periode}
                                            {!periodeSettings.includes(periode) && periode !== 'Tanpa Periode' && (
                                                <span className="group relative">
                                                    <WarningCircle size={14} className="text-amber-500" weight="fill" />
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left font-normal">
                                                        Periode ini belum terdaftar di Pengaturan Sistem.
                                                    </span>
                                                </span>
                                            )}
                                        </h3>
                                        <span className="text-xs font-medium text-gray-500">{members.length} Jabatan</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="text-gray-500 text-[10px] font-bold border-b border-gray-100 bg-white">
                                                    <th className="px-6 py-3 font-semibold">Nama Jabatan</th>
                                                    <th className="px-6 py-3 font-semibold">Pejabat</th>
                                                    <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {members.map((p) => (
                                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-gray-700">{p.jabatan}</p>
                                                                {!jabatanSettings.includes(p.jabatan) && (
                                                                    <span className="group relative">
                                                                        <WarningCircle size={13} className="text-amber-500/70" weight="fill" />
                                                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left font-normal">
                                                                            Jabatan ini sudah dihapus dari Pengaturan.
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
                                                                    {p.warga?.nama?.charAt(0) || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-sm">{p.warga?.nama || 'N/A'}</p>
                                                                    <p className="text-[10px] text-gray-500">{p.warga?.kontak || '-'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1">
                                                                <button
                                                                    onClick={() => navigate(`/pengurus/edit/${p.id}`)}
                                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                                                                    <PencilSimple className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(p.id, p.jabatan)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                                                                    <Trash className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            )}
        </div>
    );
}
