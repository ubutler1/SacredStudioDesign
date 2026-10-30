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


// Cross-page artwork display QA: preview links open the uncropped gallery viewer.
const home=read('index.html'), about=read('about.html'), shop=read('shop.html');
assert.match(home,/View all nine paintings/,'homepage collection count must match catalog');
assert.match(home,/class="launch-work-picture"/,'homepage has selected-artwork previews');
assert.match(about,/class="launch-about-feature-link"/,'about full portrait link');
assert.equal((about.match(/class="launch-about-work-picture"/g)||[]).length,2,'about secondary works must use two matched squares');
assert.equal((shop.match(/class="launch-print-preview-link"/g)||[]).length,3,'shop previews must be artwork deep-links');
assert.match(contact,/class="launch-contact-art"/,'contact painting must link to the full gallery');
assert.match(galleryCss,/\.launch-work \.launch-work-picture\s*\{[^}]*aspect-ratio:\s*1\s*\/\s*1/s,'homepage thumbnails should be square');
assert.match(galleryCss,/\.launch-work \.launch-work-picture img\s*\{[^}]*object-fit:\s*cover/s,'homepage thumbnails should fill their square');
assert.match(galleryCss,/\.launch-about-bottom > div\s*\{[^}]*grid-template-columns:\s*repeat\(2,/s,'about previews need matching columns');
assert.match(galleryCss,/\.launch-about-bottom \.launch-about-work-picture img\s*\{[^}]*object-fit:\s*cover/s,'about previews should fill frames');
assert.match(galleryCss,/\.launch-print-preview \.launch-print-preview-link img\s*\{[^}]*object-fit:\s*cover/s,'shop previews should fill their squares');
assert.match(galleryCss,/\.launch-contact-aside \.launch-contact-art img\s*\{[^}]*object-fit:\s*cover/s,'contact artwork should fill its square');
assert.match(galleryCss,/\.launch-hero \.launch-hero-art > img\s*\{[^}]*object-fit:\s*contain/s,'homepage hero must show complete painting');
assert.match(galleryCss,/\.launch-about-grid \.launch-about-feature-link img\s*\{[^}]*object-fit:\s*contain/s,'about featured portrait must stay uncropped');


// Additional prelaunch checks: local page links, artwork deep links and image dimensions.
const validPages = new Set(pages), catalogTitles = new Set(works.map(w => w.title));
let checkedLinks = 0, checkedImageDimensions = 0;
for (const p of pages) {
  const html = read(p);
  for (const [, u] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(?:https?:|#|mailto:|tel:)/i.test(u)) continue;
    const [pathname, query] = u.split('?');
    const localPath = pathname.split('#')[0];
    if (localPath.endsWith('.html')) {
      assert.ok(validPages.has(localPath), p + ' links to missing page ' + localPath);
      checkedLinks++;
    }
    if (query && query.includes('work=')) {
      const url = new URL('https://studio.example/' + u);
      assert.ok(catalogTitles.has(url.searchParams.get('work')), p + ' has unrecognized artwork deep link ' + u);
    }
  }
  for (const [img] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!img.includes('src="assets/')) continue;
    assert.match(img, /\bwidth="\d+"/, p + ' artwork img must have intrinsic width');
    assert.match(img, /\bheight="\d+"/, p + ' artwork img must have intrinsic height');
    checkedImageDimensions++;
  }
}
assert.ok(checkedImageDimensions >= 12, 'static artwork imagery must be sized');
assert.ok(checkedLinks >= 20, 'main page navigation must remain linked');


// Editorial QA: preserve artwork focus without publishing unapproved identity narratives.
assert.match(read('index.html'),/Portraits with presence\.<br><em>Color without permission\.<\/em>/,'approved headline stays intact');
assert.match(read('about.html'),/For Alexander, a portrait begins with the structure of the face/,'About must describe the artist practice concretely');
assert.doesNotMatch(read('about.html'),/Black gay man|gay artist|Caribbean roots/,'artist personal background requires separate public-copy approval');
assert.match(read('contact.html'),/mailto:urielalexanderstudio@gmail\.com/,'studio email is accessible');
assert.match(read('shop.html'),/Print and digital purchases are not available through the website/,'checkout must remain inactive');
assert.match(read('shop.html'),/contact\.html\?topic=artwork/,'shop directs original inquiries to form');

console.log('Passed studio launch static checks: '+checked+' pages/assets/records, artist branding, viewer and Netlify form markup.');console.log('Note: Netlify form delivery and browser interactions still require testing on deployed preview.');
