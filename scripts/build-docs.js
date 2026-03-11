const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'data');

// File mapping: source (relative to root) -> output filename
const FILES = [
  { src: 'tldr.md',             out: 'tldr.html' },
  { src: 'tldr_ja.md',          out: 'tldr_ja.html' },
  { src: 'overview.md',          out: 'readme.html' },
  { src: 'overview_ja.md',      out: 'readme_ja.html' },
  { src: 'documentation.md',    out: 'documentation.html' },
  { src: 'documentation_ja.md', out: 'documentation_ja.html' },
];

// Custom renderer
const renderer = new marked.Renderer();

renderer.image = function ({ href, title, text }) {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}" target="_blank"><img src="${href}" alt="${text}"${titleAttr} class="md-img"></a>`;
};

renderer.table = function (token) {
  const headerCells = token.header
    .map((cell) => `<th>${this.parser.parseInline(cell.tokens)}</th>`)
    .join('\n');
  const bodyRows = token.rows
    .map((row) => {
      const cells = row
        .map((cell) => `<td>${this.parser.parseInline(cell.tokens)}</td>`)
        .join('\n');
      return `<tr>\n${cells}\n</tr>`;
    })
    .join('\n');
  return `<table class="table table-sm table-striped">\n<thead>\n<tr>\n${headerCells}\n</tr>\n</thead>\n<tbody>\n${bodyRows}\n</tbody>\n</table>\n`;
};

marked.setOptions({
  gfm: true,
  renderer,
});

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

// Resolve source file with case-insensitive fallback (e.g. readme.md -> README.md)
function resolveSource(srcName) {
  const exact = path.join(ROOT, srcName);
  if (fs.existsSync(exact)) return exact;

  // Try case-insensitive match in root directory
  const dir = ROOT;
  const entries = fs.readdirSync(dir);
  const match = entries.find((e) => e.toLowerCase() === srcName.toLowerCase());
  if (match) return path.join(dir, match);

  return null;
}

let generated = 0;
let skipped = 0;

for (const { src, out } of FILES) {
  const srcPath = resolveSource(src);
  if (!srcPath) {
    console.log(`  SKIP  ${src} (not found)`);
    skipped++;
    continue;
  }

  const markdown = fs.readFileSync(srcPath, 'utf-8');
  const html = marked.parse(markdown);
  const outPath = path.join(OUT_DIR, out);
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`  OK    ${path.relative(ROOT, srcPath)} -> docs/data/${out}`);
  generated++;
}

console.log(`\nDone: ${generated} generated, ${skipped} skipped.`);
