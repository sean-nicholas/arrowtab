import { getRect, isEmptyRect } from './geometry.js'
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
    current = current.parentElement
  }
  return window.getComputedStyle(element).visibility !== 'hidden'
}

const isFocusable = ({ element }: { element: Element }) => {
  if (!(element instanceof HTMLElement)) return false
  if (element.matches(':disabled')) return false
  // Negative tabindex is skipped by Tab, so ArrowTab skips it too
  if (Number(element.getAttribute('tabindex')) < 0) return false
  // Children of a contenteditable are part of the editor, not separate targets
  if (element.parentElement?.isContentEditable) return false
  if (element.closest('[inert], [hidden], [aria-hidden="true"]')) return false
  return isVisible({ element })
}

export const getFocusable = ({ root }: { root: ParentNode }): Candidate[] =>
  Array.from(root.querySelectorAll(focusableSelector))
    .filter((element): element is HTMLElement => isFocusable({ element }))
    .map((element) => ({ element, rect: getRect({ element }) }))
    .filter(({ rect }) => !isEmptyRect({ rect }))
