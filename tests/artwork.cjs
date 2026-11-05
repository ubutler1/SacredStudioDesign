'use strict';
// Exercise visitor actions, text/form exceptions, and the built crawlable catalog.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const data = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'site-data.js'), 'utf8'), data);
const works = data.window.studioData.artworks;
const listeners = new Map();
const attributes = new Map();
class Element {
 constructor(art = false) { this.art = art; }
 closest(selector) { return this.art && selector.includes('[data-studio-artwork]') ? this : null; }
 setAttribute(name, value) { attributes.set(name, value); }
}
const image = new Element(true);
image.getAttribute = name => name === 'src' ? works[0].image : null;
image.parentElement = {classList:{add:()=>{}}};
const normal = new Element();
let selectedArt = false, selectedText = 'Collector text';
const document = {
 querySelector:()=>null,
 getElementById:()=>null,
 querySelectorAll:selector => selector === 'img' || selector === '[data-studio-artwork]' ? [image] : [],
 addEventListener:(name, handler)=>listeners.set(name, handler),
 createElement:()=>new Element(),
 body:{append:()=>{}}
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'site.js'), 'utf8'), {
 document, Element,
 window:{studioData:data.window.studioData, getSelection:()=>({
  rangeCount:1, getRangeAt:()=>({intersectsNode:()=>selectedArt}), toString:()=>selectedText
 })}
});
assert.equal(attributes.has('data-studio-artwork'), true);
assert.equal(image.draggable, false);
function action(type, target) {
 const result = {prevented:false, clipboard:{}};
 listeners.get(type)({target, preventDefault:()=>{result.prevented=true;},
  clipboardData:{setData:(kind,value)=>{result.clipboard[kind]=value;}}});
 return result;
}
for (const type of ['contextmenu','dragstart']) {
 assert.equal(action(type,image).prevented,true,type+' on art is deterred');
 assert.equal(action(type,normal).prevented,false,type+' on navigation/text remains native');
}
assert.equal(action('copy',normal).prevented,false,'text and inquiry fields remain copyable');
selectedArt=true;
const input=new Element();
input.closest=selector=>selector.startsWith('input,') ? input : null;
assert.equal(action('copy',input).prevented,false,'input copying stays native even with an earlier artwork selection');
let copy=action('copy',normal);
assert.equal(copy.prevented,true,'page selection containing art omits clipboard images');
assert.deepEqual(copy.clipboard,{'text/plain':'Collector text'},'selected text is preserved');
selectedArt=false; selectedText='';
copy=action('copy',image);
assert.deepEqual(copy.clipboard,{'text/plain':'Artwork © Uriel Alexander'});
assert.equal(listeners.has('keydown'),false,'browser, accessibility and print shortcuts are not trapped');

const gallery=fs.readFileSync(path.join(root,'dist/gallery.html'),'utf8');
assert.equal((gallery.match(/class="art-card launch-art-card"/g)||[]).length,9,'nine cards in initial HTML');
assert.equal((gallery.match(/<details class="studio-static-work"/g)||[]).length,9,'full paintings/details work without JS');
for(const work of works) {
 assert.ok(gallery.includes(work.title));
 assert.ok(gallery.includes(work.description));
 assert.deepEqual(fs.readFileSync(path.join(root,work.image)),fs.readFileSync(path.join(root,'dist',work.image)));
}
for(const page of ['index','gallery','shop','about','contact']) {
 const html=fs.readFileSync(path.join(root,'dist',page+'.html'),'utf8');
 const imageMetadata=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(match=>JSON.parse(match[1])).flatMap(item=>item['@graph']||[]).filter(item=>item['@type']==='ImageObject');
 const expected=works.filter(work=>html.includes('src="'+work.image+'"'));
 assert.equal(imageMetadata.length,expected.length,page+' metadata matches displayed artwork');
 for(const work of expected) {
  const metadata=imageMetadata.find(item=>item.name===work.title);
  assert.equal(metadata.contentUrl,'https://urielalexanderstudio.com/'+work.image);
  assert.equal(metadata.copyrightNotice,'Artwork © Uriel Alexander');
  assert.ok(!('license' in metadata),'no reproduction license is invented');
 }
 for(const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
  if(expected.some(work=>tag.includes('src="'+work.image+'"'))) {
   assert.match(tag,/data-studio-artwork/,'print protection exists before JS');
   assert.match(tag,/draggable="false"/);
  }
 }
}
const renderGallery=require('../scripts/render-gallery.cjs');
const malicious=renderGallery([{title:'<script>alert(1)</script>',image:'assets/test.webp',alt:'" onerror="alert(1)',description:'<img src=x onerror=alert(1)>'}]);
assert.doesNotMatch(malicious,/<script>|<img src=x/,'catalog text is HTML escaped');
console.log('Passed artwork copying deterrents, text/form exceptions, nine-work initial HTML, escaping, rights metadata and unchanged image bytes.');
