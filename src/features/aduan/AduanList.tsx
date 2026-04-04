import { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { aduanService, AduanUsulan } from '../../services/aduanService';
import { dateUtils } from '../../utils/date';
import { 
    Plus, 
    ChatTeardropDots, 
    Lightbulb, 
    CheckCircle, 
    Clock, 
    Eye, 
    Trash, 
    ArrowRight,
    ChartBar,
    ChartPie,
    Users,
    X,
    CircleNotch,
    ChatDots
} from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
import { HasPermission } from '../../components/auth/HasPermission';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
    'Menunggu': '#f59e0b',
    'Proses': '#3b82f6',
    'Selesai': '#2563eb'
};

const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default function AduanList() {
    const { currentTenant, currentScope } = useTenant();
    const { user: authUser } = useAuth();
    const navigate = useNavigate();

    const [items, setItems] = useState<AduanUsulan[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<AduanUsulan['status'] | 'all'>('all');
    const [filterTipe, setFilterTipe] = useState<string>('all');
    const [viewTab, setViewTab] = useState<'list' | 'dashboard'>('list');
    const [selectedItem, setSelectedItem] = useState<AduanUsulan | null>(null);
    const [tanggapanText, setTanggapanText] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const isPengurus = authUser?.role?.toLowerCase() !== 'warga';

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const [data, statsData] = await Promise.all([
                aduanService.getAll({ 
                    scope: currentScope,
                    status: filterStatus === 'all' ? undefined : (filterStatus as AduanUsulan['status']),
                    tipe: filterTipe === 'all' ? undefined : filterTipe
                }),
                aduanService.getStats(currentScope)
            ]);
            setItems(data.items);
            setStats(statsData);
        } catch (error) {
            console.error("Failed to load aduan:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant, currentScope, filterStatus, filterTipe]);

    const handleUpdateStatus = async (id: string, status: AduanUsulan['status']) => {
        setIsUpdating(true);
        try {
            await aduanService.update(id, { status, tanggapan: tanggapanText });
            setSelectedItem(null);
            setTanggapanText('');
            loadData();
        } catch (error) {
            alert("Gagal memperbarui status.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Hapus data ini?")) {
            await aduanService.delete(id);
            loadData();
        }
    };

    const barData = stats?.byType?.map((t: any) => ({
        name: t.tipe,
        total: t._count
    })) || [];

    const pieData = [
        { name: 'Menunggu', value: stats?.pending || 0, color: STATUS_COLORS['Menunggu'] },
        { name: 'Proses', value: stats?.processing || 0, color: STATUS_COLORS['Proses'] },
        { name: 'Selesai', value: stats?.completed || 0, color: STATUS_COLORS['Selesai'] },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-fade-in px-5 md:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Text.H1>Aduan & Usulan Warga</Text.H1>
                    <Text.Body className="mt-1">Media aspirasi dan pelaporan masalah lingkungan</Text.Body>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/aduan/new')}
                        className="hidden md:flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] text-sm font-semibold transition-all shadow-premium hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Kirim Aspirasi</span>
                    </button>
                    
                    {/* MOBILE FAB */}
                    <button
                        onClick={() => navigate('/aduan/new')}
                        className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-2">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-400" />
                    <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                        <ChartBar weight="duotone" className="text-slate-400 w-4 h-4" />
                        Total Aspirasi
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 tracking-tight tabular-nums">{stats?.total || 0}</span>
                        <span className="text-[11px] font-bold text-slate-400">Data</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                    <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                        <Clock weight="duotone" className="text-amber-500 w-4 h-4" />
                        Menunggu Antrian
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-amber-600 tracking-tight tabular-nums">{stats?.pending || 0}</span>
                        <span className="text-[11px] font-bold text-slate-400">Antrian</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                    <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                        <ArrowRight weight="duotone" className="text-blue-500 w-4 h-4" />
                        Sedang Diproses
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-blue-600 tracking-tight tabular-nums">{stats?.processing || 0}</span>
                        <span className="text-[11px] font-bold text-slate-400">Aktif</span>
                    </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:bg-slate-950 transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <p className="text-[10px] font-black text-slate-400 titlecase tracking-[0.05em] mb-1.5 flex items-center gap-2">
                        <CheckCircle weight="duotone" className="text-brand-400 w-4 h-4" />
                        Sudah Selesai
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white tracking-tight tabular-nums">{stats?.completed || 0}</span>
                        <span className="text-[11px] font-bold text-slate-500">Tuntas</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100/50 p-1.5 rounded-xl w-full md:w-fit border border-slate-100 shadow-sm">
                <button 
                    onClick={() => setViewTab('list')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewTab === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Users weight="bold" /> Daftar Aspirasi
                </button>
                <button 
                    onClick={() => setViewTab('dashboard')}
                    className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${viewTab === 'dashboard' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ChartPie weight="bold" /> Analisis Data
                </button>
            </div>

            {viewTab === 'dashboard' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-8 rounded-[20px] border border-slate-100 shadow-premium">
                        <div className="flex items-center gap-2 mb-8">
                            <ChartBar weight="duotone" className="text-brand-500 w-5 h-5" />
                            <Text.Label className="!text-slate-900 !tracking-normal">Komposisi Tipe</Text.Label>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[20px] border border-slate-100 shadow-premium">
                        <div className="flex items-center gap-2 mb-8">
                            <ChartPie weight="duotone" className="text-brand-500 w-5 h-5" />
                            <Text.Label className="!text-slate-900 !tracking-normal">Status Penyelesaian</Text.Label>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 pb-2 overflow-x-auto no-scrollbar">
                        <select 
                            value={filterTipe}
                            onChange={(e) => setFilterTipe(e.target.value)}
                            className="bg-white border border-slate-200 rounded-[12px] px-5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-700 shadow-sm"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="Aduan">Aduan</option>
                            <option value="Usulan">Usulan</option>
                        </select>
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-xl px-5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-slate-700 shadow-sm"
                        >
                            <option value="all">Semua Status</option>
                            <option value="Menunggu">Menunggu</option>
                            <option value="Proses">Diproses</option>
                            <option value="Selesai">Selesai</option>
                        </select>
                    </div>

                    {/* List */}
                    <div className="grid grid-cols-1 gap-5">
                        {isLoading ? (
                            <div className="py-24 text-center flex flex-col items-center gap-4">
                                <CircleNotch weight="bold" className="w-8 h-8 animate-spin text-brand-600" />
                                <Text.Caption className="font-bold uppercase tracking-widest">Sinkronisasi Data...</Text.Caption>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[20px] p-24 text-center flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-[20px] flex items-center justify-center">
                                    <ChatDots weight="duotone" className="w-10 h-10 text-slate-200" />
                                </div>
                                <div className="space-y-1">
                                    <Text.H2>Belum Ada Aspirasi</Text.H2>
                                    <Text.Caption className="font-medium italic">Semua aspirasi atau aduan akan muncul di sini</Text.Caption>
                                </div>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="bg-white rounded-[20px] border border-slate-100 shadow-premium hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row group border-l-[6px] border-l-transparent" style={{ borderLeftColor: item.status === 'Menunggu' ? '#f59e0b' : item.status === 'Proses' ? '#3b82f6' : '#2563eb' }}>
                                    <div className="p-6 flex-1 space-y-5">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-[16px] border ${item.tipe === 'Aduan' ? 'bg-rose-50 text-rose-600 border-rose-100/50' : 'bg-brand-50 text-brand-600 border-brand-100/50'} shadow-sm`}>
                                                    {item.tipe === 'Aduan' ? <ChatTeardropDots weight="fill" className="w-6 h-6" /> : <Lightbulb weight="fill" className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <Text.H2 className="!font-bold leading-tight line-clamp-1">{item.judul}</Text.H2>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Text.Label className="!text-[9px] !text-slate-400">{item.tipe}</Text.Label>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <Text.Caption className="font-medium">{dateUtils.toDisplay(item.tanggal)}</Text.Caption>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 uppercase tracking-widest ${
                                                    item.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    item.status === 'Proses' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                    {item.status === 'Menunggu' ? <Clock weight="bold" /> : item.status === 'Proses' ? <ArrowRight weight="bold" /> : <CheckCircle weight="fill" />}
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-[16px] p-5 border border-slate-100 italic transition-colors hover:bg-slate-50">
                                            <Text.Body className="!text-slate-700 italic tracking-tight">{item.deskripsi}</Text.Body>
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 gap-5 border-t border-slate-50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-[10px] font-black text-brand-600 shadow-inner">
                                                    {(item.is_anonymous && !isPengurus) ? '?' : item.warga?.nama?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <Text.Caption className="!font-bold !text-slate-900 border-b border-transparent leading-none">
                                                        {(item.is_anonymous && !isPengurus) ? 'Warga (Anonim)' : toTitleCase(item.warga?.nama || 'Anonim')}
                                                    </Text.Caption>
                                                    {item.is_anonymous && isPengurus && <Text.Label className="!text-[8px] !text-amber-500 mt-1">Identitas Dirahasiakan</Text.Label>}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                <button 
                                                    onClick={() => setSelectedItem(item)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-white border border-slate-200 text-slate-800 rounded-[10px] text-xs font-bold hover:bg-slate-50 transition-all shadow-sm active-press hover:border-slate-300"
                                                >
                                                    <Eye weight="bold" /> Detail
                                                </button>
                                                {isPengurus && item.tipe === 'Usulan' && item.status !== 'Selesai' && !item.polling && (
                                                    <button 
                                                        onClick={() => navigate(`/aduan/polling/new/${item.id}`)}
                                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-brand-50 text-brand-600 border border-brand-100 rounded-[10px] text-xs font-bold hover:bg-brand-100 transition-all shadow-sm active-press"
                                                    >
                                                        <ChartPie weight="bold" /> Buat Polling
                                                    </button>
                                                )}
                                                <HasPermission module="Aduan & Usulan" action="Hapus">
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 rounded-[10px] transition-all hover:bg-red-50"
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
                </div>
            )}

            {/* Modal Detail / Response */}
            {selectedItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[24px] w-full max-w-xl shadow-2xl animate-zoom-in overflow-hidden border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-[12px] ${selectedItem.tipe === 'Aduan' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'} shadow-sm`}>
                                    {selectedItem.tipe === 'Aduan' ? <ChatTeardropDots weight="fill" className="w-6 h-6" /> : <Lightbulb weight="fill" className="w-6 h-6" />}
                                </div>
                                <Text.H2 className="!font-bold">Detail Aspirasi</Text.H2>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2.5 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors">
                                <X weight="bold" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar">
                            <div className="space-y-2">
                                <Text.Label className="!text-[9px]">Judul Aspirasi</Text.Label>
                                <Text.H2 className="!text-lg leading-tight">{selectedItem.judul}</Text.H2>
                            </div>
                            
                            <div className="space-y-2">
                                <Text.Label className="!text-[9px]">Uraian Lengkap</Text.Label>
                                <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-[16px]">
                                    <Text.Body className="!text-slate-700 italic leading-relaxed">{selectedItem.deskripsi}</Text.Body>
                                </div>
                            </div>

                            {selectedItem.foto_url && (
                                <div className="space-y-3">
                                    <Text.Label className="!text-[9px]">Lampiran Foto</Text.Label>
                                    <div className="p-1 bg-slate-50 border border-slate-100 rounded-[20px] shadow-inner overflow-hidden">
                                        <img src={selectedItem.foto_url} alt="Lampiran" className="w-full rounded-[18px] shadow-premium" />
                                    </div>
                                </div>
                            )}

                            <div className="pt-8 border-t border-slate-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <Text.Label className="!text-[9px] !text-slate-900">Tanggapan Pengurus</Text.Label>
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${
                                        selectedItem.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        selectedItem.status === 'Proses' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-brand-50 text-brand-600 border-brand-100'
                                    }`}>
                                        {selectedItem.status}
                                    </span>
                                </div>
                                
                                {isPengurus && selectedItem.status !== 'Selesai' ? (
                                    <div className="space-y-4">
                                        <textarea 
                                            value={tanggapanText}
                                            onChange={(e) => setTanggapanText(e.target.value)}
                                            placeholder="Tulis tanggapan resmi pengurus di sini..."
                                            rows={4}
                                            className="w-full rounded-[16px] border border-slate-200 p-5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
                                        />
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedItem.id, 'Proses')}
                                                disabled={isUpdating}
                                                className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-[12px] text-xs font-bold shadow-premium active-press disabled:opacity-50 transition-all"
                                            >
                                                Mulai Proses
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedItem.id, 'Selesai')}
                                                disabled={isUpdating || !tanggapanText}
                                                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-[12px] text-xs font-bold shadow-premium active-press disabled:opacity-50 transition-all"
                                            >
                                                Selesaikan
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-brand-50/50 p-6 rounded-[16px] border border-brand-100/50 relative overflow-hidden group transition-all hover:bg-brand-50">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <ChatDots weight="fill" className="w-12 h-12 text-brand-600" />
                                        </div>
                                        <Text.Body className="!text-brand-900 font-bold italic leading-relaxed relative z-10">
                                            {selectedItem.tanggapan || 'Belum ada tanggapan resmi dari pengurus.'}
                                        </Text.Body>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
