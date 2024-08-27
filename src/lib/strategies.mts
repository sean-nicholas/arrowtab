import { getAngle } from './getAngle.mjs'
import { getXyDistance } from './getXyDistance.mjs'

type StrategyInput = {
  event: KeyboardEvent
  xDistance: number
  yDistance: number
  element: Element
  angle: number
  position: { x: number; y: number }
}

const distanceMetrics = {
  euclidean: ({
    xDistance,
    yDistance,
  }: {
    xDistance: number
    yDistance: number
  }) => {
    return Math.sqrt(xDistance ** 2 + yDistance ** 2)
  },
  manhattan: ({ xDistance, yDistance }: StrategyInput) => {
    return Math.abs(xDistance) + Math.abs(yDistance)
  },
  manhattanWeighted: ({ xDistance, yDistance, event }: StrategyInput) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      return Math.abs(xDistance) + Math.abs(yDistance) * 0.1
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      return Math.abs(xDistance) * 0.1 + Math.abs(yDistance)
    }
  },
}

const xWalk = ({ angle, event }: { angle: number; event: KeyboardEvent }) => {
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
    const distance = distanceMetrics.euclidean(distances)
    const angle = getAngle({ activeElement, element })
    const withinReach = xWalk({ angle, event })

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
