/**
 * =========================================================================
 * KONFIGURASI GLOBAL FRONTEND - OMEGA PLUS 2026
 * SMP NEGERI 1 PAMEKASAN
 * =========================================================================
 * File: config.js
 */

const CONFIG = {
  // Bila di-deploy di Cloudflare Pages, gunakan '/api' (diteruskan via _worker.js)
  // Bila dibuka secara lokal (file://), Anda dapat memasukkan URL langsung Google Apps Script Web App
  API_URL: window.location.protocol === 'file:' 
    ? 'https://script.google.com/macros/s/AKfycbwsvjH5vK-g5UJF0sI4knpOal8jdGzYC6Z82lP0ecXW2yWGA4wIKmtoa4YRNXgz-g13vg/exec' 
    : '/api',

  // Informasi Event dari Brosur Resmi
  EVENT_NAME: "OMEGA PLUS 2026",
  SUBTITLE: "Olimpiade Matematika, Bahasa Inggris, IPA, dan IPS",
  ORGANIZER: "SMP Negeri 1 Pamekasan",
  TAGLINE: "Semangat berprestasi, tumbuh bersama. ✦",
  TARGET: "Tingkat SD/MI Sederajat Se-Madura",
  BIAYA_DAFTAR: 40000,
  REKENING_PEMBAYARAN: "BRI 0055-01-012345-50-1 a.n PANITIA OMEGA PLUS",

  // Narahubung Resmi (Sesuai Brosur)
  CONTACTS: [
    { name: "Bapak Rasyidi", phone: "087781587155", wa: "6287781587155" },
    { name: "Bapak Indra", phone: "085259349169", wa: "6285259349169" },
    { name: "Ibu Dwi Elly", phone: "081235922003", wa: "6281235922003" }
  ],

  // Jadwal Sesi Lomba (Sesuai Brosur)
  SESI: [
    { sesi: "Sesi 1", mapel: "IPA & IPS", waktu: "07.30 - 08.30 WIB" },
    { sesi: "Sesi 2", mapel: "Matematika & Bahasa Inggris", waktu: "09.00 - 10.00 WIB" }
  ]
};

// Ekspor ke window agar dapat diakses oleh index.html dan admin.html
window.APP_CONFIG = CONFIG;
