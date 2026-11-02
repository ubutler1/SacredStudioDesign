'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-public-build-'));
let checks = 0;
try {
  fs.cpSync(root, fixture, {recursive:true, filter: p => !p.split(path.sep).includes('dist')});
  fs.writeFileSync(path.join(fixture, 'assets', 'private-example.txt'), 'Synthetic private file; must never be published.');
  fs.writeFileSync(path.join(fixture, 'internal-example.csv'), 'Synthetic private file; must never be published.');
  const build = spawnSync(process.execPath, [path.join(fixture, 'scripts', 'build.cjs')], {encoding:'utf8'});
  assert.equal(build.status, 0, build.stderr);
  const dist = path.join(fixture, 'dist');
  for (const name of ['assets/private-example.txt','internal-example.csv','package.json',
    'tests/site.cjs','scripts/build.cjs','PINTEREST-SETUP.md','netlify.toml',
    'assets/uriel_website_launch_artwork_review_pack.zip','assets/launch_artwork_inventory.csv']) {
    assert.equal(fs.existsSync(path.join(dist,name)), false, name + ' must not be public'); checks++;
  }
  const ctx = {window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(dist,'site-data.js'),'utf8'),ctx);
  assert.equal(ctx.window.studioData.artworks.length,9);
  for (const work of ctx.window.studioData.artworks) {
    assert.deepEqual(fs.readFileSync(path.join(dist,work.image)),fs.readFileSync(path.join(root,work.image)),work.title+' must preserve approved image bytes'); checks++;
  }
  for (const name of fs.readdirSync(dist).filter(n => n.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(dist,name),'utf8');
    for (const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      if (/^(?:https?:|mailto:|#)/.test(url)) continue;
      const target=url.split(/[?#]/)[0];
      assert.ok(fs.existsSync(path.join(dist,target)),name+' broken published file '+target); checks++;
    }
  }
  const headers=fs.readFileSync(path.join(dist,'_headers'),'utf8');
  const blocks=headers.split(/\n(?=\/)/).filter(s=>s.startsWith('/'));
  const rule=(pathname)=>blocks.filter(b=>new RegExp('^'+b.split('\n')[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\\\*/g,'.*')+'$').test(pathname)).join('\n');
  for (const pathname of ['/contact','/contact.html','/contact/','/thank-you','/thank-you.html','/privacy','/privacy.html']) {
    const r=rule(pathname);
    assert.match(r,/connect-src 'self'/,pathname+' blocks external connections');
    assert.match(r,/img-src 'self' data:/,pathname+' blocks third-party beacons');
    assert.match(r,/script-src 'self' 'unsafe-inline'/,pathname+' blocks external advertising scripts');
    assert.match(r,/Cache-Control: no-store/,pathname+' avoids browser cache storage'); checks++;
  }
  assert.match(rule('/gallery'),/form-action 'self'/);
  assert.match(rule('/gallery'),/frame-ancestors 'none'/);
  assert.match(rule('/gallery'),/Referrer-Policy: same-origin/);
  const contact=fs.readFileSync(path.join(dist,'contact.html'),'utf8');
  assert.match(contact,/method="POST" action="\/thank-you.html"/);
  assert.match(contact,/aria-describedby="inquiry-privacy"/);
  assert.doesNotMatch(contact,/<input[^>]*type="(?:file|password)"/);
  assert.match(fs.readFileSync(path.join(dist,'privacy.html'),'utf8'),/Netlify Web Analytics/);
  assert.match(fs.readFileSync(path.join(dist,'privacy.html'),'utf8'),/Google Gmail/);
  console.log('Passed '+checks+' public-output, image-preservation, navigation and protected-route checks.');
} finally { fs.rmSync(fixture,{recursive:true,force:true}); }
