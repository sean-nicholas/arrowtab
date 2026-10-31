import { isForward, isVertical, type Direction } from './directions.js'
import {
  getCenter,
  getCenterDistance,
  getMajorAxisDistance,
  getMajorAxisDistanceToFarEdge,
  getMinorAxisDistance,
  isCompletelyInDirection,
  isInBeam,
  isInDirection,
  type Rect,
} from './geometry.js'

export type Candidate = {
  element: HTMLElement
  rect: Rect
}

export type RankedCandidate = Candidate & {
  withinReach: boolean
}

// Returns all candidates, nearest first. The first one within reach gets focused.
export type Strategy = (params: {
  origin: Rect
  candidates: Candidate[]
  direction: Direction
}) => RankedCandidate[]

type Comparison = { origin: Rect; a: Rect; b: Rect; direction: Direction }

// A candidate in the beam wins, unless (for up / down) the other one lies completely in front of it
const beamBeats = ({ origin, a, b, direction }: Comparison) => {
  const aInBeam = isInBeam({ origin, rect: a, direction })
  const bInBeam = isInBeam({ origin, rect: b, direction })
  if (bInBeam || !aInBeam) return false
  if (!isCompletelyInDirection({ origin, rect: b, direction })) return true
  if (!isVertical({ direction })) return true
  return (
    getMajorAxisDistance({ origin, rect: a, direction }) <
    getMajorAxisDistanceToFarEdge({ origin, rect: b, direction })
  )
}

// Distance in navigation direction weighs more than the offset to the side
const getWeightedDistance = (params: {
  origin: Rect
  rect: Rect
  direction: Direction
}) => 13 * getMajorAxisDistance(params) ** 2 + getMinorAxisDistance(params) ** 2

const compareSpatial = ({ origin, a, b, direction }: Comparison) => {
  if (beamBeats({ origin, a, b, direction })) return -1
  if (beamBeats({ origin, a: b, b: a, direction })) return 1
  return (
    getWeightedDistance({ origin, rect: a, direction }) -
    getWeightedDistance({ origin, rect: b, direction })
  )
}

const byCenterDistance =
  ({ origin }: { origin: Rect }) =>
  (a: Candidate, b: Candidate) =>
    getCenterDistance({ origin, rect: a.rect }) -
    getCenterDistance({ origin, rect: b.rect })

/**
 * Edge based spatial navigation, as used by Android's FocusFinder.
 * Prefers elements in the same row / column and handles elements of different sizes.
 */
export const spatial: Strategy = ({ origin, candidates, direction }) => {
  const inDirection = candidates.filter(({ rect }) =>
    isInDirection({ origin, rect, direction }),
  )
  const others = candidates.filter((item) => !inDirection.includes(item))

  return [
    ...inDirection
      .sort((a, b) =>
        compareSpatial({ origin, a: a.rect, b: b.rect, direction }),
      )
      .map((item) => ({ ...item, withinReach: true })),
    ...others
      .sort(byCenterDistance({ origin }))
      .map((item) => ({ ...item, withinReach: false })),
  ]
}

/**
 * Center based navigation. Up / down jump to the nearest row, left / right stay in the current row.
 */
export const grid: Strategy = ({ origin, candidates, direction }) => {
  const originCenter = getCenter({ rect: origin })
  const vertical = isVertical({ direction })
  const sign = isForward({ direction }) ? 1 : -1

  const items = candidates.map((candidate) => {
    const center = getCenter({ rect: candidate.rect })
    const xDistance = center.x - originCenter.x
    const yDistance = center.y - originCenter.y
    const primaryDistance = vertical ? yDistance : xDistance

    return {
      ...candidate,
      primaryDistance: Math.abs(primaryDistance),
      secondaryDistance: Math.abs(vertical ? xDistance : yDistance),
      withinReach:
        primaryDistance * sign > 0 &&
        (vertical || isInBeam({ origin, rect: candidate.rect, direction })),
    }
  })

  const minPrimaryDistance = Math.min(
    ...items.map((item) =>
      item.withinReach ? item.primaryDistance : Infinity,
    ),
  )

  return items
    .sort((a, b) => {
      if (a.withinReach !== b.withinReach) return a.withinReach ? -1 : 1
      if (
        a.primaryDistance === minPrimaryDistance &&
        b.primaryDistance === minPrimaryDistance
      ) {
        return a.secondaryDistance - b.secondaryDistance
      }
      return a.primaryDistance - b.primaryDistance
    })
    .map(({ element, rect, withinReach }) => ({ element, rect, withinReach }))
}
