import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { wargaService } from '../../services/wargaService';
import { Warga } from '../../database/db';
import AnggotaKeluargaPanel from './AnggotaKeluargaPanel';
import { Users, Plus, Funnel, PencilSimple, Trash, CaretDown, CaretRight, Eye, DownloadSimple, UploadSimple, FileArrowDown, ShareNetwork, UserCheck, XCircle, Info, Copy, UserPlus, DotsThreeOutlineVertical, ClockCounterClockwise } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { useAuth } from '../../contexts/AuthContext';
import { useHybridData } from '../../hooks/useHybridData';

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
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">{user?.role?.toLowerCase() === 'warga' ? 'Profil Warga' : 'Data Warga'}</h1>
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 tracking-tight">Kelola database kependudukan lingkungan</p>
                </div>
                
                <div className="flex flex-col w-full sm:w-auto gap-2">
                    {/* Primary Actions Grid for Mobile */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={() => navigate('/warga/new')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-brand-500/10 active-press"
                            >
                                <Plus weight="bold" />
                                <span>Tambah Warga</span>
                            </button>
                        </HasPermission>

                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={() => setShowShareModal(true)}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-all shadow-sm active-press"
                            >
                                <ShareNetwork weight="bold" />
                                <span className="hidden sm:inline">Share Link</span>
                                <span className="sm:hidden text-xs tracking-normal">Share Link</span>
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
                                            <p className="text-[10px] font-bold text-slate-400 tracking-normal">Aksi Lainnya</p>
                                        </div>
                                        <HasPermission module="Warga" action="Buat">
                                            <button
                                                onClick={() => { handleDownloadTemplate(); setShowMobileMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                <FileArrowDown weight="bold" className="text-brand-600" />
                                                <span>Download Template</span>
                                            </button>
                                        </HasPermission>

                                        <button
                                            onClick={() => { handleExport(); setShowMobileMenu(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                                        >
                                            <DownloadSimple weight="bold" className="text-blue-600" />
                                            <span>Export Excel</span>
                                        </button>

                                        <HasPermission module="Warga" action="Buat">
                                            <button
                                                onClick={() => { fileInputRef.current?.click(); setShowMobileMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
                                            >
                                                <UploadSimple weight="bold" className="text-amber-600" />
                                                <span>Import Excel</span>
                                            </button>
                                        </HasPermission>
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
                                <span>Template</span>
                            </button>
                        </HasPermission>

                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg font-bold text-xs transition-all shadow-sm active-press"
                        >
                            <DownloadSimple weight="bold" />
                            <span>Export</span>
                        </button>

                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg font-bold text-xs transition-all shadow-sm active-press"
                            >
                                <UploadSimple weight="bold" />
                                <span>Import</span>
                            </button>
                        </HasPermission>
                        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
                    </div>
                </div>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 -mt-2">
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <Users weight="fill" className="text-brand-500 w-3 h-3" />
                            Total Warga
                        </p>
                        <p className="text-[13px] sm:text-lg font-normal text-slate-900 leading-none truncate tabular-nums">{wargaList.length} Jiwa</p>
                    </div>
                </div>

                <div className="bg-brand-600 p-3 sm:p-4 rounded-2xl border border-brand-500 shadow-lg relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-15 h-15 sm:w-24 sm:h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <UserPlus weight="bold" className="text-amber-400 w-3 h-3" />
                            Menunggu Verifikasi
                        </p>
                        <p className="text-[13px] sm:text-lg font-normal text-white leading-none truncate tabular-nums">{pendingWarga.length} Antrian</p>
                    </div>
                </div>
            </div>

            {/* Tabs for Admin */}
            <HasPermission module="Warga" action="Buat">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('Verified')}
                        className={`px-6 py-3 text-[14px] font-bold transition-all border-b-2 ${activeTab === 'Verified' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}
                    >
                        Terverifikasi ({wargaList.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('Pending')}
                        className={`px-6 py-3 text-[14px] font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'Pending' ? 'border-brand-600 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}
                    >
                        Permintaan Bergabung
                        {pendingWarga.length > 0 && (
                            <span className="bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                                {pendingWarga.length}
                            </span>
                        )}
                    </button>
                </div>
            </HasPermission>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Cari Nama/NIK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                        />
                    </div>
                    <button className="flex-none flex justify-center items-center gap-2 p-2 sm:px-4 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[14px] font-normal transition-all shadow-sm active-press">
                        <Funnel weight="fill" className="text-brand-600 sm:text-slate-400" />
                        <span className="hidden sm:inline">Filter Tambahan</span>
                    </button>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[14px] capitalize tracking-wider border-b border-slate-200">
                                <th className="p-2.5 w-8 text-center font-semibold text-slate-500">No</th>
                                <th className="p-2.5 w-8 text-center"></th>
                                <th className="p-3 font-semibold text-slate-500">Nama & Identitas</th>
                                <th className="p-3 font-semibold text-slate-500 text-center">Kontak</th>
                                <th className="p-3 font-semibold text-slate-500 text-center">J. Kelamin</th>
                                <th className="p-3 font-semibold text-slate-500 text-center">Agama</th>
                                <th className="p-3 font-semibold text-slate-500">Alamat</th>
                                <th className="p-3 font-semibold text-slate-500 text-center">Aksi</th>
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
                                                <p>Tidak ada permintaan bergabung baru.</p>
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
                                                <p className="font-bold text-slate-800 leading-tight text-[14px]">{warga.nama}</p>
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold text-brand-600 bg-brand-50/50 px-1.5 py-0.5 rounded border border-brand-100/50 leading-none">{warga.nik}</span>
                                                    <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100/50 leading-none capitalize">Pending Verification</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-600 text-[14px] font-normal text-center">{warga.kontak || '-'}</td>
                                            <td className="p-3 text-slate-600 text-[14px] font-normal text-center">{warga.jenis_kelamin || '-'}</td>
                                            <td className="p-3 text-slate-600 text-[14px] font-normal text-center">{warga.agama || '-'}</td>
                                            <td className="p-3 text-slate-500 text-[14px] max-w-xs "><p className="truncate leading-tight">{warga.alamat}</p></td>
                                            <td className="p-3 px-4">
                                                <div className="flex gap-2 justify-center">
                                                    <button
                                                        onClick={() => handleVerify(warga.id, 'VERIFIED', warga.nama)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold tracking-normal transition-all shadow-sm shadow-green-500/10"
                                                    >
                                                        <UserCheck weight="bold" />
                                                        Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerify(warga.id, 'REJECTED', warga.nama)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-bold tracking-normal transition-all"
                                                    >
                                                        <XCircle weight="bold" />
                                                        Tolak
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
                                            <p>Belum ada data warga di scope ini.</p>
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
                                                <p className="font-bold text-slate-800 leading-tight text-[14px]">{warga.nama}</p>
                                                <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                                                    <span className="text-[9px] font-bold text-brand-600 bg-brand-50/50 px-1.5 py-0.5 rounded border border-brand-100/50 leading-none">{warga.nik}</span>
                                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-200 capitalize leading-none ${warga.status_penduduk === 'Kontrak' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        {warga.status_penduduk || 'Tetap'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-600 text-[14px] font-normal text-center whitespace-nowrap">{warga.kontak || '-'}</td>
                                            <td className="p-3 text-slate-600 text-[14px] font-normal text-center">{warga.jenis_kelamin || '-'}</td>
                                            <td className="p-3 text-slate-600 text-[14px] font-normal text-center">{warga.agama || '-'}</td>
                                            <td className="p-3 text-slate-500 text-[14px] max-w-xs "><p className="truncate leading-tight">{warga.alamat}</p></td>
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
                        <div className="py-20 text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Sinkronisasi...</span>
                        </div>
                    ) : (activeTab === 'Pending' ? pendingWarga : filteredWarga).length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                <Users weight="duotone" className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">Data Tidak Ditemukan</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Coba ubah kata kunci atau ganti tab verifikasi</p>
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
                                                <h3 className="font-bold text-slate-900 text-[15px] tracking-tight leading-tight">{warga.nama}</h3>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] font-mono text-brand-600 font-bold">{warga.nik}</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                    <span className="text-[10px] text-slate-400 font-medium">{warga.jenis_kelamin || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {activeTab === 'Pending' ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider animate-pulse">
                                                    <ClockCounterClockwise weight="bold" className="w-3.5 h-3.5" />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 shadow-sm uppercase tracking-tighter ${warga.status_penduduk === 'Kontrak' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-brand-50 text-brand-600 border-brand-100'}`}>
                                                    {warga.status_penduduk || 'Tetap'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2.5">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 leading-none shadow-sm">Agama</p>
                                            <p className="text-[11px] font-bold text-slate-700">{warga.agama || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2.5">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 leading-none shadow-sm">Kontak</p>
                                            <p className="text-[11px] font-bold text-slate-700 truncate">{warga.kontak || '-'}</p>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-2.5 col-span-2">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 leading-none shadow-sm">Alamat Domisili</p>
                                            <p className="text-[11px] font-medium text-slate-600 italic leading-relaxed">"{warga.alamat}"</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(warga.id); }}
                                            className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors hover:bg-slate-100"
                                        >
                                            ANGGOTA KELUARGA
                                            {expandedWargaId === warga.id ? <CaretDown weight="bold" /> : <CaretRight weight="bold" />}
                                        </button>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {activeTab === 'Pending' ? (
                                                <div className="flex gap-2">
                                                    <HasPermission module="Warga" action="Buat">
                                                        <button
                                                            onClick={() => handleVerify(warga.id, 'VERIFIED', warga.nama)}
                                                            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-tight shadow-md active:scale-95"
                                                        >
                                                            SETUJUI
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
                                    <div className="bg-slate-50/50 p-4 border-t border-slate-100 animate-slide-down">
                                        <AnggotaKeluargaPanel wargaId={warga.id} tenantId={currentTenant?.id || ''} initialData={warga.anggota} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                {/* Pagination: Hide if only 1 data (typical for Warga role) */}
                {!isLoading && filteredWarga.length > 1 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500 flex justify-between items-center">
                        <span>Menampilkan {filteredWarga.length} data warga</span>
                        <div className="flex gap-1">
                            <button className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Sebelumnnya</button>
                            <button className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Selanjutnya</button>
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
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">Share Link Pendaftaran</h3>
                                    <p className="text-slate-500 text-xs font-medium mt-1 tracking-normal">Undang warga untuk isi data mandiri</p>
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
                                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                                        Kirimkan link di bawah ini ke grup WhatsApp warga. Setiap warga dapat mendaftar dan mengisi data mereka sendiri. Pendaftaran membutuhkan persetujuan Anda.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 tracking-normal pl-1">Link Pendaftaran</label>
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
