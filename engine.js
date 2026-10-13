(function (root) {
  'use strict';
  const DEFAULTS = Object.freeze({enabled: true, preference: 'AI', custom: 'Intelligence', interval: 5,
    preserveCase: true, jevEnabled: false, endpoint: 'https://api.typesafe.ai/v1/systemone',
    model: 'jev-latest', threshold: 0.85, maxCalls: 6, excludedHosts: ''});
  const TECH = /artificial\s+intelligence|super\s*intelligence|machine\s+learning|\b(?:llm|chatgpt|openai|opensi|deepseek|anthropic|chatbot|neural|gpt|generative|copilot)\b|人工智能|超级智能|大模型|智能体/i;
  const UNITS = /\b(?:units?|metrology|kilograms?|metres?|meters?|joules?|pascals?|international\s+system|système\s+international)\b|国际单位|单位制/i;
  const NONTECH = /\b(?:aortic\s+insufficiency|artificial\s+insemination|avian\s+influenza|adobe\s+illustrator|sacroiliac|sports\s+illustrated)\b/i;
  const FOREIGN = /^(?:it|fr|es|pt|ro|vi)(?:-|$)/i;
  const LATIN = /[\p{Script=Latin}\p{N}_]/u;
  const BRAND = /^(?:open|x|deep|h2o|stability|google|meta|nvidia|perplexity|safe|super)$/i;
  const COMPOUND = /^(?:agents?|powered|driven|based|enabled|generated|assisted|tools?|models?|systems?|chatbots?|research|labs?|safety|search|native|first|tech|technology|policy|act)$/i;

  function normalize(input = {}) {
    const s = {...DEFAULTS, ...input};
    if (!['AI', 'SI', 'alternate', 'custom'].includes(s.preference)) s.preference = 'AI';
    s.interval = Math.min(3600, Math.max(1, Number(s.interval) || 5));
    s.threshold = Math.min(0.99, Math.max(0.5, Number(s.threshold) || 0.85));
    s.maxCalls = Math.min(50, Math.max(1, Math.floor(Number(s.maxCalls) || 6)));
    s.custom = String(s.custom || '').trim().slice(0, 80) || DEFAULTS.custom;
    s.excludedHosts = String(s.excludedHosts || '');
    return s;
  }

  function excluded(host, list) {
    return String(list).split(/[\s,]+/).some(item => {
      const domain = item.trim().toLowerCase().replace(/^\*\./, '');
      return domain && (host.toLowerCase() === domain || host.toLowerCase().endsWith('.' + domain));
    });
  }
  function literalReference(text, start) {
    const token = text.slice(Math.max(0, start - 256), start).match(/\S*$/)?.[0] + text.slice(start, start + 258).match(/^\S*/)?.[0];
    return /@|:\/\/|www\.|\.(?:com|org|net|ai|si|js|ts|py|json)\b|[\\/]|_|[=;{}]/.test(token);
  }

  // No arbitrary substring replacement: "mail", "said", "silicon" stay untouched.
  function candidates(text, context = '', language = '') {
    const found = [];
    for (const match of text.matchAll(/artificial[\s-]+intelligence|super[\s-]*intelligence/gi)) {
      const start = match.index, end = start + match[0].length;
      if (LATIN.test(text[start - 1] || '') || LATIN.test(text[end] || '')) continue;
      if (literalReference(text, start)) continue;
      found.push({start, end, raw: match[0], safe: true, full: true});
    }
    const fullRanges = [...found]; let fullIndex = 0;
    const pattern = /ai|si/gi;
    for (const match of text.matchAll(pattern)) {
      const start = match.index, end = start + 2, raw = match[0];
      while (fullRanges[fullIndex] && fullRanges[fullIndex].end <= start) fullIndex++;
      if (fullRanges[fullIndex] && start >= fullRanges[fullIndex].start && end <= fullRanges[fullIndex].end) continue;
      const before = text[start - 1] || '', after = text[end] || '';
      const left = text.slice(Math.max(0, start - 128), start).match(/[\p{Script=Latin}\d_]+$/u)?.[0] || '';
      const right = text.slice(end, end + 128).match(/^[\p{Script=Latin}\d_]+/u)?.[0] || '';
      const solo = !LATIN.test(before) && !LATIN.test(after);
      const brand = BRAND.test(left) && !LATIN.test(after);
      const camel = raw === raw.toUpperCase() && ((!left && /^[A-Z][a-z]/.test(right)) ||
        (!right && /[a-z]$/.test(left)));
      if (!solo && !brand && !camel) continue;
      // URLs, email addresses, file paths and variable identifiers are literal references.
      if (literalReference(text, start)) continue;
      const near = text.slice(Math.max(0, start - 160), end + 160);
      const surrounding = near + ' ' + context;
      const tech = TECH.test(surrounding);
      const compound = (text[end] === '-' && COMPOUND.test(text.slice(end + 1).match(/^[a-z]+/i)?.[0] || '')) ||
        (!left && COMPOUND.test(right));
      const foreignPhrase = /\b(?:ai\s+(?:miei|tuoi|suoi|nostri|vostri|loro|amici|sensi)|si\s+(?:quieres|puede|vous|tu|toi)|j['’]ai)\b/i.test(near);
      let safe = brand || compound || tech || (solo && !FOREIGN.test(language) && !foreignPhrase &&
        (raw === raw.toUpperCase() || /^(?:en|zh)(?:-|$)/i.test(language)));
      if (!brand && ((raw.toUpperCase() === 'SI' && UNITS.test(near)) || NONTECH.test(near))) safe = false;
      if (FOREIGN.test(language) && !tech && !brand && !compound) safe = false;
      found.push({start, end, raw, safe});
    }
    return found.sort((a,b) => a.start - b.start);
  }

  function target(settings, now = Date.now()) {
    if (settings.preference === 'custom') return settings.custom;
    if (settings.preference === 'alternate') return Math.floor(now / (settings.interval * 1000)) % 2 ? 'SI' : 'AI';
    return settings.preference;
  }

  function render(original, matches, settings, now, decisions) {
    if (!settings.enabled) return original;
    const replacement = target(settings, now);
    let out = '', cursor = 0;
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const approved = decisions?.[i] ?? m.safe;
      if (!approved) continue;
      let value = replacement;
      if (m.full && settings.preference !== 'custom') value = replacement === 'AI' ? 'Artificial Intelligence' : 'Super Intelligence';
      if (settings.preserveCase && settings.preference !== 'custom') {
        if (m.raw === m.raw.toLowerCase()) value = value.toLowerCase();
        else if (m.raw === m.raw.toUpperCase()) value = value.toUpperCase();
        else if (m.full && m.raw.slice(1) === m.raw.slice(1).toLowerCase()) value = value[0] + value.slice(1).toLowerCase();
        else if (m.raw[0] === m.raw[0].toUpperCase() && m.raw[1] === m.raw[1].toLowerCase())
          if (!m.full) value = value[0] + value[1].toLowerCase();
      }
      out += original.slice(cursor, m.start) + value;
      cursor = m.end;
    }
    return out + original.slice(cursor);
  }
  const api = {DEFAULTS, normalize, excluded, candidates, target, render};
  root.TermPreference = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
