/* Optional Pinterest measurement. No email matching or inquiry data is sent. */
(() => {
  'use strict';
  if (window.studioPinterestInitialized) return;
  window.studioPinterestInitialized = true;

  const tagId = '2613622321548';
  const storageKey = 'studio-pinterest-consent-v1';
  const settingsPage = document.querySelector('[data-pinterest-settings]');
  const host = settingsPage || document.querySelector('#footer .footer-section');
  if (!host) return;
  let loaded = false;
  let saved = true;

  function readChoice() {
    try {
      const value = window.localStorage.getItem(storageKey);
      return value === 'granted' || value === 'denied' ? value : null;
    } catch {
      saved = false;
      return null;
    }
  }
  let choice = readChoice();

  function privacySignal() {
    const nav = window.navigator;
    const dnt = nav.doNotTrack || window.doNotTrack;
    return nav.globalPrivacyControl === true || dnt === '1' || dnt === 'yes';
  }

  function eligiblePage() {
    const location = window.location;
    const production = location.protocol === 'https:' &&
      ['urielalexanderstudio.com', 'www.urielalexanderstudio.com'].includes(location.hostname);
    // Do not expose query or fragment values to the third-party tag.
    if (location.search || location.hash) return false;
    const page = location.pathname.replace(/\/+$/, '').replace(/\.html$/, '') || '/index';
    return production && ['/index', '/gallery', '/shop', '/about', '/commissions'].includes(page);
  }

  function startPinterest() {
    if (loaded || choice !== 'granted' || privacySignal() || !eligiblePage()) return;
    loaded = true;
    if (!window.pintrk) {
      window.pintrk = function () {
        window.pintrk.queue.push(Array.prototype.slice.call(arguments));
      };
      window.pintrk.queue = [];
      window.pintrk.version = '3.0';
      const core = document.createElement('script');
      core.id = 'studio-pinterest-core';
      core.async = true;
      core.src = 'https://s.pinimg.com/ct/core.js';
      document.head.append(core);
    }
    window.pintrk('load', tagId);
    window.pintrk('page');
  }

  const panel = document.createElement('section');
  panel.className = 'studio-pinterest-choice';
  panel.setAttribute('aria-labelledby', 'pinterest-choice-title');
  const title = document.createElement('h2');
  title.id = 'pinterest-choice-title';
  title.textContent = 'Optional Pinterest measurement';
  const copy = document.createElement('p');
  copy.textContent = 'Allow Pinterest to measure website visits and use information for personalized advertising. Your choice is optional.';
  const details = document.createElement('a');
  details.href = window.location.pathname.startsWith('/artwork/') ? '../privacy.html#pinterest' : 'privacy.html#pinterest';
  details.textContent = 'Privacy details';
  const actions = document.createElement('div');
  actions.className = 'studio-pinterest-actions';
  const allow = document.createElement('button');
  allow.type = 'button';
  allow.textContent = 'Allow Pinterest';
  const decline = document.createElement('button');
  decline.type = 'button';
  decline.textContent = 'Decline';
  const status = document.createElement('p');
  status.className = 'studio-pinterest-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  actions.append(allow, decline);
  panel.append(title, copy, details, actions, status);
  host.append(panel);

  function updateControls() {
    const blocked = privacySignal();
    panel.hidden = !settingsPage && (choice !== null || blocked);
    allow.disabled = blocked;
    allow.setAttribute('aria-pressed', String(choice === 'granted' && !blocked));
    decline.setAttribute('aria-pressed', String(choice === 'denied' || blocked));
    if (blocked) {
      status.textContent = 'Pinterest measurement is off because of your browser privacy setting.';
    } else if (choice === 'granted') {
      status.textContent = 'Pinterest measurement is allowed on the public portfolio pages. It stays off on Contact, the inquiry confirmation and this Privacy page.';
    } else if (choice === 'denied') {
      status.textContent = 'Pinterest measurement is off.';
    } else {
      status.textContent = 'Pinterest measurement stays off until you choose Allow Pinterest.';
    }
    if (!saved) status.textContent += ' This browser cannot save your preference; your choice applies to this page only.';
  }

  function choose(next) {
    if (next === 'granted' && privacySignal()) return;
    choice = next;
    try {
      window.localStorage.setItem(storageKey, next);
      saved = window.localStorage.getItem(storageKey) === next;
    } catch {
      saved = false;
    }
    if (next !== 'granted' && loaded) {
      window.location.reload();
      return;
    }
    updateControls();
    startPinterest();
  }
  allow.addEventListener('click', () => choose('granted'));
  decline.addEventListener('click', () => choose('denied'));
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    choice = readChoice();
    if (loaded && choice !== 'granted') {
      window.location.reload();
      return;
    }
    updateControls();
    startPinterest();
  });
  updateControls();
  startPinterest();
})();
