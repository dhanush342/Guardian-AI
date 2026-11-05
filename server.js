'use strict';

require('dotenv').config();
const express  = require('express');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Environment Variables ─────────────────────────────────────────────────
const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY     = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname)));

// ─── In-Memory Rate Limiter (5 req / 60 s per IP) ─────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT   = 5;
const WINDOW_MS    = 60 * 1000;

function rateLimiter(req, res, next) {
  const ip  = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  let   rec = rateLimitMap.get(ip);

  if (!rec || now - rec.windowStart > WINDOW_MS) {
    rec = { count: 1, windowStart: now };
  } else {
    rec.count++;
  }

  rateLimitMap.set(ip, rec);

  if (rec.count > RATE_LIMIT) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests. Please wait a minute before trying again.'
    });
  }
  next();
}

// ─── Server-Side Validator & Sanitizer (Defense-in-Depth) ─────────────────
const VALID_INQUIRY_TYPES = [
  'General Inquiry',
  'Enterprise Sales',
  'Security Incident',
  'Partnership'
];

const NAME_REGEX  = /^[\p{L}\s.'-]{2,70}$/u;
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+?[0-9\s\-().]{7,25})$/;

// Strips non-printable control characters & normalizes Unicode
function cleanString(str, maxLen = 2000) {
  if (typeof str !== 'string') return '';
  return str
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLen);
}

// Neutralizes Excel/Google Sheet CSV Formula Injection (DDE attacks)
function sanitizeForSpreadsheet(val) {
  if (typeof val !== 'string' || !val) return val;
  const trimmed = val.trim();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return "'" + trimmed;
  }
  return trimmed;
}

// ─── POST /api/contact ─────────────────────────────────────────────────────
app.post('/api/contact', rateLimiter, async (req, res) => {
  try {
    const body = req.body || {};

    // 1. Clean & sanitize incoming raw input
    const name    = cleanString(body.name, 70);
    const email   = cleanString(body.email, 100).toLowerCase();
    const company = cleanString(body.company, 100);
    const phone   = cleanString(body.phone, 25);
    const inquiry = cleanString(body.inquiry, 50);
    const message = cleanString(body.message, 2000);

    // 2. Strict Server-Side Validation: Full Name (2–70 chars, letters only)
    if (!name || name.length < 2 || name.length > 70 || !NAME_REGEX.test(name)) {
      return res.status(400).json({
        success: false,
        error: 'Full name must be between 2 and 70 characters (letters, spaces, hyphens, and periods only).'
      });
    }

    // 3. Strict Server-Side Validation: Email (5–100 chars, RFC regex)
    if (!email || email.length < 5 || email.length > 100 || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid work email address.'
      });
    }

    // 4. Strict Server-Side Validation: Company (optional, max 100 chars)
    if (company && company.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Company name cannot exceed 100 characters.'
      });
    }

    // 5. Strict Server-Side Validation: Phone (optional, 7–15 digits if present)
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15 || !PHONE_REGEX.test(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid phone number (7 to 15 digits).'
        });
      }
    }

    // 6. Strict Server-Side Validation: Inquiry Category (whitelist enum)
    if (!inquiry || !VALID_INQUIRY_TYPES.includes(inquiry)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid inquiry category selected.'
      });
    }

    // 7. Strict Server-Side Validation: Message (10–2000 characters)
    if (!message || message.length < 10 || message.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Message must be between 10 and 2,000 characters.'
      });
    }

    // Safe payload for Supabase database
    const dbPayload = {
      name,
      email,
      company: company || null,
      phone: phone || null,
      inquiry,
      message
    };

    // Safe payload for Google Sheets (protected against formula injection)
    const sheetPayload = {
      name: sanitizeForSpreadsheet(name),
      email: sanitizeForSpreadsheet(email),
      company: sanitizeForSpreadsheet(company || ''),
      phone: sanitizeForSpreadsheet(phone || ''),
      inquiry: sanitizeForSpreadsheet(inquiry),
      message: sanitizeForSpreadsheet(message),
      submittedAt: new Date().toISOString()
    };

    // ── Forward to Supabase & Google Sheets concurrently ───────────────
    const [supabaseResult, sheetResult] = await Promise.allSettled([
      forwardToSupabase(dbPayload),
      forwardToGoogleSheet(sheetPayload)
    ]);

    const supabaseOk = supabaseResult.status === 'fulfilled' && supabaseResult.value?.ok;
    const sheetOk    = sheetResult.status    === 'fulfilled' && sheetResult.value?.ok;

    if (!supabaseOk) {
      const err = supabaseResult.status === 'rejected' ? supabaseResult.reason : supabaseResult.value?.error;
      console.error('[Supabase Error]:', err || 'Unknown Supabase error');
    }
    if (!sheetOk) {
      const err = sheetResult.status === 'rejected' ? sheetResult.reason : sheetResult.value?.error;
      console.error('[Google Sheet Error]:', err || 'Unknown Google Sheet error');
    }

    // If both failed, notify the client
    if (!supabaseOk && !sheetOk) {
      return res.status(502).json({
        success: false,
        error: 'Failed to record inquiry. Please check server logs.'
      });
    }

    return res.status(200).json({
      success: true,
      supabase: supabaseOk,
      googleSheet: sheetOk
    });

  } catch (err) {
    console.error('[/api/contact] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// ─── Supabase forwarder ────────────────────────────────────────────────────
async function forwardToSupabase(payload) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[Supabase] URL or key not configured — skipping.');
    return { ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env' };
  }
  const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/contact_inquiries`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Prefer':        'return=minimal'
    },
    body: JSON.stringify({
      name:         payload.name,
      email:        payload.email,
      company:      payload.company,
      phone:        payload.phone,
      inquiry_type: payload.inquiry,
      message:      payload.message
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, error: `HTTP ${response.status}: ${errorText}` };
  }

  return { ok: true };
}

// ─── Google Sheets forwarder ───────────────────────────────────────────────
async function forwardToGoogleSheet(payload) {
  if (!GOOGLE_SHEET_WEBHOOK_URL) {
    console.warn('[Google Sheet] Webhook URL not configured — skipping.');
    return { ok: false, error: 'Missing GOOGLE_SHEET_WEBHOOK_URL in .env' };
  }
  const response = await fetch(GOOGLE_SHEET_WEBHOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    return { ok: false, error: `HTTP ${response.status}: ${errorText}` };
  }

  return { ok: true };
}

// ─── SPA fallback: catch-all → index.html ─────────────────────────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Guardian AI server running at http://localhost:${PORT}`);
  console.log(`  Supabase   : ${SUPABASE_URL             ? '✓ configured' : '✗ NOT set (check .env)'}`);
  console.log(`  Google Sheet: ${GOOGLE_SHEET_WEBHOOK_URL ? '✓ configured' : '✗ NOT set (check .env)'}\n`);
});
