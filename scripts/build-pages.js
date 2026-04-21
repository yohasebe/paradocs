const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));

const appTemplate = fs.readFileSync(path.join(__dirname, 'app-template.html'), 'utf-8');
const docsTemplate = fs.readFileSync(path.join(__dirname, 'docs-template.html'), 'utf-8');
const i18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n-pages.json'), 'utf-8'));

// Output directories: en -> docs/, others -> docs/<lang>/
const OUTPUT_MAP = {
  en: DOCS,
  ja: path.join(DOCS, 'ja'),
  zh: path.join(DOCS, 'zh'),
  ko: path.join(DOCS, 'ko'),
};

function buildPage(template, lang, strings, canonicalPath) {
  let html = template;
  const vars = { ...strings, version: PKG.version, canonical_path: canonicalPath };

  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(pattern, value);
  }

  // Fix language dropdown links relative to current page
  if (lang === 'en') {
    html = html.replace(/href="{{base_path}}"/g, 'href="./"');
    html = html.replace(/href="{{base_path}}ja\/"/g, 'href="./ja/"');
    html = html.replace(/href="{{base_path}}zh\/"/g, 'href="./zh/"');
    html = html.replace(/href="{{base_path}}ko\/"/g, 'href="./ko/"');
  }

  return html;
}

let generated = 0;

for (const [lang, strings] of Object.entries(i18n)) {
  const outDir = OUTPUT_MAP[lang];
  fs.mkdirSync(outDir, { recursive: true });

  // canonical path: en -> "" or "docs.html", others -> "<lang>/" or "<lang>/docs.html"
  const langPrefix = lang === 'en' ? '' : `${lang}/`;

  // Generate app page (index.html)
  const appHtml = buildPage(appTemplate, lang, strings, langPrefix);
  const appPath = path.join(outDir, 'index.html');
  fs.writeFileSync(appPath, appHtml, 'utf-8');
  console.log(`  OK    ${lang}/index.html -> ${path.relative(ROOT, appPath)}`);

  // Generate docs page (docs.html)
  const docsHtml = buildPage(docsTemplate, lang, strings, `${langPrefix}docs.html`);
  const docsPath = path.join(outDir, 'docs.html');
  fs.writeFileSync(docsPath, docsHtml, 'utf-8');
  console.log(`  OK    ${lang}/docs.html  -> ${path.relative(ROOT, docsPath)}`);

  generated += 2;
}

console.log(`\nDone: ${generated} pages generated (version ${PKG.version}).`);
