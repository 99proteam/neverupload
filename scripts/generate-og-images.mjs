// Generates the 1200×630 social preview images in public/og/ (used by og:image and
// twitter:image). Needs a Chromium/Chrome binary:
//   CHROME=/path/to/chrome node scripts/generate-og-images.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TOOL_METAS } from '../src/tools/meta.ts';

const chrome = process.env.CHROME ?? 'chromium';
const outDir = new URL('../public/og/', import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), 'og-'));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const shield = `<svg viewBox="0 0 64 64" width="88" height="88"><rect width="64" height="64" rx="14" fill="#10b981"/><path d="M32 11 15 17.5v12.2C15 41 22.4 50.6 32 53.5 41.6 50.6 49 41 49 29.7V17.5Z" fill="#ecfdf5"/><path d="m24.5 32.5 5.2 5.2 10-11" fill="none" stroke="#059669" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function page(title, subtitle) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    background:radial-gradient(circle at 85% 15%,#065f46 0,#0f172a 55%);color:#f8fafc;
    display:flex;flex-direction:column;justify-content:space-between;padding:72px 80px}
  .brand{display:flex;align-items:center;gap:20px;font-size:44px;font-weight:800;letter-spacing:-1px}
  .brand span{color:#34d399}
  h1{font-size:${title.length > 22 ? 72 : 88}px;line-height:1.05;font-weight:800;letter-spacing:-2px;max-width:1040px}
  p{font-size:34px;color:#cbd5e1;margin-top:20px;max-width:1000px}
  .pill{display:inline-flex;align-items:center;gap:14px;background:#064e3b;border:2px solid #10b981;
    color:#d1fae5;border-radius:999px;padding:14px 28px;font-size:30px;font-weight:700}
  </style></head><body>
  <div class="brand">${shield}<div>never<span>upload</span></div></div>
  <div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>
  <div><span class="pill">🔒 Your files never leave your device</span></div>
  </body></html>`;
}

const jobs = [
  [
    'home',
    'Free PDF & image tools',
    'Merge, split, compress and convert in your browser. No uploads, no sign-up, works offline.',
  ],
  ...TOOL_METAS.map((t) => [t.slug, t.name, `${t.summary} Free, private, no upload.`]),
];

for (const [slug, title, subtitle] of jobs) {
  const html = join(tmp, `${slug}.html`);
  writeFileSync(html, page(title, subtitle));
  const shot = join(tmp, `${slug}.png`);
  // Headless Chrome's viewport is shorter than the window, so render taller and crop.
  execFileSync(
    chrome,
    [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      `--screenshot=${shot}`,
      '--window-size=1200,1030',
      `file://${html}`,
    ],
    { stdio: 'ignore' },
  );
  execFileSync('convert', [
    shot,
    '-crop',
    '1200x630+0+0',
    '+repage',
    '-strip',
    '-define',
    'png:compression-level=9',
    join(outDir, `${slug}.png`),
  ]);
  console.log('og/' + slug + '.png');
}
