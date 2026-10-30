// Helpers that look through open shadow roots, so ArrowTab works with web components

// Parent in the composed tree: the host for elements at the top of a shadow root
export const getComposedParent = ({ element }: { element: Element }) => {
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
    const match: Element | null = current.closest(selector)
    if (match) return match
    const root = current.getRootNode()
    current = root instanceof ShadowRoot ? root.host : null
  }
  return null
}

export const containsComposed = ({
  container,
  element,
}: {
  container: Node
  element: Node
}) => {
  let current: Node | null = element
  while (current) {
    if (container.contains(current)) return true
    const root = current.getRootNode()
    current = root instanceof ShadowRoot ? root.host : null
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

export const querySelectorAllDeep = ({
  root,
  selector,
}: {
  root: ParentNode
  selector: string
}): Element[] => {
  const matches = Array.from(root.querySelectorAll(selector))
  const hosts = Array.from(root.querySelectorAll('*')).filter(
    (element) => element.shadowRoot,
  )
  if (root instanceof Element && root.shadowRoot) hosts.unshift(root)
  return [
    ...matches,
    ...hosts.flatMap((host) =>
      querySelectorAllDeep({ root: host.shadowRoot!, selector }),
    ),
  ]
}
