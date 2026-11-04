// Cloudflare serves the studio's own static files. Only inquiries are relayed
// to the existing Netlify Forms installation; no browser cookies are forwarded.
const NETLIFY_ENDPOINT = 'https://urielalexanderartstudio.netlify.app/thank-you';
const STUDIO_EMAIL = 'urielalexanderstudio@gmail.com';
const FORM_ROUTES = new Set(['/inquiry', '/thank-you', '/thank-you.html', '/thank-you/']);
const TOPICS = new Set(['artwork', 'commission', 'prints', 'collaboration', 'general']);
const FIELDS = new Set(['form-name', 'bot-field', 'name', 'email', 'topic', 'message']);
const MAX_BODY = 131072;
const BASE_CSP = "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

function secure(response, request, noStore = false) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  const url = new URL(request.url);
  const protectedRoute = /^\/(?:contact|privacy|thank-you)(?:\.html|\/)?$/.test(url.pathname) || url.pathname === '/inquiry';
  headers.set('Content-Security-Policy', BASE_CSP + (protectedRoute ? "; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-src 'self'" : ''));
  if (noStore || protectedRoute) headers.set('Cache-Control', 'no-store');
  if (url.hostname.endsWith('.workers.dev') || noStore || /^\/thank-you/.test(url.pathname)) headers.set('X-Robots-Tag', 'noindex');
  return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
}

function problem(request, status, message, extra = {}) {
  // Messages are fixed strings. Never reflect an inquiry, address or URL here.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Studio inquiry | Uriel Alexander Art Studio</title><link rel="stylesheet" href="/style.css"></head><body><main class="launch-page-intro"><a href="/"><img src="/assets/logo-horizontal-transparent.png" width="360" height="115" alt="Uriel Alexander Art Studio"></a><h1>Studio inquiry</h1><p>${message}</p><p>Email <a href="mailto:${STUDIO_EMAIL}">${STUDIO_EMAIL}</a> for direct contact.</p><p><a href="/contact">Return to Contact</a> · <a href="/privacy">Privacy &amp; cookie choices</a></p></main></body></html>`;
  return secure(new Response(html, {status, headers:{'Content-Type':'text/html; charset=utf-8', ...extra}}), request, true);
}

function success(request) {
  return secure(new Response(null, {status:303, headers:{Location:'/thank-you'}}), request, true);
}

async function readLimitedBody(request) {
  const stated = request.headers.get('Content-Length');
  if (stated && (!/^\d+$/.test(stated) || Number(stated) > MAX_BODY)) throw new RangeError('body limit');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) { await reader.cancel(); throw new RangeError('body limit'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', {fatal:true}).decode(bytes);
}

export async function handleRequest(request, env, send = fetch) {
  const url = new URL(request.url);
  if (request.method === 'GET' || request.method === 'HEAD') {
    return secure(await env.ASSETS.fetch(request), request);
  }
  if (request.method !== 'POST' || !FORM_ROUTES.has(url.pathname)) {
    return problem(request, 405, 'This address does not accept that request.', {Allow:FORM_ROUTES.has(url.pathname) ? 'GET, HEAD, POST' : 'GET, HEAD'});
  }
  if (url.search) return problem(request, 400, 'Please submit your inquiry from the Contact form.');
  const origin = request.headers.get('Origin');
  let referringOrigin;
  try { referringOrigin = new URL(request.headers.get('Referer')).origin; } catch {}
  if ((origin && origin !== url.origin) || (!origin && referringOrigin !== url.origin)) {
    return problem(request, 403, 'Please open the studio Contact page and submit your inquiry there.');
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/x-www-form-urlencoded') {
    return problem(request, 415, 'Please use the studio Contact form to send an inquiry.');
  }
  if (env.FORM_RELAY_ENABLED !== 'true' || !env.INQUIRY_LIMITER?.limit) {
    return problem(request, 503, 'The inquiry form is temporarily unavailable. Please email the studio directly.');
  }
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return problem(request, 503, 'The inquiry form is temporarily unavailable. Please email the studio directly.');
  try {
    // A short-lived approximate per-location counter, not a visitor profile.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const key = 'studio-inquiry:' + Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
    if (!(await env.INQUIRY_LIMITER.limit({key})).success) {
      return problem(request, 429, 'Please wait a minute before sending another inquiry, or email the studio directly.', {'Retry-After':'60'});
    }
  } catch {
    return problem(request, 503, 'The inquiry form is temporarily unavailable. Please email the studio directly.');
  }
  let data;
  try { data = new URLSearchParams(await readLimitedBody(request)); }
  catch (error) { return problem(request, error instanceof RangeError ? 413 : 400, 'The inquiry could not be read. Please use the Contact form or email the studio.'); }
  for (const name of data.keys()) {
    if (!FIELDS.has(name) || data.getAll(name).length !== 1) return problem(request, 400, 'Please submit your inquiry from the Contact form.');
  }
  if (data.get('form-name') !== 'studio-inquiry' || !data.has('bot-field')) {
    return problem(request, 400, 'Please submit your inquiry from the Contact form.');
  }
  if (data.get('bot-field')) return success(request);
  const name = data.get('name')?.trim() || '';
  const email = data.get('email')?.trim() || '';
  const topic = data.get('topic') || '';
  const message = data.get('message')?.trim() || '';
  if (!name || name.length > 150 || /[\x00-\x1f\x7f]/.test(name) ||
      !email || email.length > 254 || /[\x00-\x1f\x7f-\x9f]/.test(email) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      !TOPICS.has(topic) || !message || message.length > 10000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message)) {
    return problem(request, 400, 'Please complete all required fields with a valid email address. Keep the message within 10,000 characters.');
  }
  const body = new URLSearchParams({'form-name':'studio-inquiry','bot-field':'',name,email,topic,message}).toString();
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 10000);
  try {
    const upstream = await send(NETLIFY_ENDPOINT, {method:'POST', redirect:'manual',
      headers:{'Content-Type':'application/x-www-form-urlencoded','Accept':'text/html'}, body, signal:controller.signal});
    let accepted = upstream.status >= 200 && upstream.status < 300;
    if ([302,303].includes(upstream.status)) {
      const target = new URL(upstream.headers.get('Location') || '/', NETLIFY_ENDPOINT);
      accepted = target.origin === new URL(NETLIFY_ENDPOINT).origin && /^\/thank-you(?:\.html|\/)?$/.test(target.pathname) && !target.search;
    }
    await upstream.body?.cancel();
    if (!accepted) return problem(request, 502, 'We could not confirm your inquiry. Please email the studio directly.');
    return success(request);
  } catch {
    return problem(request, 502, 'We could not confirm your inquiry. Please email the studio directly.');
  } finally { clearTimeout(timer); }
}

export default {fetch(request, env) { return handleRequest(request, env); }};
