'use strict';
// Build stable, individually shareable pages from the approved catalog.
const fs = require('node:fs');
const path = require('node:path');
const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
const slug = work => work.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const page = work => 'artwork/' + slug(work) + '.html';
const origin = 'https://urielalexanderstudio.com';
const originalPrice = work => work.originalAvailable === true && Number.isFinite(work.priceUSD)
  ? '$' + work.priceUSD.toLocaleString('en-US') + ' USD' : '';
const sizes = {
  'assets/he-started-in-color.webp':[1184,1600],
  'assets/guiding-hands.webp':[1205,1600],
  'assets/she-lives-in-color.webp':[1200,1600],
  'assets/city-figure-provisional.webp':[1094,1600],
  'assets/bronx-dispensary-provisional.webp':[1600,1058],
  'assets/braided-figure-provisional.webp':[1232,1600],
  'assets/he-lives-in-color.webp':[1190,1600],
  'assets/self-portrait.webp':[1200,1600],
  'assets/black-boy-magic.webp':[1693,1700]
};
const details = work => [
  ['Year', work.year], ['Medium', work.materials || work.medium],
  ['Support', [work.support, work.canvasDepth].filter(Boolean).join(' · ')],
  ['Dimensions', work.dimensions + ' (width × height)'], ['Framing', work.framing],
  ['Finish', work.finish], ['Status', work.completion],
  ['Original', work.originalAvailable ? 'Available for inquiry' : 'Unavailable']
].filter(([,value]) => value !== undefined && value !== null && value !== '');

function render(work, index, works, shell) {
  const title = escape(work.title), description = escape(work.description);
  const url = origin + '/artwork/' + slug(work);
  const image = origin + '/' + work.image;
  const [width, height] = sizes[work.image] || [];
  if (!width || !height) throw new Error('Verify the intrinsic image size for ' + work.title);
  const query = encodeURIComponent(work.title);
  const inquire = '../contact.html?topic=' + (work.originalAvailable ? 'artwork' : 'general') + '&amp;work=' + query;
  const metadata = {
    '@context':'https://schema.org', '@type':'VisualArtwork', '@id':url + '#artwork',
    name:work.title, url, image, description:work.description, artform:'Painting',
    artMedium:work.materials || work.medium, artworkSurface:work.support,
    creator:{'@type':'Person',name:'Uriel Alexander',url:origin + '/about'},
    copyrightHolder:{'@type':'Person',name:'Uriel Alexander'},
    copyrightNotice:'Artwork © Uriel Alexander'
  };
  const head = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | Uriel Alexander Art Studio</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${url}">
<link rel="icon" type="image/svg+xml" href="../assets/studio-mark.svg">
<link rel="stylesheet" href="../style.css">
<script src="../site-data.js" defer></script>
<script src="../site.js" defer></script>
<script src="../pinterest.js" defer></script>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Uriel Alexander Art Studio">
<meta property="og:title" content="${title} | Uriel Alexander Art Studio">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/webp">
<meta property="og:image:width" content="${width}">
<meta property="og:image:height" content="${height}">
<meta property="og:image:alt" content="${escape(work.alt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} | Uriel Alexander Art Studio">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${escape(work.alt)}">
<script type="application/ld+json">${JSON.stringify(metadata).replace(/</g,'\\u003c')}</script>`;
  const assetPrefix = text => text.replace(/(href|src)="(?!https?:|mailto:|#|\/)([^"]+)"/g, '$1="../$2"')
    .replace(/ class="nav-link active" aria-current="page"/g, ' class="nav-link"');
  const extra = (work.views || []).map(view => {
    if (!/^assets\/[a-zA-Z0-9_./-]+$/.test(view.image) || !view.alt || !view.caption || !view.width || !view.height)
      throw new Error('An additional photograph needs a verified file, caption, alt text and size.');
    return `<figure><div class="studio-artwork-surface"><img data-studio-artwork draggable="false" src="../${escape(view.image)}" width="${Number(view.width)}" height="${Number(view.height)}" alt="${escape(view.alt)}" loading="lazy" decoding="async"></div><figcaption>${escape(view.caption)}</figcaption></figure>`;
  }).join('');
  const previous = works[(index + works.length - 1) % works.length];
  const next = works[(index + 1) % works.length];
  return `<!doctype html>
<html lang="en"><head>${head}</head><body class="studio-artwork-page">
<a class="visually-hidden-focusable" href="#main">Skip to main content</a>
${assetPrefix(shell.header)}
<main id="main" tabindex="-1">
<div class="studio-work-breadcrumb"><a href="../gallery.html">Gallery</a><span aria-hidden="true"> / </span><span>${title}</span></div>
<article class="studio-work-layout" aria-labelledby="work-title">
<figure class="studio-work-primary"><div class="studio-artwork-surface"><img data-studio-artwork draggable="false" src="../${escape(work.image)}" width="${width}" height="${height}" alt="${escape(work.alt)}" fetchpriority="high" decoding="async"></div><figcaption>Complete painting · ${escape(work.dimensions)} · ${escape(work.framing)}</figcaption><a class="secondary-link" href="../gallery.html?work=${query}">Open enlarged viewer ↗</a></figure>
<div class="studio-work-copy"><p class="eyebrow">URIEL ALEXANDER / ORIGINAL PAINTING</p><h1 id="work-title">${title}</h1><p class="studio-work-description">${description}</p>
<dl class="studio-work-facts">${details(work).map(([key,value])=>`<div><dt>${escape(key)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>
${work.originalAvailable ? `<p class="studio-price-request">${escape(originalPrice(work))}</p><p class="studio-work-note">Unframed. Basic protective packing included; delivery and applicable tax additional. <a href="../shop.html#buying-original">Buying an original: packing, delivery &amp; returns.</a></p><p class="studio-work-note">Inquiries welcome. Availability and condition are confirmed individually. Payments and deposits are not open.</p>` : '<p class="studio-work-note">This original is not currently offered. Contact the studio to discuss the work or a related commission inquiry.</p>'}
<a class="cta-button" href="${inquire}">${work.originalAvailable ? 'Inquire about this original' : 'Contact the studio'} ↗</a>
<p class="studio-response-note">The studio aims to reply within two business days.</p>
<p class="studio-work-rights">Artwork © Uriel Alexander. <a href="../contact.html?topic=artwork&amp;work=${query}">Request image permission.</a></p></div>
</article>
${extra ? '<section class="studio-work-photographs" aria-label="Additional artwork photographs">' + extra + '</section>' : ''}
<nav class="studio-work-navigation" aria-label="Artwork navigation"><a href="${slug(previous)}.html">← ${escape(previous.title)}</a><a href="../gallery.html">All paintings</a><a href="${slug(next)}.html">${escape(next.title)} →</a></nav>
</main>${assetPrefix(shell.footer)}</body></html>`;
}

function build(output, works, shell) {
  fs.mkdirSync(path.join(output,'artwork'), {recursive:true});
  for (const [i,work] of works.entries()) fs.writeFileSync(path.join(output,page(work)),render(work,i,works,shell));
}
module.exports = {build,slug,page,details,sizes};
