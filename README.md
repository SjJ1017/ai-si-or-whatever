# AI, SI, or Whatever

[简体中文](README.zh-CN.md)

Choose **AI**, **SI**, **alternating**, or a **custom name** for webpage terminology. Supports full names and compounds such as OpenAI and AI-Agent. Works offline without an API.

## Install

1. Download the installation ZIP from [Releases](https://github.com/SjJ1017/ai-si-or-whatever/releases) and unzip it.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Refresh existing tabs, open the extension, choose a preference, and click **Save**.

Keep the extracted folder. To update, replace its files, reload the extension, and refresh your tabs.

## Use

- **AI / SI**: replace abbreviations and full names in either direction.
- **Prefer not to say**: alternate the whole page at your chosen interval.
- **Custom**: replace both terms with your exact text.
- Turn the switch off and save to restore originals. Settings includes case preservation and site exclusions.

## Optional Jev

Expand **Jev**, enter your own TypeSafe API key, enable it, and save. Only short candidate snippets are sent; they may contain private content and incur charges. Defaults: 24 occurrences per request, 6 calls per document/frame. Uncertain or failed judgments use local rules. Keys stay on your device and are never bundled.

Code and inputs are skipped, but matching can make mistakes. Browser pages, images, PDF viewers, shadow DOM, and words split across text nodes are unsupported.

[Privacy](PRIVACY.md) · [MIT](LICENSE) · [JetBrains Mono license](fonts/OFL.txt)
