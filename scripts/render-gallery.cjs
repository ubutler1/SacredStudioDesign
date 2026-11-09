'use strict';
// Render the approved catalog for crawlers and visitors without JavaScript.
// The interactive gallery still takes over when site.js loads.
const escape = value => String(value).replace(/[&<>"']/g, character =>
  ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));

module.exports = function renderGallery(works) {
  return [...works].sort((a,b)=>Number(b.originalAvailable===true)-Number(a.originalAvailable===true)).map((work,index) => {
    const title = escape(work.title);
    const image = escape(work.image);
    const alt = escape(work.alt || work.title + ' by Uriel Alexander');
    const detail = escape([work.year, work.medium, work.dimensions].filter(Boolean).join(' · '));
    const availability = work.originalAvailable === true ? 'Original inquiries welcome' :
      work.originalAvailable === false ? 'Original unavailable' : '';
    const inquiry = 'contact.html?topic=' + (work.originalAvailable === false ? 'general' : 'artwork') +
      '&amp;work=' + escape(encodeURIComponent(work.title));
    return `<article class="art-card launch-art-card"${work.originalAvailable === true ? ' data-original-inquiry' : ''}>
<div class="launch-art-image-button studio-artwork-surface"><img class="artwork-photo" data-studio-artwork draggable="false" src="${image}" alt="${alt}" loading="${index < 2 ? 'eager' : 'lazy'}" decoding="async"></div>
<div class="art-meta"><div><h2 class="art-title">${title}</h2><p class="art-details">${detail}</p>${availability ? '<p class="art-details launch-art-availability">' + availability + '</p>' : ''}</div>
<a class="launch-art-inquire" href="${inquiry}">${work.originalAvailable === false ? 'Contact the studio ↗' : 'Inquire about this work ↗'}</a>
<details class="studio-static-work"><summary>View complete painting &amp; details</summary><div class="studio-static-full studio-artwork-surface"><img data-studio-artwork draggable="false" src="${image}" alt="${alt}" loading="lazy" decoding="async"></div><p>${escape(work.description || '')}</p></details></div></article>`;
  }).join('\n');
};
