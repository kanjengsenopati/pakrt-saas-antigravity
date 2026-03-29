import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { pengurusService, PengurusWithWarga } from '../../services/pengurusService';
import { pengaturanService } from '../../services/pengaturanService';
import { 
    Plus, 
    Funnel, 
    PencilSimple, 
    Trash, 
    UserList, 
    ListDashes, 
    SquaresFour, 
    WarningCircle, 
    Users, 
    Briefcase,
    BookOpen,
    FloppyDisk,
    PlusCircle,
    X,
    User
} from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import { HasPermission } from '../../components/auth/HasPermission';
import { getFullUrl } from '../../utils/url';
import RichTextEditor from '../../components/ui/RichTextEditor';

export default function PengurusList() {
    const { currentTenant, currentScope } = useTenant();
    const location = useLocation();
    const navigate = useNavigate();
    const { hasRole } = useAuth();
    
    // Check for tab hint in navigation state
    const stateTab = location.state?.activeTab;

    const [pengurusList, setPengurusList] = useState<PengurusWithWarga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [jabatanSettings, setJabatanSettings] = useState<string[]>([]);
    const [periodeSettings, setPeriodeSettings] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    
    const [activeTab, setActiveTab] = useState<'aktif' | 'riwayat' | 'ad-art'>(
        stateTab || (hasRole('Warga') ? 'ad-art' : 'aktif')
    );
    const [adArtData, setAdArtData] = useState<any>({ 
        active: {
            categories: {
                'Status Kependudukan': '',
                'Hak dan Kewajiban': '',
                'Pemilihan Ketua RT & Pengurus': ''
            }
        },
        archives: []
    });
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('Status Kependudukan');
    const [isSavingAdArt, setIsSavingAdArt] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const [data, jabSettingsRaw, perSettingsRaw, adArtRaw] = await Promise.all([
                pengurusService.getAll(currentTenant.id, currentScope),
                pengaturanService.getByKey(currentTenant.id, currentScope, 'jabatan_pengurus'),
                pengaturanService.getByKey(currentTenant.id, currentScope, 'periode_pengurus'),
                pengaturanService.getByKey(currentTenant.id, currentScope, 'ad_art')
            ]);
            setPengurusList(data);

            if (jabSettingsRaw) {
                try {
                    const rawValue = (jabSettingsRaw as any).value || jabSettingsRaw;
                    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
                    if (Array.isArray(parsed)) setJabatanSettings(parsed);
                } catch (e) { console.error("Error parsing jabatan settings:", e); }
            }
            if (perSettingsRaw) {
                try {
                    const rawValue = (perSettingsRaw as any).value || perSettingsRaw;
                    const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
                    if (Array.isArray(parsed)) setPeriodeSettings(parsed);
                } catch (e) { console.error("Error parsing periode settings:", e); }
            }

            if (adArtRaw && adArtRaw.value) {
                const val = adArtRaw.value as any;
                // Auto-migration for old flat structure
                if (val.categories && !val.active) {
                    setAdArtData({
                        active: val,
                        archives: []
                    });
                    const categories = Object.keys(val.categories);
                    if (categories.length > 0) setActiveCategory(categories[0]);
                } else if (val.active) {
                    setAdArtData(val);
                    const categories = Object.keys(val.active.categories);
                    if (categories.length > 0) setActiveCategory(categories[0]);
                }
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

    const saveAdArt = async () => {
        if (!currentTenant) return;
        
        const versionName = window.prompt("Berikan nama untuk versi perubahan ini (contoh: Amandemen 2026):", "Pembaruan AD/ART");
        if (versionName === null) return; // User cancelled

        const chairman = pengurusList.find(p => p.jabatan?.toLowerCase().includes('ketua') && p.jabatan?.toLowerCase().includes(currentScope.toLowerCase()))?.warga?.nama || "Tidak Diketahui";
        
        setIsSavingAdArt(true);
        try {
            const newArchive = {
                id: crypto.randomUUID(),
                name: adArtData.active.metadata?.version || "Versi Sebelumnya",
                date: adArtData.active.metadata?.date || new Date().toISOString(),
                chairman: adArtData.active.metadata?.chairman || chairman,
                content: { ...adArtData.active.categories }
            };

            const updatedData = {
                active: {
                    categories: adArtData.active.categories,
                    metadata: {
                        version: versionName,
                        date: new Date().toISOString(),
                        chairman: chairman
                    }
                },
                archives: [newArchive, ...(adArtData.archives || [])]
            };

            await pengaturanService.save(currentTenant.id, currentScope, 'ad_art', updatedData);
            setAdArtData(updatedData);
            alert("AD/ART Berhasil Diperbarui & Diarsipkan.");
        } catch (error) {
            console.error("Failed to save AD/ART:", error);
            alert("Gagal menyimpan AD/ART");
        } finally {
            setIsSavingAdArt(false);
        }
    };

    const restoreArchive = (archive: any) => {
        if (window.confirm(`Pulihkan versi "${archive.name}"? Perubahan saat ini akan hilang jika belum disimpan.`)) {
            setAdArtData((prev: any) => ({
                ...prev,
                active: {
                    categories: { ...archive.content },
                    metadata: {
                        version: `Pemulihan: ${archive.name}`,
                        date: new Date().toISOString(),
                        chairman: archive.chairman
                    }
                }
            }));
            setShowVersionHistory(false);
        }
    };

    const addCategory = () => {
        if (!newCategoryName.trim()) return;
        if (adArtData.active.categories[newCategoryName]) {
            alert("Kategori sudah ada");
            return;
        }
        setAdArtData((prev: any) => ({
            ...prev,
            active: {
                ...prev.active,
                categories: {
                    ...prev.active.categories,
                    [newCategoryName]: ''
                }
            }
        }));
        setActiveCategory(newCategoryName);
        setNewCategoryName('');
        setIsAddingCategory(false);
    };

    const deleteCategory = (catName: string) => {
        if (window.confirm(`Hapus kategori "${catName}"?`)) {
            setAdArtData((prev: any) => {
                const newCats = { ...prev.active.categories };
                delete newCats[catName];
                return {
                    ...prev,
                    active: {
                        ...prev.active,
                        categories: newCats
                    }
                };
            });
            const remaining = Object.keys(adArtData.active.categories).filter(c => c !== catName);
            if (activeCategory === catName) {
                setActiveCategory(remaining[0] || '');
            }
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
                    <h1 className="text-[18px] font-medium text-slate-900 tracking-tight leading-tight">
                        {activeTab === 'aktif' ? 'Struktur Pengurus Aktif' : 
                         activeTab === 'riwayat' ? 'Riwayat Kepengurusan' : 'Ad / Art (Aturan & Regulasi)'}
                    </h1>
                    <p className="text-slate-500 text-[14px] mt-1 font-normal flex items-center gap-1.5 tracking-tight">
                        Scope: <span className="font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                        {activeTab === 'riwayat' && ' • Arsip Pejabat Terdahulu'}
                    </p>
                </div>
                
                <div className="flex flex-col w-full sm:w-auto gap-2">
                    <HasPermission module="Data Pengurus" action="Buat">
                        <button
                            onClick={() => navigate('/pengurus/new')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium text-[16px] transition-all shadow-lg shadow-brand-500/10 active-press"
                        >
                            <Plus weight="bold" />
                            <span>Tambah Jabatan</span>
                        </button>
                    </HasPermission>
                </div>
            </div>

            {/* STATS WIDGETS - Premium Refined */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 -mt-2">
                <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[14px] font-medium text-slate-400 mb-2 flex items-center gap-2 justify-center">
                            <Briefcase weight="fill" className="text-brand-500 w-4 h-4" />
                            Total Jabatan
                        </p>
                        <p className="text-[18px] font-normal text-slate-900 leading-none truncate tabular-nums">{totalPositions} Posisi</p>
                    </div>
                </div>

                <div className="bg-brand-600 p-4 sm:p-5 rounded-3xl border border-brand-500 shadow-xl relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-15 h-15 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <p className="text-[14px] font-medium text-white/70 mb-2 flex items-center gap-2 justify-center">
                            <Users weight="bold" className="text-amber-400 w-4 h-4" />
                            Pengurus Aktif
                        </p>
                        <p className="text-[18px] font-normal text-white leading-none truncate tabular-nums">{activePengurus} Orang</p>
                    </div>
                </div>
            </div>

            {/* TABS: AKTIF vs RIWAYAT vs AD/ART */}
            <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('aktif')}
                    className={`px-6 py-4 text-[16px] font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'aktif' ? 'border-brand-600 text-brand-600 bg-brand-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}
                >
                    Struktur Aktif
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`px-6 py-4 text-[16px] font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'riwayat' ? 'border-brand-600 text-brand-600 bg-brand-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}
                >
                    Riwayat Kepengurusan
                </button>
                <button
                    onClick={() => setActiveTab('ad-art')}
                    className={`px-6 py-4 text-[16px] font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === 'ad-art' ? 'border-brand-600 text-brand-600 bg-brand-50/30' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}
                >
                    Ad / Art
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
                                <tr className="bg-slate-50 text-slate-500 text-[14px] font-medium border-b border-slate-200">
                                    <th className="p-4 font-medium">Nama Jabatan</th>
                                    <th className="p-4 font-medium">Dijabat Oleh</th>
                                    <th className="p-4 font-medium">Periode</th>
                                    <th className="p-4 font-medium text-center">Status</th>
                                    <th className="p-4 font-medium text-right">Aksi</th>
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
                                    filteredPengurus.map((pengurus: any) => (
                                        <tr key={pengurus.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[14px] font-medium text-brand-700">{pengurus.jabatan}</p>
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
                                                <p className="text-[14px] font-medium text-slate-800">{pengurus.warga?.nama || <span className="text-red-500 italic">Data warga tidak ditemukan</span>}</p>
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
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-normal ${pengurus.status === 'tidak aktif' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
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
                            <div className="py-20 text-center text-slate-400 font-medium text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                <span>Sinkronisasi...</span>
                            </div>
                        ) : filteredPengurus.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                    <UserList weight="duotone" className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900 tracking-tight">Data Tidak Ditemukan</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Belum ada struktur kepengurusan aktif.</p>
                                </div>
                            </div>
                        ) : (
                            filteredPengurus.map((pengurus: any) => (
                                <div key={pengurus.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-brand-600 flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                                                    <Briefcase weight="duotone" className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-slate-900 text-[15px] tracking-tight leading-tight">{pengurus.jabatan}</h3>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Periode {pengurus.periode}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1.5 shadow-sm uppercase tracking-wider ${pengurus.status === 'tidak aktif' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                    {pengurus.status || 'aktif'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white text-brand-600 flex items-center justify-center font-medium overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                                                {pengurus.warga?.avatar ? (
                                                    <img src={getFullUrl(pengurus.warga.avatar)} alt={pengurus.warga.nama} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm">{pengurus.warga?.nama?.charAt(0) || '?'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 text-[13px] truncate">{pengurus.warga?.nama || <span className="text-rose-500 italic">Data warga tidak ditemukan</span>}</p>
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
            ) : activeTab === 'riwayat' ? (
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
                            .map(([periode, members]: [string, any]) => (
                                <div key={periode} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
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
                                                <tr className="text-gray-500 text-[10px] font-medium border-b border-gray-100 bg-white">
                                                    <th className="px-6 py-3 font-medium">Nama Jabatan</th>
                                                    <th className="px-6 py-3 font-medium">Pejabat</th>
                                                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {members.map((p: any) => (
                                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-gray-700">{p.jabatan}</p>
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
                                                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-medium shrink-0">
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
            ) : (
                <div className="space-y-6 animate-fade-in">
                    {/* Full Width Category Navigation */}
                    <div className="sticky top-[73px] z-30 bg-white border-b border-slate-100 shadow-sm sm:static sm:bg-transparent sm:border-none sm:shadow-none">
                        <div className="p-3 sm:px-4 sm:py-2 border-b border-slate-100 sm:border-none bg-slate-50/50 sm:bg-transparent flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="font-medium text-slate-800 text-[16px] flex items-center gap-2">
                                <BookOpen weight="fill" className="text-brand-600" />
                                Pilih Kategori
                            </h3>
                            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                                <button 
                                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border shrink-0 ${showVersionHistory ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <ListDashes weight="bold" size={16} />
                                    <span>{adArtData.archives?.length || 0} Arsip</span>
                                </button>
                                <HasPermission module="Data Pengurus" action="Ubah">
                                    <button 
                                        onClick={() => setIsAddingCategory(true)}
                                        className={`flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-medium hover:bg-brand-700 transition-all shadow-sm shrink-0 ${isAddingCategory ? 'opacity-50' : ''}`}
                                    >
                                        <PlusCircle weight="fill" size={16} />
                                        <span>Tambah</span>
                                    </button>
                                </HasPermission>
                            </div>
                        </div>
                        
                        <div className="relative group">
                            {/* Scroll Indicators */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="p-3 sm:p-2 overflow-x-auto scrollbar-hide bg-white sm:bg-transparent">
                                <div className="flex items-center gap-2 min-w-max px-2">
                                    {Object.keys(adArtData.active?.categories || {}).map((cat) => (
                                        <div key={cat} className="group/tab relative flex items-center">
                                            <button
                                                onClick={() => { setActiveCategory(cat); setShowVersionHistory(false); }}
                                                className={`px-5 py-2.5 rounded-2xl text-[16px] font-medium transition-all shadow-sm ${activeCategory === cat && !showVersionHistory ? 'bg-brand-600 text-white shadow-brand-500/20' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                {cat}
                                            </button>
                                            <HasPermission module="Data Pengurus" action="Ubah">
                                                <button 
                                                    onClick={() => deleteCategory(cat)}
                                                    className="absolute -top-1.5 -right-1.5 p-1.5 bg-white border border-slate-200 rounded-full text-rose-500 opacity-0 group-hover/tab:opacity-100 hover:bg-rose-50 transition-all shadow-md z-10"
                                                >
                                                    <X size={10} weight="bold" />
                                                </button>
                                            </HasPermission>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {isAddingCategory && (
                            <div className="p-4 bg-brand-50/50 border-t border-brand-100 flex items-center gap-3 animate-slide-down">
                                <input 
                                    autoFocus
                                    type="text"
                                    placeholder="Nama kategori baru..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="flex-1 text-sm bg-white"
                                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                />
                                <button onClick={addCategory} className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl">Simpan</button>
                                <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 text-xs font-bold rounded-xl">Batal</button>
                            </div>
                        )}
                    </div>

                    <div className="w-full">
                        {showVersionHistory ? (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-slate-100 bg-amber-50/30">
                                    <h2 className="font-medium text-slate-900 text-lg">Arsip & Dokumentasi Perubahan</h2>
                                    <p className="text-xs text-slate-500 mt-1">Daftar versi AD/ART yang pernah diterbitkan sebelumnya.</p>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {adArtData.archives?.map((archive: any) => (
                                        <div key={archive.id} className="group bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all relative">
                                            <div className="flex flex-col h-full">
                                                <div className="mb-4">
                                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-lg tracking-wider mb-2 inline-block">Archived Version</span>
                                                    <h4 className="font-medium text-slate-900 text-base">{archive.name}</h4>
                                                </div>
                                                <div className="space-y-2 mb-6">
                                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                                        <FloppyDisk weight="fill" className="text-slate-400" />
                                                        {new Date(archive.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                                        <User weight="fill" className="text-slate-400" />
                                                        Ketua: <span className="font-medium text-slate-700">{archive.chairman}</span>
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => restoreArchive(archive)}
                                                    className="w-full mt-auto py-2.5 bg-white border border-brand-200 text-brand-600 text-xs font-medium rounded-xl hover:bg-brand-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    Pulihkan Versi Ini
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!adArtData.archives || adArtData.archives.length === 0) && (
                                        <div className="col-span-full py-12 text-center text-slate-400 italic">Belum ada arsip versi terdahulu.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[800px]">
                                    {/* Document Header Info - Breadcrumb style */}
                                    <div className="px-6 py-10 sm:px-10 sm:py-12 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-4">
                                        <div className="space-y-3">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-700 text-[14px] font-medium rounded-lg">
                                                Dokumen Aturan & Regulasi
                                            </div>
                                            <h2 className="text-[18px] font-medium text-slate-900 tracking-tight leading-tight">{activeCategory}</h2>
                                            {adArtData.active.metadata && (
                                                <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-slate-500 font-medium tracking-wider">
                                                    <span className="flex items-center gap-1.5"><ListDashes className="text-slate-400" /> Versi {adArtData.active.metadata.version}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                                                    <span className="flex items-center gap-1.5"><PlusCircle className="text-slate-400" /> {new Date(adArtData.active.metadata.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                            )}
                                        </div>
                                        <HasPermission module="Data Pengurus" action="Ubah">
                                            <button
                                                onClick={saveAdArt}
                                                disabled={isSavingAdArt}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-[24px] font-medium text-xs tracking-widest transition-all shadow-xl shadow-brand-500/40 active:scale-95 mb-1"
                                            >
                                                <FloppyDisk weight="bold" size={20} />
                                                <span>{isSavingAdArt ? 'Menyimpan...' : 'Terbitkan Amandemen'}</span>
                                            </button>
                                        </HasPermission>
                                    </div>

                                    <div className="p-0">
                                        <HasPermission
                                            module="Data Pengurus"
                                            action="Ubah"
                                            fallback={
                                                <RichTextEditor
                                                    readOnly 
                                                    value={adArtData.active.categories[activeCategory] || ''} 
                                                    onChange={() => {}} 
                                                />
                                            }
                                        >
                                            <RichTextEditor
                                                value={adArtData.active.categories[activeCategory] || ''}
                                                onChange={(val) => setAdArtData((prev: any) => ({
                                                    ...prev,
                                                    active: {
                                                        ...prev.active,
                                                        categories: { ...prev.active.categories, [activeCategory]: val }
                                                    }
                                                }))}
                                                placeholder={`Uraikan aturan dan ketentuan untuk ${activeCategory} di sini...`}
                                            />
                                        </HasPermission>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
