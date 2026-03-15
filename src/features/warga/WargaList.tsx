import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { wargaService } from '../../services/wargaService';
import { Warga } from '../../database/db';
import AnggotaKeluargaPanel from './AnggotaKeluargaPanel';
import { Users, Plus, MagnifyingGlass, Funnel, PencilSimple, Trash, CaretDown, CaretRight, Eye, DownloadSimple, UploadSimple, FileArrowDown } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';

export default function WargaList() {
    const { currentTenant, currentScope } = useTenant();
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [expandedWargaId, setExpandedWargaId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

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

        setIsLoading(true);
        try {
            const count = await wargaService.importWarga(file);
            alert(`Berhasil mengimport ${count} data warga baru.`);
            loadData();
        } catch (error: any) {
            console.error("Import failed:", error);
            alert(`Gagal mengimport data: ${error.response?.data?.error || error.message}`);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const data = await wargaService.getAll(currentTenant.id, currentScope);
            setWargaList(data.items || []);
        } catch (error) {
            console.error("Failed to load warga:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant, currentScope]);

    const handleDelete = async (id: string, nama: string) => {
        if (window.confirm(`Hapus data warga ${nama}?`)) {
            await wargaService.delete(id);
            loadData();
        }
    };

    const filteredWarga = wargaList.filter(w =>
        w.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.nik.includes(searchQuery)
    );


    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Warga</h1>
                    <p className="text-gray-500 mt-1">Kelola data warga untuk scope <span className="font-semibold text-brand-600">{currentScope}</span></p>
                </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <HasPermission module="Warga" action="Buat">
                            <button
                                onClick={handleDownloadTemplate}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all shadow-sm hover-lift active-press"
                                title="Download Template Import"
                            >
                                <FileArrowDown weight="bold" />
                                <span>Template</span>
                            </button>
                        </HasPermission>

                        <button
                            onClick={handleExport}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all shadow-sm hover-lift active-press"
                        >
                            <DownloadSimple weight="bold" />
                            <span>Export</span>
                        </button>

                        <HasPermission module="Warga" action="Buat">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImport}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all shadow-sm hover-lift active-press"
                            >
                                <UploadSimple weight="bold" />
                                <span>Import</span>
                            </button>
                            
                            <button
                                onClick={() => navigate('/warga/new')}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-all shadow-sm hover-lift active-press"
                            >
                                <Plus weight="bold" />
                                <span>Tambah Warga</span>
                            </button>
                        </HasPermission>
                    </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari berdasarkan Nama atau NIK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                        />
                    </div>
                    <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        <Funnel weight="fill" className="text-gray-400" />
                        <span>Filter Tambahan</span>
                    </button>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-200">
                                <th className="p-2.5 w-8 text-center font-semibold text-gray-400">No</th>
                                <th className="p-2.5 w-8 text-center"></th>
                                <th className="p-3 font-semibold text-gray-400">Nama & Identitas</th>
                                <th className="p-3 font-semibold text-gray-400 text-center">Kontak</th>
                                <th className="p-3 font-semibold text-gray-400 text-center">J. Kelamin</th>
                                <th className="p-3 font-semibold text-gray-400 text-center">Agama</th>
                                <th className="p-3 font-semibold text-gray-400">Alamat</th>
                                <th className="p-3 font-semibold text-gray-400 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredWarga.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
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
                                        <tr key={warga.id} className={`hover:bg-gray-50/50 transition-colors group cursor-pointer ${expandedWargaId === warga.id ? 'bg-brand-50/30' : ''}`} onClick={() => toggleExpand(warga.id)}>
                                            <td className="p-3 text-center text-gray-400 text-[10px] font-medium font-mono">
                                                {(index + 1).toString().padStart(2, '0')}
                                            </td>
                                            <td className="p-3 text-center text-gray-400">
                                                {expandedWargaId === warga.id ? <CaretDown weight="bold" size={12} /> : <CaretRight weight="bold" size={12} />}
                                            </td>
                                            <td className="p-3">
                                                <p className="font-bold text-slate-800 leading-tight text-sm">{warga.nama}</p>
                                                <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                                                    <span className="text-[9px] font-black text-brand-600 bg-brand-50/50 px-1.5 py-0.5 rounded border border-brand-100/50 leading-none">{warga.nik}</span>
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border border-slate-200 uppercase leading-none ${warga.status_penduduk === 'Kontrak' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        {warga.status_penduduk || 'Tetap'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-gray-600 text-[11px] font-medium text-center whitespace-nowrap">{warga.kontak || '-'}</td>
                                            <td className="p-3 text-gray-600 text-[11px] font-medium text-center">{warga.jenis_kelamin || '-'}</td>
                                            <td className="p-3 text-gray-600 text-[11px] font-medium text-center">{warga.agama || '-'}</td>
                                            <td className="p-3 text-gray-500 text-[11px] max-w-xs "><p className="truncate leading-tight">{warga.alamat}</p></td>
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
                                            <tr>
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
                <div className="md:hidden space-y-4 p-4 bg-gray-50">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-8">Memuat data...</div>
                    ) : filteredWarga.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                            <Users className="w-10 h-10 text-gray-300 mb-2" />
                            <p>Belum ada data warga di scope ini.</p>
                        </div>
                    ) : (
                        filteredWarga.map((warga) => (
                            <div key={warga.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{warga.nama}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-sm font-medium text-brand-600 tracking-wide">{warga.nik}</p>
                                                    {warga.status_penduduk === 'Kontrak' && <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 rounded uppercase">Kontrak</span>}
                                                    {warga.status_rumah === 'Kosong' && <span className="text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 rounded uppercase">Kosong</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">J. Kelamin</span>
                                                <span className="text-xs truncate">{warga.jenis_kelamin || '-'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Agama</span>
                                                <span className="text-xs truncate">{warga.agama || '-'}</span>
                                            </div>
                                            <div className="flex flex-col col-span-2">
                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Kontak</span>
                                                <span className="text-xs truncate">{warga.kontak || '-'}</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 truncate italic">
                                            {warga.alamat}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-between items-center">
                                    <button
                                        onClick={() => toggleExpand(warga.id)}
                                        className="text-sm text-gray-500 hover:text-brand-600 font-medium flex items-center gap-1"
                                    >
                                        Keluarga {expandedWargaId === warga.id ? <CaretDown weight="bold" /> : <CaretRight weight="bold" />}
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => navigate(`/warga/${warga.id}`)} className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">
                                            <Eye weight="duotone" className="w-5 h-5" />
                                        </button>
                                        <HasPermission module="Warga" action="Ubah" recordOwnerId={warga.id}>
                                            <button onClick={() => navigate(`/warga/edit/${warga.id}`)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                                <PencilSimple weight="duotone" className="w-5 h-5" />
                                            </button>
                                        </HasPermission>
                                        <HasPermission module="Warga" action="Hapus">
                                            <button onClick={() => handleDelete(warga.id, warga.nama)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                                                <Trash weight="duotone" className="w-5 h-5" />
                                            </button>
                                        </HasPermission>
                                    </div>
                                </div>
                                {expandedWargaId === warga.id && (
                                    <div className="bg-slate-50 p-4 border-t border-brand-200">
                                        <AnggotaKeluargaPanel wargaId={warga.id} tenantId={currentTenant?.id || ''} initialData={warga.anggota} />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {!isLoading && filteredWarga.length > 0 && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-sm text-gray-500 flex justify-between items-center">
                        <span>Menampilkan {filteredWarga.length} data warga</span>
                        <div className="flex gap-1">
                            <button className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Sebelumnnya</button>
                            <button className="px-3 py-1 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">Selanjutnya</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
