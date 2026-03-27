import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Wilayah } from '../../types/database';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { locationService } from '../../services/locationService';
import { authService } from '../../services/authService';
import { Eye, EyeSlash, CheckCircle, ArrowLeft, ArrowRight, UserFocus, MapPin } from '@phosphor-icons/react';
import { PWAInstallBanner } from '../../components/pwa/PWAInstallBanner';

type WizardFormData = {
    provinsi: string;
    kabkota: string;
    kecamatan: string;
    keldesa: string;
    rw: string;
    rt: string;
    name: string;
    adminName: string;
    adminEmail?: string;
    adminPhone: string;
    password?: string;
    confirmPassword?: string;
};

export default function RegisterWizard() {
    const [step, setStep] = useState(1);
    const { register, handleSubmit, watch, setValue, getValues, trigger, formState: { errors } } = useForm<WizardFormData>({
        defaultValues: {
            provinsi: '', kabkota: '', kecamatan: '', keldesa: '',
            rw: '', rt: '',
            name: '',
            adminName: '', adminEmail: '', adminPhone: ''
        }
    });

    const navigate = useNavigate();
    const { refreshTenant } = useTenant();

    const [provinsis, setProvinsis] = useState<Wilayah[]>([]);
    const [kabkotas, setKabkotas] = useState<Wilayah[]>([]);
    const [kecamatans, setKecamatans] = useState<Wilayah[]>([]);
    const [keldesas, setKeldesas] = useState<Wilayah[]>([]);
    const [rws, setRws] = useState<Wilayah[]>([]);
    const [rts, setRts] = useState<Wilayah[]>([]);

    const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; role: string; phone: string } | null>(null);
    const [generatedTenantId, setGeneratedTenantId] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const watchProvinsi = watch('provinsi');
    const watchKabkota = watch('kabkota');
    const watchKecamatan = watch('kecamatan');
    const watchKeldesa = watch('keldesa');
    const watchRW = watch('rw');

    useEffect(() => { locationService.getProvinsi().then(setProvinsis); }, []);

    useEffect(() => {
        if (watchProvinsi) {
            locationService.getKabKota(watchProvinsi).then(data => {
                setKabkotas(data);
                if (data.length > 0 && !data.find((d: any) => d.id === getValues('kabkota'))) {
                    setValue('kabkota', ''); setValue('kecamatan', ''); setValue('keldesa', '');
                }
            });
        } else setKabkotas([]);
    }, [watchProvinsi, setValue, getValues]);

    useEffect(() => {
        if (watchKabkota) {
            locationService.getKecamatan(watchKabkota).then(data => {
                setKecamatans(data);
                if (data.length > 0 && !data.find((d: any) => d.id === getValues('kecamatan'))) {
                    setValue('kecamatan', ''); setValue('keldesa', '');
                }
            });
        } else setKecamatans([]);
    }, [watchKabkota, setValue, getValues]);

    useEffect(() => {
        if (watchKecamatan) {
            locationService.getKelDesa(watchKecamatan).then(data => {
                setKeldesas(data);
                if (data.length > 0 && !data.find((d: any) => d.id === getValues('keldesa'))) setValue('keldesa', '');
            });
        } else setKeldesas([]);
    }, [watchKecamatan, setValue, getValues]);

    useEffect(() => {
        if (watchKeldesa) {
            locationService.getRW(watchKeldesa).then(data => {
                setRws(data);
                if (data.length > 0 && !data.find((d: any) => d.id === getValues('rw'))) setValue('rw', '');
            });
        } else setRws([]);
    }, [watchKeldesa, setValue, getValues]);

    useEffect(() => {
        if (watchRW) {
            locationService.getRT(watchRW).then(data => {
                setRts(data);
                if (data.length > 0 && !data.find((d: any) => d.id === getValues('rt'))) setValue('rt', '');
            });
        } else setRts([]);
    }, [watchRW, setValue, getValues]);

    const handleNextStep = async () => {
        if (step === 1) {
            const isValid = await trigger(['provinsi', 'kabkota', 'kecamatan', 'keldesa', 'rw', 'rt']);
            if (!isValid) return;

            const values = getValues();
            // Use the raw last segment from the Wilayah IDs (e.g. "50" from "33.74.10.1011.50", "025" from "33.74.10.1011.50.025")
            // But parse them as integers to strip zero-padding
            const rwRaw = values.rw.split('.').pop() || '';
            const rtRaw = values.rt.split('.').pop() || '';
            const rwNum = parseInt(rwRaw, 10).toString();   // "050" → "50"
            const rtNum = parseInt(rtRaw, 10).toString();   // "025" → "25"
            const newTenantId = `${values.keldesa}.${rwNum}.${rtNum}`;
            setGeneratedTenantId(newTenantId);

            const result = await authService.checkTenant(newTenantId);
            if (result.exists) {
                setDuplicateWarning({
                    name: result.tenant?.adminName || 'Admin Wilayah',
                    role: 'Ketua RT / Admin',
                    phone: result.tenant?.adminPhone || 'Tersedia di data pusat'
                });
                return;
            } else setDuplicateWarning(null);
        }
        setStep(step + 1);
    };

    const onSubmit = async (data: WizardFormData) => {
        if (data.password !== data.confirmPassword) {
            alert("Password dan Konfirmasi Password tidak cocok!"); return;
        }

        try {
            // Derive display numbers from the Wilayah names (e.g. "RW 50" → "50", "RT 025" → "25")
            const rwEntry = rws.find(r => r.id === data.rw);
            const rtEntry = rts.find(r => r.id === data.rt);
            const kelEntry = keldesas.find(k => k.id === data.keldesa);
            const kecEntry = kecamatans.find(k => k.id === data.kecamatan);
            const kabEntry = kabkotas.find(k => k.id === data.kabkota);
            const provEntry = provinsis.find(p => p.id === data.provinsi);

            const rwNum = rwEntry?.name.replace(/^RW\s*/i, '').trim() || data.rw.split('.').pop() || '';
            const rtNum = rtEntry?.name.replace(/^RT\s*/i, '').trim() || data.rt.split('.').pop() || '';

            const tenantData = {
                id: generatedTenantId,
                name: data.name,
                subdomain: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                config: {
                    theme: 'emerald',
                    rt: rtNum,
                    rw: rwNum,
                    kelurahan: kelEntry?.name || '',
                    kecamatan: kecEntry?.name || '',
                    kota: kabEntry?.name?.replace(/^KOTA\s*/i, '').trim() || '',
                    provinsi: provEntry?.name || '',
                }
            };

            const userData = {
                id: `admin-${Date.now()}`,
                role: 'admin',
                name: data.adminName,
                email: data.adminEmail || '',
                kontak: data.adminPhone,
                password: data.password
            };

            await authService.register(tenantData, userData);

            await refreshTenant();
            navigate('/login');
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.error || 'Gagal registrasi pengelola. Pastikan data lengkap.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
            <PWAInstallBanner show={true} />
            {/* Top Navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition-colors">
                        <ArrowLeft weight="bold" className="w-4 h-4" /> Beranda
                    </button>
                    <div className="text-gray-600 font-medium">Bantuan? <span className="text-brand-600 font-bold">1500-PAKRT</span></div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 py-12">
                <div className="max-w-2xl w-full">
                    {/* Wizard Headers */}
                    <div className="text-center mb-10 animate-fade-in-up">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Mulai Kelola RT Anda</h1>
                        <p className="text-gray-500 text-lg">Pendaftaran resmi wilayah dan pengurus inti. Proses mudah dalam 2 langkah.</p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        {/* Progress Header */}
                        <div className="bg-gray-50/80 backdrop-blur-md px-8 py-5 flex items-center justify-center gap-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-brand-600 text-white shadow-md shadow-brand-500/40' : 'bg-gray-200 text-gray-500'}`}>
                                    {step > 1 ? <CheckCircle weight="fill" className="w-5 h-5 text-white" /> : '1'}
                                </div>
                                <span className={`font-bold text-sm ${step >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Pemetaan Wilayah</span>
                            </div>
                            <div className="w-8 md:w-16 h-1 bg-gray-200 rounded-full mx-2 relative overflow-hidden">
                                <div className={`absolute top-0 left-0 h-full bg-brand-500 transition-all duration-500 ${step > 1 ? 'w-full' : 'w-0'}`}></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= 2 ? 'bg-brand-600 text-white shadow-md shadow-brand-500/40' : 'bg-gray-200 text-gray-500'}`}>
                                    2
                                </div>
                                <span className={`font-bold text-sm transition-colors duration-300 ${step >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Profil Pengurus</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pb-10">
                            {/* STEP 1: Wilayah */}
                            {step === 1 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center gap-3 text-brand-600 mb-2">
                                        <MapPin weight="duotone" className="w-7 h-7" />
                                        <h3 className="text-xl font-extrabold text-gray-900 mt-1">Struktur Kodifikasi Wilayah</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100">Masukkan data sesuai dengan SK penetapan wilayah RT Anda. Ini digunakan sebagai Identifikasi Unik di seluruh Indonesia.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Provinsi <span className="text-red-500">*</span></label>
                                            <select {...register('provinsi', { required: true })} className={`w-full rounded-xl border-gray-200 shadow-sm p-3 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium ${errors.provinsi ? 'border-red-400' : ''}`}>
                                                <option value="">Pilih Provinsi</option>
                                                {provinsis.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Kabupaten/Kota <span className="text-red-500">*</span></label>
                                            <select {...register('kabkota', { required: true })} disabled={!watchProvinsi} className="w-full rounded-xl border-gray-200 shadow-sm p-3 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-gray-900">
                                                <option value="">Pilih Kab/Kota</option>
                                                {kabkotas.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Kecamatan <span className="text-red-500">*</span></label>
                                            <select {...register('kecamatan', { required: true })} disabled={!watchKabkota} className="w-full rounded-xl border-gray-200 shadow-sm p-3 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-gray-900">
                                                <option value="">Pilih Kecamatan</option>
                                                {kecamatans.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Kelurahan/Desa <span className="text-red-500">*</span></label>
                                            <select {...register('keldesa', { required: true })} disabled={!watchKecamatan} className="w-full rounded-xl border-gray-200 shadow-sm p-3 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-gray-900">
                                                <option value="">Pilih Kel/Desa</option>
                                                {keldesas.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Nomor RW <span className="text-red-500">*</span></label>
                                            <select {...register('rw', { required: true })} disabled={!watchKeldesa} className="w-full rounded-xl border-gray-200 shadow-sm p-3 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-gray-900">
                                                <option value="">Pilih RW</option>
                                                {rws.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Nomor RT <span className="text-red-500">*</span></label>
                                            <select {...register('rt', { required: true })} disabled={!watchRW} className="w-full rounded-xl border-gray-200 shadow-sm p-3 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium text-gray-900">
                                                <option value="">Pilih RT</option>
                                                {rts.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {duplicateWarning && (
                                        <div className="mt-6 p-5 border border-red-200 bg-red-50 rounded-2xl flex items-start gap-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-red-900">Registrasi Dihentikan: Wilayah Sudah Terdaftar</h3>
                                                <p className="mt-1 text-sm font-medium text-red-700">Wilayah RT ini telah didaftarkan dan sudah memiliki pengurus/admin aktif. Silakan hubungi pengurus terkait untuk mendapatkan akses:</p>
                                                <ul className="mt-2 space-y-1 text-sm font-bold text-red-900 break-words bg-red-100/50 p-3 rounded-xl border border-red-200/50">
                                                    <li>Admin: {duplicateWarning.name} ({duplicateWarning.role})</li>
                                                    <li>Kontak: {duplicateWarning.phone}</li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: Profile */}
                            {step === 2 && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center gap-3 text-brand-600 mb-2">
                                        <UserFocus weight="duotone" className="w-7 h-7" />
                                        <h3 className="text-xl font-extrabold text-gray-900 mt-1">Pembuatan Akun Pengurus</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-6 pb-6 border-b border-gray-100">Identitas yang dimasukkan akan bertindak sebagai Administrator utama (Super Admin) untuk memgelola wilayah ini.</p>

                                    <div className="bg-gradient-to-br from-brand-50 to-blue-50 border border-brand-100 p-5 rounded-2xl mb-8 flex items-center justify-between shadow-sm">
                                        <div>
                                            <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1">ID Pengelola Wilayah Anda</label>
                                            <div className="text-2xl font-mono font-bold text-brand-900 tracking-widest leading-none mt-1">{generatedTenantId}</div>
                                        </div>
                                        <div className="hidden sm:block">
                                            <CheckCircle weight="fill" className="w-10 h-10 text-brand-400 opacity-50" />
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Nama Organisasi Resmi <span className="text-red-500">*</span></label>
                                            <input {...register('name', { required: true })} placeholder="contoh: RT 05 RW 01 Puri Damai" className="w-full rounded-xl border-gray-200 shadow-sm p-3.5 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium" />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-bold text-gray-700">Nama Lengkap Administrator <span className="text-red-500">*</span></label>
                                            <input {...register('adminName', { required: true })} placeholder="Sesuai KTP Pengurus" className="w-full rounded-xl border-gray-200 shadow-sm p-3.5 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-bold text-gray-700">Nomor WhatsApp Aktif <span className="text-red-500">*</span></label>
                                                <input {...register('adminPhone', { required: true })} type="tel" placeholder="081..." className="w-full rounded-xl border-gray-200 shadow-sm p-3.5 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-bold text-gray-700">Email Pribadi <span className="text-gray-400 font-medium text-xs ml-1">(Opsional)</span></label>
                                                <input {...register('adminEmail')} type="email" placeholder="email@gmail.com" className="w-full rounded-xl border-gray-200 shadow-sm p-3.5 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-bold text-gray-700">Password Akun <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input
                                                        {...register('password', { required: true, minLength: 6 })}
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Minimal 6 karakter"
                                                        className={`w-full rounded-xl border-gray-200 shadow-sm p-3.5 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium pr-12 ${errors.password ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                                                    />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                        {showPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-bold text-gray-700">Konfirmasi Password <span className="text-red-500">*</span></label>
                                                <div className="relative">
                                                    <input
                                                        {...register('confirmPassword', { required: true })}
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Ulangi sandi rahasia"
                                                        className={`w-full rounded-xl border-gray-200 shadow-sm p-3.5 border focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 transition-all bg-gray-50 focus:bg-white text-gray-900 font-medium pr-12 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500/20' : ''}`}
                                                    />
                                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                        {showConfirmPassword ? <EyeSlash className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wizard Footer Actions */}
                            <div className="flex items-center justify-between pt-8 mt-10 border-t border-gray-100">
                                {step > 1 ? (
                                    <button type="button" onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl text-gray-700 font-bold transition-all hover:bg-gray-50 active:scale-95">
                                        <ArrowLeft weight="bold" className="w-4 h-4" /> Kembali
                                    </button>
                                ) : <div />}

                                {step < 2 ? (
                                    <button type="button" onClick={handleNextStep} className="flex items-center gap-2 px-8 py-3.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/30 active:scale-95">
                                        Lanjut ke Akun <ArrowRight weight="bold" className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button type="submit" className="flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-95">
                                        <CheckCircle weight="bold" className="w-5 h-5" /> Selesaikan & Buat Akun
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 font-medium">
                            Sudah pernah mendaftarkan RT Anda?{' '}
                            <button onClick={() => navigate('/login')} className="text-brand-600 font-bold hover:text-brand-700 hover:underline px-1">
                                Masuk Disini
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
