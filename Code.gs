/**
 * =========================================================================
 * BACKEND SISTEM PENDAFTARAN OLIMPIADE OMEGA PLUS
 * SMP NEGERI 1 PAMEKASAN - SE-MADURA
 * =========================================================================
 * File: Code.gs
 * Fungsi Utama:
 * 1. setupDatabase()       : Inisialisasi otomatis Spreadsheet & sheet pendukung
 * 2. doGet() & doPost()    : RESTful API controller untuk frontend Cloudflare Pages
 * 3. daftarPeserta()       : Logika pendaftaran, generate kode XX-YY-ZZZ & email tahap 1
 * 4. verifikasiPeserta()   : Verifikasi admin, generate kartu peserta resmi & email tahap 2
 * 5. getDashboardStats()   : Real-time 7 metrik & sebaran grafik
 * =========================================================================
 */

// KONFIGURASI GLOBAL
// Jika dibiarkan kosong (""), setupDatabase() akan otomatis membuat Spreadsheet baru di Drive Anda!
var SPREADSHEET_ID = ""; 

var SHEET_NAMES = {
  PESERTA: "PESERTA",
  PENGATURAN: "PENGATURAN",
  LOG_EMAIL: "LOG_EMAIL",
  LOG_AKTIVITAS: "LOG_AKTIVITAS"
};

/**
 * 1. FUNGSI OTOMATISASI SETUP DATABASE
 * Jalankan fungsi ini SATU KALI dari Apps Script editor untuk menyiapkan database.
 */
function setupDatabase() {
  var ss;
  var props = PropertiesService.getScriptProperties();
  var savedId = props.getProperty("SPREADSHEET_ID") || SPREADSHEET_ID;

  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
      Logger.log("Menggunakan Spreadsheet yang ada: " + ss.getUrl());
    } catch (e) {
      Logger.log("ID Spreadsheet tidak valid atau tidak dapat diakses. Membuat yang baru...");
      ss = null;
    }
  }

  if (!ss) {
    ss = SpreadsheetApp.create("DATABASE_OMEGA_PLUS_2026");
    props.setProperty("SPREADSHEET_ID", ss.getId());
    Logger.log("BERHASIL MEMBUAT DATABASE BARU: " + ss.getUrl());
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
    ["Sesi_1", "IPA & IPS (07.30 - 08.30 WIB)", "Jadwal Ujian Sesi 1"],
    ["Sesi_2", "Matematika & Bahasa Inggris (09.00 - 10.00 WIB)", "Jadwal Ujian Sesi 2"]
  ];

  if (sheetPengaturan.getLastRow() <= 1) {
    sheetPengaturan.getRange(2, 1, defaultSettings.length, 3).setValues(defaultSettings);
    sheetPengaturan.autoResizeColumns(1, 3);
  }

  // --- SHEET 3: LOG_EMAIL ---
  var sheetLogEmail = getOrCreateSheet(ss, SHEET_NAMES.LOG_EMAIL);
  var headersLogEmail = ["Timestamp", "No_Pendaftaran", "Email_Tujuan", "Tahap_Email", "Status_Kirim", "Pesan_Error"];
  styleHeader(sheetLogEmail, headersLogEmail, "#475569", "#ffffff");

  // --- SHEET 4: LOG_AKTIVITAS ---
  var sheetLogAkt = getOrCreateSheet(ss, SHEET_NAMES.LOG_AKTIVITAS);
  var headersLogAkt = ["Timestamp", "Aksi", "Admin", "Detail_Perubahan"];
  styleHeader(sheetLogAkt, headersLogAkt, "#475569", "#ffffff");

  Logger.log("SETUP DATABASE SELESAI!");
  Logger.log("URL SPREADSHEET: " + ss.getUrl());
  return {
    status: "success",
    message: "Setup database berhasil",
    spreadsheetId: ss.getId(),
    url: ss.getUrl()
  };
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
        result = handleCekStatus(e.parameter.keyword);
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
        result = handleDaftarPeserta(payload);
        break;

      case "verifyAdminPin":
        result = handleVerifyAdminPin(payload.pin);
        break;

      case "verifikasiPeserta":
        result = handleVerifikasiPeserta(payload);
        break;

      case "updatePeserta":
        result = handleUpdatePeserta(payload);
        break;

      case "deletePeserta":
        result = handleDeletePeserta(payload);
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
 * Mengambil Pengaturan Publik (Biaya, kontak, sesi, status)
 */
function handleGetPublicConfig() {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  var data = sheet.getDataRange().getValues();
  var config = {};
  for (var i = 1; i < data.length; i++) {
    var key = data[i][0];
    var val = data[i][1];
    config[key] = val;
  }
  return { status: "success", data: config };
}

/**
 * Verifikasi PIN Admin
 */
function handleVerifyAdminPin(inputPin) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PENGATURAN);
  var data = sheet.getDataRange().getValues();
  var truePin = "123456";

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === "Admin_PIN") {
      truePin = String(data[i][1]).trim();
      break;
    }
  }

  if (String(inputPin).trim() === truePin) {
    return { status: "success", message: "Autentikasi Admin Berhasil", authorized: true };
  } else {
    return { status: "error", message: "PIN Admin tidak valid!", authorized: false };
  }
}

/**
 * 4. LOGIKA PENDAFTARAN PESERTA BARU
 * Menghasilkan:
 * - Master Registration ID: OMP-2026-XXXX
 * - Kode Peserta per Mapel: XX-YY-ZZZ
 */
function handleDaftarPeserta(data) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var nama = String(data.nama || "").trim().toUpperCase();
    var sekolah = String(data.sekolah || "").trim().toUpperCase();
    var tglDaftar = data.tglDaftar || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    var noHp = String(data.noHp || "").trim();
    var email = String(data.email || "").trim().toLowerCase();
    var level = String(data.level || "").trim(); // "Level 1" atau "Level 2"
    var mapelArray = Array.isArray(data.mapel) ? data.mapel : (data.mapel ? [data.mapel] : []);

    if (!nama || !sekolah || !noHp || !email || !level || mapelArray.length === 0) {
      return { status: "error", message: "Semua kolom bertanda bintang (*) wajib diisi!" };
    }

    var rows = sheet.getDataRange().getValues();
    var totalExisting = rows.length - 1; // baris ke-1 adalah header
    var newMasterSeq = totalExisting + 1;
    var yearStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy");
    var noPendaftaran = "OMP-" + yearStr + "-" + padZero(newMasterSeq, 4);

    // KODIFIKASI MAPEL: XX-YY-ZZZ
    // XX: 01 (Level 1) atau 02 (Level 2)
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

      // Hitung urutan ZZZ untuk kombinasi level & mapel ini
      var countCombo = 1;
      for (var r = 1; r < rows.length; r++) {
        var rLevel = rows[r][7]; // Kolom Level
        var rKodeList = String(rows[r][9] || ""); // Kolom Kode_Peserta_Mapel
        var prefixToMatch = levelCode + "-" + codeYY;
        if (rKodeList.indexOf(prefixToMatch) !== -1) {
          countCombo++;
        }
      }

      var codeZZZ = padZero(countCombo, 3);
      kodePesertaList.push(levelCode + "-" + codeYY + "-" + codeZZZ);
    }

    var kodePesertaStr = kodePesertaList.join(", ");
    var mapelStr = mapelCleanList.join(", ");
    var timestamp = new Date();
    var statusVerif = "Menunggu Verifikasi";
    var catatan = "Pendaftaran via Web Portal";
    var waktuVerif = "-";
    var statusEmail = "Pending";

    // Simpan baris baru ke Sheet PESERTA
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
      catatan,
      waktuVerif,
      statusEmail
    ]);

    // Kirim Email Tahap 1: Konfirmasi Pendaftaran Diterima
    var emailResult = sendEmailTahap1(email, nama, noPendaftaran, sekolah, level, mapelStr, kodePesertaStr);
    
    // Update status email di baris terakhir
    var lastRow = sheet.getLastRow();
    if (emailResult.success) {
      sheet.getRange(lastRow, 14).setValue("Terkirim (Tahap 1)");
    } else {
      sheet.getRange(lastRow, 14).setValue("Gagal Kirim: " + emailResult.error);
    }

    logAktivitas("DAFTAR_BARU", "Sistem Publik", "Pendaftaran baru: " + noPendaftaran + " - " + nama);

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
    return { status: "error", message: "Gagal menyimpan pendaftaran: " + err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 5. GET DASHBOARD METRICS (7 Cards & Bar Charts)
 */
function handleGetDashboardStats() {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var rows = sheet.getDataRange().getValues();

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

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[1]) continue; // jika nomor pendaftaran kosong
    stats.total++;

    var lvl = String(row[7] || "");
    if (lvl.indexOf("1") !== -1) stats.level1++;
    if (lvl.indexOf("2") !== -1) stats.level2++;

    var mapel = String(row[8] || "");
    if (mapel.indexOf("Matematika") !== -1) stats.matematika++;
    if (mapel.indexOf("Bahasa Inggris") !== -1) stats.bahasaInggris++;
    if (mapel.indexOf("IPA") !== -1) stats.ipa++;
    if (mapel.indexOf("IPS") !== -1) stats.ips++;

    var status = String(row[10] || "");
    if (status === "Terverifikasi") {
      stats.verified++;
    } else {
      stats.pending++;
    }
  }

  return { status: "success", data: stats };
}

/**
 * 6. GET PESERTA LIST (Untuk Tabel Admin)
 */
function handleGetPesertaList(params) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var rows = sheet.getDataRange().getValues();
  var list = [];

  var filterLevel = params ? params.level : "";
  var filterMapel = params ? params.mapel : "";
  var search = params ? String(params.search || "").toLowerCase() : "";

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
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

    // Filter Level
    if (filterLevel && filterLevel !== "Semua" && level.indexOf(filterLevel) === -1) {
      continue;
    }

    // Filter Mapel
    if (filterMapel && filterMapel !== "Semua" && mapel.indexOf(filterMapel) === -1) {
      continue;
    }

    // Search query
    if (search) {
      var searchContent = (noReg + " " + nama + " " + sekolah + " " + noHp + " " + email).toLowerCase();
      if (searchContent.indexOf(search) === -1) {
        continue;
      }
    }

    list.push({
      rowIndex: i + 1,
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
 * 7. CEK STATUS PENDAFTARAN MANDIRI (Untuk Pendaftar)
 */
function handleCekStatus(keyword) {
  if (!keyword) {
    return { status: "error", message: "Masukkan Nomor Pendaftaran atau Nomor HP / Email!" };
  }

  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var rows = sheet.getDataRange().getValues();
  var query = String(keyword).trim().toLowerCase();
  var results = [];

  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
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
    }
  }

  if (results.length === 0) {
    return { status: "error", message: "Data pendaftaran tidak ditemukan. Pastikan nomor pendaftaran / HP sudah benar." };
  }

  return { status: "success", data: results };
}

/**
 * 8. VERIFIKASI PESERTA (Admin Action -> Trigger Email Tahap 2 & Kartu PDF)
 */
function handleVerifikasiPeserta(payload) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var noPendaftaran = String(payload.noPendaftaran || "").trim();
  var statusBaru = payload.status || "Terverifikasi";
  var catatan = payload.catatan || "Telah diverifikasi oleh Panitia OMEGA PLUS";

  if (!noPendaftaran) {
    return { status: "error", message: "Nomor pendaftaran wajib disertakan!" };
  }

  var rows = sheet.getDataRange().getValues();
  var targetRow = -1;
  var rowData = null;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === noPendaftaran) {
      targetRow = i + 1;
      rowData = rows[i];
      break;
    }
  }

  if (targetRow === -1) {
    return { status: "error", message: "Peserta tidak ditemukan!" };
  }

  var waktuNow = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
  sheet.getRange(targetRow, 11).setValue(statusBaru); // Kolom K: Status_Verifikasi
  sheet.getRange(targetRow, 12).setValue(catatan);    // Kolom L: Catatan_Panitia
  sheet.getRange(targetRow, 13).setValue(waktuNow);   // Kolom M: Waktu_Verifikasi

  // Jika status Terverifikasi, kirim Email Tahap 2 + Kartu Peserta PDF Resmi
  if (statusBaru === "Terverifikasi") {
    var email = String(rowData[6]);
    var nama = String(rowData[2]);
    var sekolah = String(rowData[3]);
    var level = String(rowData[7]);
    var mapel = String(rowData[8]);
    var kodePeserta = String(rowData[9]);

    var emailRes = sendEmailTahap2(email, nama, noPendaftaran, sekolah, level, mapel, kodePeserta);
    if (emailRes.success) {
      sheet.getRange(targetRow, 14).setValue("Terkirim (Tahap 2 Resmi)");
    } else {
      sheet.getRange(targetRow, 14).setValue("Gagal Kirim Tahap 2: " + emailRes.error);
    }
  }

  logAktivitas("VERIFIKASI", "Admin", "Verifikasi status " + statusBaru + " untuk: " + noPendaftaran);

  return { status: "success", message: "Status peserta berhasil diperbarui menjadi: " + statusBaru };
}

/**
 * 9. UPDATE DATA PESERTA (Admin Edit)
 */
function handleUpdatePeserta(payload) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var noReg = String(payload.noPendaftaran || "").trim();

  if (!noReg) {
    return { status: "error", message: "Nomor pendaftaran wajib diisi!" };
  }

  var rows = sheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === noReg) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { status: "error", message: "Data tidak ditemukan!" };
  }

  if (payload.nama) sheet.getRange(targetRow, 3).setValue(String(payload.nama).toUpperCase());
  if (payload.sekolah) sheet.getRange(targetRow, 4).setValue(String(payload.sekolah).toUpperCase());
  if (payload.noHp) sheet.getRange(targetRow, 6).setValue(String(payload.noHp));
  if (payload.email) sheet.getRange(targetRow, 7).setValue(String(payload.email).toLowerCase());
  if (payload.level) sheet.getRange(targetRow, 8).setValue(String(payload.level));
  if (payload.mapel) sheet.getRange(targetRow, 9).setValue(String(payload.mapel));

  logAktivitas("EDIT_DATA", "Admin", "Perubahan data peserta: " + noReg);
  return { status: "success", message: "Data peserta berhasil diperbarui!" };
}

/**
 * 10. HAPUS DATA PESERTA (Admin Delete)
 */
function handleDeletePeserta(payload) {
  var ss = getDatabase();
  var sheet = ss.getSheetByName(SHEET_NAMES.PESERTA);
  var noReg = String(payload.noPendaftaran || "").trim();

  if (!noReg) {
    return { status: "error", message: "Nomor pendaftaran wajib disertakan!" };
  }

  var rows = sheet.getDataRange().getValues();
  var targetRow = -1;

  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === noReg) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) {
    return { status: "error", message: "Data pendaftaran tidak ditemukan!" };
  }

  sheet.deleteRow(targetRow);
  logAktivitas("HAPUS_DATA", "Admin", "Menghapus peserta: " + noReg);
  return { status: "success", message: "Data peserta " + noReg + " berhasil dihapus." };
}

/**
 * 11. ENGINE PENGIRIMAN EMAIL TAHAP 1 (Pendaftaran Diterima)
 */
function sendEmailTahap1(email, nama, noReg, sekolah, level, mapel, kodePeserta) {
  try {
    var subject = "[OMEGA PLUS 2026] Konfirmasi Pendaftaran Diterima - " + nama + " (" + noReg + ")";
    var htmlBody = "" +
      "<div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>" +
      "  <div style='background-color: #19365f; color: #ffffff; padding: 24px; text-align: center;'>" +
      "    <h2 style='margin: 0; font-size: 22px; letter-spacing: 1px;'>SMP NEGERI 1 PAMEKASAN</h2>" +
      "    <p style='margin: 6px 0 0 0; color: #e7b55e; font-weight: bold;'>OLIMPIADE AKADEMIK OMEGA PLUS 2026</p>" +
      "    <p style='margin: 4px 0 0 0; font-size: 13px; color: #d7e7fa;'>Tingkat SD/MI Sederajat Se-Madura</p>" +
      "  </div>" +
      "  <div style='padding: 24px; background-color: #ffffff; color: #193047;'>" +
      "    <p>Yth. <strong>" + nama + "</strong> / Bapak/Ibu Guru Pendamping / Orang Tua,</p>" +
      "    <p>Terima kasih telah mendaftar pada ajang <strong>OMEGA PLUS 2026</strong>. Berkas formulir pendaftaran Anda telah berhasil kami terima dengan rincian sebagai berikut:</p>" +
      "    <table style='width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;'>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>Nomor Pendaftaran</td><td style='padding: 10px; border: 1px solid #e2e8f0; color: #285891; font-weight: bold; font-size: 16px;'>" + noReg + "</td></tr>" +
      "      <tr><td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>Nama Peserta</td><td style='padding: 10px; border: 1px solid #e2e8f0;'>" + nama + "</td></tr>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>Asal Sekolah</td><td style='padding: 10px; border: 1px solid #e2e8f0;'>" + sekolah + "</td></tr>" +
      "      <tr><td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>Tingkatan Level</td><td style='padding: 10px; border: 1px solid #e2e8f0;'>" + level + "</td></tr>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>Mata Pelajaran</td><td style='padding: 10px; border: 1px solid #e2e8f0;'>" + mapel + "</td></tr>" +
      "      <tr><td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>Kode Peserta Ujian</td><td style='padding: 10px; border: 1px solid #e2e8f0; color: #047857; font-weight: bold;'>" + kodePeserta + "</td></tr>" +
      "      <tr style='background-color: #f8fafc;'><td style='padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;'>Status Saat Ini</td><td style='padding: 10px; border: 1px solid #e2e8f0;'><span style='background-color: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 999px; font-weight: bold;'>Menunggu Verifikasi Panitia</span></td></tr>" +
      "    </table>" +
      "    <div style='background-color: #e7f0fb; border-left: 4px solid #285891; padding: 14px; margin-top: 16px; border-radius: 6px;'>" +
      "      <h4 style='margin: 0 0 8px 0; color: #19365f;'>Tahapan Selanjutnya:</h4>" +
      "      <ol style='margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;'>" +
      "        <li>Panitia akan memverifikasi data dan biaya pendaftaran (Rp. 40.000,-).</li>" +
      "        <li>Setelah verifikasi disetujui, Anda akan menerima email kedua yang memuat <strong>Kartu Peserta Resmi (PDF)</strong> ber-QR Code untuk tanda masuk ujian.</li>" +
      "        <li>Terlampir bersama email ini: <strong>Surat Petunjuk Teknis & Bukti Pendaftaran Sementara</strong>.</li>" +
      "      </ol>" +
      "    </div>" +
      "  </div>" +
      "  <div style='background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #657c94; border-top: 1px solid #e2e8f0;'>" +
      "    Panitia OMEGA PLUS — SMP Negeri 1 Pamekasan | Helpdesk: 0877-8158-7155 / 0852-5934-9169" +
      "  </div>" +
      "</div>";

    // Generate Lampiran PDF 1: Surat Informasi Panitia
    var pdfSurat = generateSuratInfoPanitiaPDF();
    // Generate Lampiran PDF 2: Bukti Pendaftaran Sementara
    var pdfBukti = generateBuktiPendaftaranPDF(noReg, nama, sekolah, level, mapel, kodePeserta);

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      attachments: [pdfSurat, pdfBukti]
    });

    catatLogEmail(noReg, email, "Tahap 1 (Konfirmasi Masuk)", "Sukses", "-");
    return { success: true };
  } catch (e) {
    catatLogEmail(noReg, email, "Tahap 1 (Konfirmasi Masuk)", "Gagal", e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * 12. ENGINE PENGIRIMAN EMAIL TAHAP 2 (Kartu Peserta Resmi Terverifikasi)
 */
function sendEmailTahap2(email, nama, noReg, sekolah, level, mapel, kodePeserta) {
  try {
    var subject = "[RESMI] Kartu Peserta Ujian OMEGA PLUS 2026 - " + nama + " (" + noReg + ")";
    var htmlBody = "" +
      "<div style='font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;'>" +
      "  <div style='background-color: #047857; color: #ffffff; padding: 24px; text-align: center;'>" +
      "    <h2 style='margin: 0; font-size: 22px;'>PENDAFTARAN RESMI TERVERIFIKASI</h2>" +
      "    <p style='margin: 6px 0 0 0; color: #d1fae5; font-size: 14px;'>Selamat! Anda telah sah terdaftar sebagai peserta OMEGA PLUS 2026</p>" +
      "  </div>" +
      "  <div style='padding: 24px; background-color: #ffffff; color: #193047;'>" +
      "    <p>Halo <strong>" + nama + "</strong>,</p>" +
      "    <p>Panitia OMEGA PLUS SMP Negeri 1 Pamekasan menyatakan pendaftaran Anda telah <strong>TERVERIFIKASI</strong> secara resmi.</p>" +
      "    <p>Bersama email ini kami lampirkan <strong>KARTU PESERTA UJIAN RESMI (PDF)</strong> ber-QR Code presensi. Harap cetak kartu ini pada kertas A4 dan bawa saat hari pelaksanaan ujian di SMP Negeri 1 Pamekasan.</p>" +
      "    <div style='background-color: #f0fdf4; border: 1px dashed #059669; padding: 16px; border-radius: 8px; margin: 16px 0;'>" +
      "      <p style='margin: 0; font-weight: bold; color: #047857;'>Rincian Jadwal & Sesi Lomba:</p>" +
      "      <ul style='margin: 8px 0 0 0; padding-left: 20px; font-size: 13px; color: #166534;'>" +
      "        <li><strong>Sesi 1 (07.30 - 08.30 WIB):</strong> IPA & IPS</li>" +
      "        <li><strong>Sesi 2 (09.00 - 10.00 WIB):</strong> Matematika & Bahasa Inggris</li>" +
      "        <li><strong>Lokasi:</strong> Kampus SMP Negeri 1 Pamekasan</li>" +
      "      </ul>" +
      "    </div>" +
      "    <p style='font-size: 13px; color: #475569;'>Tunjukkan QR Code pada kartu peserta kepada panitia di gerbang masuk untuk pencatatan presensi digital.</p>" +
      "  </div>" +
      "  <div style='background-color: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #657c94; border-top: 1px solid #e2e8f0;'>" +
      "    Semangat berprestasi, tumbuh bersama! ✦ Panitia OMEGA PLUS SMPN 1 Pamekasan" +
      "  </div>" +
      "</div>";

    // Generate Kartu Peserta Resmi PDF
    var pdfKartu = generateKartuPesertaResmiPDF(noReg, nama, sekolah, level, mapel, kodePeserta);

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      attachments: [pdfKartu]
    });

    catatLogEmail(noReg, email, "Tahap 2 (Kartu Resmi Terverifikasi)", "Sukses", "-");
    return { success: true };
  } catch (e) {
    catatLogEmail(noReg, email, "Tahap 2 (Kartu Resmi Terverifikasi)", "Gagal", e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * GENERATE PDF 1: SURAT INFORMASI PANITIA
 */
function generateSuratInfoPanitiaPDF() {
  var html = "" +
    "<html><head><style>" +
    "  body { font-family: Arial, sans-serif; margin: 30px; font-size: 12pt; color: #0f172a; line-height: 1.5; }" +
    "  .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; }" +
    "  .title { font-size: 15pt; font-weight: bold; margin: 0; }" +
    "  .subtitle { font-size: 11pt; margin: 3px 0; color: #334155; }" +
    "  .box-benefit { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 12px; margin: 15px 0; border-radius: 6px; }" +
    "  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }" +
    "  th, td { border: 1px solid #64748b; padding: 6px 10px; text-align: left; }" +
    "  th { background-color: #e2e8f0; font-weight: bold; }" +
    "  .ttd { margin-top: 40px; float: right; width: 250px; text-align: center; }" +
    "</style></head><body>" +
    "  <div class='header'>" +
    "    <div class='title'>PANITIA OLIMPIADE OMEGA PLUS 2026</div>" +
    "    <div class='title'>SMP NEGERI 1 PAMEKASAN</div>" +
    "    <div class='subtitle'>Ajang Prestasi Se-Madura: Matematika, Bahasa Inggris, IPA, dan IPS SD/MI</div>" +
    "  </div>" +
    "  <p style='text-align: right; font-size: 10pt;'>Pamekasan, 2026</p>" +
    "  <p><strong>Hal: Informasi Pelaksanaan Lomba & Hadiah Pemenang</strong></p>" +
    "  <p>Dengan hormat, kami sampaikan informasi penting bagi calon peserta olimpiade akademik OMEGA PLUS 2026:</p>" +
    "  <div class='box-benefit'>" +
    "    <strong>APRESIASI & HADIAH PEMENANG:</strong><br>" +
    "    • <strong>Juara 1, 2, 3:</strong> Piala + Uang Pembinaan + Sertifikat + <u>DITERIMA TANPA TES DI KELAS UNGGULAN SMPN 1 PAMEKASAN</u> + Bonus Kain Seragam & Bebas Biaya Buku Selama 3 Tahun.<br>" +
    "    • <strong>Juara 4, 5, 6:</strong> Piala + Uang Pembinaan + Sertifikat + <u>DITERIMA TANPA TES DI KELAS UNGGULAN</u> + Bonus Kain Seragam.<br>" +
    "    • <strong>Peringkat 7 s/d 10:</strong> Sertifikat Finalis + <u>DITERIMA TANPA TES DI KELAS UNGGULAN</u>." +
    "  </div>" +
    "  <strong>JADWAL PELAKSANAAN:</strong>" +
    "  <table>" +
    "    <tr><th>Sesi</th><th>Mata Pelajaran</th><th>Waktu</th><th>Tempat</th></tr>" +
    "    <tr><td>Sesi 1</td><td>IPA & IPS</td><td>07.30 - 08.30 WIB</td><td>SMP Negeri 1 Pamekasan</td></tr>" +
    "    <tr><td>Sesi 2</td><td>Matematika & Bahasa Inggris</td><td>09.00 - 10.00 WIB</td><td>SMP Negeri 1 Pamekasan</td></tr>" +
    "  </table>" +
    "  <div class='ttd'>" +
    "    <p>Mengetahui,<br><strong>Panitia OMEGA PLUS</strong></p>" +
    "    <br><br><br>" +
    "    <p><u>( PANITIA PELAKSANA )</u></p>" +
    "  </div>" +
    "</body></html>";

  return Utilities.newBlob(html, "text/html", "Surat_Informasi_Panitia.html").getAs("application/pdf").setName("Surat_Informasi_Panitia_OMEGA_PLUS.pdf");
}

/**
 * GENERATE PDF 2: BUKTI PENDAFTARAN SEMENTARA
 */
function generateBuktiPendaftaranPDF(noReg, nama, sekolah, level, mapel, kodePeserta) {
  var tglStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMMM yyyy");
  var html = "" +
    "<html><head><style>" +
    "  body { font-family: Arial, sans-serif; margin: 30px; font-size: 11pt; color: #1e293b; }" +
    "  .header { text-align: center; border-bottom: 2px solid #19365f; padding-bottom: 10px; margin-bottom: 20px; }" +
    "  table { width: 100%; border-collapse: collapse; margin-top: 15px; }" +
    "  td { padding: 8px 12px; border: 1px solid #cbd5e1; }" +
    "  td.label { width: 35%; background-color: #f8fafc; font-weight: bold; }" +
    "  .badge { background-color: #fef3c7; color: #b45309; padding: 4px 8px; font-weight: bold; border-radius: 4px; }" +
    "</style></head><body>" +
    "  <div class='header'>" +
    "    <h2 style='margin: 0; color: #19365f;'>BUKTI PENDAFTARAN SEMENTARA</h2>" +
    "    <p style='margin: 4px 0 0 0; color: #475569;'>OMEGA PLUS — Olimpiade SD/MI SMP Negeri 1 Pamekasan</p>" +
    "  </div>" +
    "  <table>" +
    "    <tr><td class='label'>Nomor Pendaftaran</td><td><strong>" + noReg + "</strong></td></tr>" +
    "    <tr><td class='label'>Nama Peserta</td><td>" + nama + "</td></tr>" +
    "    <tr><td class='label'>Asal Sekolah</td><td>" + sekolah + "</td></tr>" +
    "    <tr><td class='label'>Tingkatan Level</td><td>" + level + "</td></tr>" +
    "    <tr><td class='label'>Mata Pelajaran</td><td>" + mapel + "</td></tr>" +
    "    <tr><td class='label'>Kode Peserta per Mapel</td><td><strong>" + kodePeserta + "</strong></td></tr>" +
    "    <tr><td class='label'>Status Dokumen</td><td><span class='badge'>Menunggu Verifikasi Pembayaran</span></td></tr>" +
    "  </table>" +
    "  <p style='margin-top: 30px; text-align: right;'>Dicetak otomatis pada: " + tglStr + "<br><strong>Panitia OMEGA PLUS</strong></p>" +
    "</body></html>";

  return Utilities.newBlob(html, "text/html", "Bukti.html").getAs("application/pdf").setName("Bukti_Pendaftaran_" + noReg + ".pdf");
}

/**
 * GENERATE PDF 3: KARTU PESERTA RESMI (Dengan QR Code)
 */
function generateKartuPesertaResmiPDF(noReg, nama, sekolah, level, mapel, kodePeserta) {
  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=" + encodeURIComponent(noReg + "|" + nama + "|" + kodePeserta);
  var html = "" +
    "<html><head><style>" +
    "  body { font-family: Arial, sans-serif; margin: 30px; font-size: 11pt; color: #0f172a; }" +
    "  .card { border: 3px solid #19365f; border-radius: 10px; padding: 20px; }" +
    "  .header { text-align: center; border-bottom: 2px solid #285891; padding-bottom: 10px; margin-bottom: 15px; }" +
    "  table { width: 100%; border-collapse: collapse; }" +
    "  td { padding: 6px 10px; vertical-align: top; }" +
    "  .field-name { width: 30%; font-weight: bold; color: #334155; }" +
    "  .qr-box { border: 1px dashed #64748b; padding: 8px; text-align: center; border-radius: 8px; }" +
    "  .rules { font-size: 9pt; color: #475569; margin-top: 15px; border-top: 1px dotted #cbd5e1; padding-top: 10px; }" +
    "</style></head><body>" +
    "  <div class='card'>" +
    "    <div class='header'>" +
    "      <h2 style='margin: 0; color: #19365f; font-size: 16pt;'>KARTU PESERTA RESMI OMEGA PLUS 2026</h2>" +
    "      <div style='color: #285891; font-weight: bold; margin-top: 2px;'>SMP NEGERI 1 PAMEKASAN</div>" +
    "    </div>" +
    "    <table>" +
    "      <tr>" +
    "        <td style='width: 70%;'>" +
    "          <table>" +
    "            <tr><td class='field-name'>No. Registrasi</td><td>: <strong>" + noReg + "</strong></td></tr>" +
    "            <tr><td class='field-name'>Nama Lengkap</td><td>: <strong>" + nama + "</strong></td></tr>" +
    "            <tr><td class='field-name'>Asal Sekolah</td><td>: " + sekolah + "</td></tr>" +
    "            <tr><td class='field-name'>Tingkatan</td><td>: " + level + "</td></tr>" +
    "            <tr><td class='field-name'>Mata Pelajaran</td><td>: " + mapel + "</td></tr>" +
    "            <tr><td class='field-name'>Nomor Peserta Ujian</td><td>: <span style='font-size: 13pt; font-weight: bold; color: #047857;'>" + kodePeserta + "</span></td></tr>" +
    "          </table>" +
    "        </td>" +
    "        <td style='width: 30%; text-align: center;'>" +
    "          <div class='qr-box'>" +
    "            <img src='" + qrUrl + "' width='110' height='110' /><br>" +
    "            <span style='font-size: 8pt; font-weight: bold; color: #19365f;'>SCAN PRESENSI</span>" +
    "          </div>" +
    "        </td>" +
    "      </tr>" +
    "    </table>" +
    "    <div class='rules'>" +
    "      <strong>Tata Tertib Peserta:</strong><br>" +
    "      1. Wajib membawa kartu ujian ini dan mengenakan seragam sekolah asal.<br>" +
    "      2. Hadir di lokasi SMP Negeri 1 Pamekasan 30 menit sebelum sesi ujian dimulai.<br>" +
    "      3. Sesi 1: IPA & IPS (07.30 - 08.30 WIB) | Sesi 2: Matematika & B. Inggris (09.00 - 10.00 WIB)." +
    "    </div>" +
    "  </div>" +
    "</body></html>";

  return Utilities.newBlob(html, "text/html", "Kartu.html").getAs("application/pdf").setName("Kartu_Peserta_" + noReg + ".pdf");
}

/**
 * HELPER: Helper Format Angka Zero Padding
 */
function padZero(num, size) {
  var s = String(num);
  while (s.length < (size || 2)) { s = "0" + s; }
  return s;
}

/**
 * HELPER: Audit Log Email
 */
function catatLogEmail(noReg, email, tahap, status, errorMsg) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.LOG_EMAIL);
    if (sheet) {
      sheet.appendRow([new Date(), noReg, email, tahap, status, errorMsg]);
    }
  } catch (e) {
    Logger.log("Gagal catat log email: " + e.toString());
  }
}

/**
 * HELPER: Audit Log Aktivitas Admin
 */
function logAktivitas(aksi, admin, detail) {
  try {
    var ss = getDatabase();
    var sheet = ss.getSheetByName(SHEET_NAMES.LOG_AKTIVITAS);
    if (sheet) {
      sheet.appendRow([new Date(), aksi, admin, detail]);
    }
  } catch (e) {
    Logger.log("Gagal catat aktivitas: " + e.toString());
  }
}
