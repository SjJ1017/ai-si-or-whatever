const {test} = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const J = require('../jev.js');
const change = (text, options = {}, lang = 'en', context = '') =>
  E.render(text, E.candidates(text, context, lang), E.normalize({preference:'SI', ...options}), 0);

test('standalone, case variants and known compounds are replaced', () => {
  assert.equal(change('AI ai Ai aI OpenAI openai AI-Agent ai-powered AIResearch xAI'),
    'SI si Si SI OpenSI opensi SI-Agent si-powered SIResearch xSI');
  assert.equal(change('SI si OpenSI', {preference:'AI'}), 'AI ai OpenAI');
});
test('full names stay full names in both directions, preserving casing', () => {
  assert.equal(change('Artificial Intelligence / artificial intelligence / ARTIFICIAL INTELLIGENCE / Artificial intelligence'),
    'Super Intelligence / super intelligence / SUPER INTELLIGENCE / Super intelligence');
  assert.equal(change('Super Intelligence / superintelligence',{preference:'AI'}), 'Artificial Intelligence / artificial intelligence');
  assert.equal(change('Artificial Intelligence and AI',{preference:'custom',custom:'Magic'}), 'Magic and Magic');
});
test('ordinary words, code-like references, links and units are left intact', () => {
  const text = 'mail said rain fail silicon SILICON AIDS ai_agent openai.com https://openai.com/AI user@openai.com /AI/model.js';
  assert.equal(change(text), text);
  assert.equal(change('SI units are measured in meters', {preference:'AI'}), 'SI units are measured in meters');
  assert.equal(change('AI means aortic insufficiency'), 'AI means aortic insufficiency');
});
test('foreign homonyms are preserved but technology still matches', () => {
  assert.equal(change('Scrivo ai miei amici.', {}, 'it'), 'Scrivo ai miei amici.');
  assert.equal(change('Si quieres, vamos.', {preference:'AI'}, 'es'), 'Si quieres, vamos.');
  assert.equal(change("J’ai une idée.", {}, 'fr'), "J’ai une idée.");
  assert.equal(change('OpenAI e ai chatbot', {}, 'it'), 'OpenSI e si chatbot');
  assert.equal(change('AI智能和SI智能', {preference:'SI'}, 'zh'), 'SI智能和SI智能');
});
test('custom input is literal text, not HTML or a replacement expression', () => {
  assert.equal(change('OpenAI AI-Agent SI', {preference:'custom',custom:'<$&>'}), 'Open<$&> <$&>-Agent <$&>');
});
test('switching always renders from the original, so custom strings cannot cascade', () => {
  const text = 'OpenAI AI SI'; const m = E.candidates(text, '', 'en');
  assert.equal(E.render(text,m,E.normalize({preference:'custom',custom:'AIAI'}),0), 'OpenAIAI AIAI AIAI');
  assert.equal(E.render(text,m,E.normalize({enabled:false}),0), text);
  assert.equal(E.render(text,m,E.normalize({preference:'alternate',interval:5}),0), 'OpenAI AI AI');
  assert.equal(E.render(text,m,E.normalize({preference:'alternate',interval:5}),5000), 'OpenSI SI SI');
});
test('validated Jev probabilities can veto or approve individual occurrences', () => {
  const text = 'AI ai'; const m = E.candidates(text, '', '');
  assert.equal(E.render(text,m,E.normalize({preference:'SI'}),0,{0:false,1:true}), 'AI si');
  const req = J.buildRequest([{text:'AI',token:'AI',offset:0}], 'jev-latest');
  assert.equal(req.questions.term_0.type, 'noul');
  assert.deepEqual(J.parseResponse({answers:{term_0:{type:'noul',noul:0.97}}},1),[0.97]);
  assert.throws(() => J.parseResponse({answers:{term_0:{noul:'0.97'}}},1));
  assert.throws(() => J.parseResponse({answers:{term_0:{noul:2}}},1));
});
test('API URLs and hostname exclusions are bounded', () => {
  assert.throws(() => J.endpointURL('http://example.com/v1'));
  assert.throws(() => J.endpointURL('https://example.com/v1?key=secret'));
  assert.equal(J.endpointURL('http://localhost:8080/v1').hostname,'localhost');
  assert.equal(E.excluded('docs.example.com','example.com'),true);
  assert.equal(E.excluded('badexample.com','example.com'),false);
});
