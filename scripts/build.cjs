'use strict';
// Only explicitly selected public website files enter the hosting output.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const pages = ['index.html', 'gallery.html', 'shop.html', 'about.html',
  'commissions.html', 'contact.html', 'thank-you.html', 'privacy.html'];
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'site-data.js'), 'utf8'), context);
const files = new Set([...pages, 'style.css', 'site-data.js', 'site.js', 'shop.js', 'pinterest.js', '_headers']);
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
console.log('Built ' + files.size + ' public files in dist; repository notes, tests, dependencies and review packages are excluded.');
