import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { wargaService } from '../../services/wargaService';
import { Warga } from '../../database/db';
import AnggotaKeluargaPanel from './AnggotaKeluargaPanel';
import { Users, Plus, Funnel, PencilSimple, Trash, CaretDown, CaretRight, Eye, DownloadSimple, UploadSimple, FileArrowDown, ShareNetwork, UserCheck, XCircle, Info, Copy, UserPlus, DotsThreeOutlineVertical, ClockCounterClockwise, MagnifyingGlass } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { useAuth } from '../../contexts/AuthContext';
import { useHybridData } from '../../hooks/useHybridData';
import { Text } from '../../components/ui/Typography';
import { toTitleCase } from '../../utils/text';

export default function WargaList() {
    const { currentTenant, currentScope } = useTenant();
    const { user } = useAuth();
    
    // 3. Separate state clearly - moved to useHybridData
    const [expandedWargaId, setExpandedWargaId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'Verified' | 'Pending'>('Verified');
    const [pendingWarga, setPendingWarga] = useState<Warga[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const navigate = useNavigate();


    const { 
        mergedData: wargaServerData, 
        isFetching: isLoading, // Rename to match existing UI
        refresh: loadData 
    } = useHybridData<{ items: Warga[] }>({
        fetcher: () => wargaService.getAll(currentTenant?.id || '', currentScope),
        enabled: !!currentTenant
    });

    const wargaList = wargaServerData?.items || [];

    const toggleExpand = (wargaId: string) => {
        setExpandedWargaId(prev => prev === wargaId ? null : wargaId);
    };

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            await wargaService.exportWarga(currentScope);
        } catch (error) {
            console.error("Export failed:", error);
            alert('Gagal mengekspor data');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            await wargaService.downloadTemplate();
        } catch (error) {
            console.error("Template download failed:", error);
            alert('Gagal mengunduh template');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm(`Import data warga dari file ${file.name}?`)) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        // We use local loading state for mutations
        try {
            const count = await wargaService.importWarga(file);
            alert(`Berhasil mengimport ${count} data warga baru.`);
            loadData();
        } catch (error: any) {
            console.error("Import failed:", error);
            alert(`Gagal mengimport data: ${error.response?.data?.error || error.message}`);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const loadPendingData = async () => {
        if (!currentTenant) return;
        try {
            const data = await wargaService.getPending();
            setPendingWarga(data || []);
        } catch (error) {
            console.error("Failed to load pending warga:", error);
        }
    };

    useEffect(() => {
        if (currentTenant) {
            loadPendingData();
        }

        // Auto-redirect Warga role to their detail profile
        if (user?.role?.toLowerCase() === 'warga' && user?.warga_id) {
            navigate(`/warga/${user.warga_id}`, { replace: true });
        }
    }, [currentTenant, currentScope, user, navigate]);

    const handleVerify = async (id: string, status: 'VERIFIED' | 'REJECTED', name: string) => {
        const action = status === 'VERIFIED' ? 'Setujui' : 'Tolak';
        if (!window.confirm(`${action} pendaftaran ${name}?`)) return;

        try {
            await wargaService.verifyWarga(id, status);
            alert(`Pendaftaran ${name} telah ${status === 'VERIFIED' ? 'disetujui' : 'ditolak'}.`);
            loadData();
            loadPendingData();
        } catch (error) {
            console.error("Verification failed:", error);
            alert('Gagal memproses verifikasi.');
        }
    };

    const copyJoinLink = () => {
        if (!currentTenant) return;
        const link = `${window.location.origin}/join/${currentTenant.id}`;
        navigator.clipboard.writeText(link);
        alert('Link pendaftaran berhasil disalin!');
    };

    const handleDelete = async (id: string, nama: string) => {
        if (window.confirm(`Hapus data warga ${nama}?`)) {
            await wargaService.delete(id);
            loadData();
        }
    };

    const filteredWarga = (wargaList || []).filter(w =>
        w.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.nik.includes(searchQuery)
    );


    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in overflow-x-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Text.H1>{user?.role?.toLowerCase() === 'warga' ? 'Profil Warga' : 'Data Warga'}</Text.H1>
                    <Text.Body>Kelola database kependudukan lingkungan</Text.Body>
                </div>
                
                <div className="flex flex-col w-full sm:w-auto gap-2">
                    {/* Primary Actions Grid for Mobile */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={() => navigate('/warga/new')}
                                className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                            >
                                <Plus weight="bold" size={18} />
                                <Text.Body component="span" className="!text-white !font-bold">Tambah Warga</Text.Body>
                            </button>
                            
                            {/* MOBILE FAB */}
                            <button
                                onClick={() => navigate('/warga/new')}
                                className="sm:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-[0px_4px_10px_rgba(0,0,0,0.15)] flex items-center justify-center active:scale-90 transition-transform active-press"
                            >
                                <Plus weight="bold" size={24} className="relative left-[0.5px]" />
                            </button>
                        </HasPermission>

                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm active-press"
                            >
                                 <ShareNetwork weight="bold" />
                                <Text.Label className="!text-slate-700 leading-none !normal-case !tracking-tight">Bagikan Link</Text.Label>
                            </button>
                        </HasPermission>

                        {/* Mobile Menu Trigger */}
                        <div className="relative sm:hidden">
                            <button
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                                className={`p-3 rounded-xl border transition-all active-press ${showMobileMenu ? 'bg-brand-600 border-brand-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400'}`}
                            >
                                <DotsThreeOutlineVertical weight="fill" size={20} />
                            </button>

                            {showMobileMenu && (
                                <>
                                    <div className="fixed inset-0 z-[60]" onClick={() => setShowMobileMenu(false)}></div>
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[70] animate-zoom-in">
                                        <div className="px-4 py-2 mb-1">
                                            <Text.Label className="!text-slate-400 !normal-case !tracking-tight">Aksi Lainnya</Text.Label>
                                        </div>
                                         <HasPermission module="Warga" action="Buat">
                                            <button
                                                onClick={() => { handleDownloadTemplate(); setShowMobileMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                <FileArrowDown weight="bold" className="text-brand-600" />
                                                <Text.Body component="span" className="!text-inherit !font-bold">Unduh Template</Text.Body>
                                            </button>
                                        </HasPermission>

                                            <button
                                                onClick={() => { handleExport(); setShowMobileMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                <DownloadSimple weight="bold" className="text-blue-600" />
                                                <Text.Body component="span" className="!text-inherit !font-bold">Ekspor Excel</Text.Body>
                                            </button>

                                            <button
                                                onClick={() => { fileInputRef.current?.click(); setShowMobileMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                <UploadSimple weight="bold" className="text-amber-600" />
                                                <Text.Body component="span" className="!text-inherit !font-bold">Impor Excel</Text.Body>
                                            </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Desktop-only Secondary Actions Row */}
                    <div className="hidden sm:flex items-center gap-2">
                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg font-bold text-xs transition-all shadow-sm active-press"
                                title="Download Template Import"
                            >
                                <FileArrowDown weight="bold" />
                                <Text.Label className="!text-inherit">Template</Text.Label>
                            </button>
                        </HasPermission>

                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg font-bold text-xs transition-all shadow-sm active-press"
                        >
                            <DownloadSimple weight="bold" />
                            <Text.Label className="!text-inherit">Export</Text.Label>
                        </button>

                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg font-bold text-xs transition-all shadow-sm active-press"
                            >
                                <UploadSimple weight="bold" />
                                <Text.Label className="!text-inherit">Import</Text.Label>
                            </button>
                        </HasPermission>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
                    </div>
                </div>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-2">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500" />
                    <Text.Label className="mb-1.5 flex items-center gap-2 !text-slate-600 !normal-case !tracking-tight">
                        <Users weight="duotone" className="text-brand-500 w-4 h-4" />
                        Total Warga
                    </Text.Label>
                    <div className="flex items-baseline gap-1">
                        <Text.Amount className="text-2xl text-slate-900">{wargaList.length}</Text.Amount>
                        <Text.Caption className="leading-none tracking-widest text-slate-400">Jiwa</Text.Caption>
                    </div>
                </div>

                <div className="bg-[#2563EB] p-5 rounded-2xl border border-blue-500 shadow-xl relative overflow-hidden group hover:bg-[#1d4ed8] transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <Text.Label className="mb-1.5 flex items-center gap-2 !text-white/80 !normal-case !tracking-tight">
                        <UserPlus weight="duotone" className="text-amber-300 w-4 h-4" />
                        Menunggu Verifikasi
                    </Text.Label>
                    <div className="flex items-baseline gap-1">
                        <Text.Amount className="text-2xl text-white">{pendingWarga.length}</Text.Amount>
                        <Text.Caption className="leading-none tracking-widest text-white/60 font-bold">Antrian</Text.Caption>
                    </div>
                </div>
            </div>

            {/* Tabs for Admin */}
            <HasPermission module="Warga" action="Buat">
                 <div className="flex bg-slate-100/50 p-1.5 rounded-xl w-full md:w-fit border border-slate-100 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setActiveTab('Verified')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'Verified' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserCheck weight="bold" className="w-4 h-4" /> <Text.Label className={`${activeTab === 'Verified' ? '!text-brand-600' : '!text-slate-500'} !normal-case !tracking-tight`}>Terverifikasi</Text.Label>
                    </button>
                    <button
                        onClick={() => setActiveTab('Pending')}
                        className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 md:py-2 text-[11px] md:text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'Pending' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClockCounterClockwise weight="bold" className="w-4 h-4" /> 
                        <Text.Label className={`${activeTab === 'Pending' ? '!text-brand-600' : '!text-slate-500'} !normal-case !tracking-tight`}>Permintaan</Text.Label>
                        {pendingWarga.length > 0 && (
                            <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse ml-1">
                                {pendingWarga.length}
                            </span>
                        )}
                    </button>
                </div>
            </HasPermission>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative flex-1 group">
                        <MagnifyingGlass weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Cari Nama atau NIK warga..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm font-medium"
                        />
                    </div>
                    <button className="flex-none flex justify-center items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all shadow-sm active-press">
                        <Funnel weight="bold" className="text-brand-600" />
                        <Text.Body component="span" className="!text-inherit !font-bold">Filter Lanjutan</Text.Body>
                    </button>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-2.5 w-8 text-center"><Text.Label className="!normal-case !tracking-tight !text-slate-500">No</Text.Label></th>
                                <th className="p-2.5 w-8 text-center"></th>
                                <th className="p-3"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Nama & Identitas</Text.Label></th>
                                <th className="p-3 text-center"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Kontak</Text.Label></th>
                                <th className="p-3 text-center"><Text.Label className="!normal-case !tracking-tight !text-slate-500">J. Kelamin</Text.Label></th>
                                <th className="p-3 text-center"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Agama</Text.Label></th>
                                <th className="p-3"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Alamat</Text.Label></th>
                                <th className="p-3 text-center"><Text.Label className="!normal-case !tracking-tight !text-slate-500">Aksi</Text.Label></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!wargaServerData && isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : activeTab === 'Pending' ? (
                                pendingWarga.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <UserPlus weight="bold" className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <Text.Body>Tidak Ada Permintaan Bergabung Baru.</Text.Body>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pendingWarga.map((warga, index) => (
                                        <tr key={warga.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-3 text-center text-gray-400 text-[10px] font-medium font-mono">
                                                {(index + 1).toString().padStart(2, '0')}
                                            </td>
                                            <td className="p-3 text-center"></td>
                                            <td className="p-3">
                                                <Text.H2 className="!text-[14px] leading-tight">{toTitleCase(warga.nama)}</Text.H2>
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <Text.Label className="!text-[9px] text-brand-600 bg-brand-50/50 px-1.5 py-0.5 rounded border border-brand-100/50 leading-none !font-normal tracking-[1px]">{warga.nik}</Text.Label>
                                                    <Text.Label className="!text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50 leading-none">Menunggu Verifikasi</Text.Label>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center"><Text.Body className="!text-slate-600 truncate">{warga.kontak || '-'}</Text.Body></td>
                                            <td className="p-3 text-center"><Text.Body className="!text-slate-600">{warga.jenis_kelamin || '-'}</Text.Body></td>
                                            <td className="p-3 text-center"><Text.Body className="!text-slate-600">{warga.agama || '-'}</Text.Body></td>
                                            <td className="p-3 text-slate-500 text-[14px] max-w-xs "><Text.Body className="!text-inherit truncate leading-tight">{warga.alamat}</Text.Body></td>
                                            <td className="p-3 px-4">
                                                <div className="flex gap-2 justify-center">
                                                     <button
                                                         onClick={() => handleVerify(warga.id, 'VERIFIED', warga.nama)}
                                                         className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all shadow-sm shadow-green-500/10"
                                                     >
                                                         <UserCheck weight="bold" />
                                                         <Text.Label className="!text-white">Setujui</Text.Label>
                                                     </button>
                                                     <button
                                                         onClick={() => handleVerify(warga.id, 'REJECTED', warga.nama)}
                                                         className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                                                     >
                                                         <XCircle weight="bold" />
                                                         <Text.Label className="!text-red-600">Tolak</Text.Label>
                                                     </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )
                            ) : filteredWarga.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <Users className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <Text.Body>Belum ada data warga di scope ini.</Text.Body>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredWarga.map((warga, index) => (
                                    <React.Fragment key={warga.id}>
                                        <tr className={`hover:bg-gray-50/50 transition-colors group cursor-pointer ${expandedWargaId === warga.id ? 'bg-brand-50/30' : ''}`} onClick={() => toggleExpand(warga.id)}>
                                            <td className="p-3 text-center text-gray-400 text-[10px] font-medium font-mono">
                                                {(index + 1).toString().padStart(2, '0')}
                                            </td>
                                            <td className="p-3 text-center text-gray-400">
                                                {expandedWargaId === warga.id ? <CaretDown weight="bold" size={12} /> : <CaretRight weight="bold" size={12} />}
                                            </td>
                                            <td className="p-3">
                                                <Text.H2 className="!text-[14px] leading-tight">{toTitleCase(warga.nama)}</Text.H2>
                                                <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
                                                    <Text.Label className="!text-[10px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100 leading-none !font-normal tracking-[1px]">{warga.nik}</Text.Label>
                                                    <Text.Label className={`!text-[10px] px-2 py-0.5 rounded-full border leading-none ${warga.status_penduduk === 'Kontrak' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {warga.status_penduduk || 'Tetap'}
                                                    </Text.Label>
                                                </div>
                                            </td>
                                             <td className="p-3 text-center"><Text.Body className="!text-slate-600 truncate">{warga.kontak || '-'}</Text.Body></td>
                                             <td className="p-3 text-center"><Text.Body className="!text-slate-600">{warga.jenis_kelamin || '-'}</Text.Body></td>
                                             <td className="p-3 text-center"><Text.Body className="!text-slate-600">{warga.agama || '-'}</Text.Body></td>
                                            <td className="p-3 text-slate-500 text-[14px] max-w-xs "><Text.Body className="!text-inherit truncate leading-tight">{warga.alamat}</Text.Body></td>
                                            <td className="p-3 px-4">
                                                <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => navigate(`/warga/${warga.id}`)}
                                                            className="p-1 text-brand-600 hover:bg-brand-50 rounded transition-colors" title="Detail">
                                                            <Eye weight="bold" className="w-3.5 h-3.5" />
                                                        </button>
                                                        <HasPermission module="Warga" action="Ubah" recordOwnerId={warga.id}>
                                                            <button
                                                                onClick={() => navigate(`/warga/edit/${warga.id}`)}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                                                <PencilSimple weight="bold" className="w-3.5 h-3.5" />
                                                            </button>
                                                        </HasPermission>
                                                    </div>
                                                    <HasPermission module="Warga" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(warga.id, warga.nama)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors w-full flex justify-center" title="Hapus">
                                                            <Trash weight="bold" className="w-3.5 h-3.5" />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedWargaId === warga.id && (
                                            <tr key={`expanded-${warga.id}`}>
                                                <td colSpan={8} className="p-0 border-b border-gray-200">
                                                    <div className="bg-slate-50 p-6 border-l-4 border-brand-500 shadow-inner">
                                                        <AnggotaKeluargaPanel wargaId={warga.id} tenantId={currentTenant?.id || ''} initialData={warga.anggota} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE VIEW: CARD GRID */}
                <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
                    {isLoading ? (
                        <div className="py-20 text-center animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <Text.Label className="!text-slate-400">Sinkronisasi...</Text.Label>
                        </div>
                    ) : (activeTab === 'Pending' ? pendingWarga : filteredWarga).length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <Users weight="duotone" className="w-8 h-8" />
                            </div>
                            <div>
                                <Text.Body className="!font-bold !text-slate-900">Data Tidak Ditemukan</Text.Body>
                                <Text.Caption className="mt-1 !italic">Coba ubah kata kunci atau ganti tab verifikasi</Text.Caption>
                            </div>
                        </div>
                    ) : (
                        (activeTab === 'Pending' ? pendingWarga : filteredWarga).map((warga) => (
                            <div key={warga.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                <div className="p-4" onClick={() => toggleExpand(warga.id)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-brand-600 flex items-center justify-center border border-slate-100 shadow-inner group-hover:scale-110 transition-transform">
                                                <Users weight="duotone" className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <Text.H2 className="text-[15px] leading-tight">{toTitleCase(warga.nama)}</Text.H2>
                                                 <div className="flex items-center gap-1.5 mt-1">
                                                     <Text.Caption className="font-mono !text-brand-600 !font-normal tracking-[1px]">{warga.nik}</Text.Caption>
                                                     <div className="w-1 h-1 rounded-full bg-slate-200" />
                                                     <Text.Caption className="!font-medium">{warga.jenis_kelamin || '-'}</Text.Caption>
                                                 </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                             {activeTab === 'Pending' ? (
                                                <Text.Label className="px-2 py-0.5 bg-amber-50 !text-amber-600 border border-amber-100 rounded-lg flex items-center gap-1 shadow-sm">
                                                    <ClockCounterClockwise weight="bold" className="w-3.5 h-3.5" />
                                                    Menunggu
                                                </Text.Label>
                                            ) : (
                                                <Text.Label className={`px-2 py-0.5 rounded-lg border flex items-center gap-1 shadow-sm ${warga.status_penduduk === 'Kontrak' ? 'bg-amber-50 !text-amber-600 border-amber-100' : 'bg-brand-50 !text-brand-600 border-brand-100'}`}>
                                                    {warga.status_penduduk || 'Tetap'}
                                                </Text.Label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2.5">
                                            <Text.Label className="mb-1 leading-none !text-slate-600 !normal-case !tracking-tight">Agama</Text.Label>
                                            <Text.Body className="!text-[11px] font-bold text-slate-700">{warga.agama || '-'}</Text.Body>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2.5">
                                            <Text.Label className="mb-1 leading-none !text-slate-600 !normal-case !tracking-tight">Kontak</Text.Label>
                                            <Text.Body className="!text-[11px] font-bold text-slate-700 truncate">{warga.kontak || '-'}</Text.Body>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2.5 col-span-2">
                                            <Text.Label className="mb-1 leading-none !text-slate-600 !normal-case !tracking-tight">Alamat Domisili</Text.Label>
                                            <Text.Body className="!text-[11px] font-medium text-slate-600 italic leading-relaxed">"{warga.alamat}"</Text.Body>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(warga.id); }}
                                            className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors hover:bg-slate-100"
                                        >
                                            <Text.Body component="span" className="!text-inherit !font-bold !text-[11px]">Anggota Keluarga</Text.Body>
                                            {expandedWargaId === warga.id ? <CaretDown weight="bold" /> : <CaretRight weight="bold" />}
                                        </button>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {activeTab === 'Pending' ? (
                                                <div className="flex gap-2">
                                                    <HasPermission module="Warga" action="Buat">
                                                         <button
                                                             onClick={() => handleVerify(warga.id, 'VERIFIED', warga.nama)}
                                                             className="px-4 py-2 bg-brand-600 text-white rounded-xl shadow-md active:scale-95"
                                                         >
                                                             <Text.Label className="!text-white">Setujui</Text.Label>
                                                         </button>
                                                    </HasPermission>
                                                    <HasPermission module="Warga" action="Buat">
                                                        <button
                                                            onClick={() => handleVerify(warga.id, 'REJECTED', warga.nama)}
                                                            className="p-2 text-rose-600 bg-rose-50 rounded-xl border border-rose-100 active:scale-95"
                                                        >
                                                            <XCircle weight="bold" size={20} />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => navigate(`/warga/${warga.id}`)}
                                                        className="p-2.5 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition-all shadow-sm border border-brand-100/50"
                                                    >
                                                        <Eye weight="bold" size={18} />
                                                    </button>
                                                    <HasPermission module="Warga" action="Ubah" recordOwnerId={warga.id}>
                                                        <button
                                                            onClick={() => navigate(`/warga/edit/${warga.id}`)}
                                                            className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-sm border border-blue-100/50"
                                                        >
                                                            <PencilSimple weight="bold" size={18} />
                                                        </button>
                                                    </HasPermission>
                                                    <HasPermission module="Warga" action="Hapus">
                                                        <button
                                                            onClick={() => handleDelete(warga.id, warga.nama)}
                                                            className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm border border-rose-100/50"
                                                        >
                                                            <Trash weight="bold" size={18} />
                                                        </button>
                                                    </HasPermission>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {expandedWargaId === warga.id && (activeTab !== 'Pending') && (
                                    <div className="bg-slate-50/50 p-4 border-t border-slate-100 animate-slide-down min-w-0 overflow-hidden">
                                        <AnggotaKeluargaPanel wargaId={warga.id} tenantId={currentTenant?.id || ''} initialData={warga.anggota} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                {/* Pagination: Hide if only 1 data (typical for Warga role) */}
                {!isLoading && filteredWarga.length > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <Text.Caption>Menampilkan {filteredWarga.length} data warga</Text.Caption>
                         <div className="flex gap-1">
                             <button className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"><Text.Label className="!text-slate-500">Sebelumnya</Text.Label></button>
                             <button className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"><Text.Label className="!text-slate-500">Selanjutnya</Text.Label></button>
                         </div>
                    </div>
                )}
            </div>

            {/* Share Link Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-zoom-in">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <Text.H2 className="!text-xl !leading-tight !normal-case !tracking-tight">Share Link Pendaftaran</Text.H2>
                                    <Text.Caption className="!text-slate-500 mt-1 !italic">Undang warga untuk isi data mandiri</Text.Caption>
                                </div>
                                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <XCircle size={24} className="text-slate-400" />
                                </button>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                                        <Info weight="fill" className="text-brand-600 w-5 h-5" />
                                    </div>
                                     <Text.Body className="!text-slate-600 leading-relaxed !font-medium">
                                         Kirimkan link di bawah ini ke grup WhatsApp warga. Setiap warga dapat mendaftar dan mengisi data mereka sendiri. Pendaftaran membutuhkan persetujuan Anda.
                                     </Text.Body>
                                </div>

                                 <div className="space-y-2">
                                     <Text.Label className="!text-slate-400 pl-1 block !normal-case !tracking-tight">Link Pendaftaran</Text.Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs font-mono text-brand-700 truncate select-all">
                                            {`${window.location.origin}/join/${currentTenant?.id}`}
                                        </div>
                                        <button 
                                            onClick={copyJoinLink}
                                            className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-xl transition-all active:scale-95 shadow-md shadow-brand-500/20"
                                            title="Copy Link"
                                        >
                                            <Copy weight="bold" size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowShareModal(false)}
                                className="w-full py-4 text-slate-500 font-bold text-[10px] tracking-normal hover:text-slate-900 transition-colors"
                            >
                                Tutup Panel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
