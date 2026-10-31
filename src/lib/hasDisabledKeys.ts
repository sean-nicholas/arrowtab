import type { Direction } from './directions.js'
import { closestComposed } from './dom.js'

export const hasDisabledKeys = ({
  element,
  direction,
}: {
  element: Element
  direction: Direction
}) =>
  closestComposed({
    element,
    selector: `[data-arrowtab~="disable"], [data-arrowtab~="disable-${direction}"]`,
  }) !== null
