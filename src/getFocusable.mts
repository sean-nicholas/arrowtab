export const getFocusable = () => {
  // Selectors from https://zellwk.com/blog/keyboard-focusable-elements/
  const allFocusable = document.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex^="-"])',
  )
  const focusable = Array.from(allFocusable).filter((element) => {
    if ('disabled' in element && element.disabled) return false
    if ('hidden' in element && element.hidden) return false
    if (element.getAttribute('aria-hidden') === 'true') return false
    return true
  })
  return focusable
}
