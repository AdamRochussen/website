#!/usr/bin/env node
/*
 * Builds assets/cv/Adam_Rochussen_CV.pdf from the website's own data.
 *   node _build/build-cv.js          # US Letter (default)
 *   node _build/build-cv.js --a4     # A4
 * Step 1: regenerate _build/cv-print.html from _data/*.yml (gen-cv-print.py)
 * Step 2: render it to PDF with headless Chromium (served over http so fonts load)
 */
const http = require('http'), fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'assets', 'cv', 'Adam_Rochussen_CV.pdf');
const a4 = process.argv.includes('--a4');

console.log('Generating cv-print.html from _data …');
execFileSync('python3', [path.join(__dirname, 'gen-cv-print.py')], { stdio: 'inherit' });

const types = { '.html':'text/html; charset=utf-8', '.woff2':'font/woff2', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg' };
const server = http.createServer((req, res) => {
  const file = path.normalize(path.join(root, decodeURIComponent(req.url.split('?')[0])));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
server.listen(0, '127.0.0.1', async () => {
  const { port } = server.address();
  const month = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/_build/cv-print.html`, { waitUntil: 'networkidle' });
    if (a4) await page.addStyleTag({ content: '@page { size: A4; }' });
    await page.evaluate(() => document.fonts.ready);
    const footer = `<div style="width:100%;padding:0 0.6in;display:flex;justify-content:space-between;align-items:center;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:6.5px;letter-spacing:1px;text-transform:uppercase;color:#8a978c;">
      <span>Adam Rochussen &nbsp;·&nbsp; Curriculum Vitae &nbsp;·&nbsp; ${month}</span>
      <span>rochussen.xyz &nbsp;·&nbsp; <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>', footerTemplate: footer, tagged: true, outline: true });
    console.log(`Wrote ${path.relative(root, out)} (${(fs.statSync(out).size/1024).toFixed(0)} KB)`);
  } finally { await browser.close(); server.close(); }
});
