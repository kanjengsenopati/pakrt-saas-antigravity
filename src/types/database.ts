export interface Tenant {
    id: string; // [Prov].[Kab].[Kec].[Kel].[RW].[RT]
    name: string;
    subdomain: string;
    config: Record<string, any>;
    location_detail?: string;
}

export interface User {
    id: string;
    tenant_id: string;
    role: 'Admin' | 'Ketua' | 'Sekretaris' | 'Bendahara' | 'Warga' | string;
    role_id?: string;
    role_entity?: any;
    name: string;
    email: string;
    scope?: string;
    kontak?: string;
    password?: string;
    permissions?: Record<string, string[]>;
    verification_status?: 'VERIFIED' | 'PENDING' | 'UNVERIFIED' | string;
}

export interface Pengaturan {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    key: string;
    value: any;
}

export interface Warga {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma';
    nik: string;
    nama: string;
    kontak: string;
    alamat: string;
    tempat_lahir?: string;
    tanggal_lahir?: string;
    pendidikan?: string;
    pekerjaan?: string;
    jenis_kelamin?: 'Laki-laki' | 'Perempuan';
    agama?: string;
    status_penduduk?: 'Tetap' | 'Kontrak';
    status_rumah?: 'Dihuni' | 'Kosong';
    url_kk?: string;
    avatar?: string;
    status_domisili?: 'Aktif' | 'Pindah' | 'Meninggal Dunia';
    alamat_pindah?: string;
    tanggal_meninggal?: string;
    lokasi_makam?: string;
    pj_tipe?: 'Warga' | 'Luar';
    pj_warga_id?: string;
    pj_nama?: string;
    pj_kontak?: string;
    // Relationships (Included by backend)
    anggota?: AnggotaKeluarga[];
}

export interface AnggotaKeluarga {
    id: string;
    tenant_id: string;
    warga_id: string; // Foreign key ke Kepala Keluarga (Warga)
    nik: string;
    nama: string;
    hubungan: 'Istri' | 'Suami' | 'Anak' | 'Orang Tua' | 'Mertua' | 'Famili Lain' | string;
    tempat_lahir?: string;
    tanggal_lahir?: string;
    pendidikan?: string;
    pekerjaan?: string;
}

export interface Pengurus {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma';
    warga_id: string;
    jabatan: string;
    periode: string;
    status: 'aktif' | 'tidak aktif';
    // Relationships
    warga?: Warga;
}

export interface Notulensi {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    judul: string;
    tanggal: string;
    tuan_rumah_id?: string;
    tuan_rumah?: string;
    lokasi?: string;
    url_foto?: string;
    konten: string;
    agenda_id?: string;
    jam_mulai?: string;
    jam_selesai?: string;
}

export interface Kehadiran {
    id: string;
    tenant_id: string;
    notulensi_id: string;
    warga_id: string;
    status: 'hadir' | 'izin' | 'sakit' | 'alfa';
    // Relationship
    warga?: Warga;
}

export interface Aset {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma';
    nama_barang: string;
    jumlah: number;
    kondisi: 'baik' | 'rusak_ringan' | 'rusak_berat';
    foto_barang?: string;
    tanggal_beli?: string;
    harga_beli?: number;
    vendor?: string;
    status_pinjam: 'tersedia' | 'dipinjam';
    peminjam_id?: string;
    petugas_id?: string;
    tanggal_pinjam?: string;
    peminjam?: Warga;
}

export interface SuratPengantar {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    warga_id: string;
    jenis_surat: string;
    keperluan: string;
    tanggal: string;
    nomor_surat?: string;
    status: 'proses' | 'selesai' | 'ditolak';
    // Relationships
    warga?: Warga;
    pemohon?: Warga;
}

export interface JadwalRonda {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    tanggal: string;
    regu: string;
    warga_ids: string[];
    petugas_konsumsi?: string[];
    kehadiran_warga?: string[];
    anggota_warga?: Warga[];
    anggota_konsumsi?: Warga[];
}

export interface Agenda {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    judul: string;
    tanggal: string;
    deskripsi: string;
    butuh_pendanaan: boolean;
    nominal_biaya?: number;
    sumber_dana?: 'Kas' | 'Iuran' | string;
    peserta_ids: string[];
    is_semua_warga: boolean;
    is_terlaksana: boolean;
    laporan_kegiatan?: string;
    foto_dokumentasi: string[];
    peserta_details?: { id: string; nama: string }[];
    jenis_kegiatan?: 'Kebersihan' | 'Sosial' | 'Kerohanian' | 'Keamanan' | 'Pembangunan' | 'Lainnya';
    perlu_rapat?: boolean;
    keterangan_tambahan?: string;
    tuan_rumah_id?: string;
    tuan_rumah?: string;
    lokasi?: string;
    jam_mulai?: string;
    jam_selesai?: string;
}

export interface Keuangan {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    tipe: 'pemasukan' | 'pengeluaran';
    kategori: string;
    nominal: number;
    tanggal: string;
    keterangan: string;
    url_bukti?: string;
}

export interface PembayaranIuran {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    warga_id: string; // Foreign key ke tabel Warga
    kategori: string; // Kategori pembayaran (dinamis dari pengaturan)
    periode_bulan: number[]; // Array of months (1-12)
    periode_tahun: number;
    nominal: number;
    tanggal_bayar: string;
    url_bukti?: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
    alasan_penolakan?: string;
    // Relationships
    warga?: Warga;
}

export interface Aktivitas {
    id: string;
    tenant_id: string;
    scope: 'RT' | 'PKK' | 'Dasa Wisma' | string;
    action: string; // e.g., 'Tambah Warga', 'Hapus Aset'
    details: string;
    timestamp: number;
}

export interface Wilayah {
    id: string; // Kode regional
    parent_id: string | null;
    name: string;
    level: 'provinsi' | 'kabkota' | 'kecamatan' | 'keldesa' | string;
}
