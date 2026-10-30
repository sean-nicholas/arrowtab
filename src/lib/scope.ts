import { isVisible } from './focusable.js'

const modalSelector = '[aria-modal="true"], dialog[open]'

const isOpenModal = ({ element }: { element: Element }) => {
  if (!element.matches(modalSelector)) return false
  if (element.tagName === 'DIALOG') {
    // Dialogs opened with show() instead of showModal() don't trap focus
    try {
      return element.matches(':modal')
    } catch {
      return true
    }
  }
  return isVisible({ element })
}

// Arrow keys never leave a dialog, even a non-modal one. It can still be left with Tab.
const scopeSelector = [
  '[data-arrowtab~="scope"]',
  modalSelector,
  'dialog',
  '[role="dialog"]',
  '[role="alertdialog"]',
].join(', ')

/**
 * The element navigation is restricted to:
 * 1. The closest `data-arrowtab="scope"` or dialog around the active element
 * 2. The top most open modal, so focus can't stay behind it
 * 3. The whole document
 */
export const getScope = ({
  activeElement,
}: {
  activeElement: Element | null
}): Element => {
  let current = activeElement
  while (current) {
    if (current.matches(scopeSelector)) return current
    current = current.parentElement
  }

  const openModals = Array.from(
    document.querySelectorAll(modalSelector),
  ).filter((element) => isOpenModal({ element }))
  return openModals.at(-1) ?? document.body
}
