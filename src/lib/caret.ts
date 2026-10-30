import { isVertical, type Direction } from './directions.js'

const canMoveCaretInField = ({
  field,
  direction,
}: {
  field: HTMLInputElement | HTMLTextAreaElement
  direction: Direction
}) => {
  const { selectionStart: start, selectionEnd: end, value } = field
  // Some input types (e.g. number, email) don't expose the caret position
  if (start === null || end === null) return false
  const hasSelection = start !== end
  const isTextarea = field instanceof HTMLTextAreaElement

  switch (direction) {
    case 'left':
      return hasSelection || start > 0
    case 'right':
      return hasSelection || end < value.length
    // Only checks line breaks, soft wrapped lines are not detected
    case 'up':
      return (
        isTextarea && start > 0 && value.lastIndexOf('\n', start - 1) !== -1
      )
    case 'down':
      return isTextarea && value.indexOf('\n', end) !== -1
  }
}

const canMoveCaretInContentEditable = ({
  element,
  direction,
}: {
  element: HTMLElement
  direction: Direction
}) => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  const vertical = isVertical({ direction })
  if (!range.collapsed && !vertical) return true

  // Content between the caret and the start / end of the element
  const isBackward = direction === 'left' || direction === 'up'
  const rest = document.createRange()
  rest.selectNodeContents(element)
  if (isBackward) {
    rest.setEnd(range.startContainer, range.startOffset)
  } else {
    rest.setStart(range.endContainer, range.endOffset)
  }
  // Whitespace from the HTML source isn't visible
  const hasText = rest.toString().trim().length > 0
  if (!vertical) return hasText

  // Up / down leave once the rest of the content is on the caret's line
  const caret = range.cloneRange()
  caret.collapse(isBackward)
  const caretRect = caret.getBoundingClientRect()
  if (caretRect.height === 0) return hasText
  const caretCenter = caretRect.top + caretRect.height / 2
  return Array.from(rest.getClientRects()).some(
    (rect) =>
      rect.width > 0 && (rect.bottom < caretCenter || rect.top > caretCenter),
  )
}

// Whether the arrow key should move the caret inside the active element instead of moving focus
export const canMoveCaret = ({
  activeElement,
  direction,
}: {
  activeElement: HTMLElement
  direction: Direction
}) => {
  if (
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement
  ) {
    return canMoveCaretInField({ field: activeElement, direction })
  }
  if (activeElement.isContentEditable) {
    return canMoveCaretInContentEditable({ element: activeElement, direction })
  }
  return false
}
