type StrategyInput = {
  event: KeyboardEvent
  xDistance: number
  yDistance: number
  element: Element
  angle: number
  position: { x: number; y: number }
}

const withinReachMetrics = {
  XWalk: ({ angle, event }: StrategyInput) => {
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
  },
}

const distanceMetrics = {
  euclidean: ({ xDistance, yDistance }: StrategyInput) => {
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

export const strategy = {
  XWalkEuclidean: {
    withinReachMetric: withinReachMetrics.XWalk,
    distanceMetric: distanceMetrics.euclidean,
  },
  XWalkManhattan: {
    withinReachMetric: withinReachMetrics.XWalk,
    distanceMetric: distanceMetrics.manhattan,
  },
  XWalkManhattanWeighted: {
    withinReachMetric: withinReachMetrics.XWalk,
    distanceMetric: distanceMetrics.manhattanWeighted,
  },
}
