import { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallBannerProps {
    show: boolean; // controlled by parent — only render on /login, /register
}

export function PWAInstallBanner({ show }: PWAInstallBannerProps) {
    const { isInstallable, isInstalled, promptInstall, dismissPrompt, isDismissed } = usePWAInstall();
    const [isInstalling, setIsInstalling] = useState(false);
    const [justInstalled, setJustInstalled] = useState(false);
    const [visible, setVisible] = useState(false);

    // Slide in with a slight delay for polish
    useEffect(() => {
        if (show && isInstallable && !isDismissed && !isInstalled) {
            const timer = setTimeout(() => setVisible(true), 1200);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [show, isInstallable, isDismissed, isInstalled]);

    if (!visible) return null;

    const handleInstall = async () => {
        setIsInstalling(true);
        const accepted = await promptInstall();
        if (accepted) {
            setJustInstalled(true);
            setTimeout(() => setVisible(false), 2500);
        } else {
            setIsInstalling(false);
        }
    };

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(dismissPrompt, 400);
    };

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 z-[999] transition-all duration-500 ease-out ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
            role="banner"
            aria-label="Install PAKRT App"
        >
            {/* Backdrop blur effect at bottom */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-brand-100 shadow-2xl shadow-brand-900/20">
                <div className="max-w-md mx-auto px-4 py-4">
                    {justInstalled ? (
                        // Success State
                        <div className="flex items-center gap-3 justify-center py-1 animate-fade-in">
                            <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center shadow-md shadow-brand-200">
                                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="white" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold text-brand-700">PAKRT berhasil diinstall!</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            {/* PAKRT Logo */}
                            <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200 shrink-0">
                                <span className="text-white font-bold text-lg tracking-tight leading-none">P</span>
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm leading-tight">Install PAKRT</p>
                                <p className="text-[11px] text-slate-500 font-medium mt-0.5 tracking-normal leading-tight">
                                    Akses cepat dari layar utama, tanpa browser
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={handleDismiss}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                                >
                                    Nanti
                                </button>
                                <button
                                    onClick={handleInstall}
                                    disabled={isInstalling}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-200 transition-all disabled:opacity-70"
                                >
                                    {isInstalling ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <span>Installing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Install Sekarang</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Safe area padding for iPhone home bar */}
                <div className="h-safe-bottom pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
            </div>
        </div>
    );
}
