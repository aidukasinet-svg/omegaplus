# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Sistem Informasi Pendaftaran OMEGA PLUS
**Penyelenggara: SMP Negeri 1 Pamekasan**  
**Tingkat: Olimpiade Akademik SD/MI Se-Madura (Matematika, Bahasa Inggris, IPA, IPS)**

---

## 1. Ringkasan Produk & Latar Belakang

OMEGA PLUS merupakan ajang olimpiade akademik bergengsi tingkat SD/MI se-Madura yang diselenggarakan oleh **SMP Negeri 1 Pamekasan**. Untuk memodernisasi proses pendaftaran yang sebelumnya manual atau semi-digital, dibangun sebuah sistem berbasis web application mandiri yang terintegrasi langsung dengan Google Apps Script dan Google Sheets sebagai database utama.

Sistem ini melayani 2 peran utama:
1. **Pendaftar (Peserta / Orang Tua / Guru Pendamping):** Mengisi formulir online yang responsif, memilih tingkatan level dan mata pelajaran yang diikuti, mengunduh bukti pendaftaran langsung, memantau status pendaftaran secara mandiri, serta menerima email konfirmasi otomatis berisi surat panduan panitia dan kartu peserta resmi (PDF).
2. **Admin (Panitia OMEGA PLUS SMPN 1 Pamekasan):** Memantau metrik pendaftaran secara realtime (total pendaftar, sebaran per level, sebaran per mata pelajaran), memverifikasi data dan bukti pendaftaran, mengubah status pendaftaran yang otomatis mentrigger pengiriman email berkartu peserta resmi ber-QR Code, mengedit data peserta, dan mengekspor laporan ke format PDF, DOC, dan CSV.

---

## 2. Aturan Bisnis & Logika Penomoran (Core Business Rules)

Berdasarkan dokumen teknis dan tangkapan layar sistem panitia, aturan penomoran dan kodifikasi adalah sebagai berikut:

### A. Format Nomor Pendaftaran Utama (Master Registration ID)
* Format: `OMP-[TAHUN]-[NOMOR_URUT_4_DIGIT]`
* Contoh: `OMP-2026-0001`, `OMP-2026-0002`
* Dibuat otomatis saat formulir disubmit dan menjadi kunci unik pencarian peserta.

### B. Format Nomor Peserta per Mata Pelajaran (Subject Exam Code)
Setiap peserta yang mendaftar pada satu atau lebih mata pelajaran akan memperoleh nomor peserta ujian spesifik untuk masing-masing mapel yang dipilih, dengan rumus 3 segmen:
$$\text{KODE} = \mathbf{XX - YY - ZZZ}$$

| Segmen | Arti | Nilai & Keterangan |
| :--- | :--- | :--- |
| **Segmen 1 (XX)** | **Tingkatan Level** | `01` = Level 1 (SD/MI Kelas 1, 2, 3)<br>`02` = Level 2 (SD/MI Kelas 4, 5, 6) |
| **Segmen 2 (YY)** | **Pilihan Mapel** | `01` = Matematika<br>`02` = Bahasa Inggris<br>`03` = IPA<br>`04` = IPS |
| **Segmen 3 (ZZZ)** | **Nomor Urut Mapel** | `001`, `002`, `003`, dst. (Auto-increment per kombinasi Level & Mapel) |

**Contoh Kasus:**
Jika peserta *Amalia Utami* (Level 2) mendaftar untuk **IPA** dan **Bahasa Inggris**:
- Nomor Pendaftaran Master: `OMP-2026-0001`
- Nomor Peserta IPA: `02-03-001`
- Nomor Peserta Bahasa Inggris: `02-02-001`

### C. Siklus Status Pendaftaran (Registration Status Lifecycle)
1. **`Menunggu Verifikasi` (Default):** Status awal saat data baru masuk melalui form pendaftaran. Peserta otomatis menerima Email Tahap 1 berisi surat pengantar panitia dan bukti pendaftaran sementara.
2. **`Terverifikasi`:** Panitia telah memeriksa dan menyetujui data/pembayaran peserta. Perubahan status ini otomatis mengirimkan Email Tahap 2 berisi **Kartu Peserta Resmi PDF** lengkap dengan QR Code validasi dan petunjuk hari H.
3. **`Ditolak / Perlu Perbaikan`:** Jika data tidak sesuai atau berkas bukti tidak sah. Email pemberitahuan dikirimkan beserta catatan panitia agar peserta dapat melengkapi.

---

## 3. Spesifikasi Kebutuhan Fungsional (Functional Requirements)

### Modul 1: Formulir Pendaftaran Publik (Pendaftar)
* **F-01:** Menampilkan landing page dengan identitas visual SMP Negeri 1 Pamekasan, branding OMEGA PLUS, dan navigasi yang adaptif di smartphone, tablet, maupun layar desktop.
* **F-02:** Field formulir:
  1. `Nama Peserta` (Wajib, teks kapital/title case)
  2. `Asal Sekolah (SD/MI)` (Wajib, teks)
  3. `Tanggal Pendaftaran` (Wajib, default ke tanggal hari ini)
  4. `Nomor HP / WhatsApp` (Wajib, validasi format telepon Indonesia e.g. `08xxxxxxxxxx`)
  5. `Email Peserta / Guru Pendamping` (Wajib, validasi format email resmi untuk pengiriman dokumen PDF)
  6. `Tingkatan Olimpiade` (Wajib, Dropdown: `Pilih level`, `Level 1 (Kelas 1-3)`, `Level 2 (Kelas 4-6)`)
  7. `Jenis Mata Pelajaran` (Wajib minimal 1 pilihan checkbox: `Matematika`, `Bahasa Inggris`, `IPA`, `IPS`)
* **F-03:** Validasi sisi klien (instant feedback jika ada field kosong) dan sisi backend (mencegah duplikasi atau inject data invalid).
* **F-04:** Aksi tombol formulir:
  - `SIMPAN PENDAFTARAN` (Primary action, loading state interaktif, trigger data ke spreadsheet dan pengiriman email otomatis).
  - `RESET FORMULIR` (Mengosongkan isian form kembali ke default).
  - `CETAK FORMULIR KOSONG` (Membuka dialog cetak format A4 formulir pendaftaran fisik untuk keperluan offline).
  - `CETAK BUKTI PENDAFTARAN` (Mencetak langsung tanda bukti pendaftaran terakhir yang disubmit).
  - `EKSPOR PDF` (Mengunduh bukti pendaftaran format file PDF).
  - `EKSPOR DOC` (Mengunduh bukti pendaftaran format dokumen Word).
  - `KEMBALI KE DASHBOARD` (Navigasi kembali ke halaman utama / dashboard).

### Modul 2: Cek Status Pendaftaran Mandiri (Pendaftar)
* **F-05:** Fitur pencarian pendaftaran menggunakan `Nomor Pendaftaran` (e.g. `OMP-2026-0001`) atau `Nomor HP/WA`.
* **F-06:** Menampilkan status terkini pendaftaran (`Menunggu Verifikasi` / `Terverifikasi` / `Perlu Perbaikan`), rincian mapel yang diambil, dan tombol unduh kartu peserta jika sudah terverifikasi.

### Modul 3: Dashboard Panitia & Manajemen Data (Admin)
* **F-07:** Akses aman Admin dilindungi dengan PIN / Passcode terenkripsi (disimpan di Sheet `PENGATURAN`).
* **F-08:** Widget Ringkasan Metrik (7 Kartu Angka Realtime sesuai tangkapan layar):
  1. *Total Peserta*
  2. *Peserta Level 1*
  3. *Peserta Level 2*
  4. *Peserta Matematika*
  5. *Peserta Bahasa Inggris*
  6. *Peserta IPA*
  7. *Peserta IPS*
* **F-09:** Visualisasi Sebaran Berbasis Progress Bar:
  - Distribusi Peserta berdasarkan Level (Level 1 vs Level 2)
  - Distribusi Peserta berdasarkan Mata Pelajaran (Matematika, Bahasa Inggris, IPA, IPS)
* **F-10:** Manajemen Tabel Data Peserta:
  - Pencarian instan (Live search by nama, nomor pendaftaran, atau asal sekolah).
  - Filter interaktif berdasarkan Level (`Semua`, `Level 1`, `Level 2`).
  - Filter interaktif berdasarkan Mapel (`Semua`, `Matematika`, `Bahasa Inggris`, `IPA`, `IPS`).
  - Pengurutan data (Terbaru, Terlama, Nama A-Z, Nama Z-A).
  - Tombol Aksi per baris: `Lihat Detail`, `Verifikasi Status`, `Edit Data`, `Cetak Bukti`, `Hapus`.
* **F-11:** Modal Edit Peserta & Dialog Konfirmasi Hapus Data dengan peringatan keamanan.

### Modul 4: Pusat Laporan & Ekspor (Admin)
* **F-12:** `CETAK SELURUH PESERTA` (Print preview tabel daftar induk seluruh peserta format A4).
* **F-13:** `EKSPOR REKAP PDF` (Unduh dokumen rekapitulasi data pendaftar).
* **F-14:** `EKSPOR REKAP DOC` (Unduh rekapitulasi format Word table).
* **F-15:** `EKSPOR CSV` (Unduh file CSV untuk integrasi Canva Sheets atau arsip data Excel).

### Modul 5: Mesin Otomasi Email & PDF (Apps Script Backend)
* **F-16:** Email 1: Konfirmasi Registrasi Masuk:
  - Subjek: `[OMEGA PLUS 2026] Konfirmasi Pendaftaran - {{NAMA_PESERTA}} ({{NO_PENDAFTARAN}})`
  - Template HTML elegan responsif dengan kop SMP Negeri 1 Pamekasan.
  - Lampiran 1: *Surat_Info_Panitia_OMEGA_PLUS_2026.pdf*.
  - Lampiran 2: *Bukti_Pendaftaran_{{NO_PENDAFTARAN}}.pdf*.
* **F-17:** Email 2: Pendaftaran Terverifikasi & Kartu Peserta:
  - Subjek: `[RESMI] Kartu Peserta OMEGA PLUS 2026 - {{NAMA_PESERTA}} ({{NO_PENDAFTARAN}})`
  - Diberikan saat Admin memverifikasi pendaftaran.
  - Lampiran: *Kartu_Peserta_Resmi_{{NO_PENDAFTARAN}}.pdf* dengan QR Code verifikasi presensi.

---

## 4. Struktur Database Google Spreadsheet

### Sheet 1: `PESERTA`
| Kolom | Nama Field | Tipe Data | Keterangan & Aturan |
| :--- | :--- | :--- | :--- |
| A | `Timestamp` | Datetime | Waktu pengisian form (ISO format) |
| B | `No_Pendaftaran` | String | Format `OMP-2026-XXXX` (Unique Key) |
| C | `Nama_Peserta` | String | Nama lengkap peserta |
| D | `Asal_Sekolah` | String | Nama SD/MI |
| E | `Tanggal_Daftar` | Date | Tanggal pendaftaran (YYYY-MM-DD) |
| F | `Nomor_HP` | String | Nomor HP/WhatsApp aktif |
| G | `Email` | String | Email untuk notifikasi & pengiriman PDF |
| H | `Level` | String | `Level 1` atau `Level 2` |
| I | `Mata_Pelajaran` | String | Koma terpisah, misal: `IPA, Bahasa Inggris` |
| J | `Kode_Peserta_Mapel` | String | Kode peserta per mapel, misal: `02-03-001, 02-02-001` |
| K | `Status_Verifikasi` | String | `Menunggu Verifikasi`, `Terverifikasi`, `Ditolak` |
| L | `Catatan_Panitia` | String | Catatan verifikator panitia |
| M | `Waktu_Verifikasi` | Datetime | Timestamp saat admin memverifikasi |
| N | `Status_Email_Kirim` | String | `Terkirim (Tahap 1)`, `Terkirim (Tahap 2)` |

### Sheet 2: `PENGATURAN`
| Kolom | Parameter | Nilai Default | Keterangan |
| :--- | :--- | :--- | :--- |
| A | `Nama_Event` | `OMEGA PLUS 2026` | Nama resmi olimpiade |
| B | `Penyelenggara` | `SMP Negeri 1 Pamekasan` | Instansi pelaksana |
| C | `Tahun` | `2026` | Tahun pelaksanaan lomba |
| D | `Admin_PIN` | `123456` | Kredensial masuk portal admin (dapat diubah) |
| E | `Email_Pengirim` | `panitia.omegaplus@gmail.com` | Sender display name |
| F | `Kontak_WA_Panitia` | `081234567890` | Nomor layanan helpdesk panitia |
| G | `Drive_Folder_ID` | `[ID_FOLDER_GOOGLE_DRIVE]` | Folder penyimpanan arsip PDF kartu |

---

## 5. Wireframe Berbasis ASCII (ASCII Wireframes)

### Wireframe 1: Header & Navigasi Utama (Desktop & Mobile)

```
+------------------------------------------------------------------------------------+
|  [LOGO SMPN 1]  SMP NEGERI 1 PAMEKASAN                                             |
|                 Penyelenggara OMEGA PLUS                                           |
|                                                                                    |
|                 AJANG PRESTASI SE-MADURA                                           |
|                 OMEGA PLUS                                      [ 🗂️  🏅  🏆  ✏️  Σ ] |
|                 OLIMPIADE MATEMATIKA, BAHASA INGGRIS, IPA, DAN IPS                 |
|                 Olimpiade Akademik SD/MI Se-Madura                                 |
|                                                                                    |
|  [ Formulir Pendaftaran ]  [ Cek Status ]  [ Dashboard Panitia ]  [ Data Peserta ] |
+------------------------------------------------------------------------------------+
```

### Wireframe 2: Tampilan Formulir Pendaftaran (Public)

```
+------------------------------------------------------------------------------------+
|  PENDAFTARAN PESERTA                                                               |
|  Formulir Pendaftaran                                                              |
|  Lengkapi identitas peserta dan pilih satu atau beberapa mata pelajaran.           |
|                                                                                    |
|  Nama Peserta *                             Asal Sekolah (SD/MI) *                 |
|  [ Contoh: Amalia Utami                 ]   [ Contoh: SDN Generasi Emas        ]   |
|                                                                                    |
|  Tanggal Pendaftaran *                      Nomor HP / WhatsApp *                  |
|  [ 20/10/2026                         📅]   [ Contoh: 081234567890             ]   |
|                                                                                    |
|  Alamat Email Aktif (Untuk Kirim Bukti & Kartu Peserta PDF) *                      |
|  [ Contoh: amalia.utami@gmail.com                                              ]   |
|                                                                                    |
|  Tingkatan Olimpiade *                                                             |
|  [ Pilih level                                                               v ]   |
|    - Level 1 (Kelas 1 - 3 SD/MI)                                                   |
|    - Level 2 (Kelas 4 - 6 SD/MI)                                                   |
|                                                                                    |
|  Jenis Mata Pelajaran * (Dapat memilih lebih dari satu)                            |
|  [ ] Matematika                             [ ] Bahasa Inggris                     |
|  [ ] IPA                                    [ ] IPS                                |
|                                                                                    |
|  +------------------------------------------------------------------------------+  |
|  | [ SIMPAN PENDAFTARAN ]   [ RESET FORMULIR ]   [ CETAK FORMULIR KOSONG ]      |  |
|  | [ CETAK BUKTI ]  [ EKSPOR PDF ]  [ EKSPOR DOC ]  [ KEMBALI KE DASHBOARD ]    |  |
|  +------------------------------------------------------------------------------+  |
|  * Bukti menggunakan pendaftaran terakhir yang disimpan atau peserta yang dipilih  |
+------------------------------------------------------------------------------------+
```

### Wireframe 3: Layout Cetak Bukti Pendaftaran (A4 Standard)

```
+------------------------------------------------------------------------------------+
|                                                                                    |
|                           BUKTI PENDAFTARAN OMEGA PLUS                             |
|               Olimpiade Matematika, Bahasa Inggris, IPA, dan IPS                   |
|                                SD/MI Se-Madura                                     |
|                      Penyelenggara: SMP Negeri 1 Pamekasan                         |
|------------------------------------------------------------------------------------|
|  Nomor Pendaftaran       |  OMP-2026-0001                                          |
|  Nama Peserta            |  AMALIA UTAMI                                           |
|  Asal Sekolah            |  SDN GENERASI EMAS                                      |
|  Tanggal Pendaftaran     |  19 Oktober 2026                                        |
|  Nomor HP / WhatsApp     |  081234567890                                           |
|  Alamat Email            |  amalia.utami@gmail.com                                 |
|  Level                   |  Level 2 (Kelas 4 - 6)                                  |
|  Mata Pelajaran          |  IPA, Bahasa Inggris                                    |
|  Kode Peserta per Mapel  |  IPA: 02-03-001                                         |
|                          |  Bahasa Inggris: 02-02-001                              |
|  Status Pendaftaran      |  MENUNGGU VERIFIKASI PANITIA                            |
|------------------------------------------------------------------------------------|
|                                                                                    |
|  Catatan untuk Peserta:                                                            |
|  1. Simpan tanda bukti ini sebagai bukti sah pendaftaran.                          |
|  2. Panitia akan memverifikasi berkas dalam waktu 1x24 jam.                        |
|  3. Kartu Ujian Resmi ber-QR Code akan dikirim ke email peserta setelah verifikasi.|
|                                                                                    |
|                                                         Pamekasan, 19 Oktober 2026 |
|                                                         Panitia OMEGA PLUS         |
|                                                                                    |
|                                                         ( _______________________ )|
+------------------------------------------------------------------------------------+
```

### Wireframe 4: Dashboard Ringkasan Panitia (Admin View)

```
+------------------------------------------------------------------------------------+
|  Tersinkron ke Google Sheets                                                       |
|  RINGKASAN PENDAFTARAN                                                             |
|  Dashboard Panitia                                             [ + Daftarkan Peserta ]
|                                                                                    |
|  +-------------+ +-------------+ +-------------+ +-------------+                   |
|  |      3      | |      1      | |      2      | |      0      |                   |
|  | Total psta  | |   Level 1   | |   Level 2   | | Matematika  |                   |
|  +-------------+ +-------------+ +-------------+ +-------------+                   |
|  +-------------+ +-------------+ +-------------+                                   |
|  |      1      | |      3      | |      0      |                                   |
|  |  B. Inggris | |     IPA     | |     IPS     |                                   |
|  +-------------+ +-------------+ +-------------+                                   |
|                                                                                    |
|  +----------------------------------+  +----------------------------------+        |
|  | Peserta berdasarkan level        |  | Pilihan mata pelajaran           |        |
|  | Level 1  [======              ] 1|  | Matematika    [                ] 0|       |
|  | Level 2  [============        ] 2|  | B. Inggris    [======          ] 1|       |
|  |                                  |  | IPA           [================] 3|       |
|  |                                  |  | IPS           [                ] 0|       |
|  +----------------------------------+  +----------------------------------+        |
+------------------------------------------------------------------------------------+
```

### Wireframe 5: Manajemen Data Peserta & Filter (Admin View)

```
+------------------------------------------------------------------------------------+
|  Data Peserta                                                                      |
|  Cari, periksa, dan kelola pendaftaran peserta.                                    |
|                                                                                    |
|  Cari peserta / sekolah:             Filter Level:         Filter Mapel:           |
|  [🔍 Ketik nama, sekolah, no. reg  ] [ Semua Level     v ] [ Semua Mapel       v ] |
|                                                                                    |
|  [ EKSPOR REKAP PDF ]  [ EKSPOR REKAP DOC ]  [ EKSPOR CSV ]  [ CETAK SELURUH DATA ]|
|                                                                                    |
|  +--------------+---------------+------------------+-------+---------+-----------+ |
|  | No. Reg      | Nama Peserta  | Asal Sekolah     | Level | Mapel   | Status    | |
|  +--------------+---------------+------------------+-------+---------+-----------+ |
|  | OMP-2026-001 | AMALIA UTAMI  | SDN GENERASI...  | Lvl 2 | IPA, B.I| TERVERIF  | |
|  |              |               |                  |       | [Aksi: 👁️ ✏️ 🖨️ ❌] | |
|  | OMP-2026-002 | BUDI PRASETYO | SDN BARURAMBAT 1 | Lvl 1 | MAT     | PENDING   | |
|  |              |               |                  |       | [Aksi: 👁️ ✏️ 🖨️ ❌] | |
|  +--------------+---------------+------------------+-------+---------+-----------+ |
+------------------------------------------------------------------------------------+
```

### Wireframe 6: Kartu Peserta Resmi Ber-QR Code (PDF Output Email Tahap 2)

```
+------------------------------------------------------------------------------------+
|  +--------------+  KARTU PESERTA RESMI - OMEGA PLUS 2026                           |
|  |  LOGO SMPN1  |  OLIMPIADE MATEMATIKA, B. INGGRIS, IPA & IPS SE-MADURA           |
|  +--------------+  SMP NEGERI 1 PAMEKASAN                                          |
|------------------------------------------------------------------------------------|
|  Nomor Registrasi   : OMP-2026-0001                                                |
|  Nama Lengkap       : AMALIA UTAMI                      +-----------------------+  |
|  Asal Sekolah       : SDN GENERASI EMAS                 |   [ QR CODE RESMI ]   |  |
|  Tingkatan Level    : Level 2 (Kelas 4 - 6)             |  Scan untuk Validasi  |  |
|                                                         |  Kehadiran di Lokasi  |  |
|  JADWAL & NOMOR PESERTA UJIAN:                          +-----------------------+  |
|  +--------------------+-------------------+--------------------+                   |
|  | Mata Pelajaran     | Nomor Peserta     | Ruang & Sesi       |                   |
|  +--------------------+-------------------+--------------------+                   |
|  | IPA                | 02-03-001         | Lab IPA / Sesi 1   |                   |
|  | Bahasa Inggris     | 02-02-001         | Ruang 04 / Sesi 2  |                   |
|  +--------------------+-------------------+--------------------+                   |
|                                                                                    |
|  Tanda Tangan Peserta,                                  Pamekasan, Panitia Ujian,  |
|                                                                                    |
|  ( __________________ )                                 ( _______________________ )|
+------------------------------------------------------------------------------------+
```

---

## 6. Kebutuhan Non-Fungsional (Non-Functional Requirements)

1. **Kompatibilitas Layar Penuh (Fluid Responsiveness):**
   - Breakpoint Mobile: `360px` - `480px` (Single column, tombol touch-friendly min 48px).
   - Breakpoint Tablet: `768px` - `1024px` (Adaptive 2-column grid, table horizontal scroll).
   - Breakpoint Desktop: `1200px` - `1920px` (Full dashboard canvas).
2. **Kinerja & Kecepatan:**
   - Single bundle deployment via Apps Script `HtmlService.createHtmlOutput()`.
   - Asset font dan ikon menggunakan SVG murni dan Google Web Fonts (Work Sans / Arimo) dengan fallback sistem instan tanpa layout shift.
3. **Penyimpanan & Keamanan:**
   - Spreadsheet terlindungi dari edit langsung publik. Seluruh transaksi data melalui endpoint Apps Script dengan otentikasi role-based.
   - Admin session disimpan aman dalam memory browser / secure session token.
4. **Reliabilitas Pengiriman Email:**
   - Fallback logging: Setiap email yang berhasil maupun gagal dicatat di sheet `LOG_EMAIL` untuk audit trail panitia.
