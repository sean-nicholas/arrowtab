# ArrowTab

**ArrowTab** allows you to navigate a webpage using the arrow keys, automatically selecting the nearest focusable element. This enables fast and efficient keyboard-only navigation across the page.

ArrowTab is particularly **useful for business applications**, where power users need to prioritize **high productivity**.

Instead of hitting `Tab` a thousand times, you can simply use the arrow keys to indicate the direction and jump to the next input, button, or link you want to select.

ArrowTabs defaults work pretty good but they are not always a plug and play solution. It helps if you build your app with ArrowTab in mind. For example: Aligning your focusables into a grid, thinking about the placement of your navigation, etc. The idea is that you integrate ArrowTab into your app from the beginning. Not to add it as an afterthought.


## Installation

pnpm:

```sh
pnpm install arrowtab
```

yarn:

```sh
yarn add arrowtab
```

npm:

```sh
npm install arrowtab
```

## Usage

Vanilla JS:

```ts
import { initArrowTab } from 'arrowtab'

initArrowTab()
```

React:

```tsx
'use client'

import { useEffect } from 'react'
import { initArrowTab } from 'arrowtab'

export const ArrowTab = () => {
  useEffect(() => {
    const { cleanup } = initArrowTab()

    return () => {
      cleanup()
    }
  }, [])

  return null
}

```

### Cleanup

If you want to remove the ArrowTab event listener, you can call the `cleanup` function. This is useful if you use ArrowTab in a `useEffect` hook.

```ts
const { cleanup } = initArrowTab()

cleanup()
```

## data-arrowtab

You can control the behavior of ArrowTab by adding a `data-arrowtab` attribute to any element. Separate the keywords with a space. For example: `<div data-arrowtab="disable-left disable-right">`

Here are the available keywords:

### disable, disable-${key}

Sometimes your components are listening to arrow keys themselves. In that case, you can disable ArrowTab for that element by adding the `disable` attribute.

If you only want to disable a specific key, then use: `disable-left`, `disable-right`, `disable-up`, `disable-down`.


## Development

```sh
pnpm dev
```

A demo page will open in your browser / at `http://localhost:8080`.

If you want to use the library in your app, you can use the following code:

```ts
import { initArrowTab } from 'http://localhost:8080/dist/index.js'

initArrowTab()
```

Or as a script tag:

```html
<script type="module">
  import { initArrowTab } from 'http://localhost:8080/dist/index.js'

  initArrowTab()
</script>
```
