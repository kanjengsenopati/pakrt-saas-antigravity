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
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="page-title">Aduan & Usulan Warga</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium tracking-tight">Media aspirasi dan pelaporan masalah lingkungan</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => navigate('/aduan/new')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover-lift"
                    >
                        <Plus weight="bold" />
                        <span>Kirim Aspirasi</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats & Tabs */}
            <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-brand-500 text-center transition-all hover:shadow-md">
                        <p className="text-[11px] font-medium text-slate-500 capitalize tracking-tight mb-1">Total Masuk</p>
                        <p className="text-2xl font-medium text-slate-900">{stats?.total || 0}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500 text-center transition-all hover:shadow-md">
                        <p className="text-[11px] font-medium text-slate-500 capitalize tracking-tight mb-1">Menunggu</p>
                        <p className="text-2xl font-medium text-slate-900">{stats?.pending || 0}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-blue-500 text-center transition-all hover:shadow-md">
                        <p className="text-[11px] font-medium text-slate-500 capitalize tracking-tight mb-1">Diproses</p>
                        <p className="text-2xl font-medium text-slate-900">{stats?.processing || 0}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm border-l-4 border-l-brand-600 text-center transition-all hover:shadow-md">
                        <p className="text-[11px] font-medium text-slate-500 capitalize tracking-tight mb-1">Selesai</p>
                        <p className="text-2xl font-medium text-slate-900">{stats?.completed || 0}</p>
                    </div>
                </div>

                <div className="flex bg-slate-100/50 p-1 rounded-xl w-fit self-center md:self-start border border-slate-200">
                    <button 
                        onClick={() => setViewTab('list')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewTab === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users weight="bold" /> Daftar Aspirasi
                    </button>
                    <button 
                        onClick={() => setViewTab('dashboard')}
                        className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewTab === 'dashboard' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ChartPie weight="bold" /> Analisis Data
                    </button>
                </div>
            </div>

            {viewTab === 'dashboard' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ChartBar weight="duotone" className="text-brand-500" /> Komposisi Tipe
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="total" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <ChartPie weight="duotone" className="text-brand-500" /> Status Penyelesaian
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 pb-2 overflow-x-auto no-scrollbar">
                        <select 
                            value={filterTipe}
                            onChange={(e) => setFilterTipe(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-600"
                        >
                            <option value="all">Semua Tipe</option>
                            <option value="Aduan">Aduan</option>
                            <option value="Usulan">Usulan</option>
                        </select>
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 transition-all text-slate-600"
                        >
                            <option value="all">Semua Status</option>
                            <option value="Menunggu">Menunggu</option>
                            <option value="Proses">Diproses</option>
                            <option value="Selesai">Selesai</option>
                        </select>
                    </div>

                    {/* List */}
                    <div className="grid grid-cols-1 gap-4">
                        {isLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-3 text-slate-400">
                                <CircleNotch weight="bold" className="w-8 h-8 animate-spin text-brand-500" />
                                <span className="text-xs font-bold uppercase tracking-widest">Sinkronisasi Data...</span>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                                <ChatDots weight="duotone" className="w-12 h-12 text-slate-300" />
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Belum Ada Aspirasi</p>
                                    <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Aspirasi atau aduan yang masuk akan muncul di sini</p>
                                </div>
                            </div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col md:flex-row">
                                    <div className={`w-full md:w-2 ${item.status === 'Menunggu' ? 'bg-amber-500' : item.status === 'Proses' ? 'bg-blue-500' : 'bg-brand-600'}`} />
                                    <div className="p-5 flex-1 space-y-4">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${item.tipe === 'Aduan' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'}`}>
                                                    {item.tipe === 'Aduan' ? <ChatTeardropDots weight="fill" className="w-5 h-5" /> : <Lightbulb weight="fill" className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{item.judul}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.tipe}</span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <span className="text-[10px] font-medium text-slate-400">{dateUtils.toDisplay(item.tanggal)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${
                                                    item.status === 'Menunggu' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    item.status === 'Proses' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-brand-50 text-brand-600 border-brand-100'
                                                }`}>
                                                    {item.status === 'Menunggu' ? <Clock weight="bold" /> : item.status === 'Proses' ? <ArrowRight weight="bold" /> : <CheckCircle weight="fill" />}
                                                    {item.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs text-slate-600 leading-relaxed">{item.deskripsi}</p>
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2 gap-4">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-600">
                                                    {(item.is_anonymous && !isPengurus) ? '?' : item.warga?.nama?.[0] || '?'}
                                                </div>
                                                <span className="text-[11px] font-bold italic">
                                                    {(item.is_anonymous && !isPengurus) ? 'Warga (Anonim)' : item.warga?.nama || 'Anonim'}
                                                    {item.is_anonymous && isPengurus && <span className="ml-1 text-[9px] text-amber-500 font-black tracking-widest">(PRIVASI)</span>}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                <button 
                                                    onClick={() => setSelectedItem(item)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all shadow-sm"
                                                >
                                                    <Eye weight="bold" /> Detail
                                                </button>
                                                {isPengurus && item.tipe === 'Usulan' && item.status !== 'Selesai' && !item.polling && (
                                                    <button 
                                                        onClick={() => navigate(`/aduan/polling/new/${item.id}`)}
                                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 bg-brand-50 text-brand-600 border border-brand-100 rounded-lg text-xs font-bold hover:bg-brand-100 transition-all shadow-sm"
                                                    >
                                                        <ChartPie weight="bold" /> Buat Polling
                                                    </button>
                                                )}
                                                <HasPermission module="Aduan & Usulan" action="Hapus">
                                                    <button 
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-lg transition-all"
                                                    >
                                                        <Trash weight="bold" />
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${selectedItem.tipe === 'Aduan' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600'}`}>
                                    {selectedItem.tipe === 'Aduan' ? <ChatTeardropDots weight="fill" className="w-5 h-5" /> : <Lightbulb weight="fill" className="w-5 h-5" />}
                                </div>
                                <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Detail Aspirasi</h3>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                                <X weight="bold" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Judul</h4>
                                <p className="text-sm font-bold text-slate-800">{selectedItem.judul}</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi</h4>
                                <p className="text-xs text-slate-600 leading-relaxed">{selectedItem.deskripsi}</p>
                            </div>

                            {selectedItem.foto_url && (
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lampiran Foto</h4>
                                    <img src={selectedItem.foto_url} alt="Lampiran" className="w-full rounded-xl border border-slate-100 shadow-sm" />
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggapan Pengurus</h4>
                                {isPengurus && selectedItem.status !== 'Selesai' ? (
                                    <div className="space-y-3">
                                        <textarea 
                                            value={tanggapanText}
                                            onChange={(e) => setTanggapanText(e.target.value)}
                                            placeholder="Tulis tanggapan atau solusi..."
                                            rows={4}
                                            className="w-full rounded-xl border border-slate-200 p-4 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                                        />
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedItem.id, 'Proses')}
                                                disabled={isUpdating}
                                                className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 disabled:opacity-50"
                                            >
                                                Mulai Proses
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStatus(selectedItem.id, 'Selesai')}
                                                disabled={isUpdating || !tanggapanText}
                                                className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 disabled:opacity-50"
                                            >
                                                Selesaikan
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-xs text-slate-600 italic leading-relaxed">
                                            {selectedItem.tanggapan || 'Belum ada tanggapan dari pengurus.'}
                                        </p>
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
