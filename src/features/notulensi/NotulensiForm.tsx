import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { notulensiService } from '../../services/notulensiService';
import { wargaService } from '../../services/wargaService';
import { Notulensi, Warga, Kehadiran } from '../../database/db';
import { ArrowLeft, FloppyDisk, CheckCircle, XCircle, MinusCircle, UserCircle, ClockCounterClockwise, CircleNotch, CalendarBlank, MapPin, Notebook, UsersThree, Info, Image as ImageIcon } from '@phosphor-icons/react';
import { FileUpload } from '../../components/ui/FileUpload';
import { Text } from '../../components/ui/Typography';

type NotulensiFormData = Omit<Notulensi, 'id' | 'tenant_id' | 'scope'>;

export default function NotulensiForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();

    const [selectedWargaIds, setSelectedWargaIds] = useState<Set<string>>(new Set());
    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [pastHosts, setPastHosts] = useState<Set<string>>(new Set());
    const [kehadiranState, setKehadiranState] = useState<Record<string, Kehadiran['status']>>({});
    const [urlFoto, setUrlFoto] = useState<string | null>(null);
    const [selectedHostId, setSelectedHostId] = useState<string | null>(null);
    const [showHostSelector, setShowHostSelector] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<NotulensiFormData>();

    useEffect(() => {
        if (currentTenant) {
            // 1. Load Warga
            wargaService.getAll(currentTenant.id, currentScope).then(data => {
                const wargaData = data.items || [];
                setWargaList(wargaData);
                if (!isEditing) {
                    const initialKehadiran: Record<string, Kehadiran['status']> = {};
                    wargaData.forEach(w => {
                        initialKehadiran[w.id] = 'hadir';
                    });
                    setKehadiranState(initialKehadiran);
                }
            });

            // 2. Load Host History
            notulensiService.getAll(currentTenant.id, currentScope).then(list => {
                const hosts = new Set(list.map(n => n.tuan_rumah_id).filter(Boolean) as string[]);
                setPastHosts(hosts);
            });
        }

        // 3. Load existing Notulensi if editing
        if (isEditing && id) {
            notulensiService.getById(id).then(data => {
                if (data) {
                    reset({
                        judul: data.judul,
                        tanggal: data.tanggal,
                        tuan_rumah: data.tuan_rumah,
                        tuan_rumah_id: data.tuan_rumah_id,
                        lokasi: data.lokasi,
                        url_foto: data.url_foto,
                        konten: data.konten,
                        jam_mulai: data.jam_mulai,
                        jam_selesai: data.jam_selesai
                    });
                    setUrlFoto(data.url_foto || null);
                    setSelectedHostId(data.tuan_rumah_id || null);

                    if (data.kehadiran_list) {
                        const loadedKehadiran: Record<string, Kehadiran['status']> = {};
                        data.kehadiran_list.forEach(k => {
                            loadedKehadiran[k.warga_id] = k.status;
                        });
                        setKehadiranState(loadedKehadiran);
                    }
                }
            });
        }
    }, [id, isEditing, reset, currentTenant, currentScope]);

    const handleFileSuccess = (url: string) => {
        setUrlFoto(url);
    };

    const handleFileRemove = () => {
        setUrlFoto(null);
    };

    const toggleKehadiran = (wargaId: string) => {
        setKehadiranState(prev => {
            const current = prev[wargaId];
            let nextStatus: Kehadiran['status'] = 'hadir';
            if (current === 'hadir') nextStatus = 'izin';
            else if (current === 'izin') nextStatus = 'sakit';
            else if (current === 'sakit') nextStatus = 'alfa';
            else nextStatus = 'hadir';
            return { ...prev, [wargaId]: nextStatus };
        });
    };

    const toggleSelection = (wargaId: string) => {
        setSelectedWargaIds(prev => {
            const next = new Set(prev);
            if (next.has(wargaId)) next.delete(wargaId);
            else next.add(wargaId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedWargaIds.size === wargaList.length) {
            setSelectedWargaIds(new Set());
        } else {
            setSelectedWargaIds(new Set(wargaList.map(w => w.id)));
        }
    };

    const handleBulkUpdateStatus = (status: Kehadiran['status']) => {
        setKehadiranState(prev => {
            const next = { ...prev };
            selectedWargaIds.forEach(id => {
                next[id] = status;
            });
            return next;
        });
        setSelectedWargaIds(new Set());
    };

    const getStatusTheme = (status: Kehadiran['status']) => {
        switch (status) {
            case 'hadir': return 'bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100';
            case 'izin': return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100';
            case 'sakit': return 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100';
            case 'alfa': return 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    const getStatusIcon = (status: Kehadiran['status']) => {
        switch (status) {
            case 'hadir': return <CheckCircle weight="fill" className="w-4 h-4" />;
            case 'izin': return <MinusCircle weight="fill" className="w-4 h-4" />;
            case 'sakit': return <MinusCircle weight="fill" className="w-4 h-4" />;
            case 'alfa': return <XCircle weight="fill" className="w-4 h-4" />;
            default: return null;
        }
    };

    const getStatusLabel = (status: Kehadiran['status']) => {
        switch (status) {
            case 'hadir': return 'Hadir';
            case 'izin': return 'Izin';
            case 'sakit': return 'Sakit';
            case 'alfa': return 'Alfa';
            default: return '-';
        }
    };

    const handleHostSelect = (warga: Warga) => {
        setSelectedHostId(warga.id);
        setValue('tuan_rumah_id', warga.id);
        setValue('tuan_rumah', warga.nama);
        setShowHostSelector(false);
    };

    const onSubmit = async (data: NotulensiFormData) => {
        if (!currentTenant) return;
        setIsSubmitting(true);

        try {
            const kehadiranDataArray = Object.entries(kehadiranState).map(([wargaId, status]) => ({
                warga_id: wargaId,
                status
            }));

            const finalData = {
                ...data,
                url_foto: urlFoto || undefined,
                tuan_rumah_id: selectedHostId || undefined,
                jam_mulai: data.jam_mulai,
                jam_selesai: data.jam_selesai
            };

            if (isEditing && id) {
                await notulensiService.update(id, { ...finalData, tenant_id: currentTenant.id, scope: currentScope }, kehadiranDataArray);
            } else {
                await notulensiService.create(
                    {
                        ...finalData,
                        tenant_id: currentTenant.id,
                        scope: currentScope
                    },
                    kehadiranDataArray
                );
            }
            navigate('/notulensi');
        } catch (error) {
            console.error("Gagal menyimpan notulensi:", error);
            alert("Terjadi kesalahan saat menyimpan catatan pertemuan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative text-slate-800 pb-20">
            {/* Header section with refined aesthetics */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/notulensi')}
                        className="p-3 bg-slate-50 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all border border-slate-100 hover:border-brand-200 active:scale-95 group"
                    >
                        <ArrowLeft weight="bold" className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </button>
                    <div>
                        {/* Using standard Text components */}
                        <div className="flex items-center gap-2 mb-1.5 text-left">
                            <Text.H1>
                                {isEditing ? 'Ubah Notulensi' : 'Notulensi Baru'}
                            </Text.H1>
                            <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[10px] font-bold tracking-tight rounded-md border border-brand-100">
                                {currentScope}
                            </span>
                        </div>
                        <Text.Caption>
                            {isEditing ? 'Perbarui Data Pertemuan & Absensi Warga' : 'Catat Detail Pertemuan & Kelola Daftar Hadir'}
                        </Text.Caption>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* KOLOM UTAMA: Form Notulensi (Lg: 8/12) */}
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
                                <Text.Label className="!text-slate-900">Informasi Utama</Text.Label>
                            </div>

                            <div className="p-6 space-y-6">
                                <div>
                                    <Text.Label className="mb-2 block px-1">
                                        Judul / Topik Pertemuan <span className="text-rose-500">*</span>
                                    </Text.Label>
                                    <input
                                        type="text"
                                        {...register('judul', { required: 'Judul pertemuan wajib diisi' })}
                                        className={`w-full rounded-xl p-4 border transition-all outline-none text-base font-normal shadow-sm ${errors.judul ? 'border-rose-200 bg-rose-50 focus:ring-rose-200' : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'}`}
                                        placeholder="Contoh: Rapat Rutin Bulanan RT 01"
                                    />
                                    {errors.judul && <p className="text-rose-500 text-[10px] font-bold tracking-tight mt-2 px-1 animate-pulse">{errors.judul.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Text.Label className="mb-2 block px-1 flex items-center gap-2">
                                            <CalendarBlank className="text-brand-500" /> Tanggal Pelaksanaan
                                        </Text.Label>
                                        <input
                                            type="date"
                                            {...register('tanggal', { required: 'Tanggal wajib diisi' })}
                                            className={`w-full rounded-xl p-4 border transition-all outline-none font-normal shadow-sm ${errors.tanggal ? 'border-rose-200 bg-rose-50 focus:ring-rose-200' : 'border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10'}`}
                                        />
                                        {errors.tanggal && <p className="text-rose-500 text-[10px] font-bold tracking-tight mt-2 px-1 animate-pulse">{errors.tanggal.message}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Text.Label className="mb-2 block px-1">
                                                Jam Mulai
                                            </Text.Label>
                                            <input
                                                type="time"
                                                {...register('jam_mulai')}
                                                className="w-full rounded-xl p-4 border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none font-normal shadow-sm"
                                            />
                                        </div>
                                        <div>
                                            <Text.Label className="mb-2 block px-1">
                                                Jam Selesai
                                            </Text.Label>
                                            <input
                                                type="time"
                                                {...register('jam_selesai')}
                                                className="w-full rounded-xl p-4 border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none font-normal shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Text.Label className="mb-2 block px-1 flex items-center gap-2">
                                            <UserCircle className="text-brand-500" /> Tuan Rumah / Host
                                        </Text.Label>
                                        <div className="flex gap-2">
                                            <div
                                                onClick={() => setShowHostSelector(true)}
                                                className="w-full rounded-xl p-4 border border-slate-100 bg-slate-50 hover:bg-white hover:border-brand-200 cursor-pointer transition-all flex items-center justify-between group/input shadow-sm"
                                            >
                                                <span className={`font-bold uppercase ${selectedHostId ? 'text-slate-900' : 'text-slate-400'}`}>
                                                    {selectedHostId ? wargaList.find(w => w.id === selectedHostId)?.nama : 'Pilih tuan rumah...'}
                                                </span>
                                                <div className="p-1 rounded-md bg-slate-200/50 group-hover/input:bg-brand-100 group-hover/input:text-brand-600 transition-colors">
                                                    <UsersThree weight="bold" />
                                                </div>
                                            </div>
                                        </div>

                                        {showHostSelector && (
                                            <div className="absolute z-50 mt-3 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                                    <Text.Label className="!text-slate-400">Pilih Warga</Text.Label>
                                                    <button onClick={() => setShowHostSelector(false)} className="text-slate-400 hover:text-rose-500 p-1 transition-colors">
                                                        <XCircle size={24} weight="fill" />
                                                    </button>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto">
                                                    {wargaList.map(w => (
                                                        <button
                                                            key={w.id}
                                                            type="button"
                                                            onClick={() => handleHostSelect(w)}
                                                            className={`w-full text-left p-4 hover:bg-brand-50/50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-all group ${selectedHostId === w.id ? 'bg-brand-50' : ''}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${selectedHostId === w.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-100 group-hover:text-brand-600'}`}>
                                                                    {w.nama.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <Text.Body className={`!text-xs font-bold tracking-tight mb-0.5 uppercase ${selectedHostId === w.id ? 'text-brand-700' : 'text-slate-900'}`}>{w.nama}</Text.Body>
                                                                    <Text.Caption className="tracking-tight">{w.alamat}</Text.Caption>
                                                                </div>
                                                            </div>
                                                            {pastHosts.has(w.id) && (
                                                            <div className="flex items-center gap-1 text-[9px] bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-bold tracking-tight border border-amber-100">
                                                                    <ClockCounterClockwise size={12} weight="bold" />
                                                                    <span>Riwayat Host</span>
                                                                </div>
                                                            )}
                                                            {selectedHostId === w.id && (
                                                                <CheckCircle weight="fill" className="text-brand-600 w-5 h-5" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 tracking-tight mb-2 px-1 flex items-center gap-2">
                                        <MapPin className="text-brand-500" /> Lokasi Pertemuan
                                    </label>
                                    <input
                                        type="text"
                                        {...register('lokasi')}
                                        className="w-full rounded-xl p-4 border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none font-normal shadow-sm"
                                        placeholder="Contoh: Balai Warga, Rumah Pak RT, atau Alamat Lengkap..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 tracking-tight mb-2 px-1 flex items-center gap-2">
                                        <Notebook className="text-brand-500" /> Hasil & Pembahasan Rapat
                                    </label>
                                    <textarea
                                        rows={8}
                                        {...register('konten')}
                                        className="w-full rounded-2xl p-4 border border-slate-100 bg-slate-50 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none font-normal leading-relaxed shadow-sm text-slate-700"
                                        placeholder="Tuliskan poin-poin penting, keputusan bersama, evaluasi program, dan tindak lanjut yang disepakati..."
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3 font-bold">
                                <div className="p-2 bg-slate-900 rounded-lg shadow-lg">
                                    <ImageIcon weight="fill" className="text-white w-4 h-4" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 tracking-tight text-left">Dokumentasi Visual</h3>
                            </div>
                            <div className="p-6">
                                <FileUpload
                                    label="Upload Foto Kegiatan (Satu Foto Utama)"
                                    helperText="Gunakan foto yang jelas memperlihatkan suasana rapat atau absensi bertanda tangan (Maks. 2MB)"
                                    multiple={false}
                                    existingUrls={urlFoto ? [urlFoto] : []}
                                    onUploadSuccess={handleFileSuccess}
                                    onRemove={handleFileRemove}
                                    onLoadingChange={setIsUploading}
                                />
                            </div>
                        </section>
                    </div>

                    {/* KOLOM SAMPING: Daftar Hadir (Lg: 4/12) */}
                    <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[770px]">
                            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <UsersThree weight="bold" className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold tracking-tight">Daftar Kehadiran</h3>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleSelectAll}
                                        className="text-[10px] font-bold tracking-tight px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                                    >
                                        {selectedWargaIds.size === wargaList.length ? 'Batal Semua' : 'Pilih Semua'}
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-400 font-bold tracking-tight flex items-center gap-2 px-1">
                                    <Info weight="fill" className="text-brand-400 w-3.5 h-3.5" /> Klik Status Untuk Perbarui
                                </p>
                            </div>

                            {/* Bulk Action Bar - Appear when selected */}
                            <div className={`overflow-hidden transition-all duration-300 bg-brand-600 text-white flex flex-col ${selectedWargaIds.size > 0 ? 'h-auto p-4 opacity-100' : 'h-0 opacity-0'}`}>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <Text.Caption className="!text-white">{selectedWargaIds.size} Warga Terpilih</Text.Caption>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedWargaIds(new Set())}
                                        className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md font-bold transition-all"
                                    >
                                        Batal
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => handleBulkUpdateStatus('hadir')}
                                        className="flex flex-col items-center justify-center p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                                    >
                                        <CheckCircle weight="fill" className="w-4 h-4 mb-1" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest">Hadir</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkUpdateStatus('izin')}
                                        className="flex flex-col items-center justify-center p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                                    >
                                        <MinusCircle weight="fill" className="w-4 h-4 mb-1 text-blue-300" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest">Izin</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkUpdateStatus('sakit')}
                                        className="flex flex-col items-center justify-center p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                                    >
                                        <MinusCircle weight="fill" className="w-4 h-4 mb-1 text-amber-300" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest">Sakit</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkUpdateStatus('alfa')}
                                        className="flex flex-col items-center justify-center p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10"
                                    >
                                        <XCircle weight="fill" className="w-4 h-4 mb-1 text-rose-300" />
                                        <span className="text-[8px] font-bold uppercase tracking-widest">Alfa</span>
                                    </button>
                                </div>
                            </div>

                            {/* Summary Badges Grid */}
                            <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 border-b border-slate-100">
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-tight mb-1 leading-none text-left">Hadir</span>
                                    <span className="text-xl font-bold text-brand-600 leading-none">{Object.values(kehadiranState).filter(s => s === 'hadir').length}</span>
                                </div>
                                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 tracking-tight mb-1 leading-none text-left">Izin / Sakit</span>
                                    <span className="text-xl font-bold text-amber-500 leading-none">{Object.values(kehadiranState).filter(s => s === 'izin' || s === 'sakit').length}</span>
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar">
                                {wargaList.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200 mb-4">
                                            <UsersThree className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 leading-relaxed">Belum ada data warga</p>
                                    </div>
                                ) : (
                                    wargaList.map(warga => (
                                        <div
                                            key={warga.id}
                                            className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all group animate-in fade-in slide-in-from-right-2 duration-300 group
                                                ${selectedWargaIds.has(warga.id) ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/10' : 'border-slate-100 bg-white hover:border-brand-100 hover:shadow-md'}`}
                                        >
                                            <div
                                                className="flex items-center gap-3 overflow-hidden cursor-pointer w-full"
                                                onClick={() => toggleSelection(warga.id)}
                                            >
                                                {/* Checkbox circle */}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0
                                                    ${selectedWargaIds.has(warga.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-200 group-hover:border-brand-300'}`}>
                                                    {selectedWargaIds.has(warga.id) && <CheckCircle weight="bold" className="text-white w-3 h-3" />}
                                                </div>

                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${kehadiranState[warga.id] === 'hadir' ? 'bg-brand-100 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {warga.nama.charAt(0)}
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-normal text-slate-900 tracking-tight truncate leading-tight mb-0.5">{warga.nama}</p>
                                                    <p className="text-[10px] font-medium text-slate-400 tracking-tight truncate">{warga.alamat}</p>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => toggleKehadiran(warga.id)}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold tracking-tight border transition-all active:scale-90 shadow-sm shrink-0
                                                       ${getStatusTheme(kehadiranState[warga.id] || 'hadir')}`}
                                            >
                                                {getStatusIcon(kehadiranState[warga.id] || 'hadir')}
                                                <span className="hidden sm:inline">{getStatusLabel(kehadiranState[warga.id] || 'hadir')}</span>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 tracking-tight mb-0.5">Total Warga</span>
                                    <span className="text-white font-bold text-sm">{wargaList.length} Jiwa</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></div>
                                    <span className="text-[11px] font-bold text-brand-400 tracking-tight">Ready to Sync</span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Actions Area */}
                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={isUploading || isSubmitting}
                                className={`w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl flex items-center justify-center gap-3 font-bold tracking-tight text-sm hover-lift active-press shadow-xl shadow-brand-100 hover:shadow-brand-200 transition-all ${isUploading || isSubmitting ? 'opacity-70 cursor-wait bg-slate-500 shadow-none' : ''}`}
                            >
                                {isUploading || isSubmitting ? (
                                    <CircleNotch weight="bold" className="animate-spin w-6 h-6" />
                                ) : (
                                    <FloppyDisk weight="fill" className="w-5 h-5" />
                                )}
                                <span>{isUploading ? 'Progress...' : (isSubmitting ? 'Simpan' : (isEditing ? 'Simpan Perubahan' : 'Finalisasi & Simpan'))}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/notulensi')}
                                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl flex items-center justify-center font-bold tracking-tight text-xs border border-slate-100 transition-all active:scale-95"
                            >
                                Batalkan Progres
                            </button>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}
