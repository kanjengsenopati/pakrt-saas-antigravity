import { House } from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function StickyHomeButton() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Don't show on landing or login
    if (location.pathname === '/' || location.pathname === '/login') return null;

    const handleHome = () => {
        if (user?.role === 'Warga') {
            navigate('/warga-portal');
        } else {
            navigate('/dashboard');
        }
    };

    return (
        <button
            onClick={handleHome}
            className="md:hidden fixed bottom-8 left-8 z-[60] w-14 h-14 bg-white/40 backdrop-blur-2xl border border-white/40 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-center text-brand-600 active:scale-90 transition-all group overflow-hidden"
            title="Beranda"
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10">
                <House weight="fill" size={28} className="drop-shadow-sm" />
            </div>
            
            {/* Active Glow Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-brand-500/20 scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300" />
        </button>
    );
}
