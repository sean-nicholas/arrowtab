# arrowtab

## 0.1.0

### Minor Changes

- 57b4416: Going back in the opposite direction returns to the element focus came from. Elements hidden by `overflow: hidden` (e.g. inactive carousel slides) are skipped and focusing scrolls as little as possible. Open shadow roots are supported, so ArrowTab works with web components. Up / down in textareas detect soft wrapped lines.

  New: the cancelable `arrowtab:navigate` event, `data-arrowtab="wrap"` and `data-arrowtab="skip"`, the `root` option, and a warning if `initArrowTab` is called twice for the same root.

- 2a14496: New `spatial` strategy (default) that handles misaligned elements and elements of different sizes. The previous algorithm is available as `strategy: 'grid'` and now also works for rows that are not exactly aligned. Custom strategies can be passed as a function.

  Special cases: navigation stays inside dialogs (modal and non-modal) and `data-arrowtab="scope"`, ARIA widgets (menus, listboxes, tablists, open comboboxes, ...) keep their arrow keys, and lost focus continues from the last focused position.

  Fixes: arrow keys keep their native behavior (e.g. scrolling) if there is nothing to navigate to, `Alt` / `Ctrl` / `Meta` + arrow keys are no longer intercepted, caret detection in textareas and search / url / tel / password inputs, `autoDetectHistory` works with focus set by clicks or Tab, portal dialogs and nested dialogs, disabled fieldsets, `inert` and negative `tabindex` are respected, and a leftover `console.log` was removed.

## 0.0.4

### Patch Changes

- 6e1ff38: show keys pressed in index.html

## 0.0.3

### Patch Changes

- f3c1d3d: Init
