import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { rondaService, RondaWithWarga } from '../../services/rondaService';
import { Plus, MagnifyingGlass, Funnel, Trash, ShieldCheck, PencilSimple, CheckCircle, X, CaretUp, CaretDown } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { dateUtils } from '../../utils/date';

export default function RondaList() {
    const { currentTenant, currentScope } = useTenant();
    const [rondaList, setRondaList] = useState<RondaWithWarga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'informasi' | 'jadwal'>('informasi');
    const navigate = useNavigate();
    const [sortConfig, setSortConfig] = useState<{ key: 'tanggal' | 'regu', direction: 'asc' | 'desc' } | null>({ key: 'tanggal', direction: 'desc' });

    // Attendance Modal state
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [activeSnackId, setActiveSnackId] = useState<string | null>(null);
    const [selectedRonda, setSelectedRonda] = useState<RondaWithWarga | null>(null);
    const [attendanceSelections, setAttendanceSelections] = useState<string[]>([]);

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            // Ronda applies at the Tenant level generally, or RT scope. Here we assume Tenant level for all RT members
            const data = await rondaService.getAll(currentTenant.id, currentScope);
            setRondaList(data);
        } catch (error) {
            console.error("Failed to load jadwal ronda:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

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

    const sortedGroups = Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));

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
                    <h1 className="page-title">Jadwal Ronda</h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 uppercase tracking-wider">Kelola jadwal siskamling keamanan lingkungan</p>
                </div>
                <HasPermission module="Jadwal Ronda" action="Buat">
                    <button
                        onClick={() => navigate('/ronda/new')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[14px] font-normal transition-all shadow-sm hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Buat Jadwal Baru</span>
                    </button>
                </HasPermission>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="flex gap-1 bg-white p-1 rounded-lg border border-gray-200">
                        <button
                            onClick={() => setActiveTab('informasi')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'informasi' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            Informasi Regu
                        </button>
                        <button
                            onClick={() => setActiveTab('jadwal')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'jadwal' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
                        >
                            Log Jadwal
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 flex-1 justify-end">
                        <div className="relative w-full sm:w-80">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari regu atau nama warga..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                            />
                        </div>
                        {activeTab === 'jadwal' && (
                            <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                <Funnel weight="fill" className="text-gray-400" />
                                <span>Filter</span>
                            </button>
                        )}
                    </div>
                </div>

                {activeTab === 'informasi' && (
                    <div className="p-6">
                        {isLoading ? (
                            <p className="p-8 text-center text-gray-500">Memuat data regu...</p>
                        ) : sortedGroups.length === 0 ? (
                            <div className="text-center py-12">
                                <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Data regu tidak ditemukan.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedGroups.map(group => (
                                    <div key={group.name} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group/card">
                                        <div className="p-5 bg-gradient-to-br from-brand-50 to-white border-b border-gray-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                    <span className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-black">
                                                        {group.name.charAt(0)}
                                                    </span>
                                                    {group.name}
                                                </h3>
                                                <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                                    {group.dates.length} Jadwal
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Petugas Utama</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.from(group.members.values()).map(w => (
                                                            <div key={w.id} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-100 rounded-lg shadow-sm">
                                                                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                                                                    <span className="text-[8px] font-bold text-blue-600">{w.nama[0]}</span>
                                                                </div>
                                                                <span className="text-[11px] font-medium text-gray-700">{w.nama}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {group.konsumsi.size > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-2">Penyedia Konsumsi</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {Array.from(group.konsumsi.values()).map(w => (
                                                                <div key={w.id} className="flex items-center gap-1.5 px-2 py-1 bg-amber-50/50 border border-amber-100 rounded-lg">
                                                                    <span className="text-[11px] font-medium text-amber-900">{w.nama}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-5 bg-gray-50/30 flex-1">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Daftar Tanggal Jaga</p>
                                            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                                                {group.dates.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()).map(d => {
                                                    const dateObj = new Date(d.tanggal);
                                                    const isPast = dateObj < new Date();
                                                    const isActive = activeSnackId === d.id;
                                                    return (
                                                        <div key={d.id} className="flex flex-col gap-1">
                                                            <div
                                                                onClick={() => setActiveSnackId(isActive ? null : d.id)}
                                                                className={`flex items-center justify-between text-[11px] p-2 rounded-lg transition-all cursor-pointer ${isActive ? 'bg-amber-50 border border-amber-100 shadow-sm' : 'hover:bg-gray-100/80 border border-transparent'}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${isPast ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`}></div>
                                                                    <span className={isPast ? 'text-gray-400' : 'text-gray-600 font-medium'}>
                                                                        {dateUtils.toDisplay(d.tanggal)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {d.kehadiranCount > 0 && (
                                                                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                                                            {d.kehadiranCount} Hadir
                                                                        </span>
                                                                    )}
                                                                    <CheckCircle weight={isActive ? "fill" : "regular"} className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : 'text-gray-300'}`} />
                                                                </div>
                                                            </div>
                                                            {isActive && (
                                                                <div className="ml-3.5 pl-3 border-l-2 border-amber-200 py-1 animate-slide-down">
                                                                    <p className="text-[9px] text-amber-600 font-bold uppercase tracking-tight mb-1">Petugas Snack:</p>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {d.petugas_konsumsi.length > 0 ? (
                                                                            d.petugas_konsumsi.map((p: any) => (
                                                                                <span key={p.id} className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-medium">
                                                                                    {p.nama}
                                                                                </span>
                                                                            ))
                                                                        ) : (
                                                                            <span className="text-[10px] text-gray-400 italic">Belum ditentukan</span>
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
                                ))}
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
                                    <tr className="bg-slate-50 text-slate-500 text-[14px] font-semibold capitalize tracking-wider border-b border-slate-200">
                                        <th
                                            className="p-3 w-1/4 cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => handleSort('tanggal')}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                Tanggal 
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
                                                Nama Regu
                                                {sortConfig?.key === 'regu' && (
                                                    sortConfig.direction === 'asc' ? <CaretUp size={12} /> : <CaretDown size={12} />
                                                )}
                                            </div>
                                        </th>
                                        <th className="p-3 w-[30%] text-left">Petugas Piket</th>
                                        <th className="p-3 w-[20%] text-left">Bawa Konsumsi</th>
                                        <th className="p-3 text-right px-6">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">Memuat data...</td>
                                        </tr>
                                    ) : filteredRonda.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                        <ShieldCheck className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                    <p>Belum ada jadwal ronda yang dibuat.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRonda.map((ronda) => (
                                            <tr key={ronda.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-3">
                                                    <p className="font-bold text-slate-800 text-[14px]">
                                                        {dateUtils.toDisplay(ronda.tanggal)}
                                                    </p>
                                                </td>
                                                <td className="p-3">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                                                        {ronda.regu}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {ronda.anggota_warga?.map(w => (
                                                            <span key={w.id} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                                                {w.nama}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {ronda.anggota_konsumsi && ronda.anggota_konsumsi.length > 0 ? (
                                                            ronda.anggota_konsumsi.map(w => (
                                                                <span key={`desk-k-${w.id}`} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                                    {w.nama}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 italic text-[10px]">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right px-6">
                                                    <div className="flex justify-end gap-2">
                                                        <HasPermission module="Notulensi" action="Ubah">
                                                            <button
                                                                onClick={() => handleOpenAttendance(ronda)}
                                                                className={`p-1.5 rounded-md transition-colors ${ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`} title="Catat Kehadiran">
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

                        {/* MOBILE VIEW: CARD GRID */}
                        <div className="md:hidden space-y-4 p-4 bg-gray-50">
                            {isLoading ? (
                                <div className="text-center text-gray-500 py-8">Memuat data...</div>
                            ) : filteredRonda.length === 0 ? (
                                <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                                    <ShieldCheck className="w-10 h-10 text-gray-300 mb-2" />
                                    <p>Belum ada jadwal ronda yang dibuat.</p>
                                </div>
                            ) : (
                                filteredRonda.map((ronda) => (
                                    <div key={ronda.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                        <div className="p-4 flex gap-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-sm">
                                                            {dateUtils.toDisplay(ronda.tanggal)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                                                            {ronda.regu}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-2">Petugas Piket</p>
                                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                                        {ronda.anggota_warga?.map(w => (
                                                            <span key={w.id} className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-gray-700 border border-gray-100 text-xs font-medium">
                                                                {w.nama}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-amber-500 uppercase font-semibold mb-2">Bawa Konsumsi/Snack</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {ronda.anggota_konsumsi && ronda.anggota_konsumsi.length > 0 ? (
                                                            ronda.anggota_konsumsi.map(w => (
                                                                <span key={`mob-k-${w.id}`} className="inline-flex items-center px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-100 text-xs font-medium">
                                                                    {w.nama}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 italic text-xs">Belum ada</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 border-t border-gray-100 p-2 flex justify-end items-center gap-2">
                                            <HasPermission module="Notulensi" action="Ubah">
                                                <button
                                                    onClick={() => handleOpenAttendance(ronda)}
                                                    className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-600 bg-white border border-gray-200 hover:bg-gray-50'}`} title="Catat Kehadiran">
                                                    <CheckCircle weight={ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 ? "fill" : "duotone"} className="w-4 h-4" /> Kehadiran
                                                </button>
                                            </HasPermission>
                                            <HasPermission module="Jadwal Ronda" action="Ubah">
                                                <button
                                                    onClick={() => navigate(`/ronda/edit/${ronda.id}`)}
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold" title="Edit Jadwal">
                                                    <PencilSimple weight="duotone" className="w-4 h-4" /> Edit
                                                </button>
                                            </HasPermission>
                                            <HasPermission module="Jadwal Ronda" action="Hapus">
                                                <button
                                                    onClick={() => handleDelete(ronda.id, ronda.tanggal)}
                                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold" title="Hapus">
                                                    <Trash weight="duotone" className="w-4 h-4" /> Hapus
                                                </button>
                                            </HasPermission>
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Catat Kehadiran Ronda</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Tanggal: <span className="text-sm font-black capitalize tracking-tight text-slate-900 text-center">
    {dateUtils.toDisplay(selectedRonda.tanggal)}
</span>
 ({selectedRonda.regu})
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
                            <p className="text-sm font-medium text-gray-700 mb-4 px-1">Tandai warga yang hadir saat jadwal ronda ini:</p>

                            <div className="space-y-2">
                                {selectedRonda.anggota_warga?.map(warga => {
                                    const isAttended = attendanceSelections.includes(warga.id);
                                    return (
                                        <label
                                            key={warga.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isAttended ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAttended ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-gray-300'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={isAttended}
                                                    onChange={() => toggleAttendance(warga.id)}
                                                />
                                                {isAttended && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-medium ${isAttended ? 'text-emerald-900' : 'text-gray-900'}`}>{warga.nama}</p>
                                                <p className="text-xs text-gray-500">{warga.alamat}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {(!selectedRonda.anggota_warga || selectedRonda.anggota_warga.length === 0) && (
                                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">Tidak ada petugas yang terdaftar pada jadwal ini.</p>
                            )}
                        </div>

                        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-auto">
                            <button
                                onClick={() => setIsAttendanceModalOpen(false)}
                                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-300"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSaveAttendance}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-2 transition-all shadow-sm hover:shadow-md active-press"
                            >
                                <CheckCircle weight="bold" />
                                <span>Simpan Kehadiran</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
