import type { Rect } from './geometry.js'
import type { RankedCandidate } from './strategies.js'

let inDebugMode = false

export const activateDebugMode = ({
  origin,
  items,
}: {
  origin: Rect | undefined
  items: RankedCandidate[]
}) => {
  inDebugMode = true

  if (origin) {
    addDebugElementToDom({
      rect: origin,
      label: '',
      color: 'rgb(33 150 243 / 80%)',
      details: { origin },
    })
  }

  let withinReachCounter = 0
  const labeled = items.map((item, index) => {
    if (item.withinReach) withinReachCounter++
    return {
      item,
      label: `${index + 1} ${item.withinReach ? `(${withinReachCounter})` : ''}`,
    }
  })

  // Nearest elements are added last, so they are on top if they overlap
  for (const { item, label } of labeled.reverse()) {
    addDebugElementToDom({
      rect: item.rect,
      label,
      color: item.withinReach
        ? 'rgba(76 175 80 / 80%)'
        : 'rgb(244 67 54 / 80%)',
      details: { item },
    })
  }
}

export const deactivateDebugMode = () => {
  document.querySelectorAll('[data-arrowtab="debug"]').forEach((div) => {
    div.remove()
  })
  inDebugMode = false
}

export const isInDebugMode = () => inDebugMode

const addDebugElementToDom = ({
  rect,
  label,
  color,
  details,
}: {
  rect: Rect
  label: string
  color: string
  details: object
}) => {
  const div = document.createElement('div')

  div.style.position = 'absolute'
  div.style.top = `${rect.top}px`
  div.style.left = `${rect.left}px`
  div.style.width = `${Math.max(rect.right - rect.left, 10)}px`
  div.style.height = `${Math.max(rect.bottom - rect.top, 10)}px`

  div.style.color = 'white'
  div.style.backgroundColor = color
  div.style.zIndex = '100000'
  div.style.display = 'flex'
  div.style.alignItems = 'center'
  div.style.justifyContent = 'center'
  div.style.cursor = 'pointer'
  div.style.borderRadius = '4px'

  div.textContent = label
  div.dataset.arrowtab = 'debug'

  div.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log({ ...details, rect, debugElement: div })
  })

  document.body.appendChild(div)
}
