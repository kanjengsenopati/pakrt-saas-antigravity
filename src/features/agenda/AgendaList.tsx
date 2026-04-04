import React, { useState, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { agendaService } from '../../services/agendaService';
import { notulensiService } from '../../services/notulensiService';
import { Agenda, Notulensi } from '../../database/db';
import { Plus, PencilSimple, Trash, Users, CheckCircle, FileText, X, CircleNotch, ChartPieSlice, TrendUp, MapPin, House, Clock, Tag, CaretDown, MagnifyingGlass, Calendar, Image as ImageIcon } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { FileUpload } from '../../components/ui/FileUpload';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { formatRupiah } from '../../utils/currency';
import { getFullUrl } from '../../utils/url';
import { dateUtils } from '../../utils/date';
import { useAuth } from '../../contexts/AuthContext';
import { useHybridData } from '../../hooks/useHybridData';
import { Text } from '../../components/ui/Typography';

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
    <div className="p-6 md:p-10 bg-slate-50 border-t border-b border-slate-100 animate-in slide-in-from-top-4 duration-300">
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-600 rounded-[12px] shadow-premium flex items-center justify-center">
                        <FileText weight="fill" className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <Text.H2 className="!font-bold">
                            {agenda.is_terlaksana ? 'Edit Laporan Kegiatan' : 'Buat Laporan Realisasi'}
                        </Text.H2>
                        <Text.Caption className="mt-0.5">Dokumentasikan hasil pelaksanaan kegiatan</Text.Caption>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                <div className="space-y-4">
                    <div>
                        <Text.Label className="mb-2 block">Catatan Laporan</Text.Label>
                        <textarea
                            value={laporanText}
                            onChange={(e) => setLaporanText(e.target.value)}
                            rows={6}
                            placeholder="Tuliskan ringkasan hasil kegiatan, kesimpulan, dan evaluasi singkat di sini..."
                            className="w-full rounded-[20px] border border-slate-200 p-5 text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-300 shadow-sm leading-relaxed"
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-premium">
                        <FileUpload
                            label="Foto Dokumentasi"
                            helperText="Unggah foto realisasi kegiatan (Maks 2MB/file)"
                            multiple={true}
                            existingUrls={fotoDokumentasi}
                            onUploadSuccess={(url) => setFotoDokumentasi(prev => [...prev, url])}
                            onRemove={(url) => setFotoDokumentasi(prev => prev.filter(item => item !== url))}
                            onLoadingChange={setIsUploading}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setExpandedId(null)}
                            className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-[12px] transition-all active-press"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleSubmitReport(agenda.id)}
                            disabled={isUploading || !laporanText.trim()}
                            className={`px-8 py-2.5 bg-brand-600 text-white rounded-[12px] text-xs font-bold transition-all shadow-premium flex items-center gap-2 ${(isUploading || !laporanText.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-700 active-press'}`}
                        >
                            {isUploading ? <CircleNotch weight="bold" className="animate-spin w-4 h-4" /> : <CheckCircle weight="bold" className="w-4 h-4" />}
                            Simpan Laporan Sekarang
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const DetailContent = ({ agenda, currentScope, formatRupiah }: { agenda: Agenda, currentScope: string, formatRupiah: (val: number) => string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 md:p-12 max-w-6xl mx-auto">
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-[20px] border border-slate-100 text-center flex flex-col items-center justify-center shadow-premium">
                    <Text.Label className="mb-2 block">Anggaran</Text.Label>
                    <Text.Amount className="text-lg text-slate-900">{formatRupiah(agenda.nominal_biaya || 0)}</Text.Amount>
                    <Text.Caption className="mt-1 font-medium italic">{agenda.sumber_dana || '-'}</Text.Caption>
                </div>
                <div className="bg-white p-6 rounded-[20px] border border-slate-100 text-center flex flex-col items-center justify-center shadow-premium">
                    <Text.Label className="mb-2 block">Jenis</Text.Label>
                    <Text.H2 className="!text-brand-600 !font-bold">{agenda.jenis_kegiatan || '-'}</Text.H2>
                    <Text.Caption className="mt-1 font-medium italic">{agenda.perlu_rapat ? 'Ada Notulensi' : 'Tanpa Rapat'}</Text.Caption>
                </div>
                {agenda.perlu_rapat && agenda.tuan_rumah && (
                    <div className="bg-white p-6 rounded-[20px] border border-brand-100 text-center flex flex-col items-center justify-center shadow-premium">
                        <div className="flex items-center gap-1 mb-2">
                             <House weight="fill" className="w-3.5 h-3.5 text-brand-500" />
                             <Text.Label className="!text-brand-500 !tracking-normal">Tuan Rumah</Text.Label>
                        </div>
                        <Text.H2 className="!text-sm !font-bold text-slate-900 truncate max-w-full px-2" title={agenda.tuan_rumah}>{agenda.tuan_rumah}</Text.H2>
                        <div className="flex items-center gap-1 mt-1">
                            <MapPin weight="bold" className="w-2.5 h-2.5 text-slate-400" />
                            <Text.Caption className="italic" title={agenda.lokasi}>{agenda.lokasi || 'Lokasi Rapat'}</Text.Caption>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-white p-8 rounded-[20px] border border-slate-100 shadow-premium">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                    <Users weight="duotone" className="w-6 h-6 text-brand-500" />
                    <Text.Label className="!text-slate-900 !tracking-normal">Cakupan Peserta</Text.Label>
                </div>

                {agenda.is_semua_warga ? (
                    <div className="flex flex-col items-center py-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-brand-50 rounded-[18px] flex items-center justify-center border border-brand-100 shadow-sm">
                            <Users weight="fill" className="text-brand-500 w-8 h-8" />
                        </div>
                        <div>
                            <Text.H2 className="!text-brand-600">Terbuka Untuk Semua Warga</Text.H2>
                            <Text.Caption className="mt-2 max-w-[240px] mx-auto">Kegiatan bersifat umum and melibatkan seluruh elemen warga {currentScope}.</Text.Caption>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {agenda.peserta_details && agenda.peserta_details.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {agenda.peserta_details.map((peserta: any) => (
                                    <div key={peserta.id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-[10px] shadow-sm">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                                        <Text.Caption className="!font-bold !text-slate-700">{peserta.nama}</Text.Caption>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-10 text-slate-300 gap-3">
                                <Users weight="thin" className="w-12 h-12 opacity-30" />
                                <Text.Label className="!text-slate-300 italic">Data peserta tidak dimuat</Text.Label>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {agenda.is_terlaksana && agenda.laporan_kegiatan && (
                <div className="bg-brand-600 p-8 rounded-[20px] shadow-premium relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
                            <CheckCircle weight="duotone" className="w-6 h-6 text-brand-200" />
                            <Text.Label className="!text-white !tracking-normal">Laporan Pelaksanaan</Text.Label>
                        </div>
                        <Text.Body className="!text-brand-50 !font-medium italic leading-relaxed">"{agenda.laporan_kegiatan}"</Text.Body>
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
        isFetching: _isLoading, 
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
    // @ts-ignore - Used in legacy logic or for future status indicators
    const _notulensiList = notulensiItems || [];

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

    const handleViewPhotos = (agenda: Agenda) => {
        setViewPhotosModal({
            isOpen: true,
            photos: agenda.foto_dokumentasi || [],
            judul: agenda.judul
        });
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
        return currentWargaId && a.peserta_ids?.includes(currentWargaId);
    });

    const totalAgenda = filteredAgenda.length;
    const realizedAgenda = (filteredAgenda || []).filter(a => a.is_terlaksana).length;
    const pendingAgenda = (filteredAgenda || []).filter(a => !a.is_terlaksana && isPast(a.tanggal)).length;
    const upcomingAgenda = totalAgenda - realizedAgenda - pendingAgenda;

    const totalPendanaan = filteredAgenda.reduce((acc, curr) => curr.butuh_pendanaan ? acc + (curr.nominal_biaya || 0) : acc, 0);

    const statusData = [
        { name: 'Terealisasi', value: realizedAgenda, color: '#4f46e5' },
        { name: 'Menunggu Laporan', value: pendingAgenda, color: '#f59e0b' },
        { name: 'Mendatang', value: upcomingAgenda > 0 ? upcomingAgenda : 0, color: '#6366f1' }
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
        <div className="space-y-8 animate-fade-in relative px-5 md:px-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <Text.H1>Informasi Kegiatan</Text.H1>
                    <Text.Body className="mt-1">Daftar aktivitas dan jadwal kegiatan warga</Text.Body>
                </div>
                <HasPermission module="Agenda" action="Buat">
                    <button
                        onClick={() => navigate('/agenda/new')}
                        className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <span>Buat Agenda Baru</span>
                    </button>
                    
                    {/* MOBILE FAB */}
                    <button
                        onClick={() => navigate('/agenda/new')}
                        className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            <div className="flex bg-slate-100/50 p-1.5 rounded-xl w-full md:w-fit border border-slate-100 shadow-sm">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Calendar weight="bold" className="w-4 h-4" /> Daftar Aktivitas
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ChartPieSlice weight="bold" className="w-4 h-4" /> Dashboard Monitor
                </button>
            </div>

            {activeTab === 'summary' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
                            <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                                <Calendar weight="duotone" className="text-slate-400 w-4 h-4" />
                                Total Kegiatan
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-slate-900 tracking-tight tabular-nums">{totalAgenda}</span>
                                <span className="text-[11px] font-bold text-slate-400">Data</span>
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:bg-slate-950 transition-all duration-300 text-white">
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                                <CheckCircle weight="duotone" className="text-brand-400 w-4 h-4" />
                                Terealisasi
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white tracking-tight tabular-nums">{realizedAgenda}</span>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Selesai</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all duration-300 hover:shadow-md">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                            <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                                <TrendUp weight="duotone" className="text-amber-500 w-4 h-4" />
                                Laporan Review
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-amber-600 tracking-tight tabular-nums">{pendingAgenda}</span>
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Review</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all duration-300 hover:shadow-md">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                            <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                                <TrendUp weight="duotone" className="text-blue-500 w-4 h-4" />
                                Alokasi Anggaran
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-slate-900 tracking-tight tabular-nums">{formatRupiah(totalPendanaan)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[20px] p-8 border border-slate-100 shadow-premium">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-5">
                                <ChartPieSlice weight="duotone" className="w-6 h-6 text-brand-500" />
                                <Text.Label className="!text-slate-900 !tracking-normal">Status Realisasi</Text.Label>
                            </div>
                            <div className="h-[250px] w-full min-h-[250px]">
                                {statusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <PieChart>
                                            <Pie
                                                data={statusData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={8}
                                                dataKey="value"
                                            >
                                                {statusData.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={statusData[index].color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-3">
                                        <ChartPieSlice weight="thin" className="w-16 h-16 opacity-30" />
                                        <Text.Label className="!text-slate-300 italic">Belum ada data status</Text.Label>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-[20px] p-8 border border-slate-100 shadow-premium">
                            <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-5">
                                <TrendUp weight="duotone" className="w-6 h-6 text-brand-500" />
                                <Text.Label className="!text-slate-900 !tracking-normal">Alokasi Anggaran</Text.Label>
                            </div>
                            <div className="h-[250px] w-full min-h-[250px]">
                                {fundingData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                                        <BarChart data={fundingData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                            />
                                            <YAxis 
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }}
                                                tickFormatter={(value) => `Rp${value/1000}k`}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: any) => {
                                                    const numValue = typeof value === 'number' ? value : Number(value);
                                                    return [formatRupiah(numValue || 0), 'Total'] as [string, string];
                                                }}
                                            />
                                            <Bar dataKey="Total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-3">
                                        <TrendUp weight="thin" className="w-16 h-16 opacity-30" />
                                        <Text.Label className="!text-slate-300 italic">Belum ada data anggaran</Text.Label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="bg-white p-4 md:p-8 rounded-[24px] border border-slate-100 shadow-premium animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-4 mb-8">
                        <div className="flex-1 relative group">
                            <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Cari agenda kegiatan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-slate-300 text-sm font-medium text-slate-700"
                            />
                        </div>
                        <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-100 shadow-sm w-full lg:w-fit overflow-x-auto no-scrollbar">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`flex-1 lg:flex-none px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${statusFilter === 'all' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => setStatusFilter('terencana')}
                                className={`flex-1 lg:flex-none px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${statusFilter === 'terencana' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Terencana
                            </button>
                            <button
                                onClick={() => setStatusFilter('terlaksana')}
                                className={`flex-1 lg:flex-none px-4 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${statusFilter === 'terlaksana' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Selesai
                            </button>
                        </div>
                    </div>

                    <div className="hidden md:block overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="pb-5 pl-2"><Text.Label className="!text-slate-400">Informasi Kegiatan</Text.Label></th>
                                    <th className="pb-5"><Text.Label className="!text-slate-400">Waktu & Lokasi</Text.Label></th>
                                    <th className="pb-5"><Text.Label className="!text-slate-400">Biaya</Text.Label></th>
                                    <th className="pb-5 text-center"><Text.Label className="!text-slate-400">Status</Text.Label></th>
                                    <th className="pb-5 text-right"><Text.Label className="!text-slate-400">Aksi</Text.Label></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredAgenda.length > 0 ? (
                                    filteredAgenda.map((agenda) => {
                                        const isExpanded = expandedId === agenda.id;
                                        return (
                                            <Fragment key={agenda.id}>
                                                <tr className={`group transition-all hover:bg-slate-50/50 ${isExpanded ? 'bg-brand-50/20' : ''}`}>
                                                    <td className="py-5 pl-2">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-[14px] flex flex-col items-center justify-center border ${agenda.is_terlaksana ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-brand-50 border-brand-100 text-brand-600 shadow-sm'}`}>
                                                                <Text.Label className="!text-[10px] !tracking-tighter !font-black !leading-none">{dateUtils.format(agenda.tanggal, 'MMM').toUpperCase()}</Text.Label>
                                                                <Text.Amount className="text-lg !leading-none mt-1">{dateUtils.format(agenda.tanggal, 'dd')}</Text.Amount>
                                                            </div>
                                                            <div className="max-w-[280px]">
                                                                <button 
                                                                    onClick={() => handleToggleExpand(agenda)}
                                                                    className="text-left group/title"
                                                                >
                                                                    <Text.H2 className="!text-sm group-hover/title:text-brand-600 transition-colors line-clamp-1">{agenda.judul}</Text.H2>
                                                                    <Text.Caption className="line-clamp-1 mt-0.5">{agenda.deskripsi ? (agenda.deskripsi.substring(0, 50) + '...') : 'Tidak ada deskripsi'}</Text.Caption>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                                <Clock weight="bold" className="w-3.5 h-3.5 text-slate-400" />
                                                                <Text.Caption className="!font-bold !text-slate-700">{dateUtils.format(agenda.tanggal, 'HH:mm')} WIB</Text.Caption>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                                <MapPin weight="fill" className="w-3.5 h-3.5 text-brand-400" />
                                                                <Text.Caption className="truncate max-w-[150px]">{agenda.lokasi || '-'}</Text.Caption>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-5">
                                                        <div className="space-y-1">
                                                            <Text.Amount className="text-sm text-slate-900">{formatRupiah(agenda.nominal_biaya || 0)}</Text.Amount>
                                                            <Text.Label className="!text-[9px] !text-slate-400 flex items-center gap-1">
                                                                <Tag weight="bold" className="w-2.5 h-2.5" />
                                                                {agenda.sumber_dana || 'Kas Umum'}
                                                            </Text.Label>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        {agenda.is_terlaksana ? (
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-900 text-white rounded-full shadow-sm">
                                                                <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                                <Text.Label className="!text-[9px] !font-black !text-white uppercase tracking-widest">Terlaksana</Text.Label>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 text-brand-600 rounded-full">
                                                                <Calendar weight="fill" className="w-3.5 h-3.5" />
                                                                <Text.Label className="!text-[9px] !font-black !text-brand-600 uppercase tracking-widest">Terencana</Text.Label>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2 pr-2">
                                                            <button 
                                                                onClick={() => handleToggleExpand(agenda)}
                                                                className={`p-2 rounded-[10px] transition-all ${isExpanded ? 'bg-brand-600 text-white shadow-premium' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                                            >
                                                                <CaretDown weight="bold" className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                                            </button>
                                                            <HasPermission module="Agenda" action="Ubah">
                                                                <button 
                                                                    onClick={() => navigate(`/agenda/edit/${agenda.id}`)}
                                                                    className="p-2 bg-slate-50 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-[10px] transition-all"
                                                                    title="Ubah Agenda"
                                                                >
                                                                    <PencilSimple weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                            <HasPermission module="Agenda" action="Hapus">
                                                                <button 
                                                                    onClick={() => handleDelete(agenda.id, agenda.judul)}
                                                                    className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[10px] transition-all"
                                                                    title="Hapus Agenda"
                                                                >
                                                                    <Trash weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={5} className="p-0 border-none overflow-hidden">
                                                            <div className="bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
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
                                                                
                                                                {agenda.is_terlaksana && agenda.foto_dokumentasi && agenda.foto_dokumentasi.length > 0 && (
                                                                    <div className="px-12 pb-12 pt-4 flex items-center justify-between bg-slate-50/30">
                                                                        <div className="flex -space-x-3">
                                                                            {agenda.foto_dokumentasi.slice(0, 5).map((url: string, i: number) => (
                                                                                <div key={i} className="w-12 h-12 rounded-[14px] border-2 border-white overflow-hidden shadow-sm">
                                                                                    <img src={getFullUrl(url)} alt="doc" className="w-full h-full object-cover" />
                                                                                </div>
                                                                            ))}
                                                                            {agenda.foto_dokumentasi.length > 5 && (
                                                                                <div className="w-12 h-12 rounded-[14px] border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                                    +{agenda.foto_dokumentasi.length - 5}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => handleViewPhotos(agenda)}
                                                                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-100 rounded-[12px] text-xs font-bold text-slate-600 hover:shadow-premium transition-all active-press"
                                                                        >
                                                                            <ImageIcon weight="duotone" className="w-4 h-4 text-brand-500" />
                                                                            Lihat Semua Dokumentasi
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-300">
                                                <Calendar weight="thin" className="w-16 h-16 opacity-30" />
                                                <Text.Label className="!text-slate-300 italic">Tidak ada agenda ditemukan</Text.Label>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="md:hidden space-y-6">
                        {filteredAgenda.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-[20px] border border-slate-100 shadow-sm">
                                <Calendar weight="thin" className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                                <Text.Label className="italic !text-slate-300">Belum ada agenda yang terjadwal</Text.Label>
                            </div>
                        ) : (
                            filteredAgenda.map((agenda) => {
                                const isExpanded = expandedId === agenda.id;
                                return (
                                    <div key={agenda.id} className={`bg-white rounded-[20px] border border-slate-100 shadow-premium overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-brand-500 border-transparent shadow-2xl' : ''}`}>
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-5">
                                                <div className={`px-3 py-2 rounded-[12px] flex flex-col items-center justify-center border ${agenda.is_terlaksana ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-brand-600 text-white border-transparent shadow-premium'}`}>
                                                    <Text.Label className={`!text-[9px] !leading-none ${agenda.is_terlaksana ? '!text-slate-400' : '!text-brand-100'}`}>{dateUtils.format(agenda.tanggal, 'MMM').toUpperCase()}</Text.Label>
                                                    <Text.Amount className={`text-lg !leading-none mt-1 ${agenda.is_terlaksana ? '' : '!text-white'}`}>{dateUtils.format(agenda.tanggal, 'dd')}</Text.Amount>
                                                </div>
                                                <div className="flex gap-2">
                                                    {agenda.is_terlaksana && (
                                                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                                            <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                            <Text.Label className="!text-[9px] !text-white">Terlaksana</Text.Label>
                                                        </div>
                                                    )}
                                                    {!agenda.is_terlaksana && (
                                                        <div className="bg-brand-50 text-brand-600 px-3 py-1.5 rounded-full border border-brand-100 flex items-center gap-1.5">
                                                            <Calendar weight="fill" className="w-3.5 h-3.5" />
                                                            <Text.Label className="!text-[9px] !text-brand-600">Terencana</Text.Label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <Text.H2 className="!text-lg line-clamp-2">{agenda.judul}</Text.H2>
                                                    <Text.Body className="line-clamp-2 !text-slate-500 !text-sm">{agenda.deskripsi || '-'}</Text.Body>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-slate-50">
                                                    <div className="space-y-1">
                                                        <Text.Label className="!text-[9px]">WAKTU & LOKASI</Text.Label>
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock weight="bold" className="w-3 h-3 text-brand-500" />
                                                            <Text.Caption className="!font-bold !text-slate-700">{dateUtils.format(agenda.tanggal, 'HH:mm')}</Text.Caption>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-1 text-right">
                                                        <Text.Label className="!text-[9px]">BIAYA</Text.Label>
                                                        <Text.Amount className="text-sm">{formatRupiah(agenda.nominal_biaya || 0)}</Text.Amount>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex gap-3">
                                                        <HasPermission module="Agenda" action="Ubah">
                                                            <button onClick={() => navigate(`/agenda/edit/${agenda.id}`)} className="p-2.5 text-slate-500 bg-slate-50 rounded-[12px] active-press">
                                                                <PencilSimple weight="bold" className="w-4 h-4" />
                                                            </button>
                                                        </HasPermission>
                                                        <HasPermission module="Agenda" action="Hapus">
                                                            <button onClick={() => handleDelete(agenda.id, agenda.judul)} className="p-2.5 text-slate-400 bg-slate-50 rounded-[12px] active-press">
                                                                <Trash weight="bold" className="w-4 h-4" />
                                                            </button>
                                                        </HasPermission>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleToggleExpand(agenda)}
                                                        className={`px-5 py-2.5 rounded-[12px] text-xs font-bold transition-all flex items-center gap-2 ${isExpanded ? 'bg-brand-600 text-white shadow-premium' : 'bg-brand-50 text-brand-600'}`}
                                                    >
                                                        {isExpanded ? 'Tutup' : 'Lihat Detail'}
                                                        <CaretDown weight="bold" className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div className="bg-slate-50 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
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
                                                
                                                {agenda.is_terlaksana && agenda.foto_dokumentasi && agenda.foto_dokumentasi.length > 0 && (
                                                    <div className="p-6 border-t border-slate-100 bg-white">
                                                        <Text.Label className="mb-4 block">Foto Dokumentasi</Text.Label>
                                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                                            {agenda.foto_dokumentasi.slice(0, 3).map((url: string, i: number) => (
                                                                <div key={i} className="aspect-square rounded-[12px] overflow-hidden border border-slate-100 shadow-sm">
                                                                    <img src={getFullUrl(url)} alt="doc" className="w-full h-full object-cover" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button 
                                                            onClick={() => handleViewPhotos(agenda)}
                                                            className="w-full py-3 bg-slate-50 text-slate-600 rounded-[12px] text-xs font-bold border border-slate-100 shadow-sm flex items-center justify-center gap-2"
                                                        >
                                                            <ImageIcon weight="duotone" className="w-4 h-4 text-brand-500" />
                                                            Lihat Semua Foto ({agenda.foto_dokumentasi.length})
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* VIEW PHOTOS MODAL */}
            {viewPhotosModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[24px] shadow-2xl border border-slate-100 w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/50 sticky top-0 z-10 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-brand-50 rounded-[14px] flex items-center justify-center shadow-sm">
                                    <ImageIcon weight="duotone" className="text-brand-600 w-6 h-6" />
                                </div>
                                <div>
                                    <Text.H2 className="!text-xl !font-bold">Dokumentasi Kegiatan</Text.H2>
                                    <Text.Caption className="mt-1 font-medium italic">{viewPhotosModal.judul}</Text.Caption>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewPhotosModal({ ...viewPhotosModal, isOpen: false })}
                                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all active-press"
                            >
                                <X weight="bold" className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/30">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {viewPhotosModal.photos.map((url, idx) => (
                                    <div key={idx} className="aspect-square rounded-[20px] overflow-hidden border border-white shadow-premium group relative">
                                        <img
                                            src={getFullUrl(url)}
                                            alt={`Dokumentasi ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                            <Text.Caption className="!text-white !font-bold">Foto #{idx + 1}</Text.Caption>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-slate-50 flex justify-end">
                            <button
                                onClick={() => setViewPhotosModal({ ...viewPhotosModal, isOpen: false })}
                                className="px-10 py-3 bg-brand-600 text-white text-xs font-bold rounded-[14px] hover:bg-brand-700 shadow-premium transition-all active-press"
                            >
                                Tutup Galeri
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
