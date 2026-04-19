import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { parseApiError } from '../../utils/errorParser';
import { Eye, EyeSlash, ArrowLeft, UserPlus, CheckCircle } from '@phosphor-icons/react';

type JoinFormData = {
    nik: string;
    nama: string;
    email: string;
    kontak: string;
    alamat: string;
    password: string;
    confirmPassword: string;
};

export default function JoinRT() {
    const { tenantId } = useParams<{ tenantId: string }>();
    const { register, handleSubmit } = useForm<JoinFormData>();
    const navigate = useNavigate();
    
    const [tenantName, setTenantName] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        const verifyTenant = async () => {
            if (!tenantId) return;
            try {
                const result = await authService.checkTenant(tenantId);
                if (result.exists) {
                    setTenantName(result.tenant.name);
                } else {
                    setError("Link pendaftaran tidak valid atau RT tidak ditemukan.");
                }
            } catch (err) {
                setError("Gagal memverifikasi kode RT.");
            }
        };
        verifyTenant();
    }, [tenantId]);

    const onSubmit = async (data: JoinFormData) => {
        if (data.password !== data.confirmPassword) {
            setError("Password konfirmasi tidak cocok.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            if (!tenantId) throw new Error("Tenant ID missing");
            
            const residentData = {
                nik: data.nik,
                name: data.nama,
                email: data.email,
                kontak: data.kontak,
                alamat: data.alamat,
                password: data.password,
                scope: 'RT'
            };

            await authService.joinResident(tenantId, residentData);
            setIsSuccess(true);
        } catch (err: any) {
            console.error("Join failed:", err);
            setError(parseApiError(err, "Pendaftaran gagal. Silakan coba lagi."));
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-brand-500/5 p-8 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle weight="fill" className="text-green-500 w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Pendaftaran Terkirim!</h2>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        Data Anda berhasil didaftarkan ke <span className="font-bold text-brand-600">{tenantName}</span>. 
                        Silakan tunggu Admin RT melakukan verifikasi sebelum Anda dapat login.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-[12px] uppercase tracking-[0.2em] hover:bg-brand-700 transition-all"
                    >
                        Ke Halaman Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-brand-500 selection:text-white">
            <div className="hidden md:flex flex-col justify-between w-[40%] bg-brand-600 p-10 lg:p-14 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-brand-400 rounded-full blur-[120px] opacity-30"></div>
                
                <div className="relative z-10">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-brand-200 hover:text-white transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em]">
                        <ArrowLeft weight="bold" className="w-3.5 h-3.5" /> Beranda
                    </button>
                    
                    <div className="mt-20">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl mb-6">
                            <UserPlus weight="bold" className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
                            Gabung dengan <br />
                            <span className="text-brand-200">{tenantName || 'Lingkungan RT'}</span>
                        </h1>
                        <p className="text-brand-100 text-sm leading-relaxed max-w-xs">
                            Lengkapi data diri Anda untuk bergabung secara resmi dan mulai mengakses layanan digital RT.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 pt-8 border-t border-white/10">
                    <div className="text-brand-200 text-[9px] font-bold uppercase tracking-[0.2em]">
                        © {new Date().getFullYear()} PT PakRT Digital.
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 bg-white">
                <div className="w-full max-w-[480px]">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Formulir Pendaftaran</h2>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed">Pastikan NIK dan Nama sesuai dengan KTP Anda.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-bold flex gap-3 italic">
                            <span>!</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">NIK (KTP)</label>
                                <input
                                    {...register('nik', { required: true, minLength: 5 })}
                                    placeholder="16 Digit NIK"
                                    className="w-full rounded-xl border-slate-200 p-3.5 text-sm border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
                                <input
                                    {...register('nama', { required: true })}
                                    placeholder="Sesuai KTP"
                                    className="w-full rounded-xl border-slate-200 p-3.5 text-sm border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
                                <input
                                    {...register('email', { required: true })}
                                    type="email"
                                    placeholder="nama@email.com"
                                    className="w-full rounded-xl border-slate-200 p-3.5 text-sm border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">No. WhatsApp</label>
                                <input
                                    {...register('kontak', { required: true })}
                                    placeholder="0812..."
                                    className="w-full rounded-xl border-slate-200 p-3.5 text-sm border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Alamat Domisili</label>
                            <textarea
                                {...register('alamat', { required: true })}
                                placeholder="Alamat lengkap saat ini"
                                rows={2}
                                className="w-full rounded-xl border-slate-200 p-3.5 text-sm border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-medium"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        {...register('password', { required: true, minLength: 6 })}
                                        type={showPassword ? "text" : "password"}
                                        className="w-full rounded-xl border-slate-200 p-3.5 text-sm border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                        {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Konfirmasi</label>
                                <input
                                    {...register('confirmPassword', { required: true })}
                                    type="password"
                                    className="w-full rounded-xl border-slate-200 p-3.5 text-sm border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-medium"
                                />
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading || !tenantName}
                                className="w-full py-4 px-6 bg-brand-600 text-white rounded-xl font-bold text-[12px] uppercase tracking-[0.2em] hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/10 active:scale-[0.98] flex items-center justify-center disabled:opacity-50 gap-3"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Daftar Sekarang</span>
                                        <CheckCircle weight="bold" className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                            Pendaftaran ini akan diverifikasi oleh Admin RT terkait untuk memastikan keamanan data lingkungan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
