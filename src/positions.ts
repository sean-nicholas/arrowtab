export const getMiddle = (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect()
  return {
    x: x + width / 2,
    y: y + height / 2,
  }
}

export const getTopLeft = (element: Element) => {
  const { x, y } = element.getBoundingClientRect()
  return { x, y }
}
