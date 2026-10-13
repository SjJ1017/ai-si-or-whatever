// Opt-in live smoke test: exactly two requests, twelve synthetic snippets.
// TYPESAFE_API_KEY=... node tools/jev-smoke.cjs
// Or node tools/jev-smoke.cjs --key-file /path/to/private/key
const fs = require('node:fs');
const path = require('node:path');
const J = require('../jev.js');
const examples = [
  {text:'AI models help people write software.',token:'AI',expected:true},
  {text:'OpenAI released a new language model.',token:'AI',expected:true},
  {text:'An AI-Agent can plan and use tools.',token:'AI',expected:true},
  {text:'Scrivo ai miei amici ogni giorno.',token:'ai',expected:false,language:'it'},
  {text:'Si quieres, podemos ir mañana.',token:'Si',expected:false,language:'es'},
  {text:'The SI units include meters and kilograms.',token:'SI',expected:false},
  {text:'The government calls its AI policy Super Intelligence.',token:'AI',expected:true},
  {text:'SI technology is another name for artificial intelligence.',token:'SI',expected:true},
  {text:'This ai-powered assistant uses a neural model.',token:'ai',expected:true},
  {text:'AI means aortic insufficiency in this medical report.',token:'AI',expected:false},
  {text:'const ai = 5; return ai + 1;',token:'ai',expected:false},
  {text:'AI here means Adobe Illustrator, a drawing application.',token:'AI',expected:false}
];
(async () => {
  const fileIndex=process.argv.indexOf('--key-file');
  const key=process.env.TYPESAFE_API_KEY || (fileIndex>=0 ? fs.readFileSync(process.argv[fileIndex+1],'utf8').trim() : '');
  if(!key) throw new Error('Provide TYPESAFE_API_KEY or --key-file; this test calls the paid Jev API twice.');
  const endpoint=J.endpointURL(process.env.JEV_ENDPOINT || 'https://api.typesafe.ai/v1/systemone');
  const model=process.env.JEV_MODEL || 'jev-latest';
  const report={timestamp:new Date().toISOString(),endpoint:endpoint.href,requestedModel:model,requestCount:2,
    synthetic:true,threshold:0.85,batches:[]};
  for(let b=0;b<2;b++) {
    const cases=examples.slice(b*6,b*6+6);
    const items=cases.map(c=>({text:c.text,token:c.token,offset:c.text.indexOf(c.token),context:'',language:c.language||'en'}));
    const started=performance.now();
    const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify(J.buildRequest(items,model)),signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!response.ok) throw new Error('Jev returned HTTP '+response.status+'; no automatic retry.');
    const data=await response.json();
    const probabilities=J.parseResponse(data,items.length);
    const results=cases.map((c,i)=>({...c,probability:probabilities[i],decision:probabilities[i]>=0.85?'replace':probabilities[i]<=0.15?'preserve':'local-rule',
      correctAtThreshold:c.expected ? probabilities[i]>=0.85 : probabilities[i]<=0.15}));
    report.batches.push({model:data.model,latencyMs:Math.round(performance.now()-started),usage:data.usage,results});
    console.log('Batch '+(b+1)+': '+results.filter(r=>r.correctAtThreshold).length+'/6 decisive correct; '+report.batches[b].latencyMs+'ms');
  }
  const output=path.join(__dirname,'..','tests','jev-live-results.json');
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log('Saved synthetic results and usage (no credentials): '+output);
})().catch(error=>{console.error(error.message);process.exitCode=1});
