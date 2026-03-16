import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { agendaService } from '../../services/agendaService';
import { Agenda } from '../../database/db';
import { Plus, MagnifyingGlass, PencilSimple, Trash, CalendarBlank, Users, CheckCircle, FileText, X, Image as ImageIcon, CircleNotch, ChartPieSlice, TrendUp } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { FileUpload } from '../../components/ui/FileUpload';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { formatRupiah } from '../../utils/currency';
import { getFullUrl } from '../../utils/url';

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
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                        {agenda.is_terlaksana ? 'Edit Laporan Kegiatan' : 'Buat Laporan Realisasi'}
                    </h4>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Catatan Laporan</label>
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
                            className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                        >
                            Batal
                        </button>
                        <button
                            onClick={() => handleSubmitReport(agenda.id)}
                            disabled={isUploading || !laporanText.trim()}
                            className={`px-6 py-2 bg-brand-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2 ${(isUploading || !laporanText.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-700 active:scale-95'}`}
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

export default function AgendaList() {
    const { currentTenant, currentScope } = useTenant();
    const [agendaList, setAgendaList] = useState<Agenda[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewPhotosModal, setViewPhotosModal] = useState<{ isOpen: boolean, photos: string[], judul: string }>({ isOpen: false, photos: [], judul: '' });
    const [laporanText, setLaporanText] = useState('');
    const [fotoDokumentasi, setFotoDokumentasi] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'list'>('summary');
    const navigate = useNavigate();


    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const data = await agendaService.getAll(currentTenant.id, currentScope);
            setAgendaList(data);
        } catch (error) {
            console.error("Failed to load agenda:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant, currentScope]);

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

    const filteredAgenda = (agendaList || []).filter(a =>
        a.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isPast = (dateStr: string) => new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-normal text-gray-900">Informasi Kegiatan</h1>
                    <p className="text-gray-500 mt-1">Jadwal kegiatan untuk scope <span className="font-normal text-brand-600">{currentScope}</span></p>
                </div>
                <HasPermission module="Agenda" action="Buat">
                    <button
                        onClick={() => navigate('/agenda/new')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-normal transition-all shadow-sm hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Buat Agenda Baru</span>
                    </button>
                </HasPermission>
            </div>

            <div className="flex space-x-2 border-b border-gray-100 pb-1">
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-5 py-3 font-normal text-sm tracking-wide transition-all border-b-2 ${activeTab === 'summary' ? 'text-brand-600 border-brand-600 bg-brand-50/50 rounded-t-xl' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50 rounded-t-xl'}`}
                >
                    Dashboard Monitor
                </button>
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-5 py-3 font-normal text-sm tracking-wide transition-all border-b-2 ${activeTab === 'list' ? 'text-brand-600 border-brand-600 bg-brand-50/50 rounded-t-xl' : 'text-slate-400 border-transparent hover:text-slate-600 hover:bg-slate-50 rounded-t-xl'}`}
                >
                    Log Aktivitas
                </button>
            </div>

            {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* TOTAL AGENDA */}
                        <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <p className="text-[11px] font-black text-gray-500 tracking-wider leading-none uppercase mb-1.5">Cakupan Kegiatan</p>
                                <p className="text-3xl font-black text-slate-900 leading-none tabular-nums">{totalAgenda}</p>
                                <p className="text-[9px] font-semibold text-slate-400 mt-1.5 italic">Total Kegiatan</p>
                            </div>
                        </div>

                        {/* TEREALISASI */}
                        <div className="bg-emerald-600 py-3 px-4 rounded-xl border border-emerald-500 shadow-md relative overflow-hidden group hover:bg-emerald-700 transition-all duration-300">
                            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full blur-2xl" />
                            <div className="relative z-10 flex flex-col items-center text-center text-white">
                                <p className="text-[11px] font-black text-white/80 tracking-wider leading-none uppercase mb-1.5">Terealisasi</p>
                                <p className="text-3xl font-black text-white leading-none tabular-nums">{realizedAgenda}</p>
                                <div className="flex items-center gap-1 text-[9px] font-semibold text-white/70 mt-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                    Sudah Dilaksanakan
                                </div>
                            </div>
                        </div>

                        {/* MENUNGGU LAPORAN */}
                        <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-amber-400">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <p className="text-[11px] font-black text-gray-500 tracking-wider leading-none uppercase mb-1.5">Menunggu Laporan</p>
                                <p className="text-3xl font-black text-slate-900 leading-none tabular-nums">{pendingAgenda}</p>
                                <p className="text-[9px] font-semibold text-amber-400 mt-1.5 italic">Butuh Dokumentasi</p>
                            </div>
                        </div>

                        {/* TOTAL BUDGET */}
                        <div className="bg-white py-3 px-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 hover:shadow-md border-l-4 border-l-slate-300">
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <p className="text-[11px] font-black text-gray-500 tracking-wider leading-none uppercase mb-1.5">Estimasi Anggaran</p>
                                <p className="text-lg font-black text-slate-900 leading-none truncate tabular-nums">{formatRupiah(totalPendanaan)}</p>
                                <p className="text-[9px] font-semibold text-slate-400 mt-1.5 italic">Estimasi Biaya</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                <ChartPieSlice weight="duotone" className="w-6 h-6 text-brand-500" />
                                <h3 className="text-sm font-black tracking-tight text-slate-700">Status Realisasi</h3>
                            </div>
                            <div className="h-[250px] w-full">
                                {statusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
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
                                                {statusData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => [`${value} Agenda`, 'Total']} />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-300 text-xs font-normal capitalize tracking-widest">Belum ada data status</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                <TrendUp weight="duotone" className="w-6 h-6 text-emerald-500" />
                                <h3 className="text-sm font-black tracking-tight text-slate-700">Alokasi Pendanaan</h3>
                            </div>
                            <div className="h-[250px] w-full">
                                {fundingData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={fundingData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} tickFormatter={(value) => formatRupiah(value)} width={80} />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                                                formatter={(value: any) => [formatRupiah(Number(value)), 'Total Dana']}
                                            />
                                            <Bar dataKey="Total" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-300 text-xs font-normal capitalize tracking-widest">Belum ada data pendanaan</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'list' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
                        <div className="relative w-full md:w-80">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Cari informasi kegiatan..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all text-sm bg-white"
                            />
                        </div>
                    </div>

                    {/* DESKTOP VIEW: TABLE */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                <tr>
                                    <th className="p-4 w-24 text-center">Tanggal</th>
                                    <th className="p-4">Agenda & Deskripsi</th>
                                    <th className="p-4 w-48 text-right">Budget & Peserta</th>
                                    <th className="p-4 w-32 text-center">Status</th>
                                    <th className="p-4 w-32 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-slate-400 font-black text-[10px] capitalize tracking-widest animate-pulse">
                                            <div className="flex flex-col items-center gap-4">
                                                <CircleNotch weight="bold" className="w-10 h-10 animate-spin text-brand-500" />
                                                Sinkronisasi Informasi...
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
                                                <p className="text-lg font-black text-slate-900 capitalize tracking-tight">Belum Ada Informasi Kegiatan</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAgenda.map((agenda) => {
                                        const past = isPast(agenda.tanggal);
                                        const isRealized = agenda.is_terlaksana;

                                        return (
                                            <React.Fragment key={agenda.id}>
                                                <tr className={`hover:bg-brand-50/20 transition-colors group ${expandedId === agenda.id ? 'bg-brand-50/40' : ''}`}>
                                                    <td className="p-4 text-center">
                                                        <div className={`w-12 h-12 mx-auto rounded-xl flex flex-col items-center justify-center border shrink-0 ${past ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-brand-50 border-brand-100 text-brand-600'} shadow-sm`}>
                                                            <span className="text-base font-black leading-none">{new Date(agenda.tanggal).getDate()}</span>
                                                            <span className="text-[8px] font-black uppercase tracking-widest">{new Date(agenda.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 min-w-0">
                                                        <h3 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-brand-700 transition-colors truncate">{agenda.judul}</h3>
                                                        <p className="text-xs text-gray-500 line-clamp-1 mt-1 font-normal">{agenda.deskripsi}</p>
                                                        {isRealized && agenda.laporan_kegiatan && !expandedId && (
                                                            <div className="mt-2 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1.5 w-fit">
                                                                <CheckCircle weight="fill" className="w-3 h-3" />
                                                                <span className="font-bold truncate max-w-md">Laporan: {agenda.laporan_kegiatan}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        {agenda.butuh_pendanaan ? (
                                                            <div className="text-sm font-black text-slate-900">{formatRupiah(agenda.nominal_biaya || 0)}</div>
                                                        ) : (
                                                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Tanpa Budget</div>
                                                        )}
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{(agenda.peserta_ids?.length || 0)} Peserta</div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {isRealized ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-widest">Terlaksana</span>
                                                        ) : past ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest whitespace-nowrap">Menunggu Laporan</span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">Terjadwal</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                    <div className="flex flex-wrap items-center justify-end gap-2 pr-2">
                                                        {past && !isRealized ? (
                                                            <HasPermission module="Agenda" action="Ubah">
                                                                <button
                                                                    onClick={() => handleToggleExpand(agenda)}
                                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap border shadow-sm ${
                                                                        expandedId === agenda.id 
                                                                        ? 'bg-slate-900 text-white border-slate-900' 
                                                                        : 'bg-white text-amber-600 border-amber-100 hover:bg-amber-50 hover:border-amber-200 hover:shadow-brand-500/10'
                                                                    }`}
                                                                >
                                                                    <FileText weight={expandedId === agenda.id ? "fill" : "bold"} className={`w-4 h-4 ${expandedId === agenda.id ? 'text-white' : 'text-amber-500'}`} />
                                                                    {expandedId === agenda.id ? 'Tutup' : 'Isi Laporan'}
                                                                </button>
                                                            </HasPermission>
                                                        ) : isRealized ? (
                                                            <HasPermission module="Agenda" action="Ubah">
                                                                <button
                                                                    onClick={() => handleToggleExpand(agenda)}
                                                                    className={`p-2 rounded-xl border transition-all shadow-sm ${expandedId === agenda.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200'}`}
                                                                    title="Laporan"
                                                                >
                                                                    <FileText weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                        ) : null}
                                                        <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                                            {isRealized && agenda.foto_dokumentasi && agenda.foto_dokumentasi.length > 0 && (
                                                                <button
                                                                    onClick={() => setViewPhotosModal({ isOpen: true, photos: agenda.foto_dokumentasi, judul: agenda.judul })}
                                                                    className="p-1.5 text-brand-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                                    title="Lihat Foto"
                                                                >
                                                                    <ImageIcon weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <HasPermission module="Agenda" action="Ubah">
                                                                <button
                                                                    onClick={() => navigate(`/agenda/edit/${agenda.id}`)}
                                                                    className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                                    title="Edit Agenda"
                                                                >
                                                                    <PencilSimple weight="bold" className="w-4 h-4" />
                                                                </button>
                                                            </HasPermission>
                                                            <HasPermission module="Agenda" action="Hapus">
                                                                <button
                                                                    onClick={() => handleDelete(agenda.id, agenda.judul)}
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
                                                        <td colSpan={5} className="p-0 border-b border-slate-100 shadow-inner">
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

                    {/* MOBILE VIEW: CARDS */}
                    <div className="lg:hidden space-y-4 p-4 bg-slate-50">
                        {isLoading ? (
                            <div className="text-center py-12 text-slate-400 font-bold text-xs animate-pulse uppercase tracking-widest">Syncing Data...</div>
                        ) : filteredAgenda.length === 0 ? (
                            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center">
                                <CalendarBlank weight="duotone" className="w-10 h-10 text-slate-200 mb-2" />
                                <p className="text-[10px] font-black capitalize tracking-widest text-slate-400">Belum Ada Informasi Kegiatan</p>
                            </div>
                        ) : (
                            filteredAgenda.map((agenda) => {
                                const past = isPast(agenda.tanggal);
                                const isRealized = agenda.is_terlaksana;
                                return (
                                    <div key={agenda.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col transition-all ${expandedId === agenda.id ? 'border-brand-500 ring-2 ring-brand-500/5' : 'border-slate-200 hover:border-brand-300'}`}>
                                        <div className="p-4 flex gap-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border ${past ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-brand-50 border-brand-100 text-brand-600'}`}>
                                                            <span className="text-sm font-black leading-none">{new Date(agenda.tanggal).getDate()}</span>
                                                            <span className="text-[7px] font-black uppercase">{new Date(agenda.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-1">{agenda.judul}</h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                {isRealized ? (
                                                                    <span className="text-[8px] font-black uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100">Terlaksana</span>
                                                                ) : past ? (
                                                                    <span className="text-[8px] font-black uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">Menunggu Laporan</span>
                                                                ) : (
                                                                    <span className="text-[8px] font-black uppercase bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">Terjadwal</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {agenda.butuh_pendanaan && (
                                                        <div className="text-right">
                                                            <div className="text-sm font-black text-brand-600">{formatRupiah(agenda.nominal_biaya || 0)}</div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{agenda.sumber_dana}</div>
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-xs font-normal text-gray-500 leading-relaxed line-clamp-2 mt-2">{agenda.deskripsi}</p>

                                                <div className="flex justify-between items-end mt-3">
                                                    <div className="flex items-center gap-4 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5">
                                                            <Users weight="bold" className="w-3.5 h-3.5" /> {agenda.peserta_ids?.length || 0}
                                                        </div>
                                                        {isRealized && agenda.foto_dokumentasi && agenda.foto_dokumentasi.length > 0 && (
                                                            <div className="flex items-center gap-1.5 text-brand-600">
                                                                <ImageIcon weight="bold" className="w-3.5 h-3.5" /> {agenda.foto_dokumentasi.length} Foto
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Cakupan <span className="text-brand-600">Agenda {currentScope}</span></p>
                                                        <p className="text-xs font-bold text-slate-700">{new Date(agenda.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {expandedId === agenda.id && (
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

                                        <div className="bg-slate-50 border-t border-slate-100 p-2 flex justify-end items-center gap-2">
                                            {past && !isRealized ? (
                                                <button
                                                    onClick={() => handleToggleExpand(agenda)}
                                                    className={`px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 text-[11px] font-bold shadow-sm active:scale-95 ${
                                                        expandedId === agenda.id 
                                                        ? 'bg-slate-900 text-white border-slate-900' 
                                                        : 'bg-white text-amber-600 border-amber-100 hover:bg-amber-50'
                                                    }`}
                                                >
                                                    <FileText weight={expandedId === agenda.id ? "fill" : "bold"} className={`w-3.5 h-3.5 ${expandedId === agenda.id ? 'text-white' : 'text-amber-500'}`} />
                                                    {expandedId === agenda.id ? 'Tutup' : 'Isi Laporan'}
                                                </button>
                                            ) : isRealized ? (
                                                <button
                                                    onClick={() => handleToggleExpand(agenda)}
                                                    className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border ${expandedId === agenda.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-emerald-100 text-emerald-600'}`}
                                                >
                                                    Laporan
                                                </button>
                                            ) : null}
                                            {isRealized && agenda.foto_dokumentasi && agenda.foto_dokumentasi.length > 0 && (
                                                <button
                                                    onClick={() => setViewPhotosModal({ isOpen: true, photos: agenda.foto_dokumentasi, judul: agenda.judul })}
                                                    className="p-2 text-brand-600 bg-white border border-brand-100 hover:bg-brand-50 rounded-lg transition-all"
                                                >
                                                    <ImageIcon weight="bold" className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => navigate(`/agenda/edit/${agenda.id}`)}
                                                className="p-2 text-blue-600 bg-white border border-blue-100 hover:bg-blue-50 rounded-lg transition-all"
                                            >
                                                <PencilSimple weight="bold" className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(agenda.id, agenda.judul)}
                                                className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-100 hover:border-red-200 hover:bg-red-50/50 rounded-lg transition-all"
                                            >
                                                <Trash weight="bold" className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* END MAIN CONTENT */}
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
