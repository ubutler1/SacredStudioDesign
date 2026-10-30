'use strict';
// A catalog entry becomes visible here only when its verified artwork record
// explicitly contains a shop object. Missing checkout URLs never produce
// nonfunctional buttons, prices, or fabricated availability.
(() => {
  const root = document.getElementById('shop-grid');
  const status = document.getElementById('shop-status');
  if (!root || !status) return;
  const all = Array.isArray(window.studioData?.artworks) ? window.studioData.artworks : [];
  const collection = all.filter(work => work && typeof work === 'object' &&
    work.shop && typeof work.shop === 'object' &&
    typeof work.title === 'string' && work.title.trim());
  const linkUrl = value => {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch { return ''; }
  };
  const node = (tag, cls, content) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content != null) el.textContent = content;
    return el;
  };
  function makeProduct(work) {
    const card = node('article', 'shop-product');
    const media = node('div', 'shop-product-media');
    if (typeof work.image === 'string' && work.image.trim()) {
      const photo = node('img', 'shop-product-image');
      photo.src = work.image;
      photo.alt = work.alt || work.title + ' by Uriel Alexander';
      photo.loading = 'lazy';
      photo.decoding = 'async';
      photo.addEventListener('error', () => {
        media.replaceChildren(node('p', 'shop-image-unavailable', 'Artwork photograph unavailable.'));
      }, { once:true });
      media.append(photo);
    } else {
      media.append(node('p', 'shop-image-unavailable', 'Artwork photograph forthcoming.'));
    }
    const info = node('div', 'shop-product-info');
    info.append(node('h3', 'shop-product-title', work.title));
    const description = [work.medium, work.dimensions, work.year].filter(
      item => typeof item === 'string' && item.trim()
    ).join(' · ');
    if (description) info.append(node('p', 'shop-small-print', description));
    const formats = node('div', 'shop-product-actions');
    const options = [
      { key:'physicalPrintUrl', label:'Order a fine-art print' },
      { key:'digitalDownloadUrl', label:'Buy a digital edition' }
    ];
    let links = 0;
    for (const option of options) {
      const url = linkUrl(work.shop[option.key]);
      if (!url) continue;
      const anchor = node('a', 'cta-button shop-action', option.label);
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      formats.append(anchor);
      links += 1;
    }
    if (!links) {
      formats.append(node('p','shop-small-print','Edition ordering details are coming soon.'));
    }
    info.append(formats);
    card.append(media, info);
    return card;
  }
  root.replaceChildren(...collection.map(makeProduct));
  if (!collection.length) {
    status.textContent = 'Artwork editions are being prepared. There are no active print or download listings yet.';
  } else {
    const ready = collection.reduce((n, w) =>
      n + Number(Boolean(linkUrl(w.shop.physicalPrintUrl))) +
      Number(Boolean(linkUrl(w.shop.digitalDownloadUrl))), 0);
    status.textContent = ready ?
      collection.length + ' artwork' + (collection.length === 1 ? '' : 's') + ' in the shop · ' + ready + ' ordering option' + (ready === 1 ? '' : 's') + '.' :
      'Preview collection · no active checkout links yet.';
  }
})();
