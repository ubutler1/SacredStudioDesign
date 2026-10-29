'use strict';

const data = window.studioData || { email: '', artworks: [] };
const categories = ['figurative', 'urban'];
const filterWorks = (works, category) => works.filter(work => category === 'all' || work.categories.includes(category));
const grid = document.querySelector('#artwork-grid');
if (grid) {
  const works = Array.isArray(data.artworks) ? data.artworks : [];
  const filters = document.querySelector('.filter-row');
  const status = document.querySelector('#gallery-status');
  filters.hidden = works.length === 0;
  const render = category => {
    const shown = filterWorks(works, category);
    grid.replaceChildren();
    status.textContent = shown.length ? `${shown.length} artwork${shown.length === 1 ? '' : 's'} shown.` : (works.length ? 'No artwork in this category yet. Choose another category.' : 'Artwork photographs are being prepared.');
    for (const work of shown) {
      const card = document.createElement('article');
      card.className = 'art-card';
      const image = document.createElement('img');
      image.src = work.image;
      image.alt = work.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.className = 'artwork-photo';
      image.addEventListener('error', () => {
        const notice = document.createElement('p');
        notice.className = 'image-notice';
        notice.textContent = 'Photograph temporarily unavailable.';
        image.replaceWith(notice);
      }, { once: true });
      const meta = document.createElement('div');
      meta.className = 'art-meta';
      const title = document.createElement('h2');
      title.className = 'art-title';
      title.textContent = work.title;
      const details = document.createElement('p');
      details.className = 'art-details';
      details.textContent = [work.medium, work.dimensions, work.year].filter(Boolean).join(' · ');
      if (work.workingTitle) details.textContent = 'Working title — subject to confirmation';
      if (details.textContent) meta.append(title, details);
      else meta.append(title);
      card.append(image, meta);
      grid.append(card);
    }
  };
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    for (const item of filters.querySelectorAll('button')) {
      const active = item === button;
      item.setAttribute('aria-pressed', String(active));
      item.classList.toggle('is-active', active);
    }
    render(button.dataset.filter);
  });
  render('all');
}

// Netlify processes HTML forms. Do not intercept the POST or pretend a message was sent.
const form = document.querySelector('#inquiry-form');
if (form) {
  const params = new URLSearchParams(location.search);
  const topic = params.get('topic');
  if (['commission','artwork','prints','collaboration','general'].includes(topic)) form.elements.topic.value = topic;
  const work = params.get('work');
  const known = Array.isArray(data.artworks) && data.artworks.some(item => item.title === work);
  if (work && known) form.elements.message.value = 'I am interested in “' + work + '”.\\n\\n';
}

// Prevent an unsightly broken-image icon before web photographs are uploaded.
for (const image of document.querySelectorAll('.artwork-managed-image')) {
  image.addEventListener('error', () => {
    const notice = document.createElement('span');
    notice.className = 'home-image-unavailable';
    notice.textContent = 'Artwork image being prepared';
    image.replaceWith(notice);
  }, { once: true });
}
