import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { suratService, SuratWithWarga } from '../../services/suratService';
import { SuratPengantar } from '../../database/db';
import { dateUtils } from '../../utils/date';
import { Plus, Funnel, Trash, FileText, CheckCircle, ClockCounterClockwise, XCircle, Printer } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { Text } from '../../components/ui/Typography';

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
        (s.warga?.nama && s.warga.nama.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusBadge = (status: SuratPengantar['status']) => {
        switch (status) {
            case 'proses':
                return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 shadow-sm"><ClockCounterClockwise weight="bold" className="text-amber-600" /><Text.Label className="!text-amber-600 !text-[10px] !normal-case">Diproses</Text.Label></div>;
            case 'selesai':
                return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm"><CheckCircle weight="fill" className="text-emerald-600" /><Text.Label className="!text-emerald-600 !text-[10px] !normal-case">Selesai</Text.Label></div>;
            case 'ditolak':
                return <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 shadow-sm"><XCircle weight="bold" className="text-rose-600" /><Text.Label className="!text-rose-600 !text-[10px] !normal-case">Ditolak</Text.Label></div>;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Text.H1>Surat Pengantar</Text.H1>
                    <Text.Body>Kelola Permohonan Surat Pengantar Warga</Text.Body>
                </div>
                <HasPermission module="Surat / Cetak" action="Buat">
                    <button
                        onClick={() => navigate('/surat/new')}
                        className="hidden sm:flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-sm font-bold transition-all shadow-xl shadow-brand-500/20 hover-lift active-press"
                    >
                        <Plus weight="bold" size={18} />
                        <Text.Label className="!text-white">Buat Permohonan Baru</Text.Label>
                    </button>
                    
                    {/* MOBILE FAB */}
                    <button
                        onClick={() => navigate('/surat/new')}
                        className="sm:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-90 transition-transform active-press"
                    >
                        <Plus weight="bold" size={24} />
                    </button>
                </HasPermission>
            </div>

            {/* STATS WIDGETS */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500" />
                    <Text.Label className="mb-1.5 flex items-center gap-2">
                        <FileText weight="duotone" className="text-brand-500 w-4 h-4" />
                        Total Surat
                    </Text.Label>
                    <div className="flex items-baseline gap-1">
                        <Text.Amount className="text-2xl text-slate-900">{suratList.length}</Text.Amount>
                        <Text.Caption className="leading-none tracking-widest text-slate-400">Permohonan</Text.Caption>
                    </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:bg-slate-950 transition-all duration-300">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <Text.Label className="mb-1.5 flex items-center gap-2 text-slate-400">
                        <ClockCounterClockwise weight="duotone" className="text-amber-400 w-4 h-4" />
                        Antrian Berjalan
                    </Text.Label>
                    <div className="flex items-baseline gap-1">
                        <Text.Amount className="text-2xl text-white">{suratList.filter(s => s.status === 'proses').length}</Text.Amount>
                        <Text.Caption className="leading-none tracking-widest text-slate-500">Berjalan</Text.Caption>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
                    <div className="relative w-full sm:w-96 group">
                        <input
                            type="text"
                            placeholder="Cari pemohon atau jenis surat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                        />
                    </div>
                    <button className="w-full sm:w-auto flex justify-center items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-sm font-bold transition-all shadow-sm active-press">
                        <Funnel weight="bold" className="text-slate-400" />
                        <Text.Label className="!text-slate-700">Filter Status</Text.Label>
                    </button>
                </div>

                {/* DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="p-3"><Text.Label>Pemohon</Text.Label></th>
                                <th className="p-3"><Text.Label>Jenis / Tanggal</Text.Label></th>
                                <th className="p-3"><Text.Label>Keperluan</Text.Label></th>
                                <th className="p-3 text-center"><Text.Label>Status</Text.Label></th>
                                <th className="p-3 text-right whitespace-nowrap px-6"><Text.Label>Aksi</Text.Label></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500"><Text.Body>Memuat Data...</Text.Body></td>
                                </tr>
                            ) : filteredSurat.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <Text.Body className="!text-slate-500">Belum Ada Permohonan Surat Di Scope Ini.</Text.Body>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredSurat.map((surat) => (
                                    <tr key={surat.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-3">
                                            <Text.H2 className="!text-sm uppercase">{surat.warga?.nama || 'Pemohon Tidak Ditemukan'}</Text.H2>
                                            <Text.Caption className="!text-[10px] block">NIK: {surat.warga?.nik || '-'}</Text.Caption>
                                            <Text.Caption className="!text-[9px] !italic !normal-case text-slate-400 line-clamp-1">{surat.warga?.alamat || '-'}</Text.Caption>
                                        </td>
                                        <td className="p-3">
                                            <Text.Body className="!font-bold !text-brand-700 !text-xs">{surat.jenis_surat}</Text.Body>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Text.Caption className="!text-[9px] !text-brand-600 !font-bold bg-brand-50 px-1 rounded-sm border border-brand-100">{surat.nomor_surat || '-'}</Text.Caption>
                                                <Text.Caption className="!text-[10px] !font-medium">{dateUtils.toDisplay(surat.tanggal)}</Text.Caption>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Text.Body className="!text-[11px] line-clamp-2 max-w-[200px] leading-snug">{surat.keperluan}</Text.Body>
                                        </td>
                                        <td className="p-3 text-center">
                                            {getStatusBadge(surat.status)}
                                        </td>
                                        <td className="p-3 text-right px-6">
                                            <div className="flex justify-end gap-2">
                                                {surat.status === 'proses' && (
                                                    <>
                                                        <HasPermission module="Surat / Cetak" action="Ubah">
                                                            <button
                                                                onClick={() => handleUpdateStatus(surat.id, 'selesai')}
                                                                className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-md transition-colors" title="Setujui & Terbitkan">
                                                                <CheckCircle weight="duotone" className="w-5 h-5" />
                                                            </button>
                                                        </HasPermission>
                                                        <HasPermission module="Surat / Cetak" action="Ubah">
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
                                                <HasPermission module="Surat / Cetak" action="Hapus">
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
                        <div className="py-20 text-center animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                            <Text.Label className="!text-slate-400">Sinkronisasi...</Text.Label>
                        </div>
                    ) : filteredSurat.length === 0 ? (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <FileText weight="duotone" className="w-8 h-8 text-slate-300" />
                            </div>
                            <div>
                                <Text.Body className="!font-bold !text-slate-900">Belum Ada Permohonan</Text.Body>
                                <Text.Caption className="mt-1 !font-medium">Riwayat permohonan surat akan muncul di sini</Text.Caption>
                            </div>
                        </div>
                    ) : (
                        filteredSurat.map((surat) => (
                            <div key={surat.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex flex-col items-center justify-center border border-brand-100 shadow-inner">
                                                <Text.Caption className="!text-[8px] !font-bold !leading-none uppercase">{new Date(surat.tanggal).toLocaleDateString('id-ID', { month: 'short' })}</Text.Caption>
                                                <Text.Body className="!text-sm !font-bold !leading-none mt-0.5">{new Date(surat.tanggal).getDate()}</Text.Body>
                                            </div>
                                            <div>
                                                <Text.H2 className="text-[14px] leading-tight mb-1">{surat.jenis_surat}</Text.H2>
                                                <div className="flex items-center gap-1.5">
                                                    <Text.Caption className="font-mono tracking-tighter italic">{surat.nomor_surat || 'Draft'}</Text.Caption>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {surat.status === 'proses' ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-1.5 shadow-sm tracking-wider animate-pulse">
                                                    <ClockCounterClockwise weight="bold" className="w-3.5 h-3.5" />
                                                    <Text.Label className="!text-amber-600 !text-[10px]">Menunggu</Text.Label>
                                                </span>
                                            ) : surat.status === 'selesai' ? (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1.5 shadow-sm tracking-wider">
                                                    <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                                                    <Text.Label className="!text-emerald-600 !text-[10px]">Selesai</Text.Label>
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 flex items-center gap-1.5 shadow-sm tracking-wider">
                                                    <XCircle weight="bold" className="w-3.5 h-3.5" />
                                                    <Text.Label className="!text-rose-600 !text-[10px]">Ditolak</Text.Label>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                                            <Text.Label className="mb-2 leading-none">Identitas Pemohon</Text.Label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                                                    <Text.Caption className="font-black text-brand-600 text-lg">{surat.warga?.nama ? surat.warga.nama[0].toUpperCase() : '?'}</Text.Caption>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <Text.H2 className="!text-[13px] leading-tight uppercase truncate">{surat.warga?.nama || 'Pemohon Tidak Ditemukan'}</Text.H2>
                                                    <Text.Caption className="mt-0.5 block">NIK: {surat.warga?.nik || '-'}</Text.Caption>
                                                    <Text.Caption className="mt-0.5 !text-[10px] !italic !normal-case text-slate-400 line-clamp-1">{surat.warga?.alamat || '-'}</Text.Caption>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3">
                                            <Text.Label className="mb-2 leading-none">Tujuan / Keperluan</Text.Label>
                                            <Text.Body className="!text-[12px] italic leading-relaxed">"{surat.keperluan}"</Text.Body>
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center pt-4 border-t border-slate-50 gap-2 mt-4">
                                        {surat.status === 'proses' ? (
                                            <>
                                                <HasPermission module="Surat / Cetak" action="Ubah">
                                                    <button
                                                        onClick={() => handleUpdateStatus(surat.id, 'selesai')}
                                                        className="flex-1 py-2 bg-brand-600 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-tighter shadow-md active:scale-95"
                                                    >
                                                        <CheckCircle weight="bold" className="w-4 h-4" />
                                                        <Text.Label className="!text-white !text-[11px]">Setujui</Text.Label>
                                                    </button>
                                                </HasPermission>
                                                <HasPermission module="Surat / Cetak" action="Ubah">
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
                                                className="flex-1 py-2 bg-blue-600 text-white rounded-xl transition-all flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-tighter shadow-md active:scale-90"
                                            >
                                                <Printer weight="bold" className="w-4 h-4" />
                                                <Text.Label className="!text-white !text-[11px]">Cetak Surat</Text.Label>
                                            </button>
                                        ) : null}
                                        <HasPermission module="Surat / Cetak" action="Hapus">
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
