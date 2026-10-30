'use strict';
// Run with: node tests/site.cjs — no external test dependencies.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['index.html','gallery.html','shop.html','about.html','commissions.html','contact.html','thank-you.html'];
let checked=0;
for(const p of pages){
 const html=read(p);
 assert.equal((html.match(/<main\b/g)||[]).length,1,p+' must have one main');
 assert.equal((html.match(/<\/main>/g)||[]).length,1,p+' must close main');
 assert.match(html,/<meta name="viewport"/,p+' needs viewport');
 assert.match(html,/<title>[^<]+<\/title>/,p+' needs title');
 assert.match(html,/Uriel Alexander/,p+' must use artist name');
 assert.doesNotMatch(html,/Sacred Canvas Studio|Urie Alexander/i,p+' has retired brand');
 for(const m of html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)){
  assert.ok(fs.existsSync(path.join(root,m[1])),p+' missing '+m[1]);checked++;
 }
 checked++;
}
const ctx={window:{}};vm.runInNewContext(read('site-data.js'),ctx);
const works=ctx.window.studioData.artworks;
assert.equal(works.length,9,'catalog must include nine artist-approved paintings');
for(const w of works){assert.ok(w.title&&w.alt&&w.image);assert.ok(fs.existsSync(path.join(root,w.image)),w.title+' missing image');assert.equal(fs.readFileSync(path.join(root,w.image)).subarray(0,4).toString('ascii'),'RIFF',w.title+' not RIFF WebP');checked++}
for(const name of ['Skyline State of Mind','Next Door to Everything','Say Less in Color','Black Boy Magic'])assert.ok(works.some(w=>w.title===name),'missing confirmed title '+name);
assert.doesNotMatch(read('site-data.js'),/workingTitle\s*:\s*true/);
const contact=read('contact.html');assert.match(contact,/name="studio-inquiry"/);assert.match(contact,/method="POST"/);assert.match(contact,/data-netlify="true"/);assert.match(contact,/netlify-honeypot="bot-field"/);assert.match(contact,/action="\/thank-you.html"/);
for(const key of ['name','email','topic','message'])assert.ok(contact.includes('name="'+key+'"'),'missing '+key+' field');
const script=read('site.js');new Function(script);new Function(read('shop.js'));
assert.ok(script.includes('showModal('),'gallery viewer must be available');
assert.ok(script.includes('URLSearchParams'),'inquiry deep-links must work');
assert.ok(!script.includes("event.preventDefault()")||!script.includes("download inquiry draft"),'inquiry must not fake submit');
assert.match(read('shop.html'),/No print or digital checkout is active/);

const galleryCss=read('style.css');
assert.match(galleryCss,/\.gallery-grid\.launch-gallery-grid\s*\{/,'gallery must have a dedicated grid rule');
assert.match(galleryCss,/aspect-ratio:\s*1\s*\/\s*1/,'all artwork thumbnails should use one square format');
assert.match(galleryCss,/\.launch-art-card \.launch-art-image-button img\.artwork-photo\s*\{[^}]*object-fit:\s*cover/s,'all thumbnail images should fill their cards');
assert.match(galleryCss,/\.launch-art-card \.launch-art-image-button img\.artwork-photo\s*\{[^}]*object-position:\s*center center/s,'thumbnail crop should be centered');
assert.match(galleryCss,/\.launch-art-card \.art-meta\s*\{[^}]*min-height:\s*105px/s,'captions must align');
assert.match(read('gallery.html'),/Select any painting to view its complete composition/,'the viewer must make the full artwork accessible');
assert.match(script,/View full artwork/,'thumbnail action should disclose the full painting');
assert.match(galleryCss,/\.launch-dialog-image img\{width:100%;height:100%;object-fit:contain\}/,'original images in viewer must never be cropped');

console.log('Passed studio launch static checks: '+checked+' pages/assets/records, artist branding, viewer and Netlify form markup.');console.log('Note: Netlify form delivery and browser interactions still require testing on deployed preview.');
