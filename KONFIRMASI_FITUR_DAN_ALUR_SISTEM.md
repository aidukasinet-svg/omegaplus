# DOKUMEN RENCANA KERJA & KONFIRMASI SPESIFIKASI SISTEM
## PORTAL PENDAFTARAN & MANAJEMEN PESERTA OMEGA PLUS 2026
**SMP NEGERI 1 PAMEKASAN**

---

| Informasi Dokumen | Detail |
| :--- | :--- |
| **Nama Proyek** | Sistem Informasi & Portal Pendaftaran OMEGA PLUS 2026 |
| **Klien / Penyelenggara** | Panitia OMEGA PLUS 2026 - SMP Negeri 1 Pamekasan |
| **Tanggal Pengajuan** | 24 Oktober 2026 |
| **Status Dokumen** | Rencana Kerja & Konfirmasi Kebutuhan (*Draft for Approval*) |
| **Tujuan Dokumen** | Menyelaraskan seluruh alur kerja, spesifikasi teknis, serta fitur yang disepakati sebelum sistem dipublikasikan |

---

## 1. Ringkasan Eksekutif & Arah Pengembangan

Berdasarkan komunikasi dan instruksi terbaru dari pihak panitia OMEGA PLUS 2026, sistem pendaftaran dirancang dengan pendekatan **langsung tepat sasaran (*direct action*)**. 

Sistem tidak lagi menggunakan landing page promosi yang panjang, melainkan **langsung membuka formulir pendaftaran resmi** agar calon peserta/guru pendamping dapat segera mendaftar dengan cepat, mudah diakses melalui ponsel (*mobile friendly*), dan bebas hambatan teknis.

---

## 2. Rincian Fitur & Alur Sistem

### A. Alur Formulir Pendaftaran Publik (`index.html`)
Calon peserta atau guru pendamping yang membuka tautan portal akan langsung melihat formulir pendaftaran resmi dengan komponen berikut:

1. **Header & Identitas Resmi**:
   - Menampilkan logo resmi OMEGA PLUS dan foto visual kebanggaan gedung SMP Negeri 1 Pamekasan (nuansa biru & putih).
   - Panduan ringkas tata cara pendaftaran.
2. **Data / Isian Formulir Peserta**:
   - **Nama Lengkap Peserta** *(Wajib diisi sesuai akta/rapor)*.
   - **Asal Sekolah** *(SD / MI)*.
   - **Alamat Lengkap Sekolah** *(Untuk keperluan korespondensi & sertifikat)*.
   - **Nomor WhatsApp Guru Pendamping / Wali** *(Format aktif untuk konfirmasi & grup informasi)*.
   - **Tingkat / Kategori Level**:
     - `Level 1` : Kelas 3 – 4 SD/MI
     - `Level 2` : Kelas 5 – 6 SD/MI
   - **Pilihan Mata Pelajaran (Hanya 1 Mapel / Single Choice)**:
     - ⚪ Matematika
     - ⚪ IPA
     - ⚪ Bahasa Inggris
     - ⚪ IPS
3. **Informasi Pembayaran & Rekening Resmi**:
   - Kotak informasi transfer resmi:
     - **Bank**: BCA
     - **Nomor Rekening**: `1921605205`
     - **Atas Nama**: **Norma Dewi**
   - Fasilitas tombol salin nomor rekening otomatis (*Copy to Clipboard*).
4. **Unggah Bukti Transfer**:
   - Form upload file screenshot/foto bukti transfer bank.
   - File otomatis tersimpan aman di Google Drive panitia dengan tautan langsung di lembar rekapitulasi.

---

### B. Kwitansi Resmi Pendaftaran Digital (Otomatis & Siap Cetak)
Sesaat setelah tombol **"Kirim Pendaftaran"** berhasil diproses:
1. Layar secara otomatis menampilkan **Kwitansi Resmi Registrasi OMEGA PLUS 2026**.
2. Kwitansi memuat:
   - **Nomor / Kode Peserta Resmi** sesuai format baku permintaan klien:  
     `omega 0001-kode level-kelas -2026`  
     *(Contoh: `omega-0001-L1-01-2026` untuk peserta pendaftar ke-1, Level 1, Ruang Kelas 01, tahun 2026)*.
   - Alokasi Ruang Ujian (misal: `Ruang 01` s/d `Ruang 30`).
   - Biodata Peserta (Nama, Asal Sekolah, Alamat Sekolah, Level, dan Mapel).
   - Waktu Pendaftaran & Status Verifikasi Pembayaran.
   - Barcode / QR Code verifikasi keaslian kwitansi.
3. Tombol Aksi:
   - **Cetak Kwitansi / Simpan PDF** (Desain proporsional, rapi, dan siap cetak pada kertas standar A4/F4).
   - **Kirim Salinan ke WhatsApp** (opsional untuk kemudahan simpan di HP peserta).

---

### C. Alokasi Otomatis 30 Ruang Kelas Ujian
Penyelenggara menyediakan kapasitas **30 Ruang Kelas Ujian**:
- Sistem secara otomatis mengelompokkan dan mengalokasikan nomor peserta ke dalam **Ruang 01 sampai dengan Ruang 30**.
- Distribusi dapat difilter per ruang dan dicetak terpisah untuk kebutuhan:
  - Tempelan daftar peserta di depan pintu masing-masing ruang kelas ujian.
  - Lembar absensi / presensi pengawas ruang pada hari H ujian.

---

### D. Dashboard Panitia & Keamanan Akses Bertingkat (Dual Role PIN)
Sesuai permintaan khusus agar rekapitulasi data pendaftar terkunci dan tidak dapat diubah sembarangan oleh pihak yang tidak berwenang, sistem dilengkapi **Dual Role Security** pada halaman admin (`admin.html`):

```
                   ┌─────────────────────────────────────────┐
                   │        HALAMAN LOGIN ADMIN / PANITIA    │
                   └────────────────────┬────────────────────┘
                                        │
                         Masukkan PIN / Kata Sandi
                                        │
            ┌───────────────────────────┴───────────────────────────┐
            ▼                                                       ▼
 ╔═══════════════════════════════╗       ╔═══════════════════════════════╗
 ║      ROLE 1: PANITIA          ║       ║     ROLE 2: SUPER ADMIN       ║
 ║     (Password Panitia)        ║       ║       (Password Utama)        ║
 ╠═══════════════════════════════╣       ╠═══════════════════════════════╣
 ║ • Hak Akses: LIHAT SAJA       ║       ║ • Hak Akses: PENUH (FULL)     ║
 ║   (Read-Only)                 ║       ║                               ║
 ║ • Memantau jumlah pendaftar   ║       ║ • Verifikasi status LUNAS     ║
 ║ • Melihat & memfilter data    ║       ║ • Ubah / Edit data salah      ║
 ║ • Filter peserta per Ruang    ║       ║ • Hapus data pendaftar ganda  ║
 ║ • Cetak daftar ruang / absensi║       ║ • Atur ulang nomor ruang      ║
 ║ ❌ Tombol Edit/Hapus TERKUNCI ║       ║ • Unduh Rekap Excel Lengkap   ║
 ╚═══════════════════════════════╝       ╚═══════════════════════════════╝
```

---

### E. Integrasi Data & Laporan (Google Sheets & Excel)
- **Database Utama**: Google Spreadsheet aman yang terhubung secara realtime (*Google Apps Script Backend*).
- **Struktur Kolom Database**:
  1. `Waktu Pendaftaran (Timestamp)`
  2. `Nomor Pendaftaran`
  3. `Nama Lengkap Peserta`
  4. `Asal Sekolah`
  5. `Alamat Sekolah`
  6. `Nomor HP Guru / Wali`
  7. `Level (Level 1 / Level 2)`
  8. `Mata Pelajaran yang Dipilih`
  9. `Nomor / Kode Peserta`
  10. `Ruang Kelas Ujian (Ruang 01–30)`
  11. `Tautan Bukti Transfer (Google Drive)`
  12. `Status Verifikasi (Menunggu / Lunas / Ditolak)`
  13. `Catatan Panitia`
- **Ekspor Data**: Tersedia tombol **Export to Excel (.xlsx / .csv)** untuk diolah lebih lanjut secara luring (*offline*).

---

## 3. Rencana Kerja & Tahapan Implementasi

| No | Modul / Pekerjaan | Target Hasil |
| :---: | :--- | :--- |
| **1** | **Pembaruan Konfigurasi (`config.js`)** | Memasukkan rekening BCA Norma Dewi, pengaturan Dual-PIN, dan parameter 30 ruang. |
| **2** | **Desain Ulang Form Utama (`index.html`)** | Tampilan langsung formulir registrasi, input field baru, upload bukti TF, dan mobile-ready. |
| **3** | **Modul Kwitansi Digital** | Pembuatan template kwitansi resmi yang muncul otomatis sesudah submit + fitur Print/Save PDF. |
| **4** | **Dashboard Rekapitulasi (`admin.html`)** | Penerapan login Dual-PIN (Panitia vs Super Admin), filter 30 ruang, dan cetak lembar absen. |
| **5** | **Backend & Google Drive (`Code.gs`)** | Sinkronisasi kolom data baru, penyimpanan foto transfer ke Drive, dan auto-alokasi nomor ruang. |
| **6** | **Uji Coba & Serah Terima** | Pengujian menyeluruh (*end-to-end testing*) bersama pihak panitia. |

---

## 4. Formulir Konfirmasi & Persetujuan Klien

Mohon pihak penanggung jawab / panitia OMEGA PLUS 2026 meninjau butir-butir di atas dan memberikan konfirmasi melalui checklist berikut:

- [ ] **Alur Langsung ke Form**: Pendaftaran langsung ke formulir tanpa halaman depan/landing page. *(Disetujui / Catatan)*
- [ ] **Kelengkapan Isian Peserta**: Nama, Asal Sekolah, Alamat Sekolah, No HP Guru, Level (1: Kls 3-4, 2: Kls 5-6), dan 1 Pilihan Mapel. *(Disetujui / Catatan)*
- [ ] **Rekening Resmi**: Bank BCA `1921605205` a.n Norma Dewi. *(Disetujui / Catatan)*
- [ ] **Kwitansi Digital**: Langsung terbit setelah daftar dan bisa disimpan dalam format PDF/Cetak. *(Disetujui / Catatan)*
- [ ] **30 Ruang Kelas Ujian**: Pembagian otomatis pendaftar ke Ruang 01 s/d Ruang 30. *(Disetujui / Catatan)*
- [ ] **Format Nomor / Kode Peserta**: Standar penomoran menggunakan format `omega 0001-kode level-kelas -2026` (contoh: `omega-0001-L1-01-2026`). *(Disetujui / Catatan)*
- [ ] **Akses Keamanan Bertingkat**: Panitia hanya bisa memantau/cetak (*Read-Only*), sedangkan Super Admin memiliki hak penuh verifikasi & edit data. *(Disetujui / Catatan)*

---

### Lembar Pengesahan:

Pamekasan, 24 Oktober 2026  

**Pihak Pengembang Sistem,**  
*(Tim Pengembang Web OMEGA PLUS)*  

\
\
--------------------------------------------  

**Pihak Panitia / Penanggung Jawab OMEGA PLUS 2026,**  
*(SMP Negeri 1 Pamekasan)*  

\
\
--------------------------------------------  
*(Nama & Tanda Tangan / Konfirmasi via WhatsApp)*
