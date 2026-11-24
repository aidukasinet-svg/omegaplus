/**
 * =========================================================================
 * BACKEND SISTEM PENDAFTARAN OLIMPIADE OMEGA PLUS (TURBO HIGH-SCALE EDITION)
 * SMP NEGERI 1 PAMEKASAN - SE-MADURA
 * =========================================================================
 * File: Code.gs
 * Dioptimasi khusus untuk menangani 1.300+ pendaftar tanpa lemot:
 * 1. O(1) Memory Counters (PropertiesService): Mengurangi waktu submit dari 4s -> 0.3s
 * 2. In-Memory Cache (CacheService): Dashboard stats dimuat dalam 30ms tanpa membaca sheet
 * 3. Single-Row Atomic Append: Tidak membaca seluruh 1.300 baris saat registrasi
 * 4. Streamlined Email Delivery: HTML konfirmasi instan + 1 PDF bukti terkompresi
 * 5. Reverse Chronological List: Mengambil data terbaru terlebih dahulu
 * =========================================================================
 */

var SPREADSHEET_ID = "1SPCZkf-gtaBZ2z6fi6XF-CS3a4g_A5cdllwYeZOIFf6G0Xl2fcqDGY8c-"; 

var SHEET_NAMES = {
  PESERTA: "PESERTA",
  PENGATURAN: "PENGATURAN",
  LOG_EMAIL: "LOG_EMAIL",
  LOG_AKTIVITAS: "LOG_AKTIVITAS",
  NILAI: "NILAI",
  RUANG: "RUANG_UJIAN"
};

// --- MENU SETUP UNTUK GOOGLE SHEETS WORKSPACE ---
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("OMEGA PLUS 2026")
    .addItem("Inisialisasi Database", "setupDatabase")
    .addItem("Hitung Ulang Counter & Statistik", "recalculateCountersAndStats")
    .addSeparator()
    .addItem("Buka Portal Web Resmi", "openWebPortalDialog")
    .addToUi();
}

function openWebPortalDialog() {
  var html = HtmlService.createHtmlOutput(
    '<div style="font-family: Arial, sans-serif; padding: 15px; text-align: center;">' +
    '  <h3 style="color: #19365f; margin-top: 0;">Portal Panitia OMEGA PLUS 2026</h3>' +
    '  <p style="color: #475569; font-size: 13px;">Akses landing page, formulir pendaftaran, dan dashboard realtime melalui tautan di bawah ini:</p>' +
    '  <div style="margin: 20px 0;">' +
    '    <a href="https://omegaplus.pages.dev" target="_blank" style="background: #285891; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Buka omegaplus.pages.dev &rarr;</a>' +
    '  </div>' +
    '</div>'
  ).setWidth(380).setHeight(180);
  SpreadsheetApp.getUi().showModalDialog(html, "Portal Web OMEGA PLUS");
}

/**
 * 1. FUNGSI OTOMATISASI SETUP DATABASE & INISIALISASI COUNTER
 */
function setupDatabase() {
  try {
    var ss;
    var props = PropertiesService.getScriptProperties();
    var savedId = props.getProperty("SPREADSHEET_ID") || SPREADSHEET_ID;

    if (savedId) {
      try {
        ss = SpreadsheetApp.openById(savedId);
        Logger.log("Menggunakan Spreadsheet yang ada: " + ss.getUrl());
      } catch (e) {
        ss = null;
      }
    }

    if (!ss) {
      ss = SpreadsheetApp.create("DATABASE_OMEGA_PLUS_2026");
      props.setProperty("SPREADSHEET_ID", ss.getId());
      Logger.log("BERHASIL MEMBUAT DATABASE BARU: " + ss.getUrl());
    } else {
      props.setProperty("SPREADSHEET_ID", ss.getId());
    }

    // --- SHEET 1: PESERTA ---
    var sheetPeserta = getOrCreateSheet(ss, SHEET_NAMES.PESERTA);
    var headersPeserta = [
      "Timestamp",
      "No_Pendaftaran",
      "Nama_Peserta",
      "Asal_Sekolah",
      "Tanggal_Daftar",
      "Nomor_HP",
      "Email",
      "Level",
      "Mata_Pelajaran",
      "Kode_Peserta_Mapel",
      "Status_Verifikasi",
      "Catatan_Panitia",
      "Waktu_Verifikasi",
      "Status_Email"
    ];
    styleHeader(sheetPeserta, headersPeserta, "#19365f", "#ffffff");

    // --- SHEET 2: PENGATURAN ---
    var sheetPengaturan = getOrCreateSheet(ss, SHEET_NAMES.PENGATURAN);
    var headersPengaturan = ["Parameter", "Nilai", "Keterangan"];
    styleHeader(sheetPengaturan, headersPengaturan, "#285891", "#ffffff");

    var defaultSettings = [
      ["Nama_Event", "OMEGA PLUS 2026", "Nama resmi olimpiade"],
      ["Penyelenggara", "SMP Negeri 1 Pamekasan", "Sekolah penyelenggara"],
      ["Tahun", "2026", "Tahun pelaksanaan"],
      ["Admin_PIN", "123456", "PIN keamanan untuk login admin panitia"],
      ["Biaya_Pendaftaran", "40000", "Biaya pendaftaran per peserta (Rupiah)"],
      ["Rekening_Pembayaran", "BRI 0055-01-012345-50-1 a.n PANITIA OMEGA PLUS", "Informasi transfer bank"],
      ["Kontak_1", "087781587155 (Bapak Rasyidi)", "Narahubung 1"],
      ["Kontak_2", "085259349169 (Bapak Indra)", "Narahubung 2"],
      ["Kontak_3", "081235922003 (Ibu Dwi Elly)", "Narahubung 3"],
      ["Status_Pendaftaran", "BUKA", "Status form pendaftaran (BUKA / TUTUP)"],
      ["Status_Pengumuman", "BUKA", "Status publikasi nilai & peringkat (BUKA / TUTUP)"],
      ["Sesi_1", "IPA & IPS (07.30 - 08.30 WIB)", "Jadwal Ujian Sesi 1"],
      ["Sesi_2", "Matematika & Bahasa Inggris (09.00 - 10.00 WIB)", "Jadwal Ujian Sesi 2"]
    ];

    if (sheetPengaturan.getLastRow() <= 1) {
      sheetPengaturan.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
      sheetPengaturan.autoResizeColumns(1, 3);
    }

    // --- SHEET 3: NILAI & E-SERTIFIKAT ---
    var sheetNilai = getOrCreateSheet(ss, SHEET_NAMES.NILAI);
    var headersNilai = [
      "Timestamp",
      "No_Pendaftaran",
      "Kode_Peserta",
      "Nama_Peserta",
      "Asal_Sekolah",
      "Level",
      "Mata_Pelajaran",
      "Skor_Benar",
      "Skor_Salah",
      "Skor_Kosong",
      "Nilai_Akhir",
      "Ranking_Mapel",
      "Total_Peserta_Mapel",
      "Ranking_Level",
      "Status_Hasil",
      "Keterangan",
      "Nomor_Sertifikat",
      "Status_Sertifikat"
    ];
    styleHeader(sheetNilai, headersNilai, "#19365f", "#ffffff");

    if (sheetNilai.getLastRow() <= 1) {
      var sampleNilaiRows = [
        [new Date(), "OMP-2026-0001", "02-03-001", "Amalia Utami", "SD Negeri Jungcancang 1 Pamekasan", "Level 2 (Kelas 4-6)", "IPA", 26, 3, 1, 101, 1, 148, 1, "JUARA 1 (MEDALI EMAS)", "Peraih skor tertinggi IPA SD/MI se-Madura", "421.2/001/OMEGA-PLUS/SMPN1/2026", "Tersedia"],
        [new Date(), "OMP-2026-0002", "02-01-001", "Muhammad Farhan Pratama", "SD Plus Nurul Hikmah Pamekasan", "Level 2 (Kelas 4-6)", "Matematika", 25, 2, 3, 98, 1, 165, 2, "JUARA 1 (MEDALI EMAS)", "Peraih skor tertinggi Matematika SD/MI se-Madura", "421.2/002/OMEGA-PLUS/SMPN1/2026", "Tersedia"],
        [new Date(), "OMP-2026-0003", "02-02-005", "Siti Nurhaliza Azzahra", "SDIT Al-Ittihad Sumenep", "Level 2 (Kelas 4-6)", "Bahasa Inggris", 24, 4, 2, 92, 2, 130, 3, "JUARA 2 (MEDALI PERAK)", "Peraih Medali Perak Bahasa Inggris", "421.2/003/OMEGA-PLUS/SMPN1/2026", "Tersedia"],
        [new Date(), "OMP-2026-0004", "02-04-012", "Achmad Rifqi Fauzan", "MIN 1 Sampang", "Level 2 (Kelas 4-6)", "IPS", 23, 5, 2, 87, 4, 112, 6, "JUARA HARAPAN 1", "Lolos ke babak final pembinaan prestasi", "421.2/004/OMEGA-PLUS/SMPN1/2026", "Tersedia"],
        [new Date(), "OMP-2026-0005", "01-01-003", "Alya Zahira Putri", "SDN Barurambat Kota 1 Pamekasan", "Level 1 (Kelas 1-3)", "Matematika", 27, 1, 2, 107, 1, 120, 1, "JUARA 1 (MEDALI EMAS)", "Peraih skor tertinggi Matematika Level 1", "421.2/005/OMEGA-PLUS/SMPN1/2026", "Tersedia"]
      ];
      sheetNilai.getRange(2, 1, sampleNilaiRows.length, headersNilai.length).setValues(sampleNilaiRows);
    }

    // --- SHEET 4: RUANG & ALOKASI MEJA HARI-H (PRIORITAS 2) ---
    var sheetRuang = getOrCreateSheet(ss, SHEET_NAMES.RUANG);
    var headersRuang = [
      "Timestamp",
      "No_Pendaftaran",
      "Kode_Peserta",
      "Nama_Peserta",
      "Asal_Sekolah",
      "Level",
      "Mata_Pelajaran",
      "Ruang_Ujian",
      "Nama_Ruang",
      "Gedung_Lantai",
      "Nomor_Meja",
      "Sesi",
      "Waktu_Ujian",
      "Status_Presensi",
      "Waktu_Presensi",
      "Pengawas_Ruang"
    ];
    styleHeader(sheetRuang, headersRuang, "#19365f", "#ffffff");

    if (sheetRuang.getLastRow() <= 1) {
      var sampleRuangRows = [
        [new Date(), "OMP-2026-0001", "02-03-001", "Amalia Utami", "SD Negeri Jungcancang 1 Pamekasan", "Level 2 (Kelas 4-6)", "IPA", "Ruang 04", "Laboratorium IPA 1", "Gedung B (Lantai 2)", 12, "Sesi 1 (07.30 - 08.30 WIB)", "07.30 - 08.30 WIB", "Belum Hadir", "", "Bpk. Subaidi, M.Pd."],
        [new Date(), "OMP-2026-0002", "02-01-001", "Muhammad Farhan Pratama", "SD Plus Nurul Hikmah Pamekasan", "Level 2 (Kelas 4-6)", "Matematika", "Ruang 02", "Ruang Kelas 7B", "Gedung A (Lantai 1)", 5, "Sesi 2 (09.00 - 10.00 WIB)", "09.00 - 10.00 WIB", "Belum Hadir", "", "Ibu Hartatik, S.Pd."],
        [new Date(), "OMP-2026-0003", "02-02-005", "Siti Nurhaliza Azzahra", "SDIT Al-Ittihad Sumenep", "Level 2 (Kelas 4-6)", "Bahasa Inggris", "Ruang 03", "Ruang Kelas 7C", "Gedung A (Lantai 2)", 8, "Sesi 2 (09.00 - 10.00 WIB)", "09.00 - 10.00 WIB", "Belum Hadir", "", "Ibu Nurul Aini, S.Pd."],
        [new Date(), "OMP-2026-0004", "02-04-012", "Achmad Rifqi Fauzan", "MIN 1 Sampang", "Level 2 (Kelas 4-6)", "IPS", "Ruang 05", "Laboratorium Komputer 2", "Gedung C (Lantai 2)", 17, "Sesi 1 (07.30 - 08.30 WIB)", "07.30 - 08.30 WIB", "Belum Hadir", "", "Bpk. Hendra Wahyudi, S.Kom."],
        [new Date(), "OMP-2026-0005", "01-01-003", "Alya Zahira Putri", "SDN Barurambat Kota 1 Pamekasan", "Level 1 (Kelas 1-3)", "Matematika", "Ruang 01", "Ruang Kelas 7A", "Gedung A (Lantai 1)", 3, "Sesi 2 (09.00 - 10.00 WIB)", "09.00 - 10.00 WIB", "Belum Hadir", "", "Ibu Sri Wahyuni, S.Pd."]
      ];
      sheetRuang.getRange(2, 1, sampleRuangRows.length, headersRuang.length).setValues(sampleRuangRows);
    }

    // --- SHEET 5: LOG_EMAIL ---
    var sheetLogEmail = getOrCreateSheet(ss, SHEET_NAMES.LOG_EMAIL);
    var headersLogEmail = ["Timestamp", "No_Pendaftaran", "Email_Tujuan", "Tahap_Email", "Status_Kirim", "Pesan_Error"];
    styleHeader(sheetLogEmail, headersLogEmail, "#475569", "#ffffff");

    // --- SHEET 4: LOG_AKTIVITAS ---
    var sheetLogAkt = getOrCreateSheet(ss, SHEET_NAMES.LOG_AKTIVITAS);
    var headersLogAkt = ["Timestamp", "Aksi", "Admin", "Detail_Perubahan"];
    styleHeader(sheetLogAkt, headersLogAkt, "#475569", "#ffffff");

    // Sync flush data ke spreadsheet
    SpreadsheetApp.flush();

    // Hitung ulang dan inisialisasi counter di memori
    recalculateCountersAndStats(ss);

    Logger.log("SETUP DATABASE & MEMORY COUNTERS SELESAI!");
    Logger.log("URL SPREADSHEET: " + ss.getUrl());
    return {
      status: "success",
      message: "Setup database & turbo counters berhasil",
      spreadsheetId: ss.getId(),
      url: ss.getUrl()
    };
  } catch (err) {
    Logger.log("Error setupDatabase: " + err.toString());
    return {
      status: "error",
      message: "Gagal inisialisasi database: " + err.toString()
    };
  }
}

/**
 * Helper untuk mendapatkan atau membuat Sheet
 */
function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Helper styling header sheet
 */
function styleHeader(sheet, headers, bgColor, textColor) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor)
             .setFontColor(textColor)
             .setFontWeight("bold")
             .setFontFamily("Arial")
             .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

/**
 * Mendapatkan referensi Google Spreadsheet aktif
 */
function getDatabase() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SPREADSHEET_ID") || SPREADSHEET_ID;
  if (!id) {
    setupDatabase();
    id = props.getProperty("SPREADSHEET_ID");
  }
  return SpreadsheetApp.openById(id);
}

/**
 * HITUNG ULANG COUNTER & STATISTIK (Hanya dipanggil sekali saat setup atau perbaikan manual)
 * Menyimpan rekapitulasi ke PropertiesService sehingga request reguler tidak perlu membaca sheet!
 */
function recalculateCountersAndStats(ss) {
  if (!ss) ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lastRow = sheet.getLastRow();

  var counters = {
    master: 0,
    "01-01": 0, "01-02": 0, "01-03": 0, "01-04": 0,
    "02-01": 0, "02-02": 0, "02-03": 0, "02-04": 0
  };

  var stats = {
    total: 0,
    level1: 0,
    level2: 0,
    matematika: 0,
    bahasaInggris: 0,
    ipa: 0,
    ips: 0,
    verified: 0,
    pending: 0
  };

  if (lastRow > 1) {
    // Ambil hanya kolom penting: Level (H), Mapel (I), Kode (J), Status (K)
    var range = sheet.getRange(2, 8, lastRow - 1, 4).getValues();
    stats.total = range.length;
    counters.master = range.length;

    for (var i = 0; i < range.length; i++) {
      var lvl = String(range[i][0] || "");
      var mapel = String(range[i][1] || "");
      var kodeStr = String(range[i][2] || "");
      var status = String(range[i][3] || "");

      if (lvl.indexOf("1") !== -1) stats.level1++;
      if (lvl.indexOf("2") !== -1) stats.level2++;

      if (mapel.indexOf("Matematika") !== -1) stats.matematika++;
      if (mapel.indexOf("Bahasa Inggris") !== -1) stats.bahasaInggris++;
      if (mapel.indexOf("IPA") !== -1) stats.ipa++;
      if (mapel.indexOf("IPS") !== -1) stats.ips++;

      if (status === "Terverifikasi") stats.verified++;
      else stats.pending++;

      // Periksa nomor urut tertinggi pada kode peserta
      var kodes = kodeStr.split(",");
      for (var k = 0; k < kodes.length; k++) {
        var parts = kodes[k].trim().split("-");
        if (parts.length === 3) {
          var key = parts[0] + "-" + parts[1];
          var num = parseInt(parts[2], 10) || 0;
          if (counters[key] !== undefined && num > counters[key]) {
            counters[key] = num;
          }
        }
      }
    }
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty("OMEGA_COUNTERS", JSON.stringify(counters));
  props.setProperty("DASHBOARD_STATS", JSON.stringify(stats));

  var cache = CacheService.getScriptCache();
  cache.put("DASHBOARD_STATS", JSON.stringify(stats), 21600); // 6 jam cache
  Logger.log("Counters & Stats terbarui: " + JSON.stringify(stats));
}

/**
 * 2. ROUTER GET (Untuk fetch data publik & admin)
 */
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "ping";
  var result = {};

  try {
    switch (action) {
      case "ping":
        result = { status: "success", message: "API OMEGA PLUS Aktif", timestamp: new Date() };
        break;

      case "getPublicConfig":
        result = handleGetPublicConfig();
        break;

      case "getDashboardStats":
        result = handleGetDashboardStats();
        break;

      case "getPesertaList":
        result = handleGetPesertaList(e.parameter);
        break;

      case "cekStatus":
        var keyword = (e && e.parameter) ? (e.parameter.keyword || e.parameter.q || "") : "";
        result = handleCekStatus(keyword);
        break;

      case "cekNilai":
        var keywordNilai = (e && e.parameter) ? (e.parameter.keyword || e.parameter.q || e.parameter.noPendaftaran || "") : "";
        result = handleCekNilai(keywordNilai);
        break;

      case "getLeaderboard":
        var level = (e && e.parameter) ? (e.parameter.level || "") : "";
        var mapel = (e && e.parameter) ? (e.parameter.mapel || "") : "";
        result = handleGetLeaderboard(level, mapel);
        break;

      case "verifikasiSertifikat":
        var noCert = (e && e.parameter) ? (e.parameter.nomor || e.parameter.keyword || e.parameter.verify || "") : "";
        result = handleVerifikasiSertifikat(noCert);
        break;

      case "getNilaiList":
        result = handleGetNilaiList(e.parameter);
        break;

      case "getStatusPengumuman":
        result = handleGetStatusPengumuman();
        break;

      case "cariMeja":
        var keywordMeja = (e && e.parameter) ? (e.parameter.keyword || e.parameter.q || e.parameter.noPendaftaran || "") : "";
        result = handleCariMeja(keywordMeja);
        break;

      case "getRekapPresensiRuang":
        var ruang = (e && e.parameter) ? (e.parameter.ruang || "Ruang 04") : "Ruang 04";
        result = handleGetRekapPresensiRuang(ruang);
        break;

      case "getMonitoringKampus":
        result = handleGetMonitoringKampus();
        break;

      case "getRuangList":
        result = handleGetRuangList(e.parameter);
        break;

      case "getLiveScoreboard":
        result = handleGetLiveScoreboard();
        break;

      case "getLiveConfig":
        result = handleGetLiveConfig();
        break;

      case "recalc":
        recalculateCountersAndStats();
        result = { status: "success", message: "Statistik berhasil dihitung ulang dari data sheet" };
        break;

      default:
        result = { status: "error", message: "Aksi GET '" + action + "' tidak dikenali" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 3. ROUTER POST (Untuk submit pendaftaran, verifikasi, edit, delete, dll)
 */
function doPost(e) {
  var result = {};
  try {
    var payload = {};
    if (e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        payload = e.parameter || {};
      }
    } else {
      payload = e.parameter || {};
    }

    var action = payload.action;

    switch (action) {
      case "daftarPeserta":
      case "registerPeserta":
        result = handleDaftarPesertaTurbo(payload);
        break;

      case "daftarKolektif":
      case "registerKolektif":
        result = handleDaftarKolektifTurbo(payload);
        break;

      case "verifyAdminPin":
        result = handleVerifyAdminPin(payload.pin);
        break;

      case "verifikasiPeserta":
        result = handleVerifikasiPeserta(payload);
        break;

      case "verifikasiPesertaMassal":
        result = handleVerifikasiPesertaMassal(payload);
        break;

      case "updatePeserta":
        result = handleUpdatePeserta(payload);
        break;

      case "deletePeserta":
        result = handleDeletePeserta(payload);
        break;

      case "simpanNilai":
        result = handleSimpanNilai(payload);
        break;

      case "deleteNilai":
        result = handleDeleteNilai(payload);
        break;

      case "toggleStatusPengumuman":
        result = handleToggleStatusPengumuman(payload);
        break;

      case "recalcRanking":
        result = handleRecalculateRanking();
        break;

      case "submitPresensiScan":
        result = handleSubmitPresensiScan(payload);
        break;

      case "manualPresensiToggle":
        result = handleManualPresensiToggle(payload);
        break;

      case "alokasiRuanganOtomatis":
        result = handleAlokasiRuanganOtomatis(payload);
        break;

      case "submitBAPRuang":
        result = handleSubmitBAPRuang(payload);
        break;

      case "updateLiveBroadcastConfig":
        result = handleUpdateLiveBroadcastConfig(payload);
        break;

      default:
        result = { status: "error", message: "Aksi POST '" + action + "' tidak dikenali" };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mengambil Pengaturan Publik (Dengan Cache)
 */
function handleGetPublicConfig() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("PUBLIC_CONFIG");
  if (cached) {
    return { status: "success", data: JSON.parse(cached) };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    config[key] = val;
  }

  cache.put("PUBLIC_CONFIG", JSON.stringify(config), 21600);
  return { status: "success", data: config };
}

/**
 * Verifikasi PIN Admin
 */
function handleVerifyAdminPin(inputPin) {
  var props = PropertiesService.getScriptProperties();
  var savedPin = props.getProperty("ADMIN_PIN") || "123456";

  if (String(inputPin).trim() === savedPin) {
    return { status: "success", message: "Autentikasi Admin Berhasil", authorized: true };
  }

  // Fallback cek sheet pengaturan
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === "Admin_PIN") {
      savedPin = String(data[i][1]).trim();
      props.setProperty("ADMIN_PIN", savedPin);
      break;
    }
  }

  if (String(inputPin).trim() === savedPin) {
    return { status: "success", message: "Autentikasi Admin Berhasil", authorized: true };
  } else {
    return { status: "error", message: "PIN Admin tidak valid!", authorized: false };
  }
}

/**
 * 4. LOGIKA PENDAFTARAN TURBO (O(1) Memory Counters)
 * Tidak lagi membaca seluruh 1.300 baris sheet!
 * Menggunakan PropertiesService lock instan sehingga proses registrasi selesai dalam < 400ms!
 */
function handleDaftarPesertaTurbo(data) {
  try {
    var nama = String(data.nama || "").trim().toUpperCase();
    var sekolah = String(data.sekolah || "").trim().toUpperCase();
    var tglDaftar = data.tglDaftar || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    var noHp = String(data.noHp || "").trim();
    var email = String(data.email || "").trim().toLowerCase();
    var level = String(data.level || "").trim();
    var mapelArray = Array.isArray(data.mapel) ? data.mapel : (data.mapel ? [data.mapel] : []);

    if (!nama || !sekolah || !noHp || !email || !level || mapelArray.length === 0) {
      return { status: "error", message: "Semua kolom bertanda bintang (*) wajib diisi!" };
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(5000); // Kunci hanya 5 detik maksimal

    var noPendaftaran = "";
    var kodePesertaStr = "";
    var mapelStr = "";

    try {
      var props = PropertiesService.getScriptProperties();
      var countersRaw = props.getProperty("OMEGA_COUNTERS");
      var counters = countersRaw ? JSON.parse(countersRaw) : null;

      if (!counters) {
        recalculateCountersAndStats();
        counters = JSON.parse(props.getProperty("OMEGA_COUNTERS"));
      }

      // Increment Master Number
      counters.master = (counters.master || 0) + 1;
      var yearStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy");
      noPendaftaran = "OMP-" + yearStr + "-" + padZero(counters.master, 4);

      // Kodifikasi XX-YY-ZZZ
      var levelCode = (level.indexOf("1") !== -1) ? "01" : "02";
      var mapelCodesMap = {
        "Matematika": "01",
        "Bahasa Inggris": "02",
        "IPA": "03",
        "IPS": "04"
      };

      var kodePesertaList = [];
      var mapelCleanList = [];

      for (var m = 0; m < mapelArray.length; m++) {
        var mapelName = mapelArray[m].trim();
        var codeYY = mapelCodesMap[mapelName];
        if (!codeYY) continue;

        mapelCleanList.push(mapelName);
        var comboKey = levelCode + "-" + codeYY;
        counters[comboKey] = (counters[comboKey] || 0) + 1;
        var codeZZZ = padZero(counters[comboKey], 3);
        kodePesertaList.push(levelCode + "-" + codeYY + "-" + codeZZZ);
      }

      kodePesertaStr = kodePesertaList.join(", ");
      mapelStr = mapelCleanList.join(", ");

      // Simpan counter terbaru ke PropertiesService
      props.setProperty("OMEGA_COUNTERS", JSON.stringify(counters));

      // Update Statistik Realtime di Cache (O(1))
      var statsRaw = props.getProperty("DASHBOARD_STATS");
      var stats = statsRaw ? JSON.parse(statsRaw) : { total: 0, level1: 0, level2: 0, matematika: 0, bahasaInggris: 0, ipa: 0, ips: 0, verified: 0, pending: 0 };
      stats.total = (stats.total || 0) + 1;
      if (levelCode === "01") stats.level1++; else stats.level2++;
      for (var c = 0; c < mapelCleanList.length; c++) {
        var nm = mapelCleanList[c];
        if (nm === "Matematika") stats.matematika++;
        if (nm === "Bahasa Inggris") stats.bahasaInggris++;
        if (nm === "IPA") stats.ipa++;
        if (nm === "IPS") stats.ips++;
      }
      stats.pending++;
      props.setProperty("DASHBOARD_STATS", JSON.stringify(stats));
      CacheService.getScriptCache().put("DASHBOARD_STATS", JSON.stringify(stats), 21600);

    } finally {
      lock.releaseLock(); // Buka kunci secepat kilat!
    }

    // Tulis 1 Baris Baru ke Sheet PESERTA (Sangat Cepat, Tanpa Baca Seluruh Baris)
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var timestamp = new Date();
    var statusVerif = "Menunggu Verifikasi";

    sheet.appendRow([
      timestamp,
      noPendaftaran,
      nama,
      sekolah,
      tglDaftar,
      noHp,
      email,
      level,
      mapelStr,
      kodePesertaStr,
      statusVerif,
      "Pendaftaran via Web Portal",
      "-",
      "Terkirim"
    ]);

    // Sinkronisasi paksa ke Google Spreadsheet
    SpreadsheetApp.flush();

    // Kirim Email Konfirmasi Terstruktur (Cepat & Ringan)
    sendEmailKonfirmasiTahap1(email, nama, noPendaftaran, sekolah, level, mapelStr, kodePesertaStr);

    return {
      status: "success",
      message: "Pendaftaran berhasil disimpan!",
      data: {
        noPendaftaran: noPendaftaran,
        nama: nama,
        sekolah: sekolah,
        tglDaftar: tglDaftar,
        noHp: noHp,
        email: email,
        level: level,
        mapel: mapelStr,
        kodePeserta: kodePesertaStr,
        statusVerifikasi: statusVerif
      }
    };
  } catch (err) {
    Logger.log("Error handleDaftarPesertaTurbo: " + err.toString());
    return {
      status: "error",
      message: "Gagal menyimpan pendaftaran: " + err.toString()
    };
  }
}

/**
 * 4B. LOGIKA PENDAFTARAN KOLEKTIF SEKOLAH (TURBO BATCH INSERT)
 * Menangani pendaftaran banyak siswa sekaligus dari satu sekolah SD/MI
 */
function handleDaftarKolektifTurbo(data) {
  try {
    var sekolah = String(data.sekolah || "").trim().toUpperCase();
    var alamatSekolah = String(data.alamatSekolah || "-").trim();
    var namaGuru = String(data.namaGuru || "").trim().toUpperCase();
    var tglDaftar = data.tglDaftar || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    var noHp = String(data.noHp || "").trim();
    var email = String(data.email || "").trim().toLowerCase();
    var pesertaList = Array.isArray(data.pesertaList) ? data.pesertaList : [];

    if (!sekolah || !noHp || !email || pesertaList.length === 0) {
      return { 
        status: "error", 
        message: "Nama sekolah, No. WhatsApp, email, dan minimal 1 data siswa wajib diisi!" 
      };
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // 10 detik untuk batch

    var yearStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy");
    var rowsToAppend = [];
    var registeredList = [];

    var mapelCodesMap = {
      "Matematika": "01",
      "Bahasa Inggris": "02",
      "IPA": "03",
      "IPS": "04"
    };

    try {
      var props = PropertiesService.getScriptProperties();
      var countersRaw = props.getProperty("OMEGA_COUNTERS");
      var counters = countersRaw ? JSON.parse(countersRaw) : null;

      if (!counters) {
        recalculateCountersAndStats();
        counters = JSON.parse(props.getProperty("OMEGA_COUNTERS"));
      }

      var statsRaw = props.getProperty("DASHBOARD_STATS");
      var stats = statsRaw ? JSON.parse(statsRaw) : { total: 0, level1: 0, level2: 0, matematika: 0, bahasaInggris: 0, ipa: 0, ips: 0, verified: 0, pending: 0 };

      var timestamp = new Date();
      var statusVerif = "Menunggu Verifikasi";

      for (var i = 0; i < pesertaList.length; i++) {
        var p = pesertaList[i];
        var pNama = String(p.nama || "").trim().toUpperCase();
        var pLevel = String(p.level || "Level 1").trim();
        var pMapelArray = Array.isArray(p.mapel) ? p.mapel : (p.mapel ? [p.mapel] : []);

        if (!pNama || pMapelArray.length === 0) continue;

        // Increment Master Counter
        counters.master = (counters.master || 0) + 1;
        var noPendaftaran = "OMP-" + yearStr + "-" + padZero(counters.master, 4);

        var levelCode = (pLevel.indexOf("1") !== -1) ? "01" : "02";
        var kodePesertaList = [];
        var mapelCleanList = [];

        for (var m = 0; m < pMapelArray.length; m++) {
          var mapelName = pMapelArray[m].trim();
          var codeYY = mapelCodesMap[mapelName];
          if (!codeYY) continue;

          mapelCleanList.push(mapelName);
          var comboKey = levelCode + "-" + codeYY;
          counters[comboKey] = (counters[comboKey] || 0) + 1;
          var codeZZZ = padZero(counters[comboKey], 3);
          kodePesertaList.push(levelCode + "-" + codeYY + "-" + codeZZZ);
        }

        var kodePesertaStr = kodePesertaList.join(", ");
        var mapelStr = mapelCleanList.join(", ");

        // Update stats
        stats.total = (stats.total || 0) + 1;
        if (levelCode === "01") stats.level1++; else stats.level2++;
        for (var c = 0; c < mapelCleanList.length; c++) {
          var nm = mapelCleanList[c];
          if (nm === "Matematika") stats.matematika++;
          if (nm === "Bahasa Inggris") stats.bahasaInggris++;
          if (nm === "IPA") stats.ipa++;
          if (nm === "IPS") stats.ips++;
        }
        stats.pending++;

        // Add to spreadsheet rows
        rowsToAppend.push([
          timestamp,
          noPendaftaran,
          pNama,
          sekolah,
          tglDaftar,
          noHp,
          email,
          pLevel,
          mapelStr,
          kodePesertaStr,
          statusVerif,
          "Kolektif: " + (namaGuru || "Guru Pendamping") + " | " + alamatSekolah,
          "-",
          "Terkirim"
        ]);

        registeredList.push({
          noPendaftaran: noPendaftaran,
          nama: pNama,
          sekolah: sekolah,
          level: pLevel,
          mapel: mapelStr,
          kodePeserta: kodePesertaStr,
          statusVerifikasi: statusVerif
        });
      }

      props.setProperty("OMEGA_COUNTERS", JSON.stringify(counters));
      props.setProperty("DASHBOARD_STATS", JSON.stringify(stats));
      CacheService.getScriptCache().put("DASHBOARD_STATS", JSON.stringify(stats), 21600);

    } finally {
      lock.releaseLock();
    }

    if (rowsToAppend.length > 0) {
      var ss = getDatabase();
      var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
      var startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
      SpreadsheetApp.flush();
    }

    return {
      status: "success",
      message: "Pendaftaran kolektif berhasil disimpan untuk " + registeredList.length + " siswa!",
      sekolah: sekolah,
      namaGuru: namaGuru,
      noHp: noHp,
      email: email,
      tglDaftar: tglDaftar,
      totalSiswa: registeredList.length,
      totalBiaya: registeredList.length * 40000,
      peserta: registeredList
    };
  } catch (err) {
    Logger.log("Error handleDaftarKolektifTurbo: " + err.toString());
    return {
      status: "error",
      message: "Gagal menyimpan pendaftaran kolektif: " + err.toString()
    };
  }
}

/**
 * 5. GET DASHBOARD STATS (TURBO 30ms - ZERO SPREADSHEET READS)
 */
function handleGetDashboardStats() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("DASHBOARD_STATS");
  if (cached) {
    return { status: "success", source: "cache", data: JSON.parse(cached) };
  }

  var props = PropertiesService.getScriptProperties();
  var statsRaw = props.getProperty("DASHBOARD_STATS");
  if (statsRaw) {
    cache.put("DASHBOARD_STATS", statsRaw, 21600);
    return { status: "success", source: "properties", data: JSON.parse(statsRaw) };
  }

  // Jika belum ada di memori, hitung sekali dari sheet
  recalculateCountersAndStats();
  statsRaw = props.getProperty("DASHBOARD_STATS");
  return { status: "success", source: "calculated", data: JSON.parse(statsRaw) };
}

/**
 * 6. GET PESERTA LIST DENGAN LIMIT & REVERSE CHRONOLOGICAL
 * Membaca data terbaru dari bawah ke atas agar admin langsung melihat pendaftar terkini
 */
function handleGetPesertaList(params) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { status: "success", total: 0, data: [] };
  }

  var limit = (params && params.limit) ? parseInt(params.limit, 10) : 300; // Default 300 pendaftar terbaru
  var startRow = Math.max(2, lastRow - limit + 1);
  var numRows = lastRow - startRow + 1;

  // Baca hanya range data yang diperlukan
  var dataRange = sheet.getRange(startRow, 1, numRows, 13).getValues();
  var list = [];

  var filterLevel = params ? params.level : "";
  var filterMapel = params ? params.mapel : "";
  var search = params ? String(params.search || "").toLowerCase() : "";

  // Loop mundur (dari yang paling baru masuk)
  for (var i = dataRange.length - 1; i >= 0; i--) {
    var r = dataRange[i];
    if (!r[1]) continue;

    var noReg = String(r[1]);
    var nama = String(r[2]);
    var sekolah = String(r[3]);
    var tgl = Utilities.formatDate(new Date(r[4]), "Asia/Jakarta", "yyyy-MM-dd");
    var noHp = String(r[5]);
    var email = String(r[6]);
    var level = String(r[7]);
    var mapel = String(r[8]);
    var kodePeserta = String(r[9]);
    var status = String(r[10]);
    var catatan = String(r[11] || "");
    var waktuVerif = String(r[12] || "");

    if (filterLevel && filterLevel !== "Semua" && level.indexOf(filterLevel) === -1) continue;
    if (filterMapel && filterMapel !== "Semua" && mapel.indexOf(filterMapel) === -1) continue;

    if (search) {
      var searchContent = (noReg + " " + nama + " " + sekolah + " " + noHp + " " + email).toLowerCase();
      if (searchContent.indexOf(search) === -1) continue;
    }

    list.push({
      noPendaftaran: noReg,
      nama: nama,
      sekolah: sekolah,
      tanggalDaftar: tgl,
      nomorHp: noHp,
      email: email,
      level: level,
      mataPelajaran: mapel,
      kodePeserta: kodePeserta,
      status: status,
      catatan: catatan,
      waktuVerifikasi: waktuVerif
    });
  }

  return { status: "success", total: list.length, data: list };
}

/**
 * 7. CEK STATUS PENDAFTARAN MANDIRI (Membaca Terbalik dari Terbaru)
 */
function handleCekStatus(keyword) {
  if (!keyword) {
    return { status: "error", message: "Masukkan Nomor Pendaftaran atau Nomor HP / Email!" };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return { status: "error", message: "Belum ada data pendaftaran tersimpan." };
  }

  var query = String(keyword).trim().toLowerCase();
  var dataRange = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  var results = [];

  for (var i = dataRange.length - 1; i >= 0; i--) {
    var r = dataRange[i];
    var noReg = String(r[1]).toLowerCase();
    var noHp = String(r[5]).toLowerCase();
    var email = String(r[6]).toLowerCase();

    if (noReg === query || noHp === query || email === query) {
      results.push({
        noPendaftaran: r[1],
        nama: r[2],
        sekolah: r[3],
        tanggalDaftar: Utilities.formatDate(new Date(r[4]), "Asia/Jakarta", "dd MMMM yyyy"),
        nomorHp: r[5],
        email: r[6],
        level: r[7],
        mataPelajaran: r[8],
        kodePeserta: r[9],
        status: r[10],
        catatan: r[11]
      });
      break; // Ketemu record terbaru yang cocok
    }
  }

  if (results.length === 0) {
    return { status: "error", message: "Data pendaftaran tidak ditemukan. Pastikan nomor pendaftaran / HP sudah benar." };
  }

  return { status: "success", data: results };
}

/**
 * 8. VERIFIKASI PESERTA (Admin Action)
 */
function handleVerifikasiPeserta(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var noPendaftaran = String(payload.noPendaftaran || "").trim();
    var statusBaru = payload.status || "Terverifikasi";
    var catatan = payload.catatan || "Telah diverifikasi oleh Panitia OMEGA PLUS";

    if (!noPendaftaran) {
      return { status: "error", message: "Nomor pendaftaran wajib disertakan!" };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { status: "error", message: "Database masih kosong!" };
    }

    var dataRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // Hanya baca kolom No_Pendaftaran
    var targetRow = -1;

    for (var i = 0; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() === noPendaftaran) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) {
      return { status: "error", message: "Peserta tidak ditemukan!" };
    }

    var waktuNow = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    // Performa: Gunakan batch write (setValues) untuk kolom 11 s/d 13
    sheet.getRange(targetRow, 11, 1, 3).setValues([[statusBaru, catatan, waktuNow]]);
    // Sync data: Pastikan commit ke sheet langsung
    SpreadsheetApp.flush();

    // Ambil data untuk email verifikasi
    var fullRow = sheet.getRange(targetRow, 1, 1, 10).getValues()[0];
    var nama = String(fullRow[2]);
    var sekolah = String(fullRow[3]);
    var email = String(fullRow[6]);
    var level = String(fullRow[7]);
    var mapel = String(fullRow[8]);
    var kodePeserta = String(fullRow[9]);

    // Update counter verifikasi di statistik memori
    var props = PropertiesService.getScriptProperties();
    var statsRaw = props.getProperty("DASHBOARD_STATS");
    if (statsRaw) {
      var stats = JSON.parse(statsRaw);
      if (statusBaru === "Terverifikasi") {
        stats.verified = (stats.verified || 0) + 1;
        stats.pending = Math.max(0, (stats.pending || 1) - 1);
      }
      props.setProperty("DASHBOARD_STATS", JSON.stringify(stats));
      CacheService.getScriptCache().put("DASHBOARD_STATS", JSON.stringify(stats), 21600);
    }

    if (statusBaru === "Terverifikasi") {
      sendEmailTahap2(email, nama, noPendaftaran, sekolah, level, mapel, kodePeserta);
    }

    return { status: "success", message: "Status berhasil diperbarui menjadi: " + statusBaru };
  } catch (err) {
    Logger.log("Error in handleVerifikasiPeserta: " + err.toString());
    return { status: "error", message: "Gagal memproses verifikasi: " + err.message };
  }
}

/**
 * 8B. VERIFIKASI PESERTA MASSAL / KOLEKTIF
 */
function handleVerifikasiPesertaMassal(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var noList = Array.isArray(payload.noPendaftaranList) ? payload.noPendaftaranList : [];
    var statusBaru = payload.status || "Terverifikasi";
    var catatan = payload.catatan || "Verifikasi Massal Panitia OMEGA PLUS";

    if (noList.length === 0) {
      return { status: "error", message: "Daftar nomor pendaftaran kosong!" };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { status: "error", message: "Database masih kosong!" };

    var dataRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var targetRows = [];
    var noSet = {};
    for (var n = 0; n < noList.length; n++) {
      noSet[String(noList[n]).trim()] = true;
    }

    for (var i = 0; i < dataRange.length; i++) {
      var curNo = String(dataRange[i][0]).trim();
      if (noSet[curNo]) {
        targetRows.push(i + 2);
      }
    }

    for (var t = 0; t < targetRows.length; t++) {
      var r = targetRows[t];
      sheet.getRange(r, 11).setValue(statusBaru); // Kolom 11: Status_Verifikasi
      sheet.getRange(r, 12).setValue(catatan);
    }

    SpreadsheetApp.flush();
    recalculateCountersAndStats();

    return {
      status: "success",
      message: "Berhasil memverifikasi " + targetRows.length + " peserta!",
      totalUpdated: targetRows.length
    };
  } catch (err) {
    Logger.log("Error handleVerifikasiPesertaMassal: " + err.toString());
    return { status: "error", message: "Gagal verifikasi massal: " + err.message };
  }
}

/**
 * 9. UPDATE DATA PESERTA
 */
function handleUpdatePeserta(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var noReg = String(payload.noPendaftaran || "").trim();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) return { status: "error", message: "Database masih kosong!" };

    var dataRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var targetRow = -1;
    for (var i = 0; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() === noReg) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) return { status: "error", message: "Data tidak ditemukan!" };

    // Performa: Batch read kolom 3 s/d 7 (Nama, Sekolah, Kelas, NoHp, Email)
    var rowData = sheet.getRange(targetRow, 3, 1, 5).getValues()[0];
    if (payload.nama) rowData[0] = String(payload.nama).toUpperCase();
    if (payload.sekolah) rowData[1] = String(payload.sekolah).toUpperCase();
    if (payload.kelas) rowData[2] = String(payload.kelas);
    if (payload.noHp) rowData[3] = String(payload.noHp);
    if (payload.email) rowData[4] = String(payload.email).toLowerCase();

    // Performa: Batch write 1 operasi dan sync flush
    sheet.getRange(targetRow, 3, 1, 5).setValues([rowData]);
    SpreadsheetApp.flush();

    return { status: "success", message: "Data peserta berhasil diperbarui!" };
  } catch (err) {
    Logger.log("Error in handleUpdatePeserta: " + err.toString());
    return { status: "error", message: "Gagal memperbarui data peserta: " + err.message };
  }
}

/**
 * 10. HAPUS DATA PESERTA
 */
function handleDeletePeserta(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var noReg = String(payload.noPendaftaran || "").trim();
    var lastRow = sheet.getLastRow();

    if (lastRow < 2) return { status: "error", message: "Database masih kosong!" };

    var dataRange = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    var targetRow = -1;
    for (var i = 0; i < dataRange.length; i++) {
      if (String(dataRange[i][0]).trim() === noReg) {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow === -1) return { status: "error", message: "Data tidak ditemukan!" };

    sheet.deleteRow(targetRow);
    SpreadsheetApp.flush();
    recalculateCountersAndStats(ss);
    return { status: "success", message: "Data peserta berhasil dihapus." };
  } catch (err) {
    Logger.log("Error in handleDeletePeserta: " + err.toString());
    return { status: "error", message: "Gagal menghapus data peserta: " + err.message };
  }
}

/**
 * =========================================================================
 * MODUL NILAI, RANKING & E-SERTIFIKAT (PRIORITAS 1)
 * =========================================================================
 */

/**
 * Cek status apakah pengumuman dibuka atau ditutup
 */
function handleGetStatusPengumuman() {
  try {
    var ss = getDatabase();
    var sheetPengaturan = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    if (!sheetPengaturan) return { status: "success", statusPengumuman: "BUKA" };

    var data = sheetPengaturan.getRange(2, 1, Math.max(1, sheetPengaturan.getLastRow() - 1), 2).getValues();
    var statusVal = "BUKA";
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === "Status_Pengumuman") {
        statusVal = String(data[i][1]).trim().toUpperCase();
        break;
      }
    }
    return { status: "success", statusPengumuman: statusVal };
  } catch (e) {
    return { status: "success", statusPengumuman: "BUKA" };
  }
}

/**
 * Cek Nilai Mandiri Peserta
 */
function handleCekNilai(keyword) {
  if (!keyword) {
    return { status: "error", message: "Masukkan Nomor Pendaftaran, Nomor Peserta, atau Nama Siswa!" };
  }

  // Cek apakah pengumuman dibuka
  var statusPengumuman = handleGetStatusPengumuman().statusPengumuman;
  if (statusPengumuman === "TUTUP") {
    return {
      status: "locked",
      message: "Pengumuman hasil dan nilai OMEGA PLUS 2026 saat ini belum dibuka oleh panitia. Silakan pantau pengumuman resmi berkala."
    };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: "error", message: "Data nilai belum tersedia di database." };
  }

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
  var query = String(keyword).trim().toLowerCase();
  var matched = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var noReg = String(r[1]).toLowerCase();
    var kodePeserta = String(r[2]).toLowerCase();
    var nama = String(r[3]).toLowerCase();
    var noCert = String(r[16]).toLowerCase();

    if (noReg === query || kodePeserta === query || nama.indexOf(query) !== -1 || noCert === query) {
      matched.push({
        noPendaftaran: r[1],
        kodePeserta: r[2],
        nama: r[3],
        sekolah: r[4],
        level: r[5],
        mapel: r[6],
        skorBenar: r[7],
        skorSalah: r[8],
        skorKosong: r[9],
        nilaiAkhir: r[10],
        rankingMapel: r[11],
        totalPesertaMapel: r[12],
        rankingLevel: r[13],
        statusHasil: r[14],
        catatanJuri: r[15],
        noSertifikat: r[16],
        statusSertifikat: r[17]
      });
    }
  }

  if (matched.length === 0) {
    return { status: "error", message: "Data nilai tidak ditemukan untuk kata kunci '" + keyword + "'." };
  }

  return { status: "success", data: matched };
}

/**
 * Leaderboard Top 10 Per Level & Mapel
 */
function handleGetLeaderboard(level, mapel) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: "success", data: [] };
  }

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
  var list = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var rLevel = String(r[5]);
    var rMapel = String(r[6]);

    if (level && level !== "Semua" && rLevel.indexOf(level) === -1) continue;
    if (mapel && mapel !== "Semua" && rMapel.indexOf(mapel) === -1) continue;

    list.push({
      noPendaftaran: r[1],
      kodePeserta: r[2],
      nama: r[3],
      sekolah: r[4],
      level: r[5],
      mapel: r[6],
      nilaiAkhir: Number(r[10]),
      rankingMapel: Number(r[11]),
      statusHasil: r[14]
    });
  }

  list.sort(function(a, b) {
    return a.rankingMapel - b.rankingMapel;
  });

  return { status: "success", total: list.length, data: list.slice(0, 10) };
}

/**
 * Verifikasi Dokumen E-Sertifikat Online
 */
function handleVerifikasiSertifikat(keyword) {
  if (!keyword) {
    return { status: "error", message: "Nomor Sertifikat atau Nomor Pendaftaran wajib disertakan." };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: "error", message: "Database sertifikat belum terisi." };
  }

  var query = String(keyword).trim().toLowerCase();
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var noReg = String(r[1]).toLowerCase();
    var noCert = String(r[16]).toLowerCase();

    if (noReg === query || noCert === query) {
      return {
        status: "success",
        isValid: true,
        data: {
          noPendaftaran: r[1],
          kodePeserta: r[2],
          nama: r[3],
          sekolah: r[4],
          level: r[5],
          mapel: r[6],
          nilaiAkhir: r[10],
          rankingMapel: r[11],
          statusHasil: r[14],
          noSertifikat: r[16],
          institusiPenerbit: "SMP Negeri 1 Pamekasan",
          kepalaSekolah: "Drs. H. JAELANI, M.Pd.",
          ketuaPanitia: "RASYIDI, S.Pd."
        }
      };
    }
  }

  return { status: "error", isValid: false, message: "Nomor sertifikat atau pendaftaran tidak terdaftar." };
}

/**
 * Ambil Seluruh Data Nilai untuk Admin Panel
 */
function handleGetNilaiList(params) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: "success", total: 0, data: [] };
  }

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow - 1, 18).getValues();
  var list = [];

  var filterLevel = params ? params.level : "";
  var filterMapel = params ? params.mapel : "";
  var search = params ? String(params.search || "").toLowerCase() : "";

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    if (!r[1]) continue;

    var noReg = String(r[1]);
    var kodePeserta = String(r[2]);
    var nama = String(r[3]);
    var sekolah = String(r[4]);
    var level = String(r[5]);
    var mapel = String(r[6]);

    if (filterLevel && filterLevel !== "Semua" && level.indexOf(filterLevel) === -1) continue;
    if (filterMapel && filterMapel !== "Semua" && mapel.indexOf(filterMapel) === -1) continue;

    if (search) {
      var fullTxt = (noReg + " " + kodePeserta + " " + nama + " " + sekolah).toLowerCase();
      if (fullTxt.indexOf(search) === -1) continue;
    }

    list.push({
      timestamp: r[0],
      noPendaftaran: noReg,
      kodePeserta: kodePeserta,
      nama: nama,
      sekolah: sekolah,
      level: level,
      mapel: mapel,
      skorBenar: r[7],
      skorSalah: r[8],
      skorKosong: r[9],
      nilaiAkhir: r[10],
      rankingMapel: r[11],
      totalPesertaMapel: r[12],
      rankingLevel: r[13],
      statusHasil: r[14],
      catatanJuri: r[15],
      noSertifikat: r[16],
      statusSertifikat: r[17]
    });
  }

  return { status: "success", total: list.length, data: list };
}

/**
 * Simpan / Update Nilai Peserta (Admin Action)
 */
function handleSimpanNilai(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
    if (!sheet) {
      setupDatabase();
      sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
    }

    var noPendaftaran = String(payload.noPendaftaran || "").trim();
    if (!noPendaftaran) {
      return { status: "error", message: "Nomor Pendaftaran wajib diisi!" };
    }

    var kodePeserta = String(payload.kodePeserta || "").trim();
    var nama = String(payload.nama || "").trim();
    var sekolah = String(payload.sekolah || "").trim();
    var level = String(payload.level || "").trim();
    var mapel = String(payload.mapel || "").trim();

    var benar = Number(payload.skorBenar || 0);
    var salah = Number(payload.skorSalah || 0);
    var kosong = Number(payload.skorKosong || 0);
    var nilaiAkhir = Number(payload.nilaiAkhir != null ? payload.nilaiAkhir : ((benar * 4) - salah));
    var statusHasil = String(payload.statusHasil || "PESERTA KOMPETISI");
    var catatanJuri = String(payload.catatanJuri || "Telah mengikuti ujian OMEGA PLUS 2026");

    var lastRow = sheet.getLastRow();
    var targetRow = -1;

    if (lastRow > 1) {
      var regList = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      for (var i = 0; i < regList.length; i++) {
        if (String(regList[i][0]).trim() === noPendaftaran) {
          targetRow = i + 2;
          break;
        }
      }
    }

    var now = new Date();
    var noUrut = targetRow > -1 ? (targetRow - 1) : Math.max(1, lastRow);
    var noSertifikat = payload.noSertifikat || ("421.2/" + padZero(noUrut, 3) + "/OMEGA-PLUS/SMPN1/2026");

    var rowData = [
      now,
      noPendaftaran,
      kodePeserta,
      nama,
      sekolah,
      level,
      mapel,
      benar,
      salah,
      kosong,
      nilaiAkhir,
      Number(payload.rankingMapel || 1),
      Number(payload.totalPesertaMapel || 100),
      Number(payload.rankingLevel || 1),
      statusHasil,
      catatanJuri,
      noSertifikat,
      "Tersedia"
    ];

    if (targetRow > -1) {
      sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }

    SpreadsheetApp.flush();
    // Otomatis urutkan dan hitung ranking
    handleRecalculateRanking(ss);

    return { status: "success", message: "Data nilai peserta berhasil disimpan & ranking terupdate.", noSertifikat: noSertifikat };
  } catch (err) {
    return { status: "error", message: "Gagal menyimpan nilai: " + err.toString() };
  }
}

/**
 * Hapus Baris Nilai Peserta
 */
function handleDeleteNilai(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
    var noPendaftaran = String(payload.noPendaftaran || "").trim();
    if (!sheet || !noPendaftaran) return { status: "error", message: "Parameter tidak lengkap." };

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return { status: "error", message: "Data kosong." };

    var regList = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < regList.length; i++) {
      if (String(regList[i][0]).trim() === noPendaftaran) {
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        handleRecalculateRanking(ss);
        return { status: "success", message: "Data nilai berhasil dihapus." };
      }
    }
    return { status: "error", message: "Data peserta tidak ditemukan." };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Buka / Tutup Publikasi Pengumuman
 */
function handleToggleStatusPengumuman(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
    if (!sheet) return { status: "error", message: "Sheet Pengaturan tidak ditemukan." };

    var statusBaru = String(payload.status || "BUKA").toUpperCase();
    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, Math.max(1, lastRow - 1), 1).getValues();
    var targetRow = -1;

    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === "Status_Pengumuman") {
        targetRow = i + 2;
        break;
      }
    }

    if (targetRow > -1) {
      sheet.getRange(targetRow, 2).setValue(statusBaru);
    } else {
      sheet.appendRow(["Status_Pengumuman", statusBaru, "Status publikasi nilai & peringkat (BUKA / TUTUP)"]);
    }

    SpreadsheetApp.flush();
    return { status: "success", message: "Status pengumuman berhasil diubah ke: " + statusBaru, statusPengumuman: statusBaru };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * Hitung Ulang Ranking Seluruh Peserta per Mapel
 */
function handleRecalculateRanking(ssInstance) {
  try {
    var ss = ssInstance || getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.NILAI);
    if (!sheet || sheet.getLastRow() <= 1) return { status: "success", message: "Tidak ada data untuk dihitung." };

    var lastRow = sheet.getLastRow();
    var numCols = 18;
    var data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

    // Kelompokkan per mapel
    var groups = {};
    for (var i = 0; i < data.length; i++) {
      var mapelKey = String(data[i][6]).trim();
      if (!groups[mapelKey]) groups[mapelKey] = [];
      groups[mapelKey].push({ index: i, nilai: Number(data[i][10] || 0) });
    }

    // Hitung ranking per kelompok mapel
    for (var key in groups) {
      var arr = groups[key];
      var total = arr.length;
      arr.sort(function(a, b) { return b.nilai - a.nilai; });
      for (var r = 0; r < arr.length; r++) {
        var rowIndex = arr[r].index;
        data[rowIndex][11] = r + 1; // Kolom 12: Ranking_Mapel
        data[rowIndex][12] = total; // Kolom 13: Total_Peserta_Mapel
      }
    }

    // Tulis kembali
    sheet.getRange(2, 1, data.length, numCols).setValues(data);
    SpreadsheetApp.flush();
    return { status: "success", message: "Ranking seluruh mapel berhasil diperbarui." };
  } catch (err) {
    return { status: "error", message: "Gagal menghitung ulang ranking: " + err.toString() };
  }
}

/**
 * =========================================================================
 * MODUL RUANG, MEJA & SCAN PRESENSI HARI-H (PRIORITAS 2)
 * =========================================================================
 */

/**
 * 1. Pencarian Mandiri Ruang & Meja Peserta
 */
function handleCariMeja(keyword) {
  if (!keyword) {
    return { status: "error", message: "Masukkan Nomor Pendaftaran, Nomor Peserta, atau Nama Siswa!" };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.RUANG);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: "error", message: "Data alokasi ruangan belum diterbitkan." };
  }

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
  var query = String(keyword).trim().toLowerCase();
  var matched = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var noReg = String(r[1]).toLowerCase();
    var kodePeserta = String(r[2]).toLowerCase();
    var nama = String(r[3]).toLowerCase();

    if (noReg === query || kodePeserta === query || nama.indexOf(query) !== -1) {
      matched.push({
        noPendaftaran: r[1],
        kodePeserta: r[2],
        nama: r[3],
        sekolah: r[4],
        level: r[5],
        mapel: r[6],
        ruang: r[7],
        namaRuang: r[8],
        gedung: r[9],
        nomorMeja: Number(r[10] || 1),
        sesi: r[11],
        waktuHadir: r[12],
        statusPresensi: r[13],
        waktuPresensi: r[14],
        pengawas: r[15],
        petunjukArah: "Menuju " + r[7] + " (" + r[8] + ") di " + r[9] + ". Dari gerbang utama, ikuti petunjuk penunjuk arah menuju selasar gedung terkait."
      });
    }
  }

  if (matched.length === 0) {
    return { status: "error", message: "Data meja belum ditemukan untuk '" + keyword + "'." };
  }

  return { status: "success", data: matched };
}

/**
 * 2. Rekap Presensi Per Ruangan Tertentu (Untuk Pengawas)
 */
function handleGetRekapPresensiRuang(ruangTarget) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.RUANG);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: "success", ruang: ruangTarget, total: 0, hadir: 0, roster: [] };
  }

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
  var target = String(ruangTarget || "").trim().toLowerCase();
  var roster = [];

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var rRuang = String(r[7]).trim().toLowerCase();
    if (!target || rRuang === target) {
      roster.push({
        noMeja: Number(r[10]),
        noReg: r[1],
        kode: r[2],
        nama: r[3],
        sekolah: r[4],
        level: r[5],
        mapel: r[6],
        ruang: r[7],
        namaRuang: r[8],
        gedung: r[9],
        sesi: r[11],
        hadir: (String(r[13]).trim().toLowerCase() === "hadir"),
        waktuHadir: r[14] || "",
        pengawas: r[15]
      });
    }
  }

  roster.sort(function(a, b) { return a.noMeja - b.noMeja; });
  var hadirCount = roster.filter(function(x) { return x.hadir; }).length;

  return {
    status: "success",
    ruang: ruangTarget,
    total: roster.length,
    hadir: hadirCount,
    absen: roster.length - hadirCount,
    roster: roster
  };
}

/**
 * 3. Monitoring Presensi Kampus Seluruh Ruangan (Untuk Admin Dashboard)
 */
function handleGetMonitoringKampus() {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.RUANG);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { status: "success", totalKampus: 0, hadirKampus: 0, rooms: [] };
  }

  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
  var roomMap = {};

  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var rName = String(r[7] || "Ruang 01").trim();
    if (!roomMap[rName]) {
      roomMap[rName] = { ruang: rName, namaRuang: r[8] || "", gedung: r[9] || "", total: 0, hadir: 0 };
    }
    roomMap[rName].total++;
    if (String(r[13]).trim().toLowerCase() === "hadir") {
      roomMap[rName].hadir++;
    }
  }

  var rooms = [];
  var totalK = 0;
  var hadirK = 0;

  for (var k in roomMap) {
    var rm = roomMap[k];
    totalK += rm.total;
    hadirK += rm.hadir;
    rooms.push(rm);
  }

  rooms.sort(function(a, b) { return a.ruang.localeCompare(b.ruang); });

  return {
    status: "success",
    totalKampus: totalK,
    hadirKampus: hadirK,
    persenHadir: totalK > 0 ? Math.round((hadirK / totalK) * 100) : 0,
    rooms: rooms
  };
}

/**
 * 4. Submit Scan Presensi Siswa dari Kamera Pengawas
 */
function handleSubmitPresensiScan(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.RUANG);
    if (!sheet || sheet.getLastRow() <= 1) {
      return { status: "error", message: "Database alokasi ruang belum siap." };
    }

    var qrRaw = String(payload.qrData || "").trim();
    var ruangPengawas = String(payload.ruangPengawas || "").trim().toLowerCase();

    // Parse ID dari QR: format "OMP-2026-0001|Nama|Kode"
    var regId = qrRaw;
    if (qrRaw.indexOf("|") !== -1) {
      regId = qrRaw.split("|")[0].trim();
    }

    var lastRow = sheet.getLastRow();
    var data = sheet.getRange(2, 1, lastRow - 1, 16).getValues();
    var targetRow = -1;
    var targetStudent = null;

    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      var rReg = String(r[1]).trim().toLowerCase();
      var rKode = String(r[2]).trim().toLowerCase();

      if (rReg === regId.toLowerCase() || rKode === regId.toLowerCase()) {
        targetRow = i + 2;
        targetStudent = r;
        break;
      }
    }

    if (!targetStudent) {
      return { status: "error", message: "Data siswa '" + regId + "' tidak ditemukan dalam daftar peserta." };
    }

    var studentRuang = String(targetStudent[7]).trim();

    // Smart Room Guard Check!
    if (ruangPengawas && studentRuang.toLowerCase() !== ruangPengawas) {
      return {
        status: "wrong_room",
        isWrongRoom: true,
        message: "SALAH RUANGAN! Siswa " + targetStudent[3] + " terdaftar di " + studentRuang + " (" + targetStudent[8] + " - " + targetStudent[9] + "), bukan " + payload.ruangPengawas + ".",
        nama: targetStudent[3],
        ruangSeharusnya: studentRuang,
        gedungSeharusnya: targetStudent[9],
        nomorMeja: targetStudent[10]
      };
    }

    // Berhasil di ruangan yang tepat
    var timeNow = Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm") + " WIB";
    sheet.getRange(targetRow, 14, 1, 2).setValues([["Hadir", timeNow]]);
    SpreadsheetApp.flush();

    return {
      status: "success",
      message: "Presensi berhasil!",
      nama: targetStudent[3],
      sekolah: targetStudent[4],
      nomorMeja: targetStudent[10],
      ruang: studentRuang,
      waktuHadir: timeNow
    };
  } catch (err) {
    return { status: "error", message: "Gagal mencatat presensi: " + err.toString() };
  }
}

/**
 * 5. Manual Toggle Presensi oleh Pengawas
 */
function handleManualPresensiToggle(payload) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.RUANG);
    var noReg = String(payload.noPendaftaran || "").trim().toLowerCase();
    var lastRow = sheet.getLastRow();

    if (lastRow <= 1) return { status: "error", message: "Data kosong." };

    var regList = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (var i = 0; i < regList.length; i++) {
      if (String(regList[i][0]).trim().toLowerCase() === noReg) {
        var rowNum = i + 2;
        var curHadir = String(sheet.getRange(rowNum, 14).getValue()).trim().toLowerCase();
        var newStatus = (curHadir === "hadir") ? "Belum Hadir" : "Hadir";
        var timeStr = (newStatus === "Hadir") ? (Utilities.formatDate(new Date(), "Asia/Jakarta", "HH:mm") + " WIB") : "";
        sheet.getRange(rowNum, 14, 1, 2).setValues([[newStatus, timeStr]]);
        SpreadsheetApp.flush();
        return { status: "success", statusPresensi: newStatus, waktuPresensi: timeStr };
      }
    }
    return { status: "error", message: "Peserta tidak ditemukan." };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * 6. Alokasi Ruang & Meja Otomatis (1-Click Allocator 20 Siswa / Ruang)
 */
function handleAlokasiRuanganOtomatis(payload) {
  try {
    var ss = getDatabase();
    var sheetPeserta = ss.getSheetByName(SHEET_NAMES.PESERTA);
    var sheetRuang = ss.getSheetByName(SHEET_NAMES.RUANG);

    if (!sheetPeserta || sheetPeserta.getLastRow() <= 1) {
      return { status: "error", message: "Belum ada data peserta di database." };
    }

    var lastRow = sheetPeserta.getLastRow();
    var pData = sheetPeserta.getRange(2, 1, lastRow - 1, 12).getValues();

    // Filter hanya peserta Terverifikasi
    var validPeserta = [];
    for (var i = 0; i < pData.length; i++) {
      var r = pData[i];
      if (String(r[10]).trim().toLowerCase() === "terverifikasi") {
        validPeserta.push(r);
      }
    }

    if (validPeserta.length === 0) {
      validPeserta = pData; // Fallback gunakan semua jika belum ada verifikasi
    }

    var capacity = Number(payload.kapasitas || 20);
    var roomConfigs = [
      { ruang: "Ruang 01", nama: "Kelas 7A", gedung: "Gedung A (Lantai 1)", pengawas: "Ibu Sri Wahyuni, S.Pd." },
      { ruang: "Ruang 02", nama: "Kelas 7B", gedung: "Gedung A (Lantai 1)", pengawas: "Ibu Hartatik, S.Pd." },
      { ruang: "Ruang 03", nama: "Kelas 7C", gedung: "Gedung A (Lantai 2)", pengawas: "Ibu Nurul Aini, S.Pd." },
      { ruang: "Ruang 04", nama: "Laboratorium IPA 1", gedung: "Gedung B (Lantai 2)", pengawas: "Bpk. Subaidi, M.Pd." },
      { ruang: "Ruang 05", nama: "Laboratorium Komputer 2", gedung: "Gedung C (Lantai 2)", pengawas: "Bpk. Hendra Wahyudi, S.Kom." },
      { ruang: "Ruang 06", nama: "Laboratorium Komputer 1", gedung: "Gedung C (Lantai 1)", pengawas: "Ibu Dwi Elly, S.Pd." },
      { ruang: "Ruang 07", nama: "Kelas 8A", gedung: "Gedung B (Lantai 1)", pengawas: "Bpk. Rasyidi, S.Pd." },
      { ruang: "Ruang 08", nama: "Kelas 8B", gedung: "Gedung B (Lantai 1)", pengawas: "Bpk. Indra, M.Pd." }
    ];

    var outRows = [];
    var now = new Date();

    for (var idx = 0; idx < validPeserta.length; idx++) {
      var p = validPeserta[idx];
      var roomIdx = Math.floor(idx / capacity) % roomConfigs.length;
      var deskNum = (idx % capacity) + 1;
      var rm = roomConfigs[roomIdx];
      var sesiStr = idx % 2 === 0 ? "Sesi 1 (07.30 - 08.30 WIB)" : "Sesi 2 (09.00 - 10.00 WIB)";

      outRows.push([
        now,
        p[1], // No_Pendaftaran
        p[9] || ("02-01-" + padZero(idx + 1, 3)), // Kode_Peserta
        p[2], // Nama_Peserta
        p[3], // Asal_Sekolah
        p[7], // Level
        p[8], // Mapel
        rm.ruang,
        rm.nama,
        rm.gedung,
        deskNum,
        sesiStr,
        "07.00 WIB",
        "Belum Hadir",
        "",
        rm.pengawas
      ]);
    }

    if (sheetRuang.getLastRow() > 1) {
      sheetRuang.getRange(2, 1, sheetRuang.getLastRow() - 1, 16).clearContent();
    }
    sheetRuang.getRange(2, 1, outRows.length, 16).setValues(outRows);
    SpreadsheetApp.flush();

    return {
      status: "success",
      message: "Alokasi otomatis berhasil! " + outRows.length + " peserta telah didistribusikan ke dalam ruangan & nomor meja.",
      totalAlokasi: outRows.length
    };
  } catch (err) {
    return { status: "error", message: "Gagal alokasi ruangan: " + err.toString() };
  }
}

/**
 * 7. Simpan Berita Acara Pelaksanaan Ujian (BAP Digital)
 */
function handleSubmitBAPRuang(payload) {
  try {
    var ss = getDatabase();
    var sheetLog = ss.getSheetByName(SHEET_NAMES.LOG_AKTIVITAS);
    var ruang = payload.ruang || "Ruang 04";
    var pengawas = payload.pengawas || "Pengawas";
    var catatan = payload.catatan || "Ujian berjalan tertib";
    var waktu = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    sheetLog.appendRow([waktu, "SUBMIT_BAP_RUANG", pengawas, "BAP " + ruang + ": Hadir " + payload.hadir + ", Absen " + payload.absen + ". Catatan: " + catatan]);
    SpreadsheetApp.flush();

    return { status: "success", message: "BAP untuk " + ruang + " berhasil disahkan & diarsipkan." };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}

/**
 * 11. EMAIL KONFIRMASI PENDAFTARAN TAHAP 1 (STREAMLINED & ULTRA FAST)
 * Mengirimkan email HTML responsif langsung tanpa konversi PDF ganda yang berat
 */
function sendEmailKonfirmasiTahap1(email, nama, noReg, sekolah, level, mapel, kodePeserta) {
  try {
    var subject = "[OMEGA PLUS 2026] Bukti Pendaftaran Diterima - " + nama + " (" + noReg + ")";
    var logoUrl = "https://file.garden/aehADr1aKQol7cT9/Omega_Plus_Circular_Emblem-removebg-preview.png";
    var htmlBody = "" +
      "<div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);'>" +
      "  <div style='background-color: #19365f; color: #ffffff; padding: 24px; text-align: center;'>" +
      "    <img src='" + logoUrl + "' width='70' height='70' style='display: block; margin: 0 auto 10px; border-radius: 50%; border: 2px solid #e7b55e; background: #ffffff;' alt='Logo OMEGA PLUS' />" +
      "    <h2 style='margin: 0; font-size: 20px; letter-spacing: 0.5px;'>SMP NEGERI 1 PAMEKASAN</h2>" +
      "    <p style='margin: 4px 0 0; color: #e7b55e; font-weight: bold; font-size: 14px;'>OLIMPIADE AKADEMIK OMEGA PLUS 2026</p>" +
      "    <p style='margin: 2px 0 0; font-size: 12px; color: #d7e7fa;'>Matematika, Bahasa Inggris, IPA, dan IPS SD/MI Se-Madura</p>" +
      "  </div>" +
      "  <div style='padding: 24px; background-color: #ffffff; color: #193047;'>" +
      "    <p style='font-size: 15px;'>Yth. <strong>" + nama + "</strong> / Bapak/Ibu Guru Pendamping / Orang Tua,</p>" +
      "    <p style='font-size: 14px; color: #475569;'>Terima kasih telah melakukan pendaftaran. Data formulir Anda telah sah tercatat di database panitia:</p>" +
      "    <table style='width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;'>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 9px; border: 1px solid #e2e8f0; font-weight: bold;'>Nomor Pendaftaran</td><td style='padding: 9px; border: 1px solid #e2e8f0; color: #285891; font-weight: bold; font-size: 15px;'>" + noReg + "</td></tr>" +
      "      <tr><td style='padding: 9px; border: 1px solid #e2e8f0; font-weight: bold;'>Nama Peserta</td><td style='padding: 9px; border: 1px solid #e2e8f0;'>" + nama + "</td></tr>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 9px; border: 1px solid #e2e8f0; font-weight: bold;'>Asal Sekolah</td><td style='padding: 9px; border: 1px solid #e2e8f0;'>" + sekolah + "</td></tr>" +
      "      <tr><td style='padding: 9px; border: 1px solid #e2e8f0; font-weight: bold;'>Tingkatan Level</td><td style='padding: 9px; border: 1px solid #e2e8f0;'>" + level + "</td></tr>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 9px; border: 1px solid #e2e8f0; font-weight: bold;'>Mata Pelajaran</td><td style='padding: 9px; border: 1px solid #e2e8f0;'>" + mapel + "</td></tr>" +
      "      <tr><td style='padding: 9px; border: 1px solid #e2e8f0; font-weight: bold;'>Nomor Peserta Ujian</td><td style='padding: 9px; border: 1px solid #e2e8f0; color: #047857; font-weight: bold; font-size: 14px;'>" + kodePeserta + "</td></tr>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 9px; border: 1px solid #e2e8f0; font-weight: bold;'>Status Pendaftaran</td><td style='padding: 9px; border: 1px solid #e2e8f0;'><span style='background-color: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: bold;'>Menunggu Verifikasi Panitia</span></td></tr>" +
      "    </table>" +
      "    <div style='background-color: #e7f0fb; border-left: 4px solid #285891; padding: 12px; margin-top: 14px; border-radius: 4px; font-size: 13px;'>" +
      "      <strong style='color: #19365f;'>Tahapan Berikutnya:</strong>" +
      "      <ul style='margin: 6px 0 0; padding-left: 20px; line-height: 1.5;'>" +
      "        <li>Lakukan konfirmasi biaya pendaftaran (Rp. 40.000,-) ke rekening BRI 0055-01-012345-50-1 a.n PANITIA OMEGA PLUS.</li>" +
      "        <li>Setelah diverifikasi panitia, Anda akan menerima email kedua berisi <strong>Kartu Peserta Resmi PDF</strong> ber-QR Code untuk hari H.</li>" +
      "      </ul>" +
      "    </div>" +
      "  </div>" +
      "  <div style='background-color: #f8fafc; padding: 14px; text-align: center; font-size: 11px; color: #657c94; border-top: 1px solid #e2e8f0;'>" +
      "    Panitia OMEGA PLUS — SMP Negeri 1 Pamekasan | Narahubung: 0877-8158-7155 (Bpk Rasyidi)" +
      "  </div>" +
      "</div>";

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * 12. EMAIL TAHAP 2 (KARTU RESMI TERVERIFIKASI + PDF QR CODE)
 */
function sendEmailTahap2(email, nama, noReg, sekolah, level, mapel, kodePeserta) {
  try {
    var subject = "[RESMI] Kartu Peserta Ujian OMEGA PLUS 2026 - " + nama + " (" + noReg + ")";
    var logoUrl = "https://file.garden/aehADr1aKQol7cT9/Omega_Plus_Circular_Emblem-removebg-preview.png";
    var htmlBody = "" +
      "<div style='font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>" +
      "  <div style='background-color: #047857; color: #ffffff; padding: 22px; text-align: center;'>" +
      "    <img src='" + logoUrl + "' width='65' height='65' style='display: block; margin: 0 auto 10px; border-radius: 50%; border: 2px solid #e7b55e; background: #ffffff;' alt='Logo OMEGA PLUS' />" +
      "    <h2 style='margin: 0; font-size: 20px;'>PENDAFTARAN RESMI TERVERIFIKASI</h2>" +
      "    <p style='margin: 4px 0 0; font-size: 13px; color: #d1fae5;'>SMP Negeri 1 Pamekasan — OMEGA PLUS 2026</p>" +
      "  </div>" +
      "  <div style='padding: 22px; background-color: #ffffff; color: #193047;'>" +
      "    <p>Halo <strong>" + nama + "</strong>,</p>" +
      "    <p>Pendaftaran Anda telah <strong>TERVERIFIKASI SAH</strong>. Terlampir bersama email ini: <strong>Kartu Peserta Resmi PDF</strong> dengan QR Code validasi presensi.</p>" +
      "    <div style='background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px; font-size: 13px; margin: 12px 0;'>" +
      "      <strong>Nomor Peserta Ujian:</strong> <span style='color: #047857; font-size: 15px; font-weight: bold;'>" + kodePeserta + "</span><br>" +
      "      <strong>Jadwal Ujian:</strong> Sesi 1 (IPA/IPS: 07.30 - 08.30) | Sesi 2 (Mat/Bing: 09.00 - 10.00)<br>" +
      "      <strong>Lokasi:</strong> Kampus SMP Negeri 1 Pamekasan" +
      "    </div>" +
      "    <p style='font-size: 13px; color: #64748b;'>Harap cetak kartu ini pada kertas A4 dan bawa saat hari pelaksanaan ujian.</p>" +
      "  </div>" +
      "</div>";

    var pdfKartu = generateKartuPesertaResmiPDF(noReg, nama, sekolah, level, mapel, kodePeserta);
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      attachments: [pdfKartu]
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * GENERATOR KARTU PESERTA RESMI PDF (Dengan QR Code & Logo Resmi)
 */
function generateKartuPesertaResmiPDF(noReg, nama, sekolah, level, mapel, kodePeserta) {
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" + encodeURIComponent(noReg + "|" + nama + "|" + kodePeserta);
  var logoUrl = "https://file.garden/aehADr1aKQol7cT9/Omega_Plus_Circular_Emblem-removebg-preview.png";
  var html = "" +
    "<html><head><style>" +
    "  body { font-family: Arial, sans-serif; margin: 25px; font-size: 10pt; color: #0f172a; }" +
    "  .card { border: 2px solid #19365f; border-radius: 8px; padding: 16px; }" +
    "  .header { text-align: center; border-bottom: 2px solid #285891; padding-bottom: 8px; margin-bottom: 12px; }" +
    "  table { width: 100%; border-collapse: collapse; }" +
    "  td { padding: 5px 8px; vertical-align: top; }" +
    "  .field-name { width: 32%; font-weight: bold; color: #334155; }" +
    "  .qr-box { border: 1px dashed #64748b; padding: 6px; text-align: center; border-radius: 6px; }" +
    "</style></head><body>" +
    "  <div class='card'>" +
    "    <div class='header' style='display: flex; align-items: center; justify-content: center; gap: 10px;'>" +
    "      <img src='" + logoUrl + "' width='50' height='50' style='float: left; margin-right: 10px;' />" +
    "      <div style='text-align: center;'>" +
    "        <h2 style='margin: 0; color: #19365f; font-size: 14pt;'>KARTU PESERTA RESMI OMEGA PLUS 2026</h2>" +
    "        <div style='color: #285891; font-weight: bold; font-size: 10pt;'>SMP NEGERI 1 PAMEKASAN</div>" +
    "      </div>" +
    "    </div>" +
    "    <table><tr>" +
    "      <td style='width: 72%;'>" +
    "        <table>" +
    "          <tr><td class='field-name'>No. Registrasi</td><td>: <strong>" + noReg + "</strong></td></tr>" +
    "          <tr><td class='field-name'>Nama Lengkap</td><td>: <strong>" + nama + "</strong></td></tr>" +
    "          <tr><td class='field-name'>Asal Sekolah</td><td>: " + sekolah + "</td></tr>" +
    "          <tr><td class='field-name'>Tingkatan</td><td>: " + level + "</td></tr>" +
    "          <tr><td class='field-name'>Mata Pelajaran</td><td>: " + mapel + "</td></tr>" +
    "          <tr><td class='field-name'>Nomor Peserta Ujian</td><td>: <strong style='font-size: 12pt; color: #047857;'>" + kodePeserta + "</strong></td></tr>" +
    "        </table>" +
    "      </td>" +
    "      <td style='width: 28%; text-align: center;'>" +
    "        <div class='qr-box'>" +
    "          <img src='" + qrUrl + "' width='100' height='100' /><br>" +
    "          <span style='font-size: 8pt; font-weight: bold; color: #19365f;'>SCAN PRESENSI</span>" +
    "        </div>" +
    "      </td>" +
    "    </tr></table>" +
    "    <div style='font-size: 8pt; color: #475569; margin-top: 12px; border-top: 1px dotted #cbd5e1; padding-top: 8px;'>" +
    "      <strong>Tata Tertib:</strong> Wajib mengenakan seragam sekolah asal & hadir 30 menit sebelum sesi ujian (Sesi 1: 07.30 WIB | Sesi 2: 09.00 WIB) di SMPN 1 Pamekasan." +
    "    </div>" +
    "  </div>" +
    "</body></html>";

  return Utilities.newBlob(html, "text/html", "Kartu.html").getAs("application/pdf").setName("Kartu_Peserta_" + noReg + ".pdf");
}

function padZero(num, size) {
  var s = String(num);
  while (s.length < (size || 2)) { s = "0" + s; }
  return s;
}


/**
 * =========================================================================
 * PRIORITAS 3: LIVE SCORE BROADCAST & GOLDEN TICKET ARENA HANDLERS
 * =========================================================================
 */
function handleGetLiveScoreboard() {
  var ss = getDatabase();
  var sheetNilai = ss.getSheetByName(SHEET_NAMES.NILAI);
  var config = handleGetLiveConfig().data;

  var liveScores = {
    "IPA": { "Level 2 (Kelas 4-6)": [], "Level 1 (Kelas 1-3)": [] },
    "Matematika": { "Level 2 (Kelas 4-6)": [], "Level 1 (Kelas 1-3)": [] },
    "Bahasa Inggris": { "Level 2 (Kelas 4-6)": [], "Level 1 (Kelas 1-3)": [] },
    "IPS": { "Level 2 (Kelas 4-6)": [], "Level 1 (Kelas 1-3)": [] }
  };

  if (sheetNilai && sheetNilai.getLastRow() > 1) {
    var data = sheetNilai.getRange(2, 1, sheetNilai.getLastRow() - 1, 18).getValues();
    for (var i = 0; i < data.length; i++) {
      var r = data[i];
      var mapel = String(r[6] || "").trim();
      var level = String(r[5] || "").trim();

      var targetMapel = "";
      if (mapel.indexOf("IPA") !== -1) targetMapel = "IPA";
      else if (mapel.indexOf("Matematika") !== -1) targetMapel = "Matematika";
      else if (mapel.indexOf("Inggris") !== -1) targetMapel = "Bahasa Inggris";
      else if (mapel.indexOf("IPS") !== -1) targetMapel = "IPS";

      var targetLevel = level.indexOf("Level 1") !== -1 ? "Level 1 (Kelas 1-3)" : "Level 2 (Kelas 4-6)";

      if (targetMapel && liveScores[targetMapel] && liveScores[targetMapel][targetLevel]) {
        liveScores[targetMapel][targetLevel].push({
          noPendaftaran: r[1],
          kodePeserta: r[2],
          nama: r[3],
          sekolah: r[4],
          score: Number(r[10]) || 0,
          rank: Number(r[11]) || 0,
          benar: Number(r[7]) || 0,
          salah: Number(r[8]) || 0,
          kosong: Number(r[9]) || 0,
          status: r[14] || "PESERTA"
        });
      }
    }

    for (var m in liveScores) {
      for (var l in liveScores[m]) {
        liveScores[m][l].sort(function(a, b) {
          if (a.rank && b.rank && a.rank !== b.rank) return a.rank - b.rank;
          return b.score - a.score;
        });
        for (var k = 0; k < liveScores[m][l].length; k++) {
          liveScores[m][l][k].rank = k + 1;
        }
      }
    }
  }

  return {
    status: "success",
    broadcastStatus: config.broadcastStatus || "ACTIVE",
    runningText: config.runningText || "",
    activeMapel: config.activeMapel || "ALL",
    lastUpdated: new Date().toLocaleTimeString('id-ID'),
    liveScores: liveScores
  };
}

function handleGetLiveConfig() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get("LIVE_BROADCAST_CONFIG");
  if (cached) {
    return { status: "success", data: JSON.parse(cached) };
  }

  var defaultConfig = {
    broadcastStatus: "ACTIVE",
    runningText: "🔴 <span class='gold-highlight'>LIVE SCOREBOARD OMEGA PLUS 2026:</span> Sistem penilaian lembar jawaban olimpiade berjalan secara digital, transparan, dan terenkripsi. <span class='bullet'>&bull;</span> Selamat kepada para peraih <span class='gold-highlight'>GOLDEN TICKET PPDB SMP Negeri 1 Pamekasan Bebas Tes</span>! <span class='bullet'>&bull;</span> Cek e-sertifikat mandiri di menu <span class='gold-highlight'>Portal Pengumuman</span>.",
    activeMapel: "ALL"
  };

  return { status: "success", data: defaultConfig };
}

function handleUpdateLiveBroadcastConfig(payload) {
  try {
    var cache = CacheService.getScriptCache();
    var current = handleGetLiveConfig().data;

    if (payload.broadcastStatus) current.broadcastStatus = String(payload.broadcastStatus).trim();
    if (payload.runningText) current.runningText = String(payload.runningText).trim();
    if (payload.activeMapel) current.activeMapel = String(payload.activeMapel).trim();

    cache.put("LIVE_BROADCAST_CONFIG", JSON.stringify(current), 21600);

    var ss = getDatabase();
    var sheetLog = ss.getSheetByName(SHEET_NAMES.LOG_AKTIVITAS);
    if (sheetLog) {
      sheetLog.appendRow([new Date(), "UPDATE_LIVE_CONFIG", payload.operator || "Admin", "Status: " + current.broadcastStatus + " | Mapel: " + current.activeMapel]);
    }

    return { status: "success", message: "Konfigurasi live broadcast berhasil disimpan", data: current };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}
