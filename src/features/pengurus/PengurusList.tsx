import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { pengurusService, PengurusWithWarga } from '../../services/pengurusService';
import { pengaturanService } from '../../services/pengaturanService';
import { 
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
    Plus,
    PlusCircle,
    X,
    User,
    MagnifyingGlass,
    ClockCounterClockwise
} from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import { HasPermission } from '../../components/auth/HasPermission';
import { getFullUrl } from '../../utils/url';
import RichTextEditor from '../../components/ui/RichTextEditor';
import { Text } from '../../components/ui/Typography';
import { toTitleCase } from '../../utils/text';

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

        const chairman = toTitleCase(pengurusList.find(p => p.jabatan?.toLowerCase().includes('ketua') && p.jabatan?.toLowerCase().includes(currentScope.toLowerCase()))?.warga?.nama || "Tidak Diketahui");
        
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
        <div className="space-y-4 sm:space-y-8 animate-fade-in max-w-7xl mx-auto px-1 sm:px-0">
            {/* COMPACT MOBILE-FIRST HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-3 sm:px-0">
                <div className="space-y-1">
                    <Text.H1>
                        {activeTab === 'aktif' ? 'Struktur Pengurus' : 
                         activeTab === 'riwayat' ? 'Riwayat Pejabat' : 'Aturan & Regulasi'}
                    </Text.H1>
                    <div className="flex items-center gap-2 text-slate-500 text-[13px] sm:text-[14px]">
                        <Text.Caption className="!flex items-baseline gap-1.5 opacity-70">
                            <Briefcase size={14} className="self-center" /> {currentScope}
                        </Text.Caption>
                        {activeTab === 'riwayat' && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <Text.Caption className="opacity-70">Arsip Historis</Text.Caption>
                            </>
                        )}
                    </div>
                </div>
                
                <HasPermission module="Data Pengurus" action="Buat">
                    <button
                        onClick={() => navigate('/pengurus/new')}
                        className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <Text.Body component="span" className="!text-white !font-bold">Tambah Jabatan</Text.Body>
                    </button>
                    
                    {/* MOBILE FAB */}
                    <button
                        onClick={() => navigate('/pengurus/new')}
                        className="sm:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            {/* PREMIUM STATS WIDGETS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-3 sm:px-0 -mt-2">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
                    <Text.Label className="mb-1.5 !flex items-center gap-2">
                        <Briefcase weight="duotone" className="text-slate-400 w-4 h-4" />
                        Total Struktur
                    </Text.Label>
                    <div className="flex items-baseline gap-1">
                        <Text.Amount className="!text-2xl !text-slate-900">{totalPositions}</Text.Amount>
                        <Text.Label className="!text-slate-400 !normal-case">Posisi</Text.Label>
                    </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:bg-slate-950 transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <Text.Label className="mb-1.5 !flex items-center gap-2">
                        <Users weight="duotone" className="text-brand-400 w-4 h-4" />
                        Pejabat Aktif
                    </Text.Label>
                    <div className="flex items-baseline gap-1">
                        <Text.Amount className="!text-2xl !text-white">{activePengurus}</Text.Amount>
                        <Text.Label className="!text-slate-500 !normal-case">Orang</Text.Label>
                    </div>
                </div>
            </div>

            {/* PILL-STYLE TAB NAVIGATION */}
            <div className="px-3 sm:px-0">
                <div className="bg-slate-100/50 p-1 rounded-xl flex items-center gap-1 w-full md:w-fit border border-slate-100 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setActiveTab('aktif')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'aktif' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserList weight="bold" /> <Text.Label className="!text-inherit">Struktur Aktif</Text.Label>
                    </button>
                    <button
                        onClick={() => setActiveTab('riwayat')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'riwayat' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClockCounterClockwise weight="bold" /> <Text.Label className="!text-inherit">Riwayat</Text.Label>
                    </button>
                    <button
                        onClick={() => setActiveTab('ad-art')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ad-art' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <BookOpen weight="bold" /> <Text.Label className="!text-inherit">AD / ART</Text.Label>
                    </button>
                </div>
            </div>

            {activeTab === 'aktif' ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
                        <div className="relative flex-1 group">
                            <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Cari Jabatan Atau Nama Pengurus..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm font-medium"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="hidden sm:flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
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
                            <button className="flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all shadow-sm active-press">
                                <Funnel weight="bold" className="text-brand-600" />
                                <Text.Body component="span" className="!font-bold">Filter</Text.Body>
                            </button>
                        </div>
                    </div>

                    {/* DESKTOP VIEW: TABLE */}
                    <div className={`overflow-x-auto ${viewMode === 'list' ? 'hidden md:block' : 'hidden'}`}>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4"><Text.Label>Nama Jabatan</Text.Label></th>
                                    <th className="p-4"><Text.Label>Dijabat Oleh</Text.Label></th>
                                    <th className="p-4"><Text.Label>Periode</Text.Label></th>
                                    <th className="p-4 text-center"><Text.Label>Status</Text.Label></th>
                                    <th className="p-4 text-right"><Text.Label>Aksi</Text.Label></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center"><Text.Body className="!text-gray-500">Memuat Data...</Text.Body></td>
                                    </tr>
                                ) : filteredPengurus.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <UserList className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <Text.Body>Belum Ada Struktur Kepengurusan Aktif.</Text.Body>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPengurus.map((pengurus: any) => (
                                        <tr key={pengurus.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Text.H2 className="!text-brand-700 !text-sm">{pengurus.jabatan}</Text.H2>
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
                                                <Text.Body className="!text-slate-800 !font-bold">{toTitleCase(pengurus.warga?.nama || '') || <Text.Body component="span" className="!text-red-500 italic">Data warga tidak ditemukan</Text.Body>}</Text.Body>
                                                {pengurus.warga?.kontak && <Text.Caption className="!text-slate-500 !mt-0.5 tracking-[1px]">{pengurus.warga.kontak}</Text.Caption>}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-[14px]">
                                                    <Text.Body component="span" className="!font-medium !text-slate-600">{pengurus.periode}</Text.Body>
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
                                                <Text.Label className={`!inline-flex items-center !px-3 !py-1 rounded-full ${pengurus.status === 'tidak aktif' ? '!bg-rose-50 !text-rose-600 border border-rose-100' : '!bg-emerald-50 !text-emerald-600 border border-emerald-100'}`}>
                                                    {pengurus.status === 'tidak aktif' ? 'Tidak Aktif' : 'Aktif'}
                                                </Text.Label>
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
                            <div className="py-20 text-center animate-pulse flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                <Text.Label className="!text-slate-400">Sinkronisasi...</Text.Label>
                            </div>
                        ) : filteredPengurus.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                    <UserList weight="duotone" className="w-8 h-8" />
                                </div>
                                <div>
                                    <Text.H2 className="!text-sm !text-slate-900">Data Tidak Ditemukan</Text.H2>
                                    <Text.Caption className="!mt-1 italic">Belum ada struktur kepengurusan aktif.</Text.Caption>
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
                                                    <Text.H2 className="!text-slate-900 !text-[15px] !tracking-tight !leading-tight">{pengurus.jabatan}</Text.H2>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Text.Label className="!text-slate-400 !normal-case">Periode {pengurus.periode}</Text.Label>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Text.Label className={`!px-2.5 !py-1 rounded-lg border !flex items-center gap-1.5 shadow-sm ${pengurus.status === 'tidak aktif' ? '!bg-red-50 !text-red-600 border-red-100' : '!bg-emerald-50 !text-emerald-600 border-emerald-100'}`}>
                                                    {pengurus.status === 'tidak aktif' ? 'Tidak Aktif' : 'Aktif'}
                                                </Text.Label>
                                            </div>
                                        </div>

                                        <div className="mt-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white text-brand-600 flex items-center justify-center font-medium overflow-hidden border border-slate-200 shrink-0 shadow-sm">
                                                {pengurus.warga?.avatar ? (
                                                    <img src={getFullUrl(pengurus.warga.avatar)} alt={pengurus.warga.nama} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Text.Body component="span" className="!text-sm">{pengurus.warga?.nama?.charAt(0) || '?'}</Text.Body>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Text.Body className="!font-bold !text-slate-900 !text-[13px] truncate">{toTitleCase(pengurus.warga?.nama || '') || <Text.Body component="span" className="!text-rose-500 italic">Data warga tidak ditemukan</Text.Body>}</Text.Body>
                                                {pengurus.warga?.kontak && <Text.Caption className="!text-slate-500 truncate tracking-[1px]">{pengurus.warga.kontak}</Text.Caption>}
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
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center"><Text.Body className="!text-gray-500">Memuat Data...</Text.Body></div>
                    ) : Object.keys(groupedRiwayat).length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center space-y-3">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <ListDashes className="w-6 h-6 text-gray-400" />
                                </div>
                                <Text.Body>Belum Ada Riwayat Kepengurusan.</Text.Body>
                            </div>
                        </div>
                    ) : (
                        Object.entries(groupedRiwayat)
                            .sort(([a], [b]) => b.localeCompare(a)) // Sort by period descending
                            .map(([periode, members]: [string, any]) => (
                                <div key={periode} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <Text.H2 className="!text-gray-900 !flex !items-center !gap-2">
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
                                        </Text.H2>
                                        <Text.Label className="!text-gray-500 !normal-case">{members.length} Jabatan</Text.Label>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-white">
                                                    <th className="px-6 py-3"><Text.Label className="!text-gray-500">Nama Jabatan</Text.Label></th>
                                                    <th className="px-6 py-3"><Text.Label className="!text-gray-500">Pejabat</Text.Label></th>
                                                    <th className="px-6 py-3 text-right"><Text.Label className="!text-gray-500">Aksi</Text.Label></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {members.map((p: any) => (
                                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Text.H2 className="!text-gray-700 !text-sm">{p.jabatan}</Text.H2>
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
                                                                    <Text.Body component="span" className="!text-xs">{p.warga?.nama?.charAt(0) || '?'}</Text.Body>
                                                                </div>
                                                                <div>
                                                                    <Text.Body className="!text-gray-900 !font-bold !text-sm">{toTitleCase(p.warga?.nama || 'N/A')}</Text.Body>
                                                                    <Text.Caption className="!text-gray-500 tracking-[1px]">{p.warga?.kontak || '-'}</Text.Caption>
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
                    {/* Full Width Category Navigation */}                    {/* CATEGORY NAV: PILL STYLE WITH SCROLL MASK */}
                    <div className="sticky top-[73px] z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 sm:static sm:bg-transparent sm:border-none">
                        <div className="p-3 sm:px-0 sm:py-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <Text.H2 className="!font-medium !text-slate-800 !text-[15px] !flex !items-center !gap-2 !px-1">
                                <BookOpen weight="fill" className="text-brand-600" />
                                Kategori Aturan
                            </Text.H2>
                            <div className="flex items-center gap-2 w-full sm:w-auto px-1">
                                <button 
                                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border shrink-0 ${showVersionHistory ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    <ListDashes weight="bold" size={14} />
                                    <Text.Label className="!text-inherit">{adArtData.archives?.length || 0} Arsip</Text.Label>
                                </button>
                                <HasPermission module="Data Pengurus" action="Ubah">
                                    <button 
                                        onClick={() => setIsAddingCategory(true)}
                                        className={`flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-full text-[11px] font-medium hover:bg-black transition-all shadow-sm shrink-0 ${isAddingCategory ? 'opacity-50' : ''}`}
                                    >
                                        <PlusCircle weight="fill" size={14} />
                                        <Text.Label className="!text-white">Kategori Baru</Text.Label>
                                    </button>
                                </HasPermission>
                            </div>
                        </div>
                        
                        <div className="relative group overflow-hidden">
                            <div className="overflow-x-auto hide-scrollbar snap-x px-3 sm:px-0">
                                <div className="flex items-center gap-2 min-w-max pb-3 pt-1">
                                    {Object.keys(adArtData.active?.categories || {}).map((cat) => (
                                        <div key={cat} className="group/tab relative flex items-center snap-center">
                                            <button
                                                onClick={() => { setActiveCategory(cat); setShowVersionHistory(false); }}
                                                className={`px-5 py-2 rounded-full transition-all border ${activeCategory === cat && !showVersionHistory ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/20' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'}`}
                                            >
                                                <Text.Body component="span" className="!font-bold !text-inherit">{cat}</Text.Body>
                                            </button>
                                            <HasPermission module="Data Pengurus" action="Ubah">
                                                <button 
                                                    onClick={() => deleteCategory(cat)}
                                                    className="absolute -top-1 -right-1 p-1 bg-white border border-slate-200 rounded-full text-rose-500 opacity-0 group-hover/tab:opacity-100 hover:bg-rose-50 transition-all shadow-md z-10"
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
                            <div className="p-4 mx-3 mb-4 bg-brand-50/50 rounded-2xl border border-brand-100 flex items-center gap-3 animate-slide-down">
                                <input 
                                    autoFocus
                                    type="text"
                                    placeholder="Nama kategori..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="flex-1 text-sm bg-white rounded-xl py-2 px-3 border-transparent focus:ring-2 focus:ring-brand-500"
                                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                                />
                                <button onClick={addCategory} className="px-4 py-2 bg-brand-600 text-white rounded-xl"><Text.Label className="!text-white !normal-case !tracking-normal">Simpan</Text.Label></button>
                                <button onClick={() => setIsAddingCategory(false)} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl"><Text.Label className="!text-slate-600 !normal-case !tracking-normal">Batal</Text.Label></button>
                            </div>
                        )}
                    </div>

                    <div className="w-full">
                        {showVersionHistory ? (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-slate-100 bg-amber-50/30">
                                    <Text.H2 className="!text-slate-900">Arsip & Dokumentasi Perubahan</Text.H2>
                                    <Text.Caption className="!mt-1">Daftar versi AD/ART yang pernah diterbitkan sebelumnya.</Text.Caption>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {adArtData.archives?.map((archive: any) => (
                                        <div key={archive.id} className="group bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all relative">
                                            <div className="flex flex-col h-full">
                                                <div className="mb-4">
                                                    <Text.Label className="!px-2 !py-1 !bg-amber-100 !text-amber-700 rounded-lg mb-2 !inline-block">Archived Version</Text.Label>
                                                    <Text.H2 className="!text-slate-900 !text-base">{archive.name}</Text.H2>
                                                </div>
                                                <div className="space-y-2 mb-6">
                                                    <Text.Caption className="!flex items-center gap-2">
                                                        <FloppyDisk weight="fill" className="text-slate-400" />
                                                        {new Date(archive.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </Text.Caption>
                                                    <Text.Caption className="!flex items-center gap-2">
                                                        <User weight="fill" className="text-slate-400" />
                                                        Ketua: <Text.Body component="span" className="!font-bold !text-slate-700 !text-inherit">{toTitleCase(archive.chairman)}</Text.Body>
                                                    </Text.Caption>
                                                </div>
                                                <button 
                                                    onClick={() => restoreArchive(archive)}
                                                    className="w-full mt-auto py-2.5 bg-white border border-brand-200 text-brand-600 rounded-xl hover:bg-brand-600 hover:text-white transition-all shadow-sm active:scale-95"
                                                >
                                                    <Text.Label className="!text-inherit !normal-case !tracking-normal">Pulihkan Versi Ini</Text.Label>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!adArtData.archives || adArtData.archives.length === 0) && (
                                        <div className="col-span-full py-12 text-center text-slate-400 italic font-medium"><Text.Body className="!text-slate-400 !italic">Belum Ada Arsip Versi Terdahulu.</Text.Body></div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-h-[800px]">
                                    {/* Document Header Info - Breadcrumb style */}
                                    <div className="px-6 py-10 sm:px-10 sm:py-12 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 sm:gap-4">
                                        <div className="space-y-3">
                                            <Text.Label className="!inline-flex !items-center !gap-2 !px-3 !py-1 !bg-brand-50 !text-brand-700 rounded-lg">
                                                Dokumen Aturan & Regulasi
                                            </Text.Label>
                                            <Text.H1 className="!leading-tight">{activeCategory}</Text.H1>
                                            {adArtData.active.metadata && (
                                                <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-slate-500 font-medium tracking-wider">
                                                    <Text.Caption className="!flex items-center gap-1.5"><ListDashes className="text-slate-400" /> Versi {adArtData.active.metadata.version}</Text.Caption>
                                                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                                                    <Text.Caption className="!flex items-center gap-1.5"><PlusCircle className="text-slate-400" /> {new Date(adArtData.active.metadata.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</Text.Caption>
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
                                                <Text.Label component="span" className="!text-white !normal-case !tracking-normal">{isSavingAdArt ? 'Menyimpan...' : 'Terbitkan Amandemen'}</Text.Label>
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
