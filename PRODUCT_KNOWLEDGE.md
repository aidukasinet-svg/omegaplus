# PRODUCT KNOWLEDGE & PITCHING DECK
## Sistem Informasi Pendaftaran & Manajemen Event / Olimpiade Modern
**Solusi Terpadu: Landing Page Institusional • Database Google Sheets Realtime • Otomasi Email 2-Tahap • Kartu Peserta QR Code**

---

## 1. Executive Summary (Ringkasan Eksekutif)

Banyak sekolah, universitas, yayasan, dan *event organizer* menghadapi tantangan besar saat menyelenggarakan acara berskala besar (olimpiade akademik, kompetisi, PPDB, workshop, atau festival):
- Menggunakan **Google Form biasa** terasa kaku, tidak memiliki branding prestisius, rawan data ganda, peserta tidak bisa mengecek status mandiri, dan panitia harus membuat kartu ujian atau bukti pembayaran satu per satu secara manual.
- Menggunakan **sistem web aplikasi konvensional (Hosting + VPS + Database SQL)** membutuhkan biaya server bulanan yang mahal, rentan *down/crash* saat ribuan orang mendaftar serentak, serta memerlukan keahlian teknis khusus yang menyulitkan panitia saat mengelola data.

**Produk Kami Menyediakan Solusi "Best of Both Worlds":**
Sebuah platform pendaftaran dan manajemen acara modern yang memadukan **tampilan web interaktif kelas institusi (Cloudflare Global CDN)** dengan kemudahan **Google Sheets sebagai basis data *real-time***. 
Sistem ini beroperasi **100% *Serverless*** (bebas biaya sewa hosting/server bulanan), otomatis mengirimkan email konfirmasi berlampiran kartu peserta resmi PDF dengan QR Code, dan memberikan dashboard pantau analitik yang siap digunakan tanpa pelatihan yang rumit.

---

## 2. Masalah Klien vs Solusi Produk (Problem vs Solution)

| Tantangan Panitia Saat Ini (Google Form / Cara Lama) | Solusi dari Sistem Kami |
| :--- | :--- |
| **Branding Kurang Profesional:** Tampilan Google Form standar menurunkan citra prestisius institusi penyelenggara. | **Custom Institutional Portal:** Tampilan web eksklusif dengan identitas resmi sekolah/kampus, banner, jadwal, FAQ, dan interaksi modern. |
| **Panitia Kewalahan Melayani Pertanyaan:** Chat WhatsApp panitia dibanjiri pesan *"Apakah uang saya sudah masuk?"*, *"Kapan kartu ujian keluar?"*. | **Portal Cek Status Mandiri (Self-Service Tracker):** Pendaftar cukup memasukkan Nomor Pendaftaran atau Nomor WhatsApp untuk mengecek status dan mengunduh kartu secara mandiri. |
| **Pembuatan Nomor Ujian Manual:** Panitia harus menyusun nomor peserta dan ruang ujian satu per satu di Excel, rawan nomor ganda dan bentrok sesi. | **Algoritma Kodifikasi Otomatis:** Sistem secara pintar menyusun Nomor Pendaftaran Master (`OMP-2026-0001`) dan Nomor Peserta per Mapel (`02-03-001`) berdasarkan kombinasi level, sesi, dan urutan. |
| **Penerbitan Kartu Ujian Memakan Waktu:** Panitia harus mengetik ulang template Word/Photoshop lalu mencetak atau mengirimkan satu per satu. | **Otomasi Email 2-Tahap Ber-QR Code:** Kartu Ujian Resmi format PDF ter-generate otomatis lengkap dengan dynamic QR Code dan langsung dikirim ke email peserta saat diverifikasi dalam 1 klik. |
| **Biaya Server Mahal & Takut Crash:** Menyewa VPS atau hosting khusus yang mahal dan sering tumbang saat pendaftaran dibuka bersamaan. | **Infrastruktur Bebas Biaya Server (Serverless):** Berjalan di Cloudflare Pages dan Google Apps Script. Mampu menangani ribuan kunjungan bersamaan dengan biaya infrastruktur Rp 0,- / bulan. |
| **Data Terkunci di Database Rumit:** Panitia non-teknis kesulitan mengolah database MySQL/PostgreSQL. | **Sinkron Langsung ke Google Sheets:** Seluruh data tersimpan otomatis di Google Sheets panitia. Panitia bisa melihat, mengedit, memfilter, dan mencetak laporan kapan pun secara langsung. |

---

## 3. Fitur Utama Produk (Core Features Breakdown)

### A. Modul Pendaftar (Public Experience)
1. **Landing Page Institusional & Informasi Acara:**
   - Desain responsif (*mobile-first*, tablet, dan desktop).
   - Informasi lengkap: profil acara, kategori level, mata pelajaran/sesi, total hadiah, tanggal penting, lokasi acara (Google Maps), narahubung resmi, dan FAQ akordeon interaktif.
2. **Formulir Pendaftaran Interaktif:**
   - Validasi data instan (mencegah format email atau nomor WhatsApp salah).
   - Pemilihan mata pelajaran cerdas (bisa mengambil 2 mata pelajaran berbeda sesi sekaligus).
   - Kalkulasi biaya pendaftaran otomatis dan petunjuk nomor rekening resmi.
3. **Generator Dokumen Instan:**
   - **Cetak Formulir Kosong A4:** Membantu peserta/sekolah yang memerlukan berkas pendaftaran fisik untuk arsip internal.
   - **Cetak & Ekspor Bukti Pendaftaran (DOC & PDF):** Peserta langsung dapat menyimpan atau mengunduh surat bukti pendaftaran resmi setelah menekan tombol simpan.
4. **Portal Cek Status Mandiri:**
   - Pencarian real-time menggunakan Nomor Registrasi atau Nomor WhatsApp.
   - Menampilkan status verifikasi panitia (*Menunggu Verifikasi / Terverifikasi*).
   - Tombol unduh/cetak Kartu Ujian Resmi aktif otomatis saat pendaftaran disetujui.

---

### B. Modul Panitia & Administrasi (Admin Experience)
1. **Keamanan Login Berbasis PIN:**
   - Modal autentikasi aman tanpa perlu registrasi akun admin yang rumit.
   - Efek getar visual (*pin-shake*) dan proteksi masukan data invalid.
2. **Dashboard Ringkasan & Analitik Real-Time:**
   - Indikator metrik utama: Total pendaftar, pendaftar Level 1, pendaftar Level 2, dan total peserta per mata pelajaran.
   - Grafik batang visual (*progress bars*) yang menghitung proporsi peserta secara langsung dari Google Sheets.
3. **Manajemen Data Peserta Terintegrasi:**
   - Pencarian instan (*live search*) berdasarkan nama siswa, asal sekolah, atau nomor registrasi.
   - Filter cepat berdasarkan tingkatan kategori dan cabang lomba.
   - **Verifikasi 1-Klik:** Mengubah status peserta menjadi *"Terverifikasi"* dan secara otomatis memicu pengiriman email kartu peserta resmi.
   - **Edit & Hapus Data:** Modal interaktif untuk koreksi data salah ketik (*typo*) tanpa perlu repot mencari baris di spreadsheet.
4. **Pelaporan & Ekspor Data Fleksibel:**
   - **Cetak Rekapitulasi Resmi A4:** Format cetak ber-Kop Surat institusi, rapi, siap untuk tanda tangan pimpinan/kepala sekolah.
   - **Ekspor CSV:** Unduh data lengkap dalam 1 klik untuk backup atau olah data lanjutan di Microsoft Excel.
5. **Integrasi Menu Khusus di Google Sheets:**
   - Terdapat menu khusus (*custom menu*) *"✦ OMEGA PLUS 2026"* di spreadsheet panitia untuk membuka web dialog dan mengelola basis data secara langsung tanpa meninggalkan layar spreadsheet.

---

### C. Sistem Otomasi Email 2-Tahap (Dual-Stage Notifications)
Sistem dilengkapi mesin pengirim email otomatis berstandar institusi (HTML responsif + logo resmi):
1. **Email Tahap 1 (Konfirmasi Pendaftaran Masuk):**
   - Dikirim instan begitu formulir berhasil disubmit.
   - Berisi rincian data peserta, Nomor Registrasi Master, instruksi transfer/pembayaran, dan narahubung panitia.
2. **Email Tahap 2 (Pengesahan & Tiket Ujian Resmi):**
   - Dikirim otomatis begitu panitia menekan tombol *"Verifikasi"* di dashboard admin.
   - Melampirkan **Kartu Peserta Resmi format PDF** lengkap dengan:
     - Kop surat resmi penyelenggara.
     - Nomor Peserta Ujian per mata pelajaran.
     - **Dynamic QR Code** untuk verifikasi dan presensi kehadiran di lokasi ujian menggunakan smartphone panitia.
     - Tata tertib peserta dan jadwal sesi lomba.

---

## 4. Keunggulan Teknis & Nilai Jual Unik (Unique Selling Points)

1. **Nol Biaya Server Bulanan (Zero Hosting Cost):**
   - Menggunakan kombinasi **Cloudflare Pages** (Global CDN) dan **Google Apps Script**. 
   - Klien tidak dibebani biaya langganan VPS/cPanel bulanan atau tahunan. Sangat hemat anggaran kepanitiaan.
2. **Performa Tinggi & Anti-Down (High Concurrency Ready):**
   - Halaman web di-cache pada ribuan edge server Cloudflare di seluruh dunia.
   - Pengoperasian spreadsheet menggunakan metode *Batch Read & Write* (`getValues()` dan `setValues()`), terbukti cepat dan stabil bahkan saat diakses oleh ratusan pendaftar bersamaan.
3. **Kedaulatan & Keamanan Data (100% Client Data Ownership):**
   - Seluruh data peserta tersimpan aman di akun Google Drive / Google Workspace milik klien sendiri. 
   - Tidak ada data yang tersimpan di server pihak ketiga yang tidak dikenal.
4. **Tampilan Visual Menawan & Elegan:**
   - Desain eksklusif (*rich aesthetics*) menggunakan palet warna institusional yang harmonis, tipografi modern (*Plus Jakarta Sans & Work Sans*), glassmorphism, dan transisi halus. Jauh lebih berkelas dibandingkan form umum.

---

## 5. Target Pasar & Skenario Penggunaan (Target Audience & Use Cases)

Sistem ini sangat fleksibel dan dapat diterapkan secara *turnkey* untuk berbagai kebutuhan klien:

1. **Institusi Pendidikan (SD, SMP, SMA, SMK, Perguruan Tinggi):**
   - Olimpiade Sains, Matematika, Bahasa Inggris, dan Seni Tingkat Daerah / Nasional.
   - Penerimaan Peserta Didik Baru (PPDB Online) Mandiri.
   - Pemilihan Duta Sekolah, Student Council, atau Kegiatan Ekskul.
2. **Lembaga Bimbingan Belajar & Kursus (Edutech / Bimbel):**
   - Pendaftaran Try Out Akbar Nasional / UTBK / Kedinasan.
   - Kompetisi beasiswa siswa berprestasi.
3. **Organisasi Kepemudaan, Pramuka, Olahraga, & Instansi Pemerintahan:**
   - Kejuaraan Olahraga (Porseni, Futsal, Catur, E-Sport).
   - Lomba Kepramukaan dan Festival Ilmiah Remaja.
   - Registrasi Seminar Nasional, Konferensi, atau Workshop Kedinasan.

---

## 6. Opsi Paket Penawaran & Skema Kerjasama (Pitching Packages)

Untuk mempermudah penawaran kepada klien, sistem ini dapat dipaketkan ke dalam beberapa tingkatan layanan:

### Paket 1: Standar (Event Ready)
*Cocok untuk: Sekolah / Panitia yang butuh sistem cepat, rapi, dan langsung jalan.*
- Custom Landing Page & Formulir Pendaftaran Online (Responsive Mobile & Desktop).
- Integrasi Google Sheets Database (Batch Processing & Sinkronisasi Cepat).
- Portal Cek Status Pendaftaran Mandiri oleh Peserta.
- Cetak Formulir Kosong A4 & Ekspor Dokumen Bukti Pendaftaran.
- Setup Domain/Subdomain gratis (e.g. `acara-anda.pages.dev`).
- Panduan Operasional Panitia (SOP Singkat).

### Paket 2: Profesional (Paling Diminati / Recommended)
*Cocok untuk: Event bergengsi dengan skala regional/nasional yang membutuhkan branding prestisius & otomasi penuh.*
- **Semua fitur Paket Standar.**
- **Dashboard Admin Lengkap:** Metrik analitik, filter data, live search, edit data, dan hapus peserta.
- **Otomasi Email 2-Tahap:** Email konfirmasi instan + Email pengesahan otomatis.
- **Auto-Generate Kartu Peserta Resmi PDF:** Desain eksklusif lengkap dengan **Dynamic QR Code** untuk presensi hari H.
- **Menu Pintar Google Sheets:** Tombol kendali sistem langsung di dalam spreadsheet.
- Fitur Ekspor Rekapitulasi Data (Cetak Format A4 Resmi & Download CSV).
- Integrasi Custom Domain Klien (e.g. `olimpiade.sekolahanda.sch.id`).
- Pelatihan Panitia & Pendampingan saat Hari Pendaftaran.

### Paket 3: Enterprise / Custom
*Cocok untuk: Acara multi-cabang lomba skala besar, jaringan sekolah, yayasan, atau instansi pemerintahan.*
- **Semua fitur Paket Profesional.**
- Sistem Pembayaran Otomatis / Integrasi Payment Gateway (QRIS, VA Bank Otomatis).
- Modul Ujian CBT (Computer Based Test) atau Integrasi Hasil Nilai Lomba.
- Desain Multi-Kop Surat untuk Cabang Lomba Berbeda.
- Garansi Pendampingan Teknis Khusus (*Dedicated Technical Support*) saat Hari-H Acara.

---

## 7. Timeline Implementasi & Garansi (Delivery & Support)

- **Waktu Pengerjaan:** Cepat, siap tayang dalam **3 hingga 5 hari kerja** setelah data materi (logo, jadwal, biaya, dan rekening) diterima.
- **Garansi Sistem:** Garansi perbaikan *bug/error* selama periode pendaftaran acara berlangsung.
- **Dokumentasi Lengkap:** Disediakan modul petunjuk penggunaan (*User Manual*) untuk panitia, serta sesi demo langsung.

---

## 8. Call to Action (Penutup Pitching)

> *"Tingkatkan prestise acara Anda dan bebaskan panitia dari tumpukan pekerjaan manual. Dengan Sistem Informasi Acara Modern ini, seluruh proses mulai dari pendaftaran, konfirmasi pembayaran, penerbitan kartu ber-QR Code, hingga rekapitulasi data selesai secara otomatis, akurat, dan tanpa biaya server bulanan."*

**Tertarik melihat demo langsung sistem ini?**  
Hubungi kami untuk demonstrasi interaktif atau penyesuaian kebutuhan institusi Anda.
