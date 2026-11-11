'use strict';
// Source HTML is the native Cloudflare blueprint. Keep both build outputs equal.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('./build.cjs');
const source = path.join(root, 'dist');
const output = path.join(root, 'cloudflare-dist');
fs.rmSync(output, {recursive:true,force:true});
fs.cpSync(source, output, {recursive:true});
console.log('Built Cloudflare output from the canonical native inquiry, privacy and security sources.');
