// TODO: Options
// modifierKey: 'ctrlKey',
// onlyWithModifierKey: false, // TODO: Better name
// strategy: arrowTab.XWalkEuclidean,
// selector: undefined,
// elementFilter: () => boolean,
// getElementPosition: (element) => { x: number, y: number },
// eventTriggerName: 'keydown' | 'keyup',
// earlyReturn: (event) => boolean, // TODO: Better name

// TODO: Check if tab focuses the same elements as arrowTab
// TODO: select, details, summary, iframe
// TODO: Investigate links that don't show focus outline sometimes

import { getFocusable } from './lib/getFocusable.mjs'
import { hasTextSelection } from './lib/hasTextSelection.mjs'
import { preventNativeArrowKeyPresses } from './lib/preventNativeArrowKeyPresses.mjs'
import { getByDirection } from './lib/strategies.mjs'

let inDebugMode = false

export const initArrowTab = ({ debug = false }: { debug?: boolean } = {}) => {
  document.addEventListener(
    'keydown',
    (event) => {
      if (
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown'
      ) {
        return
      }

      // TODO: Use modifierKey
      if (event.shiftKey) {
        return
      }

      const activeElement = document.activeElement

      if (!activeElement) {
        return
      }

      preventNativeArrowKeyPresses({ event, activeElement })

      const nothingHasFocus = activeElement === document.body
      if (nothingHasFocus) {
        const firstFocusable = getFocusable()?.[0]
        if (firstFocusable instanceof HTMLElement) {
          firstFocusable.focus()
          return
        }
      }

      if (hasTextSelection({ activeElement, event })) {
        return
      }

      const allFocusable = getFocusable()
      const withoutActiveElement = allFocusable.filter(
        (element) => element !== activeElement,
      )

      const sorted = getByDirection({
        focusableElements: withoutActiveElement,
        activeElement,
        event,
        inDebugMode,
      })

      const withinReach = sorted.filter(({ withinReach }) => withinReach)

      let nearest = withinReach.at(0)

      if (!nearest) {
        return
      }

      if (debug && event.ctrlKey) {
        if (inDebugMode) {
          document
            .querySelectorAll('[data-arrowtab="debug"]')
            .forEach((div) => {
              div.remove()
            })
          inDebugMode = false
          return
        }

        inDebugMode = true

        let counter = 1
        let withinReachCounter = 1
        for (const focusable of sorted) {
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

          const color = focusable.withinReach ? 'green' : 'red'
          div.style.border = `1px solid ${color}`
          div.style.color = 'white'
          div.style.backgroundColor = color
          div.style.zIndex = '100000'
          div.style.display = 'flex'
          div.style.alignItems = 'center'
          div.style.justifyContent = 'center'
          div.style.cursor = 'pointer'

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

        return
      }

      if (nearest.element instanceof HTMLElement) {
        nearest.element.focus()
      }
    },
    { capture: true },
  )
}
