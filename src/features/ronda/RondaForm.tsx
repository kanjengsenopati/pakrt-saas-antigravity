import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { rondaService } from '../../services/rondaService';
import { wargaService } from '../../services/wargaService';
import { JadwalRonda, Warga } from '../../database/db';
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react';
import { dateUtils } from '../../utils/date';

type RondaFormData = Omit<JadwalRonda, 'id' | 'tenant_id'>;

export default function RondaForm() {
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);
    const navigate = useNavigate();
    const { currentTenant, currentScope } = useTenant();

    const [mode, setMode] = useState<'manual' | 'rutin'>('manual');
    const [hariRutin, setHariRutin] = useState<number>(6); // Default: Sabtu (6)
    const [wargaList, setWargaList] = useState<Warga[]>([]);

    // Multi-step State
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [generatedDatesList, setGeneratedDatesList] = useState<string[]>([]);
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());
    const [assignedWargaIds, setAssignedWargaIds] = useState<Set<string>>(new Set());

    const { register, handleSubmit, reset, setValue, watch, trigger, formState: { errors } } = useForm<RondaFormData>({
        defaultValues: {
            warga_ids: [],
            petugas_konsumsi: []
        }
    });

    const selectedWargaIds = watch('warga_ids') || [];
    const selectedKonsumsiIds = watch('petugas_konsumsi') || [];

    useEffect(() => {
        if (currentTenant) {
            wargaService.getAll(currentTenant.id, currentScope).then(data => setWargaList(data.items || []));
            // Fetch all existing ronda schedules to know which dates AND warga are already taken
            rondaService.getAll(currentTenant.id, currentScope).then(existingRondas => {
                const takenDates = new Set(existingRondas.map((r: JadwalRonda) => r.tanggal));
                setBookedDates(takenDates);
                const takenWarga = new Set(
                    existingRondas.flatMap((r: JadwalRonda) => r.warga_ids)
                );
                setAssignedWargaIds(takenWarga);
            });
        }
    }, [currentTenant, currentScope]);

    useEffect(() => {
        if (isEditing && id) {
            rondaService.getById(id).then(data => {
                if (data) {
                    reset({
                        tanggal: data.tanggal,
                        regu: data.regu,
                        warga_ids: data.warga_ids
                    });
                }
            });
        }
    }, [id, isEditing, reset]);

    const toggleWarga = (wargaId: string, field: 'warga_ids' | 'petugas_konsumsi') => {
        const currentSelected = watch(field) || [];
        if (Array.isArray(currentSelected) && currentSelected.includes(wargaId)) {
            setValue(field, currentSelected.filter(id => id !== wargaId), { shouldValidate: true });
        } else {
            setValue(field, [...currentSelected, wargaId], { shouldValidate: true });
        }
    };

    const generateDates = (dayOfWeek: number) => {
        const dates: string[] = [];
        const today = new Date();
        const currentDay = today.getDay();
        let diff = dayOfWeek - currentDay;
        if (diff < 0) diff += 7; // Next occurrence of the day

        const firstDate = new Date(today);
        firstDate.setDate(today.getDate() + diff);

        for (let i = 0; i < 52; i++) { // 52 weeks = 1 year
            const d = new Date(firstDate);
            d.setDate(firstDate.getDate() + (i * 7));
            dates.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
        }
        setGeneratedDatesList(dates);
        setSelectedDates([]); // Default uncheck all
    };

    // Auto-generate when day changes for Rutin mode
    useEffect(() => {
        if (!isEditing && mode === 'rutin') {
            generateDates(hariRutin);
        }
    }, [hariRutin, mode, isEditing]);

    const handleNextStep = async () => {
        const isValid = await trigger(['regu']);
        if (isValid && selectedWargaIds.length > 0) {
            setCurrentStep(2);
        } else if (selectedWargaIds.length === 0) {
            alert("Pilih minimal satu warga untuk petugas ronda utama.");
        }
    };

    const toggleDateSelection = (date: string) => {
        // Don't allow toggling dates that are already booked by other groups
        if (bookedDates.has(date)) return;
        if (Array.isArray(selectedDates) && selectedDates.includes(date)) {
            setSelectedDates(selectedDates.filter(d => d !== date));
        } else {
            setSelectedDates([...selectedDates, date]);
        }
    };

    const groupDatesByMonth = (dates: string[]) => {
        return dates.reduce((acc, dateStr) => {
            const dateDisplay = dateUtils.toDisplay(dateStr);
            const [, m, y] = dateDisplay.split('-');
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const monthYear = `${monthNames[parseInt(m) - 1]} ${y}`;
            if (!acc[monthYear]) acc[monthYear] = [];
            acc[monthYear].push(dateStr);
            return acc;
        }, {} as Record<string, string[]>);
    };

    const onSubmit = async (data: RondaFormData) => {
        if (!currentTenant) return;

        if (data.warga_ids.length === 0) {
            alert("Pilih minimal satu warga untuk petugas ronda");
            return;
        }

        try {
            if (isEditing && id) {
                await rondaService.update(id, data);
            } else {
                if (mode === 'manual') {
                    if (!data.tanggal) { alert("Tanggal wajib diisi"); return; }
                    await rondaService.create({
                        ...data,
                        tenant_id: currentTenant.id,
                        scope: currentScope
                    });
                } else {
                    if (selectedDates.length === 0) {
                        alert("Pilih minimal satu tanggal jadwal ronda rutin.");
                        return;
                    }

                    // Sort dates to ensure chronological rotation
                    const sortedDates = [...selectedDates].sort();
                    const snackPool = data.petugas_konsumsi || [];

                    const recordsToInsert = sortedDates.map((tgl, index) => {
                        // Rotate through snack pool if available
                        const assignedSnack = snackPool.length > 0
                            ? [snackPool[index % snackPool.length]]
                            : [];

                        return {
                            tanggal: tgl,
                            regu: data.regu,
                            warga_ids: data.warga_ids,
                            petugas_konsumsi: assignedSnack,
                            tenant_id: currentTenant.id,
                            scope: currentScope
                        };
                    });
                    await rondaService.createMany(recordsToInsert as any);
                }
            }
            navigate('/ronda');
        } catch (error) {
            console.error("Gagal menyimpan jadwal ronda:", error);
            alert("Terjadi kesalahan saat menyimpan jadwal siskamling.");
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/ronda')}
                    className="p-2 hover:bg-white bg-transparent text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft weight="bold" className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Ubah Jadwal Ronda' : 'Buat Jadwal Ronda Baru'}
                    </h1>
                    <p className="text-gray-500 mt-1">Mengatur petugas siskamling lingkungan</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                {/* STEP INDICATOR */}
                <div className="flex items-center justify-center mb-8">
                    <div className="flex items-center w-full max-w-sm">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${currentStep >= 1 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                        <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 2 ? 'bg-brand-600' : 'bg-gray-200'}`}></div>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${currentStep >= 2 ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {currentStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Regu / Kelompok <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('regu', { required: 'Nama Regu wajib diisi' })}
                                    className={`w-full rounded-lg shadow-sm p-3 border focus:ring-2 focus:ring-brand-500 outline-none transition-colors ${errors.regu ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white'}`}
                                    placeholder="Contoh: Regu A, Kelompok 1, dsb"
                                />
                                {errors.regu && <p className="text-red-500 text-xs mt-1">{errors.regu.message}</p>}
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-3 border-b pb-2">
                                    Pilih Warga Petugas Piket ({selectedWargaIds.length} terpilih) <span className="text-red-500">*</span>
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                                    {wargaList.map(warga => {
                                        const isSelected = selectedWargaIds.includes(warga.id);
                                        const isAssigned = !isEditing && assignedWargaIds.has(warga.id);
                                        return (
                                            <div
                                                key={`utama-${warga.id}`}
                                                onClick={() => !isAssigned && toggleWarga(warga.id, 'warga_ids')}
                                                title={isAssigned ? 'Warga ini sudah terdaftar di regu lain' : ''}
                                                className={`p-3 rounded-lg border transition-all flex items-start gap-3 ${isAssigned
                                                    ? 'border-orange-200 bg-orange-50 cursor-not-allowed opacity-70'
                                                    : isSelected
                                                        ? 'border-brand-500 bg-brand-50 shadow-sm cursor-pointer'
                                                        : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50 cursor-pointer'
                                                    }`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isAssigned
                                                    ? 'bg-orange-100 border-orange-300'
                                                    : isSelected
                                                        ? 'bg-brand-500 border-brand-500'
                                                        : 'border-gray-300 bg-white'
                                                    }`}>
                                                    {isAssigned && (
                                                        <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    {!isAssigned && isSelected && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${isAssigned ? 'text-orange-700' : isSelected ? 'text-brand-900' : 'text-gray-700'
                                                        }`}>{warga.nama}</p>
                                                    {isAssigned && (
                                                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                                                            Sudah di Regu
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {wargaList.length === 0 && (
                                    <p className="text-sm text-amber-600 bg-amber-50 p-4 rounded-lg">Belum ada data warga di sistem. Silakan tambahkan data warga terlebih dahulu.</p>
                                )}
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-medium text-gray-700 mb-3 border-b pb-2">
                                    Pilih Petugas Konsumsi / Snack <span className="text-gray-400 font-normal">(Opsional, {selectedKonsumsiIds.length} terpilih)</span>
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-1">
                                    {wargaList.map(warga => {
                                        const isSelected = selectedKonsumsiIds.includes(warga.id);
                                        return (
                                            <div
                                                key={`konsumsi-${warga.id}`}
                                                onClick={() => toggleWarga(warga.id, 'petugas_konsumsi')}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${isSelected ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'}`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'}`}>
                                                    {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${isSelected ? 'text-amber-900' : 'text-gray-700'}`}>{warga.nama}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleNextStep}
                                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                                >
                                    Lanjut Pilih Jadwal
                                </button>
                            </div>
                        </div>
                    )}


                    {currentStep === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            {!isEditing && (
                                <div className="flex gap-6 border-b border-gray-100 pb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={mode === 'manual'} onChange={() => { setMode('manual'); setGeneratedDatesList([]); setSelectedDates([]); }} className="text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                                        <span className={mode === 'manual' ? 'font-medium text-gray-900' : 'text-gray-600'}>Satu Tanggal (Manual)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" checked={mode === 'rutin'} onChange={() => setMode('rutin')} className="text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" />
                                        <span className={mode === 'rutin' ? 'font-medium text-gray-900' : 'text-gray-600'}>Rutin Mingguan (1 Tahun)</span>
                                    </label>
                                </div>
                            )}

                            {mode === 'manual' ? (
                                <div className="max-w-md">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tanggal Piket Ronda <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...register('tanggal')}
                                        required={mode === 'manual'}
                                        className="w-full rounded-lg shadow-sm p-3 border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white border focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="max-w-md">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pilih Hari Rutin <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={hariRutin}
                                            onChange={e => setHariRutin(Number(e.target.value))}
                                            className="w-full rounded-lg shadow-sm p-3 border-gray-300 focus:border-brand-500 bg-gray-50 focus:bg-white border focus:ring-2 focus:ring-brand-500 outline-none transition-colors"
                                        >
                                            <option value={0}>Minggu</option>
                                            <option value={1}>Senin</option>
                                            <option value={2}>Selasa</option>
                                            <option value={3}>Rabu</option>
                                            <option value={4}>Kamis</option>
                                            <option value={5}>Jumat</option>
                                            <option value={6}>Sabtu</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Sistem memberikan daftar tanggal di hari tersebut selama 52 minggu. Centang pada tanggal yang ingin Anda jadwalkan.
                                        </p>
                                    </div>

                                    {generatedDatesList.length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-semibold text-gray-800">Preview & Sesuaikan Tanggal ({selectedDates.length} terpilih)</h3>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                                                {Object.entries(groupDatesByMonth(generatedDatesList)).map(([monthYear, datesArray]) => (
                                                    <div key={monthYear} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                                        <p className="font-bold text-sm text-brand-700 mb-2 border-b pb-1">{monthYear}</p>
                                                        <div className="flex flex-col gap-2">
                                                            {datesArray.map(date => {
                                                                const isBooked = bookedDates.has(date);
                                                                const isSelected = selectedDates.includes(date);
                                                                return (
                                                                    <div
                                                                        key={`dt-${date}`}
                                                                        onClick={() => !isBooked && toggleDateSelection(date)}
                                                                        title={isBooked ? 'Tanggal ini sudah digunakan oleh regu lain' : ''}
                                                                        role="button"
                                                                        tabIndex={isBooked ? -1 : 0}
                                                                        onKeyDown={(e) => {
                                                                            if (!isBooked && (e.key === 'Enter' || e.key === ' ')) {
                                                                                e.preventDefault();
                                                                                toggleDateSelection(date);
                                                                            }
                                                                        }}
                                                                        className={`flex items-center justify-between p-1 rounded transition-colors group ${isBooked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50'}`}
                                                                    >
                                                                        <span className={`text-sm ${isBooked
                                                                            ? 'text-gray-400 line-through'
                                                                            : isSelected
                                                                                ? 'text-gray-900 font-medium'
                                                                                : 'text-gray-700'
                                                                            }`}>
                                                                             {dateUtils.toDisplay(date)}
                                                                        </span>
                                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isBooked
                                                                            ? 'bg-gray-100 border-gray-200'
                                                                            : isSelected
                                                                                ? 'bg-brand-500 border-brand-500'
                                                                                : 'bg-white border-gray-300 group-hover:border-brand-300'
                                                                            }`}>
                                                                            <input
                                                                                type="checkbox"
                                                                                className="sr-only"
                                                                                checked={isSelected}
                                                                                disabled={isBooked}
                                                                                readOnly
                                                                            />
                                                                            {isBooked && (
                                                                                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                </svg>
                                                                            )}
                                                                            {!isBooked && isSelected && (
                                                                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-6 border-t border-gray-100 flex justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Kembali ke Regu
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center gap-2 font-medium hover-lift active-press shadow-sm hover:shadow-md transition-all"
                                >
                                    <FloppyDisk weight="bold" />
                                    <span>{isEditing ? 'Simpan Perubahan' : 'Buat Jadwal'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
}
