import { getMiddle } from './positions.mjs'

export const getXyDistance = ({
  activeElement,
  element,
}: {
  activeElement: Element
  element: Element
}) => {
  const activePosition = getMiddle(activeElement)
  const position = getMiddle(element)

  const xDistance = position.x - activePosition.x
  const yDistance = position.y - activePosition.y

  return {
    xDistance,
    yDistance,
  }
}
