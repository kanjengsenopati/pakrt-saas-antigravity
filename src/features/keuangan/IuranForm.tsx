import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { iuranService } from '../../services/iuranService';
import { wargaService } from '../../services/wargaService';
import { pengaturanService } from '../../services/pengaturanService';
import { Warga } from '../../database/db';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { ArrowLeft, CheckCircle, ChartPieSlice, Users, CalendarBlank, CircleNotch, Warning, X, Clock, ShoppingCart, Trash, PlusCircle, Money, Receipt } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Text } from '../../components/ui/Typography';
import { formatRupiah } from '../../utils/currency';

interface CartItem {
    id: string; // unique key: category-month-year
    kategori: string;
    tipe: string;
    month: number;
    year: number;
    nominal: number;
    is_mandatory: boolean;
}

interface ManifestItem {
    nama: string;
    tipe: string;
    is_mandatory: boolean;
    rate: number;
    expectedTotal: number;
    totalPaid: number;
    pendingAmount: number;
    paidMonths: number[];
    pendingMonths: number[];
    sisa: number;
}

const MONTHS = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' }, { value: 4, label: 'Apr' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Agu' },
    { value: 9, label: 'Sep' }, { value: 10, label: 'Okt' },
    { value: 11, label: 'Nov' }, { value: 12, label: 'Des' }
];

export default function IuranForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const { currentTenant, currentScope } = useTenant();

    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [tahunOptions, setTahunOptions] = useState<number[]>([new Date().getFullYear()]);
    const [manifest, setManifest] = useState<ManifestItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [activeKategori, setActiveKategori] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const [paymentMode] = useState<'Pas' | 'Bebas'>('Pas');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoadingManifest, setIsLoadingManifest] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user: authUser } = useAuth();
    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';
    const loggedInWargaId = authUser?.id && isWarga ? (authUser as any).warga_id || authUser.id : null;

    const { register, handleSubmit, setValue, watch } = useForm({
        defaultValues: {
            tanggal_bayar: new Date().toISOString().split('T')[0],
            periode_tahun: new Date().getFullYear(),
            warga_id: loggedInWargaId || '',
            url_bukti: '',
            auto_verify: false
        }
    });

    const watchWargaId = watch('warga_id');
    const watchTahun = watch('periode_tahun');

    // Load initial data
    useEffect(() => {
        if (currentTenant) {
            wargaService.getAll(currentTenant.id, currentScope).then(data => setWargaList(data.items || []));
            pengaturanService.getAll(currentTenant.id, currentScope).then(items => {
                const config: Record<string, any> = {};
                items.forEach(item => { config[item.key] = item.value; });
                if (config.opsi_tahun_iuran) {
                    try {
                        const parsedTahun = JSON.parse(config.opsi_tahun_iuran);
                        if (Array.isArray(parsedTahun)) setTahunOptions(parsedTahun);
                    } catch (e) { console.error("Error parsing tahun config", e); }
                }
            });
        }
    }, [currentTenant, currentScope]);

    // Fetch manifest when citizen or year changes
    useEffect(() => {
        if (watchWargaId && watchTahun && currentTenant) {
            const fetchManifest = async () => {
                setIsLoadingManifest(true);
                try {
                    const result = await iuranService.getBillingSummary(
                        currentTenant.id,
                        watchWargaId,
                        watchTahun,
                        'SEMUA',
                        currentScope
                    );
                    if (result.type === 'MANIFEST') {
                        setManifest(result.items);
                        if (!activeKategori && result.items.length > 0) {
                            setActiveKategori(result.items[0].nama);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch manifest:", error);
                } finally {
                    setIsLoadingManifest(false);
                }
            };
            fetchManifest();
        }
    }, [watchWargaId, watchTahun, currentTenant, currentScope]);

    const activeManifestItem = useMemo(() => 
        manifest.find(m => m.nama === activeKategori), 
    [manifest, activeKategori]);

    const toggleCartItem = (category: string, month: number) => {
        const itemInManifest = manifest.find(m => m.nama === category);
        if (!itemInManifest) return;

        const itemId = `${category}-${month}-${watchTahun}`;
        const existingIndex = cart.findIndex(c => c.id === itemId);

        if (existingIndex > -1) {
            setCart(prev => prev.filter((_, i) => i !== existingIndex));
        } else {
            const newItem: CartItem = {
                id: itemId,
                kategori: category,
                tipe: itemInManifest.tipe,
                month,
                year: watchTahun,
                nominal: itemInManifest.rate,
                is_mandatory: itemInManifest.is_mandatory
            };
            setCart(prev => [...prev, newItem]);
        }
    };

    const updateCartItemNominal = (itemId: string, nominal: number) => {
        setCart(prev => prev.map(c => c.id === itemId ? { ...c, nominal } : c));
    };

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.nominal, 0), [cart]);

    const onProcessPayment = async (data: any) => {
        if (cart.length === 0) {
            setErrorMessage("Keranjang masih kosong.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const itemsToSubmit = cart.map(c => ({
                kategori: c.kategori,
                periode_bulan: [c.month],
                periode_tahun: c.year,
                nominal: c.nominal,
                warga_id: data.warga_id,
                _autoVerify: data.auto_verify,
                metadata: { mode: paymentMode }
            }));

            const commonData = {
                tenant_id: currentTenant!.id,
                scope: currentScope,
                tanggal_bayar: data.tanggal_bayar,
                url_bukti: data.url_bukti
            };

            await (iuranService as any).createBatch(itemsToSubmit, commonData);
            navigate('/iuran');
        } catch (error: any) {
            setErrorMessage(error.response?.data?.error || "Gagal memproses pembayaran batch.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* HUB HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/iuran')}
                        className="p-3 hover:bg-white bg-slate-50 text-slate-500 hover:text-slate-900 rounded-2xl transition-all border border-slate-200"
                    >
                        <ArrowLeft weight="bold" className="w-5 h-5" />
                    </button>
                    <div>
                        <Text.H1 className="!text-slate-900 !tracking-tight">Flexible Iuran Checkout Hub</Text.H1>
                        <Text.Body className="mt-0.5 !text-slate-500">Kelola dan bayar berbagai tagihan warga dalam satu transaksi.</Text.Body>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-[24px] shadow-premium border border-slate-100">
                    {!isWarga && (
                        <div className="relative min-w-[200px]">
                            <Users weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                {...register('warga_id', { required: true })}
                                className="w-full bg-slate-50 border-none rounded-[18px] py-2 pl-9 pr-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                            >
                                <option value="">-- Pilih Warga --</option>
                                {wargaList.map(w => <option key={w.id} value={w.id}>{w.nama}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="relative">
                        <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <select
                            {...register('periode_tahun', { required: true, valueAsNumber: true })}
                            className="bg-slate-50 border-none rounded-[18px] py-2 pl-9 pr-8 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer"
                        >
                            {tahunOptions.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-[24px] flex items-start gap-4 animate-shake shadow-sm">
                    <Warning weight="fill" className="w-6 h-6 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-black text-sm uppercase tracking-wide">Terjadi Kesalahan</p>
                        <p className="text-sm font-medium mt-0.5 opacity-90">{errorMessage}</p>
                    </div>
                    <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors"><X weight="bold" /></button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* SHELVES: LEFT (8 columns) */}
                <div className="lg:col-span-8 space-y-6">
                    {!watchWargaId ? (
                        <div className="bg-white rounded-[40px] border border-slate-100/50 p-20 text-center shadow-premium relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:bg-brand-100 transition-colors duration-1000" />
                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-white">
                                    <Users weight="duotone" className="w-12 h-12 text-slate-300" />
                                </div>
                                <Text.H2 className="!text-slate-400 !font-black !tracking-tight">Silakan Pilih Warga</Text.H2>
                                <Text.Body className="text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">Pilih warga pembayar di bagian atas untuk memuat manifest tagihan dan iuran mereka.</Text.Body>
                            </div>
                        </div>
                    ) : isLoadingManifest ? (
                        <div className="bg-white rounded-[40px] p-24 text-center shadow-premium border border-slate-50">
                            <CircleNotch className="w-12 h-12 text-brand-500 animate-spin mx-auto mb-4" />
                            <Text.Label className="!text-slate-400 !font-bold animate-pulse tracking-widest uppercase text-[10px]">Menghitung Kewajiban & Manifest...</Text.Label>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* CATEGORY TABS */}
                            <div className="flex flex-wrap gap-2.5">
                                {manifest.map(m => (
                                    <button
                                        key={m.nama}
                                        onClick={() => setActiveKategori(m.nama)}
                                        className={`px-6 py-4 rounded-[22px] text-xs font-black transition-all flex items-center gap-2.5 border uppercase tracking-widest shadow-sm ${
                                            activeKategori === m.nama 
                                                ? 'bg-brand-600 border-brand-600 text-white shadow-xl shadow-brand-500/20 scale-105' 
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-brand-200 hover:text-brand-600'
                                        }`}
                                    >
                                        {m.tipe === 'INSIDENTIL' ? <ChartPieSlice weight="fill" className="w-4 h-4" /> : <Money weight="fill" className="w-4 h-4" />}
                                        {m.nama}
                                    </button>
                                ))}
                            </div>

                            {activeManifestItem && (
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-7 space-y-6">
                                        {/* THE 12-MONTH GRID */}
                                        <div className="bg-white rounded-[40px] p-8 shadow-premium border border-slate-50 relative overflow-hidden">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <Text.H3 className="!text-slate-900 !tracking-tight !text-xl">Kalender Pembayaran</Text.H3>
                                                    <Text.Caption className="text-slate-400 font-medium">Klik pada bulan yang ingin dibayar.</Text.Caption>
                                                </div>
                                                <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{watchTahun}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {MONTHS.map(m => {
                                                    const isPaid = activeManifestItem.paidMonths.includes(m.value);
                                                    const isPending = activeManifestItem.pendingMonths.includes(m.value);
                                                    const isSelected = cart.some(c => c.kategori === activeKategori && c.month === m.value && c.year === watchTahun);
                                                    
                                                    return (
                                                        <button
                                                            key={m.value}
                                                            type="button"
                                                            disabled={isPaid || isPending}
                                                            onClick={() => toggleCartItem(activeKategori, m.value)}
                                                            className={`h-24 rounded-[28px] flex flex-col items-center justify-center gap-1 border transition-all relative overflow-hidden group ${
                                                                isPaid ? 'bg-emerald-50 border-emerald-100 text-emerald-700 opacity-80 cursor-not-allowed' :
                                                                isPending ? 'bg-amber-50 border-amber-100 text-amber-700 opacity-80 cursor-not-allowed' :
                                                                isSelected ? 'bg-brand-600 border-brand-600 text-white shadow-xl scale-105 z-10' :
                                                                'bg-slate-50/50 border-slate-100 hover:border-brand-500 hover:bg-white hover:shadow-lg'
                                                            }`}
                                                        >
                                                            <span className="text-[9px] font-headline font-black uppercase tracking-widest opacity-60 mb-0.5">{m.label}</span>
                                                            <span className={`text-[13px] font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-brand-600'}`}>
                                                                {isPaid ? 'LUNAS' : isPending ? 'PENDING' : isSelected ? 'Pilih' : '---'}
                                                            </span>
                                                            {isSelected && <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                                            {isPaid && <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-5 space-y-6">
                                        {/* BALANCE CARDS */}
                                        <div className={`rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl transition-all duration-500 ${activeManifestItem.tipe === 'INSIDENTIL' ? 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 translate-y-0 hover:-translate-y-2' : 'bg-gradient-to-br from-brand-700 via-brand-800 to-slate-900 translate-y-0 hover:-translate-y-2'}`}>
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
                                            <div className="relative z-10 space-y-8">
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Dashboard Kewajiban</span>
                                                    <Text.H2 className="!text-white !text-2xl font-black mt-2 leading-tight">{activeKategori}</Text.H2>
                                                </div>
                                                
                                                <div className="space-y-2.5">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Akumulasi Terbayar</span>
                                                        <span className="text-base font-black">{formatRupiah(activeManifestItem.totalPaid)}</span>
                                                    </div>
                                                    <div className="h-3 bg-black/20 rounded-full overflow-hidden border border-white/5 p-[1.5px]">
                                                        <div 
                                                            className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.6)]" 
                                                            style={{ width: `${Math.min(100, (activeManifestItem.totalPaid / activeManifestItem.expectedTotal) * 100)}%` }} 
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                                                    <div className="space-y-0.5">
                                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Target Tahun</span>
                                                        <p className="text-sm font-black text-white/90">{formatRupiah(activeManifestItem.expectedTotal)}</p>
                                                    </div>
                                                    <div className="space-y-0.5 text-right">
                                                        <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Sisa Saldo</span>
                                                        <p className="text-xl font-black text-rose-200 tracking-tighter">
                                                            {formatRupiah(activeManifestItem.sisa)}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {activeManifestItem.pendingAmount > 0 && (
                                                    <div className="bg-white/10 backdrop-blur-xl rounded-[24px] p-4 border border-white/20 flex items-center gap-4 animate-pulse">
                                                        <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center">
                                                            <Clock weight="fill" className="w-5 h-5 text-amber-900" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] font-black tracking-widest uppercase opacity-70">Verifikasi Tertunda</p>
                                                            <p className="text-sm font-black text-amber-100 mt-0.5">{formatRupiah(activeManifestItem.pendingAmount)}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-[40px] p-8 border border-slate-100 group hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                                    <Receipt weight="fill" className="text-slate-400 w-5 h-5" />
                                                </div>
                                                <Text.H4 className="!text-slate-700 !font-black !tracking-tight uppercase text-xs">Sistem Angsuran</Text.H4>
                                            </div>
                                            <p className="text-[11px] text-slate-500 leading-relaxed font-bold opacity-80">
                                                Tagihan ini bersifat fleksibel. Anda dapat mencicil jumlah berapa pun di setiap bulannya. Sistem akan secara otomatis menghitung sisa pelunasan hingga target {watchTahun} terpenuhi.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CHECKOUT: RIGHT (4 columns) */}
                <div className="lg:col-span-4 space-y-6 sticky top-24">
                    <div className="bg-white rounded-[44px] shadow-premium border border-slate-100 overflow-hidden group">
                        <div className="bg-slate-900 p-10 text-white relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[100px] -mr-32 -mt-32 opacity-20" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-brand-600 rounded-[22px] flex items-center justify-center shadow-2xl shadow-brand-600/40 border border-brand-500/50">
                                            <ShoppingCart weight="fill" className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <Text.H3 className="!text-white !tracking-tight !text-xl">Checkout</Text.H3>
                                            <span className="text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">{cart.length} Pesanan</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-3 custom-scrollbar">
                                    {cart.length === 0 ? (
                                        <div className="py-12 text-center bg-white/5 rounded-[32px] border border-white/10 border-dashed animate-in fade-in duration-500">
                                            <PlusCircle weight="duotone" className="w-10 h-10 text-white/10 mx-auto mb-3" />
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Keranjang Kosong</p>
                                        </div>
                                    ) : (
                                        cart.map((item) => (
                                            <div key={item.id} className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-[24px] p-5 transition-all group scale-in relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-3 relative z-10">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-brand-400 uppercase tracking-widest leading-none mb-1.5">{item.kategori}</span>
                                                        <span className="text-sm font-bold text-white/90">{MONTHS.find(m => m.value === item.month)?.label} {item.year}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => toggleCartItem(item.kategori, item.month)}
                                                        className="p-2 bg-rose-500/20 text-rose-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                                    >
                                                        <Trash weight="bold" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-2.5 relative z-10">
                                                    <span className="text-[11px] font-black text-white/40">Rp</span>
                                                    <CurrencyInput
                                                        value={item.nominal}
                                                        onChange={(val) => updateCartItemNominal(item.id, val || 0)}
                                                        className="!bg-white/5 !border-none !px-3 !py-1.5 !rounded-xl !text-sm !font-black !text-white focus:!ring-1 focus:!ring-brand-500 w-full transition-all"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/10 flex flex-col items-center animate-in slide-in-from-bottom-2 duration-500">
                                    {cart.length > 0 ? (
                                        <>
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">Grand Total</span>
                                            <Text.Amount className="!text-brand-400 !text-5xl !tracking-tighter font-black">{formatRupiah(cartTotal).replace('Rp ', '')}</Text.Amount>
                                            <span className="text-[10px] font-black text-brand-400 mt-1">RUPIAH INDONESIA</span>
                                        </>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">Pilih bulan di kalender</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-10 space-y-8 bg-white relative">
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Tanggal Pembayaran</label>
                                    <div className="relative">
                                        <CalendarBlank weight="fill" className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                        <input
                                            type="date"
                                            {...register('tanggal_bayar')}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[22px] py-4 pl-14 pr-6 text-sm font-black text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Bukti Pembayaran</label>
                                    <div className="bg-slate-50 border border-slate-100 rounded-[32px] p-5 hover:bg-slate-100 transition-all cursor-pointer group">
                                        <FileUpload
                                            onUploadSuccess={(url) => setValue('url_bukti', url)}
                                            onRemove={() => setValue('url_bukti', '')}
                                            onLoadingChange={setIsUploading}
                                            label="Attachment (.jpg/png)"
                                            helperText="Bukti Transfer atau Kwitansi Tunai"
                                        />
                                    </div>
                                </div>

                                {!isWarga && (
                                    <div className="flex items-center justify-between p-5 bg-brand-50/50 rounded-[28px] border border-brand-100 transition-all hover:bg-brand-50">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-brand-900 uppercase">Auto Verifikasi</span>
                                            <span className="text-[9px] text-brand-600 font-bold opacity-80 mt-0.5">Langsung cair ke kas RT</span>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" {...register('auto_verify')} className="sr-only peer" />
                                            <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-600 shadow-inner"></div>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleSubmit(onProcessPayment)}
                                disabled={isUploading || isSubmitting || cart.length === 0}
                                className={`w-full py-6 rounded-[30px] bg-slate-900 hover:bg-black text-white flex items-center justify-center gap-4 font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100`}
                            >
                                {isSubmitting ? <CircleNotch weight="bold" className="animate-spin w-6 h-6" /> : <CheckCircle weight="fill" className="w-6 h-6" />}
                                <span>{isEdit ? 'Simpan Perubahan' : 'Bayar Sekarang'}</span>
                            </button>
                            
                            <div className="flex items-center gap-3 justify-center px-4">
                                <div className="h-[1px] bg-slate-100 flex-1" />
                                <Text.Caption className="!text-[9px] !font-black !text-slate-300 tracking-tighter uppercase whitespace-nowrap">Official Civic Transaction</Text.Caption>
                                <div className="h-[1px] bg-slate-100 flex-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
