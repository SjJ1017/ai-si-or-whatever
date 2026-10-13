# Privacy — AI, SI, or Whatever

Version 0.1.1 · Updated 2026-10-13

The extension changes how intelligence-related terminology is displayed on webpages, according to the preference you set.

## Local mode

Local mode processes page text in your browser. Preferences, excluded domains, Jev configuration, and an optional API key are stored locally in the Chrome extension's storage. This extension does not sync them to a cloud account. It does not collect analytics, sell data, or send page text to the publisher. It does not have a publisher-operated backend.

## Optional Jev mode

Jev is off by default. If you explicitly enable it and provide your own API key, the extension sends short text snippets containing candidate AI/SI occurrences, their nearby context, and a language hint to the API endpoint you configure. The default endpoint is operated by TypeSafe. Requests include your API key in the Authorization header. Snippets may contain personal, private, or sensitive information from the pages you read; the extension cannot automatically guarantee that they do not.

The extension does not include the page URL, browsing history, cookies, form values, or the entire document in the request. Recognized editable fields and code regions are excluded from processing. The API provider receives network-level information such as your IP address through the request itself. The provider's retention and processing terms govern data received by it; consult those terms before enabling this feature. A custom endpoint receives the same data instead of the default endpoint.

The extension uses returned probabilities solely to decide whether a candidate occurrence refers to intelligence terminology. Decisions are held in memory with the current document. It does not persist snippet histories or provider responses.

## Controls and deletion

You can turn off Jev and continue locally, remove the API key and save, exclude domains, or pause all replacements and save. To delete all extension settings, uninstall the extension from Chrome. Revoking an API key with its provider prevents its further use. Uninstalling does not request deletion of snippets already sent to a third-party provider.

## Permissions

- Page access / content scripts: read and replace displayed text on HTTP(S) webpages and frames.
- Storage: keep your preferences and optional API key on this browser.
- Optional API origin access: contact only the endpoint configured by you after you enable Jev and grant any necessary permission.

The API key is withheld from content scripts and webpage JavaScript using Chrome's trusted-context storage restriction. Local storage is not encrypted by this extension and is not protected against someone with access to your browser profile.

## Limited use

Data is used only to provide the extension's terminology replacement feature. It is not sold or used for advertising, profiling, or credit decisions. Transfers to an API provider occur only to provide the optional Jev feature selected by the user. This use follows the Chrome Web Store User Data Policy, including its Limited Use requirements.

For questions, use the contact details on the extension's Chrome Web Store listing.
