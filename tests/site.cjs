const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const server = http.createServer((req,res) => {
  const file = path.join(root, new URL(req.url,'http://localhost').pathname.slice(1) || 'index.html');
  if (!fs.existsSync(file)) {res.writeHead(404);return res.end();}
  res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
  res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base = `http://127.0.0.1:${server.address().port}`;
 const browser = await chromium.launch({headless:true, executablePath:process.env.BROWSER_EXECUTABLE || undefined});
 const page = await browser.newPage({acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const name of ['index','gallery','about','commissions','contact']){
   await page.goto(`${base}/${name}.html`);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name} overflows at ${width}`);
   assert.equal(await page.locator('a[href="#"],img,form[action="#"]').count(),0);
   assert.equal(await page.locator('a[aria-current="page"]').count(),name==='index'?0:1);
   await page.keyboard.press('Tab');
   assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Skip to main content');
  }
 }
 await page.goto(`${base}/gallery.html`);
 assert.equal(await page.locator('.filter-row').isVisible(),false);
 // Synthetic data tests behavior only. It is never included in delivered site content.
 await page.route('**/site-data.js',route=>route.fulfill({contentType:'text/javascript',body:`window.studioData={email:'',artworks:[{title:'Test abstract',image:'missing.jpg',alt:'Test',categories:['abstract']},{title:'Test portrait',image:'missing.jpg',alt:'Test',categories:['portrait']}]};`}));
 await page.reload();
 assert.equal(await page.locator('.art-card').count(),2);
 await page.getByRole('button',{name:'Abstract',exact:true}).click();
 assert.equal(await page.locator('.art-card').count(),1);
 assert.equal(await page.getByRole('button',{name:'Abstract',exact:true}).getAttribute('aria-pressed'),'true');
 await page.getByRole('button',{name:'Mixed media',exact:true}).click();
 assert.match(await page.locator('#gallery-status').textContent(),/No artwork/);
 await page.getByRole('button',{name:'All',exact:true}).click();
 await page.locator('.image-notice').first().waitFor();
 await page.unroute('**/site-data.js');
 await page.goto(`${base}/contact.html?topic=commission`);
 assert.equal(await page.locator('#topic').inputValue(),'commission');
 await page.getByRole('button',{name:'Download inquiry draft'}).click();
 assert.equal(await page.locator('#name').evaluate(el=>el.validity.valueMissing),true);
 await page.locator('#name').fill('Review Test');await page.locator('#email').fill('review@example.com');await page.locator('#message').fill('A test inquiry.');
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download inquiry draft'}).click();
 const download=await downloadPromise;
 assert.match(fs.readFileSync(await download.path(),'utf8'),/A test inquiry/);
 assert.match(await page.locator('#form-status').textContent(),/not been sent/);
 assert.deepEqual(errors,[]);
 await browser.close();server.close();console.log('PASS: 20 page/viewport checks, keyboard skip links, gallery filtering/empty states/image failures, validation, commission preselection, draft download, no browser errors.');
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
