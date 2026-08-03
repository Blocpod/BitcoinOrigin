# Accessibility

ORIGIN targets WCAG 2.2 Level AA for the public website and standalone HTML.

## Current baseline

- Semantic landmarks, a single page-level heading, and a keyboard skip link
- Visible focus indicators for keyboard-operable controls
- Interactive targets of at least 44 CSS pixels
- Responsive layouts from 320 CSS pixels upward without page-level horizontal scrolling
- Body text of at least 16 CSS pixels with increased line height
- High-contrast text, status labels, and non-color status indicators
- Native buttons with `aria-pressed` state for selection and filtering
- Reduced-motion support through `prefers-reduced-motion`
- Forced-colors support for operating-system high-contrast modes
- Content visible immediately without animation or a JavaScript-controlled loading screen
- Standalone `file://` operation without external fonts, scripts, or network requests

## Test expectations

Website changes should be checked with:

- keyboard-only navigation;
- browser zoom at 200%;
- reduced-motion enabled;
- iPadOS Safari and iOS Safari;
- Android Chrome;
- one desktop Chromium browser;
- at least one screen reader.

Automated accessibility tools are useful, but they do not replace manual testing.

## Reporting problems

Use the bug issue form for accessibility problems. Do not include private keys, seed phrases, RPC credentials, or private node endpoints.
