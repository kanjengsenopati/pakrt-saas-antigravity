import { useRef, useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import SignatureCanvas from 'react-signature-canvas';
import api from '../../services/api';

import { useTenant } from '../../contexts/TenantContext';
import { pengaturanService } from '../../services/pengaturanService';
import { pengurusService } from '../../services/pengurusService';
import { FileText, Money, ShieldCheck, Printer, CheckCircle, FloppyDisk } from '@phosphor-icons/react';
import { HasPermission } from '../../components/auth/HasPermission';
import { Text } from '../../components/ui/Typography';
import { PengaturanFormData, JenisPemasukan } from './types';

// Subcomponents
import PengaturanProfil from './components/PengaturanProfil';
import PengaturanKeuangan from './components/PengaturanKeuangan';
import PengaturanSurat from './components/PengaturanSurat';
import PengaturanUser from './components/PengaturanUser';

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

    // Keuangan Categories State
    const [pemasukanCategories, setPemasukanCategories] = useState<string[]>([]);
    const [pengeluaranCategories, setPengeluaranCategories] = useState<string[]>([]);
    const [tahunIuran, setTahunIuran] = useState<number[]>([]);
    const [newPemasukan, setNewPemasukan] = useState('');
    const [newPemasukanNominal, setNewPemasukanNominal] = useState(0);
    const [newPemasukanType, setNewPemasukanType] = useState<'BULANAN' | 'INSIDENTIL'>('BULANAN');
    const [newPemasukanMandatory, setNewPemasukanMandatory] = useState(true);
    const [jenisPemasukan, setJenisPemasukan] = useState<JenisPemasukan[]>([]);
    
    const [newPengeluaran, setNewPengeluaran] = useState('');
    const [newTahun, setNewTahun] = useState('');

    const [jabatanOptions, setJabatanOptions] = useState<string[]>([]);
    const [periodeOptions, setPeriodeOptions] = useState<string[]>([]);
    const [newJabatan, setNewJabatan] = useState('');
    const [newPeriode, setNewPeriode] = useState('');
    const [allPengurus, setAllPengurus] = useState<any[]>([]);
    const [jabatanSaving, setJabatanSaving] = useState(false);
    const [periodeSaving, setPeriodeSaving] = useState(false);

    const methods = useForm<PengaturanFormData>();
    const { handleSubmit, reset, setValue, watch } = methods;

    useEffect(() => {
        if (currentTenant) {
            pengaturanService.getAll(currentTenant.id, currentScope).then(items => {
                const config: Record<string, any> = {};
                items.forEach(item => { config[item.key] = item.value; });

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

                if (!config.nama_wilayah) {
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

                if (config.ttd_image) setTtdPreview(config.ttd_image);
                if (config.ttd_stempel) setStempelPreview(config.ttd_stempel);
                if (config.logo_kop) setLogoPreview(config.logo_kop);

                try {
                    const parsedJenis = config.jenis_pemasukan ? JSON.parse(config.jenis_pemasukan) : [];
                    setJenisPemasukan(Array.isArray(parsedJenis) ? parsedJenis : []);
                    setPemasukanCategories(config.kategori_pemasukan ? JSON.parse(config.kategori_pemasukan) : []);
                    setPengeluaranCategories(config.kategori_pengeluaran ? JSON.parse(config.kategori_pengeluaran) : []);
                    setTahunIuran(config.opsi_tahun_iuran ? JSON.parse(config.opsi_tahun_iuran) : []);
                    setJabatanOptions(config.jabatan_pengurus ? JSON.parse(config.jabatan_pengurus) : []);
                    setPeriodeOptions(config.periode_pengurus ? JSON.parse(config.periode_pengurus) : []);
                } catch {
                    setJenisPemasukan([]);
                    setPemasukanCategories([]);
                    setPengeluaranCategories([]);
                    setTahunIuran([]);
                    setJabatanOptions([]);
                    setPeriodeOptions([]);
                }
            });

            loadPengurus();
        }
    }, [currentTenant, currentScope, reset]);

    const loadPengurus = async () => {
        if (currentTenant) {
            const data = await pengurusService.getAll(currentTenant.id, currentScope);
            setAllPengurus(data);
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
        const idParts = currentTenant.id.split('.');
        const rtFromId = idParts.length >= 6 ? parseInt(idParts[5], 10).toString() : '';
        const rwFromId = idParts.length >= 5 ? parseInt(idParts[4], 10).toString() : '';

        const rt = config.rt || rtFromId || '?';
        const rw = config.rw || rwFromId || '?';
        const kelurahan = config.kelurahan || '';
        const kecamatan = config.kecamatan || '';
        const kota = config.kota || '';

        const namaWilayah = `${currentScope} ${rt} / RW ${rw}`;
        setValue('nama_wilayah', namaWilayah);

        const alamatParts = [
            kelurahan ? `Kelurahan ${kelurahan}` : null,
            kecamatan ? `Kecamatan ${kecamatan}` : null,
            kota ? `Kota ${kota}` : null,
        ].filter(Boolean);
        const alamat = alamatParts.length > 0 ? alamatParts.join(', ') : 'Kelurahan ..., Kecamatan ..., Kota ...';
        setValue('alamat_sekretariat', alamat);

        if (!watch('pesan_sambutan')) {
            setValue('pesan_sambutan', `Selamat Datang di Portal Warga ${namaWilayah}`);
        }
    };

    const handleSyncOfficialSignatory = () => {
        const ketua = allPengurus.find(p => p.jabatan?.toLowerCase().includes('ketua') && p.jabatan?.toLowerCase().includes(currentScope.toLowerCase()));
        if (ketua && ketua.warga) {
            setValue('penandatangan_nama', ketua.warga.nama);
            setValue('penandatangan_jabatan', ketua.jabatan);
        } else {
            alert(`Data Ketua ${currentScope} tidak ditemukan di daftar Pengurus.`);
        }
    };

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

            if (ttdPreview && ttdPreview.startsWith('data:')) {
                const blob = await (await fetch(ttdPreview)).blob();
                const file = new File([blob], `signature-${currentTenant.id}.png`, { type: 'image/png' });
                const formData = new FormData();
                formData.append('file', file);

                const response = await api.post(`/upload`, formData);
                finalTtdUrl = response.data.url;
                setTtdPreview(finalTtdUrl);
            }

            const finalData = {
                ...data,
                ttd_image: finalTtdUrl || '',
                ttd_stempel: stempelPreview || '',
                logo_kop: logoPreview || '',
                jenis_pemasukan: JSON.stringify(jenisPemasukan),
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
            const newItem: JenisPemasukan = {
                id: crypto.randomUUID(),
                nama: newPemasukan.trim(),
                tipe: newPemasukanType,
                nominal: newPemasukanNominal,
                is_mandatory: newPemasukanMandatory
            };
            setJenisPemasukan([...jenisPemasukan, newItem]);
            if (!pemasukanCategories.includes(newPemasukan.trim())) {
                setPemasukanCategories([...pemasukanCategories, newPemasukan.trim()]);
            }
            setNewPemasukan('');
            setNewPemasukanNominal(0);
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

    const removeCategory = (type: 'masuk' | 'keluar' | 'tahun' | 'jabatan' | 'periode', catOrId: string | number) => {
        if (type === 'masuk') {
            const itemToRemove = jenisPemasukan.find(j => j.id === catOrId);
            setJenisPemasukan(jenisPemasukan.filter(j => j.id !== catOrId));
            if (itemToRemove) {
                setPemasukanCategories(pemasukanCategories.filter(c => c !== itemToRemove.nama));
            }
        } else if (type === 'keluar') {
            setPengeluaranCategories(pengeluaranCategories.filter(c => c !== catOrId as string));
        } else if (type === 'tahun') {
            setTahunIuran(tahunIuran.filter(y => y !== catOrId as number));
        } else if (type === 'jabatan') {
            const inUse = (allPengurus || []).filter(p => p.jabatan === catOrId && p.status === 'aktif');
            if (inUse.length > 0) {
                const names = inUse.map(p => p.warga?.nama || 'Unknown').join(', ');
                const confirm = window.confirm(
                    `Jabatan "${catOrId}" masih digunakan oleh ${inUse.length} pengurus aktif (${names}).\n\nHapus jabatan ini dari daftar pengaturan? Data pengurus yang ada tidak akan dihapus, namun jabatan tersebut tidak akan muncul di pilihan baru.`
                );
                if (!confirm) return;
            }
            const updated = (jabatanOptions || []).filter(j => j !== catOrId as string);
            setJabatanOptions(updated);
            persistJabatan(updated);
        } else if (type === 'periode') {
            const inUse = (allPengurus || []).filter(p => p.periode === catOrId);
            if (inUse.length > 0) {
                const confirm = window.confirm(
                    `Periode "${catOrId}" masih memiliki ${inUse.length} data pengurus (termasuk riwayat).\n\nHapus periode ini dari daftar pengaturan? Data pengurus yang ada tidak akan dihapus, namun periode tersebut tidak akan muncul di pilihan baru.`
                );
                if (!confirm) return;
            }
            const updated = (periodeOptions || []).filter(p => p !== catOrId as string);
            setPeriodeOptions(updated);
            persistPeriode(updated);
        }
    };

    const handleSignatureEnd = async () => {
        if (sigPad.current) {
            const dataUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
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
                const response = await api.post(`/upload`, formData);
                setStempelPreview(response.data.url);
            } catch (err) {
                console.error("Gagal upload stempel:", err);
                alert("Gagal mengunggah stempel. Silakan coba lagi.");
            } finally {
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
                const response = await api.post(`/upload`, formData);
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
                    <Text.H1>Pengaturan Sistem</Text.H1>
                    <Text.Body className="!text-[12px] mt-1 !font-medium flex items-center gap-1.5 tracking-normal">
                        Konfigurasi khusus untuk scope <Text.Label component="span" className="!bg-brand-50 !px-2 !py-0.5 !rounded-lg !border !border-brand-100 !text-brand-600 !normal-case !tracking-normal">{currentScope}</Text.Label>
                    </Text.Body>
                </div>
                <div className="px-4 py-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100 tracking-normal shadow-sm">
                    {currentScope} Active
                </div>
            </div>

            <div className="max-w-2xl mx-auto w-full mb-6">
                <div className="flex bg-slate-100 p-1.5 rounded-[24px] border border-gray-200/50 gap-1 relative overflow-hidden shadow-inner">
                    <button
                        onClick={() => setActiveTab('profil')}
                        className={`flex-1 flex justify-center items-center py-3.5 px-2 rounded-[20px] transition-all duration-300 ${activeTab === 'profil' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200/50'}`}
                        title="Profil & Tema"
                    >
                        <FileText weight={activeTab === 'profil' ? 'fill' : 'duotone'} className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('keuangan')}
                        className={`flex-1 flex justify-center items-center py-3.5 px-2 rounded-[20px] transition-all duration-300 ${activeTab === 'keuangan' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200/50'}`}
                        title={`Keuangan ${currentScope}`}
                    >
                        <Money weight={activeTab === 'keuangan' ? 'fill' : 'duotone'} className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`flex-1 flex justify-center items-center py-3.5 px-2 rounded-[20px] transition-all duration-300 ${activeTab === 'user' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200/50'}`}
                        title="User & Hak Akses"
                    >
                        <ShieldCheck weight={activeTab === 'user' ? 'fill' : 'duotone'} className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setActiveTab('surat')}
                        className={`flex-1 flex justify-center items-center py-3.5 px-2 rounded-[20px] transition-all duration-300 ${activeTab === 'surat' ? 'bg-white text-brand-700 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-200/50'}`}
                        title="Surat & Cetak"
                    >
                        <Printer weight={activeTab === 'surat' ? 'fill' : 'duotone'} className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {(activeTab === 'profil' || activeTab === 'keuangan' || activeTab === 'surat') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)}>

                            {activeTab === 'profil' && (
                                <PengaturanProfil 
                                    currentScope={currentScope}
                                    handleSyncProfile={handleSyncProfile}
                                    jabatanOptions={jabatanOptions}
                                    periodeOptions={periodeOptions}
                                    allPengurus={allPengurus}
                                    newJabatan={newJabatan}
                                    setNewJabatan={setNewJabatan}
                                    newPeriode={newPeriode}
                                    setNewPeriode={setNewPeriode}
                                    addCategory={addCategory}
                                    removeCategory={removeCategory}
                                    jabatanSaving={jabatanSaving}
                                    periodeSaving={periodeSaving}
                                />
                            )}

                            {activeTab === 'keuangan' && (
                                <PengaturanKeuangan 
                                    newPemasukan={newPemasukan}
                                    setNewPemasukan={setNewPemasukan}
                                    newPemasukanType={newPemasukanType}
                                    setNewPemasukanType={setNewPemasukanType}
                                    newPemasukanNominal={newPemasukanNominal}
                                    setNewPemasukanNominal={setNewPemasukanNominal}
                                    newPemasukanMandatory={newPemasukanMandatory}
                                    setNewPemasukanMandatory={setNewPemasukanMandatory}
                                    jenisPemasukan={jenisPemasukan}
                                    newPengeluaran={newPengeluaran}
                                    setNewPengeluaran={setNewPengeluaran}
                                    pengeluaranCategories={pengeluaranCategories}
                                    newTahun={newTahun}
                                    setNewTahun={setNewTahun}
                                    tahunIuran={tahunIuran}
                                    addCategory={addCategory}
                                    removeCategory={removeCategory}
                                />
                            )}

                            {activeTab === 'surat' && (
                                <PengaturanSurat 
                                    currentScope={currentScope}
                                    handleSyncOfficialKop={handleSyncOfficialKop}
                                    handleLogoUpload={handleLogoUpload}
                                    logoPreview={logoPreview}
                                    setLogoPreview={setLogoPreview}
                                    handleSyncOfficialSignatory={handleSyncOfficialSignatory}
                                    clearSignature={clearSignature}
                                    sigPad={sigPad}
                                    handleSignatureEnd={handleSignatureEnd}
                                    ttdPreview={ttdPreview}
                                    handleStempelUpload={handleStempelUpload}
                                    stempelPreview={stempelPreview}
                                    handleRemoveStempel={handleRemoveStempel}
                                    isSaving={isSaving}
                                    isUploading={isUploading}
                                />
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
                                        <button type="submit" disabled={isSaving || isUploading} className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center gap-2 font-bold shadow-md shadow-brand-200 hover-lift active-press transition-all disabled:opacity-70">
                                            <FloppyDisk weight="bold" />
                                            <Text.Label className="!normal-case !tracking-normal">{isSaving ? 'Menyimpan...' : isUploading ? 'Mengunggah...' : `Simpan ${currentScope}`}</Text.Label>
                                        </button>
                                    </HasPermission>
                                </div>
                            )}

                        </form>
                    </FormProvider>
                </div>
            )}

            {activeTab === 'user' && <PengaturanUser />}
        </div>
    );
}
