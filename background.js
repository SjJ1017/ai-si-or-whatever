importScripts('engine.js', 'jev.js');
const E = globalThis.TermPreference, J = globalThis.JevAdapter;
const ready = chrome.storage.local.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'});
const budgets = new Map();

async function readSettings() {
  await ready;
  const data = await chrome.storage.local.get(['settings', 'apiKey']);
  return {settings: E.normalize(data.settings), apiKey: data.apiKey || ''};
}
async function classify(message, sender) {
  const {settings, apiKey} = await readSettings();
  if (!settings.enabled || !settings.jevEnabled || !apiKey) throw new Error('Jev is off or the API key is missing.');
  const host = new URL(sender.url).hostname;
  if (E.excluded(host, settings.excludedHosts)) throw new Error('Site paused.');
  if (!Array.isArray(message.items) || !message.items.length || message.items.length > 24) throw new Error('Invalid batch.');
  const items = message.items.map(item => {
    if (typeof item.text !== 'string' || item.text.length > 400 || !/^(ai|si)$/i.test(item.token) ||
      !Number.isInteger(item.offset) || item.text.slice(item.offset, item.offset + 2) !== item.token)
      throw new Error('Invalid candidate.');
    return {text: item.text, token: item.token, offset: item.offset, context: String(item.context || '').slice(0, 300), language: String(item.language || '').slice(0, 40)};
  });
  const endpoint = J.endpointURL(settings.endpoint);
  if (!await chrome.permissions.contains({origins: [endpoint.origin + '/*']})) throw new Error('Allow API access in the extension.');
  const key = sender.tab.id + ':' + sender.documentId;
  const count = budgets.get(key) || 0;
  if (count >= settings.maxCalls) throw new Error('Jev call limit reached.');
  budgets.set(key, count + 1);
  if (budgets.size > 1000) budgets.delete(budgets.keys().next().value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(endpoint.href, {method: 'POST', headers: {
      'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json'
    }, body: JSON.stringify(J.buildRequest(items, settings.model)), signal: controller.signal,
    credentials: 'omit', redirect: 'error'});
    if (!response.ok) throw new Error('Jev HTTP ' + response.status + '. Using local rules.');
    return {ok: true, probabilities: J.parseResponse(await response.json(), items.length)};
  } finally { clearTimeout(timeout); }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  (async () => {
    if (message.type === 'GET_SETTINGS') return {settings: (await readSettings()).settings};
    if (message.type === 'CLASSIFY' && sender.tab) return classify(message, sender);
    // Configuration and secrets may only be accessed from extension UI.
    if (!sender.url?.startsWith(chrome.runtime.getURL(''))) throw new Error('Access denied.');
    if (message.type === 'GET_CONFIG') return readSettings();
    if (message.type === 'SAVE_CONFIG') {
      await ready;
      const settings = E.normalize(message.settings);
      J.endpointURL(settings.endpoint);
      await chrome.storage.local.set({settings, apiKey: String(message.apiKey || '').trim()});
      budgets.clear();
      const tabs = await chrome.tabs.query({});
      await Promise.allSettled(tabs.map(tab => chrome.tabs.sendMessage(tab.id, {type: 'SETTINGS_CHANGED'})));
      return {ok: true};
    }
    throw new Error('Unknown operation.');
  })().then(respond, error => respond({ok: false, error: error.name === 'AbortError' ? 'Jev timed out. Using local rules.' : error.message}));
  return true;
});
