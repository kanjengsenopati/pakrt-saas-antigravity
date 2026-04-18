import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { rondaService, RondaWithWarga } from '../../services/rondaService';
import { Plus, Funnel, Trash, ShieldCheck, PencilSimple, CheckCircle, X, CaretUp, CaretDown } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { dateUtils } from '../../utils/date';
import { useHybridData } from '../../hooks/useHybridData';
import { Text } from '../../components/ui/Typography';

export default function RondaList() {
    const { currentTenant, currentScope } = useTenant();
    const { user: authUser } = useAuth();
    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';
    const navigate = useNavigate();


    const { 
        mergedData: rondaItems, 
        isFetching: isLoading, 
        refresh: loadData 
    } = useHybridData<RondaWithWarga[]>({
        fetcher: () => rondaService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });

    const rondaList = rondaItems || [];
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'informasi' | 'jadwal'>('informasi');
    const [sortConfig, setSortConfig] = useState<{ key: 'tanggal' | 'regu', direction: 'asc' | 'desc' } | null>({ key: 'tanggal', direction: 'desc' });
    const wargaId = authUser?.id && isWarga ? (authUser as any).warga_id || authUser.id : null;

    // Attendance Modal state
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [activeSnackId, setActiveSnackId] = useState<string | null>(null);
    const [selectedRonda, setSelectedRonda] = useState<RondaWithWarga | null>(null);
    const [attendanceSelections, setAttendanceSelections] = useState<string[]>([]);

    const handleDelete = async (id: string, tanggal: string) => {
        if (window.confirm(`Hapus jadwal ronda untuk tanggal ${tanggal}?`)) {
            await rondaService.delete(id);
            loadData();
        }
    };

    const filteredRonda = rondaList.filter(r =>
        r.regu.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.anggota_warga?.some(w => w.nama.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        if (key === 'tanggal') {
            const dateA = new Date(a.tanggal).getTime();
            const dateB = new Date(b.tanggal).getTime();
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (key === 'regu') {
            return direction === 'asc'
                ? a.regu.localeCompare(b.regu)
                : b.regu.localeCompare(a.regu);
        }

        return 0;
    });

    const handleSort = (key: 'tanggal' | 'regu') => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    // Grouping logic for "Informasi" tab
    const groups = filteredRonda.reduce((acc, ronda) => {
        const reguName = ronda.regu;
        if (!acc[reguName]) {
            acc[reguName] = {
                name: reguName,
                members: new Map<string, any>(),
                dates: [],
                konsumsi: new Map<string, any>()
            };
        }

        // Add unique members
        ronda.anggota_warga?.forEach(w => acc[reguName].members.set(w.id, w));
        ronda.anggota_konsumsi?.forEach(w => acc[reguName].konsumsi.set(w.id, w));

        // Add date with snack info
        acc[reguName].dates.push({
            id: ronda.id,
            tanggal: ronda.tanggal,
            kehadiranCount: ronda.kehadiran_warga?.length || 0,
            petugas_konsumsi: ronda.anggota_konsumsi || []
        });

        return acc;
    }, {} as Record<string, { name: string, members: Map<string, any>, dates: any[], konsumsi: Map<string, any> }>);

    const sortedGroups = Object.values(groups).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const handleOpenAttendance = (ronda: RondaWithWarga) => {
        setSelectedRonda(ronda);
        setAttendanceSelections(ronda.kehadiran_warga || []);
        setIsAttendanceModalOpen(true);
    };

    const toggleAttendance = (wargaId: string) => {
        if (attendanceSelections.includes(wargaId)) {
            setAttendanceSelections(attendanceSelections.filter(id => id !== wargaId));
        } else {
            setAttendanceSelections([...attendanceSelections, wargaId]);
        }
    };

    const handleSaveAttendance = async () => {
        if (selectedRonda) {
            try {
                await rondaService.updateKehadiran(selectedRonda.id, attendanceSelections);
                setIsAttendanceModalOpen(false);
                setSelectedRonda(null);
                loadData();
            } catch (error) {
                console.error("Gagal menyimpan kehadiran:", error);
                alert("Terjadi kesalahan saat menyimpan data kehadiran.");
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Text.H1>Jadwal Ronda</Text.H1>
                    <Text.Body className="mt-1">Kelola Jadwal Siskamling Keamanan Lingkungan</Text.Body>
                </div>
                <HasPermission module="Jadwal Ronda" action="Buat">
                    <button
                        onClick={() => navigate('/ronda/new')}
                        className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <Text.Label className="!text-white">Buat Jadwal Baru</Text.Label>
                    </button>
                    
                    {/* MOBILE FAB */}
                    <button
                        onClick={() => navigate('/ronda/new')}
                        className="sm:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="flex bg-slate-100/50 p-1.5 rounded-xl w-full md:w-fit border border-slate-100 shadow-sm overflow-hidden">
                        <button
                            onClick={() => setActiveTab('informasi')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'informasi' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Informasi Regu
                        </button>
                        <button
                            onClick={() => setActiveTab('jadwal')}
                            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'jadwal' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Log Jadwal
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 flex-1 justify-end">
                        <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Cari regu atau nama warga..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                            />
                        </div>
                        {activeTab === 'jadwal' && (
                            <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                <Funnel weight="fill" className="text-gray-400" />
                                <Text.Label className="!text-slate-700">Filter</Text.Label>
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'informasi' && (
                    <div className="p-6">
                        {!rondaItems && isLoading ? (
                            <Text.Body className="p-8 text-center !text-gray-500">Memuat Data Regu...</Text.Body>
                        ) : sortedGroups.length === 0 ? (
                            <div className="text-center py-12">
                                <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <Text.Body className="!text-gray-500">Data Regu Tidak Ditemukan.</Text.Body>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedGroups.map((group: any) => {
                                    const isMyGroup = wargaId && group.members.has(wargaId);
                                    const todayStr = new Date().toISOString().split('T')[0];
                                    const nextSchedule = [...group.dates]
                                        .filter((d: any) => d.tanggal >= todayStr)
                                        .sort((a: any, b: any) => a.tanggal.localeCompare(b.tanggal))[0];
                                    
                                    return (
                                        <div key={group.name} className={`bg-white border-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden relative group/card ${isMyGroup ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-100'}`}>
                                            
                                            {isMyGroup && (
                                                <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl z-20 shadow-md flex items-center gap-1.5 tracking-widest uppercase">
                                                    <CheckCircle weight="fill" className="w-3.5 h-3.5" /> Regu Anda
                                                </div>
                                            )}

                                            <div className={`p-5 border-b border-slate-50 relative ${isMyGroup ? 'bg-slate-50/50' : 'bg-white'}`}>
                                                <div className="flex justify-between items-center mb-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner border ${isMyGroup ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900 text-white border-slate-800'}`}>
                                                            {group.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <Text.H2 className="!text-[15px] !font-bold truncate">{group.name}</Text.H2>
                                                            <Text.Caption className="mt-1 font-bold">Siskamling Unit</Text.Caption>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <Text.Label className="mb-2.5 flex items-center gap-1.5">
                                                            <div className="w-1 h-3 bg-brand-500 rounded-full" />
                                                            Petugas Utama
                                                        </Text.Label>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {Array.from((group as any).members.values()).map((w: any) => (
                                                                <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                                    <div className="w-4 h-4 rounded-lg bg-brand-50 flex items-center justify-center">
                                                                        <span className="text-[9px] font-black text-brand-600">{w.nama[0].toUpperCase()}</span>
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-slate-700 uppercase">{w.nama}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {group.konsumsi.size > 0 && (
                                                        <div>
                                                            <Text.Label className="!text-amber-500 mb-2.5 flex items-center gap-1.5">
                                                                <div className="w-1 h-3 bg-amber-500 rounded-full" />
                                                                Konsumsi
                                                            </Text.Label>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {Array.from((group as any).konsumsi.values()).map((w: any) => (
                                                                    <div key={w.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50/50 border border-amber-100 rounded-xl">
                                                                        <span className="text-[11px] font-bold text-amber-700 uppercase">{w.nama}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-5 bg-slate-50/30 flex-1">
                                                <div className="flex items-center justify-between mb-4">
                                                    <Text.Label>Status & Jadwal</Text.Label>
                                                    <Text.Label className="!text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full !normal-case">{group.dates.length} Titik</Text.Label>
                                                </div>
                                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {group.dates.sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()).map((d: any) => {
                                                        const isPast = d.tanggal < todayStr;
                                                        const isNext = nextSchedule && d.id === nextSchedule.id;
                                                        const isActive = activeSnackId === d.id;
                                                        return (
                                                            <div key={d.id} className="flex flex-col gap-1">
                                                                <div
                                                                    onClick={() => setActiveSnackId(isActive ? null : d.id)}
                                                                    className={`flex items-center justify-between text-[11px] p-2.5 rounded-xl transition-all cursor-pointer border ${isActive ? 'bg-amber-50 border-amber-200 shadow-sm' : isNext ? 'bg-brand-50 border-brand-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${isPast ? 'bg-slate-300' : isNext ? 'bg-brand-600 animate-pulse' : 'bg-brand-500'}`}></div>
                                                                        <span className={`text-[11px] tracking-tight ${isPast ? 'text-slate-400 font-medium' : isNext ? 'text-brand-700 font-bold' : 'text-slate-700 font-bold'}`}>
                                                                            {dateUtils.toDisplay(d.tanggal)}
                                                                        </span>
                                                                        {isNext && (
                                                                            <Text.Label className="!text-[8px] bg-brand-600 !text-white px-1.5 py-0.5 rounded-lg !font-bold tracking-widest ml-1 shadow-sm">Selanjutnya</Text.Label>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {d.kehadiranCount > 0 && (
                                                                            <Text.Label className="!text-[9px] !text-brand-600 !font-bold bg-brand-50 px-1.5 py-0.5 rounded-lg tracking-wider">
                                                                                {d.kehadiranCount} Check
                                                                            </Text.Label>
                                                                        )}
                                                                        <CheckCircle weight={isActive ? "fill" : "bold"} className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-slate-200'}`} />
                                                                    </div>
                                                                </div>
                                                                {isActive && (
                                                                    <div className="ml-3 pl-4 border-l-2 border-amber-200 py-2 animate-fade-in">
                                                                        <Text.Label className="!text-[9px] !text-amber-500 !font-bold tracking-widest mb-1.5">Detail Konsumsi:</Text.Label>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {d.petugas_konsumsi.length > 0 ? (
                                                                                d.petugas_konsumsi.map((p: any) => (
                                                                                    <span key={p.id} className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold tracking-tight uppercase">
                                                                                        {p.nama}
                                                                                    </span>
                                                                                ))
                                                                            ) : (
                                                                                <Text.Caption className="!italic">Belum Ditentukan</Text.Caption>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'jadwal' && (
                    <>
                        {/* DESKTOP VIEW: TABLE */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th
                                            className="p-3 w-1/4 cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => handleSort('tanggal')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <Text.Label>Tanggal</Text.Label> 
                                                {sortConfig?.key === 'tanggal' && (
                                                    sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th
                                            className="p-3 w-[15%] cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => handleSort('regu')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <Text.Label>Nama Regu</Text.Label>
                                                {sortConfig?.key === 'regu' && (
                                                    sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-3 w-[30%] text-left"><Text.Label>Petugas Piket</Text.Label></th>
                                        <th className="p-3 w-[20%] text-left"><Text.Label>Bawa Konsumsi</Text.Label></th>
                                        <th className="p-3 text-right px-6"><Text.Label>Aksi</Text.Label></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {!rondaItems && isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center"><Text.Body className="!text-gray-500">Memuat Data...</Text.Body></td>
                                        </tr>
                                    ) : filteredRonda.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <ShieldCheck className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                    <Text.Body>Belum Ada Jadwal Ronda Yang Dibuat.</Text.Body>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRonda.map((ronda) => (
                                            <tr key={ronda.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-3">
                                                    <Text.Body className="!font-bold !text-slate-800">
                                                        {dateUtils.toDisplay(ronda.tanggal)}
                                                    </Text.Body>
                                                </td>
                                                <td className="p-3">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 tracking-tight">
                                                        {ronda.regu}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {ronda.anggota_warga?.map((w: any) => (
                                                            <span key={w.id} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 uppercase">
                                                                {w.nama}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {ronda.anggota_konsumsi && ronda.anggota_konsumsi.length > 0 ? (
                                                            ronda.anggota_konsumsi.map((w: any) => (
                                                                <span key={`desk-k-${w.id}`} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100 uppercase">
                                                                    {w.nama}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <Text.Caption className="!italic">-</Text.Caption>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right px-6">
                                                    <div className="flex justify-end gap-2">
                                                        <HasPermission module="Notulensi" action="Ubah">
                                                            <button
                                                                onClick={() => handleOpenAttendance(ronda)}
                                                                className={`p-1.5 rounded-md transition-colors ${ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? 'text-brand-600 bg-brand-50 hover:bg-brand-100' : 'text-gray-400 hover:text-brand-600 hover:bg-brand-50'}`} title="Catat Kehadiran">
                                                                <CheckCircle weight={ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? "fill" : "duotone"} className="w-5 h-5" />
                                                            </button>
                                                        </HasPermission>
                                                        <HasPermission module="Jadwal Ronda" action="Ubah">
                                                            <button
                                                                onClick={() => navigate(`/ronda/edit/${ronda.id}`)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit Jadwal">
                                                                <PencilSimple weight="duotone" className="w-5 h-5" />
                                                            </button>
                                                        </HasPermission>
                                                        <HasPermission module="Jadwal Ronda" action="Hapus">
                                                            <button
                                                                onClick={() => handleDelete(ronda.id, ronda.tanggal)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 shadow-sm active:scale-90" title="Hapus">
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

                        {/* MOBILE VIEW: CARD GRID */}
                        <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
                            {!rondaItems && isLoading ? (
                                <div className="py-20 text-center animate-pulse flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                                    <Text.Label className="!text-slate-400">Sinkronisasi...</Text.Label>
                                </div>
                            ) : filteredRonda.length === 0 ? (
                                <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                        <ShieldCheck weight="duotone" className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <div>
                                        <Text.Body className="!font-bold !text-slate-900">Belum Ada Jadwal</Text.Body>
                                        <Text.Caption className="mt-1 !font-medium">Riwayat jadwal ronda akan muncul di sini</Text.Caption>
                                    </div>
                                </div>
                            ) : (
                                filteredRonda.map((ronda) => (
                                    <div key={ronda.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center border border-slate-800 shadow-inner">
                                                        <Text.Caption className="!text-[8px] !font-bold !leading-none uppercase">{new Date(ronda.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</Text.Caption>
                                                        <Text.Body className="!text-sm !font-black !leading-none mt-0.5">{new Date(ronda.tanggal).getDate()}</Text.Body>
                                                    </div>
                                                    <div>
                                                        <Text.H2 className="text-[14px] leading-tight mb-1">{ronda.regu}</Text.H2>
                                                        <div className="flex items-center gap-1.5">
                                                            <Text.Caption className="font-mono !font-medium italic">{dateUtils.toDisplay(ronda.tanggal)}</Text.Caption>
                                                        </div>
                                                    </div>
                                                </div>
                                                {ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 && (
                                                    <Text.Label className="px-2 py-0.5 rounded-lg !text-[10px] !font-bold bg-brand-50 !text-brand-600 border border-brand-100 tracking-widest shadow-sm uppercase">
                                                        Selesai
                                                    </Text.Label>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                                                    <Text.Label className="mb-2 leading-none">Petugas Piket</Text.Label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {ronda.anggota_warga?.map((w: any) => (
                                                            <span key={w.id} className="inline-flex items-center px-2 py-1 rounded-lg bg-white border border-slate-100 text-slate-700 text-[11px] font-bold shadow-sm uppercase">
                                                                {w.nama}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="bg-amber-50/30 rounded-xl border border-amber-100 p-3">
                                                    <Text.Label className="!text-amber-500 mb-2 leading-none">Bawa Konsumsi</Text.Label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {ronda.anggota_konsumsi && ronda.anggota_konsumsi.length > 0 ? (
                                                            ronda.anggota_konsumsi.map((w: any) => (
                                                                <span key={`mob-k-${w.id}`} className="inline-flex items-center px-2 py-1 rounded-lg bg-white border border-amber-100 text-amber-700 text-[11px] font-bold shadow-sm uppercase">
                                                                    {w.nama}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <Text.Caption className="!italic !font-medium">Belum Ditentukan</Text.Caption>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end items-center pt-4 border-t border-slate-50 gap-2 mt-4">
                                                <HasPermission module="Notulensi" action="Ubah">
                                                    <button
                                                        onClick={() => handleOpenAttendance(ronda)}
                                                        className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-tighter shadow-sm active:scale-95 border ${ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? 'text-brand-600 bg-brand-50 border-brand-100' : 'text-slate-600 bg-white border-slate-200'}`}
                                                    >
                                                        <CheckCircle weight={ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? "fill" : "bold"} className="w-4 h-4" />
                                                        <Text.Label className={`${ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? '!text-brand-600' : '!text-slate-600'} !text-[11px]`}>Kehadiran</Text.Label>
                                                    </button>
                                                </HasPermission>
                                                <div className="flex gap-2">
                                                    <HasPermission module="Jadwal Ronda" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/ronda/edit/${ronda.id}`)}
                                                            className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all shadow-sm border border-brand-100/50"
                                                        >
                                                            <PencilSimple weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Jadwal Ronda" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(ronda.id, ronda.tanggal)}
                                                            className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-transparent shadow-sm"
                                                        >
                                                            <Trash weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modal Catat Kehadiran */}
            {isAttendanceModalOpen && selectedRonda && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[24px] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
                        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <Text.H2 className="!text-[18px]">Catat Kehadiran Ronda</Text.H2>
                                <div className="flex items-center gap-2 mt-1">
                                    <Text.Label className="bg-brand-50 !text-brand-600 px-2 py-0.5 rounded-md border border-brand-100 tracking-tight">
                                        {selectedRonda.regu}
                                    </Text.Label>
                                    <Text.Caption className="!font-medium capitalize tracking-tight">
                                        • {dateUtils.toDisplay(selectedRonda.tanggal)}
                                    </Text.Caption>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all active:rotate-90"
                            >
                                <X className="w-5 h-5" weight="bold" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            <Text.Body className="!font-medium !text-gray-700 mb-4 px-1">Tandai Warga Yang Hadir Saat Jadwal Ronda Ini:</Text.Body>

                            <div className="space-y-2">
                                {selectedRonda.anggota_warga?.map((warga: any) => {
                                    const isAttended = attendanceSelections.includes(warga.id);
                                    return (
                                        <label
                                            key={warga.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isAttended ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAttended ? 'bg-brand-600 border-brand-600' : 'bg-white border-gray-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={isAttended}
                                                    onChange={() => toggleAttendance(warga.id)}
                                                />
                                                {isAttended && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div>
                                                <Text.Body className={`!font-medium ${isAttended ? '!text-brand-900' : '!text-slate-900'} uppercase`}>{warga.nama}</Text.Body>
                                                <Text.Caption className="!italic">{warga.alamat}</Text.Caption>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {(!selectedRonda.anggota_warga || selectedRonda.anggota_warga.length === 0) && (
                                <Text.Body className="text-center py-4 bg-gray-50 rounded-xl !text-gray-500">Tidak Ada Petugas Yang Terdaftar Pada Jadwal Ini.</Text.Body>
                            )}
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
                            <button
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-300"
                            >
                                <Text.Label className="!text-slate-600">Batal</Text.Label>
                            </button>
                            <button
                                onClick={handleSaveAttendance}
                                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md active-press"
                            >
                                <CheckCircle weight="bold" />
                                <Text.Label className="!text-white">Simpan Kehadiran</Text.Label>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
