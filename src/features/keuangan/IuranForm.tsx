import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { iuranService } from '../../services/iuranService';
import { wargaService } from '../../services/wargaService';
import { pengaturanService } from '../../services/pengaturanService';
import { PembayaranIuran, Warga } from '../../database/db';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { ArrowLeft, CheckCircle, ChartPieSlice, Users, CalendarBlank, CircleNotch } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';
import { formatRupiah } from '../../utils/currency';

type IuranFormData = Omit<PembayaranIuran, 'id' | 'tenant_id'>;

const MONTHS = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
];

export default function IuranForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const { currentTenant, currentScope } = useTenant();

    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [defaultNominal, setDefaultNominal] = useState(0);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth() + 1]);
    const [tahunOptions, setTahunOptions] = useState<number[]>([new Date().getFullYear()]);
    const [kategoriOptions, setKategoriOptions] = useState<string[]>(['Iuran Warga']);
    const [isUploading, setIsUploading] = useState(false);
    const [paymentMode, setPaymentMode] = useState<'Pas' | 'Bebas'>('Pas');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isLoadingBilling, setIsLoadingBilling] = useState(false);

    // Summary Data State
    const [alreadyPaid, setAlreadyPaid] = useState(0);
    const [paidMonthsRecord, setPaidMonthsRecord] = useState<number[]>([]);

    const { user: authUser } = useAuth();
    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';
    const loggedInWargaId = authUser?.id && isWarga ? (authUser as any).warga_id || authUser.id : null;

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<IuranFormData>({
        defaultValues: {
            tanggal_bayar: new Date().toISOString().split('T')[0],
            periode_tahun: new Date().getFullYear(),
            warga_id: loggedInWargaId || '',
            kategori: 'Iuran Warga'
        }
    });

    const watchNominal = watch('nominal');
    const watchWargaId = watch('warga_id');
    const watchKategori = watch('kategori');
    const watchTahun = watch('periode_tahun');

    useEffect(() => {
        if (loggedInWargaId && !isEdit) {
            setValue('warga_id', loggedInWargaId);
        }
    }, [loggedInWargaId, setValue, isEdit]);

    useEffect(() => {
        if (currentTenant) {
            // Get Warga for current scope
            wargaService.getAll(currentTenant.id, currentScope).then(data => setWargaList(data.items || []));

            // Fetch data if editing
            if (isEdit && id) {
                iuranService.getById(id).then(data => {
                    if (data) {
                        setValue('warga_id', data.warga_id);
                        setValue('kategori', data.kategori);
                        setValue('periode_tahun', data.periode_tahun);
                        setValue('tanggal_bayar', data.tanggal_bayar.split('T')[0]);
                        setValue('nominal', data.nominal);
                        setValue('url_bukti', data.url_bukti);
                        setSelectedMonths(Array.isArray(data.periode_bulan) ? data.periode_bulan : []);
                    }
                });
            }

            // Get default settings
            pengaturanService.getAll(currentTenant.id, currentScope).then(config => {
                const tieredRates = {
                    'Tetap-Dihuni': Number(config.iuran_tetap_dihuni || 0),
                    'Tetap-Kosong': Number(config.iuran_tetap_kosong || 0),
                    'Kontrak-Dihuni': Number(config.iuran_kontrak_dihuni || 0),
                    'Kontrak-Kosong': Number(config.iuran_kontrak_kosong || 0),
                    'Default': Number(config.iuran_per_bulan || 0)
                };

                // Store config in a ref or local state to use during citizen selection
                (window as any)._pakrt_config = config;

                // Fallback / Initial
                const baseIuran = tieredRates['Tetap-Dihuni'] || tieredRates['Default'];
                setDefaultNominal(baseIuran);
                setValue('nominal', baseIuran);

                if (config.kategori_pemasukan) {
                    try {
                        const parsedKategori = JSON.parse(config.kategori_pemasukan);
                        if (Array.isArray(parsedKategori) && parsedKategori.length > 0) {
                            setKategoriOptions(parsedKategori);
                            if (!parsedKategori.includes(watch('kategori'))) {
                                setValue('kategori', parsedKategori[0]);
                            }
                        }
                    } catch (e) {
                        console.error("Gagal parse opsi kategori", e);
                    }
                }

                if (config.opsi_tahun_iuran) {
                    try {
                        const parsedTahun = JSON.parse(config.opsi_tahun_iuran);
                        if (Array.isArray(parsedTahun) && parsedTahun.length > 0) {
                            setTahunOptions(parsedTahun);
                            if (!parsedTahun.includes(watch('periode_tahun'))) {
                                setValue('periode_tahun', parsedTahun[0]);
                            }
                        }
                    } catch (e) {
                        console.error("Gagal parse opsi tahun", e);
                    }
                }
            });
        }
    }, [currentTenant, currentScope, setValue]);

    useEffect(() => {
        const shouldCalculate = !isEdit || (isEdit && hasInteracted);
        if (shouldCalculate && paymentMode === 'Pas' && selectedMonths.length > 0 && defaultNominal > 0) {
            setValue('nominal', defaultNominal * selectedMonths.length);
        } else if (shouldCalculate && paymentMode === 'Pas' && selectedMonths.length === 0) {
            setValue('nominal', 0);
        }
    }, [selectedMonths, defaultNominal, setValue, isEdit, paymentMode, hasInteracted]);

    useEffect(() => {
        if (watchWargaId && watchTahun && watchKategori && currentTenant) {
            const fetchBillingSummary = async () => {
                setIsLoadingBilling(true);
                try {
                    const result = await iuranService.getBillingSummary(
                        watchWargaId, 
                        watchTahun, 
                        watchKategori, 
                        currentScope
                    );
                    setAlreadyPaid(result.totalPaid);
                    setDefaultNominal(result.rate);
                    setPaidMonthsRecord(result.paidMonths);

                    // Auto-select first unpaid month if not edit and hasn't interacted
                    if (!isEdit && !hasInteracted && result.rate > 0) {
                        const firstUnpaid = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(m => !result.paidMonths.includes(m));
                        if (firstUnpaid) {
                            setSelectedMonths([firstUnpaid]);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch billing summary:", error);
                    setAlreadyPaid(0);
                } finally {
                    setIsLoadingBilling(false);
                }
            };
            fetchBillingSummary();
        } else {
            setAlreadyPaid(0);
            setPaidMonthsRecord([]);
        }
    }, [watchWargaId, watchTahun, watchKategori, currentTenant, currentScope, isEdit]);

    const toggleMonth = (monthValue: number) => {
        setHasInteracted(true);
        setSelectedMonths(prev => {
            const current = Array.isArray(prev) ? prev : [];
            return current.includes(monthValue)
                ? current.filter(m => m !== monthValue)
                : [...current, monthValue].sort((a, b) => a - b);
        });
    };

    const onSubmit = async (data: IuranFormData) => {
        setErrorMessage(null); // Reset error state on each submission attempt

        if (!currentTenant) return;
        if (selectedMonths.length === 0) {
            setErrorMessage("Harap pilih minimal 1 bulan pembayaran.");
            return;
        }

        try {
            const payload = {
                ...data,
                periode_bulan: selectedMonths,
                tenant_id: currentTenant.id,
                metadata: { mode: paymentMode }
            };

            if (isEdit && id) {
                await iuranService.update(id, payload, currentScope);
            } else {
                await iuranService.create(payload, currentScope);
            }
            navigate('/iuran');
        } catch (error: any) {
            console.error("Gagal menyimpan pembayaran iuran:", error);
            // Capture specific errorMessage sent from the backend API if available
            const backendMsg = error.response?.data?.error;
            setErrorMessage(backendMsg ? `Gagal menyimpan: ${backendMsg}` : "Terjadi kesalahan koneksi saat menyimpan data transaksi.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/iuran')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Ubah Pembayaran Iuran' : 'Catat Pembayaran Iuran'}</h1>
                    <p className="text-gray-500 mt-1">Pembayaran bulanan wajib untuk warga <span className="font-semibold text-brand-600">{currentScope}</span></p>
                </div>
            </div>

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-sm text-sm font-medium animate-fade-in flex items-start gap-3">
                    <span className="shrink-0 leading-none">⚠️</span>
                    <div>
                        <strong className="block mb-1">Terjadi Kesalahan</strong>
                        <span>{errorMessage}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: SUMMARY */}
                <div className="md:col-span-4 space-y-6 sticky top-24">
                    {isLoadingBilling ? (
                        <div className="bg-white rounded-xl shadow-md border-2 border-brand-100 p-8 text-center animate-pulse">
                            <CircleNotch weight="bold" className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat Data Tagihan...</p>
                        </div>
                    ) : watchWargaId && watchKategori ? (
                        <div className="bg-white rounded-xl shadow-md border-2 border-brand-100 overflow-hidden animate-in slide-in-from-left-4 duration-500">
                            <div className="bg-brand-600 p-4 text-white">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <ChartPieSlice weight="fill" className="w-5 h-5" />
                                    Ringkasan Kewajiban
                                </h3>
                                <p className="text-[10px] text-brand-100 mt-1 uppercase tracking-wider font-medium">Tahun {watchTahun || new Date().getFullYear()}</p>
                            </div>
                            
                            <div className="p-5 space-y-5 bg-gradient-to-b from-white to-slate-50">
                                <div className="space-y-1 pb-4 border-b border-slate-100">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Tagihan 12 Bulan</p>
                                    <p className="text-xl font-black text-slate-900 tabular-nums">
                                        {formatRupiah(defaultNominal * 12)}
                                    </p>
                                    <p className="text-[9px] text-slate-400 italic">Tarif: {formatRupiah(defaultNominal)} / bln</p>
                                </div>

                                <div className="space-y-1 pb-4 border-b border-slate-100">
                                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Sudah Dibayar (Sistem)</p>
                                    <p className="text-xl font-black text-emerald-600 tabular-nums">
                                        {formatRupiah(alreadyPaid)}
                                    </p>
                                    <p className="text-[9px] text-emerald-500/70 italic">Hingga periode saat ini</p>
                                </div>

                                <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 shadow-inner">
                                    <p className="text-[10px] text-brand-600 font-black uppercase tracking-widest mb-1">Sisa Kewajiban</p>
                                    <p className="text-2xl font-black text-brand-700 tabular-nums">
                                        {formatRupiah(Math.max(0, (defaultNominal * 12) - alreadyPaid - (paymentMode === 'Pas' ? (defaultNominal * selectedMonths.length) : (watchNominal || 0))))}
                                    </p>
                                    <p className="text-[9px] text-brand-500 mt-2 font-medium">
                                        {paymentMode === 'Pas' ? '*(Otomatis Mode Pas)' : '*(Setelah nominal ini lunas)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <Users weight="duotone" className="w-6 h-6 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500">Menunggu Data Warga</p>
                                <p className="text-[10px] text-slate-400 mt-1">Pilih warga dan kategori untuk melihat ringkasan kewajiban</p>
                            </div>
                        </div>
                    )}

                    {/* QUICK STATS / INFO */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start translate-y-0 hover:-translate-y-1 transition-transform">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                            <CalendarBlank weight="fill" className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-blue-900 leading-tight">Info Periode</p>
                            <p className="text-[10px] text-blue-700 mt-0.5 leading-relaxed">Pastikan periode tahun sesuai dengan iuran yang sedang berjalan.</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: FORM */}
                <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="border-b border-slate-50 p-4 bg-slate-50/30 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Input Transaksi Pembayaran</span>
                    </div>

                    <div className="p-6 md:p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* ROW 1: WARGA & KATEGORI */}
                                {!isWarga && (
                                    <div className="space-y-1">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Pilih Warga Pembayar <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('warga_id', { 
                                                required: 'Warga wajib dipilih',
                                                onChange: () => setHasInteracted(true)
                                            })}
                                            disabled={isWarga && !isEdit}
                                            className={`w-full rounded-lg shadow-sm p-2.5 text-xs border focus:ring-2 focus:ring-brand-500 outline-none transition-all ${isWarga && !isEdit ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'} ${errors.warga_id ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-brand-500'}`}
                                        >
                                            <option value="">-- Cari atau Pilih Warga --</option>
                                            {wargaList.map(w => (
                                                <option key={w.id} value={w.id}>{w.nama} {w.alamat ? `- ${w.alamat}` : ''}</option>
                                            ))}
                                        </select>
                                        {errors.warga_id && <p className="text-red-500 text-[9px] font-bold mt-1 px-1">{errors.warga_id.message}</p>}
                                    </div>
                                )}

                                <div className={`${isWarga ? 'md:col-span-2' : ''} space-y-1`}>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Jenis Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('kategori', { required: 'Kategori wajib dipilih' })}
                                        className={`w-full rounded-lg shadow-sm p-2.5 text-xs border focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.kategori ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-brand-500 bg-white'}`}
                                    >
                                        <option value="">-- Pilih Jenis Pembayaran --</option>
                                        {kategoriOptions.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {errors.kategori && <p className="text-red-500 text-[10px] font-bold mt-1 px-1">{errors.kategori.message}</p>}
                                </div>

                                {/* ROW 2: PAYMENT MODE */}
                                <div className="md:col-span-2 space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Mode Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <label className={`flex-1 flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${paymentMode === 'Pas' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                            <input 
                                                type="radio" 
                                                name="paymentMode" 
                                                value="Pas" 
                                                checked={paymentMode === 'Pas'} 
                                                onChange={() => { setPaymentMode('Pas'); setHasInteracted(true); }}
                                                className="w-3.5 h-3.5 text-brand-600 focus:ring-brand-500"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-900 text-[11px] leading-tight">Mode Pas</p>
                                                <p className="text-[9px] text-slate-500">Sesuai tarif</p>
                                            </div>
                                        </label>
                                        <label className={`flex-1 flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${paymentMode === 'Bebas' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                            <input 
                                                type="radio" 
                                                name="paymentMode" 
                                                value="Bebas" 
                                                checked={paymentMode === 'Bebas'} 
                                                onChange={() => { setPaymentMode('Bebas'); setHasInteracted(true); }}
                                                className="w-3.5 h-3.5 text-brand-600 focus:ring-brand-500"
                                            />
                                            <div>
                                                <p className="font-bold text-slate-900 text-[11px] leading-tight">Mode Bebas</p>
                                                <p className="text-[9px] text-slate-500">Input manual</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* ROW 3: DATE & YEAR */}
                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Tahun Periode <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('periode_tahun', { required: true, valueAsNumber: true })}
                                        className="w-full rounded-lg shadow-sm p-2.5 text-xs border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-white outline-none"
                                    >
                                        {tahunOptions.map(tahun => (
                                            <option key={tahun} value={tahun}>{tahun}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        Tanggal Bayar <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...register('tanggal_bayar', { required: 'Tanggal wajib diisi' })}
                                        className={`w-full rounded-lg shadow-sm p-2.5 text-xs border focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.tanggal_bayar ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-brand-500 bg-white'}`}
                                    />
                                </div>

                                {/* ROW 4: MONTHS & NOMINAL */}
                                <div className="md:col-span-2 space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                            Pilih Bulan Pembayaran <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                                            {MONTHS.map(m => (
                                                <button
                                                    key={m.value}
                                                    type="button"
                                                    disabled={paidMonthsRecord.includes(m.value)}
                                                    onClick={() => toggleMonth(m.value)}
                                                    className={`py-1.5 px-1 text-[9px] font-bold rounded-lg border transition-all relative ${paidMonthsRecord.includes(m.value)
                                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed opacity-80'
                                                        : selectedMonths.includes(m.value)
                                                            ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500'
                                                            : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'
                                                        }`}
                                                >
                                                    {m.label.substring(0, 3)}
                                                    {paidMonthsRecord.includes(m.value) ? (
                                                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                                                            <CheckCircle weight="fill" className="w-2 h-2" />
                                                        </div>
                                                    ) : selectedMonths.includes(m.value) && (
                                                        <div className="absolute -top-1 -right-1 bg-brand-500 text-white rounded-full p-0.5">
                                                            <CheckCircle weight="fill" className="w-2 h-2" />
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedMonths.length === 0 && <p className="text-red-500 text-[9px] font-bold mt-1 px-1">Minimal 1 bulan harus dipilih</p>}
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                Nominal Transaksi (Rp)
                                            </label>
                                            {paymentMode === 'Pas' && (
                                                <span className="text-[8px] font-bold text-brand-600 bg-white px-2 py-0.5 rounded-full border border-brand-100">MODE PAS</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-black text-slate-400 z-10">Rp</span>
                                            <Controller
                                                name="nominal"
                                                control={control}
                                                rules={{ required: 'Nominal wajib diisi', min: { value: 1, message: 'Nominal tidak boleh 0' } }}
                                                render={({ field }) => (
                                                    <CurrencyInput
                                                        {...field}
                                                        className={`w-full pl-11 py-2.5 text-lg font-black ${paymentMode === 'Pas' ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed selection:bg-transparent' : 'bg-white border-slate-200 text-slate-900 focus:ring-brand-500'}`}
                                                        error={!!errors.nominal}
                                                        disabled={paymentMode === 'Pas'}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-[9px] text-slate-400 italic">
                                                {defaultNominal > 0 ? `*Tarif Dasar: ${formatRupiah(defaultNominal)} x ${selectedMonths.length} bln` : '*Menunggu pilihan warga'}
                                            </p>
                                            {errors.nominal && <p className="text-red-500 text-[9px] font-black uppercase">{errors.nominal.message}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 5: BUKTI */}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        Lampiran Bukti (Opsional)
                                    </label>
                                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition-colors">
                                        <FileUpload
                                            onUploadSuccess={(url) => setValue('url_bukti', url)}
                                            label="Klik untuk unggah"
                                            helperText="Maksimal 2MB (JPG, PNG)"
                                            onLoadingChange={setIsUploading}
                                        />
                                        {watch('url_bukti') && (
                                            <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-white w-fit px-3 py-1.5 rounded-lg border border-emerald-100 shadow-sm animate-in zoom-in-95">
                                                <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                <span>File terunggah</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-[9px] text-slate-400 font-medium">* Pastikan data warga dan nominal sudah benar.</p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/iuran')}
                                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className={`px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 text-xs font-black transition-all shadow-md active:scale-95 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isUploading ? <CircleNotch weight="bold" className="animate-spin w-4 h-4" /> : <CheckCircle weight="bold" className="w-4 h-4" />}
                                        <span>{isEdit ? 'Simpan' : 'Bayar'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
