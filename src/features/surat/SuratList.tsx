import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { suratService, SuratWithWarga } from '../../services/suratService';
import { SuratPengantar } from '../../database/db';
import { dateUtils } from '../../utils/date';
import { Plus, Funnel, Trash, FileText, CheckCircle, ClockCounterClockwise, XCircle, Printer } from '@phosphor-icons/react';
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
                    <p className="text-slate-500 text-[12px] mt-1 font-medium flex items-center gap-1.5 tracking-tight">Kelola permohonan surat pengantar warga</p>
                </div>
                <HasPermission module="Surat Pengantar" action="Buat">
                    <button
                        onClick={() => navigate('/surat/new')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[14px] font-normal transition-all shadow-sm hover-lift active-press"
                    >
                        <Plus weight="bold" />
                        <span>Buat Permohonan Baru</span>
                    </button>
                </HasPermission>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-2 -mt-2">
                <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md border-l-4 border-l-brand-500">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <FileText weight="fill" className="text-brand-500 w-3 h-3" />
                            Total Surat
                        </p>
                        <p className="text-[13px] sm:text-lg font-normal text-slate-900 leading-none truncate tabular-nums">{suratList.length} Permohonan</p>
                    </div>
                </div>

                <div className="bg-brand-600 p-3 sm:p-4 rounded-2xl border border-brand-500 shadow-lg relative overflow-hidden group hover:bg-brand-700 transition-all duration-300">
                    <div className="absolute -right-4 -bottom-4 w-15 h-15 sm:w-24 sm:h-24 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center text-white">
                        <p className="text-[10px] sm:text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
                            <ClockCounterClockwise weight="bold" className="text-amber-400 w-3 h-3" />
                            Menunggu Proses
                        </p>
                        <p className="text-[13px] sm:text-lg font-normal text-white leading-none truncate tabular-nums">{suratList.filter(s => s.status === 'proses').length} Antrian</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <input
                            type="text"
                            placeholder="Cari pemohon atau jenis surat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors shadow-sm"
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
                <div className="md:hidden space-y-4 p-4 bg-slate-50/50">
                    {isLoading ? (
                        <div className="py-20 text-center text-slate-400 font-bold text-[11px] uppercase tracking-widest animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Sinkronisasi...</span>
                        </div>
                    ) : filteredSurat.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <FileText weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900 tracking-tight">Belum Ada Permohonan</p>
                                <p className="text-[10px] text-slate-400 mt-1 font-medium">Riwayat permohonan surat akan muncul di sini</p>
                            </div>
                        </div>
                    ) : (
                        filteredSurat.map((surat) => (
                            <div key={surat.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex flex-col items-center justify-center border border-brand-100 shadow-inner">
                                                <span className="text-[8px] font-bold leading-none uppercase">{new Date(surat.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</span>
                                                <span className="text-sm font-bold leading-none mt-0.5">{new Date(surat.tanggal).getDate()}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-[14px] uppercase tracking-tight leading-tight mb-1">{surat.jenis_surat}</h3>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono text-slate-400 tracking-tighter uppercase italic">{surat.nomor_surat || 'DRAFT'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {surat.status === 'proses' ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider animate-pulse">
                                                    <ClockCounterClockwise weight="bold" className="w-3.5 h-3.5" />
                                                    Pending
                                                </span>
                                            ) : surat.status === 'selesai' ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                                    <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                    Selesai
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                                                    <XCircle weight="bold" className="w-3.5 h-3.5" />
                                                    Ditolak
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 leading-none">Identitas Pemohon</p>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                    <span className="text-[10px] font-black text-brand-600">{surat.pemohon?.nama[0].toUpperCase()}</span>
                                                </div>
                                                <div>
                                                    <p className="text-[12px] font-bold text-slate-900 leading-none">{surat.pemohon?.nama}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-1">NIK: {surat.pemohon?.nik || '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 leading-none">Tujuan / Keperluan</p>
                                            <p className="text-[12px] text-slate-600 leading-relaxed italic font-medium">"{surat.keperluan}"</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center pt-4 border-t border-slate-50 gap-2 mt-4">
                                        {surat.status === 'proses' ? (
                                            <>
                                                <HasPermission module="Surat Pengantar" action="Ubah">
                                                    <button
                                                        onClick={() => handleUpdateStatus(surat.id, 'selesai')}
                                                        className="flex-1 py-2 bg-brand-600 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-tighter shadow-md active:scale-95"
                                                    >
                                                        <CheckCircle weight="bold" className="w-4 h-4" />
                                                        SETUJUI
                                                    </button>
                                                </HasPermission>
                                                <HasPermission module="Surat Pengantar" action="Ubah">
                                                    <button
                                                        onClick={() => handleUpdateStatus(surat.id, 'ditolak')}
                                                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all shadow-sm border border-rose-100/50"
                                                    >
                                                        <XCircle weight="bold" className="w-4 h-4" />
                                                    </button>
                                                </HasPermission>
                                            </>
                                        ) : surat.status === 'selesai' ? (
                                            <button
                                                onClick={() => navigate(`/surat/cetak/${surat.id}`)}
                                                className="flex-1 py-2 bg-blue-600 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-tighter shadow-md active:scale-95"
                                            >
                                                <Printer weight="bold" className="w-4 h-4" />
                                                CETAK SURAT
                                            </button>
                                        ) : null}
                                        <HasPermission module="Surat Pengantar" action="Hapus">
                                            <button
                                                onClick={() => handleDelete(surat.id, surat.jenis_surat)}
                                                className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-transparent shadow-sm"
                                            >
                                                <Trash weight="bold" className="w-4 h-4" />
                                            </button>
                                        </HasPermission>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
