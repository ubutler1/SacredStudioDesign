import {saveInquiry, notifyInquiry, retryNotifications, STUDIO_EMAIL} from './inquiries.mjs';
const FORM_ROUTES = new Set(['/inquiry', '/thank-you', '/thank-you.html', '/thank-you/']);
const TOPICS = new Set(['artwork', 'commission', 'prints', 'collaboration', 'general']);
const FIELDS = new Set(['form-name', 'bot-field', 'name', 'email', 'topic', 'message', 'inquiry-id']);
const UPDATE_FIELDS = new Set(['form-name', 'bot-field', 'email', 'updates-consent', 'inquiry-id']);
const UPDATE_CONSENT = 'I would like occasional emails from Uriel Alexander Art Studio about new paintings, future print releases and exhibitions.';
const MAX_BODY = 131072;
const BASE_CSP = "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; upgrade-insecure-requests";

function secure(response, request, {noStore = false, noIndex = false} = {}) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Strict-Transport-Security', 'max-age=31536000');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  const url = new URL(request.url);
  const protectedRoute = /^\/(?:contact|privacy|thank-you|studio-updates|updates-confirmed)(?:\.html|\/)?$/.test(url.pathname) || url.pathname === '/inquiry';
  headers.set('Content-Security-Policy', BASE_CSP + (protectedRoute ? "; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-src 'self'" : ''));
  if (noStore || protectedRoute) headers.set('Cache-Control', 'no-store');
  if (url.hostname.endsWith('.workers.dev') || noIndex || /^\/(?:thank-you|updates-confirmed)/.test(url.pathname)) headers.set('X-Robots-Tag', 'noindex');
  return new Response(response.body, {status:response.status, statusText:response.statusText, headers});
}

function problem(request, status, message, extra = {}) {
  // Messages are fixed strings. Never reflect an inquiry, address or URL here.
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Studio inquiry | Uriel Alexander Art Studio</title><link rel="stylesheet" href="/style.css"></head><body><main class="launch-page-intro"><a href="/"><img src="/assets/logo-horizontal-transparent.png" width="360" height="115" alt="Uriel Alexander Art Studio"></a><h1>Studio inquiry</h1><p>${message}</p><p>Email <a href="mailto:${STUDIO_EMAIL}">${STUDIO_EMAIL}</a> for direct contact.</p><p><a href="/contact">Return to Contact</a> · <a href="/privacy">Privacy &amp; cookie choices</a></p></main></body></html>`;
  return secure(new Response(html, {status, headers:{'Content-Type':'text/html; charset=utf-8', ...extra}}), request, {noStore:true,noIndex:true});
}

function success(request, updates = false) {
  return secure(new Response(null, {status:303, headers:{Location:updates ? '/updates-confirmed' : '/thank-you'}}), request, {noStore:true,noIndex:true});
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

export async function handleRequest(request, env, context = {}) {
  const url = new URL(request.url);
  if (request.method === 'GET' || request.method === 'HEAD') {
    const asset = await env.ASSETS.fetch(request);
    if (request.method==='GET' && /^\/(?:contact|studio-updates)(?:\.html|\/)?$/.test(url.pathname) && asset.status===200) {
      const html = (await asset.text()).replace('__STUDIO_INQUIRY_ID__',crypto.randomUUID());
      const headers = new Headers(asset.headers);
      for (const name of ['Content-Length','Content-Encoding','ETag']) headers.delete(name);
      return secure(new Response(html,{status:200,headers}),request,{noStore:true});
    }
    return secure(asset, request);
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
  if (env.INQUIRIES_ENABLED !== 'true' || !env.INQUIRY_LIMITER?.limit || !env.INQUIRIES_DB?.prepare || !env.INQUIRY_EMAIL?.send) {
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
  const updates = data.get('form-name') === 'studio-updates';
  const allowed = updates ? UPDATE_FIELDS : FIELDS;
  for (const name of data.keys()) {
    if (!allowed.has(name) || data.getAll(name).length !== 1) return problem(request, 400, 'Please submit your request from the studio form.');
  }
  if ((!updates && data.get('form-name') !== 'studio-inquiry') || !data.has('bot-field')) {
    return problem(request, 400, 'Please submit your inquiry from the Contact form.');
  }
  if (data.get('bot-field')) return success(request, updates);
  if (updates && data.get('updates-consent') !== 'yes') {
    return problem(request,400,'Please choose whether you would like studio updates before signing up.');
  }
  const name = updates ? 'Studio updates subscriber' : data.get('name')?.trim() || '';
  const email = data.get('email')?.trim() || '';
  const topic = updates ? 'studio-updates' : data.get('topic') || '';
  const message = updates ? 'Explicit studio-updates opt-in, consent version 2026-11-09: ' + UPDATE_CONSENT + ' Unsubscribe by replying to a studio email or emailing the studio.' : data.get('message')?.trim() || '';
  if (!name || name.length > 150 || /[\x00-\x1f\x7f]/.test(name) ||
      !email || email.length > 254 || /[\x00-\x1f\x7f-\x9f]/.test(email) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      (!updates && !TOPICS.has(topic)) || !message || message.length > 10000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message)) {
    return problem(request, 400, 'Please complete all required fields with a valid email address. Keep the message within 10,000 characters.');
  }
  const suppliedId = data.get('inquiry-id');
  if (suppliedId && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(suppliedId)) {
    return problem(request,400,'Please open a fresh Contact page and send your inquiry there.');
  }
  const id = suppliedId || crypto.randomUUID();
  let saved;
  try { saved = await saveInquiry(env.INQUIRIES_DB,{name,email,topic,message},id); }
  catch { return problem(request,503,'Your inquiry could not be saved. Please email the studio directly.'); }
  if (saved.conflict) return problem(request,409,'This form has already been used. Open a fresh Contact page to send a different inquiry.');
  const delivery = notifyInquiry(env,saved.id).catch(()=>false);
  if (context.waitUntil) context.waitUntil(delivery);
  else await delivery;
  return success(request, updates);
}

export default {
  fetch(request,env,context) { return handleRequest(request,env,context); },
  scheduled(event,env,context) { context.waitUntil(retryNotifications(env).catch(()=>{})); }
};
