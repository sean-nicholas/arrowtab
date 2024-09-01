import { getEuclideanDistance } from './distances.js'
import { getAngle } from './getAngle.js'
import { getXyDistance } from './getXyDistance.js'

const getIsWithinXWalk = ({
  angle,
  event,
}: {
  angle: number
  event: KeyboardEvent
}) => {
  if (event.key === 'ArrowDown' && (angle >= 315 || angle <= 45)) {
    return true
  }

  if (event.key === 'ArrowLeft' && angle > 45 && angle < 135) {
    return true
  }

  if (event.key === 'ArrowUp' && angle >= 135 && angle <= 225) {
    return true
  }

  if (event.key === 'ArrowRight' && angle > 225 && angle < 315) {
    return true
  }

  return false
}

type StrategyItem = {
  element: Element
  withinReach: boolean
}

type Strategy = (options: {
  event: KeyboardEvent
  focusableElements: Element[]
  activeElement: Element
}) => StrategyItem[]

export const getByXWalkEuclidean: Strategy = ({
  focusableElements,
  activeElement,
  event,
}) => {
  const withData = focusableElements.map((element) => {
    const distances = getXyDistance({ activeElement, element })
    const distance = getEuclideanDistance(distances)
    const angle = getAngle({ activeElement, element })
    const withinReach = getIsWithinXWalk({ angle, event })

    return {
      element,
      distance,
      withinReach,
    }
  })

  const reversed = [...withData].reverse() // Prefer down / right if same distance

  const sorted = reversed.sort((a, b) => {
    return a.distance - b.distance
  })

  return sorted
}

export const getByGrid: Strategy = ({
  focusableElements,
  activeElement,
  event,
}) => {
  let items: (StrategyItem & {
    primaryDistance: number
    secondaryDistance: number
    anyOtherItemWithinReach?: boolean
    isParentOfActiveElement?: boolean
  })[] = focusableElements
    .map((element) => {
      const distances = getXyDistance({ activeElement, element })
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        return {
          element,
          primaryDistance: Math.abs(distances.yDistance),
          secondaryDistance: Math.abs(distances.xDistance),
          withinReach:
            event.key === 'ArrowDown'
              ? distances.yDistance > 0
              : distances.yDistance < 0,
        }
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // TODO: Maybe not only exact matches. Maybe height of element + x% is search space. If it hits only top/left or bottom/right, then it's within reach.
        const correctDirection =
          event.key === 'ArrowRight'
            ? distances.xDistance > 0
            : distances.xDistance < 0
        const isSameYAsActiveElement = distances.yDistance === 0
        return {
          element,
          primaryDistance: Math.abs(distances.xDistance),
          secondaryDistance: 0,
          withinReach: correctDirection && isSameYAsActiveElement,
        }
      }

      return {
        element,
        primaryDistance: Infinity,
        secondaryDistance: Infinity,
        withinReach: false,
      }
    })
    .map((item) => {
      return {
        ...item,
        isParentOfActiveElement: item.element.contains(activeElement),
      }
    })

  items = items.map((item) => {
    // Filter out items that are the parent of the active element.
    // If the parent is focusable then weird things can happen. It is possible to select the parent while going right.

    if (!item.isParentOfActiveElement) {
      return item
    }

    const anyOtherItemWithinReach = items.some((other) => {
      if (other === item) return false
      if (other.isParentOfActiveElement) return false
      if (!other.withinReach) return false
      return true
    })

    if (!anyOtherItemWithinReach) {
      return {
        ...item,
        anyOtherItemWithinReach,
      }
    }

    // if there is another item within reach, then the parent is not focusable
    return {
      ...item,
      withinReach: false,
      anyOtherItemWithinReach,
    }
  })

  const minPrimaryDistance = Math.min(
    ...items.map((item) => {
      if (!item.withinReach) {
        return Infinity
      }
      return item.primaryDistance
    }),
  )

  const sorted = items.sort((a, b) => {
    if (
      a.primaryDistance === minPrimaryDistance &&
      b.primaryDistance === minPrimaryDistance
    ) {
      return a.secondaryDistance - b.secondaryDistance
    }

    return a.primaryDistance - b.primaryDistance
  })

  return sorted
}
