# PRD — PakRT: Project Requirements Document

## 1. Overview
**PakRT** adalah platform *Software as a Service* (SaaS) yang dirancang untuk mendigitalkan ekosistem pengelolaan Rukun Tetangga (RT). Fokus utama platform ini adalah menciptakan transparansi keuangan, efisiensi administrasi persuratan, dan kemudahan interaksi antar warga melalui antarmuka yang modern, premium, dan *mobile-first*.

**Tujuan Utama:**
- Menghilangkan pencatatan manual (kertas).
- Transparansi dana kas RT bagi seluruh warga.
- Otomatisasi persuratan resmi (Surat Pengantar).
- Meningkatkan keterlibatan warga melalui fitur interaktif (Polling, Aduan, Agenda).

---

## 2. Requirements

### 2.1 Functional Requirements
- **Multi-Tenancy:** Sistem mendukung banyak RT (Tenant) dalam satu platform dengan isolasi data yang ketat.
- **Role-Based Access Control (RBAC):** 
  - **Admin/Ketua RT:** Kontrol penuh terhadap sistem dan konfigurasi.
  - **Sekretaris:** Mengelola data warga dan persuratan.
  - **Bendahara:** Mengelola kas dan verifikasi iuran.
  - **Warga:** Akses portal mandiri (Layanan Mandiri).
- **Data Integrity:** Transaksi keuangan harus atomik dan tercatat di log aktivitas.
- **Document Generation:** Otomatisasi pembuatan surat dalam format yang siap cetak.

### 2.2 Non-Functional Requirements
- **Premium UI/UX:** Mengikuti standar PakRT Premium Native (24px radius, Typography Slate-800, Emerald accents).
- **Mobile First:** Antarmuka harus responsif dan nyaman digunakan di perangkat seluler.
- **Security:** Autentikasi berbasis token/cookie, enkripsi password, dan proteksi API.
- **Real-time Updates:** Notifikasi langsung saat ada aktivitas baru.

---

## 3. Core Features

### 3.1 Manajemen Warga (Database Warga)
- Database kependudukan terpusat.
- Manajemen Anggota Keluarga (KK).
- Status domisili (Tetap, Kontrak, Pindah, Meninggal).
- Sinkronisasi akun warga dengan data kependudukan.

### 3.2 Keuangan & Iuran (Billing System)
- Pengaturan kategori iuran fleksibel (Bulanan, Insidentil).
- **Billing Summary:** Rekap tagihan otomatis per warga.
- **Verifikasi Pembayaran:** Alur persetujuan bukti transfer oleh Bendahara.
- **Sync to Keuangan:** Setiap iuran terverifikasi otomatis masuk ke buku kas.

### 3.3 Layanan Mandiri (Self-Service Warga)
- **Surat Pengantar:** Pengajuan mandiri oleh warga, approval oleh pengurus.
- **Aduan & Usulan:** Kanal komunikasi dua arah warga ke pengurus.
- **Polling:** Pemungutan suara digital untuk keputusan lingkungan.

### 3.4 Operasional (Agenda & Aset)
- **Agenda:** Pengumuman rapat, kerja bakti, dsb.
- **Manajemen Aset:** Peminjaman barang milik RT (Tenda, Kursi, dsb).
- **Ronda Malam:** Manajemen jadwal siskamling (Jadwal otomatis).

---

## 4. User Flow

### 4.1 Flow Pendaftaran & Login
1. User masuk ke Landing Page -> Login.
2. Jika Role = Warga -> Masuk ke **Portal Warga**.
3. Jika Role = Pengurus -> Masuk ke **Dashboard Admin**.

### 4.2 Flow Pembayaran Iuran (Warga)
1. Dashboard Warga -> Klik "Bayar Iuran".
2. Pilih item iuran yang ingin dibayar.
3. Review Invoice & Salin Nomor Rekening.
4. Upload bukti transfer -> Status "Pending".
5. Bendahara verifikasi -> Status "Verified" -> Notifikasi ke warga.

### 4.3 Flow Persuratan
1. Warga mengajukan surat melalui portal.
2. Pengurus menerima notifikasi.
3. Pengurus klik "Generate Surat" -> Cetak/Simpan PDF.
4. Status surat berubah menjadi "Selesai".

---

## 5. Architecture
Aplikasi menggunakan arsitektur **Monolith Modern** yang dipisahkan secara logis:

- **Frontend:** React + Vite + TypeScript (Single Page Application).
- **Backend:** Node.js + Fastify/Express + TypeScript.
- **Database:** PostgreSQL (Relational).
- **ORM:** Prisma (Type-safe database client).
- **Deployment:** Vercel (Frontend), Node.js server (Backend).

---

## 6. Database Schema (Key Entities)
- **Tenant:** Entitas utama RT/RW.
- **User:** Akun pengguna (Credentials & Role).
- **Warga:** Profil kependudukan (NIK, Alamat, dsb).
- **PembayaranIuran:** Log transaksi iuran.
- **Keuangan:** Buku kas besar (Pemasukan/Pengeluaran).
- **SuratPengantar:** Data pengajuan surat resmi.
- **Aktivitas:** Audit log aktivitas sistem.

---

## 7. Design & Technical Constraints
- **Border Radius:** Mutlak `rounded-[24px]` untuk container utama.
- **Safe Area:** Padding horizontal `px-5` (20px).
- **Typography:** 
  - H1: 22px Bold Slate-900.
  - Body: 14px Medium Slate-600.
  - Amount: 18px Bold Emerald-600.
- **Icons:** Lucide-React / Phosphor (2px stroke, 18px size).
- **Color Pallette:**
  - Brand: Blue-600.
  - Success: Emerald-600.
  - Danger: Red-600.

---

## 8. Deficiencies & Tasks to Complete (GAP Analysis)
Berdasarkan kondisi aplikasi saat ini, berikut adalah kekurangan yang perlu diselesaikan:

### 🛠️ High Priority (Stability & Accuracy)
- [ ] **PDF Export:** Fitur cetak surat pengantar saat ini baru dalam bentuk UI/HTML, butuh integrasi PDF Generator yang *pixel-perfect*.
- [ ] **Financial Reporting:** Penambahan fitur ekspor laporan bulanan/tahunan (PDF/XLSX) yang komprehensif.
- [ ] **Push Notification:** Integrasi Web Push (PWA) agar warga mendapat notifikasi tanpa harus membuka aplikasi.

### 🎨 UI/UX Enhancements
- [ ] **Aset Module:** UI manajemen aset masih sangat dasar, perlu diperkaya dengan alur peminjaman (Booking).
- [ ] **Ronda UI:** Halaman jadwal ronda perlu dibuat lebih interaktif (misal: kalender ronda).

### ⚙️ Technical Debt
- [ ] **Unit Testing:** Penambahan cakupan test untuk logika perhitungan iuran (Calculator).
- [ ] **Data Cleanup:** Pembersihan data *hardcoded* di beberapa modul yang masih tersisa.
