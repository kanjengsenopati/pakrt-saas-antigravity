import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { pengurusService } from '../../services/pengurusService';
import { wargaService } from '../../services/wargaService';
import { pengaturanService } from '../../services/pengaturanService';
import { Pengurus, Warga } from '../../database/db';
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react';
import { Text } from '../../components/ui/Typography';
import { parseApiError } from '../../utils/errorParser';

type PengurusFormData = Omit<Pengurus, 'id' | 'tenant_id' | 'scope'>;

export default function PengurusForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();

    const [wargaList, setWargaList] = useState<Warga[]>([]);
    const [jabatanOptions, setJabatanOptions] = useState<string[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<string[]>([]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PengurusFormData>();

    const loadInitialData = async () => {
        if (!currentTenant) return;

        try {
            const [wargas, jabatanRaw, periodeRaw] = await Promise.all([
                wargaService.getAll(currentTenant.id, currentScope),
                pengaturanService.getByKey(currentTenant.id, currentScope, 'jabatan_pengurus'),
                pengaturanService.getByKey(currentTenant.id, currentScope, 'periode_pengurus')
            ]);

            setWargaList(wargas.items || []);

            let jOpts: string[] = [];
            try {
                const parsed = typeof jabatanRaw === 'string' ? JSON.parse(jabatanRaw) : jabatanRaw;
                if (Array.isArray(parsed)) jOpts = parsed;
            } catch (e) { console.error("Error parsing jabatan:", e); }

            let pOpts: string[] = [];
            try {
                const parsed = typeof periodeRaw === 'string' ? JSON.parse(periodeRaw) : periodeRaw;
                if (Array.isArray(parsed)) pOpts = parsed;
            } catch (e) { console.error("Error parsing periode:", e); }

            if (isEditing && id) {
                const data = await pengurusService.getById(id);
                if (data) {
                    if (data.jabatan && !jOpts.includes(data.jabatan)) {
                        jOpts = [data.jabatan, ...jOpts];
                    }
                    if (data.periode && !pOpts.includes(data.periode)) {
                        pOpts = [data.periode, ...pOpts];
                    }
                    reset({
                        warga_id: data.warga_id,
                        jabatan: data.jabatan,
                        periode: data.periode,
                        status: data.status || 'aktif'
                    });
                }
            } else {
                reset({
                    status: 'aktif'
                });
            }

            setJabatanOptions(jOpts);
            setPeriodeOptions(pOpts);

        } catch (error) {
            console.error("Failed to load initial form data:", error);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, [id, isEditing, reset, currentTenant, currentScope]);

    const handleQuickSetup = async () => {
        if (!currentTenant) return;
        const defaultJabatan = [`Ketua ${currentScope}`, `Sekretaris ${currentScope}`, `Bendahara ${currentScope}`, 'Humas', 'Keamanan', 'Pembangunan'];
        const currentYear = new Date().getFullYear();
        const defaultPeriode = [`${currentYear} - ${currentYear + 3}`, `${currentYear - 3} - ${currentYear}`];

        try {
            await pengaturanService.saveMultiple(currentTenant.id, currentScope, {
                jabatan_pengurus: JSON.stringify(defaultJabatan),
                periode_pengurus: JSON.stringify(defaultPeriode)
            });
            await loadInitialData();
        } catch (error) {
            console.error("Quick setup failed:", error);
            alert("Gagal melakukan pengaturan cepat.");
        }
    };

    const onSubmit = async (data: PengurusFormData) => {
        if (!currentTenant) return;

        try {
            if (isEditing && id) {
                await pengurusService.update(id, data);
            } else {
                await pengurusService.create({
                    ...data,
                    tenant_id: currentTenant.id,
                    scope: currentScope
                });
            }
            navigate('/pengurus');
        } catch (error: any) {
            console.error("Gagal menyimpan data pengurus:", error);
            alert(parseApiError(error, "Terjadi kesalahan saat menyimpan data."));
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/pengurus')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <Text.H1>
                        {isEditing ? 'Ubah Jabatan Pengurus' : 'Tambah Jabatan Kepengurusan'}
                    </Text.H1>
                    <Text.Body className="mt-1">
                        Ditetapkan Untuk Scope: <Text.Body component="span" className="!font-semibold !text-brand-600">{currentScope}</Text.Body>
                    </Text.Body>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">

                        <div>
                            <Text.Label className="mb-1 !text-slate-700">
                                Pilih Warga (Pejabat) <span className="text-red-500">*</span>
                            </Text.Label>
                            <select
                                {...register('warga_id', { required: 'Warga wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.warga_id ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="">-- Pilih Warga --</option>
                                {wargaList.map(w => (
                                    <option key={w.id} value={w.id}>{w.nama.toUpperCase()} ({w.nik})</option>
                                ))}
                            </select>
                            {errors.warga_id && <Text.Caption className="!text-red-500 !mt-1">{errors.warga_id.message}</Text.Caption>}
                            {wargaList.length === 0 && (
                                <Text.Caption className="!text-amber-600 !mt-2 !italic">Belum Ada Data Warga Di Scope {currentScope}. Silakan Tambahkan Warga Terlebih Dahulu.</Text.Caption>
                            )}
                        </div>

                        <div>
                            <Text.Label className="mb-1 !text-slate-700">
                                Nama Jabatan <span className="text-red-500">*</span>
                            </Text.Label>
                            <select
                                {...register('jabatan', { required: 'Jabatan wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.jabatan ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="">-- Pilih Jabatan --</option>
                                {jabatanOptions.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {errors.jabatan && <Text.Caption className="!text-red-500 !mt-1">{errors.jabatan.message}</Text.Caption>}
                            {jabatanOptions.length === 0 && (
                                <div className="mt-2 p-4 bg-brand-50 border border-brand-200 rounded-xl text-brand-800 text-xs flex flex-col gap-3 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 bg-brand-600 rounded text-white"><FloppyDisk size={12} weight="bold" /></div>
                                        <p className="font-bold tracking-normal text-[10px]">Data Jabatan Belum Diatur</p>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">System mendeteksi belum ada daftar jabatan dan periode yang diatur untuk <span className="font-bold">{currentScope}</span> ini.</p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleQuickSetup}
                                            className="px-3 py-1.5 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-all text-[10px] tracking-normal shadow-sm active-press"
                                        >
                                            🚀 Jalankan Pengaturan Cepat
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => navigate('/pengaturan')}
                                            className="px-3 py-1.5 bg-white border border-brand-200 text-brand-700 rounded-lg font-bold hover:bg-brand-50 transition-all text-[10px] tracking-normal"
                                        >
                                            ⚙️ Atur Manual
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <Text.Label className="mb-1 !text-slate-700">
                                Periode Menjabat <span className="text-red-500">*</span>
                            </Text.Label>
                            <select
                                {...register('periode', { required: 'Periode wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.periode ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="">-- Pilih Periode --</option>
                                {periodeOptions.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                            {errors.periode && <Text.Caption className="!text-red-500 !mt-1">{errors.periode.message}</Text.Caption>}
                        </div>

                        <div>
                            <Text.Label className="mb-1 !text-slate-700">
                                Status Jabatan <span className="text-red-500">*</span>
                            </Text.Label>
                            <select
                                {...register('status', { required: 'Status wajib dipilih' })}
                                className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.status ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                            >
                                <option value="aktif">Aktif (Saat Ini Menjabat)</option>
                                <option value="tidak aktif">Tidak Aktif (Mantan / Riwayat)</option>
                            </select>
                            {errors.status && <Text.Caption className="!text-red-500 !mt-1">{errors.status.message}</Text.Caption>}
                        </div>

                        {/* Keep consistency but hide second prompt if first one handles both */}
                        {periodeOptions.length === 0 && jabatanOptions.length > 0 && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs flex flex-col gap-1">
                                <Text.Label className="!text-amber-800 !normal-case !tracking-normal !font-black !text-[10px]">Data Periode Kosong!</Text.Label>
                                <Text.Caption className="!text-amber-700">Opsi periode belum diatur di Pengaturan Sistem.</Text.Caption>
                                <button
                                    type="button"
                                    onClick={() => navigate('/pengaturan')}
                                    className="mt-1 font-bold underline hover:text-amber-900 w-fit"
                                >
                                    <Text.Label className="!text-inherit !normal-case !tracking-normal">Atur Di Pengaturan &rarr;</Text.Label>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/pengurus')}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            <Text.Label className="!text-slate-600">Batal</Text.Label>
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 font-medium hover-lift active-press shadow-sm hover:shadow-md transition-all"
                        >
                            <FloppyDisk weight="bold" />
                            <Text.Label className="!text-white">Simpan Jabatan</Text.Label>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
