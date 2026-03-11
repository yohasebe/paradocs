const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

const template = fs.readFileSync(path.join(__dirname, 'page-template.html'), 'utf-8');
const i18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n-pages.json'), 'utf-8'));

// Output directories: en -> docs/, others -> docs/<lang>/
const OUTPUT_MAP = {
  en: DOCS,
  ja: path.join(DOCS, 'ja'),
  zh: path.join(DOCS, 'zh'),
  ko: path.join(DOCS, 'ko'),
};

// Language dropdown links need special handling for "en" (root)
// For en page: "./" is self, "./ja/" etc. are subdirs
// For ja/zh/ko pages: "../" is en, "./" is self, "../<lang>/" is sibling

let generated = 0;

for (const [lang, strings] of Object.entries(i18n)) {
  const outDir = OUTPUT_MAP[lang];
  fs.mkdirSync(outDir, { recursive: true });

  // Replace all placeholders
  let html = template;

  // Add version from package.json
  const vars = { ...strings, version: PKG.version };

  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(pattern, value);
  }

  // Fix language dropdown links relative to current page
  if (lang === 'en') {
    // en is at root: links should be ./, ./ja/, ./zh/, ./ko/
    html = html.replace(/href="{{base_path}}"/g, 'href="./"');
    html = html.replace(/href="{{base_path}}ja\/"/g, 'href="./ja/"');
    html = html.replace(/href="{{base_path}}zh\/"/g, 'href="./zh/"');
    html = html.replace(/href="{{base_path}}ko\/"/g, 'href="./ko/"');
  }

  const outPath = path.join(outDir, 'index.html');
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`  OK    ${lang} -> ${path.relative(ROOT, outPath)}`);
  generated++;
}

console.log(`\nDone: ${generated} pages generated (version ${PKG.version}).`);
