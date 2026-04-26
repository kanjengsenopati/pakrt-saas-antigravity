import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { rondaService, RondaWithWarga } from '../../services/rondaService';
import { 
    Plus, 
    Trash, 
    ShieldCheck, 
    PencilSimple, 
    CheckCircle, 
    X, 
    CaretLeft, 
    CaretRight, 
    CalendarBlank, 
    UsersThree, 
    Clock, 
    Info, 
    Coffee,
    User,
    MagnifyingGlass
} from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { dateUtils } from '../../utils/date';
import { useHybridData } from '../../hooks/useHybridData';
import { Text } from '../../components/ui/Typography';
import { useConfirm } from '../../hooks/useConfirm';

type TabType = 'regu' | 'kalender' | 'riwayat';

export default function RondaList() {
    const { currentTenant, currentScope } = useTenant();
    const { user: authUser } = useAuth();
    const isAdmin = authUser?.role?.toLowerCase() !== 'warga';
    const navigate = useNavigate();
    const { confirm, ConfirmDialog } = useConfirm();

    const { 
        mergedData: rondaItems, 
        refresh: loadData 
    } = useHybridData<RondaWithWarga[]>({
        fetcher: () => rondaService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });

    const rondaList = rondaItems || [];
    const [searchQuery, setSearchQuery] = useState('');
    const sortConfig = { key: 'tanggal' as const, direction: 'desc' as const };
    const [activeTab, setActiveTab] = useState<TabType>('kalender');
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDayRonda, setSelectedDayRonda] = useState<RondaWithWarga | null>(null);
    const wargaId = authUser?.id && !isAdmin ? (authUser as any).warga_id || authUser.id : null;
    
    // Attendance Modal state
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedRonda, setSelectedRonda] = useState<RondaWithWarga | null>(null);
    const [attendanceSelections, setAttendanceSelections] = useState<string[]>([]);

    // Calendar Calculations
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        // Fill previous month padding
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Fill current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [viewDate]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1);
        setViewDate(newDate);
    };

    const handleDelete = async (id: string, tanggal: string) => {
        const ok = await confirm({ title: 'Hapus Jadwal Ronda', message: `Hapus jadwal ronda untuk tanggal ${tanggal}? Tindakan ini tidak dapat dibatalkan.`, confirmText: 'HAPUS', variant: 'danger' });
        if (ok) {
            await rondaService.delete(id);
            loadData();
        }
    };

    const filteredRonda = useMemo(() => {
        return rondaList.filter(r =>
            r.regu.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.anggota_warga?.some(w => w.nama.toLowerCase().includes(searchQuery.toLowerCase()))
        ).sort((a, b) => {
            if (!sortConfig) return 0;
            const { key } = sortConfig;

            if (key === 'tanggal') {
                const dateA = new Date(a.tanggal).getTime();
                const dateB = new Date(b.tanggal).getTime();
                return dateB - dateA; // Always desc
            }

            if (key === 'regu') {
                return b.regu.localeCompare(a.regu); // Always desc
            }

            return 0;
        });
    }, [rondaList, searchQuery, sortConfig]);

    /* handleSort removed as it is not used in the UI header */

    // Grouping logic for "Regu" tab
    const groups = useMemo(() => {
        return rondaList.reduce((acc, ronda) => {
            const reguName = ronda.regu;
            if (!acc[reguName]) {
                acc[reguName] = {
                    name: reguName,
                    members: new Map<string, any>(),
                    dates: [],
                    konsumsi: new Map<string, any>()
                };
            }
            ronda.anggota_warga?.forEach(w => acc[reguName].members.set(w.id, w));
            ronda.anggota_konsumsi?.forEach(w => acc[reguName].konsumsi.set(w.id, w));
            acc[reguName].dates.push({
                id: ronda.id,
                tanggal: ronda.tanggal,
                kehadiranCount: ronda.kehadiran_warga?.length || 0,
                petugas_konsumsi: ronda.anggota_konsumsi || []
            });
            return acc;
        }, {} as Record<string, any>);
    }, [rondaList]);

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
        <>
        <div className="space-y-6 animate-fade-in px-5 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Text.H1>Jadwal Ronda</Text.H1>
                    <Text.Body>Manajemen Siskamling di <Text.Label component="span" className="!inline-flex !font-bold !text-brand-600 bg-brand-50 !px-2 !py-0.5 rounded-lg border border-brand-100">{currentScope}</Text.Label></Text.Body>
                </div>
                <HasPermission module="Jadwal Ronda" action="Buat">
                    <button
                        onClick={() => navigate('/ronda/new')}
                        className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <Text.Body component="span" className="!text-white !font-bold">Buat Jadwal</Text.Body>
                    </button>
                    
                    <button
                        onClick={() => navigate('/ronda/new')}
                        className="md:hidden fixed bottom-28 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-[24px] border border-slate-200/60 w-full gap-1.5 shadow-inner">
                <button
                    onClick={() => setActiveTab('kalender')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-[20px] transition-all duration-300 ${activeTab === 'kalender' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40'}`}
                >
                    <CalendarBlank weight={activeTab === 'kalender' ? 'fill' : 'bold'} size={18} />
                    <Text.Body className="!font-bold !text-inherit">Kalender</Text.Body>
                </button>
                <button
                    onClick={() => setActiveTab('regu')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-[20px] transition-all duration-300 ${activeTab === 'regu' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40'}`}
                >
                    <UsersThree weight={activeTab === 'regu' ? 'fill' : 'bold'} size={18} />
                    <Text.Body className="!font-bold !text-inherit">Regu</Text.Body>
                </button>
                <button
                    onClick={() => setActiveTab('riwayat')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-[20px] transition-all duration-300 ${activeTab === 'riwayat' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/40'}`}
                >
                    <Clock weight={activeTab === 'riwayat' ? 'fill' : 'bold'} size={18} />
                    <Text.Body className="!font-bold !text-inherit">Riwayat</Text.Body>
                </button>
            </div>

            {activeTab === 'kalender' ? (
                <div className="space-y-6">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm">
                        <button onClick={() => changeMonth(-1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all">
                            <CaretLeft weight="bold" size={20} />
                        </button>
                        <div className="text-center">
                            <Text.H2 className="!text-[18px]">
                                {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(viewDate)}
                            </Text.H2>
                        </div>
                        <button onClick={() => changeMonth(1)} className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all">
                            <CaretRight weight="bold" size={20} />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
                            {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map(day => (
                                <div key={day} className="py-4 text-center">
                                    <Text.Label className="!text-slate-400 !text-[10px]">{day}</Text.Label>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} className="h-24 md:h-32 border-b border-r border-slate-50 bg-slate-50/20" />;
                                
                                const dateStr = day.toISOString().split('T')[0];
                                const rondaOnDay = rondaList.find(r => r.tanggal === dateStr);
                                const isToday = dateStr === new Date().toISOString().split('T')[0];
                                const isSelected = selectedDayRonda?.tanggal === dateStr;

                                return (
                                    <div 
                                        key={dateStr} 
                                        onClick={() => rondaOnDay && setSelectedDayRonda(rondaOnDay)}
                                        className={`h-24 md:h-32 border-b border-r border-slate-50 p-2 transition-all cursor-pointer relative group ${rondaOnDay ? 'hover:bg-brand-50/30' : ''} ${isSelected ? 'bg-brand-50/50' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-[12px] font-black w-6 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-slate-400 group-hover:text-slate-900'}`}>
                                                {day.getDate()}
                                            </span>
                                        </div>
                                        
                                        {rondaOnDay && (
                                            <div className="mt-2 space-y-1">
                                                <div className="px-2 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black truncate shadow-sm">
                                                    {rondaOnDay.regu}
                                                </div>
                                                <div className="hidden md:flex items-center gap-1 text-[8px] text-slate-500 font-bold px-1">
                                                    <UsersThree size={10} /> {rondaOnDay.anggota_warga?.length || 0} Petugas
                                                </div>
                                                {rondaOnDay.kehadiran_warga && rondaOnDay.kehadiran_warga.length > 0 && (
                                                    <div className="absolute bottom-2 right-2">
                                                        <CheckCircle weight="fill" className="text-emerald-500" size={14} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Day Detail */}
                    {selectedDayRonda ? (
                        <div className="bg-white rounded-[32px] p-6 border border-brand-100 shadow-xl shadow-brand-500/5 animate-slide-up">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <Text.H2 className="!text-[18px] mb-1">{selectedDayRonda.regu}</Text.H2>
                                    <Text.Caption className="!font-bold text-brand-600 flex items-center gap-1.5">
                                        <CalendarBlank size={14} /> {dateUtils.toDisplay(selectedDayRonda.tanggal)}
                                    </Text.Caption>
                                </div>
                                <div className="flex gap-2">
                                    <HasPermission module="Notulensi" action="Ubah">
                                        <button onClick={() => handleOpenAttendance(selectedDayRonda)} className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-all">
                                            <CheckCircle size={20} weight="bold" />
                                        </button>
                                    </HasPermission>
                                    {isAdmin && (
                                        <button onClick={() => navigate(`/ronda/edit/${selectedDayRonda.id}`)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all">
                                            <PencilSimple size={20} weight="bold" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Text.Label className="flex items-center gap-2">
                                        <UsersThree size={16} className="text-brand-500" /> Petugas Piket
                                    </Text.Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDayRonda.anggota_warga?.map((w: any) => (
                                            <div key={w.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-brand-600 shadow-sm border border-slate-100">
                                                    {w.nama[0].toUpperCase()}
                                                </div>
                                                <Text.Body className="!text-[12px] !font-bold uppercase">{w.nama}</Text.Body>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Text.Label className="flex items-center gap-2">
                                        <Coffee size={16} className="text-amber-500" /> Bawa Konsumsi
                                    </Text.Label>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDayRonda.anggota_konsumsi && selectedDayRonda.anggota_konsumsi.length > 0 ? (
                                            selectedDayRonda.anggota_konsumsi.map((w: any) => (
                                                <div key={w.id} className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                                    <Text.Body className="!text-[12px] !font-bold !text-amber-700 uppercase">{w.nama}</Text.Body>
                                                </div>
                                            ))
                                        ) : (
                                            <Text.Caption className="!italic !font-medium">Belum ada petugas konsumsi</Text.Caption>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 rounded-[32px] p-10 border-2 border-dashed border-slate-200 text-center">
                            <Info size={40} className="text-slate-300 mx-auto mb-4" />
                            <Text.H2 className="!text-slate-400">Pilih tanggal untuk melihat detail</Text.H2>
                            <Text.Body>Klik pada kotak kalender yang memiliki jadwal ronda.</Text.Body>
                        </div>
                    )}
                </div>
            ) : activeTab === 'regu' ? (
                /* Regu Tab - Premium Native Layout */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedGroups.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <UsersThree size={48} className="text-slate-200 mx-auto mb-4" />
                            <Text.H2>Belum Ada Regu</Text.H2>
                            <Text.Body>Silakan buat jadwal untuk membentuk regu siskamling.</Text.Body>
                        </div>
                    ) : (
                        sortedGroups.map((group: any) => {
                            const isMyGroup = wargaId && group.members.has(wargaId);
                            return (
                                <div key={group.name} className={`bg-white rounded-[24px] p-6 border-2 transition-all duration-300 relative group ${isMyGroup ? 'border-brand-500 shadow-xl shadow-brand-500/10' : 'border-slate-100 hover:shadow-lg'}`}>
                                    {isMyGroup && (
                                        <div className="absolute -top-3 left-6 px-3 py-1 bg-brand-600 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-widest">
                                            <CheckCircle weight="fill" size={14} /> Regu Anda
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner border-2 ${isMyGroup ? 'bg-brand-600 text-white border-brand-400' : 'bg-slate-900 text-white border-slate-700'}`}>
                                            {group.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <Text.H2>{group.name}</Text.H2>
                                            <Text.Caption className="!font-bold">Regu Keamanan</Text.Caption>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <Text.Label className="mb-3 block !text-slate-400">PETUGAS UTAMA</Text.Label>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(group.members.values()).map((w: any) => (
                                                    <div key={w.id} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                                        <User size={12} className="text-slate-400" />
                                                        <Text.Body className="!text-[11px] !font-bold uppercase">{w.nama}</Text.Body>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-50">
                                            <div className="flex justify-between items-center mb-3">
                                                <Text.Label className="!text-slate-400">STATISTIK</Text.Label>
                                                <div className="px-2 py-1 bg-brand-50 text-brand-700 rounded-lg text-[10px] font-black">
                                                    {group.dates.length} JADWAL
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <Text.Caption>Total Hadir</Text.Caption>
                                                    <Text.Amount className="!text-lg">
                                                        {group.dates.reduce((sum: number, d: any) => sum + d.kehadiranCount, 0)}
                                                    </Text.Amount>
                                                </div>
                                                <div className="w-px bg-slate-100" />
                                                <div className="flex-1">
                                                    <Text.Caption>Anggota</Text.Caption>
                                                    <Text.Amount className="!text-lg !text-slate-900">{group.members.size}</Text.Amount>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            ) : (
                /* Riwayat Tab - Enhanced List View */
                <div className="space-y-4">
                    <div className="relative flex-1 group">
                        <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Cari regu atau nama warga..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-[20px] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {filteredRonda.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[24px] border-2 border-dashed border-slate-200">
                                <Clock size={48} className="text-slate-200 mx-auto mb-4" />
                                <Text.H2>Tidak Ada Riwayat</Text.H2>
                                <Text.Body>Belum ada jadwal yang tercatat.</Text.Body>
                            </div>
                        ) : (
                            filteredRonda.map((ronda) => (
                                <div key={ronda.id} className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0 border border-slate-800 shadow-lg">
                                                <Text.Caption className="!text-[9px] !font-black !text-slate-400 uppercase leading-none">{new Date(ronda.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</Text.Caption>
                                                <Text.H2 className="!text-white !text-[18px] !leading-none mt-1">{new Date(ronda.tanggal).getDate()}</Text.H2>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Text.H2 className="!text-[16px]">{ronda.regu}</Text.H2>
                                                    {ronda.kehadiran_warga && ronda.kehadiran_warga.length > 0 && (
                                                        <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black border border-emerald-100">SELESAI</div>
                                                    )}
                                                </div>
                                                <Text.Caption className="!font-bold !text-slate-400">{dateUtils.toDisplay(ronda.tanggal)}</Text.Caption>
                                                
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {ronda.anggota_warga?.slice(0, 4).map(w => (
                                                        <span key={w.id} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                                            {w.nama.toUpperCase()}
                                                        </span>
                                                    ))}
                                                    {ronda.anggota_warga && ronda.anggota_warga.length > 4 && (
                                                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">+{ronda.anggota_warga.length - 4}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 md:self-center">
                                            <HasPermission module="Notulensi" action="Ubah">
                                                <button onClick={() => handleOpenAttendance(ronda)} className="flex-1 md:flex-none px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-500/20 active:scale-95 transition-all">
                                                    KEHADIRAN
                                                </button>
                                            </HasPermission>
                                            <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                                                <HasPermission module="Jadwal Ronda" action="Ubah">
                                                    <button onClick={() => navigate(`/ronda/edit/${ronda.id}`)} className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                                                        <PencilSimple size={18} weight="bold" />
                                                    </button>
                                                </HasPermission>
                                                <HasPermission module="Jadwal Ronda" action="Hapus">
                                                    <button onClick={() => handleDelete(ronda.id, ronda.tanggal)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                        <Trash size={18} weight="bold" />
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Modal Catat Kehadiran */}
            {isAttendanceModalOpen && selectedRonda && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <Text.H1 className="!text-xl !text-white">Presensi Ronda</Text.H1>
                                    <Text.Caption className="!text-slate-400">Verifikasi kehadiran petugas piket</Text.Caption>
                                </div>
                                <button onClick={() => setIsAttendanceModalOpen(false)} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors">
                                    <X size={20} weight="bold" />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white shadow-sm">
                                    <ShieldCheck size={24} weight="duotone" />
                                </div>
                                <div>
                                    <Text.H2 className="!text-sm !text-white">{selectedRonda.regu}</Text.H2>
                                    <Text.Caption className="!text-slate-400">{dateUtils.toDisplay(selectedRonda.tanggal)}</Text.Caption>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
                            {selectedRonda.anggota_warga?.map((warga: any) => {
                                const isAttended = attendanceSelections.includes(warga.id);
                                return (
                                    <button
                                        key={warga.id}
                                        onClick={() => toggleAttendance(warga.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isAttended ? 'border-brand-500 bg-brand-50 shadow-sm' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${isAttended ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                {warga.nama[0].toUpperCase()}
                                            </div>
                                            <div className="text-left">
                                                <Text.Body className="!font-bold !text-[13px] uppercase">{warga.nama}</Text.Body>
                                                <Text.Caption className="!text-[10px]">{warga.alamat || 'RT 01'}</Text.Caption>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isAttended ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>
                                            {isAttended && <CheckCircle weight="bold" className="text-white" size={14} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button onClick={() => setIsAttendanceModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100">BATAL</button>
                            <button onClick={handleSaveAttendance} className="flex-[2] py-3 bg-brand-600 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-700 active:scale-95 transition-all">SIMPAN DATA</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <ConfirmDialog />
        </>
    );
}

