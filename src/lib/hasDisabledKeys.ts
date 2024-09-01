export const hasDisabledKeys = ({
  event,
  activeElement,
}: {
  event: KeyboardEvent
  activeElement: Element
}) => {
  const checkElement = (element: Element): boolean => {
    const data = element.getAttribute('data-arrowtab')

    if (data) {
      const keywords = data.split(' ')
      if (keywords.includes('disable')) {
        return true
      }

      const direction = event.key.toLowerCase().replace('arrow', '')
      console.log({ direction, keywords })
      if (keywords.includes(`disable-${direction}`)) {
        return true
      }
    }

    return false
  }

  let currentElement: Element | null = activeElement
  while (currentElement) {
    if (checkElement(currentElement)) {
      return true
    }
    currentElement = currentElement.parentElement
  }

  return false
}
