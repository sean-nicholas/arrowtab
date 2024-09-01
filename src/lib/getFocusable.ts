export const getFocusable = () => {
  // Selectors from https://zellwk.com/blog/keyboard-focusable-elements/
  const allFocusable = document.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex^="-"])',
  )
  const focusable = Array.from(allFocusable).filter((element) => {
    if ('disabled' in element && element.disabled) return false

    let currentElement: Element | null = element
    while (currentElement) {
      if ('hidden' in currentElement && currentElement.hidden) return false
      if (currentElement.getAttribute('aria-hidden') === 'true') return false

      const style = window.getComputedStyle(currentElement)
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return false
      }

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
