import { useState, useCallback, useRef } from 'react';
import { Info, Warning, Trash } from '@phosphor-icons/react';

type ConfirmVariant = 'default' | 'danger' | 'warning';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
    open: boolean;
}

const variantConfig: Record<ConfirmVariant, { icon: React.ReactNode; confirmClass: string }> = {
    default: {
        icon: <Info size={32} weight="duotone" className="text-brand-500" />,
        confirmClass: 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20',
    },
    danger: {
        icon: <Trash size={32} weight="duotone" className="text-rose-500" />,
        confirmClass: 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
    },
    warning: {
        icon: <Warning size={32} weight="duotone" className="text-amber-500" />,
        confirmClass: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
    },
};

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({
        open: false,
        title: '',
        message: '',
    });
    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setState({ ...options, open: true });
        });
    }, []);

    const handleConfirm = () => {
        setState(prev => ({ ...prev, open: false }));
        resolveRef.current?.(true);
    };

    const handleCancel = () => {
        setState(prev => ({ ...prev, open: false }));
        resolveRef.current?.(false);
    };

    const ConfirmDialog = () => {
        if (!state.open) return null;
        const variant = state.variant || 'default';
        const config = variantConfig[variant];

        return (
            <div
                className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                style={{ animation: 'fadeIn 0.15s ease-out' }}
            >
                <div
                    className="bg-white rounded-[28px] shadow-2xl w-full max-w-sm overflow-hidden"
                    style={{ animation: 'zoomIn 0.2s ease-out' }}
                >
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                            {config.icon}
                        </div>
                        <p className="text-[18px] font-bold text-slate-900 mb-2">{state.title}</p>
                        <p className="text-[13px] text-slate-500 leading-relaxed px-2">{state.message}</p>
                    </div>
                    <div className="px-6 pb-6 flex flex-col gap-2">
                        <button
                            onClick={handleConfirm}
                            className={`w-full py-3.5 text-white rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 ${config.confirmClass}`}
                        >
                            {state.confirmText || 'Konfirmasi'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-all"
                        >
                            {state.cancelText || 'Batal'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return { confirm, ConfirmDialog };
}
