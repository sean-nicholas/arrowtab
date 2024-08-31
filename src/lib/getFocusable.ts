export const getFocusable = () => {
  // Selectors from https://zellwk.com/blog/keyboard-focusable-elements/
  const allFocusable = document.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex^="-"])',
  )
  const focusable = Array.from(allFocusable).filter((element) => {
    if ('disabled' in element && element.disabled) return false
    if ('hidden' in element && element.hidden) return false
    if (element.getAttribute('aria-hidden') === 'true') return false

    // Filter out non-visible elements
    const style = window.getComputedStyle(element)
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0'
    ) {
      return false
    }

    // Check if element or any of its ancestors have zero dimensions
    let currentElement: Element | null = element
    while (currentElement) {
      const rect = currentElement.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        return false
      }
      currentElement = currentElement.parentElement
    }

    return true
  })
  return focusable
}
