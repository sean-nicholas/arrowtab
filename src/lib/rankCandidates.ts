import { isForward, type Direction } from './directions.js'
import { containsComposed } from './dom.js'
import type { Rect } from './geometry.js'
import type { Candidate, RankedCandidate, Strategy } from './strategies.js'

const moveToFront = ({
  ranked,
  item,
}: {
  ranked: RankedCandidate[]
  item: Candidate
}): RankedCandidate[] => [
  { ...item, withinReach: true },
  ...ranked.filter(({ element }) => element !== item.element),
]

export const rankCandidates = ({
  origin,
  candidates,
  direction,
  strategy,
  activeElement,
  preferred,
}: {
  origin: Rect
  candidates: Candidate[]
  direction: Direction
  strategy: Strategy
  activeElement: HTMLElement | null
  // Wins if it is within reach, e.g. the element focus came from when going back
  preferred?: HTMLElement
}): RankedCandidate[] => {
  const ranked = strategy({ origin, candidates, direction })

  const preferredItem = ranked.find(
    ({ element, withinReach }) => withinReach && element === preferred,
  )
  if (preferredItem) return moveToFront({ ranked, item: preferredItem })

  if (!activeElement) return ranked

  // Down / right enter a focusable container (e.g. a card with tabindex) at its first focusable child
  const firstChild = isForward({ direction })
    ? candidates.find(({ element }) =>
        containsComposed({ container: activeElement, element }),
      )
    : undefined
  if (firstChild) return moveToFront({ ranked, item: firstChild })

  // A focusable ancestor is only a target if nothing else is within reach.
  // Otherwise moving right inside a focusable container could select the container itself.
  const isAncestor = ({ element }: Candidate) =>
    containsComposed({ container: element, element: activeElement })
  const anyOtherWithinReach = ranked.some(
    (item) => item.withinReach && !isAncestor(item),
  )
  if (!anyOtherWithinReach) return ranked

  return ranked.map((item) =>
    isAncestor(item) ? { ...item, withinReach: false } : item,
  )
}
