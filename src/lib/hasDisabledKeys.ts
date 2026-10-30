import type { Direction } from './directions.js'
import { closestComposed } from './dom.js'

export const hasDisabledKeys = ({
  activeElement,
  direction,
}: {
  activeElement: Element
  direction: Direction
}) =>
  closestComposed({
    element: activeElement,
    selector: `[data-arrowtab~="disable"], [data-arrowtab~="disable-${direction}"]`,
  }) !== null
