import {
  closestComposed,
  getComposedParent,
  querySelectorAllDeep,
} from './dom.js'
import { getRect, isEmptyRect, type Rect } from './geometry.js'
import type { Candidate } from './strategies.js'

// iframes are left out on purpose: once focused, key events go to the iframe's document and ArrowTab can't navigate back out
const focusableSelector = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'details > summary:first-of-type',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(', ')

const excludedSelector =
  '[inert], [hidden], [aria-hidden="true"], [data-arrowtab~="skip"]'

const arrowOnlySelector = '[data-arrowtab~="arrow-only"]'

export const isVisible = ({ element }: { element: Element }) => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true,
    })
  }

  let current: Element | null = element
  while (current) {
    const style = window.getComputedStyle(current)
    if (style.display === 'none' || style.opacity === '0') return false
    current = getComposedParent({ element: current })
  }
  return window.getComputedStyle(element).visibility !== 'hidden'
}

const isFocusable = ({ element }: { element: Element }) => {
  if (!(element instanceof HTMLElement)) return false
  if (element.matches(':disabled')) return false
  // Negative tabindex is skipped by Tab, so ArrowTab skips it too, unless it is opted in with arrow-only
  if (
    Number(element.getAttribute('tabindex')) < 0 &&
    !closestComposed({ element, selector: arrowOnlySelector })
  ) {
    return false
  }
  // Children of a contenteditable are part of the editor, not separate targets.
  // Controls marked with contenteditable="false" and nested editors with a tabindex are independent and stay.
  if (
    element.isContentEditable &&
    element.parentElement?.isContentEditable &&
    !element.hasAttribute('tabindex')
  ) {
    return false
  }
  if (closestComposed({ element, selector: excludedSelector })) return false
  return isVisible({ element })
}

const clippingOverflows = ['hidden', 'clip']
const scrollingOverflows = ['auto', 'scroll']

type ClipCache = Map<Element, { style: CSSStyleDeclaration; box?: Rect }>

const getCached = ({
  element,
  cache,
}: {
  element: Element
  cache: ClipCache
}) => {
  let entry = cache.get(element)
  if (!entry) {
    entry = { style: window.getComputedStyle(element) }
    cache.set(element, entry)
  }
  return entry
}

// Padding box of the element without scrollbars, in document coordinates
const getClipBox = ({
  element,
  cache,
}: {
  element: Element
  cache: ClipCache
}) => {
  const entry = getCached({ element, cache })
  if (!entry.box) {
    const { top, left } = getRect({ element })
    const boxLeft = left + element.clientLeft
    const boxTop = top + element.clientTop
    entry.box = {
      top: boxTop,
      left: boxLeft,
      right: boxLeft + element.clientWidth,
      bottom: boxTop + element.clientHeight,
    }
  }
  return entry.box
}

const createsContainingBlock = ({ style }: { style: CSSStyleDeclaration }) =>
  style.position !== 'static' ||
  (style.transform !== '' && style.transform !== 'none')

/**
 * Whether the element is completely hidden by an ancestor with `overflow: hidden / clip`, e.g. an inactive carousel slide.
 * Scroll containers don't clip, their content can be scrolled into view anywhere inside of them.
 */
const isClipped = ({
  element,
  rect,
  cache,
}: {
  element: Element
  rect: Rect
  cache: ClipCache
}) => {
  let position = getCached({ element, cache }).style.position
  let current = getComposedParent({ element })
  // Where the element can be once inner scroll containers are scrolled
  let reachable = rect

  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    // Fixed elements are positioned relative to the viewport (ignoring transformed ancestors)
    if (position === 'fixed') return false
    const { style } = getCached({ element: current, cache })

    // Absolute elements are only clipped by their containing block and its ancestors
    if (position !== 'absolute' || createsContainingBlock({ style })) {
      const clipsX = clippingOverflows.includes(style.overflowX)
      const clipsY = clippingOverflows.includes(style.overflowY)
      const scrollsX = scrollingOverflows.includes(style.overflowX)
      const scrollsY = scrollingOverflows.includes(style.overflowY)
      if (clipsX || clipsY || scrollsX || scrollsY) {
        const box = getClipBox({ element: current, cache })
        if (
          clipsX &&
          (reachable.right <= box.left || reachable.left >= box.right)
        ) {
          return true
        }
        if (
          clipsY &&
          (reachable.bottom <= box.top || reachable.top >= box.bottom)
        ) {
          return true
        }
        reachable = {
          left: scrollsX ? box.left : reachable.left,
          right: scrollsX ? box.right : reachable.right,
          top: scrollsY ? box.top : reachable.top,
          bottom: scrollsY ? box.bottom : reachable.bottom,
        }
      }
      position = style.position
    }

    current = getComposedParent({ element: current })
  }
  return false
}

// Checking all candidates is slow on large pages, so only the ones that are about to be focused are checked
export const createClipCheck = () => {
  const cache: ClipCache = new Map()
  return ({ element, rect }: Candidate) => isClipped({ element, rect, cache })
}

export const getFocusable = ({ root }: { root: ParentNode }): Candidate[] =>
  querySelectorAllDeep({ root, selector: focusableSelector })
    .filter((element): element is HTMLElement => isFocusable({ element }))
    .map((element) => ({ element, rect: getRect({ element }) }))
    .filter(({ rect }) => !isEmptyRect({ rect }))
