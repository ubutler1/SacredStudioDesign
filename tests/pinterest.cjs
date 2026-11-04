'use strict';
// Behavioral checks use an isolated DOM fixture and never contact Pinterest.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'pinterest.js'), 'utf8');
const key = 'studio-pinterest-consent-v1';
let cases = 0;
const test = (name, run) => {
  try { run(); cases++; }
  catch (error) { error.message = name + ': ' + error.message; throw error; }
};

function browser(options = {}) {
  const nodes = [];
  const events = {};
  const values = new Map();
  if (options.choice !== undefined) values.set(key, options.choice);
  class Element {
    constructor(tag) {
      this.tagName = tag;
      this.children = [];
      this.attributes = {};
      this.listeners = {};
      this.hidden = false;
      this.disabled = false;
      nodes.push(this);
    }
    append(...items) { this.children.push(...items); }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    click() { if (!this.disabled) this.listeners.click?.(); }
  }
  const head = new Element('head');
  const footer = new Element('div');
  const settings = options.settings ? new Element('div') : null;
  const location = {
    protocol: options.protocol || 'https:',
    hostname: options.hostname || 'urielalexanderstudio.com',
    pathname: options.pathname || '/',
    search: options.search || '',
    hash: options.hash || '',
    reloads: 0,
    reload() { this.reloads++; }
  };
  const localStorage = {
    getItem(name) {
      if (options.blockStorage) throw new Error('Storage unavailable');
      return values.has(name) ? values.get(name) : null;
    },
    setItem(name, value) {
      if (options.blockStorage) throw new Error('Storage unavailable');
      values.set(name, value);
    }
  };
  const window = {
    navigator: {
      globalPrivacyControl: options.gpc || false,
      doNotTrack: options.dnt
    },
    location,
    localStorage,
    addEventListener(name, handler) { events[name] = handler; }
  };
  const document = {
    head,
    createElement: tag => new Element(tag),
    querySelector: selector => selector === '[data-pinterest-settings]' ? settings :
      selector === '#footer .footer-section' ? footer : null
  };
  const context = vm.createContext({ window, document });
  const run = () => vm.runInContext(source, context);
  run();
  return {
    window, head, footer, settings, values, events, nodes, run,
    allow: nodes.find(x => x.textContent === 'Allow Pinterest'),
    decline: nodes.find(x => x.textContent === 'Decline'),
    panel: nodes.find(x => x.className === 'studio-pinterest-choice'),
    status: nodes.find(x => x.className === 'studio-pinterest-status'),
    requests: () => head.children.filter(x => x.src)
  };
}

test('first visit has zero third-party requests', () => {
  const b = browser();
  assert.equal(b.requests().length, 0);
  assert.equal(b.window.pintrk, undefined);
  assert.equal(b.panel.hidden, false);
});
test('declining persists refusal without loading the tag', () => {
  const b = browser();
  b.decline.click();
  assert.equal(b.values.get(key), 'denied');
  assert.equal(b.requests().length, 0);
  assert.equal(browser({ choice: b.values.get(key) }).requests().length, 0);
});
test('consent initializes the exact tag once with no email argument', () => {
  const b = browser();
  b.allow.click();
  assert.equal(b.values.get(key), 'granted');
  assert.equal(b.requests().length, 1);
  assert.equal(b.requests()[0].src, 'https://s.pinimg.com/ct/core.js');
  assert.equal(b.requests()[0].async, true);
  assert.deepEqual(JSON.parse(JSON.stringify(b.window.pintrk.queue)),
    [['load', '2613622321548'], ['page']]);
  b.allow.click();
  b.run();
  assert.equal(b.requests().length, 1);
  assert.equal(b.window.pintrk.queue.length, 2);
});
test('stored consent works on the next eligible page', () => {
  const b = browser({ choice: 'granted', pathname: '/gallery.html' });
  assert.equal(b.requests().length, 1);
  assert.equal(b.panel.hidden, true);
});
test('revocation removes running vendor code through reload', () => {
  const b = browser({ choice: 'granted' });
  b.decline.click();
  assert.equal(b.values.get(key), 'denied');
  assert.equal(b.window.location.reloads, 1);
});
test('other-tab revocation and storage clearing reload an active page', () => {
  for (const storageKey of [key, null]) {
    const b = browser({ choice: 'granted' });
    b.values.delete(key);
    b.events.storage({ key: storageKey });
    assert.equal(b.window.location.reloads, 1);
  }
});
test('other-tab permission loads at most once; unrelated storage is ignored', () => {
  const b = browser();
  b.values.set(key, 'granted');
  b.events.storage({ key: 'unrelated' });
  assert.equal(b.requests().length, 0);
  b.events.storage({ key });
  b.events.storage({ key });
  assert.equal(b.requests().length, 1);
});
test('browser privacy signals override stored and clicked consent', () => {
  for (const signal of [{gpc: true}, {dnt: '1'}, {dnt: 'yes'}]) {
    const b = browser({choice: 'granted', settings: true, ...signal});
    assert.equal(b.requests().length, 0);
    assert.equal(b.allow.disabled, true);
    b.allow.click();
    assert.equal(b.requests().length, 0);
    assert.match(b.status.textContent, /browser privacy setting/);
  }
});
test('denied, invalid and absent saved choices stay off', () => {
  for (const choice of ['denied', 'true', '', undefined]) {
    assert.equal(browser({choice}).requests().length, 0);
  }
});
test('unavailable storage fails closed until an explicit page choice', () => {
  const b = browser({blockStorage: true});
  assert.equal(b.requests().length, 0);
  b.allow.click();
  assert.equal(b.requests().length, 1);
  assert.match(b.status.textContent, /cannot save/);
  assert.equal(browser({blockStorage: true}).requests().length, 0);
});
test('private previews and non-studio domains never load the vendor', () => {
  for (const hostname of ['localhost', '127.0.0.1',
    'deploy-preview-5--urielalexanderartstudio.netlify.app',
    'urielalexanderartstudio.netlify.app', 'example.com',
    'urielalexanderstudio.com.example.com']) {
    assert.equal(browser({choice:'granted', hostname}).requests().length, 0);
  }
  assert.equal(browser({choice:'granted', protocol:'http:'}).requests().length, 0);
  assert.equal(browser({choice:'granted', hostname:'www.urielalexanderstudio.com'}).requests().length, 1);
});
test('only portfolio page routes run the vendor, including clean URLs', () => {
  for (const pathname of ['/', '/index.html', '/gallery.html', '/gallery',
    '/gallery/', '/shop.html', '/shop', '/about.html', '/about', '/commissions.html', '/commissions/']) {
    assert.equal(browser({choice:'granted', pathname}).requests().length, 1, pathname);
  }
  for (const pathname of ['/contact.html', '/contact', '/contact/',
    '/thank-you.html', '/thank-you', '/privacy.html', '/privacy', '/other.html']) {
    assert.equal(browser({choice:'granted', pathname}).requests().length, 0, pathname);
  }
});
test('privacy-page controls remain available for changing a saved decision', () => {
  const b = browser({choice:'denied', pathname:'/privacy.html', settings:true});
  assert.equal(b.panel.hidden, false);
  b.allow.click();
  assert.equal(b.values.get(key), 'granted');
  assert.equal(b.panel.hidden, false);
  assert.equal(b.requests().length, 0);
  b.decline.click();
  assert.equal(b.values.get(key), 'denied');
  assert.equal(b.requests().length, 0);
});
test('query strings and fragments never reach the vendor, even with permission', () => {
  for (const address of [{search:'?work=Skyline%20State%20of%20Mind'},
    {search:'?email=example%40invalid.test'}, {search:'?utm_source=facebook'},
    {hash:'#private-note'}]) {
    const b = browser({choice:'granted', ...address});
    assert.equal(b.requests().length, 0);
    assert.equal(b.window.pintrk, undefined);
    b.allow.click();
    assert.equal(b.requests().length, 0);
  }
});
test('every page has one deferred loader and an accessible privacy route', () => {
  for (const page of ['index','gallery','shop','about','commissions','contact','thank-you','privacy']) {
    const html = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
    assert.equal((html.match(/<script src="pinterest\.js" defer><\/script>/g)||[]).length, 1, page);
    assert.match(html, /href="privacy\.html">Privacy &amp; cookie choices<\/a>/, page);
    assert.doesNotMatch(html, /(?:src|href)="https:\/\/(?:ct\.pinterest\.com|s\.pinimg\.com)/, page);
    assert.doesNotMatch(html, /<user_email_address>|<hashed_email_address>/, page);
  }
  const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
  assert.match(privacy, /data-pinterest-settings/);
  assert.match(privacy, /personalized advertising/);
  assert.match(privacy, /optout\.aboutads\.info/);
  assert.match(privacy, /JavaScript is disabled, so optional Pinterest measurement is off/);
});
console.log('Passed ' + cases + ' Pinterest behavior and integration checks; no live Pinterest requests were made.');
