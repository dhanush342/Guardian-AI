'use strict';

require('dotenv').config();
const express  = require('express');
const path     = require('path');
const validateEmail = require('./email-validation');
const verifyCaptcha = require('./captcha-server');

const app  = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const confirmationRedirect = new URL('/confirm-email.html', APP_URL).href;

// ─── Environment Variables ─────────────────────────────────────────────────
const SUPABASE_URL             = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY        = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY     = process.env.SUPABASE_SERVICE_KEY;
const GOOGLE_SHEET_WEBHOOK_URL = process.env.GOOGLE_SHEET_WEBHOOK_URL;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

// ─── GET /api/config (Public runtime client configuration) ─────────────────
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: SUPABASE_URL || '',
    supabaseAnonKey: SUPABASE_ANON_KEY || '',
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || ''
  });
});

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

// ─── POST /api/register ────────────────────────────────────────────────────
app.post('/api/register', rateLimiter, async (req, res) => {
  try {
    const { fullName, email, password, organization } = req.body || {};
    if (organization !== undefined && (typeof organization !== 'string' || organization.trim().length > 100)) return res.status(400).json({ success: false, error: 'Organization must be at most 100 characters.' });

    const cleanName  = cleanString(fullName, 70);
    const emailValidation = validateEmail(email);
    const cleanEmail = emailValidation.sanitized;

    if (!cleanName || cleanName.length < 2 || !NAME_REGEX.test(cleanName)) {
      return res.status(400).json({ success: false, error: 'Full name must be 2–70 characters (letters only).' });
    }
    if (!emailValidation.valid) {
      return res.status(400).json({ success: false, error: 'Please provide a valid work email.' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({ success: false, error: 'Password must be 8–128 characters and include uppercase, lowercase, a number, and a special character.' });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ success: false, error: 'Supabase is not configured on the server.' });
    }

    if (req.body?.acceptedTerms !== true) return res.status(400).json({ success: false, error: 'Please accept the Terms of Service and Privacy Policy.' });
    const captchaError = await verifyCaptcha(req.body?.captchaToken, 'signup', {
      secret: process.env.TURNSTILE_SECRET_KEY, siteKey: process.env.TURNSTILE_SITE_KEY,
      appUrl: APP_URL
    });
    if (captchaError) return res.status(captchaError.status).json({ success: false, error: captchaError.error });

    const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/signup?redirect_to=${encodeURIComponent(confirmationRedirect)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        data: {
          full_name: cleanName,
          organization: cleanString(organization, 100)
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      let friendlyError = result.msg || result.error_description || result.error || 'Registration failed';
      if (friendlyError.includes('already registered')) {
        friendlyError = 'An account with this email address already exists. Please sign in instead.';
      } else if (friendlyError.includes('email_address_invalid') || friendlyError.includes('invalid')) {
        friendlyError = 'Please use a valid corporate or recognized email address (e.g. name@company.com or name@gmail.com).';
      }
      return res.status(response.status).json({ success: false, error: friendlyError });
    }

    const registeredUser = result.user || result;
    const requiresEmailConfirmation = !registeredUser.email_confirmed_at;

    return res.status(200).json({
      success: true,
      requiresEmailConfirmation,
      user: {
        id: registeredUser.id,
        email: registeredUser.email,
        fullName: cleanName
      }
    });

  } catch (err) {
    console.error('[/api/register] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// Resending is generic to avoid disclosing which addresses have accounts.
app.post('/api/resend-confirmation', rateLimiter, async (req, res) => {
  const validation = validateEmail(req.body?.email);
  if (!validation.valid) return res.status(400).json({ success: false, error: validation.message });
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return res.status(503).json({ success: false, error: 'Email confirmation is unavailable.' });
  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/resend?redirect_to=${encodeURIComponent(confirmationRedirect)}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'signup', email: validation.sanitized })
    });
    if (!response.ok) {
      return res.status(response.status === 429 ? 429 : 502).json({ success: false, error: response.status === 429 ? 'Please wait before requesting another confirmation email.' : 'Unable to send confirmation email. Please try again later.' });
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(502).json({ success: false, error: 'Email confirmation is unavailable. Please try again later.' });
  }
});

// ─── POST /api/login ───────────────────────────────────────────────────────
app.post('/api/login', rateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const emailValidation = validateEmail(email);
    const cleanEmail = emailValidation.sanitized;

    if (!emailValidation.valid) {
      return res.status(400).json({ success: false, error: 'Please enter a valid work email.' });
    }
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ success: false, error: 'Supabase is not configured on the server.' });
    }

    const captchaError = await verifyCaptcha(req.body?.captchaToken, 'signin', {
      secret: process.env.TURNSTILE_SECRET_KEY, siteKey: process.env.TURNSTILE_SITE_KEY,
      appUrl: APP_URL
    });
    if (captchaError) return res.status(captchaError.status).json({ success: false, error: captchaError.error });

    const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: password
      })
    });

    const result = await response.json();

    if (!response.ok) {
      let msg = result.error_description || result.msg || 'Authentication failed';
      if (msg.includes('Invalid login credentials')) {
        msg = 'Invalid work email or password. Please verify your credentials.';
      } else if (msg.includes('Email not confirmed')) {
        msg = 'Your email address has not been confirmed yet. Please verify your inbox.';
      }
      return res.status(response.status).json({ success: false, error: msg, code: result.error_code || result.code });
    }

    if (!result.user?.email_confirmed_at) {
      return res.status(403).json({ success: false, code: 'email_not_confirmed', error: 'Please confirm your email before signing in.' });
    }

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      success: true,
      session: {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        expiresIn: result.expires_in
      },
      user: result.user
    });

  } catch (err) {
    console.error('[/api/login] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

require('./profile-routes')(app, { url: SUPABASE_URL?.replace(/\/+$/, ''), key: SUPABASE_ANON_KEY, rateLimiter });

// ─── Fallback & 404 Routing ─────────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: `API endpoint ${req.method} ${req.originalUrl} not found` });
});

// Helper to reliably locate static files across local Node, Vercel Serverless, and container roots
function resolveStaticPath(relPath) {
  if (!relPath) return null;
  const clean = String(relPath).replace(/^\/+/, '');
  const candidates = [
    path.join(__dirname, clean),
    path.join(__dirname, '..', clean),
    path.join(process.cwd(), clean)
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (_) {}
  }
  return null;
}

// Explicit routes for top-level HTML pages (supports both clean URLs and .html extensions)
const pageRoutes = {
  '/login': 'login.html',
  '/register': 'register.html',
  '/about': 'about.html',
  '/careers': 'careers.html',
  '/partners': 'partners.html',
  '/privacy': 'privacy.html',
  '/terms': 'terms.html',
  '/security': 'security.html',
  '/cookies': 'cookies.html',
  '/profile': 'profile.html',
  '/confirm-email': 'confirm-email.html',
  '/demo': 'demo.html',
  '/analysis': 'analysis.html'
};

Object.entries(pageRoutes).forEach(([route, file]) => {
  const handler = (req, res) => {
    const resolved = resolveStaticPath(file) || resolveStaticPath('index.html');
    if (resolved) {
      return res.sendFile(resolved, (err) => {
        if (err && !res.headersSent) {
          res.status(500).send('Page load error');
        }
      });
    }
    res.status(404).send('Page not found');
  };
  app.get(route, handler);
  app.get(route + '.html', handler);
});

// For assets that have extensions (.png, .jpg, .jpeg, .svg, .css, .js, .ico), do not return index.html
app.get('/{*splat}', (req, res) => {
  const rawSplat = req.params.splat;
  const cleanPath = (Array.isArray(rawSplat) ? rawSplat.join('/') : String(rawSplat || '')).replace(/^\/+/, '');
  if (cleanPath) {
    const resolved = resolveStaticPath(cleanPath);
    if (resolved) {
      try {
        if (fs.statSync(resolved).isFile()) {
          return res.sendFile(resolved);
        }
      } catch (_) {}
    }
  }
  if (path.extname(req.path)) {
    return res.status(404).send('Not Found');
  }
  const idx = resolveStaticPath('index.html');
  if (idx) {
    return res.sendFile(idx);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Guardian AI Server Error]:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ─────────────────────────────────────────────────────────────────
const isMain = typeof module !== 'undefined' && typeof require !== 'undefined' && require.main === module;
if (!process.env.VERCEL && isMain) {
  app.listen(PORT, () => {
    console.log(`\n  Guardian AI server running at http://localhost:${PORT}`);
    console.log(`  Supabase   : ${SUPABASE_URL             ? '✓ configured' : '✗ NOT set (check .env)'}`);
    console.log(`  Google Sheet: ${GOOGLE_SHEET_WEBHOOK_URL ? '✓ configured' : '✗ NOT set (check .env)'}\n`);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}
