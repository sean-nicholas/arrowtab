export const getMiddle = (element: Element) => {
  const { x, y, width, height } = element.getBoundingClientRect()
  const scrollX = document.documentElement.scrollLeft
  const scrollY = document.documentElement.scrollTop
  return {
    x: x + width / 2 + scrollX,
    y: y + height / 2 + scrollY,
  }
}

export const getTopLeft = (element: Element) => {
  const { x, y } = element.getBoundingClientRect()
  const scrollX = document.documentElement.scrollLeft
  const scrollY = document.documentElement.scrollTop
  return { x: x + scrollX, y: y + scrollY }
}
