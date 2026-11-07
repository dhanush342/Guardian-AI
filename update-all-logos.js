const fs = require('fs');

const b64 = fs.readFileSync('guardianlogo.jpeg').toString('base64');
const dataUri = `data:image/jpeg;base64,${b64}`;
const primaryUrl = 'https://imagepaste.org/i/ttbd3dpt.jpg';

const scriptContent = `<script>
window.__GUARDIAN_LOGO__ = '${dataUri}';
function handleLogoError(img) {
  if (!img) return;
  if (!img.dataset.step) {
    img.dataset.step = '1';
    img.src = 'guardianlogo.jpeg';
  } else if (img.dataset.step === '1') {
    img.dataset.step = '2';
    img.src = window.__GUARDIAN_LOGO__;
  }
}
</script>`;

function updateFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace script block if present, or add before </head>
  if (content.includes('window.__GUARDIAN_LOGO__')) {
    content = content.replace(/<script>\s*window\.__GUARDIAN_LOGO__[\s\S]*?<\/script>/, scriptContent);
  } else {
    content = content.replace('</head>', scriptContent + '\n</head>');
  }

  // Update navbar/footer logo img tags
  content = content.replace(
    /<img alt="Guardian AI Logo" class="h-10[^>]*>/,
    `<img alt="Guardian AI Logo" class="h-10 sm:h-12 md:h-14 w-auto object-contain transition-transform hover:scale-105" src="${primaryUrl}" onerror="handleLogoError(this)">`
  );

  content = content.replace(
    /<img alt="Guardian AI Logo Footer"[^>]*>/,
    `<img alt="Guardian AI Logo Footer" class="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" src="${primaryUrl}" onerror="handleLogoError(this)">`
  );

  content = content.replace(
    /<img alt="Guardian AI Logo" class="h-12[^>]*>/,
    `<img alt="Guardian AI Logo" class="h-12 sm:h-14 w-auto object-contain transition-transform hover:scale-105" src="${primaryUrl}" onerror="handleLogoError(this)">`
  );

  content = content.replace(
    /<img src="[^"]*" alt="Guardian AI Logo" width="40" height="40"[^>]*>/g,
    `<img src="${primaryUrl}" alt="Guardian AI Logo" width="40" height="40" onerror="handleLogoError(this)">`
  );

  fs.writeFileSync(file, content);
  console.log('Updated:', file);
}

const files = [
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
  'demo.html',
  'analysis.html'
];

for (const f of files) {
  updateFile(f);
}

