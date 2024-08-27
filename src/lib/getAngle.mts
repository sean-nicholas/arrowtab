import { getXyDistance } from './getXyDistance.mjs'

export const getAngle = ({
  activeElement,
  element,
}: {
  activeElement: Element
  element: Element
}) => {
  const { xDistance, yDistance } = getXyDistance({
    activeElement,
    element,
  })

  let angle =
    Math.acos(yDistance / Math.sqrt(xDistance ** 2 + yDistance ** 2)) *
    (180 / Math.PI)
  const direction = xDistance > 0 ? 'right' : 'left'
  if (direction === 'right') {
    angle = 360 - angle
  }

  return angle
}
