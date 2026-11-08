import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const base = process.argv[2] || './';
const root = resolve('dist');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
assert.match(html, /id="root"/);
assert.ok(!existsSync(resolve(root, 'react.html')), 'Build entry must be index.html');
assert.ok(!existsSync(resolve(root, 'CNAME')), 'Do not assign a custom domain');
assert.ok(!html.includes('js/main.js'), 'Legacy entry must not be deployed');
const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(match => match[1]).filter(url => !/^(https?:|data:|#)/.test(url));
assert.ok(urls.some(url => url.endsWith('.js')), 'React bundle missing');
for (const url of urls) {
  assert.ok(url.startsWith(base), `Unexpected asset base: ${url}`);
  const file = resolve(root, url.slice(base.length));
  assert.ok(file.startsWith(root + '/') || file.startsWith(root + '\\'));
  assert.ok(existsSync(file), `Missing asset: ${url}`);
}
function inspect(directory) {
  for (const name of readdirSync(directory)) {
    const file = resolve(directory, name);
    if (statSync(file).isDirectory()) inspect(file);
    else if (/\.(?:html|js|css|json|map|pem|key|env)$/i.test(name)) {
      const body = readFileSync(file, 'utf8');
      assert.ok(!/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----|"type"\s*:\s*"service_account"/.test(body), `Private credential: ${name}`);
      assert.ok(!name.startsWith('.env'), 'Environment file in output');
    }
  }
}
inspect(root);
console.log(JSON.stringify({ entry: 'dist/index.html', base, checkedEntryAssets: urls.length, privateCredentialPatternFound: false }));
