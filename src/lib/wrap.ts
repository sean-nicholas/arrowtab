import { isVertical, type Direction } from './directions.js'
import type { Rect } from './geometry.js'
import type { Candidate } from './strategies.js'

/**
 * Moves the origin in front of all candidates, so ranking from it in the same direction
 * finds the element at the opposite edge, preferably in the same row / column.
 */
export const getWrapOrigin = ({
  origin,
  candidates,
  direction,
}: {
  origin: Rect
  candidates: Candidate[]
  direction: Direction
}): Rect => {
  const height = origin.bottom - origin.top
  const width = origin.right - origin.left
  const rects = candidates.map(({ rect }) => rect)

  if (isVertical({ direction })) {
    const top =
      direction === 'down'
        ? Math.min(...rects.map((rect) => rect.top)) - height - 1
        : Math.max(...rects.map((rect) => rect.bottom)) + 1
    return { ...origin, top, bottom: top + height }
  }

  const left =
    direction === 'right'
      ? Math.min(...rects.map((rect) => rect.left)) - width - 1
      : Math.max(...rects.map((rect) => rect.right)) + 1
  return { ...origin, left, right: left + width }
}
