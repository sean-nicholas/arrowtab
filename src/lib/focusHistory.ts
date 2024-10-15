const focusHistory: HTMLElement[] = []
let lastFocusedElement: HTMLElement | undefined

export const setLastFocusedElement = ({ element }: { element: Element }) => {
  if (!(element instanceof HTMLElement)) {
    return
  }
  lastFocusedElement = element
}

export const pushIntoHistory = ({
  element,
}: {
  element?: HTMLElement
} = {}) => {
  const elementToAdd = element ?? lastFocusedElement
  if (elementToAdd) {
    focusHistory.push(elementToAdd)
  }
}

export const focusPrevious = () => {
  const lastHistoryElement = focusHistory.pop()
  if (lastHistoryElement) {
    lastHistoryElement.focus()
  }
}
