# LOG AKTIVITAS, KONTEKS & RENCANA PENGEMBANGAN (CHANGELOG & CONTEXT)
**Proyek:** Sistem Informasi & Portal Pendaftaran OMEGA PLUS 2026 (SMP Negeri 1 Pamekasan)  
**Tanggal Log:** 24 Oktober 2026 (`241026`)  
**Status Sesi:** Transisi & Kloning Proyek ke `13. omega-client` (Versi Ramping Khusus Klien)  

---

## 1. Ringkasan Eksekutif & Permintaan Klien (WhatsApp Request)

Klien meminta sistem pendaftaran yang **langsung tepat sasaran tanpa landing page**, difokuskan hanya pada formulir pendaftaran, verifikasi pembayaran BCA, pembagian 30 ruang kelas, kwitansi pendaftaran langsung, serta laporan rekapitulasi terlindung password dengan hak akses bertingkat.

### Catatan Kebutuhan Klien Berdasarkan 3 Tangkapan Layar WhatsApp:
1. **Tanpa Landing Page:** Pengguna langsung diarahkan ke formulir pendaftaran publik saat membuka web.
2. **Data / Field yang Diperlukan:**
   - **Nama Peserta** (Wajib, teks)
   - **Asal Sekolah** (SD/MI)
   - **Alamat Sekolah** *(Field baru sesuai form fisik)*
   - **Nomor HP Guru** *(Kontak guru pendamping, format WhatsApp)*
   - **Tingkatan Level:**
     - `Level 1` : Kelas 3 – 4 *(Catatan penting: bukan kelas 1–3)*
     - `Level 2` : Kelas 5 – 6
   - **Pilihan Mata Pelajaran:** **Hanya salah satu** (Single choice / Radio: `Matematika`, `IPA`, `Bahasa Inggris`, `IPS`)
3. **Pembayaran & Bukti Transfer:**
   - Rekening Pembayaran Resmi: **Bank BCA 1921605205 a.n Norma Dewi**
   - Upload screenshot bukti transfer pembayaran pendaftaran.
4. **Kwitansi Pendaftaran Digital & Format Nomor:**
   - Sesaat setelah submit sukses, formulir menampilkan **Kwitansi Resmi Pendaftaran**.
   - Format nomor/kode peserta sesuai permintaan baku klien: `omega 0001-kode level-kelas -2026` (contoh: `omega-0001-L1-01-2026`).
   - Memuat Alokasi Ruang Kelas (Ruang 01–30), Nama, Sekolah, Mapel, Status Lunas, dan QR Code.
   - Tombol cetak langsung (*Print / Simpan PDF*).
5. **Pembagian 30 Ruang Kelas:**
   - Penyelenggara menyediakan **30 Kelas Ujian**.
   - Sistem mengalokasikan pendaftar secara merata/berurutan ke `Ruang 01` s/d `Ruang 30` berdasarkan tingkatan Level.
6. **Dashboard Laporan & Proteksi Password (Dual Role):**
   - *"Untuk laporan hasil pendafranya bisa di lock atau paswot jadi panitia hanya bisa lihat aja kecuali saya bisa buka datanya bisa pak"*
   - **Role 1 - Panitia / Pengawas (Password Panitia):** Hanya bisa melihat data (*View-Only*), memantau statistik, mencari nama peserta, dan cetak daftar ruang. Tombol edit/hapus/verifikasi disembunyikan.
   - **Role 2 - Super Admin / Penanggung Jawab (Password Admin):** Membuka akses penuh (*Full Access*) untuk verifikasi status, edit data pendaftar, hapus data, dan kelola alokasi kelas.
7. **Penyimpanan & Export:**
   - Data dapat disimpan / diekspor ke **Excel (.xlsx / .csv)** dan dapat di-print langsung (*Print Friendly A4*).
8. **Identitas Visual:**
   - Menggunakan foto gedung SMPN 1 Pamekasan (nuansa dinding biru & putih) yang dikirimkan klien sebagai banner/header aplikasi.

---

## 2. Keputusan Arsitektur: Kloning ke `13. omega-client`

Untuk menjaga kualitas project utama (`13. omega`) sebagai *Master Template / Multi-Feature SaaS* yang komprehensif (memiliki landing page, PRD, dokumen proposal komersial, multi-mapel, dll), telah dilakukan **kloning penuh** ke direktori:
```
d:\1. MIZTERGOOD\04 - Keuangan dan Bisnis\JASA\13. omega-client
```

### Keuntungan Strategi Ini:
- Folder `13. omega` tetap aman sebagai template produk jangka panjang.
- Folder `13. omega-client` dapat disesuaikan (*tailored & lightweight*) tanpa beban fitur yang tidak dibutuhkan klien.
- Dev dapat membuka folder `13. omega-client` sebagai workspace baru di VS Code / Antigravity IDE.

---

## 3. Checklist Rencana Kerja di Folder `13. omega-client`

Ketika sesi baru dibuka pada folder `13. omega-client`, berikut langkah eksekusi yang langsung dikerjakan:

- [x] **1. `config.js`:**
  - Update nomor rekening: **BCA 1921605205 a.n Norma Dewi**.
  - Atur konfigurasi dual PIN (PIN Panitia untuk View-Only, PIN Admin untuk Full Access).
  - Atur konstanta total kelas = 30.
- [x] **2. `index.html` (Formulir Pendaftaran Utama):**
  - Menggantikan landing page lama menjadi form pendaftaran langsung.
  - Implementasi field baru: Nama, Asal Sekolah, Alamat Sekolah, No HP Guru, Level (3-4 & 5-6), Radio Button 1 Mapel.
  - Kotak informasi transfer BCA Norma Dewi + Form upload screenshot bukti TF.
  - Komponen **Kwitansi Resmi Pendaftaran** interaktif (siap cetak / save PDF).
- [x] **3. `admin.html` (Dashboard Laporan & Keamanan):**
  - Modifikasi modal autentikasi: Mendeteksi apakah PIN yang dimasukkan adalah PIN Panitia (*Read-Only*) atau PIN Admin (*Full Access*).
  - Terapkan proteksi tombol aksi (Edit, Hapus, Status Verifikasi hanya aktif untuk Super Admin).
  - Tambahkan tombol **Export to Excel (.xlsx / .csv)** dan **Print Rekapitulasi**.
  - Tampilkan kolom **Ruang / Kelas Ujian** (Ruang 01–30) dan ringkasan distribusi kelas.
- [x] **4. `Code.gs` (Google Apps Script Backend):**
  - Sesuaikan struktur kolom sheet `PESERTA`:
    `Timestamp`, `No_Pendaftaran`, `Nama_Peserta`, `Asal_Sekolah`, `Alamat_Sekolah`, `No_HP_Guru`, `Level`, `Mata_Pelajaran`, `Kode_Peserta`, `Ruang_Kelas`, `Bukti_Transfer_Url`, `Status_Verifikasi`, `Catatan_Panitia`.
  - Tambahkan handler upload bukti transfer ke folder Google Drive panitia.
  - Logika otomatis alokasi Ruang Kelas 01 s/d 30 saat pendaftaran disubmit.
  - Validasi dual PIN di fungsi `verifyAdminPin`.
