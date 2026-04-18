import React, { useEffect, useRef } from 'react';
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
    
    // Check if we are inside an iframe
    const isIframe = window.self !== window.top;

    const isExcluded = location.pathname.includes('/surat/cetak/') || 
                      location.pathname.includes('/cetak/') ||
                      location.pathname.includes('/print/') || 
                      location.pathname.includes('/verify/');

    // Communicate URL changes from iframe to parent window
    useEffect(() => {
        if (isIframe) {
            window.parent.postMessage({ type: 'ROUTER_CHANGE', url: location.pathname + location.search }, '*');
        }
    }, [location, isIframe]);

    // Parent window listens for URL changes from iframe to update browser address bar
    useEffect(() => {
        if (!isIframe) {
            const handleMessage = (e: MessageEvent) => {
                if (e.data?.type === 'ROUTER_CHANGE' && e.data.url) {
                    window.history.replaceState(null, '', e.data.url);
                }
            };
            window.addEventListener('message', handleMessage);
            return () => window.removeEventListener('message', handleMessage);
        }
    }, [isIframe]);

    useEffect(() => {
        if (isExcluded) {
            document.body.style.overflow = 'auto';
            return;
        }

        if (!isIframe) {
            localStorage.setItem('pakrt_view_mode', viewMode);
            
            // Handle body scroll locking when in mobile/tablet mode
            if (viewMode !== 'desktop') {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'auto';
            }
        } else {
            // Inside iframe, we should allow scrolling on the body since it represents the viewport
            document.body.style.overflow = 'auto';
            // Optionally, transparent background so the iframe frame styling takes precedence
        }
    }, [viewMode, isExcluded, isIframe]);

    // If we are already running inside the iframe, just render the app
    if (isIframe) {
        return <>{children}</>;
    }

    if (isExcluded || viewMode === 'desktop') {
        const togglePosition = 'right-8';
        
        return (
            <div className="relative min-h-screen">
                {children}
                {!isExcluded && (
                    <div className={`fixed top-6 ${togglePosition} z-[99999] animate-fade-in group`}>
                        <SimulatorToggle current={viewMode} onChange={setViewMode} isFloating />
                    </div>
                )}
            </div>
        );
    }

    const getFrameStyles = () => {
        switch (viewMode) {
            case 'mobile':
                return 'w-[430px] h-[844px] shadow-[0_40px_100px_rgba(0,0,0,0.25)] rounded-[40px] border-[12px] border-slate-900 ring-1 ring-white/10';
            case 'tablet':
                return 'w-[820px] h-[90vh] shadow-[0_40px_100px_rgba(0,0,0,0.2)] rounded-[32px] border-[12px] border-slate-900 ring-1 ring-white/10';
            default:
                return 'w-full h-full';
        }
    };

    const toolbarPosition = 'right-8';
    
    // Pass the current viewMode to the iframe URL as a query param or hash?
    // Not strictly needed, because we just need to render the exact same URL 
    // and rely on `window.self !== window.top` to bypass the simulator trap
    const iframeSrc = location.pathname + location.search;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 transition-colors duration-700 relative overflow-hidden">
            {/* Immersive Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
                <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-brand-200/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-blue-200/50 rounded-full blur-[150px]" />
            </div>

            {/* Simulator Toolbar - Discreet Position */}
            <div className={`fixed top-6 ${toolbarPosition} z-[99999] animate-fade-in`}>
                <SimulatorToggle current={viewMode} onChange={setViewMode} />
            </div>

            {/* Device Frame with Isolation Logic */}
            <div 
                className={`
                    relative bg-white overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    isolate transform translate-z-0 flex flex-col
                    ${getFrameStyles()}
                `}
                style={{
                    perspective: '1000px',
                    backfaceVisibility: 'hidden'
                }}
            >
                {/* iPhone Dynamic Island / Notch Simulation */}
                {viewMode === 'mobile' && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-900 rounded-b-[20px] z-50 shadow-md">
                        <div className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                    </div>
                )}
                
                {/* iPad Camera Hole Simulation */}
                {viewMode === 'tablet' && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-800 z-50"></div>
                )}

                {/* Secure Iframe rendering the isolated app */}
                <div className="flex-1 w-full bg-white relative z-0">
                    <iframe 
                        src={iframeSrc} 
                        className="w-full h-full border-0 pointer-events-auto"
                        title="PakRT Device Simulator"
                        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                    />
                </div>

                {/* Device Home Indicator */}
                {(viewMode === 'mobile' || viewMode === 'tablet') && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1.5 bg-slate-900/10 rounded-full z-50 pointer-events-none" />
                )}
            </div>

            {/* Footer Metadata */}
            <div className="mt-8 flex flex-col items-center gap-2 opacity-30 select-none">
                <Text.Label className="tracking-[0.2em] font-black text-slate-500">
                    PakRT Preview • {viewMode.toUpperCase()}
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
            flex items-center gap-1 p-1 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.15)] transition-all duration-300
            bg-white/95 backdrop-blur-xl border border-slate-200/50 hover:border-brand-200
            ${isFloating ? 'hover:scale-105 active:scale-95 animate-pulse' : ''}
        `}>
            {current !== 'mobile' && (
                <ToggleButton 
                    onClick={() => onChange('mobile')}
                    icon={<Smartphone size={18} strokeWidth={2} />}
                    label="Mobile"
                />
            )}
            {current !== 'tablet' && (
                <ToggleButton 
                    onClick={() => onChange('tablet')}
                    icon={<Tablet size={18} strokeWidth={2} />}
                    label="Tablet"
                />
            )}
            {current !== 'desktop' && (
                <ToggleButton 
                    onClick={() => onChange('desktop')}
                    icon={<Monitor size={18} strokeWidth={2} />}
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
        className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 text-slate-500 hover:bg-slate-100 hover:text-brand-600 focus:outline-none"
    >
        {icon}
    </button>
);
