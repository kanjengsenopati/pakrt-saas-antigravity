import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MagnifyingGlass, SignOut, CaretDown, User as UserIcon, Plus, Minus } from '@phosphor-icons/react';
import { useAuth } from '../../contexts/AuthContext';
import { useFont } from '../../contexts/FontContext';
import { SyncStatus } from './SyncStatus';


export function Header() {
    const navigate = useNavigate();
    const { logout, user: currentUser } = useAuth();
    const { fontSizeOffset, increaseFont, decreaseFont } = useFont();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 glass gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4 flex-1">
                {/* Desktop Search */}
                <div className="relative w-full max-w-sm hidden md:block">
                    <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Cari warga, aset, surat..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-colors"
                    />
                </div>
                {/* Mobile Identity */}
                <div className="md:hidden flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <div className="w-4 h-4 text-white font-bold text-[0.6875rem] italic">RT</div>
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight text-sm">Pak<span className="text-brand-600">RT</span></span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <div className="flex items-center gap-2 md:gap-4 pl-2 md:pl-4 border-gray-200">
                    {/* Sync Status Badge */}
                    <div className="hidden sm:block">
                        <SyncStatus />
                    </div>

                    {/* Font Resize Tools */}
                    <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 p-0.5 shadow-inner">
                        <button 
                            onClick={decreaseFont}
                            className="p-1 px-1.5 text-gray-500 hover:text-brand-600 hover:bg-white rounded-md transition-all active:scale-95"
                            title="Perkecil Font (-1px)"
                        >
                            <Minus weight="bold" className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-4 bg-gray-200 mx-0.5"></div>
                        <span className="text-[0.625rem] font-bold text-gray-400 w-5 text-center select-none">
                            {16 + fontSizeOffset}
                        </span>
                        <div className="w-[1px] h-4 bg-gray-200 mx-0.5"></div>
                        <button 
                            onClick={increaseFont}
                            className="p-1 px-1.5 text-gray-500 hover:text-brand-600 hover:bg-white rounded-md transition-all active:scale-95"
                            title="Perbesar Font (+1px)"
                        >
                            <Plus weight="bold" className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button className="text-gray-400 hover:text-brand-600 transition-colors relative hidden sm:block">
                        <Bell weight="duotone" className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    {/* User Profile Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-xl transition-colors group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-emerald-500 flex items-center justify-center shadow-sm text-white font-bold text-xs ring-2 ring-white">
                                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : 'AD'}
                            </div>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                    {currentUser?.name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') || 'Admin'}
                                </p>
                                <p className="section-label !text-sm mt-0.5">{currentUser?.role_entity?.name || currentUser?.role || 'Administrator'}</p>
                            </div>
                            <CaretDown weight="bold" className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isProfileOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-scale-in origin-top-right">
                                    <div className="px-4 py-3 border-b border-gray-50 mb-2">
                                        <p className="font-bold text-gray-900 text-sm">
                                            {currentUser?.name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                                        </p>
                                        <p className="text-xs text-gray-500">{currentUser?.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setIsProfileOpen(false);
                                            navigate('/profile');
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                                    >
                                        <UserIcon weight="duotone" className="w-5 h-5" />
                                        Profil Saya
                                    </button>
                                    <div className="h-px bg-gray-100 my-2"></div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <SignOut weight="bold" className="w-5 h-5" />
                                        Keluar Sesi
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

        </header>
    );
}
