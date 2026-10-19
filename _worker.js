/**
 * =========================================================================
 * CLOUDFLARE PAGES WORKER PROXY FOR OMEGA PLUS
 * SMP NEGERI 1 PAMEKASAN
 * =========================================================================
 * File: _worker.js
 * Deskripsi:
 * 1. Menyajikan static assets (index.html, admin.html, config.js) melalui Cloudflare CDN.
 * 2. Mengarahkan rute /api/* langsung ke Google Apps Script (GAS_URL) tanpa error CORS.
 * 3. Menangani redirect 302 dari Google Apps Script secara otomatis di sisi edge.
 * =========================================================================
 */

// Ganti URL ini dengan URL Web App Deployment Google Apps Script Anda (berakhiran /exec)
const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbwsvjH5vK-g5UJF0sI4knpOal8jdGzYC6Z82lP0ecXW2yWGA4wIKmtoa4YRNXgz-g13vg/exec";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const gasUrl = (env && env.GAS_URL) ? env.GAS_URL : DEFAULT_GAS_URL;

    // Jika request menuju endpoint /api atau /exec
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/exec')) {
      const targetUrl = new URL(gasUrl);
      
      // Salin query parameters dari request ke target URL
      url.searchParams.forEach((value, key) => {
        targetUrl.searchParams.set(key, value);
      });

      // Siapkan headers untuk bypass CORS
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      };

      // Tangani preflight OPTIONS
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // Siapkan request ke Google Apps Script
      const fetchOptions = {
        method: request.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': request.headers.get('content-type') || 'application/json',
        },
        redirect: 'follow', // Sangat penting: otomatis ikuti redirect 302 dari GAS
      };

      if (request.method === 'POST') {
        try {
          const bodyText = await request.text();
          fetchOptions.body = bodyText;
        } catch (e) {
          // Jika tidak ada body teks
        }
      }

      try {
        const gasResponse = await fetch(targetUrl.toString(), fetchOptions);
        const responseData = await gasResponse.text();

        return new Response(responseData, {
          status: gasResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        });
      } catch (err) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Gagal menghubungi server Apps Script: ' + err.message,
        }), {
          status: 502,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json; charset=utf-8',
          },
        });
      }
    }

    // Default: Sajikan aset statis Cloudflare Pages (HTML, CSS, JS, Gambar)
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  },
};
