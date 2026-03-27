import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { suratService, SuratWithWarga } from '../../services/suratService';
import { SuratPengantar } from '../../database/db';
import { dateUtils } from '../../utils/date';
import { Plus, MagnifyingGlass, Funnel, Trash, FileText, CheckCircle, ClockCounterClockwise, XCircle, Printer } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';

export default function SuratList() {
    const { currentTenant, currentScope } = useTenant();
    const [suratList, setSuratList] = useState<SuratWithWarga[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        try {
            const data = await suratService.getAll(currentTenant.id, currentScope);
            setSuratList(data);
        } catch (error) {
            console.error("Failed to load surat:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentTenant, currentScope]);

    const handleDelete = async (id: string, jenis: string) => {
        if (window.confirm(`Hapus permohonan surat ${jenis}?`)) {
            await suratService.delete(id);
            loadData();
        }
    };

    const handleUpdateStatus = async (id: string, status: SuratPengantar['status']) => {
        if (status === 'selesai') {
            if (!window.confirm("Setujui dan terbitkan surat ini?")) return;
        }

        await suratService.updateStatus(id, status);
        loadData();
    };

    const filteredSurat = suratList.filter(s =>
        s.jenis_surat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.pemohon?.nama && s.pemohon.nama.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusBadge = (status: SuratPengantar['status']) => {
        switch (status) {
            case 'proses':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><ClockCounterClockwise weight="bold" /> Proses</span>;
            case 'selesai':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800"><CheckCircle weight="bold" /> Selesai</span>;
            case 'ditolak':
                return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle weight="bold" /> Ditolak</span>;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="page-title">Surat Pengantar</h1>
                    <p className="text-slate-500 text-[11px] sm:text-sm mt-0.5 font-medium flex items-center gap-1.5 tracking-normal">
                        Scope: <span className="font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">{currentScope}</span>
                    </p>
                </div>
                <HasPermission module="Surat Pengantar" action="Buat">
                    <button
                        onClick={() => navigate('/surat/new')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-all shadow-sm hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Buat Permohonan</span>
                    </button>
                </HasPermission>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari pemohon atau jenis surat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-sm"
                        />
                    </div>
                    <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                        <Funnel weight="fill" className="text-gray-400" />
                        <span>Filter Status</span>
                    </button>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold border-b border-gray-200">
                                <th className="p-3 font-semibold">Pemohon</th>
                                <th className="p-3 font-semibold">Jenis / Tanggal</th>
                                <th className="p-3 font-semibold">Keperluan</th>
                                <th className="p-3 font-semibold text-center">Status</th>
                                <th className="p-3 font-semibold text-right whitespace-nowrap px-6">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredSurat.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p>Belum ada permohonan surat di scope ini.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSurat.map((surat) => (
                                    <tr key={surat.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-3">
                                            <p className="font-bold text-slate-800 text-sm">{surat.pemohon?.nama}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">NIK: {surat.pemohon?.nik || '-'}</p>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-bold text-brand-700 text-xs tracking-normal">{surat.jenis_surat}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[9px] text-brand-600 font-bold bg-brand-50 px-1 rounded-sm border border-brand-100">{surat.nomor_surat || '-'}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{dateUtils.toDisplay(surat.tanggal)}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 max-w-[200px] leading-snug">{surat.keperluan}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            {getStatusBadge(surat.status)}
                                        </td>
                                        <td className="p-3 text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                {surat.status === 'proses' && (
                                                    <>
                                                        <HasPermission module="Surat Pengantar" action="Ubah">
                                                            <button
                                                                onClick={() => handleUpdateStatus(surat.id, 'selesai')}
                                                                className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-md transition-colors" title="Setujui & Terbitkan">
                                                                <CheckCircle weight="duotone" className="w-5 h-5" />
                                                            </button>
                                                        </HasPermission>
                                                        <HasPermission module="Surat Pengantar" action="Ubah">
                                                            <button
                                                                onClick={() => handleUpdateStatus(surat.id, 'ditolak')}
                                                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Tolak">
                                                                <XCircle weight="duotone" className="w-5 h-5" />
                                                            </button>
                                                        </HasPermission>
                                                    </>
                                                )}
                                                {surat.status === 'selesai' && (
                                                    <button
                                                        onClick={() => navigate(`/surat/cetak/${surat.id}`)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Cetak Surat">
                                                        <Printer weight="duotone" className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <HasPermission module="Surat Pengantar" action="Hapus">
                                                    <button
                                                        onClick={() => handleDelete(surat.id, surat.jenis_surat)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                                                        <Trash weight="duotone" className="w-5 h-5" />
                                                    </button>
                                                </HasPermission>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE VIEW: CARD GRID */}
                <div className="md:hidden space-y-4 p-4 bg-gray-50">
                    {isLoading ? (
                        <div className="text-center text-gray-500 py-8">Memuat data...</div>
                    ) : filteredSurat.length === 0 ? (
                        <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                            <FileText className="w-10 h-10 text-gray-300 mb-2" />
                            <p>Belum ada permohonan surat di scope ini.</p>
                        </div>
                    ) : (
                        filteredSurat.map((surat) => (
                            <div key={surat.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-base">{surat.jenis_surat}</h3>
                                                <p className="text-[11px] font-mono text-brand-600 font-medium mb-1">{surat.nomor_surat || '-'}</p>
                                                <p className="text-xs text-gray-500">{dateUtils.toDisplay(surat.tanggal)}</p>
                                            </div>
                                            <div>{getStatusBadge(surat.status)}</div>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-3 my-3">
                                            <p className="text-[10px] text-gray-400 font-semibold">Pemohon</p>
                                            <p className="font-semibold text-gray-900">{surat.pemohon?.nama}</p>
                                            <p className="text-xs text-gray-500">NIK: {surat.pemohon?.nik || '-'}</p>
                                        </div>

                                        <div className="text-sm text-gray-600 line-clamp-3">
                                            <span className="font-semibold text-gray-800">Keperluan:</span> {surat.keperluan}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 border-t border-gray-100 p-3 flex justify-end items-center gap-2">
                                    {surat.status === 'proses' && (
                                        <>
                                            <HasPermission module="Surat Pengantar" action="Ubah">
                                                <button
                                                    onClick={() => handleUpdateStatus(surat.id, 'selesai')}
                                                    className="flex-1 sm:flex-none justify-center flex items-center gap-1 p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors text-sm font-medium" title="Setujui">
                                                    <CheckCircle weight="duotone" className="w-4 h-4" /> Setujui
                                                </button>
                                            </HasPermission>
                                            <HasPermission module="Surat Pengantar" action="Ubah">
                                                <button
                                                    onClick={() => handleUpdateStatus(surat.id, 'ditolak')}
                                                    className="flex-1 sm:flex-none justify-center flex items-center gap-1 p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-sm font-medium" title="Tolak">
                                                    <XCircle weight="duotone" className="w-4 h-4" /> Tolak
                                                </button>
                                            </HasPermission>
                                        </>
                                    )}
                                    {surat.status === 'selesai' && (
                                        <button
                                            onClick={() => navigate(`/surat/cetak/${surat.id}`)}
                                            className="flex-1 sm:flex-none justify-center flex items-center gap-1 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium" title="Cetak Surat">
                                            <Printer weight="duotone" className="w-4 h-4" /> Cetak
                                        </button>
                                    )}
                                    <HasPermission module="Surat Pengantar" action="Hapus">
                                        <button
                                            onClick={() => handleDelete(surat.id, surat.jenis_surat)}
                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Hapus">
                                            <Trash weight="duotone" className="w-5 h-5" />
                                        </button>
                                    </HasPermission>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
