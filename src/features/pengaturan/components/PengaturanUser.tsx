import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../../services/api';
import { useTenant } from '../../../contexts/TenantContext';
import { userService } from '../../../services/userService';
import { wargaService } from '../../../services/wargaService';
import { User } from '../../../database/db';
import { Warga } from '../../../types/database';
import { ShieldCheck, Plus, User as UserIcon, Key, Trash, CaretUp, X, CheckCircle, Palette, Eye, EyeSlash } from '@phosphor-icons/react';
import { HasPermission } from '../../../components/auth/HasPermission';
import { Text } from '../../../components/ui/Typography';
import { parseApiError } from '../../../utils/errorParser';
import { APP_MODULES, CRUD_ACTIONS } from '../types';

export default function PengaturanUser() {
    const { currentTenant, currentScope } = useTenant();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [activeRoleSubTab, setActiveRoleSubTab] = useState<'users' | 'roles'>('users');
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
    const [userPermissions, setUserPermissions] = useState<Record<string, any>>({});
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [showAddRoleForm, setShowAddRoleForm] = useState(false);
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [selectedWargaId, setSelectedWargaId] = useState('');
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', role_id: '', password: '', scope: currentScope as string });
    const [newRoleForm, setNewRoleForm] = useState({ name: '' });
    const [resetPasswordModal, setResetPasswordModal] = useState<{ isOpen: boolean; user: User | null; newPassword: string; showPassword: boolean }>({ isOpen: false, user: null, newPassword: '', showPassword: false });

    useEffect(() => {
        if (currentTenant) {
            loadUsers();
            loadRoles();
            loadWarga();
        }
    }, [currentTenant, currentScope]);

    const loadUsers = async () => {
        if (currentTenant) {
            const data = await userService.getAllByTenant(currentTenant.id);
            setUsers(data);
        }
    };

    const loadRoles = async () => {
        if (currentTenant) {
            const response = await api.get(`/role?tenant_id=${currentTenant.id}`);
            setRoles(response.data);
        }
    };

    const loadWarga = async () => {
        if (currentTenant) {
            const data = await wargaService.getAll(currentTenant.id, currentScope, 1, 500);
            setWargaList(data.items || []);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenant?.id || !newUserForm.name || !newUserForm.email) return;
        
        try {
            await userService.create({
                tenant_id: currentTenant.id,
                name: newUserForm.name,
                email: newUserForm.email,
                role_id: newUserForm.role_id,
                scope: newUserForm.scope,
                password: newUserForm.password || 'password123',
                warga_id: selectedWargaId || undefined,
                permissions: {} // Default to empty, inherit from role
            } as any);
            setShowAddUserForm(false);
            setSelectedWargaId('');
            setNewUserForm({ name: '', email: '', role_id: '', password: '', scope: currentScope as string });
            loadUsers();
            alert('User berhasil ditambahkan.');
        } catch (error: any) {
            console.error('Failed to create user', error);
            alert(parseApiError(error, 'Gagal menambahkan user. Silakan coba lagi.'));
        }
    };

    const handleWargaSelect = (wargaId: string) => {
        setSelectedWargaId(wargaId);
        const warga = wargaList.find(w => w.id === wargaId);
        if (warga) {
            const email = `${warga.nik}@pakrt.local`;
            setNewUserForm(prev => ({ ...prev, name: warga.nama, email }));
        } else {
            setNewUserForm(prev => ({ ...prev, name: '', email: '' }));
        }
    };

    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenant?.id || !newRoleForm.name) return;

        try {
            await api.post(`/role`, {
                tenant_id: currentTenant.id,
                name: newRoleForm.name,
                permissions: {}
            });
            setShowAddRoleForm(false);
            setNewRoleForm({ name: '' });
            loadRoles();
        } catch (error) {
            console.error('Failed to create role', error);
            alert('Gagal menambahkan role.');
        }
    };

    const handleSyncRoles = async () => {
        if (!currentTenant) return;
        if (!window.confirm('Sinkronisasi ulang peran bawaan sistem (Admin, Sekretaris, Bendahara, Warga)? Perubahan manual pada role sistem ini akan ditimpa ke nilai default terbaru.')) return;
        
        try {
            await api.post('/role/sync');
            await loadRoles();
            alert('Peran sistem berhasil disinkronisasi ke default terbaru.');
        } catch (error: any) {
            console.error('Failed to sync roles', error);
            alert(parseApiError(error, 'Gagal sinkronisasi peran.'));
        }
    };

    const handleDeleteRole = async (id: string, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus role ${name}? User dengan role ini mungkin kehilangan akses.`)) {
            await api.delete(`/role/${id}`);
            loadRoles();
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus user ${name}?`)) {
            await userService.delete(id);
            loadUsers();
        }
    };

    const handleEditPermissions = (user: User) => {
        if (expandedUserId === user.id) {
            setExpandedUserId(null);
            return;
        }
        setExpandedUserId(user.id);
        setExpandedRoleId(null);
        
        const normalized: Record<string, any> = {};
        const userPerms = (user.permissions as any) || {};

        let role = (user as any).role_entity;
        if (!role && user.role_id) {
            role = roles.find(r => r.id === user.role_id);
        }
        
        const rolePerms = role?.permissions || {};

        APP_MODULES.forEach(mod => {
            const uData = userPerms[mod.id];
            const rData = rolePerms[mod.id];
            
            let actions: string[] = [];
            let scope: 'all' | 'personal' = 'all';

            if (Array.isArray(rData)) {
                actions = [...rData];
            } else if (rData && typeof rData === 'object') {
                actions = [...(rData.actions || [])];
                scope = rData.scope || 'all';
            }

            if (Array.isArray(uData)) {
                actions = [...uData];
            } else if (uData && typeof uData === 'object') {
                actions = (uData.actions !== undefined) ? [...uData.actions] : actions;
                scope = uData.scope || scope;
            }

            normalized[mod.id] = { actions, scope };
        });

        setUserPermissions(normalized);
    };

    const handleEditRolePermissions = (role: any) => {
        if (expandedRoleId === role.id) {
            setExpandedRoleId(null);
            return;
        }
        setExpandedRoleId(role.id);
        setExpandedUserId(null);
        const normalized: Record<string, any> = {};
        const rawPerms = role.permissions || {};
        APP_MODULES.forEach(mod => {
            const data = rawPerms[mod.id];
            if (Array.isArray(data)) {
                normalized[mod.id] = { actions: data, scope: 'all' };
            } else if (data && typeof data === 'object') {
                normalized[mod.id] = { actions: data.actions || [], scope: data.scope || 'all' };
            } else {
                normalized[mod.id] = { actions: [], scope: 'all' };
            }
        });
        setUserPermissions(normalized);
    };

    const togglePermission = (module: string, action: string) => {
        setUserPermissions(prev => {
            const modData = prev[module] || { actions: [], scope: 'all' };
            const actions = [...modData.actions];
            
            if (actions.includes(action)) {
                return { ...prev, [module]: { ...modData, actions: actions.filter(a => a !== action) } };
            } else {
                return { ...prev, [module]: { ...modData, actions: [...actions, action] } };
            }
        });
    };

    const toggleScope = (module: string) => {
        setUserPermissions(prev => {
            const modData = prev[module] || { actions: [], scope: 'all' };
            return { ...prev, [module]: { ...modData, scope: modData.scope === 'all' ? 'personal' : 'all' } };
        });
    };

    const handleResetPassword = async (user: User) => {
        setResetPasswordModal({ isOpen: true, user, newPassword: '', showPassword: false });
    };

    const submitResetPassword = async () => {
        if (!resetPasswordModal.user || !resetPasswordModal.newPassword) return;
        try {
            await userService.update(resetPasswordModal.user.id, { password: resetPasswordModal.newPassword });
            alert(`Password untuk ${resetPasswordModal.user.name} berhasil diperbarui.`);
            setResetPasswordModal({ isOpen: false, user: null, newPassword: '', showPassword: false });
        } catch (error) {
            console.error("Failed to reset password:", error);
            alert("Gagal mereset password. Silakan coba lagi.");
        }
    };

    const savePermissions = async (targetUserId?: string, targetRole?: any) => {
        const userId = targetUserId || expandedUserId;
        const role = targetRole || (expandedRoleId ? roles.find(r => r.id === expandedRoleId) : null);
        try {
            if (userId) {
                await userService.updatePermissions(userId, userPermissions);
                alert('Izin akses user berhasil diperbarui!');
                setExpandedUserId(null);
                loadUsers();
            } else if (role) {
                await api.put(`/role/${role.id}`, {
                    ...role,
                    permissions: userPermissions
                });
                alert('Izin akses Role berhasil diperbarui!');
                setExpandedRoleId(null);
                loadRoles();
            }
        } catch (error) {
            console.error('Failed to save permissions', error);
            alert('Gagal menyimpan izin akses.');
        }
    };

    return (
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center items-start gap-4 sm:gap-6">
                        <div>
                            <Text.H1 className="!text-[22px] !font-bold !text-slate-900 !leading-none">Manajemen Akses</Text.H1>
                            <Text.Caption className="!text-[12px] !text-slate-500 !mt-2 !font-medium !tracking-normal">Konfigurasi Peran & Hak Akses Pengguna</Text.Caption>
                        </div>
                        <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>
                        <div className="flex bg-slate-100 p-1.5 rounded-[18px] shadow-inner">
                            <button 
                                onClick={() => setActiveRoleSubTab('users')}
                                className={`px-5 py-2 text-[13px] font-bold rounded-[14px] transition-all duration-300 ${activeRoleSubTab === 'users' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                Pengguna
                            </button>
                            <button 
                                onClick={() => setActiveRoleSubTab('roles')}
                                className={`px-5 py-2 text-[13px] font-bold rounded-[14px] transition-all duration-300 ${activeRoleSubTab === 'roles' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                Peran
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {activeRoleSubTab === 'users' ? (
                            <HasPermission module="Manajemen User / Role" action="Buat">
                                <button 
                                    onClick={() => { setShowAddUserForm(v => !v); setExpandedUserId(null); }}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold shadow-lg transition-all text-[14px] ${showAddUserForm ? 'bg-slate-800 text-white' : 'bg-brand-600 text-white hover:scale-105 active:scale-95'}`}>
                                    {showAddUserForm ? <X weight="bold" /> : <Plus weight="bold" />}
                                    <Text.Label className="!normal-case !tracking-normal text-white">{showAddUserForm ? 'Batal' : 'Tambah Pengguna'}</Text.Label>
                                </button>
                            </HasPermission>
                        ) : (
                            <div className="flex gap-2">
                                <HasPermission module="Manajemen User / Role" action="Ubah">
                                    <button 
                                        onClick={handleSyncRoles}
                                        className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold shadow-sm transition-all text-[14px]">
                                        <ShieldCheck weight="bold" />
                                        <Text.Label className="!normal-case !tracking-normal">Sync Default</Text.Label>
                                    </button>
                                </HasPermission>
                                <HasPermission module="Manajemen User / Role" action="Buat">
                                    <button 
                                        onClick={() => setShowAddRoleForm(v => !v)}
                                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold shadow-lg transition-all text-[14px] ${showAddRoleForm ? 'bg-red-50 text-red-600 border border-red-200 shadow-none' : 'bg-brand-600 text-white hover:scale-105 active:scale-95'}`}>
                                        {showAddRoleForm ? <X weight="bold" /> : <Plus weight="bold" />}
                                        <Text.Label className="!normal-case !tracking-normal !text-inherit">{showAddRoleForm ? 'Batal' : 'Tambah Peran'}</Text.Label>
                                    </button>
                                </HasPermission>
                            </div>
                        )}
                    </div>
                </div>

                {/* INLINE: Add User Form */}
                {activeRoleSubTab === 'users' && showAddUserForm && (
                    <div className="bg-white border border-brand-200 rounded-2xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="px-6 py-4 bg-brand-50 border-b border-brand-100 flex items-center gap-3">
                            <UserIcon weight="fill" className="w-5 h-5 text-brand-600" />
                            <Text.H2 className="!text-slate-800">Tambah Pengguna Baru</Text.H2>
                        </div>
                        <form onSubmit={handleAddUser} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-[12px] font-semibold text-slate-500 tracking-normal mb-2">
                                    Pilih dari Data Warga {currentScope}
                                    <span className="ml-1 font-normal text-slate-400">(opsional — auto-isi nama &amp; email)</span>
                                </label>
                                <select
                                    value={selectedWargaId}
                                    onChange={e => handleWargaSelect(e.target.value)}
                                    className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm font-medium text-gray-700"
                                >
                                    <option value="">— Pilih Warga (opsional) —</option>
                                    {wargaList
                                        .filter(w => currentScope === 'RT' ? w.jenis_kelamin === 'Laki-laki' : w.jenis_kelamin === 'Perempuan')
                                        .map(w => (
                                            <option key={w.id} value={w.id}>{w.nama} — {w.nik}</option>
                                        ))
                                    }
                                </select>
                                {wargaList.filter(w => currentScope === 'RT' ? w.jenis_kelamin === 'Laki-laki' : w.jenis_kelamin === 'Perempuan').length === 0 && (
                                    <Text.Caption className="!text-amber-600 italic">Tidak Ada Data Warga {currentScope === 'RT' ? 'Laki-Laki' : 'Perempuan'} Yang Tersedia.</Text.Caption>
                                )}
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate-500 tracking-normal mb-2">Nama Lengkap</label>
                                <input type="text" required value={newUserForm.name}
                                    onChange={e => setNewUserForm(prev => ({...prev, name: e.target.value}))}
                                    className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate-500 tracking-normal mb-2">Email</label>
                                <input type="email" required value={newUserForm.email}
                                    onChange={e => setNewUserForm(prev => ({...prev, email: e.target.value}))}
                                    className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate-500 tracking-normal mb-2">Password Default</label>
                                <input type="text" placeholder="Default: password123" value={newUserForm.password}
                                    onChange={e => setNewUserForm(prev => ({...prev, password: e.target.value}))}
                                    className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate-500 tracking-normal mb-2">Role / Hak Akses</label>
                                <select value={newUserForm.role_id}
                                    onChange={e => setNewUserForm(prev => ({...prev, role_id: e.target.value}))}
                                    className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm font-bold">
                                    <option value="">Pilih Role...</option>
                                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-slate-500 tracking-normal mb-2">Scope</label>
                                <select value={newUserForm.scope}
                                    onChange={e => setNewUserForm(prev => ({...prev, scope: e.target.value}))}
                                    className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm font-bold">
                                    <option value="RT">RT</option>
                                    <option value="PKK">PKK</option>
                                    <option value="Dasa Wisma">Dasa Wisma</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3 pt-2 border-t border-gray-100">
                                <button type="button" onClick={() => { setShowAddUserForm(false); setSelectedWargaId(''); }}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">Batal</button>
                                <button type="submit"
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-100 transition-all active:scale-95">
                                    <UserIcon weight="bold" className="inline w-4 h-4 mr-1.5" />Simpan Pengguna
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* INLINE: Add Role Form */}
                {activeRoleSubTab === 'roles' && showAddRoleForm && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
                            <ShieldCheck weight="fill" className="w-5 h-5 text-slate-700" />
                            <Text.H2 className="!text-slate-900">Tambah Peran Baru</Text.H2>
                        </div>
                        <form onSubmit={handleAddRole} className="p-6 flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-[12px] font-semibold text-slate-500 tracking-normal mb-2">Nama Role</label>
                                <input type="text" required placeholder="Contoh: Humas, Keamanan"
                                    value={newRoleForm.name}
                                    onChange={e => setNewRoleForm(prev => ({...prev, name: e.target.value}))}
                                    className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowAddRoleForm(false)}
                                    className="px-5 py-3 rounded-xl text-[14px] font-normal text-slate-500 hover:bg-gray-100 transition-all">Batal</button>
                                <button type="submit"
                                    className="px-6 py-3 rounded-xl text-[14px] font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition-all active:scale-95">Simpan Role</button>
                            </div>
                        </form>
                    </div>
                )}

                {activeRoleSubTab === 'users' ? (
                    <div className="grid grid-cols-1 gap-4">
                        {users.map(user => (
                            <div key={user.id} className={`bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all ${expandedUserId === user.id ? 'ring-2 ring-brand-500/20' : ''}`}>
                                <div className="p-5 flex items-center justify-between gap-4 relative">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[16px] bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg shadow-sm">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <Text.H2 className="!text-slate-900 leading-tight">{user.name}</Text.H2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Text.Label className="!text-brand-600 !bg-brand-50 !px-2 !py-0.5 !rounded-lg !normal-case !tracking-normal !text-[11px]">
                                                    {(user as any).role_entity?.name || user.role}
                                                </Text.Label>
                                                <Text.Caption className="!text-slate-400 !font-bold !italic">
                                                    {user.scope || 'RT'}
                                                </Text.Caption>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-auto">
                                        <HasPermission module="Manajemen User / Role" action="Ubah">
                                            <button onClick={() => handleResetPassword(user)} className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all" title="Reset Password">
                                                <Key weight="bold" className="w-[18px] h-[18px]" />
                                            </button>
                                        </HasPermission>
                                        <HasPermission module="Manajemen User / Role" action="Ubah">
                                            <button onClick={() => handleEditPermissions(user)}
                                                className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-xl transition-all border ${expandedUserId === user.id ? 'bg-brand-600 text-white border-brand-600' : 'text-slate-400 bg-slate-50 hover:bg-slate-100 border-slate-200/50'}`}>
                                                {expandedUserId === user.id ? <CaretUp weight="bold" /> : <ShieldCheck weight="bold" />}
                                                <span className="hidden sm:inline">{expandedUserId === user.id ? 'Tutup' : 'Akses'}</span>
                                            </button>
                                        </HasPermission>
                                        <HasPermission module="Manajemen User / Role" action="Hapus">
                                            <button onClick={() => handleDeleteUser(user.id, user.name)}
                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus">
                                                <Trash weight="bold" className="w-[18px] h-[18px]" />
                                            </button>
                                        </HasPermission>
                                    </div>
                                </div>

                                {expandedUserId === user.id && (
                                    <div className="p-5 pt-0 border-t border-slate-50 bg-slate-50/10">
                                        <div className="py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-1 space-y-4">
                                                <div className="bg-white p-5 rounded-[22px] border border-slate-100 shadow-sm relative overflow-hidden h-full">
                                                    <div className="absolute top-0 right-0 p-3">
                                                        <Text.Caption className={`!text-[10px] !font-bold !px-2 !py-1 !rounded-lg ${user.verification_status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {user.verification_status || 'Unverified'}
                                                        </Text.Caption>
                                                    </div>
                                                    <Text.Label className="mb-4 block border-b border-slate-50 pb-2">Informasi Akun</Text.Label>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Text.Caption className="!uppercase !tracking-widest !text-[10px] !font-bold !text-slate-400 mb-1">Email System</Text.Caption>
                                                            <Text.Body className="!text-slate-800 !font-semibold">{user.email}</Text.Body>
                                                        </div>
                                                        {user.kontak && (
                                                            <div>
                                                                <Text.Caption className="!uppercase !tracking-widest !text-[10px] !font-bold !text-slate-400 mb-1">Telepon</Text.Caption>
                                                                <Text.Body className="!text-slate-800 !font-semibold">{user.kontak}</Text.Body>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="lg:col-span-2">
                                                <div className="bg-white rounded-[22px] border border-slate-100 shadow-sm overflow-hidden">
                                                    <div className="px-5 py-4 bg-slate-900 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <ShieldCheck weight="fill" className="w-5 h-5 text-brand-400 shrink-0" />
                                                            <Text.Label className="text-white !normal-case !tracking-normal !text-[13px] truncate">Matrix Hak Akses</Text.Label>
                                                        </div>
                                                        <div className="flex gap-2 shrink-0">
                                                            <button onClick={() => setExpandedUserId(null)} className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-colors">Batal</button>
                                                            <button onClick={() => savePermissions()} className="px-3.5 py-1.5 bg-brand-600 text-white hover:bg-brand-700 rounded-lg text-[11px] font-bold transition-all shadow-lg shadow-brand-900/20">Simpan</button>
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:block overflow-x-auto no-scrollbar">
                                                        <table className="w-full text-left min-w-[500px]">
                                                            <thead>
                                                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                                                    <th className="py-3 px-4 pl-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 sticky left-0 z-10">Modul</th>
                                                                    {CRUD_ACTIONS.map(action => (
                                                                        <th key={action.id} className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.label}</th>
                                                                    ))}
                                                                    <th className="p-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scope</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-50">
                                                                {APP_MODULES.map((module) => (
                                                                    <tr key={module.id} className="hover:bg-slate-50/30 transition-colors">
                                                                        <td className="py-3 px-4 pl-5 sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[4px_0_8px_rgba(0,0,0,0.02)]">
                                                                            <Text.Body className="!text-[11px] !font-bold !text-slate-700 uppercase">{module.label}</Text.Body>
                                                                        </td>
                                                                        {CRUD_ACTIONS.map(action => {
                                                                            const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                            return (
                                                                                <td key={action.id} className="p-2 text-center">
                                                                                    <button onClick={() => togglePermission(module.id, action.id)} className={`w-7 h-7 rounded-lg border flex items-center justify-center mx-auto transition-all ${isChecked ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-slate-200 text-transparent'}`}>
                                                                                        <CheckCircle weight="bold" className="w-4 h-4" />
                                                                                    </button>
                                                                                </td>
                                                                            );
                                                                        })}
                                                                        <td className="p-2 text-center">
                                                                            <button onClick={() => toggleScope(module.id)} className="w-full py-1 text-[10px] font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                                                                                {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="md:hidden divide-y divide-slate-100 border-t border-slate-100">
                                                        {APP_MODULES.map((module) => (
                                                            <div key={module.id} className="p-4 bg-white">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <Text.Body className="!text-[12px] !font-bold !text-slate-800 uppercase">{module.label}</Text.Body>
                                                                    <button onClick={() => toggleScope(module.id)} className={`px-2 py-1 text-[10px] font-bold rounded-lg ${userPermissions[module.id]?.scope === 'personal' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                                        Scope: {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                    </button>
                                                                </div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {CRUD_ACTIONS.map(action => {
                                                                        const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                        return (
                                                                            <button key={action.id} onClick={() => togglePermission(module.id, action.id)}
                                                                                className={`px-3 py-1.5 text-[11px] font-bold rounded-full border transition-all flex items-center gap-1.5 ${isChecked ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                                {action.label}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    activeRoleSubTab === 'roles' && (
                        <div className="grid grid-cols-1 gap-4">
                            {roles.map(role => (
                                <div key={role.id} className="bg-white rounded-[24px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all">
                                    <div className="p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[16px] bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                                <ShieldCheck weight="bold" className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <Text.H2 className="!text-slate-900 leading-tight">{role.name}</Text.H2>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Text.Label className={`!px-2 !py-0.5 !rounded-lg !normal-case !tracking-normal !text-[11px] ${role.name === 'Admin' ? '!text-indigo-600 !bg-indigo-50' : '!text-slate-500 !bg-slate-100'}`}>
                                                        {role.name === 'Admin' ? 'System Role' : 'Custom Tenant Role'}
                                                    </Text.Label>
                                                    <Text.Caption className="!text-slate-400 !font-bold">
                                                        ID: {role.id.split('-')[0]}
                                                    </Text.Caption>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-auto">
                                            <HasPermission module="Manajemen User / Role" action="Ubah">
                                                <button onClick={() => handleEditRolePermissions(role)}
                                                    className={`flex items-center gap-2 px-4 py-2 text-[12px] font-bold rounded-xl transition-all border ${expandedRoleId === role.id ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200/50'}`}>
                                                    {expandedRoleId === role.id ? <CaretUp weight="bold" /> : <Palette weight="bold" />}
                                                    <span className="hidden sm:inline">{expandedRoleId === role.id ? 'Tutup' : 'Setup Hak'}</span>
                                                </button>
                                            </HasPermission>
                                            {role.name !== 'Admin' && (
                                                <HasPermission module="Manajemen User / Role" action="Hapus">
                                                    <button onClick={() => handleDeleteRole(role.id, role.name)}
                                                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus">
                                                        <Trash weight="bold" className="w-[18px] h-[18px]" />
                                                    </button>
                                                </HasPermission>
                                            )}
                                        </div>
                                    </div>

                                    {expandedRoleId === role.id && (
                                        <div className="p-4 md:p-6 pt-0 border-t border-slate-50">
                                            <div className="mt-4 bg-white rounded-[24px] border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                                                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                                                            <ShieldCheck weight="fill" className="w-5 h-5" />
                                                        </div>
                                                        <Text.Label className="!text-slate-900 !normal-case !tracking-tight !text-[13px] font-bold truncate">Matrix Akses: {role.name}</Text.Label>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button onClick={() => setExpandedRoleId(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-[11px] font-bold transition-all active-press">Batal</button>
                                                        <button onClick={() => savePermissions(undefined, role)} className="px-4 py-2 bg-brand-600 text-white hover:bg-brand-700 rounded-xl text-[11px] font-bold transition-all shadow-md shadow-brand-100 active-press">Simpan</button>
                                                    </div>
                                                </div>
                                                <div className="hidden md:block overflow-x-auto no-scrollbar">
                                                    <table className="w-full text-left min-w-[500px]">
                                                        <thead>
                                                            <tr className="bg-slate-50/30 border-b border-slate-100">
                                                                <th className="py-4 px-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest sticky left-0 z-10 bg-slate-50/30">Modul</th>
                                                                {CRUD_ACTIONS.map(action => (
                                                                    <th key={action.id} className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{action.label}</th>
                                                                ))}
                                                                <th className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Scope</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {APP_MODULES.map((module) => (
                                                                <tr key={module.id} className="hover:bg-slate-50/30 transition-colors">
                                                                    <td className="py-4 px-5 sticky left-0 bg-white z-10 border-r border-slate-50 shadow-[4px_0_8px_rgba(0,0,0,0.01)]">
                                                                        <Text.Body className="!text-[11px] !font-bold !text-slate-700 uppercase">{module.label}</Text.Body>
                                                                    </td>
                                                                    {CRUD_ACTIONS.map(action => {
                                                                        const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                        return (
                                                                            <td key={action.id} className="p-2 text-center">
                                                                                <button onClick={() => togglePermission(module.id, action.id)} 
                                                                                    className={`w-8 h-8 rounded-xl border flex items-center justify-center mx-auto transition-all ${isChecked ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-100' : 'bg-white border-slate-200 text-transparent hover:border-slate-300'}`}>
                                                                                    <CheckCircle weight="bold" className="w-4.5 h-4.5" />
                                                                                </button>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                    <td className="p-2 text-center">
                                                                        <button onClick={() => toggleScope(module.id)} 
                                                                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${userPermissions[module.id]?.scope === 'personal' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-600 border border-transparent'}`}>
                                                                            {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div className="md:hidden divide-y divide-slate-100 bg-white">
                                                    {APP_MODULES.map((module) => (
                                                        <div key={module.id} className="p-5">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400"></div>
                                                                    <Text.Body className="!text-[12px] !font-bold !text-slate-800 uppercase tracking-wide">{module.label}</Text.Body>
                                                                </div>
                                                                <button onClick={() => toggleScope(module.id)} 
                                                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all ${userPermissions[module.id]?.scope === 'personal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                                                    {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2.5">
                                                                {CRUD_ACTIONS.map(action => {
                                                                    const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                    return (
                                                                        <button key={action.id} onClick={() => togglePermission(module.id, action.id)}
                                                                            className={`px-4 py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center gap-2 ${isChecked ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                                                            <CheckCircle weight={isChecked ? "fill" : "bold"} className={`w-4 h-4 ${isChecked ? 'text-emerald-600' : 'text-slate-300'}`} />
                                                                            {action.label}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>

            {/* Reset Password Modal */}
            {resetPasswordModal.isOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setResetPasswordModal({ ...resetPasswordModal, isOpen: false })} />
                    <div className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                                    <Key weight="fill" className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">Reset Password</h3>
                                    <p className="text-[11px] text-slate-500">Ubah sandi untuk {resetPasswordModal.user?.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setResetPasswordModal({ ...resetPasswordModal, isOpen: false })} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                <X weight="bold" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Password Baru</label>
                                <div className="relative">
                                    <input 
                                        type={resetPasswordModal.showPassword ? "text" : "password"}
                                        required
                                        placeholder="Ketik password baru..."
                                        value={resetPasswordModal.newPassword}
                                        onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, newPassword: e.target.value })}
                                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 pr-10 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-sm"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setResetPasswordModal({ ...resetPasswordModal, showPassword: !resetPasswordModal.showPassword })}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        {resetPasswordModal.showPassword ? <EyeSlash weight="bold" /> : <Eye weight="bold" />}
                                    </button>
                                </div>
                            </div>
                            
                            <button 
                                onClick={submitResetPassword}
                                disabled={!resetPasswordModal.newPassword}
                                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Simpan Password
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
