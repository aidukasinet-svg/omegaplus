# PANDUAN DEPLOYMENT & PENGGUNAAN SISTEM OMEGA PLUS 2026
**SMP Negeri 1 Pamekasan — Olimpiade Matematika, Bahasa Inggris, IPA, dan IPS SD/MI Se-Madura**

---

## 📦 Struktur File Proyek

```text
├── Code.gs             --> Backend Google Apps Script (Setup DB, API doGet/doPost, Email & PDF Generator)
├── _worker.js          --> Cloudflare Pages Worker (Reverse proxy penghilang CORS ke Google Apps Script)
├── index.html          --> Frontend Publik (Landing page, Formulir pendaftaran, Cek status, Cetak bukti)
├── admin.html          --> Frontend Admin (Dashboard 7 metrik, Tabel realtime, Verifikasi, Ekspor CSV/A4)
├── config.js           --> Konfigurasi endpoint API & data resmi brosur
├── brosur omega.jfif   --> Referensi materi brosur & benefit resmi
├── map.md              --> Peta arsitektur & flow sistem
├── PRD.md              --> Product Requirements Document & ASCII wireframes
└── DESIGN_SYSTEM.md    --> Spesifikasi desain warna, tipografi, & komponen
```

---

## 🚀 LANGKAH 1: Setup Backend Google Apps Script & Database

1. Buka project Apps Script Anda di browser:  
   `https://script.google.com/u/0/home/projects/1SPCZkf-gtaBZ2z6fi6XF-CS3a4g_A5cdllwYeZOIFf6G0Xl2fcqDGY8c-/edit`
2. Salin seluruh isi file [`Code.gs`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/13.%20omega/Code.gs) dan tempel (*replace*) ke file `Code.gs` di editor Apps Script.
3. Tekan **Save** (Ctrl+S).
4. Di bagian menu toolbar atas editor Apps Script:
   - Pilih dropdown fungsi: **`setupDatabase`**
   - Klik tombol **Run** (Jalankan).
   - Berikan izin akses (*Review permissions* -> pilih akun Google Anda -> *Advanced* -> *Go to Untitled project (unsafe)* -> *Allow*).
   - Buka menu **Execution log** (di bagian bawah editor). Anda akan melihat URL Spreadsheet baru bernama **`DATABASE_OMEGA_PLUS_2026`** yang sudah otomatis terisi tabel `PESERTA`, `PENGATURAN`, `LOG_EMAIL`, dan `LOG_AKTIVITAS`!

---

## 🌐 LANGKAH 2: Deploy Web App di Google Apps Script

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon gerigi (Select type) > pilih **Web app**.
3. Atur konfigurasi berikut:
   - **Description:** `Production API v1`
   - **Execute as:** `Me (email Anda)`
   - **Who has access:** `Anyone` *(Penting agar pendaftar dari seluruh Madura dapat mengakses API)*.
4. Klik **Deploy**.
5. Salin URL **Web app URL** yang muncul (berakhiran `/exec`).  
   Contoh: `https://script.google.com/macros/s/AKfycb.../exec`.

---

## ☁️ LANGKAH 3: Hubungkan ke Cloudflare Pages

1. Buka file [`_worker.js`](file:///d:/1.%20MIZTERGOOD/04%20-%20Keuangan%20dan%20Bisnis/JASA/13.%20omega/_worker.js) di folder proyek ini.
2. Ganti nilai `DEFAULT_GAS_URL` dengan URL `/exec` yang Anda dapatkan dari Langkah 2:
   ```javascript
   const DEFAULT_GAS_URL = "https://script.google.com/macros/s/URL_DEPLOYMENT_ANDA/exec";
   ```
   *(Atau masukkan sebagai Environment Variable di dashboard Cloudflare Pages: `GAS_URL`).*
3. Commit dan push proyek ini ke GitHub:
   ```bash
   git add .
   git commit -m "Deploy web form Omega Plus SMPN 1 Pamekasan"
   git push origin main
   ```
4. Di Cloudflare Pages (seperti dashboard `aidukasi` yang Anda miliki), hubungkan ke repositori GitHub ini.
5. Cloudflare Pages akan otomatis mem-build dan menyajikan website di domain Anda (misal `omega.pages.dev`).

---

## 🔑 Hak Akses & Kredensial Admin

- **Halaman Portal Panitia:** `admin.html`
- **PIN Default:** `123456`  
  *(Dapat diubah kapan saja di Sheet `PENGATURAN` baris `Admin_PIN` pada Google Spreadsheet Anda).*

---

## 💡 Fitur Unggulan Sistem:

1. **Aturan Penomoran Resmi:**
   - Nomor Pendaftaran Master: `OMP-2026-XXXX` (contoh: `OMP-2026-0001`).
   - Kode Peserta per Mapel: `XX-YY-ZZZ` (contoh: `02-03-001` untuk Level 2 - IPA urutan 1).
2. **Email Otomatis 2 Tahap:**
   - **Tahap 1 (Saat Daftar):** Email konfirmasi pendaftaran diterima + lampiran *Surat Informasi Panitia PDF* & *Bukti Pendaftaran Sementara PDF*.
   - **Tahap 2 (Saat Diverifikasi Admin):** Email konfirmasi sah + lampiran *Kartu Peserta Resmi PDF* ber-QR Code validasi kehadiran di hari H.
3. **Anti-Alert Bawaan:** 100% menggunakan library modern **SweetAlert2** untuk semua dialog konfirmasi, loading, dan pesan sukses/error.
4. **Cetak & Ekspor:** Cetak Formulir Kosong A4, Cetak Bukti Individual, Cetak Rekap Peserta A4, Ekspor DOC, dan Ekspor CSV.
