const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const image=name=>'data:image/png;base64,'+fs.readFileSync(path.join(root,name)).toString('base64');
const font=fs.readFileSync(path.join(root,'fonts/JetBrainsMono-Regular.woff2')).toString('base64');
const typography=`@font-face{font-family:Mono;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;font-family:Mono,monospace;color:#111;font-variant-ligatures:none}`;
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chromium'})});
  try{
    let page=await browser.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1});
    await page.setContent(`<style>${typography}body{width:1280px;height:800px;background:#f5f5f5;padding:64px}.name{font-size:17px;display:flex;align-items:center;gap:14px}.name img{width:40px;height:40px}.layout{display:flex;align-items:center;gap:74px;margin-top:34px}.copy{width:570px}h1{font-size:38px;font-weight:400;margin:0 0 36px;line-height:1.3}.sample{padding:22px;background:#fff;border:1px solid #ddd}.label{color:#777;font-size:11px;margin:0 0 12px}.term{font-size:21px;line-height:1.6;margin:0}.arrow{margin:20px 0;color:#888;font-size:20px}.extra{font-size:13px;color:#666;line-height:1.8;margin:25px 0 0}.popup{width:360px;border:1px solid #ddd;border-radius:5px;box-shadow:0 12px 34px #0000000c;display:block}</style><div class="name"><img src="${image('icons/icon128.png')}">AI, SI, or Whatever</div><div class="layout"><div class="copy"><h1>AI. SI. Your choice.</h1><div class="sample"><p class="label">ORIGINAL</p><p class="term">Super Intelligence<br>OpenSI · SI-Agent</p><p class="arrow">↓</p><p class="label">PREFERENCE: AI</p><p class="term">Artificial Intelligence<br>OpenAI · AI-Agent</p></div><p class="extra">Full names. Compounds. Custom names.<br>Local by default. Jev optional.</p></div><img class="popup" src="${image('docs/popup-preview.png')}"></div>`);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(root,'store-assets','screenshot-1280x800.png')});
    await page.close();
    page=await browser.newPage({viewport:{width:440,height:280},deviceScaleFactor:1});
    await page.setContent(`<style>${typography}body{width:440px;height:280px;background:#111;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px}img{width:48px;height:48px}.terms{font-size:46px;letter-spacing:-2px}.terms span{color:#888;font-size:32px}.name{font-size:11px;color:#bbb}</style><img src="${image('icons/icon128.png')}"><div class="terms">AI <span>↔</span> SI</div><div class="name">AI, SI, or Whatever</div>`);
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(root,'store-assets','promo-440x280.png')});
    await page.close();
    page=await browser.newPage({viewport:{width:128,height:128},deviceScaleFactor:1});
    await page.setContent(`<style>html,body{margin:0;width:128px;height:128px;background:transparent}img{position:absolute;left:16px;top:16px;width:96px;height:96px}</style><img src="${image('icons/icon128.png')}">`);
    await page.screenshot({path:path.join(root,'icons','store128.png'),omitBackground:true});
    console.log('Store screenshot 1280×800, promo 440×280, padded icon 128×128 generated.');
  }finally{await browser.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
