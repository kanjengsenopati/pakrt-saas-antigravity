import React, { useEffect } from 'react';
import { Smartphone, Tablet, Monitor } from 'lucide-react';
import { Text } from '../ui/Typography';
import { useLocation } from 'react-router-dom';
import { useViewMode } from '../../contexts/ViewModeContext';

type ViewMode = 'mobile' | 'tablet' | 'desktop';

interface DeviceSimulatorProps {
    children: React.ReactNode;
}

export const DeviceSimulator: React.FC<DeviceSimulatorProps> = ({ children }) => {
    const { viewMode, setViewMode } = useViewMode();
    const location = useLocation();

    const isExcluded = location.pathname.includes('/surat/cetak/') || 
                      location.pathname.includes('/cetak/') ||
                      location.pathname.includes('/print/') || 
                      location.pathname.includes('/verify/');

    useEffect(() => {
        if (isExcluded) {
            document.body.style.overflow = 'auto';
            return;
        }

        localStorage.setItem('pakrt_view_mode', viewMode);
        
        // Handle body scroll locking when in mobile/tablet mode
        if (viewMode !== 'desktop') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [viewMode, isExcluded]);

    if (isExcluded || viewMode === 'desktop') {
        const togglePosition = viewMode === 'desktop' ? 'right-72' : 'left-1/2 -translate-x-1/2';
        
        return (
            <div className="relative min-h-screen">
                {children}
                {!isExcluded && (
                    <div className={`fixed top-5 ${togglePosition} z-[99999] animate-fade-in group`}>
                        <SimulatorToggle current={viewMode} onChange={setViewMode} isFloating />
                    </div>
                )}
            </div>
        );
    }

    const getFrameStyles = () => {
        switch (viewMode) {
            case 'mobile':
                return 'w-[430px] h-[844px] shadow-[0_40px_100px_rgba(0,0,0,0.25)] rounded-[32px] border-[12px] border-slate-900 ring-1 ring-white/10';
            case 'tablet':
                return 'w-[820px] h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.2)] rounded-[32px] border-[12px] border-slate-900 ring-1 ring-white/10';
            default:
                return 'w-full h-full';
        }
    };

    const toolbarPosition = 'left-1/2 -translate-x-1/2';

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 transition-colors duration-700 relative overflow-hidden">
            {/* Immersive Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-200 rounded-full blur-[120px]" />
                <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-200 rounded-full blur-[120px]" />
            </div>

            {/* Simulator Toolbar - Dynamic Position */}
            <div className={`fixed top-8 ${toolbarPosition} z-[99999] animate-fade-in`}>
                <SimulatorToggle current={viewMode} onChange={setViewMode} />
            </div>

            {/* Device Frame with Isolation Logic */}
            <div 
                className={`
                    relative bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    isolate transform translate-z-0
                    ${getFrameStyles()}
                `}
                style={{
                    perspective: '1000px',
                    backfaceVisibility: 'hidden'
                }}
            >
                {/* Device Inner Content (Scrollable) */}
                <div className="w-full h-full overflow-y-auto overflow-x-hidden hide-scrollbar bg-white">
                    {children}
                </div>

                {/* Optional: Device Home Indicator for Mobile */}
                {viewMode === 'mobile' && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-900/10 rounded-full opacity-50 z-[9999]" />
                )}
            </div>

            {/* Footer Metadata */}
            <div className="mt-8 flex flex-col items-center gap-2 opacity-30 select-none">
                <Text.Label className="tracking-[0.2em] font-black text-slate-500">
                    PakRT Preview • {viewMode}
                </Text.Label>
                <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
            </div>
        </div>
    );
};

interface ToggleProps {
    current: ViewMode;
    onChange: (mode: ViewMode) => void;
    isFloating?: boolean;
}

const SimulatorToggle: React.FC<ToggleProps> = ({ current, onChange, isFloating }) => {
    return (
        <div className={`
            flex items-center gap-1 p-1 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300
            bg-white/90 backdrop-blur-xl border border-slate-200/50
            ${isFloating ? 'hover:scale-105 active:scale-95' : ''}
        `}>
            {current !== 'mobile' && (
                <ToggleButton 
                    onClick={() => onChange('mobile')}
                    icon={<Smartphone size={16} strokeWidth={2.5} />}
                    label="Mobile"
                />
            )}
            {current !== 'tablet' && (
                <ToggleButton 
                    onClick={() => onChange('tablet')}
                    icon={<Tablet size={16} strokeWidth={2.5} />}
                    label="Tablet"
                />
            )}
            {current !== 'desktop' && (
                <ToggleButton 
                    onClick={() => onChange('desktop')}
                    icon={<Monitor size={16} strokeWidth={2.5} />}
                    label="Desktop"
                />
            )}
        </div>
    );
};

const ToggleButton = ({ onClick, icon, label }: { onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button
        onClick={onClick}
        title={`Pindah ke ${label}`}
        className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
    >
        {icon}
    </button>
);
