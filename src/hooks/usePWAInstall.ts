import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

interface UsePWAInstallReturn {
    isInstallable: boolean;
    isInstalled: boolean;
    promptInstall: () => Promise<boolean>;
    dismissPrompt: () => void;
    isDismissed: boolean;
}

const DISMISSED_KEY = 'pakrt_pwa_install_dismissed';
const DISMISSED_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export function usePWAInstall(): UsePWAInstallReturn {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed (running in standalone/PWA mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        if (isStandalone) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed recently
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const elapsed = Date.now() - parseInt(dismissedAt, 10);
            if (elapsed < DISMISSED_DURATION_MS) {
                setIsDismissed(true);
            } else {
                localStorage.removeItem(DISMISSED_KEY);
            }
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async (): Promise<boolean> => {
        if (!deferredPrompt) return false;
        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            if (outcome === 'accepted') {
                setIsInstalled(true);
                setIsInstallable(false);
                return true;
            }
        } catch (err) {
            console.warn('[PWA] Install prompt failed:', err);
        }
        return false;
    }, [deferredPrompt]);

    const dismissPrompt = useCallback(() => {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
        setIsDismissed(true);
    }, []);

    return { isInstallable, isInstalled, promptInstall, dismissPrompt, isDismissed };
}
