import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { notulensiService, NotulensiWithKehadiran } from '../../services/notulensiService';
import { Notulensi } from '../../database/db';
import { Plus, Funnel, Trash, Notebook, CalendarBlank, Eye, XCircle, CheckCircle, Pencil, MagnifyingGlassPlus, X, CircleNotch, MapPin, Image as ImageIcon, CaretDown, CaretUp, UsersThree } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';
import { useConfirm } from '../../hooks/useConfirm';

export default function NotulensiList() {
    const { currentTenant, currentScope } = useTenant();
    const [notulensiList, setNotulensiList] = useState<Notulensi[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterHost, setFilterHost] = useState('');
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [detailsCache, setDetailsCache] = useState<Record<string, NotulensiWithKehadiran>>({});
    const navigate = useNavigate();
    const { confirm, ConfirmDialog } = useConfirm();


    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const data = await notulensiService.getAll(currentTenant.id, currentScope);
            setNotulensiList(data);
        } catch (error) {
            console.error("Failed to load notulensi:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant, currentScope]);

    const handleToggleExpand = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }

        setExpandedId(id);

        if (!detailsCache[id]) {
            try {
                const details = await notulensiService.getById(id);
                if (details) {
                    setDetailsCache(prev => ({ ...prev, [id]: details }));
                }
            } catch (error) {
                console.error("Failed to fetch details:", error);
            }
        }
    };

    const handleDelete = async (id: string, judul: string) => {
        const ok = await confirm({ title: 'Hapus Notulensi', message: `Hapus notulensi "${judul}" beserta data kehadirannya? Tindakan ini tidak dapat dibatalkan.`, confirmText: 'HAPUS', variant: 'danger' });
        if (ok) {
            await notulensiService.delete(id);
            loadData();
        }
    };

    const filteredNotulensi = notulensiList.filter(n => {
        const matchesSearch = n.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.tanggal.includes(searchQuery) ||
            (n.tuan_rumah || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDate = !filterDate || n.tanggal.includes(filterDate);
        const matchesHost = !filterHost || (n.tuan_rumah || '').toLowerCase().includes(filterHost.toLowerCase());

        return matchesSearch && matchesDate && matchesHost;
    });

    const uniqueHosts = Array.from(new Set(notulensiList.map(n => n.tuan_rumah).filter(Boolean)));

    const AttendanceDetailPanel = ({ id }: { id: string }) => {
        const data = detailsCache[id];

        if (!data) {
            return (
                <div className="p-12 flex flex-col items-center justify-center gap-3 bg-slate-50/50">
                    <CircleNotch size={24} className="animate-spin text-brand-500" />
                    <span className="text-[11px] font-bold tracking-tight text-slate-400">Memuat Detail...</span>
                </div>
            );
        }

        return (
            <div className="p-6 md:p-8 bg-slate-50/80 border-t border-b border-slate-100 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Content Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-900 rounded-lg shadow-sm">
                                <Notebook weight="fill" className="text-white w-4 h-4" />
                            </div>
                            <h4 className="text-sm font-bold tracking-tight text-slate-500">Hasil & Pembahasan</h4>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-h-[120px]">
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{data.konten || 'Tidak ada catatan hasil rapat.'}</p>
                        </div>
                    </div>

                    {/* Attendance Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-600 rounded-lg shadow-sm">
                                    <UsersThree weight="fill" className="text-white w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-bold tracking-tight text-slate-500">Daftar Kehadiran</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-tight rounded-full border border-emerald-100">
                                    {data.kehadiran_list?.filter(k => k.status === 'hadir').length || 0} Hadir
                                </span>
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold tracking-tight rounded-full border border-amber-100">
                                    {data.kehadiran_list?.filter(k => k.status !== 'hadir').length || 0} Izin/Sakit
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-[11px]">
                                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-bold text-slate-500 tracking-tight">Warga</th>
                                        <th className="px-4 py-2 text-right font-bold text-slate-500 tracking-tight">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.kehadiran_list && data.kehadiran_list.length > 0 ? (
                                        data.kehadiran_list.map((k) => (
                                            <tr key={k.warga_id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-400">
                                                            {k.warga?.nama.charAt(0) || '?'}
                                                        </div>
                                                        <span className="font-medium text-slate-900 uppercase">{k.warga?.nama || 'Unknown'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`px-2 py-1 rounded-lg font-bold tracking-tight text-[10px] border ${k.status === 'hadir' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        k.status === 'izin' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            k.status === 'sakit' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                'bg-rose-50 text-rose-600 border-rose-100'
                                                        }`}>
                                                        {k.status.charAt(0).toUpperCase() + k.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={2} className="p-8 text-center text-slate-400 font-normal italic">Data kehadiran tidak ditemukan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const totalNotulensi = notulensiList.length;
    const thisMonthNotulensi = notulensiList.filter(n => {
        const date = new Date(n.tanggal);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in text-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">Notulensi Rapat</h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 tracking-tight">
                        Catatan rapat & absensi untuk scope <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                    </p>
                </div>
                <HasPermission module="Notulensi" action="Buat">
                    <button
                        onClick={() => navigate('/notulensi/new')}
                        className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <span>Buat Notulensi Baru</span>
                    </button>
                    
                    {/* MOBILE FAB */}
                    <button
                        onClick={() => navigate('/notulensi/new')}
                        className="sm:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group transition-all duration-300">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500" />
                    <p className="text-[11px] font-bold tracking-tight text-slate-400 mb-1.5 flex items-center gap-2">
                        <Notebook weight="duotone" className="text-brand-500 w-4 h-4" />
                        Total
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{totalNotulensi}</span>
                        <span className="text-[11px] font-bold text-slate-400">Dokumen</span>
                    </div>
                </div>

                <div className="bg-brand-600 p-5 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-[11px] font-bold tracking-tight text-brand-100 mb-1.5 flex items-center gap-2">
                        <CalendarBlank weight="duotone" className="text-brand-100 w-4 h-4" />
                        Bulan Ini
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white tracking-tight tabular-nums">{thisMonthNotulensi}</span>
                        <span className="text-[11px] font-bold text-brand-200">Pertemuan</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-transparent">
                <div className="p-4 flex flex-col lg:flex-row justify-between gap-4 bg-white">
                    <div className="relative flex-1 max-w-md group">
                        <input
                            type="text"
                            placeholder="Cari Judul, Tanggal, atau Tuan Rumah..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200">
                            <CalendarBlank size={18} className="ml-2 text-gray-400" />
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="border-0 focus:ring-0 text-sm py-1 pr-2"
                            />
                            {filterDate && <button onClick={() => setFilterDate('')} className="pr-2"><XCircle weight="fill" className="w-4 h-4 text-gray-300 hover:text-gray-500" /></button>}
                        </div>

                        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 min-w-[200px]">
                            <Funnel size={18} className="ml-2 text-gray-400" />
                            <select
                                value={filterHost}
                                onChange={(e) => setFilterHost(e.target.value)}
                                className="border-0 focus:ring-0 text-sm py-1 flex-1 pr-8 bg-transparent"
                            >
                                <option value="">Semua Tuan Rumah</option>
                                {uniqueHosts.map(host => (
                                    <option key={host} value={host || ''}>{host}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[14px] font-semibold capitalize tracking-wider border-b border-slate-200">
                                <th className="p-4 w-[15%]">Tanggal</th>
                                <th className="p-4 text-center w-[10%]">Foto</th>
                                <th className="p-4 w-[20%]">Tuan Rumah</th>
                                <th className="p-4 w-[45%]">Judul & Hasil Rapat</th>
                                <th className="p-4 text-right pr-6 w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <CircleNotch size={24} className="animate-spin text-brand-500" />
                                            <span className="text-[11px] font-bold text-slate-400 tracking-tight italic">Sinkronisasi Notulensi...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredNotulensi.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                                <Notebook className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-base font-bold text-slate-900 tracking-tight">Belum Ada Notulensi</p>
                                                <p className="text-[11px] text-slate-400 mt-1 tracking-tight font-normal">Catatan pertemuan masih kosong untuk scope ini</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredNotulensi.map((notulensi) => (
                                    <>
                                        <tr key={notulensi.id} className={`hover:bg-slate-50/30 transition-all group ${expandedId === notulensi.id ? 'bg-slate-50/50' : ''}`}>
                                            <td className="p-4 align-top">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-1">
                                                            <CalendarBlank weight="bold" className="w-4 h-4" />
                                                        </div>
                                                        {notulensi.jam_mulai && (
                                                            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1 rounded border border-slate-200/50">
                                                                {notulensi.jam_mulai}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-bold capitalize tracking-tight text-slate-900">
                                                        {dateUtils.toDisplay(notulensi.tanggal)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-center">
                                                {notulensi.url_foto ? (
                                                    <div
                                                        onClick={() => setZoomedImage(notulensi.url_foto || null)}
                                                        className="relative w-12 h-12 mx-auto rounded-xl overflow-hidden border border-slate-100 cursor-zoom-in group/thumb shadow-sm hover:shadow-md hover:ring-2 hover:ring-brand-400/20 transition-all active:scale-95 translate-y-0 group-hover:-translate-y-0.5"
                                                    >
                                                        <img src={getFullUrl(notulensi.url_foto)} alt="Meeting" className="w-full h-full object-cover grayscale-[0.3] group-hover/thumb:grayscale-0 group-hover/thumb:scale-110 transition-all duration-500" />
                                                        <div className="absolute inset-0 bg-slate-900/0 group-hover/thumb:bg-slate-900/40 flex items-center justify-center transition-all duration-300">
                                                            <MagnifyingGlassPlus className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity w-5 h-5 transform scale-50 group-hover/thumb:scale-100" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 mx-auto rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:bg-brand-50/50 group-hover:border-brand-200 transition-colors">
                                                        <ImageIcon className="w-5 h-5 opacity-50" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="text-sm border-l-2 border-brand-100 pl-4 py-0.5 group-hover:border-brand-500 transition-all">
                                                    <p className="font-bold text-slate-900 uppercase tracking-tight leading-none mb-1.5">{notulensi.tuan_rumah || 'Tanpa Tuan Rumah'}</p>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-normal capitalize tracking-widest">
                                                        <MapPin size={12} className="text-brand-400" />
                                                        {notulensi.lokasi || '-'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="space-y-1.5">
                                                    <p className="text-[14px] font-bold capitalize tracking-tight leading-none text-slate-800">{notulensi.judul}</p>
                                                    <p className="text-[14px] font-normal text-slate-600 leading-relaxed line-clamp-2 max-w-xl pr-4">{notulensi.konten}</p>
                                                    {notulensi.url_foto && (
                                                        <div className="flex items-center gap-1.5 pt-1">
                                                            <div className="text-[10px] font-bold tracking-tight text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100/50 flex items-center gap-1">
                                                                <CheckCircle weight="fill" className="w-3 h-3" /> Foto Dokumentasi
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right align-middle pr-6 whitespace-nowrap w-24">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleExpand(notulensi.id)}
                                                        className={`p-2 rounded-xl transition-all shadow-sm border ${expandedId === notulensi.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50/50'}`}
                                                        title={expandedId === notulensi.id ? 'Tutup Detail' : 'Lihat Detail & Kehadiran'}
                                                    >
                                                        {expandedId === notulensi.id ? <X weight="bold" className="w-5 h-5" /> : <Eye weight="duotone" className="w-5 h-5" />}
                                                    </button>
                                                    <HasPermission module="Notulensi" action="Ubah">
                                                        <button
                                                            onClick={() => navigate(`/notulensi/${notulensi.id}`)}
                                                            className="p-2 text-primary hover:bg-primary/5 rounded-xl transition-all border border-slate-100 shadow-sm active:scale-90"
                                                            title="Ubah Notulensi"
                                                        >
                                                            <Pencil weight="duotone" className="w-5 h-5" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Notulensi" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(notulensi.id, notulensi.judul)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100 shadow-sm active:scale-90"
                                                            title="Hapus"
                                                        >
                                                            <Trash weight="duotone" className="w-5 h-5" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === notulensi.id && (
                                            <tr key={`${notulensi.id}-details`} className="bg-slate-50/10">
                                                <td colSpan={5} className="p-0 border-b border-slate-100 shadow-inner">
                                                    <AttendanceDetailPanel id={notulensi.id} />
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE VIEW: CARD GRID */}
                <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
                    {isLoading ? (
                        <div className="py-20 text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                            <CircleNotch size={32} className="animate-spin text-brand-500" />
                            <span>Sinkronisasi...</span>
                        </div>
                    ) : filteredNotulensi.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <Notebook weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">Belum Ada Notulensi</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Catatan pertemuan anda akan muncul di sini</p>
                            </div>
                        </div>
                    ) : (
                        filteredNotulensi.map((notulensi) => {
                            const isExpanded = expandedId === notulensi.id;
                            
                            return (
                                <div key={notulensi.id} className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${isExpanded ? 'ring-2 ring-brand-500 shadow-lg border-transparent' : 'border-slate-100 shadow-sm'}`}>
                                    <div className="p-4" onClick={() => handleToggleExpand(notulensi.id)}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex flex-col items-center justify-center border border-brand-100 shadow-inner min-w-[50px]">
                                                    <span className="text-[8px] font-bold leading-none">{new Date(notulensi.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                    <span className="text-sm font-bold leading-none mt-0.5">{new Date(notulensi.tanggal).getDate()}</span>
                                                    {notulensi.jam_mulai && (
                                                        <span className="text-[8px] font-bold mt-1 text-slate-500 bg-white/50 px-1 rounded border border-slate-200/50">
                                                            {notulensi.jam_mulai}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-[14px] capitalize tracking-tight leading-tight mb-1">{notulensi.judul}</h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin weight="fill" className="text-brand-400 w-3 h-3" />
                                                        <span className="text-[10px] font-medium text-slate-400 tracking-tight truncate max-w-[120px]">{notulensi.lokasi || 'Lokasi Rapat'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {notulensi.url_foto && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setZoomedImage(notulensi.url_foto || null); }}
                                                        className="w-9 h-9 rounded-xl border border-slate-100 overflow-hidden cursor-zoom-in active:scale-95 transition-transform shadow-sm"
                                                    >
                                                        <img src={getFullUrl(notulensi.url_foto)} alt="Meeting" className="w-full h-full object-cover" />
                                                    </button>
                                                )}
                                                <div className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}>
                                                    {isExpanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <p className={`text-[13px] font-normal text-slate-600 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                                                    {notulensi.konten}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                                                        <span className="text-[10px] font-bold text-slate-500 tracking-tighter uppercase">{notulensi.tuan_rumah || 'Tanpa Tuan Rumah'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <HasPermission module="Notulensi" action="Ubah">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/notulensi/${notulensi.id}`); }} 
                                                            className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all shadow-sm border border-brand-100/50"
                                                        >
                                                            <Pencil weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Notulensi" action="Hapus">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(notulensi.id, notulensi.judul); }} 
                                                            className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-transparent shadow-sm"
                                                        >
                                                            <Trash weight="bold" className="w-4 h-4" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-white animate-in slide-in-from-top-2 duration-300">
                                            <AttendanceDetailPanel id={notulensi.id} />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ZOOM MODAL (Enchanced Lightbox) */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
                    onClick={() => setZoomedImage(null)}
                >
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />

                    <button
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-[10000] group"
                        onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
                    >
                        <X size={24} weight="bold" className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>

                    <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                        <div className="relative group/modal w-full h-full flex items-center justify-center">
                            <img
                                src={getFullUrl(zoomedImage)}
                                alt="Zoomed Dokumentasi"
                                className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-white/5"
                            />

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/10 opacity-0 group-hover/modal:opacity-100 transition-all transform translate-y-4 group-hover/modal:translate-y-0">
                                <p className="text-white text-xs font-bold capitalize tracking-widest text-center">Dokumentasi Pertemuan</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <ConfirmDialog />
    );
}
