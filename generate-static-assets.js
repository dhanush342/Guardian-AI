'use strict';

const fs = require('fs');
const path = require('path');

const filesToInline = [
  'index.html',
  'login.html',
  'register.html',
  'about.html',
  'careers.html',
  'partners.html',
  'privacy.html',
  'terms.html',
  'security.html',
  'cookies.html',
  'profile.html',
  'confirm-email.html',
  'demo.html',
  'analysis.html',
  'guardianlogo.jpeg',
  'logo.jpg',
  'Transparentlogo.png',
  'company-pages.css',
  'auth.js',
  'captcha.js',
  'profile.js',
  'email-validation.js'
];

const embedded = {};

for (const f of filesToInline) {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    const buf = fs.readFileSync(p);
    embedded[f] = buf.toString('base64');
    console.log(`Inlined ${f}: ${buf.length} bytes -> base64 ${embedded[f].length} chars`);
  } else {
    console.warn(`File not found: ${f}`);
  }
}

// Also alias favicon.ico
if (embedded['guardianlogo.jpeg']) {
  embedded['favicon.ico'] = embedded['guardianlogo.jpeg'];
}

const staticAssetsJsContent = `'use strict';

// AUTO-GENERATED EMBEDDED STATIC ASSETS
// This file embeds all essential HTML, images, scripts, and stylesheets as base64 buffers
// so that Vercel Serverless Functions and local environments always serve the exact
// requested files without relying on Lambda filesystem tracing.

const fs = require('fs');
const path = require('path');

const mimeMap = {
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

const embeddedBase64 = ${JSON.stringify(embedded, null, 2)};

// Lazily cache converted Buffers
const bufferCache = {};

function getAsset(name) {
  const clean = String(name || '').replace(/^\\/+/, '');
  
  // 1. Try reading from disk in local development if file exists
  try {
    const diskPath = path.join(__dirname, clean);
    if (fs.existsSync(diskPath)) {
      const ext = path.extname(clean).toLowerCase();
      return {
        buffer: fs.readFileSync(diskPath),
        contentType: mimeMap[ext] || 'application/octet-stream'
      };
    }
  } catch (_) {}

  // 2. Serve from embedded Base64 cache
  if (embeddedBase64[clean]) {
    if (!bufferCache[clean]) {
      bufferCache[clean] = Buffer.from(embeddedBase64[clean], 'base64');
    }
    const ext = path.extname(clean).toLowerCase();
    return {
      buffer: bufferCache[clean],
      contentType: mimeMap[ext] || 'application/octet-stream'
    };
  }

  return null;
}

module.exports = {
  getAsset,
  embeddedBase64
};
`;

fs.writeFileSync(path.join(__dirname, 'static-assets.js'), staticAssetsJsContent, 'utf8');
console.log('Successfully generated static-assets.js');
