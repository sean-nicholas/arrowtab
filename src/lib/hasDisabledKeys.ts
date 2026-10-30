import type { Direction } from './directions.js'

export const hasDisabledKeys = ({
  activeElement,
  direction,
}: {
  activeElement: Element
  direction: Direction
}) =>
  activeElement.closest(
    `[data-arrowtab~="disable"], [data-arrowtab~="disable-${direction}"]`,
  ) !== null
