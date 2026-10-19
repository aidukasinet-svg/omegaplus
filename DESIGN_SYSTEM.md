# DESIGN SYSTEM SPECIFICATION (DESIGN_SYSTEM.MD)
## Brand & UI System: OMEGA PLUS
**SMP Negeri 1 Pamekasan — Olimpiade Akademik SD/MI Se-Madura**

---

## 1. Design Read & Dial Configuration

* **Design Read:**  
  *"Reading this as: Academic competition registration & committee verification portal for SD/MI schools across Madura, with an authoritative, prestigious, and welcoming institutional language, leaning toward SMPN 1 Pamekasan identity (Deep Navy, Royal Blue, Gold Medal Accent) with crisp modern forms and high mobile readability."*

* **The Three Dials:**
  - `DESIGN_VARIANCE: 6` (Kerapian akademis simetris dengan aksen kartu modern)
  - `MOTION_INTENSITY: 4` (Transisi halus, feedback instan, tanpa animasi berlebihan yang mengganggu pengisian formulir)
  - `VISUAL_DENSITY: 5` (Kepadatan seimbang: lapang di mobile untuk sentuhan jari, informatif di desktop untuk admin)

---

## 2. Palet Warna (Color Palette & Tokens)

Palet warna diekstraksi langsung dari identitas resmi SMP Negeri 1 Pamekasan dan prototipe Canva OMEGA PLUS:

```css
:root {
  /* Brand Core Colors */
  --color-primary-navy:     #19365f; /* Header brand, judul utama, navigasi aktif */
  --color-primary-royal:    #285891; /* Tombol primer, aksen aktif, progress bar */
  --color-accent-gold:      #e7b55e; /* Kicker / eyebrow emas, medali, badge prestisius */
  --color-accent-gold-dark: #b88628;

  /* Surface & Background Colors */
  --color-bg-page:          #f5f8fc; /* Latar belakang aplikasi lembut & sejuk */
  --color-bg-surface:       #ffffff; /* Latar belakang card, form, dan modal */
  --color-bg-tint:          #e7f0fb; /* Latar tombol sekunder & highlight baris */
  --color-bg-tint-light:    #f0f5fc;

  /* Typography Colors */
  --color-text-main:        #193047; /* Teks label form, konten tabel, nilai metrik */
  --color-text-muted:       #657c94; /* Subjudul, teks bantuan, placeholder */
  --color-text-inverse:     #ffffff; /* Teks di atas warna primer */

  /* Border & Divider */
  --color-border-subtle:    rgba(25, 54, 95, 0.12);
  --color-border-focus:     #285891;
  --color-border-light:     #e2e8f0;

  /* Status Tokens */
  --color-status-pending-bg:   #fffbeb;
  --color-status-pending-text: #b45309;
  --color-status-pending-bd:   #fde68a;

  --color-status-verified-bg:   #ecfdf5;
  --color-status-verified-text: #047857;
  --color-status-verified-bd:   #a7f3d0;

  --color-status-danger-bg:     #fff0ee;
  --color-status-danger-text:   #a33f39;
  --color-status-danger-bd:     #fecaca;
}
```

---

## 3. Sistem Tipografi (Typography System)

Menggunakan kombinasi Google Fonts berkarakter akademis terpercaya: **Work Sans** (body & form) dan **Arimo** / **Plus Jakarta Sans** (heading & hero).

| Role | Font Family | Size (Mobile) | Size (Desktop) | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Work Sans / Display | 26px (1.625rem) | 34px (2.125rem) | Bold (700) | 1.2 | -0.02em |
| **Hero Subtitle** | Work Sans | 14px (0.875rem) | 17px (1.0625rem)| Regular (400) | 1.4 | normal |
| **Hero Kicker** | Work Sans | 11px (0.6875rem)| 12px (0.75rem)  | Bold (700) | 1.0 | +0.12em (UPPER) |
| **Page / Section Title** | Work Sans | 20px (1.25rem)  | 24px (1.5rem)   | Bold (700) | 1.25 | -0.01em |
| **Section Eyebrow** | Work Sans | 11px (0.6875rem)| 12px (0.75rem)  | Semibold (600)| 1.0 | +0.08em (UPPER) |
| **Metric Large Number** | Work Sans | 26px (1.625rem) | 32px (2.0rem)   | Bold (700) | 1.1 | normal |
| **Form Label** | Work Sans | 13px (0.8125rem)| 14px (0.875rem) | Semibold (600)| 1.3 | normal |
| **Form Input / Value** | Work Sans | 14px (0.875rem) | 15px (0.9375rem)| Regular (400) | 1.5 | normal |
| **Body / Caption** | Work Sans | 13px (0.8125rem)| 14px (0.875rem) | Regular (400) | 1.5 | normal |
| **Micro Copy / Tag** | Work Sans | 11px (0.6875rem)| 12px (0.75rem)  | Medium (500) | 1.3 | normal |

---

## 4. Spacing, Shadow, & Border Radius

```css
:root {
  /* Spacing Scale */
  --space-2xs: 4px;
  --space-xs:  8px;
  --space-sm:  12px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;

  /* Border Radius */
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-pill: 9999px;

  /* Box Shadows */
  --shadow-sm:   0 1px 3px rgba(25, 54, 95, 0.05);
  --shadow-card: 0 4px 16px rgba(25, 54, 95, 0.06), 0 1px 2px rgba(25, 54, 95, 0.04);
  --shadow-lift: 0 10px 25px rgba(25, 54, 95, 0.10);
  --shadow-modal:0 20px 40px rgba(25, 54, 95, 0.20);
}
```

---

## 5. Komponen UI Utama (Component Specifications)

### A. Navigation Tab Pill
- **Default State:** Teks putih pada latar biru gelap, rounded pill `9999px`, padding `10px 20px`, font weight 600.
- **Active State:** Latar putih bersih (`#ffffff`), warna teks navy primer (`#19365f`), transisi halus `200ms ease`.
- **Hover State:** Background `rgba(255, 255, 255, 0.15)`.

### B. Tombol Aksi (Action Buttons)
- **Primary (`.btn-primary`):** Latar `#285891`, teks `#ffffff`, border none, radius `8px`, min height `44px` (touch-target compliance). Efek hover: latar berubah `#1e4472`, translateY(-1px).
- **Secondary (`.btn-secondary`):** Latar `#e7f0fb`, teks `#19365f`, border none, radius `8px`. Efek hover: latar `#d3e4f7`.
- **Danger (`.btn-danger`):** Latar `#fff0ee`, teks `#a33f39`, border `1px solid #fecaca`. Efek hover: latar `#fee2e2`.
- **Outline (`.btn-outline`):** Latar transparan, border `1px solid #285891`, teks `#285891`.

### C. Input Field Formulir
- Tinggi standar: `44px` (input teks, tanggal, dropdown).
- Latar: `#ffffff`, border: `1px solid #cbd5e1`, radius: `8px`, padding horizontal: `14px`.
- Fokus: Border berubah `#285891`, box-shadow `0 0 0 3px rgba(40, 88, 145, 0.18)`, outline none.
- Label bertanda asterik merah `*` untuk field wajib.

### D. Subject Checkbox Selection Cards
Pilihan mata pelajaran dikemas dalam bentuk kartu interaktif yang dapat diklik:
- Status Unchecked: Border `#cbd5e1`, latar `#ffffff`.
- Status Checked: Border `#285891`, latar `#e7f0fb`, centang tebal `#285891`.

### E. Metric Stat Card (7 Cards Dashboard)
- Latar: `#ffffff`, radius: `12px`, padding: `18px 20px`, border: `1px solid rgba(25, 54, 95, 0.08)`.
- Nilai angka: `32px`, font-weight 700, warna `#19365f`.
- Label bawah: `13px`, warna `#657c94`.
- Efek hover: Elevasi halus ke atas 2px dengan shadow bertambah.

### F. Bar Distribusi (Progress Chart)
- Background track: `#e2e8f0`, tinggi `12px`, radius `9999px`.
- Fill bar: Gradient `#285891` to `#19365f`, transisi lebar animasi saat halaman dibuka (`width 600ms cubic-bezier(0.4, 0, 0.2, 1)`).

### G. Status Pill (Badge)
- `Menunggu Verifikasi`: Latar `#fffbeb`, teks `#b45309`, border `#fde68a`, dot indikator kuning berdenyut lembut.
- `Terverifikasi`: Latar `#ecfdf5`, teks `#047857`, border `#a7f3d0`, ikon centang hijau.
- `Ditolak`: Latar `#fff0ee`, teks `#a33f39`, border `#fecaca`.

---

## 6. Strategi Responsif & Grid Breakpoints

```
[ Extra Small / Mobile Portrait ]   < 640px    : 1 Kolom Penuh, Navigasi Scroll / Stack, Tombol Lebar Penuh
[ Small / Mobile Landscape ]        640px+     : 2 Kolom Formulir Sederhana
[ Medium / Tablet Portrait ]        768px+     : 2 Kolom Formulir Lengkap, Grid Metrik 4 Kolom
[ Large / Tablet Landscape & Lap ]  1024px+    : Grid Metrik 7 Kolom, Baris Grafik Bersisian
[ Extra Large / Desktop Full HD ]   1280px+    : Max Container 1200px terpusat (Center aligned)
```

---

## 7. Desain Spesifik Cetak Dokumen (@media print)

Untuk pencetakan Bukti Pendaftaran, Kartu Ujian, dan Formulir Kosong:
1. Sembunyikan elemen navigasi (`nav`), tombol aksi (`.btn`), dan footer aplikasi.
2. Set ukuran halaman cetak: `@page { size: A4 portrait; margin: 15mm 20mm; }`.
3. Gunakan warna hitam legam (`#000000`) dan abu-abu kontras tinggi untuk efisiensi tinta printer.
4. Tampilkan kop resmi lengkap SMP Negeri 1 Pamekasan dengan garis ganda pemisah.
5. Sediakan kotak pasfoto `3x4 cm`, area tanda tangan peserta, dan tanda tangan panitia lomba.
