const inputTypesChangingValue = [
  'number',
  'range',
  'radio',
  'date',
  'time',
  'datetime-local',
  'month',
  'week',
]

// Arrow keys change the value of these fields. ArrowTab prevents that even if there is nothing to navigate to.
export const changesValueOnArrowKeys = ({ element }: { element: Element }) =>
  element instanceof HTMLSelectElement ||
  (element instanceof HTMLInputElement &&
    inputTypesChangingValue.includes(element.type))
