let inDebugMode = false

export const activateDebugMode = ({
  focusableElements,
}: {
  focusableElements: { element: Element; withinReach: boolean }[]
}) => {
  inDebugMode = true

  let counter = 1
  let withinReachCounter = 1
  for (const focusable of focusableElements) {
    if (!(focusable.element instanceof HTMLElement)) continue
    const div = document.createElement('div')
    const rect = focusable.element.getBoundingClientRect()
    const scrollX = document.documentElement.scrollLeft
    const scrollY = document.documentElement.scrollTop

    div.style.position = 'absolute'
    div.style.top = `${rect.top + scrollY}px`
    div.style.left = `${rect.left + scrollX}px`
    let width = Math.max(rect.width, 10)
    let height = Math.max(rect.height, 10)
    div.style.width = `${width}px`
    div.style.height = `${height}px`

    const color = focusable.withinReach
      ? 'rgba(76 175 80 / 80%)'
      : 'rgb(244 67 54 / 80%)'
    div.style.color = 'white'
    div.style.backgroundColor = color
    div.style.zIndex = '100000'
    div.style.display = 'flex'
    div.style.alignItems = 'center'
    div.style.justifyContent = 'center'
    div.style.cursor = 'pointer'
    div.style.borderRadius = '4px'

    div.innerHTML = `<div>${counter++} ${
      focusable.withinReach ? `(${withinReachCounter++})` : ''
    }</div>`
    div.dataset.arrowtab = 'debug'

    // Move the click event to the focusable element
    div.addEventListener('click', (e) => {
      e.preventDefault()
      console.log({
        focusable,
        rect,
      })
    })

    document.body.appendChild(div)
  }
}

export const deactivateDebugMode = () => {
  document.querySelectorAll('[data-arrowtab="debug"]').forEach((div) => {
    div.remove()
  })
  inDebugMode = false
  return
}

export const isInDebugMode = () => inDebugMode
