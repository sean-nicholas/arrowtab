import { getEuclideanDistance } from './distances.mjs'
import { getAngle } from './getAngle.mjs'
import { getXyDistance } from './getXyDistance.mjs'
import { sumBy } from './sumBy.mjs'

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

export const getByDirection: Strategy = ({
  focusableElements,
  activeElement,
  event,
}) => {
  const withData = focusableElements.map((element) => {
    const distances = getXyDistance({ activeElement, element })
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      return {
        element,
        likelihood: Math.abs(distances.yDistance) * 10_000 + Math.abs(distances.xDistance),
        withinReach:
          event.key === 'ArrowDown'
            ? distances.yDistance > 0
            : distances.yDistance < 0,
      }
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      return {
        element,
        likelihood: Math.abs(distances.xDistance) * 10_000 + Math.abs(distances.yDistance),
        withinReach:
          event.key === 'ArrowRight'
            ? distances.xDistance > 0
            : distances.xDistance < 0,
      }
    }

    return {
      element,
      likelihood: 0,
      withinReach: false,
    }
  })

  const sumLikelihood = sumBy(withData, d => d.likelihood)

  const sorted = withData.sort((a, b) => {
    return (a.likelihood / sumLikelihood) - (b.likelihood / sumLikelihood)
  })

  return sorted
}
