import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { pengurusService, PengurusWithWarga } from '../../services/pengurusService';
import { pengaturanService } from '../../services/pengaturanService';
import { Plus, Funnel, PencilSimple, Trash, UserList, ListDashes, SquaresFour, WarningCircle, Users, Briefcase } from '@phosphor-icons/react';
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
    const totalPositions = pengurusList.length;
    const activePengurus = pengurusList.filter(p => p.status === 'aktif' || !p.status).length;

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">{activeTab === 'aktif' ? 'Struktur Pengurus Aktif' : 'Riwayat Kepengurusan'}</h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 tracking-tight">
                        Scope: <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                        {activeTab === 'riwayat' && ' • Arsip Pejabat Terdahulu'}
                    </p>
                </div>
                
                <div className="flex flex-col w-full sm:w-auto gap-2">
                    <HasPermission module="Data Pengurus" action="Buat">
                        <button
                            onClick={() => navigate('/pengurus/new')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-500/10 active-press"
                        >
                            <Plus weight="bold" />
                            <span>Tambah Jabatan</span>
                        </button>
                    </HasPermission>
                </div>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 -mt-2">
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <Briefcase weight="fill" className="text-brand-500 w-3 h-3" />
                            Total Jabatan
                        </p>
                        <p className="text-[13px] sm:text-lg font-black text-slate-900 leading-none truncate tabular-nums">{totalPositions} Posisi</p>
                    </div>
                </div>

                <div className="bg-brand-600 p-3 sm:p-4 rounded-2xl border border-brand-500 shadow-lg relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-15 h-15 sm:w-24 sm:h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <Users weight="bold" className="text-amber-400 w-3 h-3" />
                            Pengurus Aktif
                        </p>
                        <p className="text-[13px] sm:text-lg font-black text-white leading-none truncate tabular-nums">{activePengurus} Orang</p>
                    </div>
                </div>
            </div>

            {/* TABS: AKTIF vs RIWAYAT */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('aktif')}
                    className={`px-6 py-3 text-[14px] font-bold transition-all border-b-2 ${activeTab === 'aktif' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}
                >
                    Struktur Aktif
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`px-6 py-3 text-[14px] font-bold transition-all border-b-2 ${activeTab === 'riwayat' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}
                >
                    Riwayat Kepengurusan
                </button>
            </div>

            {activeTab === 'aktif' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Cari Jabatan atau Nama..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="hidden sm:flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <ListDashes weight="bold" size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <SquaresFour weight="bold" size={18} />
                                </button>
                            </div>
                            <button className="flex-none flex justify-center items-center gap-2 p-2 sm:px-4 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[14px] font-normal transition-all shadow-sm active-press">
                                <Funnel weight="fill" className="text-brand-600 sm:text-slate-400" />
                                <span className="hidden sm:inline">Filter</span>
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
                    <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50/50' : 'md:hidden space-y-4 p-4 bg-slate-50/50'}`}>
                        {isLoading ? (
                            <div className="py-20 text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                <span>Sinkronisasi...</span>
                            </div>
                        ) : filteredPengurus.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                    <UserList weight="duotone" className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 tracking-tight">Data Tidak Ditemukan</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Belum ada struktur kepengurusan aktif.</p>
                                </div>
                            </div>
                        ) : (
                            filteredPengurus.map((pengurus) => (
                                <div key={pengurus.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-brand-600 flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                                                    <Briefcase weight="duotone" className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-[15px] tracking-tight leading-tight">{pengurus.jabatan}</h3>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Periode {pengurus.periode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 shadow-sm uppercase tracking-wider ${pengurus.status === 'tidak aktif' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                    {pengurus.status || 'aktif'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white text-brand-600 flex items-center justify-center font-bold overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                                                {pengurus.warga?.avatar ? (
                                                    <img src={getFullUrl(pengurus.warga.avatar)} alt={pengurus.warga.nama} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm">{pengurus.warga?.nama?.charAt(0) || '?'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-slate-900 text-[13px] truncate">{pengurus.warga?.nama || <span className="text-rose-500 italic">Data warga tidak ditemukan</span>}</p>
                                                {pengurus.warga?.kontak && <p className="text-[11px] text-slate-500 font-medium truncate">{pengurus.warga.kontak}</p>}
                                            </div>
                                        </div>

                                        <div className="flex justify-end items-center pt-4 mt-4 border-t border-slate-50 gap-2">
                                            <HasPermission module="Data Pengurus" action="Ubah">
                                                <button
                                                    onClick={() => navigate(`/pengurus/edit/${pengurus.id}`)}
                                                    className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm border border-blue-100/50"
                                                >
                                                    <PencilSimple weight="bold" size={18} />
                                                </button>
                                            </HasPermission>
                                            <HasPermission module="Data Pengurus" action="Hapus">
                                                <button
                                                    onClick={() => handleDelete(pengurus.id, pengurus.jabatan)}
                                                    className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm border border-rose-100/50"
                                                >
                                                    <Trash weight="bold" size={18} />
                                                </button>
                                            </HasPermission>
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
