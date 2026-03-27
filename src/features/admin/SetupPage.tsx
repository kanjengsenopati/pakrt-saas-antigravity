import { useState } from 'react';
import { locationService } from '../../services/locationService';
import { wargaService } from '../../services/wargaService';
import { pengurusService } from '../../services/pengurusService';
import { Database, CheckCircle, Warning, Info, MapPin, Users, ShieldCheck, ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Aset } from '../../database/db';

const SEED_DATA = [
    { id: '33', parent_id: null, name: 'Jawa Tengah', level: 'provinsi' },
    { id: '31', parent_id: null, name: 'DKI Jakarta', level: 'provinsi' },
    { id: '74', parent_id: '33', name: 'Kota Semarang', level: 'kabkota' },
    { id: '71', parent_id: '31', name: 'Jakarta Selatan', level: 'kabkota' },
    { id: '10', parent_id: '74', name: 'Tembalang', level: 'kecamatan' },
    { id: '20', parent_id: '71', name: 'Cilandak', level: 'kecamatan' },
    { id: '1011', parent_id: '10', name: 'Sendangmulyo', level: 'keldesa' },
    { id: '2011', parent_id: '20', name: 'Cilandak Barat', level: 'keldesa' },
];

export default function SetupPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // New state for general loading
    const navigate = useNavigate();

    // Placeholder for currentTenant and currentScope. In a real app, these would come from context or props.
    // For the purpose of making the provided diff syntactically correct, we'll mock them.
    const currentTenant = { id: '33.74.10.1011.100.100' };
    const currentScope: "RT" | "PKK" | "Dasa Wisma" = 'RT';

    const handleSeedLocations = async () => { // Renamed from handleSeed
        setStatus('loading');
        setLoading(true); // Also set general loading
        try {
            await locationService.seedLocations(SEED_DATA as any);
            setStatus('success');
            setMessage('Database wilayah berhasil diinisialisasi.');
        } catch (err) {
            setStatus('error');
            setMessage('Gagal melakukan seeding: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleSeedSampleData = async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const tenantId = currentTenant.id;

            // Seed Warga (Sample from seed.ts) - with existence check
            const wargas = [
                {
                    nama: 'SISWANTO',
                    nik: '3374101011100001',
                    kontak: '081234567890',
                    alamat: 'BLOK N10/9',
                    tempat_lahir: 'Semarang',
                    tanggal_lahir: '15-05-1980',
                    pendidikan: 'S1',
                    pekerjaan: 'DOSEN',
                    jenis_kelamin: 'Laki-laki' as const,
                    agama: 'Islam',
                    status_penduduk: 'Tetap' as const,
                    status_rumah: 'Dihuni' as const,
                    tenant_id: tenantId,
                    scope: currentScope
                },
                {
                    nama: 'EKO WIDIYANTO',
                    nik: '3374101011100004',
                    kontak: '081234567893',
                    alamat: 'BLOK N10/5',
                    tempat_lahir: 'Semarang',
                    tanggal_lahir: '25-02-1990',
                    pendidikan: 'S1',
                    pekerjaan: 'PNS',
                    jenis_kelamin: 'Laki-laki' as const,
                    agama: 'Islam',
                    status_penduduk: 'Tetap' as const,
                    status_rumah: 'Dihuni' as const,
                    tenant_id: tenantId,
                    scope: currentScope
                }
            ];

            const wargaData = await wargaService.getAll(tenantId, currentScope);
            const existingWarga = wargaData.items || [];
            for (const warga of wargas) {
                if (!existingWarga.find(w => w.nik === warga.nik)) {
                    await wargaService.create(warga);
                }
            }

            // Refresh warga list for subsequent steps
            const allWargaData = await wargaService.getAll(tenantId, currentScope);
            const allWarga = allWargaData.items || [];
            const eko = allWarga.find(w => w.nik === '3374101011100004');
            const siswanto = allWarga.find(w => w.nik === '3374101011100001');

            // Seed Pengurus (Check before create)
            if (eko) {
                const existingPengurus = await pengurusService.getAll(tenantId, currentScope);
                if (!existingPengurus.find((p: any) => p.warga_id === eko.id && p.jabatan === 'Ketua RT')) {
                    await pengurusService.create({
                        tenant_id: tenantId,
                        scope: currentScope,
                        warga_id: eko.id,
                        jabatan: 'Ketua RT',
                        periode: '2024-2027',
                        status: 'aktif'
                    });
                }
            }

            // Seed Aset
            const { asetService } = await import('../../services/asetService');
            const existingAsets = await asetService.getAll(tenantId, currentScope);
            const asets: Array<Omit<Aset, 'id'>> = [
                { nama_barang: 'Tenda Sarnafil 3x3', jumlah: 2, kondisi: 'baik', status_pinjam: 'tersedia', tenant_id: tenantId, scope: currentScope },
                { nama_barang: 'Kursi Lipat Chitose', jumlah: 50, kondisi: 'baik', status_pinjam: 'tersedia', tenant_id: tenantId, scope: currentScope },
                { nama_barang: 'Sound System Portable', jumlah: 1, kondisi: 'rusak_ringan', status_pinjam: 'tersedia', tenant_id: tenantId, scope: currentScope },
            ];
            for (const aset of asets) {
                if (!existingAsets.find(a => a.nama_barang === aset.nama_barang)) {
                    await asetService.create(aset);
                }
            }

            // Seed Keuangan
            const { keuanganService } = await import('../../services/keuanganService');
            const keuanganData = await keuanganService.getAll(tenantId, currentScope);
            const existingTrx = keuanganData.items || [];
            if (existingTrx.length < 2) {
                await keuanganService.create({
                    tenant_id: tenantId,
                    scope: currentScope,
                    tipe: 'pemasukan',
                    kategori: 'Iuran Warga',
                    nominal: 1250000,
                    tanggal: new Date().toISOString().split('T')[0],
                    keterangan: 'Penerimaan iuran bulanan warga blok N10'
                });
                await keuanganService.create({
                    tenant_id: tenantId,
                    scope: currentScope,
                    tipe: 'pengeluaran',
                    kategori: 'Listrik & Air',
                    nominal: 350000,
                    tanggal: new Date().toISOString().split('T')[0],
                    keterangan: 'Pembayaran listrik pos ronda dan balai warga'
                });
            }

            // Seed Agenda
            const { agendaService } = await import('../../services/agendaService');
            const existingAgendas = await agendaService.getAll(tenantId, currentScope);
            if (existingAgendas.length < 2) {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);

                await agendaService.create({
                    tenant_id: tenantId,
                    scope: currentScope,
                    judul: 'Kerja Bakti Massal',
                    tanggal: nextWeek.toISOString().split('T')[0],
                    deskripsi: 'Pembersihan selokan dan perapihan taman warga menjelang Ramadhan.',
                    butuh_pendanaan: true,
                    nominal_biaya: 250000,
                    sumber_dana: 'Kas',
                    peserta_ids: siswanto ? [siswanto.id] : [],
                    is_semua_warga: true,
                    is_terlaksana: false,
                    foto_dokumentasi: []
                });
            }

            // Seed Jadwal Ronda
            const { rondaService } = await import('../../services/rondaService');
            const existingRonda = await rondaService.getAll(tenantId, currentScope);
            if (existingRonda.length === 0 && siswanto && eko) {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 2);
                await rondaService.create({
                    tenant_id: tenantId,
                    scope: currentScope,
                    tanggal: nextWeek.toISOString().split('T')[0],
                    regu: 'Rajawali',
                    warga_ids: [siswanto.id, eko.id],
                    petugas_konsumsi: [eko.id],
                    kehadiran_warga: []
                });
            }

            // Seed Surat Pengantar
            const { suratService } = await import('../../services/suratService');
            const existingSurat = await suratService.getAll(tenantId, currentScope);
            if (existingSurat.length === 0 && eko) {
                await suratService.create({
                    tenant_id: tenantId,
                    scope: currentScope,
                    warga_id: eko.id,
                    jenis_surat: 'Keterangan Domisili',
                    keperluan: 'Pendaftaran sekolah anak',
                    tanggal: new Date().toISOString().split('T')[0],
                    status: 'proses'
                });
            }

            // Seed Iuran
            const { iuranService } = await import('../../services/iuranService');
            const iuranData = await iuranService.getAll(tenantId);
            const existingIuran = iuranData.items || [];
            if (existingIuran.length === 0 && siswanto) {
                await iuranService.create({
                    tenant_id: tenantId,
                    warga_id: siswanto.id,
                    kategori: 'Iuran Wajib Bulanan',
                    periode_bulan: [new Date().getMonth() + 1],
                    periode_tahun: new Date().getFullYear(),
                    nominal: 150000,
                    tanggal_bayar: new Date().toISOString().split('T')[0],
                    status: 'VERIFIED',
                    scope: currentScope
                }, currentScope);
            }

            // Seed Notulensi
            const { notulensiService } = await import('../../services/notulensiService');
            const existingNotulensi = await notulensiService.getAll(tenantId, currentScope);
            if (existingNotulensi.length === 0 && siswanto) {
                await notulensiService.create({
                    tenant_id: tenantId,
                    scope: currentScope,
                    judul: 'Rapat Persiapan 17 Agustus',
                    tanggal: new Date().toISOString().split('T')[0],
                    tuan_rumah_id: siswanto.id,
                    lokasi: 'Balai Warga',
                    url_foto: '',
                    konten: 'Pembentukan panitia 17an dan iuran sukarela.'
                }, []);
            }

            alert('Sample data seeded/updated for all modules successfully!');
        } catch (error) {
            console.error('Seeding error:', error);
            alert('Failed to seed sample data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 text-center border-b border-slate-50">
                    <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Database size={32} weight="duotone" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">System Setup</h1>
                    <p className="text-slate-500 mt-2">Inisialisasi basis data dan konfigurasi sistem PAKRT.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg text-blue-700">
                        <Info className="w-6 h-6 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Inisialisasi Sistem</p>
                            <p className="text-sm opacity-90">Gunakan tombol di bawah untuk menyiapkan data awal sistem Pak RT Anda.</p>
                        </div>
                    </div>

                    {status === 'success' && (
                        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3 animate-fade-in">
                            <CheckCircle className="text-emerald-500 flex-shrink-0 mt-1" size={20} />
                            <p className="text-sm text-emerald-700 leading-relaxed font-medium">{message}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 animate-shake">
                            <Warning className="text-red-500 flex-shrink-0 mt-1" size={20} />
                            <p className="text-sm text-red-700 leading-relaxed font-medium">{message}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-xl p-5 hover:border-brand-300 transition-colors group">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin className="w-8 h-8 text-brand-600 bg-brand-50 p-1.5 rounded-lg" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Data Wilayah</h3>
                                    <p className="text-xs text-gray-500 italic">Provinsi, Kota, Kecamatan, Kelurahan</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-6">
                                Impor data referensi wilayah administratif Indonesia untuk mempermudah pengisian alamat warga.
                            </p>
                            <button
                                onClick={handleSeedLocations}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-brand-200 disabled:opacity-50"
                            >
                                <MapPin weight="bold" className="w-5 h-5" />
                                {loading ? 'Memproses...' : 'Seed Data Wilayah'}
                            </button>
                        </div>

                        <div className="border rounded-xl p-5 hover:border-brand-300 transition-colors group">
                            <div className="flex items-center gap-3 mb-4">
                                <Users className="w-8 h-8 text-orange-600 bg-orange-50 p-1.5 rounded-lg" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Sample Data</h3>
                                    <p className="text-xs text-gray-500 italic">Warga & Pengurus Contoh</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-6">
                                Gunakan data contoh untuk mencoba fitur-fitur Pak RT dengan cepat tanpa input manual.
                            </p>
                            <button
                                onClick={handleSeedSampleData}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-orange-50 text-orange-600 border-2 border-orange-200 hover:border-orange-600 font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                            >
                                <ShieldCheck weight="bold" className="w-5 h-5" />
                                {loading ? 'Memproses...' : 'Seed Sample Data'}
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 text-slate-600 font-medium hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={18} /> Kembali ke Landing Page
                    </button>
                </div>
            </div>
            <p className="mt-8 text-slate-400 text-xs text-center max-w-sm">
                Halaman ini hanya untuk administrator. Pastikan Anda memiliki izin sebelum melakukan perubahan data sistem.
            </p>
        </div>
    );
}
