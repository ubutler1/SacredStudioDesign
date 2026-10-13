'use strict';

const data = window.studioData || { email: '', artworks: [] };
const categories = ['abstract', 'portrait', 'mixed-media'];
const filterWorks = (works, category) => works.filter(work => category === 'all' || work.categories.includes(category));
const grid = document.querySelector('#artwork-grid');
if (grid) {
  const works = data.artworks;
  const filters = document.querySelector('.filter-row');
  const status = document.querySelector('#gallery-status');
  filters.hidden = works.length === 0;
  const render = category => {
    const shown = filterWorks(works, category);
    grid.replaceChildren();
    if (works.length) status.textContent = shown.length ? `${shown.length} artwork${shown.length === 1 ? '' : 's'} shown.` : 'No artwork in this category yet. Choose another category.';
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
      meta.append(title, details);
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

const form = document.querySelector('#inquiry-form');
if (form) {
  const button = document.querySelector('#draft-button');
  const status = document.querySelector('#form-status');
  button.disabled = false;
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  if (['commission', 'artwork', 'collaboration', 'general'].includes(requestedTopic)) form.elements.topic.value = requestedTopic;
  const email = typeof data.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ? data.email : '';
  if (email) {
    const link = document.createElement('a');
    link.href = `mailto:${email}`;
    link.textContent = email;
    document.querySelector('#contact-details').replaceChildren(link);
    document.querySelector('#delivery-note').textContent = 'Download your inquiry draft, then send it to the studio email shown here. This site does not send or store messages.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const topic = form.elements.topic.selectedOptions[0].textContent;
    const draft = `Inquiry for Urie Alexander\n${email ? `To: ${email}\n` : ''}From: ${fields.get('name')} <${fields.get('email')}>\nTopic: ${topic}\n\n${fields.get('message')}\n`;
    const url = URL.createObjectURL(new Blob([draft], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'urie-alexander-inquiry.txt';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Draft download started. Your inquiry has not been sent.';
  });
}
