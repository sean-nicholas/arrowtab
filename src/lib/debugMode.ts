let inDebugMode = false

export const activateDebugMode = ({
  focusableElements,
}: {
  focusableElements: { element: Element; withinReach: boolean }[]
}) => {
  inDebugMode = true

  if (document.activeElement) {
    addDebugElementToDom({
      element: document.activeElement,
      withinReach: false,
      content: '',
      color: 'rgb(33 150 243 / 80%)',
    })
  }

  let counter = focusableElements.length
  let withinReachCounter = focusableElements.filter(
    (focusable) => focusable.withinReach,
  ).length
  for (const focusable of [...focusableElements].reverse()) {
    addDebugElementToDom({
      ...focusable,
      content: `<div>${counter--} ${
        focusable.withinReach ? `(${withinReachCounter--})` : ''
      }</div>`,
      color: focusable.withinReach
        ? 'rgba(76 175 80 / 80%)'
        : 'rgb(244 67 54 / 80%)',
    })
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

const addDebugElementToDom = (focusable: {
  element: Element
  withinReach: boolean
  content: string
  color: string
}) => {
  if (!(focusable.element instanceof HTMLElement)) return
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

  div.style.color = 'white'
  div.style.backgroundColor = focusable.color
  div.style.zIndex = '100000'
  div.style.display = 'flex'
  div.style.alignItems = 'center'
  div.style.justifyContent = 'center'
  div.style.cursor = 'pointer'
  div.style.borderRadius = '4px'

  div.innerHTML = focusable.content
  div.dataset.arrowtab = 'debug'

  // Move the click event to the focusable element
  div.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log({
      focusable,
      rect,
      debugElement: div,
    })
  })

  document.body.appendChild(div)
}
