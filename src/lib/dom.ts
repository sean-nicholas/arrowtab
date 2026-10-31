// Helpers that walk the flat tree (open shadow roots and slots), so ArrowTab works with web components

// Parent in the flat tree: the slot for slotted elements, the host for elements at the top of a shadow root
export const getComposedParent = ({ element }: { element: Element }) => {
  if (element.assignedSlot) return element.assignedSlot
  if (element.parentElement) return element.parentElement
  const parent = element.parentNode
  return parent instanceof ShadowRoot ? parent.host : null
}

export const closestComposed = ({
  element,
  selector,
}: {
  element: Element
  selector: string
}) => {
  let current: Element | null = element
  while (current) {
    if (current.matches(selector)) return current
    current = getComposedParent({ element: current })
  }
  return null
}

export const containsComposed = ({
  container,
  element,
}: {
  container: Node
  element: Element
}) => {
  let current: Element | null = element
  while (current) {
    if (current === container) return true
    current = getComposedParent({ element: current })
  }
  return false
}

// document.activeElement is the shadow host if focus is inside a shadow root
export const getDeepActiveElement = () => {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active
}

// Also searches open shadow roots and the elements assigned to their slots
export const querySelectorAllDeep = ({
  root,
  selector,
}: {
  root: ParentNode
  selector: string
}): Element[] => {
  const found = new Set<Element>()
  const visit = ({ node }: { node: ParentNode }) => {
    // The node itself can be a host, e.g. the root or a component assigned to a slot
    if (node instanceof Element && node.shadowRoot) {
      visit({ node: node.shadowRoot })
    }
    for (const element of node.querySelectorAll(selector)) found.add(element)
    for (const slot of node.querySelectorAll('slot')) {
      for (const assigned of slot.assignedElements({ flatten: true })) {
        if (assigned.matches(selector)) found.add(assigned)
        visit({ node: assigned })
      }
    }
    for (const element of node.querySelectorAll('*')) {
      if (element.shadowRoot) visit({ node: element.shadowRoot })
    }
  }
  visit({ node: root })
  return [...found]
}
