// Dependency-free allowlisted release packager (macOS/Linux, requires zip).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname,'..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const files = ['manifest.json','engine.js','content.js','jev.js','background.js',
  'popup.html','popup.css','popup.js','README.md','README.zh-CN.md','LICENSE','PRIVACY.md','RELEASING.md',
  'docs/popup-preview.png','icons/icon16.png','icons/icon32.png','icons/icon48.png','icons/icon128.png','icons/store128.png',
  'fonts/JetBrainsMono-Regular.woff2','fonts/JetBrainsMono-Medium.woff2','fonts/OFL.txt'];
const name = 'ai-si-or-whatever';
const outputDir = path.join(root,'dist');fs.mkdirSync(outputDir,{recursive:true});
const output = path.join(outputDir, `${name}-v${manifest.version}.zip`);
const sourceOutput = path.join(outputDir, `${name}-v${manifest.version}-source.zip`);
const storeOutput = path.join(outputDir, `${name}-v${manifest.version}-webstore.zip`);
const stage = fs.mkdtempSync(path.join(os.tmpdir(),'term-release-'));
try {
  for(const file of files) {
    const target = path.join(stage,name,file);
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
  }
  if(fs.existsSync(output)) fs.unlinkSync(output);
  const zip = spawnSync('zip',['-q','-r',output,name],{cwd:stage,encoding:'utf8'});
  if(zip.status !== 0) throw new Error(zip.error?.message || zip.stderr || 'zip failed');
  console.log(output);
  console.log(`${files.length} allowlisted files · ${fs.statSync(output).size} bytes · no dependencies or keys`);
  const sourceFiles=['.gitignore','tests/engine.test.js','tests/browser.test.cjs','tests/fixture.html',
    'tests/jev-live-results.json','tools/package.cjs','tools/jev-smoke.cjs','tools/build-store-assets.cjs'];
  for(const file of sourceFiles) {
    const target=path.join(stage,name,file);fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(path.join(root,file),target);
  }
  if(fs.existsSync(sourceOutput)) fs.unlinkSync(sourceOutput);
  const sourceZip=spawnSync('zip',['-q','-r',sourceOutput,name],{cwd:stage,encoding:'utf8'});
  if(sourceZip.status!==0) throw new Error(sourceZip.error?.message || sourceZip.stderr || 'source zip failed');
  console.log(sourceOutput);
  console.log(`${files.length+sourceFiles.length} allowlisted source files · ${fs.statSync(sourceOutput).size} bytes`);
  // Chrome Web Store requires manifest.json at ZIP root.
  const storeFiles=files.filter(f=>!f.endsWith('.md')&&!f.startsWith('docs/'));
  if(fs.existsSync(storeOutput)) fs.unlinkSync(storeOutput);
  const storeZip=spawnSync('zip',['-q',storeOutput,...storeFiles],{cwd:path.join(stage,name),encoding:'utf8'});
  if(storeZip.status!==0) throw new Error(storeZip.error?.message || storeZip.stderr || 'store zip failed');
  console.log(storeOutput);
  console.log(`${storeFiles.length} runtime/license files · manifest at ZIP root`);
} finally {fs.rmSync(stage,{recursive:true,force:true});}
