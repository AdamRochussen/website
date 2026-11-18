#!/usr/bin/env node
/* Renders assets/img/og.jpg (1200x630 social card) and assets/img/apple-touch-icon.png (180x180).
 * Usage: node _build/build-images.js  (requires Playwright + Chromium) */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const file = path.normalize(path.join(root, decodeURIComponent(req.url.split('?')[0])));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
server.listen(0, '127.0.0.1', async () => {
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  try {
    const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await og.goto(`${base}/_build/og.html`, { waitUntil: 'networkidle' });
    await og.evaluate(() => document.fonts.ready);
    await og.screenshot({ path: path.join(root, 'assets/img/og.jpg'), type: 'jpeg', quality: 88 });
    const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
    await icon.setContent(`<body style="margin:0;background:#0b0a08;display:grid;place-items:center;height:180px"><img src="${base}/favicon.svg" width="150" height="150"></body>`);
    await icon.waitForLoadState('networkidle');
    await icon.screenshot({ path: path.join(root, 'assets/img/apple-touch-icon.png') });
    console.log('Wrote assets/img/og.jpg and assets/img/apple-touch-icon.png');
  } finally { await browser.close(); server.close(); }
});
