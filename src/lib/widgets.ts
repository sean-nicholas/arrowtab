import { isVertical, type Direction } from './directions.js'

const horizontal: Direction[] = ['left', 'right']
const vertical: Direction[] = ['up', 'down']
const all: Direction[] = [...horizontal, ...vertical]

// Composite widgets implement their own arrow key navigation: https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
const directionsByRole: Record<string, Direction[]> = {
  grid: all,
  treegrid: all,
  radiogroup: all,
  listbox: vertical,
  menu: vertical,
  tree: vertical,
  menubar: horizontal,
  tablist: horizontal,
  toolbar: horizontal,
}

const directionsByOrientation: Record<string, Direction[]> = {
  horizontal,
  vertical,
}

const widgetSelector = Object.keys(directionsByRole)
  .map((role) => `[role="${role}"]`)
  .join(', ')

const popupTriggerSelector =
  '[role="combobox"][aria-expanded="true"], [aria-haspopup]:not([aria-haspopup="false"])[aria-expanded="true"]'

const getWidgetDirections = ({ widget }: { widget: Element }) => {
  const byRole = directionsByRole[widget.getAttribute('role') ?? ''] ?? []
  if (byRole === all) return all
  return (
    directionsByOrientation[widget.getAttribute('aria-orientation') ?? ''] ??
    byRole
  )
}

// Whether the arrow key belongs to an ARIA widget, e.g. an open combobox, a menu or a tablist
export const isHandledByWidget = ({
  activeElement,
  direction,
}: {
  activeElement: Element
  direction: Direction
}) => {
  if (activeElement.closest('[data-arrowtab~="enable"]')) return false

  if (activeElement.matches(popupTriggerSelector)) {
    return isVertical({ direction })
  }

  const widget = activeElement.closest(widgetSelector)
  return widget ? getWidgetDirections({ widget }).includes(direction) : false
}
