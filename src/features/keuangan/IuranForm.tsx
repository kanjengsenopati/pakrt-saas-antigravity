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
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
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
                // Biarkan nominal 0 sampai bulan dipilih
                setValue('nominal', 0);

                if (config.jenis_pemasukan) {
                    try {
                        const parsedJenis = JSON.parse(config.jenis_pemasukan);
                        if (Array.isArray(parsedJenis)) {
                            // Filter for citizen-related items (Mandatory or Occasional/Insidental)
                            const citizenDues = parsedJenis.filter((item: any) => item.is_mandatory || item.is_occasional);
                            const categories = citizenDues.map((item: any) => item.nama);
                            
                            setKategoriOptions(categories);
                            
                            // Store the full objects for nominal lookup
                            (window as any)._citizen_dues_metadata = citizenDues;

                            if (!categories.includes(watch('kategori'))) {
                                setValue('kategori', categories[0] || 'Iuran Warga');
                            }
                        }
                    } catch (e) {
                        console.error("Gagal parse opsi kategori dari jenis_pemasukan", e);
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

    // Konsolidasi Kalkulasi Nominal (Mode Pas & Bebas)
    useEffect(() => {
        const shouldCalculate = !isEdit || (isEdit && hasInteracted);
        if (!shouldCalculate) return;

        if (paymentMode === 'Pas') {
            if (selectedMonths.length > 0 && defaultNominal > 0) {
                setValue('nominal', defaultNominal * selectedMonths.length);
            } else {
                setValue('nominal', 0);
            }
        }
    }, [selectedMonths, defaultNominal, paymentMode, setValue, isEdit, hasInteracted]);

    // Handle Metadata Nominal Update
    useEffect(() => {
        const metadata = (window as any)._citizen_dues_metadata;
        if (Array.isArray(metadata)) {
            const selected = metadata.find((m: any) => m.nama === watchKategori);
            if (selected && selected.nominal > 0) {
                setDefaultNominal(selected.nominal);
            }
        }
    }, [watchKategori]);

    useEffect(() => {
        if (watchWargaId && watchTahun && watchKategori && currentTenant) {
            const fetchBillingSummary = async () => {
                setIsLoadingBilling(true);
                try {
                    const result = await iuranService.getBillingSummary(
                        currentTenant.id,
                        watchWargaId, 
                        watchTahun, 
                        watchKategori, 
                        currentScope
                    );
                    setAlreadyPaid(result.totalPaid);
                    setPendingAmount(result.pendingAmount);
                    setPaidMonthsRecord(result.paidMonths || []);
                    setPendingMonthsRecord(result.pendingMonths || []);

                    // Sinkronisasi selectedMonths: Hapus bulan yang ternyata sudah dibayar/pending
                    setSelectedMonths(prev => {
                        const paid = result.paidMonths || [];
                        const pending = result.pendingMonths || [];
                        return prev.filter(m => !paid.includes(m) && !pending.includes(m));
                    });
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
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12 px-5">
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
                        <div className="bg-white rounded-2xl shadow-premium border border-slate-100 p-8 text-center animate-pulse">
                            <CircleNotch weight="bold" className="w-8 h-8 text-brand-500 animate-spin mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-400 tracking-tight">Memuat Data Tagihan...</p>
                        </div>
                    ) : watchWargaId && watchKategori ? (
                        <div className="bg-white rounded-[32px] shadow-premium border border-slate-100 overflow-hidden animate-in slide-in-from-left-4 duration-500">
                            <div className="bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <ChartPieSlice weight="fill" className="w-5 h-5 text-brand-200" />
                                        <span className="font-headline font-black text-white text-[10px] tracking-widest uppercase opacity-90">Ringkasan Kewajiban</span>
                                    </div>
                                    <Text.H1 className="!text-white !text-2xl !tracking-tight">Tahun {watchTahun || new Date().getFullYear()}</Text.H1>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-start pb-4 border-b border-slate-50">
                                    <div className="space-y-1">
                                        <span className="font-headline font-black text-slate-500 text-[10px] tracking-tight uppercase">Total Tagihan 12 Bulan</span>
                                        <div className="flex items-baseline gap-1">
                                            <Text.Amount className="!text-slate-900 !text-xl">{formatRupiah(defaultNominal * 12).replace(/,00$/, '')}</Text.Amount>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-headline font-black text-slate-400 text-[9px] uppercase">Tarif</span>
                                        <p className="text-[10px] font-black text-slate-500 tracking-tight">{formatRupiah(defaultNominal).replace(/,00$/, '')} / Bln</p>
                                    </div>
                                </div>

                                <div className="pb-4 border-b border-slate-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-headline font-black text-emerald-600 text-[10px] tracking-tight uppercase">Sudah Dibayar (Sistem)</span>
                                        <Text.Amount className="!text-emerald-600 !text-lg">{formatRupiah(alreadyPaid).replace(/,00$/, '')}</Text.Amount>
                                    </div>
                                    {pendingAmount > 0 ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100/50">
                                            <Clock weight="fill" className="w-3 h-3 text-amber-500" />
                                            <p className="text-[9px] font-black text-amber-700 tracking-tight">Menunggu Verifikasi: {formatRupiah(pendingAmount).replace(/,00$/, '')}</p>
                                        </div>
                                    ) : (
                                        <p className="text-[9px] font-bold text-slate-300 italic">Hingga periode saat ini</p>
                                    )}
                                </div>

                                <div className="p-5 bg-gradient-to-br from-brand-50 to-white rounded-3xl border border-brand-100 shadow-inner relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/40 to-transparent pointer-events-none" />
                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <span className="font-headline font-black text-brand-600 text-[9px] uppercase tracking-[0.2em] mb-2">Sisa Kewajiban</span>
                                        <Text.Amount className="!text-brand-700 !text-3xl !tracking-tighter">
                                            {formatRupiah(Math.max(0, (defaultNominal * 12) - alreadyPaid - pendingAmount)).replace(/,00$/, '')}
                                        </Text.Amount>
                                        <div className="mt-3 py-1 px-3 bg-brand-600 rounded-full">
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">
                                                {paymentMode === 'Pas' ? 'Otomatis Mode Pas' : 'Target Pelunasan'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <Users weight="duotone" className="w-8 h-8 text-slate-200" />
                            </div>
                            <div>
                                <Text.Label className="!text-slate-400 font-bold">Menunggu Data Warga</Text.Label>
                                <Text.Caption className="mt-1 block max-w-[160px] mx-auto !leading-relaxed">Pilih warga & jenis pembayaran untuk melihat ringkasan</Text.Caption>
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
                <div className="md:col-span-8 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
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
                                                <option key={w.id} value={w.id}>{w.nama}</option>
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
                                                        className={`py-2 px-1 text-sm font-bold rounded-xl border-2 transition-all relative ${
                                                            isPaid
                                                                ? 'bg-emerald-600 border-emerald-600 text-white cursor-not-allowed'
                                                                : isPending
                                                                    ? 'bg-amber-500 border-amber-500 text-white cursor-not-allowed opacity-90'
                                                                    : isSelected
                                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-200 scale-105 z-10'
                                                                        : 'bg-red-500 border-red-500 text-white hover:bg-red-600 hover:scale-105 active:scale-95'
                                                            }`}
                                                    >
                                                        {m.label.substring(0, 3)}
                                                        {isPaid ? (
                                                            <div className="absolute -top-2 -right-1 bg-white text-emerald-600 rounded-full p-0.5 shadow-sm border border-emerald-100">
                                                                <CheckCircle weight="fill" className="w-3 h-3" />
                                                            </div>
                                                        ) : isPending ? (
                                                            <div className="absolute -top-2 -right-1 bg-white text-amber-500 rounded-full p-0.5 shadow-sm border border-amber-100">
                                                                <Clock weight="fill" className="w-3 h-3" />
                                                            </div>
                                                        ) : isSelected && (
                                                            <div className="absolute -top-2 -right-1 bg-white text-blue-600 rounded-full p-0.5 shadow-sm border border-blue-100 animate-in zoom-in duration-300">
                                                                <CheckCircle weight="fill" className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedMonths.length === 0 && <p className="text-red-500 text-xs font-semibold mt-1.5 px-1">Minimal 1 bulan harus dipilih</p>}
                                    </div>

                                     {selectedMonths.length > 0 ? (
                                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
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
                                    ) : (
                                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center group">
                                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                <CalendarBlank weight="fill" className="text-slate-300 w-5 h-5" />
                                            </div>
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pilih Bulan Pembayaran</p>
                                            <p className="text-[10px] text-slate-400/60 mt-1 font-medium italic">Nominal otomatis muncul setelah periode dipilih</p>
                                        </div>
                                    )}
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
