export const getEuclideanDistance = ({
  xDistance,
  yDistance,
}: {
  xDistance: number
  yDistance: number
}) => {
  return Math.sqrt(xDistance ** 2 + yDistance ** 2)
}

export const manhattan = ({
  xDistance,
  yDistance,
}: {
  xDistance: number
  yDistance: number
}) => {
  return Math.abs(xDistance) + Math.abs(yDistance)
}

export const manhattanWeighted = ({
  xDistance,
  yDistance,
  event,
}: {
  xDistance: number
  yDistance: number
  event: KeyboardEvent
}) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    return Math.abs(xDistance) + Math.abs(yDistance) * 0.1
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    return Math.abs(xDistance) * 0.1 + Math.abs(yDistance)
  }
}
