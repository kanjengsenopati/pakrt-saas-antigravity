# PAKRT - Pengelolaan Administrasi & Keuangan Rukun Tetangga

PAKRT adalah platform digital modern yang dirancang untuk membantu pengurus Rukun Tetangga (RT) dalam mengelola administrasi, keuangan, dan komunikasi antar warga secara efisien, transparan, dan otomatis.

## 🚀 Fitur Utama

-   **Manajemen Warga & KK**: Database terpusat untuk data kependudukan dan domisili.
-   **Keuangan Real-time**: Transparansi kas masuk, kas keluar, dan iuran bulanan warga.
-   **Layanan Mandiri Warga (Self-Service)**: Portal warga untuk pengajuan surat (domisili, pindah, dll), pelaporan masalah, dan pembayaran iuran.
-   **Persuratan Otomatis**: Generate surat pengantar RT/RW standar resmi secara otomatis.
-   **Agenda & Aktivitas**: Manajemen jadwal rapat, kerja bakti, dan kegiatan lingkungan lainnya.
-   **Siskamling & Ronda**: Pengelolaan jadwal ronda malam secara otomatis dan adil.
-   **Manajemen Aset**: Inventarisir barang milik RT (tenda, kursi, sound system, dll).
-   **Dashboard Agregasi**: Visualisasi data untuk level RW/Kelurahan untuk memantau aktivitas seluruh RT di wilayahnya.

## 🛠️ Tech Stack

### Frontend
-   **Vite + React (TypeScript)**
-   **Tailwind CSS** (Styling)
-   **React Hook Form** (Form Management)
-   **Phosphor Icons** (Iconography)
-   **Axios** (API Client)
-   **Recharts** (Data Visualization)

### Backend
-   **Node.js + Express**
-   **Prisma ORM**
-   **PostgreSQL / Neon (Cloud DB)**
-   **TypeScript**

## 💻 Cara Menjalankan

### Prasyarat
-   Node.js (v18 atau lebih baru)
-   PostgreSQL / Neon Project ID

### Instalasi

1.  Clone repositori ini:
    ```bash
    git clone https://github.com/example/pakrt.git
    cd pakrt
    ```

2.  Instal dependensi untuk Frontend dan Backend:
    ```bash
    npm install
    cd backend
    npm install
    ```

3.  Konfigurasi Environment Variable:
    Buat file `.env` di folder root:
    ```env
    VITE_API_URL=http://localhost:3000/api
    ```
    Buat file `.env` di folder `backend`:
    ```env
    DATABASE_URL=postgresql://user:password@host/db
    DIRECT_URL=postgresql://user:password@host/db
    PORT=3000
    ```

4.  Jalankan Migrasi Database (Backend):
    ```bash
    cd backend
    npx prisma migrate dev
    ```

5.  Jalankan Aplikasi:
    -   **Backend**: `npm run dev` (di folder `backend`)
    -   **Frontend**: `npm run dev` (di folder root)

## 🤝 Kontribusi

Kami menerima kontribusi untuk perbaikan bug dan penambahan fitur. Silakan buat *Pull Request* atau *Issue* jika Anda menemukan masalah.

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi MIT.
