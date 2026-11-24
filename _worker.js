/**
 * =========================================================================
 * CLOUDFLARE PAGES WORKER PROXY FOR OMEGA PLUS (TURBO CACHE EDITION)
 * SMP NEGERI 1 PAMEKASAN
 * =========================================================================
 * File: _worker.js
 * Fitur Khusus High-Scale & Security Lock:
 * 1. Edge Lockdown: Mengunci seluruh web dari level server (Cloudflare Edge)
 * 2. Developer Secret Bypass: Akses ?unlock=omega2026 untuk melihat web secara privat
 * 3. Edge Caching (caches.default): Menyajikan stats dalam 5ms langsung dari Edge
 * 4. Bypass CORS 100%: Menghilangkan error CORS dari redirect 302 Google Apps Script
 * 5. Static Asset Accelerated CDN: index.html, admin.html, config.js disajikan instan
 * =========================================================================
 */

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbwsvjH5vK-g5UJF0sI4knpOal8jdGzYC6Z82lP0ecXW2yWGA4wIKmtoa4YRNXgz-g13vg/exec";

// =========================================================================
// PENGATURAN KUNCI WEBSITE (LOCKDOWN SWITCH)
// =========================================================================
// Ubah SITE_LOCKED ke 'false' untuk membuka kembali website secara normal untuk semua pengunjung.
const SITE_LOCKED = false;

// Kunci bypass rahasia untuk developer/owner agar tetap bisa mengecek website:
// Buka di browser: https://domain-anda.pages.dev/?unlock=omega2026 (aktif 24 jam)
// Untuk mengunci kembali browser Anda: https://domain-anda.pages.dev/?lock=1
const BYPASS_KEY = "omega2026";
const DEVELOPER_WA = "088228511309";
const DEVELOPER_WA_LINK = "https://wa.me/6288228511309?text=" + encodeURIComponent("Halo Developer OMEGA PLUS 2026, kami ingin konfirmasi aktivasi pembukaan akses website.");

// Template Halaman Terkunci (Server-Level Lockdown Page)
function getLockedHtml() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Akses Ditutup - OMEGA PLUS 2026</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a192f;
      background-image: 
        radial-gradient(at 100% 0%, rgba(25, 54, 95, 0.45) 0px, transparent 55%),
        radial-gradient(at 0% 100%, rgba(231, 181, 94, 0.1) 0px, transparent 55%);
      font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #e2e8f0;
      padding: 1.5rem;
    }
    .card {
      width: 100%;
      max-width: 490px;
      background: #0f233d;
      border: 1px solid rgba(231, 181, 94, 0.28);
      border-radius: 24px;
      box-shadow: 0 25px 65px -15px rgba(0, 0, 0, 0.7), 0 0 35px rgba(231, 181, 94, 0.12);
      padding: 2.5rem 2rem 2.2rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg, #19365f 0%, #e7b55e 50%, #285891 100%);
    }
    .icon-box {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(231, 181, 94, 0.12);
      border: 2px solid rgba(231, 181, 94, 0.45);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #e7b55e;
      margin-bottom: 1.25rem;
      position: relative;
      box-shadow: 0 8px 24px rgba(231, 181, 94, 0.2);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.38);
      color: #fca5a5;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-radius: 9999px;
      margin-bottom: 1rem;
    }
    .badge::before {
      content: '';
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 8px #ef4444;
    }
    h1 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.45rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.35;
      margin-bottom: 0.85rem;
    }
    p {
      font-size: 0.925rem;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 1.6rem;
    }
    .status-card {
      background: rgba(10, 25, 47, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 0.85rem 1.1rem;
      margin-bottom: 1.5rem;
      text-align: left;
      font-size: 0.82rem;
    }
    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
    }
    .status-row:not(:last-child) {
      border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
      padding-bottom: 6px;
      margin-bottom: 6px;
    }
    .status-label {
      color: #64748b;
    }
    .status-val {
      font-weight: 700;
      color: #e2e8f0;
      font-family: monospace;
    }
    .btn-wa {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      background: #25D366;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 13px 20px;
      border-radius: 14px;
      transition: all 0.2s ease;
      box-shadow: 0 6px 22px rgba(37, 211, 102, 0.35);
    }
    .btn-wa:hover {
      background: #20ba5a;
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(37, 211, 102, 0.5);
    }
    .footer-note {
      margin-top: 1.4rem;
      font-size: 0.775rem;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="accent-bar"></div>
    <div class="icon-box">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <br>
    <div class="badge">Akses Dinonaktifkan</div>
    <h1>Website Sedang Dikunci</h1>
    <p>Akses ke sistem dan layanan website <strong>OMEGA PLUS 2026</strong> saat ini dinonaktifkan sementara oleh pengembang. Seluruh modul portal dan pendaftaran ditutup.</p>
    
    <div class="status-card">
      <div class="status-row">
        <span class="status-label">Status Server:</span>
        <span class="status-val" style="color: #f87171;">Terkunci (Lockdown Mode)</span>
      </div>
      <div class="status-row">
        <span class="status-label">Pengembang:</span>
        <span class="status-val">${DEVELOPER_WA}</span>
      </div>
    </div>

    <a href="${DEVELOPER_WA_LINK}" target="_blank" rel="noopener noreferrer" class="btn-wa">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.311.045-.698.059-1.146-.082-.277-.087-.63-.223-1.077-.417-1.905-.824-3.14-2.766-3.235-2.893-.095-.127-.775-1.03-.775-1.964 0-.934.49-1.393.664-1.583.174-.19.38-.238.507-.238.127 0 .253.002.364.007.119.005.277-.045.433.329.162.388.554 1.349.602 1.446.048.097.08.21.016.337-.063.127-.095.206-.19.317-.095.111-.2.248-.286.333-.095.095-.194.198-.083.388.111.19.493.813 1.057 1.316.726.647 1.338.847 1.528.942.19.095.301.079.412-.048.111-.127.475-.555.602-.745.127-.19.254-.159.428-.095.174.063 1.109.523 1.3.618.19.095.317.143.364.222.048.079.048.459-.096.864z"/>
      </svg>
      <span>Hubungi Developer via WhatsApp</span>
    </a>
    <div class="footer-note">SMP Negeri 1 Pamekasan &bull; OMEGA PLUS 2026</div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const gasUrl = (env && env.GAS_URL) ? env.GAS_URL : DEFAULT_GAS_URL;

    // CORS Headers Standar
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // -------------------------------------------------------------------------
    // LOGIKA LOCKDOWN LEVEL SERVER (CLOUDFLARE EDGE)
    // -------------------------------------------------------------------------
    const cookieHeader = request.headers.get('Cookie') || '';
    const hasBypassCookie = cookieHeader.includes(`omega_bypass=${BYPASS_KEY}`);
    const isUnlocking = url.searchParams.get('unlock') === BYPASS_KEY;
    const isRelocking = url.searchParams.get('lock') === '1';

    // 1. Jika pengguna mengakses ?lock=1 -> Hapus cookie bypass dan kunci kembali
    if (isRelocking) {
      const redirectUrl = new URL(request.url);
      redirectUrl.searchParams.delete('lock');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl.pathname || '/',
          'Set-Cookie': `omega_bypass=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly`,
        }
      });
    }

    // 2. Jika pengguna memasukkan ?unlock=omega2026 -> Aktifkan cookie bypass 24 jam
    if (isUnlocking) {
      const redirectUrl = new URL(request.url);
      redirectUrl.searchParams.delete('unlock');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirectUrl.pathname + (redirectUrl.search || ''),
          'Set-Cookie': `omega_bypass=${BYPASS_KEY}; Path=/; Max-Age=86400; SameSite=Lax; HttpOnly`,
        }
      });
    }

    const isBypassed = hasBypassCookie;

    // 3. JIKA WEB TERKUNCI & TIDAK MEMILIKI AKSES BYPASS
    if (SITE_LOCKED && !isBypassed) {
      // Jika request API (/api atau /exec)
      if (url.pathname.startsWith('/api') || url.pathname.startsWith('/exec')) {
        return new Response(JSON.stringify({
          status: 'error',
          code: 503,
          message: 'Layanan API sedang dikunci sementara oleh pengembang (Lockdown Mode).'
        }), {
          status: 503,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache',
            'Retry-After': '3600'
          }
        });
      }

      // Seluruh request halaman HTML, dokumen, atau file statis dikunci dan disajikan halaman peringatan
      return new Response(getLockedHtml(), {
        status: 503,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Retry-After': '3600'
        }
      });
    }

    // -------------------------------------------------------------------------
    // JIKA TIDAK DIKUNCI / MEMILIKI AKSES BYPASS -> JALANKAN SECARA NORMAL
    // -------------------------------------------------------------------------

    // Jika Request API (/api atau /exec)
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/exec')) {
      const action = url.searchParams.get('action') || '';
      const targetUrl = new URL(gasUrl);

      url.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value);
      });

      // EDGE CACHING UNTUK REQUEST GET STATS & CONFIG (Meringankan Apps Script)
      const isCacheableGet = (request.method === 'GET' && (action === 'getDashboardStats' || action === 'getPublicConfig' || action === 'ping' || action === 'getLeaderboard' || action === 'getStatusPengumuman' || action === 'getLiveScoreboard' || action === 'getLiveConfig'));
      const cache = caches.default;
      const cacheKey = new Request(targetUrl.toString(), request);

      if (isCacheableGet) {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          const newHeaders = new Headers(cachedResponse.headers);
          Object.keys(corsHeaders).forEach(k => newHeaders.set(k, corsHeaders[k]));
          newHeaders.set('X-Edge-Cache', 'HIT');
          return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            headers: newHeaders
          });
        }
      }

      // Siapkan Request ke Apps Script
      const fetchOptions = {
        method: request.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': request.headers.get('content-type') || 'application/json',
        },
        redirect: 'follow',
      };

      if (request.method === 'POST') {
        try {
          fetchOptions.body = await request.text();
        } catch (e) {}
      }

      try {
        const gasResponse = await fetch(targetUrl.toString(), fetchOptions);
        const responseData = await gasResponse.text();

        const responseHeaders = {
          ...corsHeaders,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': isCacheableGet ? 'public, max-age=15, s-maxage=30' : 'no-store, no-cache',
          'X-Edge-Cache': 'MISS'
        };

        const finalResponse = new Response(responseData, {
          status: gasResponse.status,
          headers: responseHeaders,
        });

        if (isCacheableGet && gasResponse.status === 200) {
          ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
        }

        return finalResponse;
      } catch (err) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Gagal terhubung ke Apps Script: ' + err.message,
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
    }

    // Default: Sajikan aset statis Cloudflare Pages
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  },
};
