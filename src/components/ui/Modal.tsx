import React from 'react';
import { Info, CheckCircle, Warning, WarningCircle } from '@phosphor-icons/react';
import { Text } from './Typography';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    type?: 'info' | 'success' | 'error' | 'warning';
    footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    type = 'info',
    footer 
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle weight="fill" className="w-8 h-8 text-emerald-500" />;
            case 'error': return <WarningCircle weight="fill" className="w-8 h-8 text-rose-500" />;
            case 'warning': return <Warning weight="fill" className="w-8 h-8 text-amber-500" />;
            default: return <Info weight="fill" className="w-8 h-8 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return 'bg-emerald-50';
            case 'error': return 'bg-rose-50';
            case 'warning': return 'bg-amber-50';
            default: return 'bg-blue-50';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-slide-up border border-slate-100">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 ${getBgColor()} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        {getIcon()}
                    </div>
                    <Text.H2 className="!text-[18px] mb-2">{title}</Text.H2>
                    <div className="!text-slate-600 text-sm font-medium">
                        {children}
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-50 bg-slate-50/50 flex flex-col gap-2">
                    {footer ? footer : (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all w-full active:scale-95 shadow-lg shadow-slate-200"
                        >
                            Tutup
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
