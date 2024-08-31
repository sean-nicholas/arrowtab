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

type Strategy = (options: {
  event: KeyboardEvent
  focusableElements: Element[]
  activeElement: Element
}) => { element: Element; withinReach: boolean }[]

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
  const withData = focusableElements.map((element) => {
    const distances = getXyDistance({ activeElement, element })
    let result = {
      element,
      primaryDistance: Infinity,
      secondaryDistance: Infinity,
      withinReach: false,
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      result = {
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
      result = {
        element,
        primaryDistance: Math.abs(distances.xDistance),
        secondaryDistance: 0,
        withinReach: correctDirection && isSameYAsActiveElement,
      }
    }

    // If the parent is focusable then weird things can happen if you toggle trough the children because
    // this strategy will look at the middle of an element. It is possible to select the parent while going right.
    // Therefore we ignore the parent.
    if (element.contains(activeElement)) {
      result.withinReach = false
    }

    return result
  })

  const minPrimaryDistance = Math.min(
    ...withData.map((item) => {
      if (!item.withinReach) {
        return Infinity
      }
      return item.primaryDistance
    }),
  )

  const sorted = withData.sort((a, b) => {
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
