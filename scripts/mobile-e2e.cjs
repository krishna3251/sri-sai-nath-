/* Production-build phone/tablet checks. Run npm run build first. Isolated browser data only. */
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
try { process.loadEnvFile('.env.local'); } catch {}
const base = process.env.MOBILE_BASE_URL || 'http://127.0.0.1:3101';
(async () => {
  let server, browser;
  try {
    if (!process.env.MOBILE_BASE_URL) {
      server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3101', '--hostname', '127.0.0.1'], { stdio: 'ignore' });
      for (let n=0;n<100;n++) {
        try { if ((await fetch(base)).ok) break; } catch {}
        await new Promise(r=>setTimeout(r,200));
      }
    }
    browser = await chromium.launch({headless:true, ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),args:['--no-sandbox','--disable-dev-shm-usage']});
    const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    fs.mkdirSync('test-results',{recursive:true});
    const fit = async label => {
      const result=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth,
        overflow:[...document.querySelectorAll('.workspace *')].filter(e=>e.getBoundingClientRect().width && e.getBoundingClientRect().right>innerWidth+1).slice(0,6).map(e=>e.className)}));
      assert.ok(result.width<=result.viewport+1,`${label}: ${JSON.stringify(result)}`);
    };
    const nav=async label=>{
      if(await page.getByRole('button',{name:'Open menu',exact:true}).isVisible()) await page.getByRole('button',{name:'Open menu',exact:true}).click();
      const link=page.locator('.nav-item').filter({hasText:label});
      if(!(await link.isVisible())) await page.locator('.nav-group').filter({has:link}).locator('summary').click();
      await link.click();
      await page.locator('.screen').first().waitFor();
    };
    await page.goto(base);await page.getByLabel('Shop PIN',{exact:true}).fill(process.env.SHOP_PIN);
    await page.getByRole('button',{name:'Open shop',exact:true}).click();await page.getByRole('button',{name:'Explore Demo',exact:true}).click();
    const quick=page.getByRole('navigation',{name:'Quick shop navigation'});
    for(const width of [320,390,430,768,1024]) {
      await page.setViewportSize({width,height:844});
      for(const screen of ['Dashboard','Products & Stock','Imports & exports','Purchase In','Price Manager','Customers & Suppliers','IMEI & Serial Tracking','Invoices','Reports','Shop Settings']) {
        await nav(screen);await fit(`${width}px ${screen}`);
        if(width===390 && ['Dashboard','Products & Stock','Imports & exports','Purchase In'].includes(screen)) await page.screenshot({path:`test-results/phone-${screen.replace(/[^a-z]+/gi,'-').toLowerCase()}.png`,animations:'disabled'});
      }
      assert.equal(await quick.isVisible(),width<=700);
      console.log(`PASS ${width}px: ten ERP screens fit the viewport; correct navigation breakpoint`);
    }
    await page.setViewportSize({width:390,height:844});
    await quick.getByRole('button',{name:'Home',exact:true}).click();assert.equal(await quick.getByRole('button',{name:'Home',exact:true}).getAttribute('aria-current'),'page');
    await quick.getByRole('button',{name:'All shop modules',exact:true}).click();
    await page.getByRole('dialog',{name:'Shop navigation',exact:true}).waitFor();
    await page.keyboard.press('Escape');assert.equal(await page.locator('.sidebar').isVisible(),false);
    assert.notEqual(await page.evaluate(()=>document.body.style.overflow),'hidden');
    for(const button of await quick.getByRole('button').all()) { const b=await button.boundingBox();assert.ok(b.width>=44 && b.height>=44); }
    const search=page.locator('.global-search input');assert.ok((await search.boundingBox()).width>250);assert.ok(Number.parseFloat(await search.evaluate(e=>getComputedStyle(e).fontSize))>=16);
    await search.fill('Nova');await page.locator('.search-results').waitFor();await fit('phone global search results');await search.fill('');
    await quick.getByRole('button',{name:'Sale',exact:true}).click();
    const imei=await page.evaluate(()=>JSON.parse(localStorage.getItem('ssm-erp-demo-v1')).devices.find(d=>d.status==='In stock'&&d.imei1).imei1);
    const scan=page.getByPlaceholder('Scan barcode, IMEI or type code…');await scan.fill(imei);await scan.press('Enter');
    await page.getByRole('link',{name:'Review bill',exact:true}).click();
    const checkout=page.locator('#checkout-summary');await checkout.waitFor();
    await page.waitForFunction(() => { const r=document.getElementById("checkout-summary").getBoundingClientRect(); return r.top>=100 && r.top<innerHeight-170; });
    await page.waitForTimeout(150);
    assert.ok(await checkout.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.left+20,r.top+30));}));
    await page.screenshot({path:'test-results/phone-pos-checkout.png',animations:'disabled'});await fit('populated phone POS');
    await page.getByRole('button',{name:'Save demo sale & preview',exact:true}).click();
    await page.getByRole('dialog').locator('.invoice-paper').waitFor();await fit('phone invoice preview');
    assert.ok((await page.getByRole('dialog').locator('.invoice-paper').innerText()).includes(imei));
    assert.ok(await page.getByRole('dialog').locator('.invoice-paper').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    await page.screenshot({path:'test-results/phone-invoice-preview.png',animations:'disabled'});
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await quick.getByRole('button',{name:'Stock',exact:true}).click();await page.getByRole('button',{name:'Add product',exact:true}).click();
    await page.getByRole('dialog').waitFor();await page.setViewportSize({width:390,height:440});
    const modal=await page.locator('.modal').boundingBox();assert.ok(modal.y>=0 && modal.y+modal.height<=440);
    await fit('short viewport product dialog');
    await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.setViewportSize({width:390,height:844});
    await quick.getByRole('button',{name:'Import',exact:true}).click();await page.getByRole('button',{name:'Import file',exact:true}).click();
    await page.getByLabel('Stock import file',{exact:true}).setInputFiles({name:'phone-layout.csv',mimeType:'text/csv',buffer:Buffer.from('sku,name,tracking\nMOBILE-QA,Phone layout check,IMEI')});
    const field=page.getByLabel('Row 1 name',{exact:true});await field.waitFor();
    assert.ok(Number.parseFloat(await field.evaluate(e=>getComputedStyle(e).fontSize))>=16);
    assert.ok((await field.boundingBox()).width>250);await fit('phone import row editor');
    await field.scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/phone-import-editor.png',animations:'disabled'});
    assert.deepEqual(errors,[]);
    console.log('PASS phone quick navigation, 44px targets, full-size search, menu Escape, populated POS bill shortcut, short-height dialog and single-column import editor; no browser runtime errors');
  } finally {await browser?.close();server?.kill('SIGTERM');}
})().catch(e=>{console.error(e);process.exitCode=1});
