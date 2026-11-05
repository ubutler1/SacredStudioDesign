import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {handleRequest} from '../worker/contact.mjs';
import {notifyInquiry,retryNotifications,STUDIO_EMAIL} from '../worker/inquiries.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const schema=fs.readFileSync(path.join(root,'migrations/0001_inquiries.sql'),'utf8');
const origin='https://inquiry-preview.example.workers.dev';
const base={'form-name':'studio-inquiry','bot-field':'',name:'Studio owner',email:STUDIO_EMAIL,topic:'general',message:'A painting inquiry.','inquiry-id':'12345678-1234-4123-8123-123456789012'};
let cases=0;
function database(){
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(schema);
  return {sqlite,prepare(sql){let args=[];const q=sqlite.prepare(sql);return {
    bind(...v){args=v;return this;},async run(){return {success:true,meta:{changes:q.run(...args).changes}};},
    async first(){return q.get(...args)||null;},async all(){return {success:true,results:q.all(...args)};}
  };}};
}
async function run(o={}){
  const db=o.db||database(),emails=[],keys=[],pending=[];
  const headers=new Headers({'Content-Type':'application/x-www-form-urlencoded',Origin:origin,'CF-Connecting-IP':'192.0.2.1',Cookie:'private-cookie=example',Authorization:'Bearer private-example'});
  for(const [k,v] of Object.entries(o.headers||{}))v===null?headers.delete(k):headers.set(k,v);
  const method=o.method||'POST';
  const req=new Request((o.origin||origin)+(o.path||'/inquiry'),{method,headers,...(!['GET','HEAD'].includes(method)?{body:o.body??new URLSearchParams({...base,...o.fields}).toString()}:{})});
  const env={INQUIRIES_ENABLED:'true',INQUIRIES_DB:db,
    INQUIRY_LIMITER:{async limit({key}){keys.push(key);if(o.limiterThrows)throw Error('private-example');return {success:o.limitSuccess!==false};}},
    INQUIRY_EMAIL:{async send(m){emails.push(m);if(o.mailThrows)throw Error('private-example');return o.mailEmpty?{}:{messageId:'test-message-id'};}},
    ASSETS:{async fetch(){return new Response(o.assetBody||'static asset',{status:o.assetStatus||200,headers:o.assetHeaders});}},...o.env};
  const response=await handleRequest(req,env,{waitUntil(p){pending.push(p);}});await Promise.all(pending);
  const text=await response.text();
  assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
  assert.equal(response.headers.get('X-Frame-Options'),'DENY');
  assert.equal(response.headers.get('Strict-Transport-Security'),'max-age=31536000');
  if(method==='POST'){assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(response.headers.get('X-Robots-Tag'),'noindex');assert.ok(!text.includes('private-example')&&!text.includes('private-cookie'));}
  cases++;return {response,text,db,emails,keys,env};
}
let r=await run({fields:{name:' Studio owner ',message:' Artwork inquiry — thank you.\nA second line. '}});
assert.equal(r.response.status,303);assert.equal(r.response.headers.get('Location'),'/thank-you');
let row=r.db.sqlite.prepare('SELECT * FROM studio_inquiries').get();
assert.equal(row.name,'Studio owner');assert.equal(row.notification_status,'sent');assert.equal(row.notification_attempts,1);
assert.equal(row.message,'Artwork inquiry — thank you.\nA second line.');
assert.equal(r.emails.length,1);assert.equal(r.emails[0].to,STUDIO_EMAIL);assert.equal(r.emails[0].from.email,'inquiries@urielalexanderstudio.com');assert.equal(r.emails[0].replyTo,STUDIO_EMAIL);
assert.ok(!('cc' in r.emails[0])&&!('bcc' in r.emails[0]));assert.match(r.keys[0],/^studio-inquiry:[a-f0-9]{64}$/);assert.ok(!JSON.stringify(row).includes('192.0.2.1'));
for(const [options,status] of [
  [{headers:{Origin:'https://unrelated.invalid'}},403],[{headers:{Origin:'null'}},403],[{headers:{Origin:null}},403],
  [{headers:{'Content-Type':'application/json'}},415],[{env:{INQUIRIES_ENABLED:'false'}},503],
  [{env:{INQUIRIES_DB:undefined}},503],[{env:{INQUIRY_EMAIL:undefined}},503],[{env:{INQUIRY_LIMITER:undefined}},503],
  [{headers:{'CF-Connecting-IP':null}},503],[{limiterThrows:true},503],[{limitSuccess:false},429],
  [{path:'/inquiry?message=private-example'},400],[{path:'/unexpected'},405],[{method:'DELETE'},405],
  [{fields:{'form-name':'wrong'}},400],[{fields:{email:'not-an-address'}},400],
  [{fields:{email:'a@example.com\r\nBcc:b@example.com'}},400],[{fields:{email:'a@example.com\0'}},400],
  [{fields:{name:'a'.repeat(151)}},400],[{fields:{name:'name\nheader'}},400],[{fields:{topic:'unknown'}},400],
  [{fields:{message:'   '}},400],[{fields:{message:'x'.repeat(10001)}},400],[{fields:{message:'private-example\0'}},400],
  [{body:new URLSearchParams(base)+'&email=duplicate@example.com'},400],[{fields:{unexpected:'private-example'}},400],
  [{body:new URLSearchParams(Object.fromEntries(Object.entries(base).filter(([k])=>k!=='bot-field'))).toString()},400],
  [{fields:{'inquiry-id':'not-a-uuid'}},400],[{body:'x'.repeat(131073)},413],[{body:'x'.repeat(131073),headers:{'Content-Length':'1'}},413]
]){
  const bad=await run(options);assert.equal(bad.response.status,status,JSON.stringify(options).slice(0,100));assert.equal(bad.emails.length,0);
  assert.equal(bad.db.sqlite.prepare('SELECT count(*) AS n FROM studio_inquiries').get().n,0);
}
r=await run({fields:{'bot-field':'filled'}});assert.equal(r.response.status,303);assert.equal(r.emails.length,0);assert.equal(r.db.sqlite.prepare('SELECT count(*) AS n FROM studio_inquiries').get().n,0);
r=await run({headers:{Origin:null,Referer:origin+'/contact'}});assert.equal(r.response.status,303);
r=await run({fields:{message:'画'.repeat(10000)}});assert.equal(r.response.status,303);
r=await run({body:new URLSearchParams(Object.fromEntries(Object.entries(base).filter(([k])=>k!=='inquiry-id'))).toString()});assert.equal(r.response.status,303,'forms already open at release remain usable');
r=await run({env:{INQUIRIES_DB:{prepare(){throw Error('private-example');}}}});assert.equal(r.response.status,503);assert.equal(r.emails.length,0);
const duplicateDB=database();await run({db:duplicateDB});r=await run({db:duplicateDB});assert.equal(r.response.status,303);assert.equal(r.emails.length,0);assert.equal(duplicateDB.sqlite.prepare('SELECT count(*) AS n FROM studio_inquiries').get().n,1);
r=await run({db:duplicateDB,fields:{message:'Different message'}});assert.equal(r.response.status,409);assert.equal(r.emails.length,0);
const concurrentDB=database();const concurrent=await Promise.all([run({db:concurrentDB}),run({db:concurrentDB})]);assert.equal(concurrent.reduce((n,x)=>n+x.emails.length,0),1);
for(const failure of [{mailThrows:true},{mailEmpty:true}]){
  r=await run(failure);row=r.db.sqlite.prepare('SELECT * FROM studio_inquiries').get();assert.equal(r.response.status,303);assert.equal(row.notification_status,'failed');
  let sent=0;r.env.INQUIRY_EMAIL={async send(){sent++;return {messageId:'retry-delivered'};}};
  await retryNotifications(r.env,row.next_attempt_at-1);assert.equal(sent,0);
  await retryNotifications(r.env,row.next_attempt_at);assert.equal(sent,1);assert.equal(r.db.sqlite.prepare('SELECT notification_status FROM studio_inquiries').get().notification_status,'sent');
  await retryNotifications(r.env,row.next_attempt_at+1000);assert.equal(sent,1);cases+=3;
}
r=await run({mailThrows:true});row=r.db.sqlite.prepare('SELECT * FROM studio_inquiries').get();
for(let i=0;i<4;i++){await retryNotifications(r.env,row.next_attempt_at);row=r.db.sqlite.prepare('SELECT * FROM studio_inquiries').get();}
assert.equal(row.notification_attempts,5);await retryNotifications(r.env,row.next_attempt_at+86400);assert.equal(r.db.sqlite.prepare('SELECT notification_attempts FROM studio_inquiries').get().notification_attempts,5);cases++;
r=await run();r.db.sqlite.prepare("UPDATE studio_inquiries SET notification_status='sending',notification_attempts=1,lease_until=200,next_attempt_at=0").run();
let sends=0;r.env.INQUIRY_EMAIL={async send(){sends++;return {messageId:'lease-recovered'};}};
await notifyInquiry(r.env,base['inquiry-id'],199);assert.equal(sends,0);await notifyInquiry(r.env,base['inquiry-id'],201);assert.equal(sends,1);cases+=2;
r=await run({method:'GET',path:'/contact',assetBody:'<input name="inquiry-id" value="__STUDIO_INQUIRY_ID__">',assetHeaders:{ETag:'stale','Content-Length':'80'}});assert.doesNotMatch(r.text,/__STUDIO_INQUIRY_ID__/);assert.match(r.text,/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}/);assert.equal(r.response.headers.get('ETag'),null);assert.equal(r.response.headers.get('Cache-Control'),'no-store');
r=await run({method:'GET',path:'/privacy'});assert.match(r.response.headers.get('Content-Security-Policy'),/connect-src 'self'/);assert.doesNotMatch(r.response.headers.get('Content-Security-Policy'),/unsafe-inline/);
r=await run({method:'GET',path:'/inquiries',assetStatus:404});assert.equal(r.response.status,404);assert.equal(r.db.sqlite.prepare('SELECT count(*) AS n FROM studio_inquiries').get().n,0);
r=await run({method:'GET',path:'/thank-you',origin:'https://urielalexanderstudio.com'});assert.equal(r.response.headers.get('X-Robots-Tag'),'noindex');
const build=spawnSync(process.execPath,[path.join(root,'scripts/build-cloudflare.cjs')],{encoding:'utf8'});assert.equal(build.status,0,build.stderr);
const hosted=name=>fs.readFileSync(path.join(root,'cloudflare-dist',name),'utf8');const original=name=>fs.readFileSync(path.join(root,'dist',name),'utf8');
assert.match(original('contact.html'),/data-netlify="true"/);
assert.match(hosted('contact.html'),/action="\/inquiry"/);assert.match(hosted('contact.html'),/name="inquiry-id"/);assert.doesNotMatch(hosted('contact.html'),/data-netlify|handled by Cloudflare, Netlify/);
assert.match(hosted('privacy.html'),/private studio database/);assert.match(hosted('privacy.html'),/Earlier inquiries may remain in Netlify/);assert.doesNotMatch(hosted('privacy.html'),/Netlify continues to process inquiry/);
for(const name of ['index.html','gallery.html','shop.html','about.html','commissions.html','thank-you.html','style.css','site-data.js','site.js','pinterest.js'])assert.equal(hosted(name),original(name),name+' preserved');
for(const name of fs.readdirSync(path.join(root,'dist/assets')))assert.deepEqual(fs.readFileSync(path.join(root,'cloudflare-dist/assets',name)),fs.readFileSync(path.join(root,'dist/assets',name)));
for(const name of ['worker/contact.mjs','worker/inquiries.mjs','wrangler.json','wrangler.preview.json','migrations/0001_inquiries.sql','tests/native-inquiries.mjs'])assert.ok(!fs.existsSync(path.join(root,'cloudflare-dist',name)),name+' excluded');
const config=JSON.parse(fs.readFileSync(path.join(root,'wrangler.json'),'utf8'));
assert.deepEqual(config.routes,[{pattern:'urielalexanderstudio.com',custom_domain:true},{pattern:'www.urielalexanderstudio.com',custom_domain:true}]);
assert.ok(!config.account_id);assert.equal(config.observability.enabled,false);assert.ok(config.assets.run_worker_first.includes('/contact'));
assert.equal(config.send_email[0].destination_address,STUDIO_EMAIL);assert.equal(config.d1_databases[0].binding,'INQUIRIES_DB');assert.equal(config.triggers.crons.length,1);
assert.doesNotMatch(fs.readFileSync(path.join(root,'worker/contact.mjs'),'utf8'),/NETLIFY_ENDPOINT|console\./);
console.log('Passed '+cases+' native inquiry/security/storage/retry scenarios using real SQLite, plus build/output/artwork checks. No live emails were sent.');
