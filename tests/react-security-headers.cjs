// Local response-header emulation, not proof of headers on an undeployed Vercel site.
const { createServer } = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function main() {
  const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.deepEqual(Object.keys(config).sort(), ['$schema', 'headers']);
  assert.equal(config.headers.length, 1);
  assert.equal(config.headers[0].source, '/(.*)');
  const headers = Object.fromEntries(config.headers[0].headers.map(h => [h.key, h.value]));
  const root = path.resolve('dist');
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const server = createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, pathname === '/' || pathname === '/unprotected/' ? 'index.html' : '.' + pathname);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { ...(pathname === '/unprotected/' ? {} : headers), 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
  });
  let target;
  const parent = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<iframe src="${target}${req.url === '/control' ? '/unprotected/' : '/'}#/login"></iframe>`);
  });
  const listen = s => new Promise(resolve => s.listen(0, '127.0.0.1', resolve));
  await listen(server); target = `http://127.0.0.1:${server.address().port}`;
  await listen(parent);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const report = { mode: 'local emulation of vercel.json response headers', layouts: [], errors: [] };
  try {
    const context = await browser.newContext();
    // Prevent production Auth/Firestore traffic. No real account used.
    await context.route(/https:\/\//, route => route.abort());
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    const response = await context.request.get(target + '/');
    assert.equal(response.headers()['x-frame-options'], 'DENY');
    for (const width of [1920, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of ['/login', '/signup']) {
        await page.goto(target + '/#' + route);
        await page.locator(route === '/login' ? '#login-form' : '#signup-form').waitFor();
        const notice = page.locator('.account-trust');
        assert.ok((await notice.innerText()).includes('만다꼬'));
        assert.equal(await notice.locator('a[href="https://www.mandaco.co.kr"]').count(), 1);
        assert.equal(await notice.locator('a[href="mailto:harodrawing@gmail.com"]').count(), 1);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.reload();
        await notice.waitFor();
        report.layouts.push({ width, route, overflow: false, reload: true });
      }
    }
    fs.mkdirSync('test-results/security', { recursive: true });
    await page.screenshot({ path: 'test-results/security/signup-trust-390.png', fullPage: true });
    const outer = await context.newPage();
    await outer.goto(`http://127.0.0.1:${parent.address().port}/control`);
    await outer.frameLocator('iframe').locator('#login-form').waitFor();
    report.controlFrameLoads = true;
    let blockedMessage = false;
    outer.on('console', message => { if (/frame-ancestors|X-Frame-Options/.test(message.text())) blockedMessage = true; });
    await outer.goto(`http://127.0.0.1:${parent.address().port}/blocked`);
    await outer.waitForTimeout(1200);
    assert.equal(await outer.frameLocator('iframe').locator('#login-form').count(), 0);
    assert.equal(blockedMessage, true);
    report.crossOriginFrameBlocked = true;
    assert.deepEqual(report.errors, []);
    await context.close();
  } finally {
    await browser.close();
    await Promise.all([server, parent].map(s => new Promise(resolve => s.close(resolve))));
  }
  fs.writeFileSync('test-results/security/local-headers-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
