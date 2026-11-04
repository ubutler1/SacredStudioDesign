import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {handleRequest} from '../worker/contact.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = {'form-name':'studio-inquiry','bot-field':'',name:'Studio owner',email:'urielalexanderstudio@gmail.com',topic:'general',message:'A studio inquiry about a painting. Thank you.'};
const origin = 'https://uriel-alexander-studio.example.workers.dev';
let cases = 0;
async function run(options = {}) {
  const calls = [], keys = [], assets = [];
  const headers = new Headers({'Content-Type':'application/x-www-form-urlencoded','Origin':origin,'CF-Connecting-IP':'192.0.2.1','Cookie':'private-cookie=example','Authorization':'Bearer synthetic-private-value'});
  for (const [key,value] of Object.entries(options.headers || {})) value === null ? headers.delete(key) : headers.set(key,value);
  const method = options.method || 'POST';
  const request = new Request((options.origin || origin) + (options.path || '/inquiry'), {method, headers,
    ...(!['GET','HEAD'].includes(method) ? {body:options.body ?? new URLSearchParams({...base,...options.fields}).toString()} : {})});
  const env = {
    FORM_RELAY_ENABLED:'true',
    INQUIRY_LIMITER:{async limit({key}) { keys.push(key); if(options.limiterThrows) throw Error('synthetic failure'); return {success:options.limitSuccess !== false}; }},
    ASSETS:{async fetch(req) { assets.push(req.url); return new Response(options.assetBody || 'static asset', {status:options.assetStatus || 200}); }},
    ...options.env
  };
  const response = await handleRequest(request, env, async (url, init) => {
    calls.push({url,init});
    if (options.upstreamThrows) throw Error('synthetic failure containing private details');
    return new Response('upstream receipt', {status:options.upstreamStatus || 200,headers:options.upstreamHeaders});
  });
  assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'),'DENY');
  const text = await response.text();
  if (method === 'POST') {
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'),'noindex');
    assert.ok(!text.includes('private-cookie') && !text.includes('synthetic-private-value'));
  }
  cases++;
  return {response,text,calls,keys,assets};
}
let result = await run({fields:{name:' Studio owner ',message:' Artwork inquiry — thank you.\nA second line. '}});
assert.equal(result.response.status,303);
assert.equal(result.response.headers.get('Location'),'/thank-you');
assert.equal(result.calls.length,1);
assert.equal(result.calls[0].url,'https://urielalexanderartstudio.netlify.app/thank-you');
assert.equal(result.calls[0].init.redirect,'manual');
assert.deepEqual(Object.keys(result.calls[0].init.headers).sort(),['Accept','Content-Type']);
const forwarded = new URLSearchParams(result.calls[0].init.body);
assert.equal(forwarded.get('name'),'Studio owner');
assert.equal(forwarded.get('message'),'Artwork inquiry — thank you.\nA second line.');
assert.equal(forwarded.get('bot-field'),'');
assert.equal([...forwarded.keys()].length,6);
assert.match(result.keys[0],/^studio-inquiry:[0-9a-f]{64}$/);
assert.ok(!result.keys[0].includes('192.0.2.1'));

for (const [options,status] of [
  [{headers:{Origin:'https://unrelated.invalid'}},403],
  [{headers:{Origin:'null'}},403],
  [{headers:{Origin:null}},403],
  [{headers:{'Content-Type':'application/json'}},415],
  [{env:{FORM_RELAY_ENABLED:'false'}},503],
  [{env:{INQUIRY_LIMITER:undefined}},503],
  [{headers:{'CF-Connecting-IP':null}},503],
  [{limiterThrows:true},503],
  [{limitSuccess:false},429],
  [{path:'/inquiry?message=private-example'},400],
  [{path:'/unexpected',method:'POST'},405],
  [{method:'DELETE'},405],
  [{fields:{'form-name':'another-form'}},400],
  [{body:new URLSearchParams({...base,email:'not-an-address'}).toString()},400],
  [{fields:{email:'someone@example.com\r\nBcc:other@example.com'}},400],
  [{fields:{email:'someone@example.com\0'}},400],
  [{fields:{name:'a'.repeat(151)}},400],
  [{fields:{name:'name\nheader'}},400],
  [{fields:{topic:'unknown'}},400],
  [{fields:{message:'   '}},400],
  [{fields:{message:'x'.repeat(10001)}},400],
  [{fields:{message:'private-example\0inquiry'}},400],
  [{body:new URLSearchParams(base).toString()+'&email=duplicate@example.com'},400],
  [{fields:{unexpected:'private-example-inquiry'}},400],
  [{body:new URLSearchParams(Object.fromEntries(Object.entries(base).filter(([key])=>key!=='bot-field'))).toString()},400],
  [{body:'x'.repeat(131073)},413],
  [{body:'x'.repeat(131073),headers:{'Content-Length':'1'}},413]
]) {
  const r = await run(options);
  assert.equal(r.response.status,status,JSON.stringify(options).slice(0,180));
  assert.equal(r.calls.length,0,'rejected input never reaches Netlify');
  assert.ok(!r.text.includes('private-example'),'error pages never reflect submitted data');
  if (status===429) assert.equal(r.response.headers.get('Retry-After'),'60');
}
result = await run({fields:{'bot-field':'filled'}});
assert.equal(result.response.status,303); assert.equal(result.calls.length,0);
result = await run({headers:{Origin:null,Referer:origin+'/contact'}});
assert.equal(result.response.status,303); assert.equal(result.calls.length,1);
result = await run({fields:{message:'画'.repeat(10000)}});
assert.equal(result.response.status,303, 'a valid multibyte message fits the encoded body limit');
for (const [options,status] of [
  [{upstreamStatus:500},502],
  [{upstreamThrows:true},502],
  [{upstreamStatus:301,upstreamHeaders:{Location:'https://unrelated.invalid/'}},502],
  [{upstreamStatus:303,upstreamHeaders:{Location:'https://unrelated.invalid/thank-you'}},502],
  [{upstreamStatus:302,upstreamHeaders:{Location:'/contact'}},502],
  [{upstreamStatus:303,upstreamHeaders:{Location:'/thank-you?email=private-example'}},502],
  [{upstreamStatus:303,upstreamHeaders:{Location:'/thank-you'}},303]
]) {
  const r = await run(options);
  assert.equal(r.response.status,status); assert.equal(r.calls.length,1,'never retry inquiries automatically');
  assert.ok(!r.text.includes('private details'));
}
result = await run({method:'GET',path:'/privacy'});
assert.equal(result.calls.length,0); assert.equal(result.assets.length,1);
assert.equal(result.response.headers.get('Cache-Control'),'no-store');
assert.match(result.response.headers.get('Content-Security-Policy'),/connect-src 'self'/);
assert.ok(!result.response.headers.get('Content-Security-Policy').includes('unsafe-inline'));
result = await run({method:'GET',path:'/unknown',assetStatus:404});
assert.equal(result.response.status,404); assert.equal(result.response.headers.get('X-Robots-Tag'),'noindex');
result = await run({method:'GET',path:'/thank-you',origin:'https://urielalexanderstudio.com'});
assert.equal(result.response.headers.get('X-Robots-Tag'),'noindex');

const build = spawnSync(process.execPath,[path.join(root,'scripts/build-cloudflare.cjs')],{encoding:'utf8'});
assert.equal(build.status,0,build.stderr);
const netlify = name => fs.readFileSync(path.join(root,'dist',name),'utf8');
const cloudflare = name => fs.readFileSync(path.join(root,'cloudflare-dist',name),'utf8');
assert.match(netlify('contact.html'),/action="\/thank-you.html" data-netlify="true"/,'Netlify form blueprint retained');
assert.match(netlify('privacy.html'),/Netlify hosts the website/);
assert.match(cloudflare('contact.html'),/action="\/inquiry"/);
assert.doesNotMatch(cloudflare('contact.html'),/data-netlify/);
assert.match(cloudflare('contact.html'),/handled by Cloudflare, Netlify/);
assert.match(cloudflare('privacy.html'),/Cloudflare hosts this copy/);
assert.match(cloudflare('privacy.html'),/Netlify processes and stores the submissions/);
assert.match(cloudflare('_headers'),/https:\/\/:worker\.:account\.workers\.dev\/\*/);
assert.doesNotMatch(cloudflare('_headers'),/app.netlify.com/);
assert.doesNotMatch(cloudflare('_headers'),/unsafe-inline/);
assert.ok(!fs.existsSync(path.join(root,'cloudflare-dist','_redirects')),
  'host redirects belong to zone rules; Workers static redirects reject absolute source URLs');
for (const name of ['index.html','gallery.html','shop.html','about.html','commissions.html','thank-you.html','style.css','site-data.js','site.js','pinterest.js']) {
  assert.equal(cloudflare(name),netlify(name),name+' unchanged between hosts');
}
for (const name of fs.readdirSync(path.join(root,'dist','assets'))) {
  assert.deepEqual(fs.readFileSync(path.join(root,'cloudflare-dist','assets',name)),fs.readFileSync(path.join(root,'dist','assets',name)));
}
for (const name of ['worker/contact.mjs','wrangler.json','package.json','tests/cloudflare.mjs','scripts/build-cloudflare.cjs','PINTEREST-SETUP.md']) {
  assert.ok(!fs.existsSync(path.join(root,'cloudflare-dist',name)),name+' remains private hosting output');
}
const config = JSON.parse(fs.readFileSync(path.join(root,'wrangler.json'),'utf8'));
assert.equal(config.assets.directory,'./cloudflare-dist');
assert.ok(config.assets.run_worker_first.includes('/inquiry'));
assert.ok(config.assets.run_worker_first.includes('/thank-you'));
assert.ok(!config.routes && !config.account_id,'no implicit domain cutover or guessed account');
assert.equal(config.observability.enabled,false);
console.log('Passed '+cases+' inquiry-handler scenarios plus independent-build, provider-notice, output-exclusion and asset-preservation checks. No live submissions sent by this suite.');
