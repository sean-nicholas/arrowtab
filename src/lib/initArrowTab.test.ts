// @vitest-environment happy-dom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest'
import { initArrowTab, type ArrowTabOptions } from './initArrowTab.js'
import { spatial } from './strategies.js'

// happy-dom has no layout, so elements get their position from data-rect="left top width height"
const getDataRect = ({ element }: { element: Element }) => {
  const [left = 0, top = 0, width = 0, height = 0] = (
    element.getAttribute('data-rect') ?? ''
  )
    .split(' ')
    .map(Number)
  return { left, top, width, height }
}

beforeAll(() => {
  Element.prototype.getBoundingClientRect = function () {
    const { left, top, width, height } = getDataRect({ element: this })
    return DOMRect.fromRect({ x: left, y: top, width, height })
  }
  Object.defineProperties(HTMLElement.prototype, {
    clientWidth: {
      get() {
        return getDataRect({ element: this }).width
      },
    },
    clientHeight: {
      get() {
        return getDataRect({ element: this }).height
      },
    },
  })
})

let cleanup = () => {}

const setup = ({
  html,
  options,
}: {
  html: string
  options?: ArrowTabOptions
}) => {
  document.body.innerHTML = html
  cleanup = initArrowTab(options).cleanup
}

const byId = (id: string) => document.getElementById(id) as HTMLElement

const press = ({ key, init }: { key: string; init?: KeyboardEventInit }) => {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  })
  ;(document.activeElement ?? document.body).dispatchEvent(event)
  return event
}

const nextTick = () => new Promise((resolve) => setTimeout(resolve))

beforeEach(() => {
  document.body.innerHTML = ''
})

afterEach(() => {
  cleanup()
})

describe('navigation', () => {
  test('moves focus in the pressed direction', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <button id="b" data-rect="120 10 100 40">b</button>
        <button id="c" data-rect="0 60 100 40">c</button>
      `,
    })
    byId('a').focus()

    expect(press({ key: 'ArrowRight' }).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(byId('b'))

    press({ key: 'ArrowLeft' })
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('c'))
  })

  test('keeps the native behavior if nothing is within reach', () => {
    setup({ html: `<button id="a" data-rect="0 0 100 40">a</button>` })
    byId('a').focus()

    expect(press({ key: 'ArrowDown' }).defaultPrevented).toBe(false)
  })

  test('prevents value changes of fields even if nothing is within reach', () => {
    setup({ html: `<input id="a" type="number" data-rect="0 0 100 40" />` })
    byId('a').focus()

    expect(press({ key: 'ArrowDown' }).defaultPrevented).toBe(true)
  })

  test('ignores modifier keys', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <button id="b" data-rect="120 0 100 40">b</button>
      `,
    })
    byId('a').focus()

    for (const modifier of ['shiftKey', 'altKey', 'metaKey', 'ctrlKey']) {
      const event = press({ key: 'ArrowRight', init: { [modifier]: true } })
      expect(event.defaultPrevented).toBe(false)
      expect(document.activeElement).toBe(byId('a'))
    }
  })

  test('reaches non-editable controls inside a contenteditable', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <div contenteditable="true" data-rect="0 60 300 40">
          <a href="#" data-rect="0 60 100 40">part of the text</a>
          <button id="action" contenteditable="false" data-rect="200 60 100 40">action</button>
        </div>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('action'))
  })

  test('reaches nested editors with a tabindex', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <div contenteditable="true" data-rect="0 60 300 40">
          <div id="nested" contenteditable="true" tabindex="0" data-rect="200 60 100 40">nested</div>
        </div>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('nested'))
  })

  test('skips elements that are not focusable via Tab', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <button disabled data-rect="120 0 100 40">disabled</button>
        <button tabindex="-1" data-rect="240 0 100 40">tabindex</button>
        <div inert><button data-rect="360 0 100 40">inert</button></div>
        <div aria-hidden="true"><button data-rect="480 0 100 40">hidden</button></div>
        <button data-rect="600 0 0 0">empty</button>
        <button id="b" data-rect="720 0 100 40">b</button>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('b'))
  })

  test('uses the grid strategy if configured', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <button id="far" data-rect="400 60 100 40">far</button>
        <button id="near" data-rect="150 60 100 40">near</button>
      `,
      options: { strategy: 'grid' },
    })
    byId('a').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('near'))
  })

  test('going back returns to the element focus came from', () => {
    setup({
      html: `
        <button id="wide" data-rect="0 0 300 40">wide</button>
        <button id="left" data-rect="0 60 100 40">left</button>
        <button id="right" data-rect="200 60 100 40">right</button>
        <button id="top-right" data-rect="200 -60 100 40">top right</button>
      `,
    })
    byId('top-right').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('wide'))
    press({ key: 'ArrowUp' })
    expect(document.activeElement).toBe(byId('top-right'))

    byId('right').focus()
    press({ key: 'ArrowUp' })
    expect(document.activeElement).toBe(byId('wide'))
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('right'))
  })

  test('skips elements clipped by overflow: hidden', () => {
    // happy-dom doesn't expand the overflow shorthand
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <div style="overflow-x: hidden; overflow-y: hidden" data-rect="120 0 100 40">
          <button id="visible" data-rect="120 0 100 40">visible</button>
          <button id="clipped" data-rect="220 0 100 40">clipped</button>
        </div>
        <div style="overflow-x: auto; overflow-y: auto" data-rect="0 60 100 40">
          <button data-rect="0 60 100 40">scrollable</button>
          <button id="scrolled" data-rect="120 60 100 40">scrolled out</button>
        </div>
      `,
    })
    byId('visible').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('visible'))
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('scrolled'))
  })

  test('elements in a scroll container inside overflow: hidden stay reachable', () => {
    setup({
      html: `
        <div style="overflow-x: hidden; overflow-y: hidden" data-rect="0 0 220 40">
          <div style="overflow-x: auto; overflow-y: auto" data-rect="0 0 220 40">
            <button id="a" data-rect="0 0 100 40">a</button>
            <button id="b" data-rect="120 0 100 40">b</button>
            <button id="c" data-rect="240 0 100 40">scrolled out</button>
          </div>
        </div>
      `,
    })
    byId('b').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('c'))
  })

  test('data-arrowtab="skip" excludes elements', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <a href="#" data-arrowtab="skip" data-rect="120 0 100 40">help</a>
        <button id="b" data-rect="240 0 100 40">b</button>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('b'))
  })

  test('the navigate event can cancel navigation', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <button id="b" data-rect="120 0 100 40">b</button>
      `,
    })
    byId('a').focus()
    const details: unknown[] = []
    const onNavigate = (event: CustomEvent) => {
      details.push(event.detail)
      event.preventDefault()
    }
    document.addEventListener('arrowtab:navigate', onNavigate)

    expect(press({ key: 'ArrowRight' }).defaultPrevented).toBe(false)
    document.removeEventListener('arrowtab:navigate', onNavigate)

    expect(document.activeElement).toBe(byId('a'))
    expect(details).toEqual([
      { from: byId('a'), to: byId('b'), direction: 'right' },
    ])
  })

  test('the root option limits navigation', () => {
    document.body.innerHTML = `
      <div id="root">
        <button id="a" data-rect="0 0 100 40">a</button>
      </div>
      <button id="outside" data-rect="120 0 100 40">outside</button>
      <button id="below" data-rect="120 60 100 40">below</button>
    `
    cleanup = initArrowTab({ root: byId('root') }).cleanup

    byId('a').focus()
    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('a'))

    byId('outside').focus()
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('outside'))
  })

  test('the root option keeps lost focus recovery', () => {
    document.body.innerHTML = `
      <div id="root">
        <button id="removed" data-rect="0 0 100 40">removed</button>
        <button id="below" data-rect="0 60 100 40">below</button>
      </div>
    `
    cleanup = initArrowTab({ root: byId('root') }).cleanup
    byId('removed').focus()
    byId('removed').remove()
    ;(document.activeElement as HTMLElement | null)?.blur()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('below'))
  })

  test('navigates into and out of shadow roots', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <div id="host"></div>
        <button id="b" data-rect="240 0 100 40">b</button>
      `,
    })
    const shadow = byId('host').attachShadow({ mode: 'open' })
    shadow.innerHTML = `<input id="inner" data-rect="120 0 100 40" />`
    const inner = shadow.getElementById('inner') as HTMLInputElement
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(shadow.activeElement).toBe(inner)

    inner.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    )
    expect(document.activeElement).toBe(byId('b'))
  })

  test('navigates between elements slotted into a shadow modal', () => {
    setup({
      html: `
        <button data-rect="0 300 100 40">behind</button>
        <div id="host">
          <button id="a" data-rect="0 0 100 40">a</button>
          <button id="b" data-rect="0 60 100 40">b</button>
        </div>
      `,
    })
    byId('host').attachShadow({ mode: 'open' }).innerHTML = `
      <div role="dialog" aria-modal="true"><slot></slot></div>
    `
    byId('a').focus()

    // happy-dom lacks assignedSlot, staying inside the modal is checked in the browser
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('b'))
  })

  test('entering a scope respects custom strategy exclusions', () => {
    setup({
      html: `
        <button class="skip-me" data-rect="0 0 100 40">skipped</button>
        <button id="b" data-rect="0 60 100 40">b</button>
      `,
      options: {
        strategy: ({ origin, candidates, direction }) =>
          spatial({
            origin,
            direction,
            candidates: candidates.filter(
              ({ element }) => !element.matches('.skip-me'),
            ),
          }),
      },
    })

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('b'))
  })

  test('entering a focusable container respects custom strategy exclusions', () => {
    setup({
      html: `
        <div id="card" tabindex="0" data-rect="0 0 300 100">
          <button class="skip-me" data-rect="0 0 100 40">skipped</button>
          <button id="b" data-rect="120 0 100 40">b</button>
        </div>
      `,
      options: {
        strategy: ({ origin, candidates, direction }) =>
          spatial({
            origin,
            direction,
            candidates: candidates.filter(
              ({ element }) => !element.matches('.skip-me'),
            ),
          }),
      },
    })
    byId('card').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('b'))
  })

  test('finds elements in the shadow root of a slotted component', () => {
    setup({
      html: `
        <button data-rect="0 300 100 40">behind</button>
        <div id="host"><div id="slotted"></div></div>
      `,
    })
    byId('host').attachShadow({ mode: 'open' }).innerHTML = `
      <div role="dialog" aria-modal="true"><slot></slot></div>
    `
    const shadow = byId('slotted').attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <button id="a" data-rect="0 0 100 40">a</button>
      <button id="b" data-rect="0 60 100 40">b</button>
    `
    ;(shadow.getElementById('a') as HTMLElement).focus()

    press({ key: 'ArrowDown' })
    expect(shadow.activeElement).toBe(shadow.getElementById('b'))
  })

  test('cleanup removes the listener', () => {
    setup({
      html: `
        <button id="a" data-rect="0 0 100 40">a</button>
        <button id="b" data-rect="120 0 100 40">b</button>
      `,
    })
    cleanup()
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('a'))
  })
})

describe('text fields', () => {
  const html = `
    <input id="input" value="hello" data-rect="0 0 100 40" />
    <textarea id="textarea" data-rect="120 0 100 40">first\nsecond</textarea>
    <button id="right" data-rect="240 0 100 40">right</button>
    <button id="below" data-rect="120 60 100 40">below</button>
  `

  test('moves the caret until it reaches the edge', () => {
    setup({ html })
    const input = byId('input') as HTMLInputElement
    input.focus()

    input.setSelectionRange(2, 2)
    expect(press({ key: 'ArrowRight' }).defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(input)

    input.setSelectionRange(5, 5)
    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('textarea'))
  })

  test('textareas only leave at the first / last line', () => {
    setup({ html })
    const textarea = byId('textarea') as HTMLTextAreaElement
    textarea.focus()

    textarea.setSelectionRange(2, 2)
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(textarea)

    textarea.setSelectionRange(8, 8)
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('below'))
  })
})

describe('contenteditable', () => {
  const placeCaret = ({ node, offset }: { node: Node; offset: number }) => {
    const range = document.createRange()
    range.setStart(node, offset)
    range.collapse(true)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  }

  test('preserved whitespace counts as content', () => {
    setup({
      html: `
        <div id="editor" contenteditable="true" style="white-space: pre-wrap" data-rect="0 0 100 40">abc </div>
        <button data-rect="120 0 100 40">right</button>
      `,
    })
    const editor = byId('editor')
    editor.focus()
    placeCaret({ node: editor.firstChild!, offset: 3 })

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(editor)
  })

  test('collapsed whitespace is ignored', () => {
    setup({
      html: `
        <div id="editor" contenteditable="true" data-rect="0 0 100 40">abc </div>
        <button id="right" data-rect="120 0 100 40">right</button>
      `,
    })
    const editor = byId('editor')
    editor.focus()
    placeCaret({ node: editor.firstChild!, offset: 3 })

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('right'))
  })
})

describe('opting out', () => {
  test('data-arrowtab disables single directions', () => {
    setup({
      html: `
        <div data-arrowtab="disable-right">
          <button id="a" data-rect="0 0 100 40">a</button>
        </div>
        <button id="b" data-rect="120 0 100 40">b</button>
        <button id="c" data-rect="0 60 100 40">c</button>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('a'))
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('c'))
  })

  test('data-arrowtab on the body applies without focus', () => {
    setup({
      html: `<button id="a" data-rect="0 0 100 40">a</button>`,
    })
    document.body.setAttribute('data-arrowtab', 'disable-down')

    const event = press({ key: 'ArrowDown' })
    document.body.removeAttribute('data-arrowtab')

    expect(event.defaultPrevented).toBe(false)
    expect(document.activeElement).not.toBe(byId('a'))
  })

  test('ARIA widgets keep their own arrow keys', () => {
    setup({
      html: `
        <div role="tablist">
          <button id="tab" role="tab" data-rect="0 0 100 40">tab</button>
          <button role="tab" tabindex="-1" data-rect="120 0 100 40">tab 2</button>
        </div>
        <button id="below" data-rect="0 60 100 40">below</button>
      `,
    })
    byId('tab').focus()

    expect(press({ key: 'ArrowRight' }).defaultPrevented).toBe(false)
    expect(document.activeElement).toBe(byId('tab'))
    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('below'))
  })

  test('open comboboxes keep up / down', () => {
    setup({
      html: `
        <input id="combobox" role="combobox" aria-expanded="true" data-rect="0 0 100 40" />
        <button data-rect="0 60 100 40">below</button>
      `,
    })
    byId('combobox').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('combobox'))
  })

  test('data-arrowtab="enable" overrides widget detection', () => {
    setup({
      html: `
        <div role="toolbar" data-arrowtab="enable">
          <button id="a" data-rect="0 0 100 40">a</button>
          <button id="b" data-rect="120 0 100 40">b</button>
        </div>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('b'))
  })
})

describe('scopes', () => {
  test('navigation stays inside an open modal', () => {
    setup({
      html: `
        <button id="behind" data-rect="0 100 100 40">behind</button>
        <div role="dialog" aria-modal="true">
          <button id="a" data-rect="0 0 100 40">a</button>
        </div>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('a'))
  })

  test('navigation stays inside a non-modal dialog', () => {
    setup({
      html: `
        <button id="behind" data-rect="0 100 100 40">behind</button>
        <div role="dialog">
          <button id="a" data-rect="0 0 100 40">a</button>
        </div>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('a'))
  })

  test('focus behind a modal jumps into the modal', () => {
    setup({
      html: `
        <button id="behind" data-rect="0 0 100 40">behind</button>
        <div role="dialog" aria-modal="true">
          <button id="a" data-rect="0 300 100 40">a</button>
          <button id="b" data-rect="0 360 100 40">b</button>
        </div>
      `,
    })
    byId('behind').focus()

    press({ key: 'ArrowUp' })
    expect(document.activeElement).toBe(byId('a'))
  })

  test('data-arrowtab="wrap" jumps to the opposite edge', () => {
    setup({
      html: `
        <div data-arrowtab="wrap">
          <button id="a" data-rect="0 0 100 40">a</button>
          <button id="b" data-rect="120 0 100 40">b</button>
          <button id="c" data-rect="0 60 100 40">c</button>
          <button id="d" data-rect="120 60 100 40">d</button>
        </div>
        <button data-rect="0 120 100 40">outside</button>
      `,
    })
    byId('d').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('b'))
    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('a'))
  })

  test('a modal wins over the scope focus is in', () => {
    setup({
      html: `
        <div data-arrowtab="scope">
          <button id="behind" data-rect="0 0 100 40">behind</button>
          <button data-rect="0 60 100 40">behind 2</button>
        </div>
        <div role="dialog" aria-modal="true">
          <button id="a" data-rect="0 300 100 40">a</button>
        </div>
      `,
    })
    byId('behind').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('a'))
  })

  test('finds modals inside shadow roots', () => {
    setup({
      html: `
        <button id="behind" data-rect="0 0 100 40">behind</button>
        <button data-rect="0 60 100 40">behind 2</button>
        <div id="host"></div>
      `,
    })
    const shadow = byId('host').attachShadow({ mode: 'open' })
    shadow.innerHTML = `
      <div role="dialog" aria-modal="true">
        <button id="inner" data-rect="0 300 100 40">inner</button>
      </div>
    `
    byId('behind').focus()

    press({ key: 'ArrowDown' })
    expect(shadow.activeElement).toBe(shadow.getElementById('inner'))
  })

  test("text fields behind a modal don't keep the arrow keys", () => {
    setup({
      html: `
        <input id="behind" value="hello" data-rect="0 0 100 40" />
        <div role="dialog" aria-modal="true">
          <button id="a" data-rect="0 300 100 40">a</button>
        </div>
      `,
    })
    const input = byId('behind') as HTMLInputElement
    input.focus()
    input.setSelectionRange(2, 2)

    press({ key: 'ArrowRight' })
    expect(document.activeElement).toBe(byId('a'))
  })

  test('data-arrowtab="scope" keeps focus inside', () => {
    setup({
      html: `
        <div data-arrowtab="scope">
          <button id="a" data-rect="0 0 100 40">a</button>
        </div>
        <button data-rect="0 60 100 40">outside</button>
      `,
    })
    byId('a').focus()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('a'))
  })
})

describe('focus recovery', () => {
  test('navigates from the last position if the focused element was removed', () => {
    setup({
      html: `
        <button id="top" data-rect="0 0 100 40">top</button>
        <button id="removed" data-rect="0 100 100 40">removed</button>
        <button id="bottom" data-rect="0 200 100 40">bottom</button>
      `,
    })
    byId('removed').focus()
    byId('removed').remove()
    ;(document.activeElement as HTMLElement | null)?.blur()

    press({ key: 'ArrowDown' })
    expect(document.activeElement).toBe(byId('bottom'))
  })

  test('autoDetectHistory refocuses the opener when a dialog closes', async () => {
    setup({
      html: `<button id="opener" data-rect="0 0 100 40">open</button>`,
      options: { autoDetectHistory: true },
    })
    byId('opener').focus()

    const portal = document.createElement('div')
    portal.innerHTML = `
      <div role="dialog">
        <button id="inside" data-rect="0 100 100 40">inside</button>
      </div>
    `
    document.body.append(portal)
    byId('inside').focus()
    await nextTick()

    portal.remove()
    ;(document.activeElement as HTMLElement | null)?.blur()
    await nextTick()

    expect(document.activeElement).toBe(byId('opener'))
  })

  test('autoDetectHistory leaves focus alone if the dialog restored it', async () => {
    setup({
      html: `
        <button id="opener" data-rect="0 0 100 40">open</button>
        <button id="other" data-rect="0 60 100 40">other</button>
      `,
      options: { autoDetectHistory: true },
    })
    byId('opener').focus()

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.innerHTML = `<button id="inside" data-rect="0 100 100 40">inside</button>`
    document.body.append(dialog)
    byId('inside').focus()
    await nextTick()

    dialog.remove()
    byId('other').focus()
    await nextTick()

    expect(document.activeElement).toBe(byId('other'))
  })
})
