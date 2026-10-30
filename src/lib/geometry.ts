import { isVertical, type Direction } from './directions.js'

export type Rect = {
  top: number
  right: number
  bottom: number
  left: number
}

type RectPair = { origin: Rect; rect: Rect; direction: Direction }

// Document coordinates, so rects stay comparable after scrolling
export const getRect = ({ element }: { element: Element }): Rect => {
  const { top, right, bottom, left } = element.getBoundingClientRect()
  return {
    top: top + window.scrollY,
    right: right + window.scrollX,
    bottom: bottom + window.scrollY,
    left: left + window.scrollX,
  }
}

export const isEmptyRect = ({ rect }: { rect: Rect }) =>
  rect.right === rect.left && rect.bottom === rect.top

export const getCenter = ({ rect }: { rect: Rect }) => ({
  x: (rect.left + rect.right) / 2,
  y: (rect.top + rect.bottom) / 2,
})

export const getCenterDistance = ({
  origin,
  rect,
}: {
  origin: Rect
  rect: Rect
}) => {
  const a = getCenter({ rect: origin })
  const b = getCenter({ rect })
  return Math.hypot(b.x - a.x, b.y - a.y)
}

// Gap between the origin's leading edge and the rect's near edge. Negative if they overlap.
const getEdgeGap = ({ origin, rect, direction }: RectPair) => {
  const gaps = {
    up: origin.top - rect.bottom,
    down: rect.top - origin.bottom,
    left: origin.left - rect.right,
    right: rect.left - origin.right,
  }
  return gaps[direction]
}

export const getMajorAxisDistance = (params: RectPair) =>
  Math.max(0, getEdgeGap(params))

export const getMajorAxisDistanceToFarEdge = ({
  origin,
  rect,
  direction,
}: RectPair) => {
  const distances = {
    up: origin.top - rect.top,
    down: rect.bottom - origin.bottom,
    left: origin.left - rect.left,
    right: rect.right - origin.right,
  }
  return Math.max(1, distances[direction])
}

// Offset of the centers perpendicular to the navigation direction
export const getMinorAxisDistance = ({ origin, rect, direction }: RectPair) => {
  const a = getCenter({ rect: origin })
  const b = getCenter({ rect })
  return isVertical({ direction }) ? Math.abs(b.x - a.x) : Math.abs(b.y - a.y)
}

// The rect overlaps the origin extended in navigation direction, e.g. it is in the same row for left / right
export const isInBeam = ({ origin, rect, direction }: RectPair) =>
  isVertical({ direction })
    ? rect.right > origin.left && rect.left < origin.right
    : rect.bottom > origin.top && rect.top < origin.bottom

export const isCompletelyInDirection = (params: RectPair) =>
  getEdgeGap(params) >= 0

// The rect lies in navigation direction. Overlapping rects count if they extend further.
export const isInDirection = ({ origin, rect, direction }: RectPair) => {
  switch (direction) {
    case 'up':
      return (
        (origin.bottom > rect.bottom || origin.top >= rect.bottom) &&
        origin.top > rect.top
      )
    case 'down':
      return (
        (origin.top < rect.top || origin.bottom <= rect.top) &&
        origin.bottom < rect.bottom
      )
    case 'left':
      return (
        (origin.right > rect.right || origin.left >= rect.right) &&
        origin.left > rect.left
      )
    case 'right':
      return (
        (origin.left < rect.left || origin.right <= rect.left) &&
        origin.right < rect.right
      )
  }
}
