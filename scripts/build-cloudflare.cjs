'use strict';
// Build an independent Cloudflare copy; preserve the current Netlify backend.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('./build.cjs');
const source = path.join(root, 'dist');
const output = path.join(root, 'cloudflare-dist');
fs.rmSync(output, {recursive:true,force:true});
fs.cpSync(source, output, {recursive:true});
const rewrite = (name, change) => {
  const file = path.join(output, name), before = fs.readFileSync(file, 'utf8');
  const after = change(before);
  if (after === before) throw new Error('Expected Cloudflare adaptation not applied: ' + name);
  fs.writeFileSync(file, after);
};
rewrite('contact.html', html => html
  .replace('action="/thank-you.html" data-netlify="true" netlify-honeypot="bot-field"', 'action="/inquiry"')
  .replace("are processed by Netlify and the studio's email service", "are handled by Cloudflare, Netlify and the studio's email service"));
rewrite('privacy.html', html => html
  .replace('Netlify processes and stores form submissions.', 'Cloudflare securely relays form submissions to the studio\'s existing Netlify Forms installation. Netlify processes and stores the submissions.')
  .replace('Netlify hosts the website and processes technical request information, which can include IP addresses, requested pages, referring pages, browser or device details and request times. Netlify Web Analytics provides the studio with reports such as pageviews, traffic sources and approximate visitor locations. It uses server logs rather than analytics cookies.', 'Cloudflare hosts this copy of the website and processes technical request information, which can include IP addresses, requested pages, referring pages, browser or device details and request times. This supports website delivery, security and operational traffic reports. Inquiry requests use an approximate, short-lived rate limit based on a hash of the connecting IP address. The studio\'s form handler does not write inquiry contents to application logs. No additional visitor analytics script is added by this hosting change. Netlify continues to process inquiry submissions; Netlify Web Analytics describes traffic to the earlier Netlify-hosted copy, not browsing on this Cloudflare copy.')
  .replace("it does not stop the technical requests needed to serve the website or Netlify's server-side analytics.", 'it does not stop the technical requests needed to serve and protect the website or process your inquiry.')
  .replace('Netlify and Google process information to provide hosting, forms and email services.', 'Cloudflare, Netlify and Google process information to provide hosting, security, forms and email services.')
  .replace('described in <a href="https://www.netlify.com/privacy/">', 'described in <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare\'s privacy policy</a>, <a href="https://www.netlify.com/privacy/">')
  .replace('Updated November 2, 2026.', 'Updated November 4, 2026.'));
rewrite('_headers', text => text.replaceAll(' https://app.netlify.com', '').replaceAll("script-src 'self' 'unsafe-inline'", "script-src 'self'") +
  '\n# Keep the independent workers.dev copy out of search results.\nhttps://:worker.:account.workers.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:version.:worker.:account.workers.dev/*\n  X-Robots-Tag: noindex\n');
fs.writeFileSync(path.join(output, '_redirects'), 'https://www.urielalexanderstudio.com/* https://urielalexanderstudio.com/:splat 301\n');
console.log('Built independent Cloudflare files with same-origin inquiry handling and an accurate provider notice. No DNS or hosting account changed.');
