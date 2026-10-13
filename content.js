(() => {
  'use strict';
  const E = globalThis.TermPreference;
  const SKIP = 'script,style,noscript,template,code,pre,kbd,samp,input,textarea,select,option,svg,math,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="code"],.monaco-editor,.cm-editor,.CodeMirror,[data-term-preference-ignore],[hidden],[aria-hidden="true"]';
  const records = new WeakMap(), active = new Set(), roots = new Set(), modelQueue = new Set();
  let settings = E.normalize({enabled: false}), generation = 0, calls = 0, busy = false;
  let scanScheduled = false, modelTimer, ticker, modelError = '';

  function eligible(node) {
    return node.isConnected && node.parentElement && !node.parentElement.closest(SKIP) &&
      !node.parentElement.isContentEditable && node.parentElement.getRootNode() === document;
  }
  function enabled() { return settings.enabled && !E.excluded(location.hostname, settings.excludedHosts); }
  function apply(node, record) {
    const value = eligible(node) && enabled()
      ? E.render(record.original, record.matches, settings, Date.now(), record.decisions) : record.original;
    record.rendered = value;
    if (node.data !== value) node.data = value;
  }
  function inspect(node) {
    let r = records.get(node);
    if (r && node.data === r.rendered && eligible(node)) {
      if (r.matches.length) active.add(node);
      apply(node, r);
      if (settings.jevEnabled && enabled() && r.original.length <= 3000 && r.checked?.size !== r.matches.length) {
        modelQueue.add(node); scheduleModel();
      }
      return;
    }
    if (!eligible(node)) {
      if (r && node.data === r.rendered) apply(node, r);
      return;
    }
    const original = r && node.data === r.rendered ? r.original : node.data;
    if (!/ai|si|artificial|super[\s-]*intelligence/i.test(original)) { active.delete(node); records.delete(node); return; }
    const parent = node.parentElement;
    const context = parent.textContent.slice(0, 500);
    const language = parent.closest('[lang]')?.lang || document.documentElement.lang;
    const matches = E.candidates(original, context, language);
    r = {original, rendered: original, matches, context, language,
      checked: new Set(matches.map((m,i) => m.full ? i : -1).filter(i => i >= 0))};
    records.set(node, r);
    if (!matches.length) { active.delete(node); return; }
    active.add(node);
    apply(node, r);
    if (settings.jevEnabled && enabled() && original.length <= 3000) {
      modelQueue.add(node); scheduleModel();
    }
  }
  // Idle chunks keep large pages responsive. Never rewrite innerHTML or attributes.
  function enqueue(root) {
    if (root?.nodeType !== Node.TEXT_NODE && root?.nodeType !== Node.ELEMENT_NODE) return;
    roots.add(root);
    if (scanScheduled) return;
    scanScheduled = true;
    const idle = window.requestIdleCallback || (fn => setTimeout(() => fn({timeRemaining: () => 8}), 16));
    let walker = null;
    function drain(deadline) {
      const started = performance.now(); let count = 0;
      while (count < 500 && performance.now() - started < 8) {
        if (!walker) {
          const root = roots.values().next().value;
          if (!root) break;
          roots.delete(root);
          if (!root.isConnected) continue;
          if (root.nodeType === Node.TEXT_NODE) { inspect(root); count++; continue; }
          walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
            acceptNode: node => node.nodeType === Node.ELEMENT_NODE
              ? (node.matches(SKIP) || node.isContentEditable ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP)
              : NodeFilter.FILTER_ACCEPT
          });
          if (root.matches(SKIP) || root.isContentEditable) { walker = null; continue; }
        }
        const node = walker.nextNode();
        if (!node) { walker = null; continue; }
        inspect(node); count++;
      }
      if (walker || roots.size) idle(drain, {timeout: 500});
      else { scanScheduled = false; prune(); }
    }
    idle(drain, {timeout: 500});
  }
  function prune() {
    for (const node of active) if (!node.isConnected) { active.delete(node); modelQueue.delete(node); }
  }
  function refresh() {
    prune();
    for (const node of active) {
      const r = records.get(node);
      if (node.data !== r.rendered) inspect(node);
      else apply(node, r);
    }
  }
  function scheduleModel() {
    clearTimeout(modelTimer);
    modelTimer = setTimeout(runModel, 350);
  }
  async function runModel() {
    if (busy || !enabled() || !settings.jevEnabled || calls >= settings.maxCalls) return;
    const batch = [];
    // One question per occurrence; maximum 24 per request.
    for (const node of modelQueue) {
      modelQueue.delete(node);
      const r = records.get(node);
      if (!r || !eligible(node) || r.checked?.size === r.matches.length) continue;
      for (let i = 0; i < r.matches.length; i++) {
        if (batch.length >= 24) { modelQueue.add(node); break; }
        if (r.checked?.has(i)) continue;
        const m = r.matches[i];
        batch.push({node, record: r, index: i, item: {
          text: r.original.slice(Math.max(0, m.start - 180), m.end + 180),
          token: m.raw, offset: Math.min(180, m.start), context: r.context.slice(0, 300), language: r.language
        }});
      }
      if (batch.length >= 24) break;
    }
    if (!batch.length) return;
    busy = true; calls++; const epoch = generation;
    try {
      const response = await chrome.runtime.sendMessage({type: 'CLASSIFY', items: batch.map(b => b.item)});
      if (epoch !== generation) return;
      if (!response?.ok) throw new Error(response?.error || 'Jev unavailable');
      modelError = '';
      for (let i = 0; i < batch.length; i++) {
        const b = batch[i];
        if (records.get(b.node) !== b.record || !eligible(b.node) || b.node.data !== b.record.rendered) continue;
        b.record.decisions ||= {}; b.record.checked ||= new Set();
        b.record.checked.add(b.index);
        const p = response.probabilities[i];
        // Uncertain judgments preserve the deterministic decision.
        if (p >= settings.threshold) b.record.decisions[b.index] = true;
        else if (p <= 1 - settings.threshold) b.record.decisions[b.index] = false;
        apply(b.node, b.record);
      }
    } catch (error) { if (epoch === generation) modelError = error.message; }
    finally { busy = false; if (modelQueue.size) scheduleModel(); }
  }
  async function configure() {
    const response = await chrome.runtime.sendMessage({type: 'GET_SETTINGS'});
    const previous = settings;
    settings = E.normalize(response.settings);
    const modelChanged = ['enabled', 'jevEnabled', 'endpoint', 'model', 'threshold', 'maxCalls', 'excludedHosts'].some(k => previous[k] !== settings[k]);
    if (modelChanged) {
      generation++;
      calls = 0; modelQueue.clear(); modelError = '';
      for (const node of active) {
        const r = records.get(node); delete r.decisions;
        r.checked = new Set(r.matches.map((m,i) => m.full ? i : -1).filter(i => i >= 0));
        if (settings.jevEnabled && r.original.length <= 3000) modelQueue.add(node);
      }
    }
    refresh();
    clearInterval(ticker);
    if (enabled() && settings.preference === 'alternate') ticker = setInterval(refresh, 250);
    if (enabled()) enqueue(document.body);
    if (settings.jevEnabled) scheduleModel();
  }
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'characterData') {
        const r = records.get(m.target);
        if (enabled() && (!r || m.target.data !== r.rendered)) enqueue(m.target);
      } else if (m.type === 'childList') {
        if (enabled()) for (const node of m.addedNodes) enqueue(node);
      } else {
        // Restore descendants before pruning newly protected regions.
        for (const node of active) if (m.target.contains(node) && !eligible(node)) apply(node, records.get(node));
        if (enabled()) enqueue(m.target);
      }
    }
    if (mutations.some(m => m.removedNodes?.length)) prune();
  });
  observer.observe(document.documentElement, {subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['contenteditable', 'role', 'class', 'hidden', 'aria-hidden', 'lang']});
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type === 'SETTINGS_CHANGED') configure().catch(() => {});
    if (message.type === 'GET_STATUS') {
      respond({matched: [...active].reduce((n, node) => n + records.get(node).matches.filter((m, i) => records.get(node).decisions?.[i] ?? m.safe).length, 0),
        calls, modelError, excluded: E.excluded(location.hostname, settings.excludedHosts)});
    }
  });
  configure().catch(() => {});
})();
