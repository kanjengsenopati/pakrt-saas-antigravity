import { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { aduanService, AduanUsulan } from '../../services/aduanService';

import { 
    Plus, 
    ChatTeardropDots, 
    Lightbulb, 
    Eye, 
    Trash, 
    ChartBar,
    ChartPie,
    Users,
    X,
    CircleNotch,
    ChatDots,
    Clock,
    ArrowRight,
    CheckCircle
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
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                <div>
                    <Text.H1>Informasi Aduan & Usulan</Text.H1>
                    <Text.Body className="mt-1">Media aspirasi dan pelaporan masalah lingkungan</Text.Body>
                </div>
                {(!authUser?.role?.toLowerCase().includes('warga')) && (
                    <HasPermission module="Aduan & Usulan" action="Buat">
                        <button
                            onClick={() => navigate('/aduan/new')}
                            className="hidden md:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                        >
                            <Plus weight="bold" size={18} />
                            <Text.Body component="span" className="!text-inherit !font-bold">Kirim Aspirasi</Text.Body>
                        </button>
                    </HasPermission>
                )}
                <button
                    onClick={() => navigate('/aduan/new')}
                    className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                >
                    <Plus weight="bold" size={24} />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 -mt-2">
                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-200 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
                    <Text.Label className="mb-1 flex items-center justify-center gap-2">
                        <ChartBar weight="bold" className="text-slate-400 w-3.5 h-3.5" />
                        Aspirasi
                    </Text.Label>
                    <Text.Amount className="!text-3xl lg:!text-4xl text-slate-900 leading-none">{stats?.total || 0}</Text.Amount>
                </div>

                <div className="bg-slate-900 p-4 rounded-[24px] border border-slate-800 shadow-xl relative overflow-hidden group hover:bg-slate-950 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <Text.Label className="mb-1 flex items-center justify-center gap-2 text-white/50">
                        <CheckCircle weight="fill" className="text-brand-500 w-3.5 h-3.5" />
                        Selesai
                    </Text.Label>
                    <Text.Amount className="!text-3xl lg:!text-4xl text-white leading-none">{stats?.completed || 0}</Text.Amount>
                </div>

                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                    <Text.Label className="mb-1 flex items-center justify-center gap-2">
                        <Clock weight="bold" className="text-amber-500 w-3.5 h-3.5" />
                        Menunggu
                    </Text.Label>
                    <Text.Amount className="!text-3xl lg:!text-4xl text-amber-600 leading-none">{stats?.pending || 0}</Text.Amount>
                </div>

                <div className="bg-white p-4 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all duration-300 flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <Text.Label className="mb-1 flex items-center justify-center gap-2">
                        <ArrowRight weight="bold" className="text-blue-500 w-3.5 h-3.5" />
                        Proses
                    </Text.Label>
                    <Text.Amount className="!text-3xl lg:!text-4xl text-blue-600 leading-none">{stats?.processing || 0}</Text.Amount>
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
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                    <div className="bg-white rounded-[24px] shadow-premium border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {isLoading ? (
                            <div className="py-24 text-center flex flex-col items-center gap-4">
                                <CircleNotch weight="bold" className="w-8 h-8 animate-spin text-brand-600" />
                                <Text.Caption className="font-bold tracking-widest">Sinkronisasi Data...</Text.Caption>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="p-24 text-center flex flex-col items-center gap-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-[20px] flex items-center justify-center border-2 border-dashed border-slate-100">
                                    <ChatDots weight="duotone" className="w-10 h-10 text-slate-200" />
                                </div>
                                <Text.H2>Belum Ada Aspirasi</Text.H2>
                            </div>
                        ) : (
                            items
                                .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
                                .map((item) => (
                                    <div key={item.id} className="group">
                                        <div 
                                            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                            className={`p-5 transition-all duration-300 active:bg-slate-100 cursor-pointer ${expandedId === item.id ? 'bg-slate-50/80 shadow-inner' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex gap-4 min-w-0">
                                                    <div className={`w-12 h-12 rounded-[16px] shrink-0 flex flex-col items-center justify-center border shadow-sm ${item.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' : item.status === 'Proses' ? 'bg-blue-50 text-blue-600 border-blue-100/50' : 'bg-amber-50 text-amber-600 border-amber-100/50'}`}>
                                                        <Text.Label className="!text-[9px] !font-bold !leading-none opacity-60">{new Date(item.tanggal).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}</Text.Label>
                                                        <Text.Amount className="!text-lg !font-bold !leading-none mt-0.5">{new Date(item.tanggal).getDate()}</Text.Amount>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Text.Label className={`px-2 py-0.5 rounded-md !text-white ${
                                                                item.status === 'Menunggu' ? 'bg-amber-600' :
                                                                item.status === 'Proses' ? 'bg-blue-600' :
                                                                'bg-emerald-600'
                                                            }`}>
                                                                {item.status}
                                                            </Text.Label>
                                                            <Text.Caption>
                                                                {item.is_anonymous ? 'Anonim' : (item.warga?.nama?.toUpperCase() || 'WARGA')}
                                                            </Text.Caption>
                                                        </div>
                                                        <Text.H2 className="line-clamp-1 !text-slate-900 !leading-snug">{item.judul}</Text.H2>
                                                        <Text.Body className="!text-[12px] line-clamp-1 mt-0.5">{item.tipe} — {item.deskripsi}</Text.Body>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0 gap-1.5 pt-1">
                                                    <div className={`p-2 rounded-lg border transition-all ${item.tipe === 'Aduan' ? 'bg-rose-50 text-rose-500 border-rose-100/50' : 'bg-brand-50 text-brand-500 border-brand-100/50'}`}>
                                                        {item.tipe === 'Aduan' ? <ChatTeardropDots weight="bold" className="w-4 h-4" /> : <Lightbulb weight="bold" className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedId === item.id && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <div className="space-y-4 text-left">
                                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                                            <Text.Caption className="!text-[10px] !font-bold tracking-tight text-slate-400 mb-1 block">Detail Permasalahan</Text.Caption>
                                                            <Text.Body className="!text-sm !font-medium !text-slate-700 !leading-relaxed">{item.deskripsi}</Text.Body>
                                                        </div>
                                                         {item.tanggapan ? (
                                                            <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                                                                <Text.Caption className="!text-[10px] !font-bold tracking-tight text-blue-600 mb-1 block">Tanggapan Pengurus</Text.Caption>
                                                                <Text.Body className="!text-sm !font-bold italic !text-blue-800 !leading-relaxed">"{item.tanggapan}"</Text.Body>
                                                            </div>
                                                        ) : (
                                                            <div className="bg-rose-50/30 rounded-2xl p-4 border border-rose-100/50 border-dashed">
                                                                <Text.Caption className="!font-medium !italic !text-rose-400">Belum ada tanggapan resmi dari pengurus.</Text.Caption>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-2 pt-2">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-[11px] font-bold shadow-sm"
                                                            >
                                                                <Eye weight="bold" className="w-3.5 h-3.5" />
                                                                <Text.Body component="span" className="!text-inherit !font-bold !text-[11px]">Lihat Panel Kendali</Text.Body>
                                                            </button>
                                                            {isPengurus && (
                                                                <HasPermission module="Aduan & Usulan" action="Hapus">
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                                        className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-xl transition-all"
                                                                    >
                                                                        <Trash weight="bold" className="w-4 h-4" />
                                                                    </button>
                                                                </HasPermission>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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
                                    <Text.Label className="!text-slate-900">Tanggapan Pengurus</Text.Label>
                                    <Text.Label className={`px-2.5 py-1 rounded-full border ${
                                        selectedItem.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                        selectedItem.status === 'Proses' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-brand-50 text-brand-600 border-brand-100'
                                    }`}>
                                        {selectedItem.status}
                                    </Text.Label>
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
