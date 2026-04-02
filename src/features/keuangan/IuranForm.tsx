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
import { ArrowLeft, CheckCircle, ChartPieSlice, Users, CalendarBlank, CircleNotch, Warning, X, Clock } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Text } from '../../components/ui/Typography';
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
    const [currentStatus, setCurrentStatus] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | null>(null);
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);

    // Summary Data State
    const [alreadyPaid, setAlreadyPaid] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [paidMonthsRecord, setPaidMonthsRecord] = useState<number[]>([]);
    const [pendingMonthsRecord, setPendingMonthsRecord] = useState<number[]>([]);

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
                        setCurrentStatus((data.status as any) || 'PENDING');
                        setRejectionReason(data.alasan_penolakan || null);
                    }
                });
            }

            // Get default settings
            pengaturanService.getAll(currentTenant.id, currentScope).then(items => {
                const config: Record<string, any> = {};
                items.forEach(item => { config[item.key] = item.value; });

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
                    setPendingAmount(result.pendingAmount);
                    setPaidMonthsRecord(result.paidMonths);
                    setPendingMonthsRecord(result.pendingMonths);

                    // Auto-select removed - default to 0 selected months as per user request
                    if (!isEdit && !hasInteracted && result.rate > 0) {
                        setSelectedMonths([]);
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
                scope: currentScope,
                metadata: { mode: paymentMode }
            };

            if (isEdit && id) {
                if (currentStatus === 'REJECTED') {
                    // Warga resubmitting rejected payment
                    await iuranService.resubmit(id, { url_bukti: payload.url_bukti });
                } else {
                    // Normal admin update
                    await iuranService.update(id, payload);
                }
            } else {
                await iuranService.create(payload);
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
                    <Text.H1>{isEdit ? 'Ubah Pembayaran Iuran' : 'Catat Pembayaran Iuran'}</Text.H1>
                    <Text.Body className="mt-0.5">Pembayaran bulanan wajib untuk warga <span className="font-semibold text-brand-600">{currentScope}</span></Text.Body>
                </div>
            </div>

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-3 animate-shake">
                    <Warning className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm font-semibold">{errorMessage}</div>
                </div>
            )}

            {currentStatus && (
                <div className={`px-4 py-3 rounded-xl border flex items-center gap-3 animate-fade-in ${
                    currentStatus === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    currentStatus === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-700' :
                    'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                         currentStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' :
                         currentStatus === 'REJECTED' ? 'bg-red-100 text-red-600' :
                         'bg-amber-100 text-amber-600'
                    }`}>
                        {currentStatus === 'VERIFIED' ? <CheckCircle weight="fill" className="w-6 h-6" /> :
                         currentStatus === 'REJECTED' ? <X weight="bold" className="w-6 h-6" /> :
                         <CircleNotch weight="bold" className="w-6 h-6 animate-spin" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold tracking-normal opacity-60">Status Pembayaran:</span>
                            <span className="text-sm font-semibold tracking-normal">
                                {currentStatus === 'VERIFIED' ? 'Sah / Diterima' :
                                 currentStatus === 'REJECTED' ? 'Ditolak' :
                                 'Menunggu Verifikasi'}
                            </span>
                        </div>
                        {currentStatus === 'REJECTED' && rejectionReason && (
                            <p className="text-sm font-semibold mt-1">Alasan: {rejectionReason}</p>
                        )}
                        {currentStatus === 'VERIFIED' && (
                            <p className="text-[11px] opacity-80 mt-0.5 font-medium italic">Data ini sudah diverifikasi oleh Bendahara dan tidak dapat diubah lagi.</p>
                        )}
                        {currentStatus === 'PENDING' && (
                            <p className="text-[11px] opacity-80 mt-0.5 font-medium">Pembayaran Anda sedang dalam antrian verifikasi Bendahara.</p>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* LEFT COLUMN: SUMMARY */}
                <div className="md:col-span-4 space-y-6 sticky top-24">
                    {isLoadingBilling ? (
                        <div className="bg-white rounded-xl shadow-md border-2 border-brand-100 p-8 text-center animate-pulse">
                            <CircleNotch weight="bold" className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-500 tracking-normal">Memuat Data Tagihan...</p>
                        </div>
                    ) : watchWargaId && watchKategori ? (
                        <div className="bg-white rounded-xl shadow-md border-2 border-brand-100 overflow-hidden animate-in slide-in-from-left-4 duration-500">
                            <div className="bg-brand-600 p-4 text-white">
                                <Text.Label className="!text-white flex items-center gap-2">
                                    <ChartPieSlice weight="fill" className="w-5 h-5" />
                                    Ringkasan Kewajiban
                                </Text.Label>
                                <Text.Caption className="!text-brand-100 mt-0.5 !tracking-normal font-medium capitalize">Tahun {watchTahun || new Date().getFullYear()}</Text.Caption>
                            </div>
                            
                            <div className="p-5 space-y-5 bg-gradient-to-b from-white to-gray-50">
                                <div className="space-y-1 pb-4 border-b border-gray-100">
                                    <Text.Label className="!text-slate-400">Total Tagihan 12 Bulan</Text.Label>
                                    <Text.Amount className="!text-slate-900">
                                        {formatRupiah(defaultNominal * 12)}
                                    </Text.Amount>
                                    <Text.Caption className="italic font-medium">Tarif: {formatRupiah(defaultNominal)} / bln</Text.Caption>
                                </div>

                                <div className="space-y-1 pb-4 border-b border-gray-100">
                                    <Text.Label className="!text-emerald-600">Sudah Dibayar (Sistem)</Text.Label>
                                    <Text.Amount className="!text-emerald-600">
                                        {formatRupiah(alreadyPaid)}
                                    </Text.Amount>
                                    {pendingAmount > 0 && (
                                        <div className="flex items-center gap-1.5 mt-1 text-amber-600">
                                            <Clock className="w-3.5 h-3.5" />
                                            <Text.Caption className="font-bold whitespace-nowrap !text-amber-600">Menunggu Verifikasi: {formatRupiah(pendingAmount)}</Text.Caption>
                                        </div>
                                    )}
                                    <Text.Caption className="!text-emerald-500/70 italic font-medium mt-1">Hingga periode saat ini</Text.Caption>
                                </div>

                                <div className="p-4 bg-brand-50 rounded-xl border border-brand-100 shadow-inner">
                                    <Text.Label className="!text-brand-600 mb-1">Sisa Kewajiban</Text.Label>
                                    <Text.Amount className="!text-brand-700 !text-2xl leading-none">
                                        {formatRupiah(Math.max(0, (defaultNominal * 12) - alreadyPaid - pendingAmount - (paymentMode === 'Pas' ? (defaultNominal * selectedMonths.length) : (watchNominal || 0))))}
                                    </Text.Amount>
                                    <Text.Caption className="!text-brand-500 mt-2 font-medium italic">
                                        {paymentMode === 'Pas' ? '*(Otomatis Mode Pas)' : '*(Setelah nominal ini lunas)'}
                                    </Text.Caption>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center space-y-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <Users weight="duotone" className="w-6 h-6 text-gray-300" />
                            </div>
                            <div>
                                <Text.Label className="!text-slate-400">Menunggu Data Warga</Text.Label>
                                <Text.Caption className="mt-1">Pilih warga dan kategori untuk melihat ringkasan kewajiban</Text.Caption>
                            </div>
                        </div>
                    )}

                    {/* QUICK STATS / INFO */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 items-start translate-y-0 hover:-translate-y-1 transition-transform">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                            <CalendarBlank weight="fill" className="w-4 h-4" />
                        </div>
                        <div>
                            <Text.H2 className="!leading-tight !text-blue-900">Info Periode</Text.H2>
                            <Text.Body className="!text-blue-700 mt-0.5 leading-relaxed">Pastikan periode tahun sesuai dengan iuran yang sedang berjalan.</Text.Body>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: FORM */}
                <div className="md:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-50 p-4 bg-slate-50/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                        <Text.Label className="uppercase !tracking-widest">Input Transaksi Pembayaran</Text.Label>
                    </div>

                    <div className="p-6 md:p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* ROW 1: WARGA & KATEGORI */}
                                {!isWarga && (
                                    <div className="space-y-1">
                                        <label className="input-label">
                                            Pilih Warga Pembayar <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('warga_id', { 
                                                required: 'Warga wajib dipilih',
                                                onChange: () => setHasInteracted(true)
                                            })}
                                            disabled={isWarga && !isEdit}
                                            className={`w-full rounded-lg shadow-sm p-3 text-main border focus:ring-2 focus:ring-brand-500 outline-none transition-all ${isWarga && !isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white'} ${errors.warga_id ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-500'}`}
                                        >
                                            <option value="">-- Cari atau Pilih Warga --</option>
                                            {wargaList.map(w => (
                                                <option key={w.id} value={w.id}>{w.nama} {w.alamat ? `- ${w.alamat}` : ''}</option>
                                            ))}
                                        </select>
                                        {errors.warga_id && <p className="text-red-500 text-sm font-semibold mt-1 px-1">{errors.warga_id.message}</p>}
                                    </div>
                                )}

                                <div className={`${isWarga ? 'md:col-span-2' : ''} space-y-1`}>
                                    <label className="input-label">
                                        Jenis Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('kategori', { required: 'Kategori wajib dipilih' })}
                                        className={`w-full rounded-lg shadow-sm p-3 text-main border focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.kategori ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-500 bg-white'}`}
                                    >
                                        <option value="">-- Pilih Jenis Pembayaran --</option>
                                        {kategoriOptions.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    {errors.kategori && <p className="text-red-500 text-sm font-semibold mt-1 px-1">{errors.kategori.message}</p>}
                                </div>

                                {/* ROW 2: PAYMENT MODE */}
                                <div className="md:col-span-2 space-y-1">
                                    <label className="input-label">
                                        Mode Pembayaran <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <label className={`flex-1 flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer ${paymentMode === 'Pas' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                            <input 
                                                type="radio" 
                                                name="paymentMode" 
                                                value="Pas" 
                                                checked={paymentMode === 'Pas'} 
                                                onChange={() => { setPaymentMode('Pas'); setHasInteracted(true); }}
                                                className="w-3.5 h-3.5 text-brand-600 focus:ring-brand-500"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 text-sm leading-tight">Mode Pas</p>
                                                <p className="text-xs text-gray-500">Sesuai tarif</p>
                                            </div>
                                        </label>
                                        <label className={`flex-1 flex items-center gap-2.5 p-3 rounded-lg border transition-all cursor-pointer ${paymentMode === 'Bebas' ? 'border-brand-500 bg-brand-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                                            <input 
                                                type="radio" 
                                                name="paymentMode" 
                                                value="Bebas" 
                                                checked={paymentMode === 'Bebas'} 
                                                onChange={() => { setPaymentMode('Bebas'); setHasInteracted(true); }}
                                                className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 text-sm leading-tight">Mode Bebas</p>
                                                <p className="text-sm text-gray-500">Input manual</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* ROW 3: DATE & YEAR */}
                                <div className="space-y-1">
                                    <label className="input-label">
                                        Tahun Periode <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('periode_tahun', { required: true, valueAsNumber: true })}
                                        className="w-full rounded-lg shadow-sm p-3 text-main border border-gray-200 focus:ring-2 focus:ring-brand-500 bg-white outline-none"
                                    >
                                        {tahunOptions.map(tahun => (
                                            <option key={tahun} value={tahun}>{tahun}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="input-label">
                                        Tanggal Bayar <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...register('tanggal_bayar', { required: 'Tanggal wajib diisi' })}
                                        className={`w-full rounded-lg shadow-sm p-3 text-main border focus:ring-2 focus:ring-brand-500 outline-none transition-all ${errors.tanggal_bayar ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-brand-500 bg-white'}`}
                                    />
                                </div>

                                {/* ROW 4: MONTHS & NOMINAL */}
                                <div className="md:col-span-2 space-y-3">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                                            Pilih Bulan Pembayaran <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-6 gap-1 lg:grid-cols-6">
                                            {MONTHS.map(m => {
                                                const isPaid = paidMonthsRecord.includes(m.value);
                                                const isPending = pendingMonthsRecord.includes(m.value);
                                                const isSelected = selectedMonths.includes(m.value);

                                                return (
                                                    <button
                                                        key={m.value}
                                                        type="button"
                                                        disabled={isPaid || isPending}
                                                        onClick={() => toggleMonth(m.value)}
                                                        className={`py-2 px-1 text-sm font-semibold rounded-lg border transition-all relative ${
                                                            isPaid
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed opacity-80'
                                                                : isPending
                                                                    ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed opacity-80'
                                                                    : isSelected
                                                                        ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm ring-1 ring-brand-500'
                                                                        : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'
                                                            }`}
                                                    >
                                                        {m.label.substring(0, 3)}
                                                        {isPaid ? (
                                                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                                                                <CheckCircle weight="fill" className="w-2.5 h-2.5" />
                                                            </div>
                                                        ) : isPending ? (
                                                            <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
                                                                <Clock weight="fill" className="w-2.5 h-2.5" />
                                                            </div>
                                                        ) : isSelected && (
                                                            <div className="absolute -top-1 -right-1 bg-brand-500 text-white rounded-full p-0.5">
                                                                <CheckCircle weight="fill" className="w-2.5 h-2.5" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedMonths.length === 0 && <p className="text-red-500 text-xs font-semibold mt-1.5 px-1">Minimal 1 bulan harus dipilih</p>}
                                    </div>

                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="section-label">
                                                Nominal Transaksi (Rp)
                                            </label>
                                            {paymentMode === 'Pas' && (
                                                <span className="text-sm font-semibold text-brand-600 bg-white px-2 py-0.5 rounded-full border border-brand-100 shadow-sm">Mode Pas</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-400 z-10">Rp</span>
                                            <Controller
                                                name="nominal"
                                                control={control}
                                                rules={{ required: 'Nominal wajib diisi', min: { value: 1, message: 'Nominal tidak boleh 0' } }}
                                                render={({ field }) => (
                                                    <CurrencyInput
                                                        {...field}
                                                        className={`w-full !pl-16 py-3 text-lg font-semibold ${paymentMode === 'Pas' ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-900 focus:ring-brand-500'}`}
                                                        error={!!errors.nominal}
                                                        disabled={paymentMode === 'Pas'}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <p className="text-sm text-gray-400 italic font-medium">
                                                {defaultNominal > 0 ? `*Tarif Dasar: ${formatRupiah(defaultNominal)} x ${selectedMonths.length} bln` : '*Menunggu pilihan warga'}
                                            </p>
                                            {errors.nominal && <p className="text-red-500 text-sm font-semibold">{errors.nominal.message}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* ROW 5: BUKTI */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                                        Lampiran Bukti (Opsional)
                                    </label>
                                    <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                                        <FileUpload
                                            onUploadSuccess={(url) => setValue('url_bukti', url)}
                                            existingUrls={watch('url_bukti') ? [watch('url_bukti')!] : []}
                                            onRemove={() => setValue('url_bukti', '')}
                                            label=""
                                            helperText="JPG, PNG maksimal 2MB &bull; Dikompres otomatis"
                                            onLoadingChange={setIsUploading}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-gray-400 font-medium">* Pastikan data warga dan nominal sudah benar.</p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/iuran')}
                                        className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isUploading || currentStatus === 'VERIFIED'}
                                        className={`px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all shadow-md active:scale-95 ${isUploading || currentStatus === 'VERIFIED' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
