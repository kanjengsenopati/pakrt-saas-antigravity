import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { iuranService } from '../../services/iuranService';
import { wargaService } from '../../services/wargaService';
import { pengaturanService } from '../../services/pengaturanService';
import { PembayaranIuran, Warga } from '../../database/db';
import { Text } from '../../components/ui/Typography';
import { ArrowLeft, CheckCircle, CircleNotch, CaretDown, Warning, Copy, Bank } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';
import { formatRupiah } from '../../utils/currency';
import { parseApiError } from '../../utils/errorParser';

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
    const { user: authUser } = useAuth();
    const isWarga = authUser?.role?.toLowerCase() === 'warga' || authUser?.role_entity?.name?.toLowerCase() === 'warga';
    const loggedInWargaId = authUser?.id && isWarga ? (authUser as any).warga_id || authUser.id : null;

    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [defaultNominal, setDefaultNominal] = useState(0);
    const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
    const [tahunOptions, setTahunOptions] = useState<number[]>([new Date().getFullYear()]);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoadingBilling, setIsLoadingBilling] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [currentStatus, setCurrentStatus] = useState<'PENDING' | 'VERIFIED' | 'REJECTED' | null>(null);

    const [paidMonthsRecord, setPaidMonthsRecord] = useState<number[]>([]);
    const [pendingMonthsRecord, setPendingMonthsRecord] = useState<number[]>([]);

    const invoiceId = useMemo(() => {
        const d = new Date();
        const rand = Math.floor(100 + Math.random() * 900);
        return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${rand}`;
    }, []);

    const { register, handleSubmit, setValue, watch } = useForm<IuranFormData>({
        defaultValues: {
            tanggal_bayar: new Date().toISOString().split('T')[0],
            periode_tahun: new Date().getFullYear(),
            warga_id: loggedInWargaId || '',
            kategori: 'Iuran Warga',
            nominal: 0
        }
    });

    const watchWargaId = watch('warga_id');
    const watchTahun = watch('periode_tahun');

    useEffect(() => {
        if (loggedInWargaId && !isEdit) {
            setValue('warga_id', loggedInWargaId);
        }
        if (currentTenant) {
            wargaService.getAll(currentTenant.id, currentScope).then(data => setWargaList(data.items || []));
            
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
                    }
                });
            }

            pengaturanService.getAll(currentTenant.id, currentScope).then(items => {
                const config: Record<string, any> = {};
                items.forEach(item => { config[item.key] = item.value; });
                
                const baseIuran = Number(config.iuran_per_bulan || config.iuran_tetap_dihuni || 100000);
                setDefaultNominal(baseIuran);

                if (config.opsi_tahun_iuran) {
                    try {
                        const parsedTahun = JSON.parse(config.opsi_tahun_iuran);
                        if (Array.isArray(parsedTahun) && parsedTahun.length > 0) {
                            setTahunOptions(parsedTahun);
                            if (!parsedTahun.includes(watchTahun)) {
                                setValue('periode_tahun', parsedTahun[0]);
                            }
                        }
                    } catch (e) {
                        console.error("Gagal parse opsi tahun", e);
                    }
                }
            });
        }
    }, [currentTenant, currentScope, isEdit, id, loggedInWargaId, setValue, watchTahun]);

    useEffect(() => {
        if (watchWargaId && watchTahun && currentTenant) {
            const fetchBilling = async () => {
                setIsLoadingBilling(true);
                try {
                    const result = await iuranService.getBillingSummary(
                        currentTenant.id, watchWargaId, watchTahun, 'Iuran Warga', currentScope
                    );
                    setPaidMonthsRecord(result.paidMonths || []);
                    setPendingMonthsRecord(result.pendingMonths || []);
                    
                    if (!isEdit) {
                        setSelectedMonths(prev => prev.filter(m => !result.paidMonths?.includes(m) && !result.pendingMonths?.includes(m)));
                    }
                } catch (error) {
                    console.error("Failed to fetch billing:", error);
                } finally {
                    setIsLoadingBilling(false);
                }
            };
            fetchBilling();
        }
    }, [watchWargaId, watchTahun, currentTenant, currentScope, isEdit]);

    const toggleMonth = (val: number) => {
        if (paidMonthsRecord.includes(val) || pendingMonthsRecord.includes(val)) return;
        setSelectedMonths(prev => 
            prev.includes(val) ? prev.filter(m => m !== val) : [...prev, val].sort((a, b) => a - b)
        );
    };

    const totalPayment = useMemo(() => {
        return defaultNominal * selectedMonths.length;
    }, [defaultNominal, selectedMonths]);

    useEffect(() => {
        setValue('nominal', totalPayment);
    }, [totalPayment, setValue]);

    const onSubmit = async (data: IuranFormData) => {
        setErrorMessage(null);
        if (!currentTenant) return;
        if (selectedMonths.length === 0) {
            setErrorMessage("Harap pilih minimal 1 bulan pembayaran.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                periode_bulan: selectedMonths,
                tenant_id: currentTenant.id,
                scope: currentScope,
                kategori: 'Iuran Warga',
                metadata: { mode: 'Pas', source: isWarga ? 'warga_app' : 'pengurus_dashboard' }
            };
            
            if (isEdit && id) {
                if (currentStatus === 'REJECTED') {
                    await iuranService.resubmit(id, { url_bukti: payload.url_bukti });
                } else {
                    await iuranService.update(id, payload);
                }
            } else {
                (payload as any).status = isWarga ? 'PENDING' : 'VERIFIED';
                await iuranService.create(payload);
            }
            navigate('/iuran');
        } catch (error: any) {
            console.error(error);
            setErrorMessage(parseApiError(error, "Gagal menyimpan data iuran."));
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedWargaName = useMemo(() => {
        const w = wargaList.find(x => x.id === watchWargaId);
        return w ? w.nama : '-';
    }, [wargaList, watchWargaId]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Nomor rekening disalin!');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-32 px-5 pt-4">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/iuran')}
                    className="p-2 hover:bg-slate-100 bg-transparent text-slate-500 rounded-full transition-colors"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <Text.H1 className="!text-xl">{isWarga ? 'Bill Payment' : 'Catat Pembayaran Iuran'}</Text.H1>
            </div>

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-[16px] flex items-start gap-3 animate-shake">
                    <Warning className="w-5 h-5 shrink-0 mt-0.5" />
                    <Text.Label className="!text-red-600">{errorMessage}</Text.Label>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Text.Label className="!text-slate-500">Tahun</Text.Label>
                        <div className="relative">
                            <select
                                {...register('periode_tahun', { required: true, valueAsNumber: true })}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-[12px] px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-sm transition-all"
                            >
                                {tahunOptions.map(th => <option key={th} value={th}>{th}</option>)}
                            </select>
                            <CaretDown weight="bold" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Text.Label className="!text-slate-500">Tanggal Pembayaran</Text.Label>
                        <div className="relative">
                            <input
                                type="date"
                                {...register('tanggal_bayar', { required: true })}
                                className="w-full appearance-none bg-white border border-slate-200 rounded-[12px] px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 shadow-sm transition-all [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100"
                            />
                        </div>
                    </div>
                </div>

                {!isWarga && (
                    <div className="space-y-1">
                        <Text.Label className="!text-slate-500">Pilih Warga Pembayar <span className="text-red-500">*</span></Text.Label>
                        <select
                            {...register('warga_id', { required: 'Warga wajib dipilih' })}
                            className="w-full bg-white border border-slate-200 rounded-[12px] px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-brand-500 shadow-sm"
                        >
                            <option value="">-- Pilih Warga --</option>
                            {wargaList.map(w => <option key={w.id} value={w.id}>{w.nama}</option>)}
                        </select>
                    </div>
                )}

                <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
                        <Text.H2 className="!text-[15px]">Daftar Bayar</Text.H2>
                        <Text.Label className="!text-brand-600 !normal-case tracking-normal cursor-pointer active:scale-95 transition-transform" onClick={() => {
                            const available = MONTHS.map(m => m.value).filter(m => !paidMonthsRecord.includes(m) && !pendingMonthsRecord.includes(m));
                            setSelectedMonths(available);
                        }}>Pilih semua</Text.Label>
                    </div>
                    
                    {isLoadingBilling ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
                            <CircleNotch weight="bold" className="w-8 h-8 text-brand-500 animate-spin" />
                            <Text.Label className="!text-slate-400">Memuat status tagihan...</Text.Label>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {MONTHS.map(m => {
                                const isPaid = paidMonthsRecord.includes(m.value);
                                const isPending = pendingMonthsRecord.includes(m.value);
                                const isSelected = selectedMonths.includes(m.value);

                                return (
                                    <div 
                                        key={m.value} 
                                        onClick={() => toggleMonth(m.value)}
                                        className={`flex justify-between items-center p-4 transition-colors ${
                                            isPaid || isPending ? 'opacity-70 bg-slate-50/50' : 'cursor-pointer hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ${
                                                isPaid ? 'bg-emerald-500 border-emerald-500' :
                                                isSelected ? 'bg-brand-600 border-brand-600' : 
                                                'border-slate-300 bg-white'
                                            }`}>
                                                {(isSelected || isPaid) && <CheckCircle weight="bold" className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <Text.Body className="!font-medium">{m.label}</Text.Body>
                                        </div>
                                        
                                        <div>
                                            {isPaid ? (
                                                <div className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Lunas</div>
                                            ) : isPending ? (
                                                <div className="px-4 py-1.5 bg-amber-100 text-amber-600 rounded-full text-xs font-bold">Menunggu</div>
                                            ) : isSelected ? (
                                                <div className="px-4 py-1.5 bg-brand-600 text-white rounded-full text-xs font-bold shadow-md">Bayar</div>
                                            ) : (
                                                <div className="px-4 py-1.5 bg-brand-50 text-brand-600 rounded-full text-xs font-bold hover:bg-brand-100 transition-colors">Bayar</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {isWarga && selectedMonths.length > 0 && (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mt-8">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                                <div className="space-y-1">
                                    <Text.Label className="!text-slate-500">INVOICE ID</Text.Label>
                                    <Text.H2 className="!text-brand-600 !text-[18px]">{invoiceId}</Text.H2>
                                </div>
                                <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                    UNPAID
                                </div>
                            </div>
                            
                            <div className="p-5 border-b border-slate-100">
                                <Text.Label className="!text-slate-500 mb-1">NAMA WARGA</Text.Label>
                                <Text.H2 className="!text-[16px]">{selectedWargaName}</Text.H2>
                            </div>

                            <div className="p-5 border-b border-slate-100 space-y-4">
                                <Text.Label className="!text-slate-500 mb-2">BILLING DETAILS</Text.Label>
                                
                                {selectedMonths.map(m => {
                                    const monthLabel = MONTHS.find(x => x.value === m)?.label;
                                    return (
                                        <div key={m} className="flex justify-between items-start pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div>
                                                <Text.H2 className="!text-[14px]">{monthLabel} {watchTahun}</Text.H2>
                                                <Text.Caption className="!text-slate-400 mt-0.5">Iuran Bulanan Rutin</Text.Caption>
                                            </div>
                                            <Text.H2 className="!text-[14px]">{formatRupiah(defaultNominal)}</Text.H2>
                                        </div>
                                    );
                                })}

                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <Text.Body className="!text-slate-500">Subtotal</Text.Body>
                                    <Text.Body>{formatRupiah(totalPayment)}</Text.Body>
                                </div>
                                <div className="flex justify-between items-center bg-blue-50/50 p-3 rounded-[12px]">
                                    <Text.H2 className="!text-[15px]">Total Payment</Text.H2>
                                    <Text.Amount className="!text-brand-600 !text-[20px]">{formatRupiah(totalPayment)}</Text.Amount>
                                </div>
                            </div>

                            <div className="p-5 bg-slate-50/30">
                                <Text.Label className="!text-slate-500 mb-3">PAYMENT DESTINATION</Text.Label>
                                <div className="bg-white border border-slate-200 rounded-[16px] p-4 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-[12px] flex items-center justify-center text-blue-600">
                                            <Bank weight="duotone" className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <Text.H2 className="!text-[15px]">Bank BCA</Text.H2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Text.Caption className="!font-mono !text-slate-600">1234567890</Text.Caption>
                                                <Copy onClick={() => copyToClipboard('1234567890')} weight="bold" className="w-3.5 h-3.5 text-brand-600 cursor-pointer active:scale-95" />
                                            </div>
                                            <Text.Caption className="!text-[10px] !text-slate-500">A/N: KAS WARGA</Text.Caption>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 bg-amber-50 border border-amber-100 p-3 rounded-[12px] flex items-start gap-3">
                                    <Warning weight="fill" className="text-amber-500 shrink-0 w-5 h-5" />
                                    <Text.Caption className="!text-amber-700 !font-medium !leading-relaxed">
                                        Mohon transfer sesuai dengan Total Payment untuk mempercepat proses verifikasi oleh Bendahara.
                                    </Text.Caption>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4">
                            <Text.H2 className="!text-[16px]">Upload Bukti Bayar</Text.H2>
                            <div className="bg-white border-2 border-dashed border-brand-200 rounded-[24px] p-6 hover:bg-brand-50/50 transition-colors">
                                <FileUpload
                                    onUploadSuccess={(url) => setValue('url_bukti', url)}
                                    existingUrls={watch('url_bukti') ? [watch('url_bukti')!] : []}
                                    onRemove={() => setValue('url_bukti', '')}
                                    label=""
                                    helperText="Tarik file ke sini atau klik pilih. Maks. 5MB"
                                    onLoadingChange={setIsUploading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-slate-100 z-50 md:relative md:bg-transparent md:border-none md:p-0">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        {isWarga ? (
                            <button
                                type="submit"
                                disabled={isSubmitting || isUploading || selectedMonths.length === 0}
                                className="w-full py-4 bg-brand-600 text-white rounded-[16px] text-[15px] font-bold shadow-[0_8px_20px_rgb(37,99,235,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting || isUploading ? <CircleNotch weight="bold" className="w-5 h-5 animate-spin" /> : <CheckCircle weight="bold" className="w-5 h-5" />}
                                Konfirmasi Pembayaran
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting || selectedMonths.length === 0}
                                className="w-full py-4 bg-brand-600 text-white rounded-[16px] text-[15px] font-bold shadow-[0_8px_20px_rgb(37,99,235,0.25)] flex justify-center items-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <CircleNotch weight="bold" className="w-5 h-5 animate-spin" /> : <CheckCircle weight="bold" className="w-5 h-5" />}
                                Simpan Pembayaran Tunai
                            </button>
                        )}
                    </div>
                </div>

            </form>
        </div>
    );
}
