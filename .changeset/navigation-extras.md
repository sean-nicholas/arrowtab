---
'arrowtab': minor
---

Going back in the opposite direction returns to the element focus came from. Elements hidden by `overflow: hidden` (e.g. inactive carousel slides) are skipped and focusing scrolls as little as possible. Open shadow roots are supported, so ArrowTab works with web components. Up / down in textareas detect soft wrapped lines.

New: the cancelable `arrowtab:navigate` event, `data-arrowtab="wrap"` and `data-arrowtab="skip"`, the `root` option, and a warning if `initArrowTab` is called twice for the same root.
