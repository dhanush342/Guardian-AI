'use strict';

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

function safeRead(rel) {
  try {
    return fs.readFileSync(path.join(__dirname, rel));
  } catch (err) {
    try {
      return fs.readFileSync(path.join(process.cwd(), rel));
    } catch (_) {
      return null;
    }
  }
}

// Explicit static map for Vercel NFT (Node File Trace) to bundle all assets
const assets = {
  'index.html': safeRead('index.html'),
  'login.html': safeRead('login.html'),
  'register.html': safeRead('register.html'),
  'about.html': safeRead('about.html'),
  'careers.html': safeRead('careers.html'),
  'partners.html': safeRead('partners.html'),
  'privacy.html': safeRead('privacy.html'),
  'terms.html': safeRead('terms.html'),
  'security.html': safeRead('security.html'),
  'cookies.html': safeRead('cookies.html'),
  'profile.html': safeRead('profile.html'),
  'confirm-email.html': safeRead('confirm-email.html'),
  'demo.html': safeRead('demo.html'),
  'analysis.html': safeRead('analysis.html'),
  'guardianlogo.jpeg': safeRead('guardianlogo.jpeg'),
  'logo.jpg': safeRead('logo.jpg'),
  'Transparentlogo.png': safeRead('Transparentlogo.png'),
  'auth.js': safeRead('auth.js'),
  'captcha.js': safeRead('captcha.js'),
  'favicon.ico': safeRead('guardianlogo.jpeg')
};

function getAsset(name) {
  const clean = String(name || '').replace(/^\/+/, '');
  if (assets[clean]) {
    const ext = path.extname(clean).toLowerCase();
    return {
      buffer: assets[clean],
      contentType: mimeMap[ext] || 'application/octet-stream'
    };
  }
  // Try dynamic disk read
  const disk = safeRead(clean);
  if (disk) {
    const ext = path.extname(clean).toLowerCase();
    return {
      buffer: disk,
      contentType: mimeMap[ext] || 'application/octet-stream'
    };
  }
  return null;
}

module.exports = {
  getAsset,
  assets
};

