// npm install --no-save playwright, or supply PLAYWRIGHT_MODULE for an existing installation.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const extension = path.resolve(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'term-preference-test-'));
const testExtension = fs.mkdtempSync(path.join(os.tmpdir(), 'term-preference-extension-'));
const fixture = fs.readFileSync(path.join(__dirname, 'fixture.html'));
const errors = []; let calls = [], apiMode = 'success';
const server = http.createServer((req,res) => {
  if (req.url === '/jev') {
    let body = '';req.on('data', b => body += b);req.on('end', () => {
      const payload = JSON.parse(body); calls.push(payload);
      if (apiMode === 'failure') { res.writeHead(503);res.end('unavailable');return; }
      const answers = {};
      for (const key of Object.keys(payload.questions)) {
        const i = Number(key.slice(5)); const item = payload.state.items[i];
        answers[key] = {type:'noul',noul: /units|amici|quieres|aortic|falsepositive/i.test(item.text) ? 0.01 : /uncertain/i.test(item.text) ? 0.5 : 0.99};
      }
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify({answers}));
    });
  } else {res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fixture);}
});
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  // Headless Chrome cannot display the native origin permission dialog. Grant
  // the isolated mock origin in a temporary manifest; keep production untouched.
  fs.cpSync(extension,testExtension,{recursive:true,filter:source=>!source.includes(path.sep+'dist'+path.sep)});
  const manifest=JSON.parse(fs.readFileSync(path.join(testExtension,'manifest.json')));
  manifest.host_permissions=[base+'/*'];
  fs.writeFileSync(path.join(testExtension,'manifest.json'),JSON.stringify(manifest));
  const context = await chromium.launchPersistentContext(profile, {
    ...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {channel:'chromium'}),
    headless:true,ignoreDefaultArgs:['--disable-extensions'],args:['--enable-unsafe-extension-debugging']
  });
  try {
    const cdp = await context.browser().newBrowserCDPSession();
    const {id} = await cdp.send('Extensions.loadUnpacked',{path:testExtension});
    const popup = await context.newPage();popup.on('pageerror', e=>errors.push(e.message));
    await popup.goto('chrome-extension://' + id + '/popup.html');
    await popup.waitForFunction(() => document.querySelector('#endpoint').value.includes('typesafe'));
    const page = await context.newPage();page.on('pageerror', e=>errors.push(e.message));
    await page.goto(base);
    const original = 'AI and SI are intelligence technology. OpenAI builds AI-Agent tools. openai builds ai-powered tools.';
    async function save(values) {
      const result = await popup.evaluate(async values => {
        const config = await chrome.runtime.sendMessage({type:'GET_CONFIG'});
        return chrome.runtime.sendMessage({type:'SAVE_CONFIG',settings:{...config.settings,...values},apiKey:'test-only-not-a-real-key'});
      },values);
      assert.equal(result.ok,true);await pause(450);
    }
    await save({preference:'SI'});
    assert.equal(await page.locator('#prose').textContent(),'SI and SI are intelligence technology. OpenSI builds SI-Agent tools. opensi builds si-powered tools.');
    assert.equal(await page.locator('#full').textContent(),'Super Intelligence / super intelligence / Super Intelligence / SUPER INTELLIGENCE');
    assert.equal(await page.locator('#code').textContent(),'const aiAgent = OpenAI; let ai = SI;');
    assert.equal(await page.locator('#pre').textContent(),'AI SI OpenAI');
    assert.equal(await page.locator('#input').inputValue(),'AI and OpenAI');
    assert.equal(await page.locator('#editable').textContent(),'AI and SI');
    assert.equal(await page.locator('#italian').textContent(),'Scrivo ai miei amici.');
    assert.equal(await page.locator('#spanish').textContent(),'Si quieres, vamos.');
    assert.equal(await page.locator('#units').textContent(),'The SI units include meters and kilograms.');
    assert.equal(await page.locator('#url').textContent(),'https://openai.com/AI-Agent');
    assert.equal(await page.locator('#link').getAttribute('href'),'https://openai.com/AI-Agent');
    assert.equal(await page.evaluate(()=>window.aiAgent),'AI');
    await page.evaluate(()=>document.querySelector('#dynamic').append(document.createTextNode('OpenAI AI-Agent')));
    await page.waitForFunction(()=>document.querySelector('#dynamic').textContent==='OpenSI SI-Agent');
    await page.evaluate(()=>document.querySelector('#dynamic').firstChild.data='OpenAI AI has changed');
    await page.waitForFunction(()=>document.querySelector('#dynamic').textContent==='OpenSI SI has changed');
    await page.locator('#protected-later').evaluate(el=>el.contentEditable='true');
    await page.waitForFunction(()=>document.querySelector('#protected-later').textContent==='OpenAI AI');
    await page.locator('#protected-later').evaluate(el=>el.contentEditable='false');
    await page.waitForFunction(()=>document.querySelector('#protected-later').textContent==='OpenSI SI');
    await save({preference:'custom',custom:'<$&>'});
    assert.equal(await page.locator('#dynamic').textContent(),'Open<$&> <$&> has changed');
    assert.equal(await page.locator('#dynamic').locator('*').count(),0);
    await save({enabled:false});assert.equal(await page.locator('#prose').textContent(),original);
    assert.equal(await page.locator('#dynamic').textContent(),'OpenAI AI has changed');
    await save({enabled:true,preference:'alternate',interval:1});
    const first = await page.locator('#dynamic').textContent();
    await page.waitForFunction(first => document.querySelector('#dynamic').textContent !== first,first);
    await save({preference:'SI',excludedHosts:'127.0.0.1'});
    assert.equal(await page.locator('#prose').textContent(),original);
    await save({excludedHosts:'',preference:'SI'});
    await page.evaluate(()=>{const e=document.createElement('p');e.textContent='AI '.repeat(5000);document.body.append(e)});
    await page.waitForFunction(()=>document.body.lastElementChild.textContent.startsWith('SI SI'));
    await page.evaluate(()=>document.body.lastElementChild.remove());
    assert.equal(calls.length,0,'Offline mode must never call API');
    console.log('PASS: actual extension loading, restoration, compounds, protected DOM, dynamic edits, alternating, exclusions and large text.');

    await page.evaluate(()=>{
      for(const [id,text,lang] of [['approve','An ai opportunity.','und'],['reject','AI FalsePositive','en'],['uncertain','AI uncertain','en']]) {
        const p=document.createElement('p');p.id=id;p.lang=lang;p.textContent=text;document.body.append(p);
      }
    });
    await pause(100);
    assert.equal(await page.locator('#approve').textContent(),'An ai opportunity.');
    assert.equal(await page.locator('#reject').textContent(),'SI FalsePositive');

    // Grant only the local mock API, never call a metered provider.
    const allowed = await popup.evaluate(origin=>chrome.permissions.contains({origins:[origin+'/*']}),base);
    assert.equal(allowed,true);
    await save({jevEnabled:true,endpoint:base+'/jev',maxCalls:6});
    await pause(1500);
    assert.ok(calls.length>0 && calls.length<=6);
    assert.equal(calls[0].model,'jev-latest');
    assert.ok(Object.values(calls[0].questions).every(q=>q.type==='noul'));
    assert.ok(calls.every(c=>c.state.items.every(i=>i.text.length<=400 && i.context.length<=300)));
    const result = await page.evaluate(()=>document.querySelector('#prose').textContent);
    assert.ok(result.includes('OpenSI'));
    assert.equal(await page.locator('#approve').textContent(),'An si opportunity.');
    assert.equal(await page.locator('#reject').textContent(),'AI FalsePositive');
    assert.equal(await page.locator('#uncertain').textContent(),'SI uncertain');
    const contentHasSecret = await page.evaluate(()=>Boolean(globalThis.apiKey));assert.equal(contentHasSecret,false);
    apiMode='failure';calls=[];
    await save({jevEnabled:false});await save({jevEnabled:true,maxCalls:1});
    await pause(1000);
    assert.equal(calls.length,1);assert.ok((await page.locator('#prose').textContent()).includes('OpenSI'));
    const status = await popup.evaluate(async()=>{
      const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.startsWith('http://127'));
      // No tabs permission: retrieve the fixture tab by asking the test's known page ID below instead.
      return tab ? chrome.tabs.sendMessage(tab.id,{type:'GET_STATUS'}) : null;
    });
    if(status) assert.match(status.modelError,/503/);
    console.log('PASS: Jev native Noul request/response, snippet limits, API opt-in, call budget and HTTP failure fallback (mock API).');
    await save({jevEnabled:false,preference:'AI'});
    await popup.reload();await popup.waitForFunction(()=>document.body.dataset.ready==='true');
    assert.equal(await popup.locator('#enabled').isChecked(),true);
    await popup.setViewportSize({width:360,height:600});
    await popup.evaluate(()=>document.fonts.ready);
    await popup.locator('body').screenshot({path:path.join(extension,'docs','popup-preview.png'),animations:'disabled'});
    await popup.locator('#api-key').fill('');
    await popup.locator('#endpoint').fill('https://api.typesafe.ai/v1/systemone');
    await popup.locator('#max-calls').fill('6');
    await popup.locator('#jev-details').evaluate(el=>el.open=true);
    await popup.locator('body').screenshot({path:path.join(extension,'docs','jev-preview.png'),animations:'disabled'});
    assert.deepEqual(errors,[]);
  } finally { await context.close(); server.close();fs.rmSync(profile,{recursive:true,force:true});fs.rmSync(testExtension,{recursive:true,force:true}); }
})().catch(error=>{console.error(error);server.close();fs.rmSync(profile,{recursive:true,force:true});fs.rmSync(testExtension,{recursive:true,force:true});process.exitCode=1});
