'use strict';
const fs = require('fs');
const path = require('path');
const publicFiles = require('./public-files.json');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg' };
function getAsset(name) {
  const file = name === 'favicon.ico' ? 'guardianlogo.jpeg' : name;
  if (!publicFiles.includes(file)) return null;
  for (const base of [path.join(__dirname, 'public'), __dirname]) {
    try { return { buffer: fs.readFileSync(path.join(base, file)), contentType: types[path.extname(file)] || 'application/octet-stream' }; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return null;
}
module.exports = { getAsset };
