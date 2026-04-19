import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { 
    Envelope, 
    Lock, 
    Eye, 
    EyeSlash, 
    ArrowLeft, 
    ArrowRight, 
    Question
} from '@phosphor-icons/react';
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
            if (result.user) {
                authLogin(result.user);
                await refreshTenant();
                
                // Route based on role
                if (result.user.role === 'super_admin') {
                    navigate('/super-admin');
                } else {
                    const isWarga = result.user.role?.toLowerCase() === 'warga' || 
                                    result.user.role_entity?.name?.toLowerCase() === 'warga';
                    
                    if (isWarga) {
                        navigate('/warga-portal');
                    } else {
                        navigate('/dashboard');
                    }
                }
            } else {
                setLoginError("Kredensial tidak valid. Silakan coba lagi.");
            }
        } catch (error: any) {
            let message = "Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.";
            if (!error.response) {
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
        <div className="bg-surface font-body text-on-surface min-h-screen flex flex-col selection:bg-primary selection:text-white overflow-x-hidden">
            <PWAInstallBanner show={true} />
            
            {/* High-Tech Hero Section */}
            <section className="relative bg-gradient-to-br from-[#001a4d] via-[#003399] to-[#0050d4] pt-4 pb-24 overflow-hidden">
                {/* Tech Patterns */}
                <div className="absolute inset-0 tech-grid pointer-events-none opacity-40"></div>
                <div className="absolute inset-0 hero-glow pointer-events-none opacity-40"></div>
                <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
                
                {/* Top Navigation */}
                <header className="relative w-full flex items-center px-6 py-4 z-10 justify-center">
                    <div className="flex items-center gap-2 w-full justify-center relative">
                        <button 
                            onClick={() => navigate('/')}
                            className="absolute left-0 p-2 text-white/80 hover:text-white transition-colors"
                        >
                            <ArrowLeft weight="bold" size={24} />
                        </button>
                        <h1 className="text-lg font-bold tracking-tighter text-white font-headline opacity-90">Aplikasi PAK-RT</h1>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20 absolute right-6">
                        <Question weight="bold" size={18} className="text-white" />
                    </div>
                </header>

                {/* Hero Content */}
                <div className="relative px-6 mt-8 z-10 text-center flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
                    <h2 className="text-2xl md:text-3xl font-headline font-extrabold leading-tight editorial-spacing text-white mb-3">
                        Selamat Datang Kembali
                    </h2>
                    <p className="text-white/70 font-body text-sm max-w-xs md:max-w-md">
                        Akses portal layanan warga premium Anda dengan aman dan cepat melalui sistem terintegrasi.
                    </p>
                </div>
            </section>

            {/* Login Card Main Area */}
            <main className="flex-1 flex flex-col items-center px-6 pb-12 -mt-12 relative">
                <div className="w-full max-w-md relative z-20">
                    {/* Login Card */}
                    <div className="bg-white rounded-[1.5rem] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {loginError && (
                            <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl text-xs font-bold text-error animate-fade-in flex items-start gap-3">
                                <div className="shrink-0 w-5 h-5 rounded-full bg-error text-white flex items-center justify-center text-[10px]">!</div>
                                <span>{loginError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email/WA Field */}
                            <div className="space-y-2">
                                <label className="block font-medium text-[0.75rem] font-bold text-on-surface-variant px-1 tracking-tight">Email atau Nomor WhatsApp</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                                        <Envelope weight="bold" size={20} />
                                    </div>
                                    <input 
                                        {...register('contactOrEmail', { required: true })}
                                        className={`block w-full !pl-14 pr-4 py-4 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-outline/60 text-on-surface text-sm font-medium ${errors.contactOrEmail ? 'ring-2 ring-error/20 bg-error/5' : ''}`}
                                        placeholder="nama@email.com" 
                                        type="text"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label className="block font-medium text-[0.75rem] font-bold text-on-surface-variant px-1 tracking-tight">Kata Sandi</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                                        <Lock weight="bold" size={20} />
                                    </div>
                                    <input 
                                        {...register('password', { required: true })}
                                        className={`block w-full !pl-14 pr-12 py-4 bg-surface-container-highest border-0 rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-outline/60 text-on-surface text-sm font-medium ${errors.password ? 'ring-2 ring-error/20 bg-error/5' : ''}`}
                                        placeholder="••••••••" 
                                        type={showPassword ? "text" : "password"}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline hover:text-on-surface transition-colors"
                                    >
                                        {showPassword ? <EyeSlash weight="bold" size={20} /> : <Eye weight="bold" size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="flex items-center justify-between py-1 px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                        className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer" 
                                    />
                                    <span className="text-xs font-semibold text-on-surface-variant group-hover:text-on-surface transition-colors">Ingat Saya</span>
                                </label>
                                <a href="#" className="text-xs font-bold text-primary hover:text-primary-dim transition-colors">Lupa Sandi?</a>
                            </div>

                            {/* Submit Button */}
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary hover:bg-primary-dim text-on-primary py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed group"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Masuk Sekarang</span>
                                        <ArrowRight weight="bold" size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            {/* Divider */}
                            <div className="relative flex items-center py-2 h-4">
                                <div className="flex-grow border-t border-surface-container-highest"></div>
                                <span className="flex-shrink mx-4 text-[10px] font-black text-outline uppercase tracking-[0.2em]">atau</span>
                                <div className="flex-grow border-t border-surface-container-highest"></div>
                            </div>

                            {/* Google SSO */}
                            <button type="button" className="w-full bg-white border border-outline-variant/30 hover:bg-surface-container-low py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-on-surface hover:shadow-md">
                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl8b2rzhrJJTzrX9PN2jBEwpQ83J3BNlcloaRTgCFXYU98s8UJAubvF_e0TG0WLYAbtLMmFzGR3K6uCb_odZO1XIw3F_3CR53EDsUjYXkRVTFF5sdfMQFCXSXDuCNqUBiOFps8gtoYZBfswjN91Mq9-cN3wrMP8QhEAhmed_LLa0vzrRn4hDyc8CYwwjOKqy50xjBE9nuLRS9Kx-k8cJl4sL7tt8NObvB0687OVJdvLC7vjv2qs6d8msEiQ4XW6PmoKjgWWCEcNtMl" alt="Google" className="w-5 h-5" />
                                <span className="text-sm">Lanjutkan dengan Google</span>
                            </button>
                        </form>
                    </div>

                    {/* Footer Link */}
                    <div className="mt-8 text-center">
                        <p className="text-on-surface-variant text-sm font-medium">
                            Belum memiliki akun? 
                            <button 
                                onClick={() => navigate('/register')}
                                className="text-primary font-bold hover:underline underline-offset-4 ml-1"
                            >
                                Daftar Sekarang
                            </button>
                        </p>
                    </div>
                </div>
            </main>

            <footer className="w-full py-8 px-6 text-center mt-auto">
                <p className="text-[10px] font-bold text-outline/40 uppercase tracking-[0.2em]">
                    © {new Date().getFullYear()} PT. SEMESTA TEKNO PARTNER INDONESIA
                </p>
            </footer>
        </div>
    );
}
