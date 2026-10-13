# Chrome Web Store listing

Name: AI, SI, or Whatever

Summary: Choose AI, SI, an alternating preference, or your own name for intelligence terminology on webpages.

Category: Accessibility

Language: English

Description:

Choose the intelligence terminology you prefer when reading the web.

• AI: use Artificial Intelligence.
• SI: use Super Intelligence.
• Prefer not to say: switch the whole page between AI and SI at your chosen interval.
• Custom: use your own name.

Supports abbreviations, full names, and compounds such as OpenAI and AI-Agent. Updates dynamic pages and restores the original text when paused. Code blocks and input fields are skipped. Includes case preservation and website exclusions.

Runs locally by default. Optional TypeSafe Jev decisions use your own API key. When enabled, short page snippets are sent to your configured API; they may contain private content and incur provider charges. Jev is not required. Uncertain or failed decisions fall back to local rules.

Matching is heuristic and may make mistakes. Browser internal pages, PDF viewers, images, shadow DOM, and words split across text nodes are unsupported.

## Privacy fields

Single purpose: Let users choose how AI and SI terminology is displayed on webpages by replacing intelligence-related text according to their preference.

Storage justification: Store the user's terminology preference, custom text, switching interval, case setting, excluded domains, and optional Jev configuration/API key locally. No sync or analytics.

Host access justification: Content scripts need HTTP(S) page access to read and replace displayed terminology across websites. Optional host permissions are requested for the user's configured API origin only when the user enables Jev. No API calls occur in local mode.

Remote code: No. All executable JavaScript and fonts are bundled. Optional Jev returns numeric decisions only, never executable code.

Data types: Website content (short text snippets, only in optional Jev mode); authentication information (the user's optional API key, sent only to their chosen API provider). No browsing-history collection, analytics, advertising, sale, or unrelated use.

Privacy policy URL: https://github.com/SjJ1017/ai-si-or-whatever/blob/main/PRIVACY.md

Homepage: https://github.com/SjJ1017/ai-si-or-whatever

Support: https://github.com/SjJ1017/ai-si-or-whatever/issues

## Reviewer test instructions

No account or API key is needed for local mode. Open an HTTP(S) page containing AI, SI, Artificial Intelligence, Super Intelligence, OpenAI, or AI-Agent. Open the extension, select SI, and Save. Verify AI → SI and Artificial Intelligence → Super Intelligence, including compounds. Switch to AI for the reverse. Choose Custom and enter any text, then Save. Choose Prefer not to say and set an interval. Turn the main switch off and Save to restore original text. Code blocks and input fields should remain unchanged.

Jev is optional and disabled by default. It uses a user-provided TypeSafe key and may incur provider charges. Its privacy warning appears before activation. Without a key, all core features remain available locally. No real API key is bundled or required to review the core extension.
