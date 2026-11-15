'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const root=path.resolve(__dirname,'..'), dist=path.join(root,'cloudflare-dist');
const data={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'site-data.js'),'utf8'),data);
const works=data.window.studioData.artworks;
const {page}=require('../scripts/artwork-pages.cjs');
const pages=fs.readdirSync(dist).filter(n=>n.endsWith('.html')).concat(works.map(page));
let links=0;
for(const name of pages){
  const html=fs.readFileSync(path.join(dist,name),'utf8');
  assert.equal((html.match(/<main\b/g)||[]).length,1,name+' has one main');
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(?:https?:|mailto:|#)/.test(url))continue;
    const target=path.resolve(dist,path.dirname(name),url.split(/[?#]/)[0]);
    assert.ok(target.startsWith(dist+path.sep),name+' link stays in public output');
    assert.ok(fs.existsSync(target),name+' missing local resource '+url);links++;
  }
}
for(const work of works){
  const html=fs.readFileSync(path.join(dist,page(work)),'utf8');
  const json=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(json['@type'],'VisualArtwork');assert.equal(json.name,work.title);assert.equal(json.description,work.description);
  assert.ok(!json.offers && !html.includes('Add to cart'),'no sale is activated');
  assert.ok(html.includes('src="../'+work.image+'"'));assert.ok(html.includes(work.dimensions+' (width × height)'));
  assert.ok(html.includes('content="https://urielalexanderstudio.com/'+work.image+'"'),'own genuine share image');
  assert.match(html,/data-studio-artwork draggable="false"/);
  assert.equal(html.includes('<p class="studio-price-request">$950 USD</p>'),work.originalAvailable,'only the two approved originals have public prices');
  assert.equal(html.includes('href="../shop.html#buying-original"'),work.originalAvailable,'original pages link to the buyer terms');
  assert.ok(!html.includes('Price on request'),'published price replaces the old request label');
  assert.deepEqual(fs.readFileSync(path.join(root,work.image)),fs.readFileSync(path.join(dist,work.image)));
}
const collect=fs.readFileSync(path.join(dist,'shop.html'),'utf8');
for(const work of works.filter(work=>work.originalAvailable)){
  const card=collect.split('<article class="studio-original-card"').find(part=>part.includes('>'+work.title+'</h2>'))?.split('</article>')[0];
  assert.ok(card,'Collect includes '+work.title);
  assert.ok(card.includes('$'+work.priceUSD+' USD'),'Collect price matches the approved catalog');
}
const updates=fs.readFileSync(path.join(dist,'studio-updates.html'),'utf8');
assert.match(updates,/method="POST" action="\/inquiry"/);assert.match(updates,/name="updates-consent" type="checkbox" value="yes" required/);
assert.doesNotMatch(updates,/<input[^>]*\bchecked\b/);assert.doesNotMatch(updates,/pinterest\.js|s\.pinimg|ct\.pinterest/);
assert.ok(fs.readFileSync(path.join(dist,'privacy.html'),'utf8').includes('An ordinary artwork or commission inquiry does not subscribe you.'));
assert.match(fs.readFileSync(path.join(dist,'about.html'),'utf8'),/href="assets\/uriel-alexander-artist-cv.pdf" download/);
assert.equal(fs.readFileSync(path.join(dist,'assets/uriel-alexander-artist-cv.pdf')).subarray(0,5).toString(),'%PDF-');
console.log('Passed nine artwork pages, original image bytes, '+links+' public resource links, explicit signup consent, privacy and CV download checks.');
