'use strict';
// Build native Cloudflare inquiries; retain historical Netlify output separately.
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
  .replace("are processed by Netlify and the studio's email service", "are handled by Cloudflare and the studio's email service")
  .replace('<input type="hidden" name="form-name" value="studio-inquiry">','<input type="hidden" name="form-name" value="studio-inquiry"><input type="hidden" name="inquiry-id" value="__STUDIO_INQUIRY_ID__">'));
rewrite('privacy.html', html => html
  .replace('Netlify processes and stores form submissions.', 'Cloudflare processes new form submissions and stores them in a private studio database. Email notification failures are recorded for retry; the stored inquiry remains available to the studio. Earlier inquiries may remain in Netlify under the studio\'s retention procedure.')
  .replace("Notifications and subsequent correspondence are handled through the studio's Google Gmail account.", 'Notifications and correspondence are handled through Google Gmail.')
  .replace('Netlify hosts the website and processes technical request information, which can include IP addresses, requested pages, referring pages, browser or device details and request times. Netlify Web Analytics provides the studio with reports such as pageviews, traffic sources and approximate visitor locations. It uses server logs rather than analytics cookies.', 'Cloudflare hosts the website and processes technical request information, which can include IP addresses, requested pages, referring pages, browser or device details and request times. This supports website delivery, security and operational traffic reports. Inquiry requests use an approximate, short-lived rate limit based on a hash of the connecting IP address. The studio\'s form handler does not write inquiry contents to application logs. No additional visitor analytics script is added by this hosting change. New website inquiries are stored and processed within Cloudflare.')
  .replace("it does not stop the technical requests needed to serve the website or Netlify's server-side analytics.", 'it does not stop the technical requests needed to serve and protect the website or process your inquiry.')
  .replace('Netlify and Google process information to provide hosting, forms and email services.', 'Cloudflare and Google process new inquiries to provide hosting, security, private inquiry storage, notifications and email services. Earlier inquiries and notification copies may remain in Netlify and email accounts until they are no longer needed.')
  .replace('described in <a href="https://www.netlify.com/privacy/">', 'described in <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare\'s privacy policy</a>, <a href="https://www.netlify.com/privacy/">')
  .replace('Inquiry information may therefore be held in both services.', 'Inquiry information is held in Cloudflare and the studio email account. Cloudflare database recovery history can retain earlier copies for up to seven days on the current plan. Website-version rollback does not itself restore or delete inquiry records.')
  .replace('Updated November 2, 2026.', 'Updated November 4, 2026.'));
rewrite('_headers', text => text.replaceAll(' https://app.netlify.com', '').replaceAll("script-src 'self' 'unsafe-inline'", "script-src 'self'") +
  '\n/*\n  Strict-Transport-Security: max-age=31536000\n' +
  '\n# Keep the independent workers.dev copy out of search results.\nhttps://:worker.:account.workers.dev/*\n  X-Robots-Tag: noindex\n\nhttps://:version.:worker.:account.workers.dev/*\n  X-Robots-Tag: noindex\n');
// Workers static _redirects only accepts path sources. The www host redirect
// belongs to the Cloudflare zone's Single Redirect rules, verified at cutover.
console.log('Built independent Cloudflare files with same-origin inquiry handling and an accurate provider notice. No DNS or hosting account changed.');
