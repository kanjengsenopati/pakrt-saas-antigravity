import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { User as UserIcon, Envelope, Phone, Lock, FloppyDisk, ShieldCheck, SignOut, Eye, EyeSlash } from '@phosphor-icons/react';

export default function Profile() {
    const { user, logout, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        kontak: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                kontak: user.kontak || ''
            }));
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (formData.password && formData.password !== formData.confirmPassword) {
            alert('Password konfirmasi tidak cocok!');
            return;
        }

        setIsLoading(true);
        try {
            const updateData: any = {
                name: formData.name,
                email: formData.email,
                kontak: formData.kontak,
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            const updatedUser = await userService.update(user.id, updateData);
            alert('Profil berhasil diperbarui!');
            
            if (formData.password || formData.email !== user.email) {
                alert('Silahkan login kembali karena perubahan keamanan.');
                logout();
            } else {
                updateUser(updatedUser);
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Gagal memperbarui profil.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Profil Pengguna</h3>
                    <p className="text-slate-500 font-medium">Kelola informasi pribadi dan keamanan akun Anda.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => logout()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-all border border-red-100 active:scale-95 text-sm"
                    >
                        <SignOut weight="bold" className="w-5 h-5" />
                        Keluar Sesi
                    </button>
                    {!isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95 text-sm"
                        >
                            Edit Profil
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-bold">
                {/* Visual Identity Card */}
                <div className="lg:col-span-1 space-y-5">
                    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                        <div className="h-24 bg-gradient-to-br from-brand-500 to-emerald-600"></div>
                        <div className="px-5 pb-6 -mt-10 text-center">
                            <div className="inline-flex relative">
                                <div className="w-20 h-20 rounded-[1.5rem] bg-white p-1 shadow-xl ring-1 ring-slate-100">
                                    <div className="w-full h-full rounded-[1.2rem] bg-slate-900 flex items-center justify-center text-white font-bold text-2xl shadow-inner">
                                        {user?.name ? user.name.substring(0, 2) : '??'}
                                    </div>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-lg">
                                    <ShieldCheck weight="fill" className="w-3.5 h-3.5" />
                                </div>
                            </div>
                            <h2 className="mt-3 text-lg font-bold text-slate-900 normal-case tracking-tight">
                                {user?.name?.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}
                            </h2>
                            <p className="text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full inline-block mt-1.5 text-[10px] font-bold tracking-wide border border-brand-100/50">
                                {user?.role_entity?.name || user?.role || 'Member'}
                            </p>
                            
                            <div className="mt-6 pt-6 border-t border-slate-50 space-y-3 text-left normal-case tracking-normal">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                                        <Envelope weight="duotone" className="w-5 h-5" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-medium text-slate-500 tracking-wide">Email Terdaftar</p>
                                        <p className="text-sm font-bold text-slate-900 truncate">{user?.email || '-'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <div className="p-2 rounded-xl bg-slate-50 text-slate-400">
                                        <Phone weight="duotone" className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 tracking-wide">No. WhatsApp</p>
                                        <p className="text-sm font-bold text-slate-900">{user.kontak || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Form Area */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-6 md:p-7 space-y-6 ${isEditing ? 'ring-2 ring-brand-500/20' : ''}`}>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                                    <UserIcon weight="duotone" className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 tracking-wide">Informasi Dasar</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-500 tracking-wide">Nama Lengkap</label>
                                    <input 
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({...p, name: e.target.value}))}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all disabled:opacity-75 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-500 tracking-wide">Email</label>
                                    <input 
                                        type="email"
                                        disabled={!isEditing}
                                        value={formData.email}
                                        onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all disabled:opacity-75 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-slate-500 tracking-wide">Kontak (WhatsApp)</label>
                                    <input 
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.kontak}
                                        onChange={e => setFormData(p => ({...p, kontak: e.target.value}))}
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all disabled:opacity-75 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Lock weight="duotone" className="w-5 h-5" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-500 tracking-wide">Keamanan & Password</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5 relative">
                                    <label className="block text-sm font-medium text-slate-500 tracking-wide">Password Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            disabled={!isEditing}
                                            placeholder={isEditing ? "Isi hanya jika ingin ganti..." : "••••••••"}
                                            value={formData.password}
                                            onChange={e => setFormData(p => ({...p, password: e.target.value}))}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all disabled:opacity-75 text-sm"
                                        />
                                        {isEditing && (
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeSlash weight="bold" /> : <Eye weight="bold" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5 relative">
                                    <label className="block text-sm font-medium text-slate-500 tracking-wide">Konfirmasi Password Baru</label>
                                    <div className="relative">
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"}
                                            disabled={!isEditing}
                                            placeholder={isEditing ? "Ketik ulang password baru..." : "••••••••"}
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData(p => ({...p, confirmPassword: e.target.value}))}
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-2.5 pr-10 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all disabled:opacity-75 text-sm"
                                        />
                                        {isEditing && (
                                            <button 
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showConfirmPassword ? <EyeSlash weight="bold" /> : <Eye weight="bold" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-5 py-2.5 rounded-xl text-slate-500 font-bold hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 text-sm"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-brand-600 shadow-xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 text-sm"
                                >
                                    {isLoading ? 'Menyimpan...' : (
                                        <>
                                            <FloppyDisk weight="fill" className="w-5 h-5" />
                                            Simpan Perubahan
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
