---
'arrowtab': minor
---

New `spatial` strategy (default) that handles misaligned elements and elements of different sizes. The previous algorithm is available as `strategy: 'grid'` and now also works for rows that are not exactly aligned. Custom strategies can be passed as a function.

Special cases: navigation stays inside dialogs (modal and non-modal) and `data-arrowtab="scope"`, ARIA widgets (menus, listboxes, tablists, open comboboxes, ...) keep their arrow keys, and lost focus continues from the last focused position.

Fixes: arrow keys keep their native behavior (e.g. scrolling) if there is nothing to navigate to, `Alt` / `Ctrl` / `Meta` + arrow keys are no longer intercepted, caret detection in textareas and search / url / tel / password inputs, `autoDetectHistory` works with focus set by clicks or Tab, portal dialogs and nested dialogs, disabled fieldsets, `inert` and negative `tabindex` are respected, and a leftover `console.log` was removed.
