---
description: Frontend Layouting Rules: PakRT Premium Native (Vite). Focused on pixel-perfect consistency, 24px radius, Emerald Success accents, and strict Typography components. Pure UI/UX isolation
---

# FRONTEND LAYOUTING RULES: PAKRT NATIVE VITE

## 1. COMPONENT ARCHITECTURE (STRICT)
- **Container Radius:** Mutlak menggunakan `rounded-[24px]` (rounded-3xl) untuk semua Card, Modal, dan Container utama.
- **Safe Area:** Layout utama wajib memiliki padding horizontal `px-5` (20px).
- **Surface Elevation:** Gunakan custom shadow `shadow-[0_8px_30px_rgb(0,0,0,0.04)]`. Dilarang menggunakan border solid pada card putih.
- **Glassmorphism:** Gunakan `backdrop-blur-md` dengan background `white/80` untuk Bottom Navigation dan Sticky Header.

## 2. TYPOGRAPHY SYSTEM (MANDATORY)
Dilarang menggunakan utility class Tailwind manual untuk font-size. Wajib gunakan wrapper:
- **<Text.H1>:** [22px, Bold, Slate-900] - Header & Greetings.
- **<Text.H2>:** [16px, Semi-bold, Slate-800] - Module Title & Card Header.
- **<Text.Amount>:** [18px, Bold, Emerald-600] - Data Keuangan/Saldo (HIJAU).
- **<Text.Label>:** [11px, Bold, Uppercase, Tracking-widest, Slate-400] - Kategori & Overline.
- **<Text.Body>:** [14px, Medium, Slate-600] - Isi informasi & Deskripsi.
- **<Text.Caption>:** [12px, Regular, Italic, Slate-400] - Metadata, ID, & Tanggal.

## 3. VISUAL HIERARCHY & DENSITY (ZERO WASTE SPACE)
- **Top-Right Action Cluster:** Pindahkan semua icon aksi (Edit, Hapus, Image) ke pojok kanan atas card. Gunakan `flex items-center gap-2`.
- **Icon Style:** Lucide-React, size 18px, stroke 2px, warna `text-slate-400`.
- **Bottom Density:** Area bawah card hanya diisi oleh `<Text.Amount>` dan data penunjang utama. Pastikan `padding-bottom` minimal agar card terlihat 'compact'.

## 4. COLOR & SEMANTIC RULES
- **Accent Primary:** Blue-600 (#2563EB) - CTA Utama & Branding.
- **Accent Success:** Emerald-600 (#10B981) - Semua angka positif dan badge 'Verified'.
- **Accent Error:** Red-600 (#DC2626) - Angka negatif, Kas Keluar, & Delete Buttons.
- **Tints:** Gunakan `bg-opacity-10` untuk background badge berdasarkan warna aksennya.

