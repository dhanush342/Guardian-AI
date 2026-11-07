'use strict';
const fs = require('fs');
const path = require('path');
const files = require('./public-files.json');
fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
for (const file of files) fs.copyFileSync(path.join(__dirname, file), path.join(__dirname, 'public', file));
console.log('Built ' + files.length + ' public assets.');
