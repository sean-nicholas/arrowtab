const inputTypesWithAllowedNativeArrowKeyPresses: Record<string, string[]> = {
  text: ['ArrowLeft', 'ArrowRight'],
  date: ['ArrowLeft', 'ArrowRight'],
  time: ['ArrowLeft', 'ArrowRight'],
  datetime: ['ArrowLeft', 'ArrowRight'],
  'datetime-local': ['ArrowLeft', 'ArrowRight'],
  month: ['ArrowLeft', 'ArrowRight'],
  week: ['ArrowLeft', 'ArrowRight'],
  number: ['ArrowLeft', 'ArrowRight'],
}

export const preventNativeArrowKeyPresses = ({
  event,
  activeElement,
}: {
  event: KeyboardEvent
  activeElement: Element
}) => {
  if (activeElement instanceof HTMLInputElement) {
    const inputType = activeElement.type
    const allowedKeys = inputTypesWithAllowedNativeArrowKeyPresses[inputType]
    if (allowedKeys && allowedKeys.includes(event.key)) {
      return
    }
  }

  if (activeElement instanceof HTMLTextAreaElement) {
    return
  }

  event.preventDefault()
}
