'use strict';
// Only explicitly selected public website files enter the hosting output.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const renderGallery = require('./render-gallery.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const pages = ['index.html', 'gallery.html', 'shop.html', 'about.html',
  'commissions.html', 'contact.html', 'thank-you.html', 'privacy.html'];
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'site-data.js'), 'utf8'), context);
const files = new Set([...pages, 'style.css', 'site-data.js', 'site.js', 'shop.js', 'pinterest.js', '_headers',
  'robots.txt', 'sitemap.xml', 'assets/studio-social-card-20261104.jpg']);
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  for (const match of html.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)) files.add(match[1]);
}
for (const work of context.window.studioData.artworks) files.add(work.image);
for (const name of files) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_./-]+$/.test(name) ||
      name.split('/').includes('..') || path.isAbsolute(name)) throw new Error('Invalid public file path');
  const source = path.join(root, name);
  if (!fs.statSync(source).isFile() || fs.lstatSync(source).isSymbolicLink()) throw new Error('Public file is not a regular file: ' + name);
}
fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
for (const name of files) {
  const target = path.join(output, name);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.copyFileSync(path.join(root, name), target);
}
// Keep the catalog readable in the initial HTML, without waiting for rendering.
const galleryPath = path.join(output, 'gallery.html');
const gallery = fs.readFileSync(galleryPath, 'utf8');
const gallerySlot = '<div class="gallery-grid launch-gallery-grid" id="artwork-grid"></div>';
if (!gallery.includes(gallerySlot)) throw new Error('Gallery catalog slot is missing');
fs.writeFileSync(galleryPath, gallery.replace(gallerySlot,
  '<div class="gallery-grid launch-gallery-grid" id="artwork-grid">' + renderGallery(context.window.studioData.artworks) + '</div>')
  .replace('Loading the artwork…', context.window.studioData.artworks.length + ' paintings')
  .replace('Enable JavaScript to browse the full collection.', 'Open “View complete painting &amp; details” below each work. Enable JavaScript for gallery filters and the enlarged viewer.'));

// Rights information describes the artwork, without inventing photography credits
// or granting a reproduction license. Never rewrite the approved image files.
const works = context.window.studioData.artworks;
for (const page of pages) {
  const target = path.join(output, page);
  let html = fs.readFileSync(target, 'utf8');
  const present = works.filter(work => html.includes('src="' + work.image + '"'));
  if (!present.length) continue;
  html = html.replace(/<img\b[^>]*>/g, tag => {
    if (tag.includes('data-studio-artwork') || !present.some(work => tag.includes('src="' + work.image + '"'))) return tag;
    return tag.replace('<img ', '<img data-studio-artwork draggable="false" ');
  });
  const metadata = {
    '@context':'https://schema.org',
    '@graph':present.map(work => ({
      '@type':'ImageObject',
      name:work.title,
      contentUrl:'https://urielalexanderstudio.com/' + work.image,
      creditText:'Artwork by Uriel Alexander',
      copyrightNotice:'Artwork © Uriel Alexander',
      acquireLicensePage:'https://urielalexanderstudio.com/contact?topic=artwork&work=' + encodeURIComponent(work.title)
    }))
  };
  const json = JSON.stringify(metadata).replace(/</g, '\\u003c');
  html = html.replace('</head>', '<script type="application/ld+json">' + json + '</script>\n</head>');
  fs.writeFileSync(target, html);
}
console.log('Built ' + files.size + ' public files in dist; repository notes, tests, dependencies and review packages are excluded.');
