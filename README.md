# ArrowTab

**ArrowTab** allows you to navigate a webpage using the arrow keys, automatically selecting the nearest focusable element. This enables fast and efficient keyboard-only navigation across the page.

ArrowTab is particularly **useful for business applications**, where power users need to prioritize **high productivity**.

Instead of hitting `Tab` a thousand times, you can simply use the arrow keys to indicate the direction and jump to the next input, button, or link you want to select.

## Setup

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

```js
import { initArrowTab } from 'arrowtab'

initArrowTab()
```

## Development

```sh
pnpm dev
```

A demo page will open in your browser / at `http://localhost:8080`.

If you want to use the library in your app, you can use the following code:

```js
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
