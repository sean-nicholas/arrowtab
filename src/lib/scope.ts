import { containsComposed, getComposedParent } from './dom.js'
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

export const wrapSelector = '[data-arrowtab~="wrap"]'

// Arrow keys never leave a dialog, even a non-modal one. It can still be left with Tab.
const scopeSelector = [
  '[data-arrowtab~="scope"]',
  wrapSelector,
  modalSelector,
  'dialog',
  '[role="dialog"]',
  '[role="alertdialog"]',
].join(', ')

/**
 * The element navigation is restricted to:
 * 1. The closest `data-arrowtab="scope"` or dialog around the active element, unless it is behind an open modal
 * 2. The top most open modal, so focus can't stay behind it
 * 3. The root (the whole document by default)
 */
export const getScope = ({
  activeElement,
  root,
}: {
  activeElement: Element | null
  root: Element
}): Element => {
  const topModal = Array.from(root.querySelectorAll(modalSelector))
    .filter((element) => isOpenModal({ element }))
    .at(-1)

  let current = activeElement
  while (current && current !== root) {
    if (current.matches(scopeSelector)) {
      if (
        !topModal ||
        containsComposed({ container: topModal, element: current })
      ) {
        return current
      }
      break
    }
    current = getComposedParent({ element: current })
  }

  return topModal ?? root
}
