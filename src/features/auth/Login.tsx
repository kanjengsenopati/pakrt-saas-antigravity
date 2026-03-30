import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { Eye, EyeSlash, SignIn, ArrowLeft, Flashlight, House, Article, Wallet, Users } from '@phosphor-icons/react';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { PWAInstallBanner } from '../../components/pwa/PWAInstallBanner';

type LoginFormData = {
    contactOrEmail: string;
    password: string;
};

export default function Login() {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>();
    const navigate = useNavigate();
    const { refreshTenant } = useTenant();
    const { login: authLogin } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem('remember_email');
        if (savedEmail) {
            setValue('contactOrEmail', savedEmail);
            setRememberMe(true);
        }
    }, [setValue]);

    const fillDemo = (email: string, pass: string) => {
        setValue('contactOrEmail', email);
        setValue('password', pass);
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setLoginError(null);
        try {
            if (rememberMe) {
                localStorage.setItem('remember_email', data.contactOrEmail);
            } else {
                localStorage.removeItem('remember_email');
            }

            const result = await authService.login(data.contactOrEmail, data.password);
            if (result.user && result.token) {
                authLogin(result.token, result.user);
                await refreshTenant();
                
                // Role-based redirection
                const isWarga = result.user.role?.toLowerCase() === 'warga' || 
                                result.user.role_entity?.name?.toLowerCase() === 'warga';
                
                if (isWarga) {
                    navigate('/warga-portal');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setLoginError("Kredensial tidak valid. Silakan coba lagi.");
            }
        } catch (error: any) {
            let message = "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.";

            if (!error.response) {
                // Network error (no response from server)
                message = "Gagal terhubung ke server. Pastikan koneksi internet Anda stabil.";
            } else if (error.response.status === 404) {
                message = "Akun tidak ditemukan. Silakan periksa kembali email atau nomor WhatsApp Anda.";
            } else if (error.response.status === 401) {
                message = "Password yang Anda masukkan salah. Silakan coba lagi.";
            } else if (error.response.data?.error) {
                message = error.response.data.error;
            }

            setLoginError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen bg-white flex flex-col md:flex-row font-sans selection:bg-brand-500 selection:text-white overflow-hidden">
            <PWAInstallBanner show={true} />
            {/* Left Panel - Brand Display */}
            <div className="hidden md:flex flex-col justify-between w-[45%] bg-slate-50 p-10 lg:p-14 text-slate-900 relative overflow-hidden shrink-0 border-r border-slate-100">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[30rem] h-[30rem] bg-brand-50 rounded-full blur-[120px] opacity-60"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[24rem] h-[24rem] bg-brand-50 rounded-full blur-[100px] opacity-40"></div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-10">
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em]">
                            <ArrowLeft weight="bold" className="w-3.5 h-3.5" /> Beranda
                        </button>
                        <div className="inline-flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100">
                            <SignIn weight="bold" className="w-5 h-5 text-brand-600" />
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-start max-w-sm">
                        <div className="mb-8">
                            <h1 className="text-[20px] font-bold tracking-tight text-slate-900 mb-2 leading-tight">
                                Portal <span className="text-brand-600 font-bold">PAKRT</span>
                            </h1>
                            <p className="text-slate-500 text-[14px] leading-relaxed font-semibold">
                                Sistem Manajemen RT Cerdas
                            </p>
                        </div>

                        {/* Compact Demo Box */}
                        <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-slate-100 p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-slate-400 uppercase text-[9px] font-bold tracking-widest">
                                <Flashlight weight="fill" className="w-3.5 h-3.5 text-yellow-500" /> Quick Access Login
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { role: 'Ketua RT', email: 'ketuart@pakrt.id', icon: <House weight="duotone" /> },
                                    { role: 'Sekretaris', email: 'sekretaris@pakrt.id', icon: <Article weight="duotone" /> },
                                    { role: 'Bendahara', email: 'bendahara@pakrt.id', icon: <Wallet weight="duotone" /> },
                                    { role: 'Warga', email: 'warga@pakrt.id', icon: <Users weight="duotone" /> },
                                ].map((demo, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => fillDemo(demo.email, 'password123')}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors">
                                                {demo.icon}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[14px] font-bold text-slate-900 leading-none mb-1">{demo.role}</div>
                                                <div className="text-[12px] font-medium text-slate-500 leading-none">{demo.email}</div>
                                            </div>
                                        </div>
                                        <SignIn weight="bold" className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-600 transition-colors" />
                                    </button>
                                ))}
                            </div>
                            <div className="mt-4 text-center">
                                <span className="text-[9px] text-slate-400 font-bold italic bg-slate-50 px-2 py-1 rounded-full border border-slate-100">Password: password123</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-100">
                        <div className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">
                            © {new Date().getFullYear()} PT PakRT Digital.
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-20 relative h-full bg-white">
                <button onClick={() => navigate('/')} className="md:hidden absolute top-6 left-6 flex items-center gap-1.5 text-slate-400 hover:text-slate-900 transition-colors text-[10px] font-bold uppercase tracking-widest">
                    <ArrowLeft weight="bold" className="w-3.5 h-3.5" /> Kembali
                </button>

                <div className="w-full max-w-[360px] animate-fade-in-up">
                    <div className="mb-10">
                        <h2 className="text-[20px] font-bold text-slate-900 mb-2 tracking-tight">Login Akun</h2>
                        <p className="text-slate-500 text-[14px] leading-relaxed">Selamat Datang Kembali! Silakan Masuk Untuk Mengelola Wilayah RT Anda.</p>
                    </div>

                    {loginError && (
                        <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg text-[11px] text-red-600 flex items-start gap-2 animate-fade-in font-bold">
                            <div className="shrink-0 mt-0.5 text-red-500 italic">!</div>
                            <span>{loginError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[14px] text-slate-500 ml-1">Email / No Whatsapp</label>
                            <input
                                {...register('contactOrEmail', { required: true })}
                                placeholder="Nama@Email.Com"
                                className={`w-full rounded-xl border-slate-200 p-3.5 text-[14px] border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-normal text-slate-900 ${errors.contactOrEmail ? 'border-red-300 bg-red-50/30' : ''}`}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-[14px] text-slate-500">Kata Sandi</label>
                                <a href="#" className="text-[12px] font-semibold text-brand-600 hover:text-brand-700 tracking-wide">Lupa Kata Sandi?</a>
                            </div>
                            <div className="relative">
                                <input
                                    {...register('password', { required: true })}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={`w-full rounded-xl border-slate-200 p-3.5 text-[14px] border focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500/50 transition-all outline-none bg-slate-50/50 focus:bg-white font-normal text-slate-900 pr-12 ${errors.password ? 'border-red-300 bg-red-50/30' : ''}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center ml-1">
                            <label className="flex items-center gap-2.5 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 border-slate-300 rounded text-brand-600 focus:ring-brand-500/20 transition-all cursor-pointer" 
                                />
                                <span className="text-[14px] text-slate-500 group-hover:text-slate-700 transition-colors">Ingat Akun Saya</span>
                            </label>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 px-6 bg-brand-600 text-white rounded-xl font-normal text-[14px] hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/10 active:scale-[0.98] flex items-center justify-center disabled:opacity-70 gap-3 border border-brand-500"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Masuk Sekarang</span>
                                        <SignIn weight="bold" className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center border-t border-slate-50 pt-8">
                        <p className="text-[14px] text-slate-400">
                            Belum Mendaftar?{' '}
                            <button
                                onClick={() => navigate('/register')}
                                className="text-brand-600 font-bold hover:text-brand-700 px-1 ml-1"
                            >
                                Daftar Sekarang
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
