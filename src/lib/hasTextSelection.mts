import { sumBy } from './sumBy.mjs'

export const hasTextSelection = ({
  activeElement,
  event,
}: {
  activeElement: Element
  event: KeyboardEvent
}) => {
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    const selectionStart = activeElement.selectionStart
    const selectionEnd = activeElement.selectionEnd

    if (
      event.key === 'ArrowLeft' &&
      selectionStart !== undefined &&
      selectionStart !== null &&
      selectionStart !== 0
    ) {
      return true
    }

    if (
      event.key === 'ArrowRight' &&
      selectionStart !== undefined &&
      selectionStart !== null &&
      selectionStart !== activeElement.value?.length
    ) {
      return true
    }

    if (
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
      selectionStart !== undefined &&
      selectionEnd !== undefined &&
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionStart !== selectionEnd
    ) {
      return true
    }

    if (
      event.key === 'ArrowUp' &&
      selectionStart !== undefined &&
      selectionStart !== null &&
      activeElement instanceof HTMLTextAreaElement
    ) {
      const rows = activeElement.value?.split('\n')
      const start = selectionStart
      const firstRow = rows.at(0)
      if (firstRow && start > firstRow.length) {
        return true
      }
    }

    if (
      event.key === 'ArrowDown' &&
      selectionStart !== undefined &&
      selectionStart !== null &&
      activeElement instanceof HTMLTextAreaElement
    ) {
      const rows = activeElement.value?.split('\n')
      const withoutLastRow = rows.slice(0, -1)
      const lengthUntilLastRow = sumBy(withoutLastRow, (row) => row.length)

      const start = selectionStart
      if (start <= lengthUntilLastRow + 1) {
        return true
      }
    }
  }

  return false
}
