export type PengaturanFormData = {
    nama_wilayah: string;
    alamat_sekretariat: string;
    iuran_per_bulan: number;
    iuran_tetap_dihuni: number;
    iuran_tetap_kosong: number;
    iuran_kontrak_dihuni: number;
    iuran_kontrak_kosong: number;
    warna_tema: string;
    pesan_sambutan: string;
    denda_ronda_aktif: boolean;
    denda_ronda_nominal: number;
    // Surat & Cetak
    kop_surat: string;
    format_nomor_surat: string;
    penandatangan_nama: string;
    penandatangan_jabatan: string;
    ttd_image: string;
    ttd_stempel: string;
    logo_kop: string;
    ttd_pake_qr: boolean;
    nama_ketua_rw: string;
    // Jenis Pemasukan & Skema Hunian
    jenis_pemasukan: string; // JSON string of JenisPemasukan[]
    skema_iuran_hunian: string; // JSON string of Record<string, number>
};

export type JenisPemasukan = {
    id: string;
    nama: string;
    tipe: 'BULANAN' | 'INSIDENTIL';
    nominal: number;
    is_mandatory: boolean;
};

export const APP_MODULES = [
    { id: 'Warga', label: 'Data Warga' },
    { id: 'Pengurus', label: 'Data Pengurus' },
    { id: 'Iuran Warga', label: 'Iuran Warga' },
    { id: 'Buku Kas / Transaksi', label: 'Buku Kas / Transaksi' },
    { id: 'Notulensi', label: 'Notulensi & Kehadiran' },
    { id: 'Aset', label: 'Aset RT' },
    { id: 'Surat / Cetak', label: 'Surat Pengantar' },
    { id: 'Jadwal Ronda', label: 'Jadwal Ronda' },
    { id: 'Agenda', label: 'Agenda Kegiatan' },
    { id: 'Setup / Pengaturan', label: 'Pengaturan Sistem' },
    { id: 'Manajemen User / Role', label: 'Manajemen User & Role' },
    { id: 'Log Aktivitas', label: 'Log Aktivitas' },
    { id: 'Aduan & Usulan', label: 'Aduan & Usulan' },
    { id: 'Dashboard', label: 'Dashboard Utama' }
];

export const CRUD_ACTIONS = [
    { id: 'Lihat', label: 'Lihat' },
    { id: 'Buat', label: 'Buat' },
    { id: 'Ubah', label: 'Ubah' },
    { id: 'Hapus', label: 'Hapus' }
];
