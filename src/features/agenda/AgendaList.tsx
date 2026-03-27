import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { agendaService } from '../../services/agendaService';
import { notulensiService } from '../../services/notulensiService';
import { Agenda, Notulensi } from '../../database/db';
import { Plus, PencilSimple, Trash, CalendarBlank, Users, CheckCircle, FileText, X, Image as ImageIcon, CircleNotch, ChartPieSlice, TrendUp, MapPin, House } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { FileUpload } from '../../components/ui/FileUpload';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { formatRupiah } from '../../utils/currency';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';
import { useAuth } from '../../contexts/AuthContext';
import { useHybridData } from '../../hooks/useHybridData';

interface ReportPanelProps {
    agenda: Agenda;
    laporanText: string;
    setLaporanText: (val: string) => void;
    fotoDokumentasi: string[];
    setFotoDokumentasi: React.Dispatch<React.SetStateAction<string[]>>;
    isUploading: boolean;
    setIsUploading: (val: boolean) => void;
    handleSubmitReport: (id: string) => Promise<void>;
    setExpandedId: (id: string | null) => void;
}

const ReportPanel = ({ 
    agenda, 
    laporanText, 
    setLaporanText, 
    fotoDokumentasi, 
    setFotoDokumentasi, 
    isUploading, 
    setIsUploading, 
    handleSubmitReport, 
    setExpandedId 
}: ReportPanelProps) => (
    <div className="p-6 md:p-8 bg-slate-50/80 border-t border-b border-slate-100 animate-in slide-in-from-top-4 duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-600 rounded-lg shadow-sm">
                        <FileText weight="fill" className="text-white w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold tracking-tight text-slate-500">
                        {agenda.is_terlaksana ? 'Edit Laporan Kegiatan' : 'Buat Laporan Realisasi'}
                    </h4>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold tracking-tight text-slate-500 mb-1.5">Catatan Laporan</label>
                        <textarea
                            value={laporanText}
                            onChange={(e) => setLaporanText(e.target.value)}
                            rows={5}
                            placeholder="Catatan hasil kegiatan dan kesimpulan..."
                            className="w-full rounded-xl border border-slate-200 p-4 text-sm font-normal text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-300 leading-relaxed"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <FileUpload
                        label="Foto Dokumentasi"
                        helperText="Maks 2MB per file"
                        multiple={true}
                        existingUrls={fotoDokumentasi}
                        onUploadSuccess={(url) => setFotoDokumentasi(prev => [...prev, url])}
                        onRemove={(url) => setFotoDokumentasi(prev => prev.filter(item => item !== url))}
                        onLoadingChange={setIsUploading}
                    />

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setExpandedId(null)}
                            className="px-5 py-2 text-xs font-semibold tracking-wide text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleSubmitReport(agenda.id)}
                            disabled={isUploading || !laporanText.trim()}
                            className={`px-6 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md flex items-center gap-2 ${(isUploading || !laporanText.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-700 active:scale-95'}`}
                        >
                            {isUploading ? <CircleNotch weight="bold" className="animate-spin w-4 h-4" /> : <CheckCircle weight="bold" className="w-4 h-4" />}
                            Simpan Laporan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const DetailContent = ({ agenda, currentScope, formatRupiah }: { agenda: Agenda, currentScope: string, formatRupiah: (val: number) => string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8 max-w-6xl mx-auto">
        {/* Left side: Detail Info */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-brand-100/50 shadow-sm space-y-4">
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Deksripsi Lengkap</h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-normal">{agenda.deskripsi}</p>
                </div>
                {agenda.keterangan_tambahan && (
                    <div className="pt-4 border-t border-slate-50">
                        <h4 className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mb-1">Catatan Tambahan ({agenda.jenis_kegiatan})</h4>
                        <p className="text-[13px] text-slate-600 italic font-normal leading-relaxed">"{agenda.keterangan_tambahan}"</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Anggaran</p>
                    <p className="text-sm md:text-lg font-bold text-slate-900">{formatRupiah(agenda.nominal_biaya || 0)}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 italic">{agenda.sumber_dana || '-'}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center flex flex-col items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-1">Jenis</p>
                    <p className="text-sm md:text-lg font-bold text-brand-600">{agenda.jenis_kegiatan || '-'}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1 italic">{agenda.perlu_rapat ? 'Ada Notulensi' : 'Tanpa Rapat'}</p>
                </div>
                {agenda.perlu_rapat && agenda.tuan_rumah && (
                    <div className="bg-white p-4 rounded-xl border border-brand-100 text-center flex flex-col items-center justify-center shadow-sm">
                        <p className="text-[10px] font-bold text-brand-500 tracking-widest uppercase mb-1 flex items-center gap-1">
                            <House weight="fill" className="w-3 h-3" /> Tuan Rumah
                        </p>
                        <p className="text-xs md:text-sm font-bold text-slate-900 truncate max-w-full px-2" title={agenda.tuan_rumah}>{agenda.tuan_rumah}</p>
                        <div className="flex items-center gap-1 mt-1">
                            <MapPin weight="bold" className="w-2.5 h-2.5 text-slate-400" />
                            <span className="text-[9px] font-medium text-slate-500 tracking-tight" title={agenda.lokasi}>{agenda.lokasi || 'Lokasi Rapat'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right side: Report/Participants */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-brand-100/50 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                    <Users weight="duotone" className="w-5 h-5 text-brand-500" />
                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">Cakupan Peserta</h4>
                </div>

                {agenda.is_semua_warga ? (
                    <div className="flex flex-col items-center py-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                            <Users weight="fill" className="text-emerald-500 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-emerald-600">Terbuka Untuk Semua Warga</p>
                            <p className="text-xs text-slate-400 font-normal mt-1">Kegiatan bersifat umum dan melibatkan seluruh elemen warga {currentScope}.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {agenda.peserta_details && agenda.peserta_details.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {agenda.peserta_details.map((peserta: any) => (
                                    <div key={peserta.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-medium text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                                        {peserta.nama}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-6 text-slate-400 gap-2">
                                <Users weight="thin" className="w-10 h-10 opacity-40" />
                                <p className="text-xs italic">Data peserta tidak dimuat</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {agenda.is_terlaksana && agenda.laporan_kegiatan && (
                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                            <CheckCircle weight="duotone" className="w-5 h-5 text-emerald-400" />
                            <h4 className="text-sm font-bold text-white tracking-tight">Laporan Pelaksanaan</h4>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{agenda.laporan_kegiatan}"</p>
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default function AgendaList() {
    const { currentTenant, currentScope } = useTenant();
    const { user: authUser } = useAuth();
    const navigate = useNavigate();

    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';
    const currentWargaId = authUser?.id && isWarga ? (authUser as any).warga_id || authUser.id : null;


    const { 
        mergedData: agendaItems, 
        isFetching: isLoading, 
        refresh: loadData 
    } = useHybridData<Agenda[]>({
        fetcher: () => agendaService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });

    const agendaList = agendaItems || [];
    
    // Fetch Notulensi for status tracking
    const { mergedData: notulensiItems } = useHybridData<Notulensi[]>({
        fetcher: () => notulensiService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });
    const notulensiList = notulensiItems || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'terencana' | 'terlaksana'>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewPhotosModal, setViewPhotosModal] = useState<{ isOpen: boolean, photos: string[], judul: string }>({ isOpen: false, photos: [], judul: '' });
    const [laporanText, setLaporanText] = useState('');
    const [fotoDokumentasi, setFotoDokumentasi] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'list'>('list');

    const handleDelete = async (id: string, judul: string) => {
        if (window.confirm(`Hapus agenda "${judul}"?`)) {
            await agendaService.delete(id);
            loadData();
        }
    };

    const handleToggleExpand = (agenda: Agenda) => {
        if (expandedId === agenda.id) {
            setExpandedId(null);
        } else {
            setExpandedId(agenda.id);
            setLaporanText(agenda.laporan_kegiatan || '');
            setFotoDokumentasi(agenda.foto_dokumentasi || []);
        }
    };

    const handleSubmitReport = async (agendaId: string) => {
        setIsUploading(true);
        try {
            await agendaService.update(agendaId, {
                is_terlaksana: true,
                laporan_kegiatan: laporanText,
                foto_dokumentasi: fotoDokumentasi
            });
            setExpandedId(null);
            loadData();
        } catch (error) {
            alert("Gagal menyimpan laporan.");
        } finally {
            setIsUploading(false);
        }
    };

    const isPast = (dateStr: string) => new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

    const filteredAgenda = (agendaList || []).filter(a => {
        const matchesSearch = a.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            a.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (statusFilter === 'terlaksana' && !a.is_terlaksana) return false;
        if (statusFilter === 'terencana' && a.is_terlaksana) return false;

        if (!isWarga) return true;
        if (a.is_semua_warga) return true;
        return currentWargaId && a.peserta_ids.includes(currentWargaId);
    });

    // Summary Analytics
    const totalAgenda = filteredAgenda.length;
    const realizedAgenda = (filteredAgenda || []).filter(a => a.is_terlaksana).length;
    const pendingAgenda = (filteredAgenda || []).filter(a => !a.is_terlaksana && isPast(a.tanggal)).length;
    const upcomingAgenda = totalAgenda - realizedAgenda - pendingAgenda;

    const totalPendanaan = filteredAgenda.reduce((acc, curr) => curr.butuh_pendanaan ? acc + (curr.nominal_biaya || 0) : acc, 0);

    const statusData = [
        { name: 'Terealisasi', value: realizedAgenda, color: '#10b981' },
        { name: 'Menunggu Laporan', value: pendingAgenda, color: '#f59e0b' },
        { name: 'Mendatang', value: upcomingAgenda > 0 ? upcomingAgenda : 0, color: '#3b82f6' }
    ].filter(d => d.value > 0);

    const fundingBySource = filteredAgenda.reduce((acc: any, curr) => {
        if (curr.butuh_pendanaan && curr.sumber_dana && curr.nominal_biaya) {
            if (!acc[curr.sumber_dana]) acc[curr.sumber_dana] = 0;
            acc[curr.sumber_dana] += curr.nominal_biaya;
        }
        return acc;
    }, {});

    const fundingData = Object.keys(fundingBySource).map(key => ({
        name: key,
        Total: fundingBySource[key]
    }));

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="page-title">Informasi Kegiatan</h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium tracking-normal">Daftar aktivitas dan jadwal kegiatan warga</p>
                </div>
                <HasPermission module="Agenda" action="Buat">
                    <button
                        onClick={() => navigate('/agenda/new')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Buat Agenda Baru</span>
                    </button>
                </HasPermission>
            </div>

            <div className="flex space-x-2 border-b border-gray-100 pb-1">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-5 py-3 font-medium text-sm tracking-wide transition-all border-b-2 ${activeTab === 'list' ? 'text-brand-600 border-brand-600 bg-brand-50/50 rounded-t-xl' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50 rounded-t-xl'}`}
                >
                    Daftar Aktivitas
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-5 py-3 font-medium text-sm tracking-wide transition-all border-b-2 ${activeTab === 'summary' ? 'text-brand-600 border-brand-600 bg-brand-50/50 rounded-t-xl' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50 rounded-t-xl'}`}
                >
                    Dashboard Monitor
                </button>
            </div>

            <div className={activeTab === 'summary' ? 'block' : 'hidden md:hidden lg:hidden'}>
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <div className="bg-white py-3.5 px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <p className="text-xs font-bold text-slate-900 tracking-tight leading-none mb-2">Cakupan Kegiatan</p>
                                <p className="text-3xl font-bold text-slate-800 leading-none tabular-nums">{totalAgenda}</p>
                                <p className="text-[0.6875rem] font-medium text-slate-500 mt-2">Total Kegiatan</p>
                            </div>
                        </div>

                        <div className="bg-emerald-600 py-3.5 px-4 rounded-xl border border-emerald-500 shadow-md relative overflow-hidden group hover:bg-emerald-700 transition-all duration-300">
                            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10 flex flex-col items-center text-center text-white">
                                <p className="text-xs font-bold text-white tracking-tight leading-none mb-2">Terealisasi</p>
                                <p className="text-3xl font-bold text-white leading-none tabular-nums">{realizedAgenda}</p>
                                <div className="flex items-center gap-1 text-[0.6875rem] font-medium text-white/80 mt-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                    Sudah Dilaksanakan
                                </div>
                            </div>
                        </div>

                        <div className="bg-white py-3.5 px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-amber-400">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <p className="text-xs font-bold text-slate-900 tracking-tight leading-none mb-2">Menunggu Laporan</p>
                                <p className="text-3xl font-bold text-slate-800 leading-none tabular-nums">{pendingAgenda}</p>
                                <p className="text-[0.6875rem] font-medium text-amber-600 mt-2">Butuh Dokumentasi</p>
                            </div>
                        </div>

                        <div className="bg-white py-3.5 px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-slate-300">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <p className="text-xs font-bold text-slate-900 tracking-tight leading-none mb-2">Estimasi Anggaran</p>
                                <p className="text-lg font-bold text-slate-800 leading-none truncate tabular-nums">{formatRupiah(totalPendanaan)}</p>
                                <p className="text-[0.6875rem] font-medium text-slate-500 mt-2">Estimasi Biaya</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                <ChartPieSlice weight="duotone" className="w-6 h-6 text-brand-500" />
                                <h3 className="text-xs font-bold tracking-tight text-slate-900">Status Realisasi</h3>
                            </div>
                            <div className="h-[250px] w-full min-h-[250px]">
                                {activeTab === 'summary' && statusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statusData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={statusData[index].color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : activeTab === 'summary' ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <ChartPieSlice weight="thin" className="w-12 h-12" />
                                        <p className="text-[10px] font-bold tracking-tight uppercase">Belum ada data status</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                <TrendUp weight="duotone" className="w-6 h-6 text-emerald-500" />
                                <h3 className="text-xs font-bold tracking-tight text-slate-900">Alokasi Anggaran</h3>
                            </div>
                            <div className="h-[250px] w-full min-h-[250px]">
                                {activeTab === 'summary' && fundingData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <BarChart data={fundingData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                            />
                                            <YAxis 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                                tickFormatter={(value) => `Rp${value/1000}k`}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => [formatRupiah(value), 'Total']}
                                            />
                                            <Bar dataKey="Total" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : activeTab === 'summary' ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                        <TrendUp weight="thin" className="w-12 h-12" />
                                        <p className="text-[10px] font-bold tracking-tight uppercase">Belum ada data anggaran</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className={activeTab === 'list' ? 'block' : 'hidden md:hidden lg:hidden'}>
                <div className={`p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 ${activeTab === 'list' ? 'block' : 'hidden'}`}>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Cari informasi kegiatan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-6 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400 text-sm font-normal"
                        />
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setStatusFilter('terencana')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'terencana' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Terencana
                        </button>
                        <button
                            onClick={() => setStatusFilter('terlaksana')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'terlaksana' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Terlaksana
                        </button>
                    </div>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[0.625rem] font-bold text-slate-400 uppercase tracking-widest">
                                <th className="p-4 w-24 text-center">Tanggal</th>
                                <th className="p-4">Agenda & Deskripsi</th>
                                <th className="p-4 w-56 text-right">Budget & Peserta</th>
                                <th className="p-4 w-32 text-center">Status</th>
                                <th className="p-4 w-32 text-center">Aksi</th>
                            </tr>
                        </thead>
                            <tbody className="divide-y divide-slate-50">
                                {!agendaItems && isLoading ? (
                                    <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-400 font-bold text-[0.6875rem] tracking-tight animate-pulse">
                                        <div className="flex flex-col items-center gap-4">
                                            <CircleNotch weight="bold" className="w-10 h-10 animate-spin text-brand-500" />
                                            Sinkronisasi Laporan...
                                        </div>
                                        </td>
                                    </tr>
                                ) : filteredAgenda.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-32 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                                                    <CalendarBlank weight="duotone" className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <p className="text-lg font-bold text-slate-900 tracking-tight">Belum Ada Informasi Kegiatan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAgenda.map((agenda) => {
                                        const past = isPast(agenda.tanggal);
                                        const isRealized = agenda.is_terlaksana;

                                        return (
                                            <React.Fragment key={agenda.id}>
                                                <tr className={`transition-all group ${
                                                    isRealized
                                                    ? 'bg-slate-50/40 hover:bg-slate-50 grayscale-[0.3]'
                                                    : 'hover:bg-emerald-50/30'
                                                } ${expandedId === agenda.id ? 'bg-brand-50/40 ring-1 ring-inset ring-brand-100' : ''}`}>
                                                    <td className="p-4 text-center">
                                                        <div className={`px-2 py-1 mx-auto rounded-lg flex flex-col items-center justify-center border shrink-0 ${
                                                            isRealized
                                                            ? 'bg-slate-100 border-slate-200 text-slate-400'
                                                            : past
                                                                ? 'bg-amber-50 border-amber-100 text-amber-600'
                                                                : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                                        } shadow-sm overflow-hidden min-w-[70px]`}>
                                                            <span className="text-[0.6875rem] font-bold leading-none whitespace-nowrap">{dateUtils.toDisplay(agenda.tanggal)}</span>
                                                            {(agenda.jam_mulai || agenda.jam_selesai) && (
                                                                <span className="text-[9px] font-bold mt-1 text-slate-500 bg-white/50 px-1.5 py-0.5 rounded border border-slate-200/50">
                                                                    {agenda.jam_mulai || '--:--'} - {agenda.jam_selesai || '--:--'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 min-w-0">
                                                        <h3 className={`text-sm font-bold leading-tight transition-colors truncate ${isRealized ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800 focus-within:text-brand-700'}`}>{agenda.judul}</h3>
                                                        <p className={`text-sm line-clamp-1 mt-1 font-normal ${isRealized ? 'text-slate-400' : 'text-slate-500'}`}>{agenda.deskripsi}</p>
                                                        {isRealized && agenda.laporan_kegiatan && !expandedId && (
                                                            <div className="mt-2 text-[10px] text-slate-500 bg-slate-100/50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1.5 w-fit font-medium">
                                                                <CheckCircle weight="fill" className="w-3 h-3 text-emerald-500" />
                                                                <span className="truncate max-w-[200px]">Laporan Selesai</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {agenda.butuh_pendanaan ? (
                                                            <div className="text-sm font-bold text-slate-900 mb-0.5">{formatRupiah(agenda.nominal_biaya || 0)}</div>
                                                        ) : (
                                                            <div className="text-[0.6875rem] font-bold text-slate-400 tracking-tight italic mb-0.5">Tanpa Budget</div>
                                                        )}
                                                        {agenda.is_semua_warga ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 tracking-tight">Semua Warga</span>
                                                        ) : (
                                                            <div className="flex flex-col items-end">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[10px] font-bold border border-brand-100 tracking-tight mb-0.5">Sebagian Warga</span>
                                                                <span className="text-[10px] font-bold text-slate-400 tracking-tight capitalize">{(agenda.peserta_ids?.length || 0)} Peserta</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col gap-1.5 items-center">
                                                            <div className="flex flex-col items-center gap-0.5">
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Agenda</span>
                                                                {isRealized ? (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-tight">Terlaksana</span>
                                                                ) : past ? (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-amber-50 text-amber-600 border border-amber-100 tracking-tight whitespace-nowrap">Tertunda</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-blue-50 text-blue-600 border border-blue-100 tracking-tight">Terjadwal</span>
                                                                )}
                                                            </div>
                                                            {agenda.perlu_rapat && (
                                                                <div className="flex flex-col items-center gap-0.5">
                                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Rapat</span>
                                                                    {notulensiList.some(n => n.agenda_id === agenda.id) ? (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-tight">Selesai</span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-slate-100 text-slate-500 border border-slate-200 tracking-tight">Menunggu</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                    <div className="flex flex-wrap items-center justify-end gap-2 pr-2">
                                                        <button
                                                            onClick={() => handleToggleExpand(agenda)}
                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[0.6875rem] font-bold transition-all active:scale-95 whitespace-nowrap border shadow-sm ${
                                                                expandedId === agenda.id 
                                                                ? 'bg-slate-900 text-white border-slate-900' 
                                                                : 'bg-white text-brand-600 border-brand-100 hover:bg-brand-50 hover:border-brand-200 hover:shadow-brand-500/10'
                                                            }`}
                                                            title={expandedId === agenda.id ? 'Tutup' : 'Lihat Detail'}
                                                        >
                                                            <FileText weight={expandedId === agenda.id ? "fill" : "bold"} className="w-4 h-4" />
                                                            {expandedId === agenda.id ? 'Tutup' : 'Lihat'}
                                                        </button>
                                                        
                                                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                                            {isRealized && agenda.foto_dokumentasi && agenda.foto_dokumentasi.length > 0 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setViewPhotosModal({ isOpen: true, photos: agenda.foto_dokumentasi, judul: agenda.judul }); }}
                                                                    className="p-1.5 text-brand-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                                    title="Lihat Foto"
                                                                >
                                                                    <ImageIcon weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <HasPermission module="Agenda" action="Ubah">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigate(`/agenda/edit/${agenda.id}`); }}
                                                                    className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                                    title="Edit Agenda"
                                                                >
                                                                    <PencilSimple weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                            <HasPermission module="Agenda" action="Hapus">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleDelete(agenda.id, agenda.judul); }}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                                    title="Hapus"
                                                                >
                                                                    <Trash weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                        </div>
                                                    </div>
                                                </td>
                                                </tr>
                                                {expandedId === agenda.id && (
                                                    <tr key={`${agenda.id}-details`}>
                                                        <td colSpan={5} className="p-0 border-b border-slate-100 shadow-inner overflow-hidden">
                                                            <div className="bg-brand-50/30 animate-in slide-in-from-top-4 duration-300">
                                                                <DetailContent agenda={agenda} currentScope={currentScope} formatRupiah={formatRupiah} />
                                                                
                                                                {/* Hide report panel if it's a meeting (handled via Notulensi) */}
                                                                {!isWarga && !agenda.perlu_rapat && (
                                                                    <ReportPanel 
                                                                        agenda={agenda} 
                                                                        laporanText={laporanText}
                                                                        setLaporanText={setLaporanText}
                                                                        fotoDokumentasi={fotoDokumentasi}
                                                                        setFotoDokumentasi={setFotoDokumentasi}
                                                                        isUploading={isUploading}
                                                                        setIsUploading={setIsUploading}
                                                                        handleSubmitReport={handleSubmitReport}
                                                                        setExpandedId={setExpandedId}
                                                                    />
                                                                )}
                                                                {!isWarga && agenda.perlu_rapat && (
                                                                    <div className="p-6 md:p-8 bg-blue-50/50 border-t border-b border-blue-100 text-center space-y-3">
                                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto border border-blue-200 shadow-sm text-blue-600">
                                                                            <FileText weight="fill" className="w-6 h-6" />
                                                                        </div>
                                                                        <div className="max-w-md mx-auto">
                                                                            <p className="text-sm font-bold text-blue-900 tracking-tight">Laporan Rapat Aktif</p>
                                                                            <p className="text-[11px] text-blue-600 font-medium leading-relaxed mt-1">Laporan pelaksanaan rapat, absensi, dan dokumentasi dikelola sepenuhnya melalui modul <strong>Notulensi</strong> untuk menghindari duplikasi data.</p>
                                                                            <button 
                                                                                onClick={() => navigate('/notulensi')}
                                                                                className="mt-4 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold tracking-tight shadow-md transition-all active:scale-95"
                                                                            >
                                                                                Buka Modul Notulensi
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                    </table>
                </div>

                {/* MOBILE VIEW: CARD GRID */}
                <div className="md:hidden space-y-4">
                    {!agendaItems && isLoading ? (
                        <div className="p-20 text-center text-slate-400 font-bold text-[0.6875rem] tracking-tight animate-pulse">
                            <div className="flex flex-col items-center gap-4">
                                <CircleNotch weight="bold" className="w-10 h-10 animate-spin text-brand-500" />
                                Sinkronisasi Laporan...
                            </div>
                        </div>
                    ) : filteredAgenda.length === 0 ? (
                        <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <CalendarBlank weight="duotone" className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-slate-900">Belum Ada Informasi Kegiatan</p>
                        </div>
                    ) : (
                        filteredAgenda.map((agenda) => {
                            const past = isPast(agenda.tanggal);
                            const isRealized = agenda.is_terlaksana;
                            const isExpanded = expandedId === agenda.id;

                            return (
                                <div key={agenda.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'ring-2 ring-brand-500 shadow-lg border-transparent' : 'border-slate-100 shadow-sm'}`}>
                                    <div className="p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className={`px-2 py-1 rounded-lg flex flex-col items-center justify-center border shrink-0 ${
                                                isRealized
                                                ? 'bg-slate-100 border-slate-200 text-slate-400'
                                                : past
                                                    ? 'bg-amber-50 border-amber-100 text-amber-600'
                                                    : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                            } shadow-sm min-w-[65px]`}>
                                                <span className="text-[0.625rem] font-bold leading-none uppercase">{new Date(agenda.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                <span className="text-sm font-black leading-none mt-0.5">{new Date(agenda.tanggal).getDate()}</span>
                                                {(agenda.jam_mulai || agenda.jam_selesai) && (
                                                    <span className="text-[8px] font-bold mt-1 text-slate-500 bg-white/50 px-1 rounded border border-slate-200/50">
                                                        {agenda.jam_mulai || '--:--'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex gap-1">
                                                    {isRealized ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-tight">Agenda Selesai</span>
                                                    ) : past ? (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-amber-50 text-amber-600 border border-amber-100 tracking-tight whitespace-nowrap">Tertunda</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-blue-50 text-blue-600 border border-blue-100 tracking-tight">Terjadwal</span>
                                                    )}
                                                </div>
                                                {agenda.perlu_rapat && (
                                                    <div className="flex gap-1">
                                                        {notulensiList.some(n => n.agenda_id === agenda.id) ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 tracking-tight">Rapat Selesai</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.625rem] font-bold bg-slate-100 text-slate-500 border border-slate-200 tracking-tight">Rapat Menunggu</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                                {agenda.butuh_pendanaan ? (
                                                    <div className="text-[11px] font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{formatRupiah(agenda.nominal_biaya || 0)}</div>
                                                ) : (
                                                    <div className="text-[10px] font-bold text-slate-400 italic">Tanpa Budget</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className={`text-sm font-bold leading-tight ${isRealized ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>{agenda.judul}</h3>
                                            <p className={`text-xs mt-1 font-normal line-clamp-2 ${isRealized ? 'text-slate-400' : 'text-slate-500'}`}>{agenda.deskripsi}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                {agenda.is_semua_warga ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-100 tracking-tight">Semua Warga</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-50 text-brand-600 text-[9px] font-bold border border-brand-100 tracking-tight">{(agenda.peserta_ids?.length || 0)} Peserta</span>
                                                )}
                                                {agenda.perlu_rapat && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[9px] font-bold border border-blue-100 tracking-tight">Rapat</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleExpand(agenda)}
                                                    className={`p-2 rounded-lg transition-all active:scale-95 border ${isExpanded ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-brand-600 border-brand-100'}`}
                                                >
                                                    <FileText weight={isExpanded ? "fill" : "bold"} className="w-4 h-4" />
                                                </button>
                                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                                <HasPermission module="Agenda" action="Ubah">
                                                    <button onClick={() => navigate(`/agenda/edit/${agenda.id}`)} className="p-2 text-slate-500 hover:text-brand-600 bg-slate-50 rounded-lg transition-all">
                                                        <PencilSimple weight="bold" className="w-4 h-4" />
                                                    </button>
                                                </HasPermission>
                                                <HasPermission module="Agenda" action="Hapus">
                                                    <button onClick={() => handleDelete(agenda.id, agenda.judul)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition-all">
                                                        <Trash weight="bold" className="w-4 h-4" />
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="bg-brand-50/30 border-t border-brand-100 animate-in slide-in-from-top-2 duration-300">
                                            <DetailContent agenda={agenda} currentScope={currentScope} formatRupiah={formatRupiah} />
                                            {!isWarga && (
                                                <ReportPanel 
                                                    agenda={agenda} 
                                                    laporanText={laporanText}
                                                    setLaporanText={setLaporanText}
                                                    fotoDokumentasi={fotoDokumentasi}
                                                    setFotoDokumentasi={setFotoDokumentasi}
                                                    isUploading={isUploading}
                                                    setIsUploading={setIsUploading}
                                                    handleSubmitReport={handleSubmitReport}
                                                    setExpandedId={setExpandedId}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                </div>
            </div>

            {/* VIEW PHOTOS MODAL */}
            {viewPhotosModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-normal text-gray-900">Dokumentasi Kegiatan</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{viewPhotosModal.judul}</p>
                            </div>
                            <button
                                onClick={() => setViewPhotosModal({ ...viewPhotosModal, isOpen: false })}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-all"
                            >
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {viewPhotosModal.photos.map((url, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm group">
                                        <img
                                            src={getFullUrl(url)}
                                            alt={`Dokumentasi ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-50 flex justify-end">
                            <button
                                onClick={() => setViewPhotosModal({ ...viewPhotosModal, isOpen: false })}
                                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-normal rounded-xl hover:bg-gray-200 transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
