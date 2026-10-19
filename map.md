# PETA ARSITEKTUR & ALUR SISTEM (MAP.MD)
## Aplikasi Web Form Pendaftaran OMEGA PLUS
**Penyelenggara: SMP Negeri 1 Pamekasan | Sasaran: Siswa SD/MI Se-Madura**

---

### 1. Desain Arsitektur Sistem (High-Level Architecture)

Aplikasi dibangun menggunakan ekosistem **Google Workspace Platform** (Google Apps Script + Google Sheets + Google Drive + Gmail Service) yang menyajikan antarmuka Single Page Application (SPA) responsif modern tanpa ketergantungan server berbayar (Zero-Cost Infrastructure).

```mermaid
graph TD
    subgraph Klien / Browser
        LP[Landing Page & Navigasi]
        REG[Formulir Pendaftaran]
        TRK[Cek Status Pendaftaran]
        ADM[Dashboard & Manajemen Panitia]
    end

    subgraph Google Apps Script (Backend Core)
        CTRL[GAS Controller / doGet - doPost]
        AUTH[Admin Authenticator / PIN Engine]
        VAL[Validator & Number Generator]
        PDF_GEN[PDF Generator Engine]
        MAIL_ENG[Email Notification Engine]
    end

    subgraph Google Cloud / Workspace Database
        SS[(Google Spreadsheet Database)]
        DRIVE[(Google Drive: Assets & PDF Cache)]
        GMAIL[Gmail / MailApp Service]
    end

    LP --> REG
    LP --> TRK
    LP --> ADM

    REG -->|Submit Data via AJAX/Fetch| CTRL
    TRK -->|Query No. Pendaftaran| CTRL
    ADM -->|Kelola & Verifikasi Data| CTRL

    CTRL --> AUTH
    CTRL --> VAL
    VAL -->|Tulis Baris Baru| SS
    CTRL -->|Query & Update Status| SS

    VAL -->|Trigger Saat Daftar| MAIL_ENG
    AUTH -->|Trigger Saat Verifikasi| PDF_GEN
    PDF_GEN -->|Simpan Bukti & Kartu| DRIVE
    PDF_GEN --> MAIL_ENG
    MAIL_ENG -->|Kirim Email + Lampiran PDF| GMAIL
```

---

### 2. User Journey & Alur Pengguna (User Flow)

#### A. Alur Pendaftar (Peserta / Orang Tua / Guru Pendamping)

```mermaid
sequenceDiagram
    autonumber
    actor Pendaftar as Peserta / Guru Pendamping
    participant Web as Web App OMEGA PLUS
    participant Server as Google Apps Script
    participant DB as Google Sheets
    participant Mail as Gmail Engine

    Pendaftar->>Web: Buka URL Pendaftaran
    Web-->>Pendaftar: Tampilkan Landing Page & Form Responsif
    Pendaftar->>Web: Isi Identitas (Nama, Sekolah, No HP/WA, Email)
    Pendaftar->>Web: Pilih Level (Level 1 / Level 2)
    Pendaftar->>Web: Pilih Mapel (Matematika, B. Inggris, IPA, IPS)
    Pendaftar->>Web: Klik "SIMPAN PENDAFTARAN"
    
    Web->>Server: Kirim Payload Registrasi
    Server->>Server: Generate No Registrasi (OMP-2026-XXXX)
    Server->>Server: Generate Kode Mapel (e.g. 02-01-001)
    Server->>DB: Catat Baris Baru (Status: "Menunggu Verifikasi")
    
    Server->>Mail: Kirim Email 1: "Konfirmasi Pendaftaran Diterima"
    Note over Mail,Pendaftar: Lampiran: Surat Informasi Panitia PDF & Bukti Pendaftaran Sementara
    Mail-->>Pendaftar: Email Notifikasi Masuk ke Inbox Peserta
    
    Server-->>Web: Respon Sukses + Data Registrasi Lengkap
    Web-->>Pendaftar: Tampilkan Modal Sukses & Tombol Cetak Langsung
```

#### B. Alur Admin / Panitia Lomba

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Panitia SMPN 1 Pamekasan
    participant Web as Portal Admin
    participant Server as Google Apps Script
    participant DB as Google Sheets
    participant Mail as Gmail Engine

    Admin->>Web: Masuk Tab Admin / Dashboard
    Admin->>Web: Input PIN Keamanan Admin
    Web->>Server: Validasi Kredensial PIN
    Server-->>Web: Berikan Sesi Akses Admin
    
    Web->>Server: Ambil Data Ringkasan & Tabel Peserta
    Server->>DB: Query Aggregasi & Record Peserta
    DB-->>Server: Return Data Peserta
    Server-->>Web: Render Dashboard Metrik & Tabel Interaktif
    
    Admin->>Web: Review Dokumen & Bukti Bayar / Data
    alt Verifikasi Diterima
        Admin->>Web: Klik "Verifikasi Pendaftaran"
        Web->>Server: Update Status -> "Terverifikasi"
        Server->>DB: Simpan Status Baru & Timestamp Verifikasi
        Server->>Server: Generate Kartu Peserta Resmi PDF + QR Code Validasi
        Server->>Mail: Kirim Email 2: "Pendaftaran Terverifikasi"
        Note over Mail,Admin: Lampiran: Kartu Peserta Resmi PDF & Panduan Pelaksanaan Lomba
    else Data Perlu Perbaikan / Ditolak
        Admin->>Web: Klik "Tolak / Minta Revisi" + Catatan
        Web->>Server: Update Status -> "Ditolak / Perlu Revisi"
        Server->>Mail: Kirim Email Notifikasi Revisi
    end
    
    Admin->>Web: Ekspor Rekap (PDF / DOC / CSV / Cetak Seluruh Peserta)
```

---

### 3. Struktur Route & Hierarki Tampilan (SPA View Hierarchy)

Aplikasi dirancang sebagai **Single Page Application** ultra-ringan dengan routing berbasis state internal di browser:

```
[ Root App: index.html ]
├── Header & Brand Bar
│   ├── Logo SMP Negeri 1 Pamekasan
│   ├── Judul: OMEGA PLUS
│   ├── Subtitle: Olimpiade Akademik SD/MI Se-Madura
│   └── Tab Navigasi:
│       ├── [Tab 1] Formulir Pendaftaran (Public)
│       ├── [Tab 2] Cek Status Pendaftaran (Public)
│       ├── [Tab 3] Dashboard Panitia (Admin Only)
│       ├── [Tab 4] Data Peserta (Admin Only)
│       └── [Tab 5] Laporan & Ekspor (Admin Only)
│
├── Container Konten Dinamis
│   ├── View: Formulir Pendaftaran (Form Input, Level, Multiple Mapel Checkbox, Action Buttons)
│   ├── View: Bukti Pendaftaran / Modal Cetak (Layout Kertas A4 Standar)
│   ├── View: Cek Status (Pencarian via No. Pendaftaran / No. HP / Email)
│   ├── View: Login Admin Modal (Input PIN Keamanan)
│   ├── View: Dashboard Panitia (7 Metric Cards, 2 Chart Progress Bars)
│   ├── View: Data Peserta (Pencarian Realtime, Filter Level, Filter Mapel, Tabel Interaktif)
│   ├── View: Modal Edit Peserta & Modal Konfirmasi Hapus
│   └── View: Laporan & Ekspor (Ekspor CSV, PDF Rekap, DOC Rekap, Cetak Blank Form)
│
└── Footer Bar
    ├── Identitas: "OMEGA PLUS · Semangat berprestasi, tumbuh bersama. ✦"
    └── Status Sinkronisasi Realtime dengan Spreadsheet
```

---

### 4. Skema Database Google Spreadsheet

Google Sheets bertindak sebagai RDBMS dengan 4 lembar kerja (Sheets):

```
Google Spreadsheet: [ DATABASE_OMEGA_PLUS_2026 ]
├── Sheet 1: "PESERTA" (Master Data Pendaftaran)
├── Sheet 2: "PENGATURAN" (Konfigurasi Event, Kuota, Kontak, PIN Admin)
├── Sheet 3: "LOG_EMAIL" (Audit Trail Pengiriman Email Notifikasi)
└── Sheet 4: "LOG_AKTIVITAS" (Audit Log Perubahan Status oleh Admin)
```

---

### 5. Pipeline Notifikasi Email & Generator PDF

1. **Email Stage 1: Pendaftaran Masuk (Immediate Trigger)**
   - **Trigger:** Sesaat setelah form pendaftaran disubmit dan tervalidasi.
   - **Penerima:** Alamat email peserta/guru pendamping yang diinput.
   - **Isi Email:** Ucapan terima kasih, detail pendaftaran, rincian nomor urut peserta tiap mata pelajaran, petunjuk pembayaran/tahapan verifikasi.
   - **Lampiran PDF 1:** *Surat_Informasi_Panitia_OmegaPlus.pdf* (Jadwal, tata tertib, kontak panitia).
   - **Lampiran PDF 2:** *Bukti_Pendaftaran_Sementara_[NoReg].pdf*.

2. **Email Stage 2: Verifikasi Admin (Admin Action Trigger)**
   - **Trigger:** Ketika panitia mengklik tombol "Verifikasi" di dashboard admin.
   - **Penerima:** Alamat email peserta.
   - **Isi Email:** Pemberitahuan bahwa berkas pendaftaran telah diverifikasi sah.
   - **Lampiran PDF:** *Kartu_Peserta_Resmi_[NoReg].pdf* yang memuat:
     * Pasfoto placeholder / box tanda tangan peserta.
     * QR Code verifikasi kehadiran saat hari H lomba.
     * Nomor peserta per mata pelajaran sesuai aturan sistem koding lomba.
