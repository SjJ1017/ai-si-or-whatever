(() => {
  'use strict';
  const E = globalThis.TermPreference, J = globalThis.JevAdapter;
  const $ = id => document.getElementById(id);
  let config;
  function values() {
    return E.normalize({enabled: $('enabled').checked,
      preference: document.querySelector('input[name=preference]:checked')?.value || 'AI',
      custom: $('custom').value, interval: $('interval').value, preserveCase: $('preserve-case').checked,
      jevEnabled: $('jev-enabled').checked, endpoint: $('endpoint').value.trim(), model: $('model').value.trim() || 'jev-latest',
      threshold: $('threshold').value, maxCalls: $('max-calls').value, excludedHosts: $('excluded-hosts').value});
  }
  function updateFields() {
    const s = values();
    $('custom-row').hidden = s.preference !== 'custom';
    $('interval-row').hidden = s.preference !== 'alternate';
  }
  async function status() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      const data = await chrome.tabs.sendMessage(tab.id, {type: 'GET_STATUS'}, {frameId: 0});
      $('page-status').textContent = data.excluded ? 'Site paused' : data.modelError ? data.modelError :
        `${data.matched} terms · ${config.settings.jevEnabled ? 'Jev: ' + data.calls + ' calls' : 'Local'}`;
    } catch { $('page-status').textContent = 'Refresh existing tabs after installing'; }
  }
  $('settings-form').addEventListener('input', updateFields);
  $('settings-form').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      const settings = values();
      const endpoint = J.endpointURL(settings.endpoint);
      if (settings.preference === 'custom' && !$('custom').value.trim()) throw new Error('Enter a custom name.');
      if (settings.jevEnabled) {
        if (!$('api-key').value.trim()) throw new Error('Enter your Jev API key.');
        // Must be requested directly in the user's click gesture.
        if (!await chrome.permissions.request({origins: [endpoint.origin + '/*']})) throw new Error('API access denied. Local mode is available.');
      }
      $('save').disabled = true;
      const result = await chrome.runtime.sendMessage({type: 'SAVE_CONFIG', settings, apiKey: $('api-key').value});
      if (!result?.ok) throw new Error(result?.error || 'Could not save.');
      config.settings = settings;
      $('feedback').textContent = settings.enabled ? 'Saved.' : 'Paused. Original text restored.';
      setTimeout(status, 600);
    } catch (error) { $('feedback').textContent = error.message; }
    finally { $('save').disabled = false; }
  });
  async function init() {
    config = await chrome.runtime.sendMessage({type: 'GET_CONFIG'});
    if (!config?.settings) throw new Error(config?.error || 'Could not load settings.');
    const s = E.normalize(config.settings);
    $('enabled').checked = s.enabled;
    document.querySelector(`input[name=preference][value="${s.preference}"]`).checked = true;
    for (const [id, key] of [['custom','custom'],['interval','interval'],['endpoint','endpoint'],['model','model'],['max-calls','maxCalls'],['threshold','threshold'],['excluded-hosts','excludedHosts']]) $(id).value = s[key];
    $('preserve-case').checked = s.preserveCase;
    $('jev-enabled').checked = s.jevEnabled;
    $('api-key').value = config.apiKey;
    updateFields(); status();
    document.body.dataset.ready = 'true';
  }
  init().catch(error => { $('feedback').textContent = error.message; });
})();
