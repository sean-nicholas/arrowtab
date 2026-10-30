import { isForward, type Direction } from './directions.js'
import type { Rect } from './geometry.js'
import type { Candidate, RankedCandidate, Strategy } from './strategies.js'

export const rankCandidates = ({
  origin,
  candidates,
  direction,
  strategy,
  activeElement,
}: {
  origin: Rect
  candidates: Candidate[]
  direction: Direction
  strategy: Strategy
  activeElement: HTMLElement | null
}): RankedCandidate[] => {
  const ranked = strategy({ origin, candidates, direction })
  if (!activeElement) return ranked

  // Down / right enter a focusable container (e.g. a card with tabindex) at its first focusable child
  const firstChild = isForward({ direction })
    ? candidates.find(({ element }) => activeElement.contains(element))
    : undefined
  if (firstChild) {
    return [
      { ...firstChild, withinReach: true },
      ...ranked.filter(({ element }) => element !== firstChild.element),
    ]
  }

  // A focusable ancestor is only a target if nothing else is within reach.
  // Otherwise moving right inside a focusable container could select the container itself.
  const isAncestor = ({ element }: Candidate) => element.contains(activeElement)
  const anyOtherWithinReach = ranked.some(
    (item) => item.withinReach && !isAncestor(item),
  )
  if (!anyOtherWithinReach) return ranked

  return ranked.map((item) =>
    isAncestor(item) ? { ...item, withinReach: false } : item,
  )
}
