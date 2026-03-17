import { useRef, useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import SignatureCanvas from 'react-signature-canvas';
import axios from 'axios';
import { useTenant } from '../../contexts/TenantContext';
import { pengaturanService } from '../../services/pengaturanService';
import { userService } from '../../services/userService';
import { pengurusService } from '../../services/pengurusService';
import { wargaService } from '../../services/wargaService';
import { User } from '../../database/db';
import { Warga } from '../../types/database';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { FloppyDisk, Money, FileText, CheckCircle, ShieldCheck, Palette, X, Plus, User as UserIcon, Eraser, QrCode, CaretDown, CaretUp } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { QRCodeCanvas } from 'qrcode.react';
import { getFullUrl } from '../../utils/url';

type PengaturanFormData = {
    nama_wilayah: string;
    alamat_sekretariat: string;
    iuran_per_bulan: number;
    iuran_tetap_dihuni: number;
    iuran_tetap_kosong: number;
    iuran_kontrak_dihuni: number;
    iuran_kontrak_kosong: number;
    warna_tema: string;
    pesan_sambutan: string;
    denda_ronda_aktif: boolean;
    denda_ronda_nominal: number;
    // Surat & Cetak
    kop_surat: string;
    format_nomor_surat: string;
    penandatangan_nama: string;
    penandatangan_jabatan: string;
    ttd_image: string;
    ttd_stempel: string;
    logo_kop: string;
    ttd_pake_qr: boolean;
    nama_ketua_rw: string;
};

// Add useForm setValue to local variable for easier access in helper functions if needed
// but since we are inside the component we can just use the destructured setValue.

const APP_MODULES = [
    { id: 'Warga', label: 'Data Warga' },
    { id: 'Pengurus', label: 'Data Pengurus' },
    { id: 'Iuran Warga', label: 'Iuran Warga' },
    { id: 'Buku Kas / Transaksi', label: 'Buku Kas / Transaksi' },
    { id: 'Notulensi', label: 'Notulensi & Kehadiran' },
    { id: 'Aset', label: 'Aset RT' },
    { id: 'Surat / Cetak', label: 'Surat Pengantar' },
    { id: 'Jadwal Ronda', label: 'Jadwal Ronda' },
    { id: 'Agenda', label: 'Agenda Kegiatan' },
    { id: 'Setup / Pengaturan', label: 'Pengaturan Sistem' },
    { id: 'Manajemen User / Role', label: 'Manajemen User & Role' }
];

const CRUD_ACTIONS = [
    { id: 'Lihat', label: 'Lihat' },
    { id: 'Buat', label: 'Buat' },
    { id: 'Ubah', label: 'Ubah' },
    { id: 'Hapus', label: 'Hapus' }
];

export default function Pengaturan() {
    const { currentTenant, currentScope } = useTenant();
    const [activeTab, setActiveTab] = useState<'profil' | 'keuangan' | 'user' | 'surat'>('profil');
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // TTD & Logo Image Upload state
    const sigPad = useRef<SignatureCanvas>(null);
    const [ttdPreview, setTtdPreview] = useState<string | null>(null);
    const [stempelPreview, setStempelPreview] = useState<string | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || '/api';


    // User Management State
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

    // Keuangan Categories State
    const [pemasukanCategories, setPemasukanCategories] = useState<string[]>([]);
    const [pengeluaranCategories, setPengeluaranCategories] = useState<string[]>([]);
    const [tahunIuran, setTahunIuran] = useState<number[]>([]);
    const [newPemasukan, setNewPemasukan] = useState('');
    const [newPengeluaran, setNewPengeluaran] = useState('');
    const [newTahun, setNewTahun] = useState('');

    const [jabatanOptions, setJabatanOptions] = useState<string[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<string[]>([]);
    const [newJabatan, setNewJabatan] = useState('');
    const [newPeriode, setNewPeriode] = useState('');
    const [allPengurus, setAllPengurus] = useState<any[]>([]);
    const [jabatanSaving, setJabatanSaving] = useState(false);
    const [periodeSaving, setPeriodeSaving] = useState(false);

    const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<PengaturanFormData>();

    const dendaRondaAktif = watch('denda_ronda_aktif');

    useEffect(() => {
        if (currentTenant) {
            pengaturanService.getAll(currentTenant.id, currentScope).then(config => {
                reset({
                    nama_wilayah: config.nama_wilayah || '',
                    alamat_sekretariat: config.alamat_sekretariat || '',
                    iuran_per_bulan: config.iuran_per_bulan || 0,
                    iuran_tetap_dihuni: config.iuran_tetap_dihuni || 0,
                    iuran_tetap_kosong: config.iuran_tetap_kosong || 0,
                    iuran_kontrak_dihuni: config.iuran_kontrak_dihuni || 0,
                    iuran_kontrak_kosong: config.iuran_kontrak_kosong || 0,
                    warna_tema: config.warna_tema || '',
                    pesan_sambutan: config.pesan_sambutan || '',
                    denda_ronda_aktif: config.denda_ronda_aktif === 'true' || config.denda_ronda_aktif === true || false,
                    denda_ronda_nominal: config.denda_ronda_nominal || 0,
                    kop_surat: config.kop_surat || '',
                    format_nomor_surat: config.format_nomor_surat || '',
                    penandatangan_nama: config.penandatangan_nama || '',
                    penandatangan_jabatan: config.penandatangan_jabatan || '',
                    ttd_image: config.ttd_image || '',
                    ttd_stempel: config.ttd_stempel || '',
                    logo_kop: config.logo_kop || '',
                    nama_ketua_rw: config.nama_ketua_rw || '',
                    ttd_pake_qr: config.ttd_pake_qr === 'true' || config.ttd_pake_qr === true || false,
                });

                // Auto-sync profile fields from tenant when not yet configured
                if (!config.nama_wilayah) {
                    // Derive RT/RW from tenant ID segments (e.g. "33.74.10.1011.50.025" ΓåÆ RW 50, RT 25)
                    const idParts = currentTenant.id.split('.');
                    const rtFromId = idParts.length >= 6 ? parseInt(idParts[5], 10).toString() : '?';
                    const rwFromId = idParts.length >= 5 ? parseInt(idParts[4], 10).toString() : '?';
                    const tenantConfig = currentTenant.config || {};
                    const rt = tenantConfig.rt || rtFromId;
                    const rw = tenantConfig.rw || rwFromId;
                    const kelurahan = tenantConfig.kelurahan || '';
                    const kecamatan = tenantConfig.kecamatan || '';
                    const kota = tenantConfig.kota || '';
                    const namaWilayah = `RT ${rt} / RW ${rw}`;
                    const alamatParts = [
                        kelurahan ? `Kelurahan ${kelurahan}` : null,
                        kecamatan ? `Kecamatan ${kecamatan}` : null,
                        kota ? `Kota ${kota}` : null,
                    ].filter(Boolean);
                    reset(prev => ({
                        ...prev,
                        nama_wilayah: namaWilayah,
                        alamat_sekretariat: alamatParts.length > 0 ? alamatParts.join(', ') : prev.alamat_sekretariat,
                        pesan_sambutan: prev.pesan_sambutan || `Selamat Datang di Portal Warga ${namaWilayah}`,
                    }));
                }

                if (config.ttd_image) {
                    setTtdPreview(config.ttd_image);
                }
                if (config.ttd_stempel) {
                    setStempelPreview(config.ttd_stempel);
                }
                if (config.logo_kop) {
                    setLogoPreview(config.logo_kop);
                }

                // Parse categories safely, fallback to empty array if not found in db
                try {
                    setPemasukanCategories(config.kategori_pemasukan ? JSON.parse(config.kategori_pemasukan) : []);
                    setPengeluaranCategories(config.kategori_pengeluaran ? JSON.parse(config.kategori_pengeluaran) : []);
                    setTahunIuran(config.opsi_tahun_iuran ? JSON.parse(config.opsi_tahun_iuran) : []);
                    setJabatanOptions(config.jabatan_pengurus ? JSON.parse(config.jabatan_pengurus) : []);
                    setPeriodeOptions(config.periode_pengurus ? JSON.parse(config.periode_pengurus) : []);
                } catch {
                    setPemasukanCategories([]);
                    setPengeluaranCategories([]);
                    setTahunIuran([]);
                    setJabatanOptions([]);
                    setPeriodeOptions([]);
                }
            });

            loadUsers();
            loadRoles();
            loadPengurus();
            loadWarga();
        }
    }, [currentTenant, currentScope, reset]);

    const loadUsers = async () => {
        if (currentTenant) {
            const data = await userService.getAllByTenant(currentTenant.id);
            setUsers(data);
        }
    };

    const loadRoles = async () => {
        if (currentTenant) {
            const response = await axios.get(`${API_URL}/role?tenant_id=${currentTenant.id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setRoles(response.data);
        }
    };

    const loadPengurus = async () => {
        if (currentTenant) {
            const data = await pengurusService.getAll(currentTenant.id, currentScope);
            setAllPengurus(data);
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
            const message = error.response?.data?.error || 'Gagal menambahkan user. Silakan coba lagi.';
            alert(message);
        }
    };

    // When a Warga is selected, auto-fill name and email
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
            await axios.post(`${API_URL}/role`, {
                tenant_id: currentTenant.id,
                name: newRoleForm.name,
                permissions: {}
            }, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            setShowAddRoleForm(false);
            setNewRoleForm({ name: '' });
            loadRoles();
        } catch (error) {
            console.error('Failed to create role', error);
            alert('Gagal menambahkan role.');
        }
    };

    const handleDeleteRole = async (id: string, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus role ${name}? User dengan role ini mungkin kehilangan akses.`)) {
            await axios.delete(`${API_URL}/role/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            loadRoles();
        }
    };

    const handleDeleteUser = async (id: string, name: string) => {
        if (confirm(`Apakah Anda yakin ingin menghapus user ${name}?`)) {
            await userService.delete(id);
            loadUsers();
        }
    };


    const handleSyncOfficialKop = () => {
        if (!currentTenant?.config) return;
        const { kota, kecamatan, kelurahan, rw, rt } = currentTenant.config;
        const lines = [
            `PEMERINTAH KOTA ${kota?.toUpperCase() || '....................'}`,
            `KECAMATAN ${kecamatan?.toUpperCase() || '....................'}`,
            `KELURAHAN ${kelurahan?.toUpperCase() || '....................'}`,
            `${currentScope} ${rt && currentScope === 'RT' ? rt : ''} ${rw ? `/ RW ${rw}` : ''}`
        ];
        setValue('kop_surat', lines.join('\n'));
    };

    const handleSyncProfile = () => {
        if (!currentTenant) return;
        const config = currentTenant.config || {};

        // Primary: use stored config fields
        // Fallback: parse from Tenant ID segments (e.g. "33.74.10.1011.50.025" ΓåÆ RW 50, RT 25)
        const idParts = currentTenant.id.split('.');
        const rtFromId = idParts.length >= 6 ? parseInt(idParts[5], 10).toString() : '';
        const rwFromId = idParts.length >= 5 ? parseInt(idParts[4], 10).toString() : '';

        const rt = config.rt || rtFromId || '?';
        const rw = config.rw || rwFromId || '?';
        const kelurahan = config.kelurahan || '';
        const kecamatan = config.kecamatan || '';
        const kota = config.kota || '';

        // Auto-fill Nama Wilayah
        const namaWilayah = `${currentScope} ${rt} / RW ${rw}`;
        setValue('nama_wilayah', namaWilayah);

        // Auto-fill Alamat Sekretariat
        const alamatParts = [
            kelurahan ? `Kelurahan ${kelurahan}` : null,
            kecamatan ? `Kecamatan ${kecamatan}` : null,
            kota ? `Kota ${kota}` : null,
        ].filter(Boolean);
        const alamat = alamatParts.length > 0 ? alamatParts.join(', ') : 'Kelurahan ..., Kecamatan ..., Kota ...';
        setValue('alamat_sekretariat', alamat);

        // Auto-fill Pesan Sambutan if empty
        if (!watch('pesan_sambutan')) {
            setValue('pesan_sambutan', `Selamat Datang di Portal Warga ${namaWilayah}`);
        }
    };

    const handleSyncOfficialSignatory = () => {
        // Find Ketua RT in current pengurus list
        const ketua = allPengurus.find(p => p.jabatan?.toLowerCase().includes('ketua') && p.jabatan?.toLowerCase().includes(currentScope.toLowerCase()));
        if (ketua && ketua.warga) {
            setValue('penandatangan_nama', ketua.warga.nama);
            setValue('penandatangan_jabatan', ketua.jabatan);
        } else {
            alert(`Data Ketua ${currentScope} tidak ditemukan di daftar Pengurus.`);
        }
    };

    // --- Auto-persist helpers for jabatan & periode ---
    const persistJabatan = async (list: string[]) => {
        if (!currentTenant) return;
        setJabatanSaving(true);
        try {
            await pengaturanService.save(currentTenant.id, currentScope, 'jabatan_pengurus', JSON.stringify(list));
        } catch (e) { console.error('Failed to save jabatan:', e); }
        finally { setJabatanSaving(false); }
    };

    const persistPeriode = async (list: string[]) => {
        if (!currentTenant) return;
        setPeriodeSaving(true);
        try {
            await pengaturanService.save(currentTenant.id, currentScope, 'periode_pengurus', JSON.stringify(list));
        } catch (e) { console.error('Failed to save periode:', e); }
        finally { setPeriodeSaving(false); }
    };

    const onSubmit = async (data: PengaturanFormData) => {
        if (!currentTenant) return;

        setIsSaving(true);
        try {
            let finalTtdUrl = ttdPreview;

            // If ttdPreview is still a dataURL (base64 from signature canvas), upload it first
            if (ttdPreview && ttdPreview.startsWith('data:')) {
                const blob = await (await fetch(ttdPreview)).blob();
                const file = new File([blob], `signature-${currentTenant.id}.png`, { type: 'image/png' });
                const formData = new FormData();
                formData.append('file', file);

                const response = await axios.post(`${API_URL}/upload`, formData);
                finalTtdUrl = response.data.url;
                setTtdPreview(finalTtdUrl); // Update state to the new URL
            }

            const finalData = {
                ...data,
                ttd_image: finalTtdUrl || '',
                ttd_stempel: stempelPreview || '',
                logo_kop: logoPreview || '',
                kategori_pemasukan: JSON.stringify(pemasukanCategories),
                kategori_pengeluaran: JSON.stringify(pengeluaranCategories),
                opsi_tahun_iuran: JSON.stringify(tahunIuran),
                jabatan_pengurus: JSON.stringify(jabatanOptions),
                periode_pengurus: JSON.stringify(periodeOptions)
            };
            await pengaturanService.saveMultiple(currentTenant.id, currentScope, finalData);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error("Gagal menyimpan pengaturan:", error);
            alert("Terjadi kesalahan saat menyimpan pengaturan sistem.");
        } finally {
            setIsSaving(false);
        }
    };

    const addCategory = (type: 'masuk' | 'keluar' | 'tahun' | 'jabatan' | 'periode') => {
        if (type === 'masuk' && newPemasukan.trim()) {
            if (!pemasukanCategories.includes(newPemasukan.trim())) {
                setPemasukanCategories([...pemasukanCategories, newPemasukan.trim()]);
            }
            setNewPemasukan('');
        } else if (type === 'keluar' && newPengeluaran.trim()) {
            if (!pengeluaranCategories.includes(newPengeluaran.trim())) {
                setPengeluaranCategories([...pengeluaranCategories, newPengeluaran.trim()]);
            }
            setNewPengeluaran('');
        } else if (type === 'tahun' && newTahun.trim()) {
            const tahun = parseInt(newTahun.trim(), 10);
            if (!isNaN(tahun) && !tahunIuran.includes(tahun)) {
                setTahunIuran([...tahunIuran, tahun].sort((a, b) => b - a));
            }
            setNewTahun('');
        } else if (type === 'jabatan' && newJabatan.trim()) {
            const val = newJabatan.trim();
            if (!jabatanOptions.includes(val)) {
                const updated = [...jabatanOptions, val];
                setJabatanOptions(updated);
                persistJabatan(updated);
            }
            setNewJabatan('');
        } else if (type === 'periode' && newPeriode.trim()) {
            const val = newPeriode.trim();
            if (!periodeOptions.includes(val)) {
                const updated = [...periodeOptions, val];
                setPeriodeOptions(updated);
                persistPeriode(updated);
            }
            setNewPeriode('');
        }
    };

    const removeCategory = (type: 'masuk' | 'keluar' | 'tahun' | 'jabatan' | 'periode', catOrYear: string | number) => {
        if (type === 'masuk') {
            setPemasukanCategories(pemasukanCategories.filter(c => c !== catOrYear as string));
        } else if (type === 'keluar') {
            setPengeluaranCategories(pengeluaranCategories.filter(c => c !== catOrYear as string));
        } else if (type === 'tahun') {
            setTahunIuran(tahunIuran.filter(y => y !== catOrYear as number));
        } else if (type === 'jabatan') {
            // Guard: warn if any active Pengurus uses this jabatan
            const inUse = (allPengurus || []).filter(p => p.jabatan === catOrYear && p.status === 'aktif');
            if (inUse.length > 0) {
                const names = inUse.map(p => p.warga?.nama || 'Unknown').join(', ');
                const confirm = window.confirm(
                    `Jabatan "${catOrYear}" masih digunakan oleh ${inUse.length} pengurus aktif (${names}).\n\nHapus jabatan ini dari daftar pengaturan? Data pengurus yang ada tidak akan dihapus, namun jabatan tersebut tidak akan muncul di pilihan baru.`
                );
                if (!confirm) return;
            }
            const updated = (jabatanOptions || []).filter(j => j !== catOrYear as string);
            setJabatanOptions(updated);
            persistJabatan(updated);
        } else if (type === 'periode') {
            // Guard: warn if any Pengurus uses this periode
            const inUse = (allPengurus || []).filter(p => p.periode === catOrYear);
            if (inUse.length > 0) {
                const confirm = window.confirm(
                    `Periode "${catOrYear}" masih memiliki ${inUse.length} data pengurus (termasuk riwayat).\n\nHapus periode ini dari daftar pengaturan? Data pengurus yang ada tidak akan dihapus, namun periode tersebut tidak akan muncul di pilihan baru.`
                );
                if (!confirm) return;
            }
            const updated = (periodeOptions || []).filter(p => p !== catOrYear as string);
            setPeriodeOptions(updated);
            persistPeriode(updated);
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

        // Robust role permission lookup: Priority: user.role_entity > roles state fallback
        let role = (user as any).role_entity;
        if (!role && user.role_id) {
            role = roles.find(r => r.id === user.role_id);
        }
        
        const rolePerms = role?.permissions || {};

        APP_MODULES.forEach(mod => {
            // Priority: User Override > Role Default > Empty
            const uData = userPerms[mod.id];
            const rData = rolePerms[mod.id];
            
            let actions: string[] = [];
            let scope: 'all' | 'personal' = 'all';

            // Check Role Defaults first
            if (Array.isArray(rData)) {
                actions = [...rData];
            } else if (rData && typeof rData === 'object') {
                actions = [...(rData.actions || [])];
                scope = rData.scope || 'all';
            }

            // Apply User Overrides
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
                await axios.put(`${API_URL}/role/${role.id}`, {
                    ...role,
                    permissions: userPermissions
                }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
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

    const handleSignatureEnd = async () => {
        if (sigPad.current) {
            const dataUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
            // We set the preview immediately for UX, but we need to upload it too or on save.
            // Improving it by uploading only when saved might be better or uploading now.
            // Let's keep it as preview for now and upload in onSubmit to minimize orphan files.
            setTtdPreview(dataUrl);
        }
    };

    const clearSignature = () => {
        if (sigPad.current) {
            sigPad.current.clear();
            setTtdPreview(null);
        }
    };

    const handleStempelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Ukuran file stempel maksimal 2MB");
                return;
            }

            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(`${API_URL}/upload`, formData);
                setStempelPreview(response.data.url);
            } catch (err) {
                console.error("Gagal upload stempel:", err);
                alert("Gagal mengunggah stempel. Silakan coba lagi.");
            } finally {
                setIsUploading(true); // intentional to check state flow or just false
                setIsUploading(false);
            }
        }
    };

    const handleRemoveStempel = async () => {
        if (!currentTenant) return;
        if (!window.confirm("Hapus logo stempel RT secara permanen?")) return;

        try {
            await pengaturanService.save(currentTenant.id, currentScope, 'ttd_stempel', '');
            setStempelPreview(null);
        } catch (err) {
            console.error("Gagal menghapus stempel:", err);
            alert("Gagal menghapus stempel dari database.");
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1 * 1024 * 1024) {
                alert("Ukuran file logo maksimal 1MB");
                return;
            }

            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await axios.post(`${API_URL}/upload`, formData);
                setLogoPreview(response.data.url);
            } catch (err) {
                console.error("Gagal upload logo:", err);
                alert("Gagal mengunggah logo. Silakan coba lagi.");
            } finally {
                setIsUploading(false);
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="page-title">Pengaturan Sistem</h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                        Konfigurasi khusus untuk scope <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                    </p>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100 uppercase tracking-widest shadow-sm">
                    {currentScope} Active
                </div>
            </div>

            {/* System Tabs (Premium Segmented Control) */}
            <div className="flex flex-wrap lg:flex-nowrap bg-gray-100/70 p-1.5 rounded-2xl border border-gray-200/60 w-full mb-6 gap-1 relative overflow-hidden">
                <button
                    onClick={() => setActiveTab('profil')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-2 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'profil' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
                >
                    <FileText weight={activeTab === 'profil' ? 'fill' : 'duotone'} className="w-5 h-5" />
                    <span className="hidden sm:inline">Profil & Tema</span>
                </button>
                <button
                    onClick={() => setActiveTab('keuangan')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-2 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'keuangan' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
                >
                    <Money weight={activeTab === 'keuangan' ? 'fill' : 'duotone'} className="w-5 h-5" />
                    <span className="hidden sm:inline">Keuangan ({currentScope})</span>
                </button>
                <button
                    onClick={() => setActiveTab('user')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-2 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'user' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
                >
                    <ShieldCheck weight={activeTab === 'user' ? 'fill' : 'duotone'} className="w-5 h-5" />
                    <span className="hidden sm:inline">User & Hak Akses</span>
                </button>
                <button
                    onClick={() => setActiveTab('surat')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-2 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'surat' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'}`}
                >
                    <FileText weight={activeTab === 'surat' ? 'fill' : 'duotone'} className="w-5 h-5" />
                    <span className="hidden sm:inline">Surat & Cetak</span>
                </button>
            </div>

            {/* TAB CONTENT: PROFIL, KEUANGAN, SURAT */}
            {(activeTab === 'profil' || activeTab === 'keuangan' || activeTab === 'surat') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit(onSubmit)}>

                        {/* Tab: Profil */}
                        {activeTab === 'profil' && (
                            <div className="p-6 md:p-8 animate-fade-in">
                                <div className="grid grid-cols-1 gap-8">
                                    <div className="md:col-span-2 flex justify-between items-end gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wilayah / Institusi ({currentScope})</label>
                                            <input type="text" {...register('nama_wilayah', { required: 'Wajib diisi' })} className="w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none" />
                                            {errors.nama_wilayah && <p className="text-red-500 text-xs mt-1">{errors.nama_wilayah.message}</p>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleSyncProfile}
                                            className="mb-[2px] flex items-center gap-2 px-4 py-3 bg-brand-50 text-brand-700 rounded-xl text-xs font-bold hover:bg-brand-100 transition-all border border-brand-200/50 whitespace-nowrap"
                                        >
                                            <CheckCircle weight="bold" />
                                            Sinkron dari Onboarding
                                        </button>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Sekretariat Lengkap</label>
                                        <textarea rows={2} {...register('alamat_sekretariat')} className="w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Sambutan Utama</label>
                                        <input type="text" {...register('pesan_sambutan')} className="w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none" />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Palette weight="fill" className="text-brand-500 w-5 h-5" />
                                        <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider">Aksen Warna Tema Sistem</label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-200/50">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-4">Pilih warna primer yang mewakili identitas wilayah <span className="font-bold uppercase text-brand-700">{currentScope}</span>.</p>
                                            <div className="flex flex-wrap gap-3">
                                                {['emerald', 'rose', 'indigo', 'amber', 'sky', 'slate'].map((color) => {
                                                    const colorMap: Record<string, string> = {
                                                        emerald: 'bg-emerald-500',
                                                        rose: 'bg-rose-500',
                                                        indigo: 'bg-indigo-500',
                                                        amber: 'bg-amber-500',
                                                        sky: 'bg-sky-500',
                                                        slate: 'bg-slate-700'
                                                    };
                                                    const activeColor = watch('warna_tema');
                                                    return (
                                                        <button
                                                            key={color}
                                                            type="button"
                                                            onClick={() => reset({ ...watch(), warna_tema: color })}
                                                            className={`w-10 h-10 rounded-full ${colorMap[color]} transition-all flex items-center justify-center hover:scale-110 shadow-sm ${activeColor === color ? 'ring-4 ring-offset-2 ring-gray-300 scale-110' : ''}`}
                                                        >
                                                            {activeColor === color && <CheckCircle weight="bold" className="text-white w-6 h-6" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xs`}>A</div>
                                                <div className="flex-1">
                                                    <div className="h-2 w-24 bg-gray-100 rounded mb-1"></div>
                                                    <div className="h-1.5 w-16 bg-gray-50 rounded"></div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="h-2 w-16 bg-brand-200 rounded"></div>
                                                    <div className="h-4 w-8 bg-brand-500 rounded-full"></div>
                                                </div>
                                                <div className="h-8 w-full bg-brand-600 rounded-lg"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* JABATAN */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider">Daftar Jabatan {currentScope}</label>
                                            {jabatanSaving && <span className="text-[10px] text-brand-500 font-bold animate-pulse">ΓùÅ Menyimpan...</span>}
                                            {!jabatanSaving && jabatanOptions.length > 0 && <span className="text-[10px] text-emerald-500 font-bold">Γ£ô Tersimpan</span>}
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newJabatan}
                                                onChange={e => setNewJabatan(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory('jabatan'))}
                                                className="flex-1 rounded-lg shadow-sm p-2 border focus:border-brand-500 outline-none text-sm"
                                                placeholder="Contoh: Koordinator"
                                            />
                                            <button type="button" onClick={() => addCategory('jabatan')} className="px-3 bg-brand-100 text-brand-700 hover:bg-brand-200 rounded-lg text-sm font-medium transition-colors">Tambah</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {jabatanOptions.length === 0 && <p className="text-[10px] text-gray-400 italic">Belum ada jabatan. Tambahkan di atas.</p>}
                                            {jabatanOptions.map(jab => {
                                                const usageCount = allPengurus.filter(p => p.jabatan === jab && p.status === 'aktif').length;
                                                return (
                                                    <span key={jab} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border shadow-sm ${usageCount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-gray-700 border-gray-200'
                                                        }`}>
                                                        {jab}
                                                        {usageCount > 0 && <span className="ml-1 text-[9px] bg-emerald-200 text-emerald-800 rounded-full px-1 font-black">{usageCount}</span>}
                                                        <button type="button" onClick={() => removeCategory('jabatan', jab)} className="w-4 h-4 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center font-bold text-[10px] transition-colors">&times;</button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* PERIODE */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider">Periode ({currentScope})</label>
                                            {periodeSaving && <span className="text-[10px] text-brand-500 font-bold animate-pulse">ΓùÅ Menyimpan...</span>}
                                            {!periodeSaving && periodeOptions.length > 0 && <span className="text-[10px] text-emerald-500 font-bold">Γ£ô Tersimpan</span>}
                                        </div>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={newPeriode}
                                                onChange={e => setNewPeriode(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory('periode'))}
                                                className="flex-1 rounded-lg shadow-sm p-2 border focus:border-brand-500 outline-none text-sm"
                                                placeholder="Contoh: 2024 - 2027"
                                            />
                                            <button type="button" onClick={() => addCategory('periode')} className="px-3 bg-brand-100 text-brand-700 hover:bg-brand-200 rounded-lg text-sm font-medium transition-colors">Tambah</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {periodeOptions.length === 0 && <p className="text-[10px] text-gray-400 italic">Belum ada periode. Tambahkan di atas.</p>}
                                            {periodeOptions.map(per => {
                                                const total = allPengurus.filter(p => p.periode === per).length;
                                                const aktif = allPengurus.filter(p => p.periode === per && p.status === 'aktif').length;
                                                return (
                                                    <span key={per} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border shadow-sm ${aktif > 0 ? 'bg-blue-50 text-blue-700 border-blue-200' : total > 0 ? 'bg-gray-50 text-gray-600 border-gray-200' : 'bg-white text-gray-700 border-gray-200'
                                                        }`}>
                                                        {per}
                                                        {total > 0 && <span className={`ml-1 text-[9px] rounded-full px-1 font-black ${aktif > 0 ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                                                            }`}>{aktif > 0 ? `${aktif} aktif` : `${total} riwayat`}</span>}
                                                        <button type="button" onClick={() => removeCategory('periode', per)} className="w-4 h-4 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center font-bold text-[10px] transition-colors">&times;</button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Keuangan */}
                        {activeTab === 'keuangan' && (
                            <div className="p-6 md:p-8 animate-fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Money weight="fill" className="text-emerald-500 w-5 h-5" />
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Kategori Pemasukan</h3>
                                            </div>
                                            <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newPemasukan}
                                                        onChange={(e) => setNewPemasukan(e.target.value)}
                                                        placeholder="Contoh: Iuran Sampah"
                                                        className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white transition-all shadow-sm"
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory('masuk'))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => addCategory('masuk')}
                                                        className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95"
                                                    >
                                                        <Plus weight="bold" className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                    {pemasukanCategories.map((cat, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 group hover:bg-emerald-100 transition-all">
                                                            <span>{cat}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCategory('masuk', cat)}
                                                                className="text-emerald-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <X weight="bold" className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {pemasukanCategories.length === 0 && <p className="text-[10px] text-gray-400 italic">Belum ada kategori pemasukan</p>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Money weight="fill" className="text-rose-500 w-5 h-5" />
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Kategori Pengeluaran</h3>
                                            </div>
                                            <div className="bg-gray-50/50 border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newPengeluaran}
                                                        onChange={(e) => setNewPengeluaran(e.target.value)}
                                                        placeholder="Contoh: Perbaikan Jalan"
                                                        className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white transition-all shadow-sm"
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory('keluar'))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => addCategory('keluar')}
                                                        className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-md active:scale-95"
                                                    >
                                                        <Plus weight="bold" className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                                    {pengeluaranCategories.map((cat, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-xs font-bold border border-rose-100 group hover:bg-rose-100 transition-all">
                                                            <span>{cat}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeCategory('keluar', cat)}
                                                                className="text-rose-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <X weight="bold" className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {pengeluaranCategories.length === 0 && <p className="text-[10px] text-gray-400 italic">Belum ada kategori pengeluaran</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                                Kewajiban & Iuran
                                            </h3>
                                            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Tetap - Dihuni</label>
                                                        <Controller
                                                            name="iuran_tetap_dihuni"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Tetap - Kosong</label>
                                                        <Controller
                                                            name="iuran_tetap_kosong"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Kontrak - Dihuni</label>
                                                        <Controller
                                                            name="iuran_kontrak_dihuni"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">Kontrak - Kosong</label>
                                                        <Controller
                                                            name="iuran_kontrak_kosong"
                                                            control={control}
                                                            render={({ field }) => (
                                                                <CurrencyInput {...field} className="bg-gray-50/50 p-3 border-gray-200 rounded-xl" />
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-gray-100">
                                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Opsi Tahun Pembayaran</label>
                                                    <div className="flex gap-2 mb-4">
                                                        <input
                                                            type="number"
                                                            value={newTahun}
                                                            onChange={e => setNewTahun(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory('tahun'))}
                                                            className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all shadow-sm"
                                                            placeholder="2026"
                                                        />
                                                        <button type="button" onClick={() => addCategory('tahun')} className="p-3 bg-brand-100 text-brand-700 rounded-xl hover:bg-brand-200 transition-all font-bold text-xs uppercase shadow-sm">Tambah</button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {tahunIuran.map(tahun => (
                                                            <div key={tahun} className="flex items-center gap-2 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full text-xs font-black border border-brand-200">
                                                                {tahun}
                                                                <button type="button" onClick={() => removeCategory('tahun', tahun)} className="text-brand-300 hover:text-red-500 transition-colors">&times;</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 text-white rounded-2xl p-7 space-y-5 shadow-xl shadow-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-base font-bold">Sistem Denda Ronda</h4>
                                                    <p className="text-xs text-slate-400 mt-1">Terapkan denda otomatis bagi yang tidak hadir.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" {...register('denda_ronda_aktif')} className="sr-only peer" />
                                                    <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>

                                            {dendaRondaAktif && (
                                                <div className="animate-fade-in pt-4 border-t border-slate-700">
                                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Nominal Denda Per Ketidakhadiran</label>
                                                    <Controller
                                                        name="denda_ronda_nominal"
                                                        control={control}
                                                        render={({ field }) => (
                                                            <CurrencyInput {...field} className="bg-slate-800 border-slate-700 text-white placeholder-slate-500 rounded-xl p-4 focus:ring-emerald-500" />
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Surat & Cetak with Live Preview */}
                        {activeTab === 'surat' && (
                            <div className="p-6 md:p-8 animate-fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                                    {/* Column 1: Konfigurasi dan Validasi Tanda Tangan */}
                                    <div className="space-y-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                        <div className="space-y-6">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-brand-100 pb-2 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                                Konfigurasi Kop & Nomor
                                            </h3>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">Teks Kop Surat (Enter untuk Baris Baru)</label>
                                                    <button
                                                        type="button"
                                                        onClick={handleSyncOfficialKop}
                                                        className="text-[10px] font-bold bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 hover:bg-brand-100 transition-colors flex items-center gap-1"
                                                    >
                                                        Γ£¿ Sinkron Data Resmi
                                                    </button>
                                                </div>
                                                <textarea
                                                    rows={4}
                                                    {...register('kop_surat')}
                                                    className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-center font-bold text-sm bg-gray-50 focus:bg-white transition-all"
                                                    placeholder="KONTEN KOP SURAT ANDA"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Unggah Logo Kop (PNG/JPG)</label>
                                                <div className="relative group mb-4">
                                                    <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-brand-50/30 group-hover:border-brand-300 transition-all cursor-pointer h-24 overflow-hidden">
                                                        <input
                                                            type="file"
                                                            accept="image/png, image/jpeg"
                                                            onChange={handleLogoUpload}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        {logoPreview ? (
                                                            <div className="relative h-full flex items-center justify-center">
                                                                <img src={logoPreview} alt="Logo Preview" className="h-full object-contain" />
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setLogoPreview(null); }}
                                                                    className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                                                                >
                                                                    <X weight="bold" className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 group-hover:scale-110 transition-all">
                                                                    <Plus weight="bold" className="text-gray-400 w-4 h-4" />
                                                                </div>
                                                                <span className="text-xs font-semibold text-gray-500">Klik untuk upload logo</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Format Nomor Surat</label>
                                                <input
                                                    type="text"
                                                    {...register('format_nomor_surat')}
                                                    className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm bg-gray-50 focus:bg-white transition-all"
                                                    placeholder="[NOMOR]/[SCOPE]/[BULAN_ROMAWI]/[TAHUN]"
                                                />
                                                <p className="text-[10px] text-gray-400 mt-2 italic px-1">Placeholder: [NOMOR], [SCOPE], [BULAN_ROMAWI], [TAHUN], [KODE_WILAYAH]</p>
                                            </div>
                                        </div>

                                        <div className="space-y-6 pt-4">
                                            <div className="flex justify-between items-center border-b border-brand-100 pb-2">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-brand-500"></div>
                                                    Validasi Tanda Tangan
                                                </h3>
                                                <button
                                                    type="button"
                                                    onClick={handleSyncOfficialSignatory}
                                                    className="text-[10px] font-bold bg-brand-50 text-brand-600 px-3 py-1 rounded-full border border-brand-100 hover:bg-brand-100 transition-colors flex items-center gap-1"
                                                >
                                                    ≡ƒæñ Ambil Pengurus
                                                </button>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Penandatangan RT</label>
                                                    <input type="text" {...register('penandatangan_nama')} placeholder="Contoh: Budi Santoso" className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Jabatan Penandatangan RT</label>
                                                    <input type="text" {...register('penandatangan_jabatan')} placeholder="Contoh: Ketua RT. 01" className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Ketua RW (Mengetahui)</label>
                                                    <input type="text" {...register('nama_ketua_rw')} placeholder="Contoh: Drs. Sukirno, M.Pd." className="w-full rounded-xl shadow-sm p-4 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-gray-50 focus:bg-white transition-all text-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Opsi QR, Signature, Stempel, Preview & Button */}
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                            <div className="flex items-center justify-between bg-brand-50/50 border border-brand-100 rounded-2xl p-4 shadow-sm">
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                        <QrCode weight="fill" className="w-5 h-5 text-brand-500" />
                                                        Gunakan opsi QR Code
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 mt-1">Ganti tanda tangan basah dengan verifikasi QR Code.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" {...register('ttd_pake_qr')} className="sr-only peer" />
                                                    <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="block text-sm font-medium text-gray-700">Tanda Tangan Digital Touchscreen</label>
                                                        <button
                                                            type="button"
                                                            onClick={clearSignature}
                                                            className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase tracking-wider"
                                                        >
                                                            <Eraser weight="bold" /> Bersihkan
                                                        </button>
                                                    </div>
                                                    <div className="border border-gray-200 rounded-2xl bg-white overflow-hidden h-32 relative group shadow-sm ring-1 ring-gray-100">
                                                        <SignatureCanvas
                                                            ref={sigPad}
                                                            penColor="black"
                                                            onEnd={handleSignatureEnd}
                                                            canvasProps={{
                                                                className: 'signature-canvas w-full h-full cursor-crosshair',
                                                            }}
                                                        />
                                                        {!ttdPreview && (
                                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 bg-gray-50/10">
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Goreskan Tanda Tangan</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700">Logo Stempel RT</label>
                                                    <div className="relative group">
                                                        <div className="border border-dashed border-gray-300 rounded-2xl p-4 flex flex-col items-center justify-center bg-gray-50 group-hover:bg-brand-50/30 group-hover:border-brand-300 transition-all cursor-pointer h-32 overflow-hidden shadow-sm">
                                                            <input
                                                                type="file"
                                                                accept="image/png, image/jpeg"
                                                                onChange={handleStempelUpload}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            />
                                                            {stempelPreview ? (
                                                                <div className="relative h-full flex items-center justify-center">
                                                                    <img src={stempelPreview} alt="Stempel Preview" className="h-full object-contain mix-blend-multiply" />
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveStempel(); }}
                                                                        className="absolute -top-1 -right-1 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm"
                                                                    >
                                                                        <X weight="bold" className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="text-center flex flex-col items-center gap-1">
                                                                    <Plus weight="bold" className="text-gray-400 w-5 h-5" />
                                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unggah Stempel</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview Surat */}
                                        <div className="bg-gray-100/50 p-6 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden border border-gray-200 shadow-inner">
                                            <div className="absolute top-4 right-4 z-30">
                                                <span className="flex items-center gap-1.5 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-[9px] font-black text-emerald-600 border border-emerald-100 uppercase tracking-widest shadow-sm">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    Live Preview
                                                </span>
                                            </div>

                                            <div className="w-full max-w-[320px] aspect-[1/1.4] bg-white shadow-xl rounded-sm p-6 flex flex-col origin-center">
                                                {/* Kop Preview */}
                                                <div className="border-b-[1.5px] border-black pb-1 mb-3 text-center flex items-center gap-2">
                                                    {logoPreview ? (
                                                        <img src={logoPreview} alt="Logo" className="w-8 h-8 object-contain" />
                                                    ) : (
                                                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                            <FileText className="text-gray-300 w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        {watch('kop_surat')?.split('\n').map((line, i) => (
                                                            <p key={i} className={`font-bold mt-0 leading-tight uppercase ${i === 0 ? 'text-[8px]' : 'text-[6px] text-gray-700'}`}>
                                                                {line || (i === 0 ? 'KOP SURAT' : '')}
                                                            </p>
                                                        )) || <div className="h-4 bg-gray-50 rounded animate-pulse"></div>}
                                                    </div>
                                                </div>

                                                {/* Body Fake Text */}
                                                <div className="space-y-3 flex-1 overflow-hidden">
                                                    <div className="space-y-1.5">
                                                        <div className="h-1.5 w-full bg-gray-50 rounded"></div>
                                                        <div className="h-1.5 w-[90%] bg-gray-50 rounded"></div>
                                                        <div className="h-1.5 w-[95%] bg-gray-50 rounded"></div>
                                                    </div>
                                                    <div className="space-y-1">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="flex gap-1.5">
                                                                <div className="h-1.5 w-12 bg-gray-100 rounded"></div>
                                                                <div className="h-1.5 w-0.5 bg-gray-200 rounded"></div>
                                                                <div className="h-1.5 w-24 bg-gray-50 rounded"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Signature Preview */}
                                                <div className="mt-6 flex justify-end">
                                                    <div className="text-center w-28 relative">
                                                        <p className="text-[6px] mb-1 font-bold leading-tight uppercase tracking-wider">Ketua {currentScope}</p>

                                                        <div className="h-12 flex items-center justify-center relative translate-y-[2px]">
                                                            {watch('ttd_pake_qr') ? (
                                                                <div className="bg-white p-1 rounded-sm border border-gray-100 shadow-sm relative z-20">
                                                                    <QRCodeCanvas
                                                                        value={`${window.location.origin}/verify/sample-doc-id`}
                                                                        size={36}
                                                                        level="H"
                                                                    />
                                                                </div>
                                                            ) : ttdPreview ? (
                                                                <img
                                                                    src={getFullUrl(ttdPreview)}
                                                                    alt="Signature"
                                                                    className="max-h-12 w-auto object-contain mix-blend-multiply brightness-90 contrast-125 relative z-20"
                                                                />
                                                            ) : (
                                                                <div className="h-4 w-12 border-b border-dashed border-gray-200 relative z-20"></div>
                                                            )}
                                                            {!watch('ttd_pake_qr') && stempelPreview && (
                                                                <img
                                                                    src={getFullUrl(stempelPreview)}
                                                                    alt="Stamp"
                                                                    className="absolute left-1/2 top-1/2 -translate-x-[80%] -translate-y-1/2 w-16 h-16 object-contain opacity-75 mix-blend-multiply pointer-events-none z-10"
                                                                />
                                                            )}
                                                        </div>

                                                        <p className="text-[7px] font-bold underline mt-3 uppercase leading-none">( {watch('penandatangan_nama') || 'RT NAME'} )</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Button Simpan */}
                                        <HasPermission module="Setup / Pengaturan" action="Ubah">
                                            <button
                                                type="submit"
                                                disabled={isSaving || isUploading}
                                                className="w-full py-4 bg-gray-900 hover:bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-3 font-bold shadow-xl shadow-gray-200 hover-lift active-press transition-all disabled:opacity-70 group"
                                            >
                                                <FloppyDisk weight="bold" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                <span className="uppercase tracking-widest text-xs">{isSaving ? 'Menyimpan...' : isUploading ? 'Mengunggah...' : `Simpan Pengaturan ${currentScope}`}</span>
                                            </button>
                                        </HasPermission>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab !== 'surat' && (
                            <div className="p-6 flex items-center justify-between bg-gray-50/50 border-t border-gray-100">
                                <div className="flex-1">
                                    {showSuccess && (
                                        <div className="inline-flex items-center gap-2 text-brand-600 text-sm font-medium animate-fade-in">
                                            <CheckCircle weight="fill" className="w-5 h-5" />
                                            Pengaturan {currentScope} Tersimpan!
                                        </div>
                                    )}
                                </div>
                                <HasPermission module="Setup / Pengaturan" action="Ubah">
                                    <button type="submit" disabled={isSaving || isUploading} className="px-6 py-2.5 bg-gray-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-2 font-medium hover-lift active-press transition-all disabled:opacity-70">
                                        <FloppyDisk weight="bold" />
                                        <span>{isSaving ? 'Menyimpan...' : isUploading ? 'Mengunggah...' : `Simpan ${currentScope}`}</span>
                                    </button>
                                </HasPermission>
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* TAB CONTENT: USER MANAGEMENT */}
            {
                activeTab === 'user' && (
                    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white border border-gray-200 p-6 rounded-3xl shadow-sm">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h3 className="text-[20px] font-bold text-slate-800 leading-none">Manajemen Akses</h3>
                                    <p className="text-[12px] text-slate-500 mt-2 font-medium uppercase tracking-wider">Pengaturan RBAC & Hak Akses per tenant.</p>
                                </div>
                                <div className="h-10 w-[1px] bg-gray-100 hidden md:block"></div>
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setActiveRoleSubTab('users')}
                                        className={`px-4 py-2 text-[14px] font-normal rounded-lg transition-all ${activeRoleSubTab === 'users' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Pengguna
                                    </button>
                                    <button 
                                        onClick={() => setActiveRoleSubTab('roles')}
                                        className={`px-4 py-2 text-[14px] font-normal rounded-lg transition-all ${activeRoleSubTab === 'roles' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                        Role / Peran
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {activeRoleSubTab === 'users' ? (
                                    <HasPermission module="Setup / Pengaturan" action="Buat">
                                        <button 
                                            onClick={() => { setShowAddUserForm(v => !v); setExpandedUserId(null); }}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-normal shadow-lg transition-all text-[14px] ${showAddUserForm ? 'bg-slate-800 text-white shadow-slate-500/20' : 'bg-brand-600 text-white shadow-brand-500/20 hover:scale-105 active:scale-95'}`}>
                                            {showAddUserForm ? <X weight="bold" /> : <Plus weight="bold" />}
                                            <span>{showAddUserForm ? 'Batal' : 'Tambah Pengguna'}</span>
                                        </button>
                                    </HasPermission>
                                ) : (
                                    <HasPermission module="Setup / Pengaturan" action="Buat">
                                        <button 
                                            onClick={() => setShowAddRoleForm(v => !v)}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-normal shadow-lg transition-all text-[14px] ${showAddRoleForm ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-800 text-white shadow-slate-500/20 hover:scale-105 active:scale-95'}`}>
                                            {showAddRoleForm ? <X weight="bold" /> : <Plus weight="bold" />}
                                            <span>{showAddRoleForm ? 'Batal' : 'Tambah Peran'}</span>
                                        </button>
                                    </HasPermission>
                                )}
                            </div>
                        </div>

                        {/* INLINE: Add User Form */}
                        {activeRoleSubTab === 'users' && showAddUserForm && (
                            <div className="bg-white border border-brand-200 rounded-2xl shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="px-6 py-4 bg-brand-50 border-b border-brand-100 flex items-center gap-3">
                                    <UserIcon weight="fill" className="w-5 h-5 text-brand-600" />
                                    <h3 className="text-[14px] font-semibold text-slate-800 uppercase tracking-widest">Tambah Pengguna Baru</h3>
                                </div>
                                <form onSubmit={handleAddUser} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Warga Selector */}
                                    <div className="md:col-span-2">
                                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
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
                                            <p className="text-[12px] text-amber-600 mt-1 italic">Tidak ada data warga {currentScope === 'RT' ? 'laki-laki' : 'perempuan'} yang tersedia.</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Nama Lengkap</label>
                                        <input type="text" required value={newUserForm.name}
                                            onChange={e => setNewUserForm(prev => ({...prev, name: e.target.value}))}
                                            className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Email</label>
                                        <input type="email" required value={newUserForm.email}
                                            onChange={e => setNewUserForm(prev => ({...prev, email: e.target.value}))}
                                            className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Password Default</label>
                                        <input type="text" placeholder="Default: password123" value={newUserForm.password}
                                            onChange={e => setNewUserForm(prev => ({...prev, password: e.target.value}))}
                                            className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Role / Hak Akses</label>
                                        <select value={newUserForm.role_id}
                                            onChange={e => setNewUserForm(prev => ({...prev, role_id: e.target.value}))}
                                            className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none bg-white text-sm font-bold">
                                            <option value="">Pilih Role...</option>
                                            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Scope</label>
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
                                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Batal</button>
                                        <button type="submit"
                                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition-all active:scale-95">
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
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Tambah Peran Baru</h3>
                                </div>
                                <form onSubmit={handleAddRole} className="p-6 flex gap-4 items-end">
                                    <div className="flex-1">
                                        <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Nama Role</label>
                                        <input type="text" required placeholder="Contoh: Humas, Keamanan"
                                            value={newRoleForm.name}
                                            onChange={e => setNewRoleForm(prev => ({...prev, name: e.target.value}))}
                                            className="w-full rounded-xl p-3 border border-gray-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={() => setShowAddRoleForm(false)}
                                            className="px-5 py-3 rounded-xl text-[14px] font-normal text-slate-500 hover:bg-gray-100 transition-all">Batal</button>
                                        <button type="submit"
                                            className="px-6 py-3 rounded-xl text-[14px] font-normal text-white bg-slate-800 hover:bg-slate-900 shadow-md transition-all active:scale-95">Simpan Role</button>
                                    </div>
                                </form>
                            </div>
                        )}



                        {activeRoleSubTab === 'users' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {users.map(user => (
                                    <div key={user.id} className={`col-span-1 ${expandedUserId === user.id ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                                        <div className={`bg-white border rounded-3xl shadow-sm transition-all overflow-hidden ${expandedUserId === user.id ? 'border-brand-300 ring-2 ring-brand-100' : 'border-gray-100 hover:shadow-xl'}`}>
                                            <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-brand-600 shadow-lg shadow-brand-500/20 text-white flex items-center justify-center font-bold text-lg border border-brand-200">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{user.name}</h4>
                                                        <div className="flex gap-1.5 mt-1">
                                                            <span className="inline-flex px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider border border-brand-100/50">
                                                                {(user as any).role_entity?.name || user.role}
                                                            </span>
                                                            <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-200/50">
                                                                {user.scope || 'RT'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white flex justify-end gap-2">
                                                <HasPermission module="Setup / Pengaturan" action="Hapus">
                                                    <button onClick={() => handleDeleteUser(user.id, user.name)}
                                                        className="px-4 py-3 text-[14px] font-normal text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all border border-red-100">
                                                        Hapus
                                                    </button>
                                                </HasPermission>
                                                <HasPermission module="Setup / Pengaturan" action="Ubah">
                                                    <button onClick={() => handleEditPermissions(user)}
                                                        className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 text-[14px] font-normal rounded-2xl transition-all border ${expandedUserId === user.id ? 'bg-brand-600 text-white border-brand-600' : 'text-brand-600 bg-brand-50/50 hover:bg-brand-50 border-brand-100/50'}`}>
                                                        <ShieldCheck weight="bold" className="w-4 h-4" />
                                                        {expandedUserId === user.id ? 'Tutup Matrix' : 'Khusus User'}
                                                        {expandedUserId === user.id ? <CaretUp weight="bold" className="w-3 h-3" /> : <CaretDown weight="bold" className="w-3 h-3" />}
                                                    </button>
                                                </HasPermission>
                                            </div>
                                            {expandedUserId === user.id && (
                                                <div className="border-t border-slate-100">
                                                    <div className="px-4 py-3 bg-brand-50/30 flex items-center gap-2">
                                                        <UserIcon weight="fill" className="w-4 h-4 text-brand-500" />
                                                        <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Matrix Hak Akses Khusus: {user.name}</span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full border-separate border-spacing-0">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                                    <th className="p-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] pl-5">Modul</th>
                                                                    {CRUD_ACTIONS.map(action => (
                                                                        <th key={action.id} className="p-3 text-center text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] border-l border-slate-100">{action.label}</th>
                                                                    ))}
                                                                    <th className="p-3 text-center text-[10px] font-black text-brand-600 uppercase tracking-[0.15em] border-l border-slate-100 bg-brand-50/30">Cakupan</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {APP_MODULES.map((module, idx) => (
                                                                    <tr key={module.id} className={`group hover:bg-brand-50/30 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                                        <td className="p-3 pl-5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                                                                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500" />{module.label}</div>
                                                                        </td>
                                                                        {CRUD_ACTIONS.map(action => {
                                                                            const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                            return (
                                                                                <td key={action.id} className="p-2 text-center border-l border-slate-100/80">
                                                                                    <label className="flex items-center justify-center cursor-pointer group/check">
                                                                                        <input type="checkbox" className="sr-only" checked={isChecked || false} onChange={() => togglePermission(module.id, action.id)} />
                                                                                        <div className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${isChecked ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-300 group-hover/check:border-brand-400'}`}>
                                                                                            <CheckCircle weight="bold" className={`w-4 h-4 transition-all ${isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                                                                        </div>
                                                                                    </label>
                                                                                </td>
                                                                            );
                                                                        })}
                                                                        <td className="p-2 text-center border-l border-slate-100/80 bg-brand-50/10">
                                                                            <button onClick={() => toggleScope(module.id)}
                                                                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${userPermissions[module.id]?.scope === 'personal' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                                                                {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                                        <button onClick={() => setExpandedUserId(null)}
                                                            className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all">Batal</button>
                                                        <button onClick={() => savePermissions()}
                                                            className="px-7 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black shadow-xl hover:bg-brand-600 transition-all flex items-center gap-2 uppercase tracking-[0.2em]">
                                                            <ShieldCheck weight="fill" className="w-4 h-4" /> Simpan Hak Akses
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {roles.map(role => (
                                    <div key={role.id} className={`col-span-1 ${expandedRoleId === role.id ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                                        <div className={`bg-white border rounded-3xl shadow-sm transition-all overflow-hidden ${expandedRoleId === role.id ? 'border-slate-400 ring-2 ring-slate-100' : 'border-gray-100 hover:shadow-xl'}`}>
                                            <div className="bg-slate-50 p-6 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 shadow-lg shadow-slate-200 text-white flex items-center justify-center font-bold text-lg border border-slate-700">
                                                        <ShieldCheck weight="fill" className="w-6 h-6 text-brand-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{role.name}</h4>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Role</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white flex justify-end gap-2 text-xs font-bold">
                                                <button onClick={() => handleDeleteRole(role.id, role.name)}
                                                    className="px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-2xl transition-all border border-red-100 disabled:opacity-50"
                                                    disabled={role.name === 'Admin'}>Hapus</button>
                                                <button onClick={() => handleEditRolePermissions(role)}
                                                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-2xl transition-all border ${expandedRoleId === role.id ? 'bg-slate-900 text-white border-slate-900' : 'text-brand-600 bg-brand-50/50 hover:bg-brand-50 border-brand-100/50'}`}>
                                                    <ShieldCheck weight="bold" className="w-4 h-4" />
                                                    {expandedRoleId === role.id ? 'Tutup Matrix' : 'Edit Hak Akses'}
                                                    {expandedRoleId === role.id ? <CaretUp weight="bold" className="w-3 h-3" /> : <CaretDown weight="bold" className="w-3 h-3" />}
                                                </button>
                                            </div>
                                            {expandedRoleId === role.id && (
                                                <div className="border-t border-slate-100">
                                                    <div className="px-4 py-3 bg-slate-800 flex items-center gap-2">
                                                        <ShieldCheck weight="fill" className="w-4 h-4 text-brand-400" />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Matrix Hak Akses Role: {role.name}</span>
                                                    </div>
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full border-separate border-spacing-0">
                                                            <thead>
                                                                <tr className="bg-slate-50 border-b border-slate-200">
                                                                    <th className="p-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] pl-5">Modul</th>
                                                                    {CRUD_ACTIONS.map(action => (
                                                                        <th key={action.id} className="p-3 text-center text-[10px] font-black text-slate-900 uppercase tracking-[0.15em] border-l border-slate-100">{action.label}</th>
                                                                    ))}
                                                                    <th className="p-3 text-center text-[10px] font-black text-brand-600 uppercase tracking-[0.15em] border-l border-slate-100 bg-brand-50/30">Cakupan</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100">
                                                                {APP_MODULES.map((module, idx) => (
                                                                    <tr key={module.id} className={`group hover:bg-brand-50/30 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                                                        <td className="p-3 pl-5 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                                                                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500" />{module.label}</div>
                                                                        </td>
                                                                        {CRUD_ACTIONS.map(action => {
                                                                            const isChecked = userPermissions[module.id]?.actions?.includes(action.id);
                                                                            return (
                                                                                <td key={action.id} className="p-2 text-center border-l border-slate-100/80">
                                                                                    <label className="flex items-center justify-center cursor-pointer group/check">
                                                                                        <input type="checkbox" className="sr-only" checked={isChecked || false} onChange={() => togglePermission(module.id, action.id)} />
                                                                                        <div className={`w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center ${isChecked ? 'bg-brand-600 border-brand-600 text-white shadow-sm' : 'bg-white border-slate-300 group-hover/check:border-brand-400'}`}>
                                                                                            <CheckCircle weight="bold" className={`w-4 h-4 transition-all ${isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                                                                                        </div>
                                                                                    </label>
                                                                                </td>
                                                                            );
                                                                        })}
                                                                        <td className="p-2 text-center border-l border-slate-100/80 bg-brand-50/10">
                                                                            <button onClick={() => toggleScope(module.id)}
                                                                                className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${userPermissions[module.id]?.scope === 'personal' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                                                                {userPermissions[module.id]?.scope === 'personal' ? 'Personal' : 'Semua'}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                                        <button onClick={() => setExpandedRoleId(null)}
                                                            className="px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-white border border-transparent hover:border-slate-200 transition-all">Batal</button>
                                                        <button onClick={() => savePermissions()}
                                                            className="px-7 py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-black shadow-xl hover:bg-brand-600 transition-all flex items-center gap-2 uppercase tracking-[0.2em]">
                                                            <ShieldCheck weight="fill" className="w-4 h-4" /> Simpan Hak Akses
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }

        </div>
    );
}

