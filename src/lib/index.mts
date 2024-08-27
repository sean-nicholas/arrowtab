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

import { getAngle } from './getAngle.mjs'
import { getFocusable } from './getFocusable.mjs'
import { getXyDistance } from './getXyDistance.mjs'
import { hasTextSelection } from './hasTextSelection.mjs'
import { getMiddle, getTopLeft } from './positions.mjs'
import { preventNativeArrowKeyPresses } from './preventNativeArrowKeyPresses.mjs'
import { strategy } from './strategies.mjs'

let inDebugMode = false

export const initArrowTab = ({ debug = false }: { debug?: boolean } = {}) => {
  document.addEventListener(
    'keydown',
    (event) => {
      const activeStrategy = strategy.XWalkEuclidean

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
      const withPosition = withoutActiveElement.map((element) => {
        return {
          ...getXyDistance({ activeElement, element }),
          element,
          angle: getAngle({ activeElement, element }),
          position: getMiddle(element),
        }
      })
      const withDistance = withPosition.map((focusable) => {
        const distance = activeStrategy.distanceMetric({ ...focusable, event })

        return {
          ...focusable,
          distance,
        }
      })
      const withWithinReach = withDistance.map((focusable) => {
        const withinReach = activeStrategy.withinReachMetric({
          ...focusable,
          event,
        })

        return {
          ...focusable,
          withinReach,
        }
      })

      const reversed = [...withWithinReach].reverse() // Prefer down / right if same distance

      const sorted = reversed.sort((a, b) => {
        return a.distance - b.distance
      })

      const withinReach = sorted.filter(({ withinReach }) => withinReach)

      let nearest = withinReach.at(0)

      if (!nearest) {
        return
      }

      // const nearlySameDistance = _.filter(candidates, (candidate) => {
      //   return candidate.distance - nearest.distance < 10
      // })

      // console.log('nearlySameDistance', nearlySameDistance)

      // if (nearlySameDistance.length > 1) {
      //   const ordered = _.orderBy(nearlySameDistance, (candidate) => {
      //     if (event.key === 'ArrowDown') {
      //       console.log('ArrowDown', candidate.xDistance)
      //       return -candidate.xDistance
      //     }
      //     if (event.key === 'ArrowUp') {
      //       return candidate.xDistance
      //     }
      //     if (event.key === 'ArrowLeft') {
      //       return candidate.yDistance
      //     }
      //     if (event.key === 'ArrowRight') {
      //       console.log('ArrowRight', candidate.yDistance)
      //       return -candidate.yDistance
      //     }
      //   })
      //   console.log('ordered', ordered)
      //   nearest = _.first(ordered)
      // }

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
          div.style.position = 'absolute'
          div.style.top = getTopLeft(focusable.element).y + 'px'
          div.style.left = getTopLeft(focusable.element).x + 'px'
          let width = focusable.element.offsetWidth
          let height = focusable.element.offsetHeight
          if (width < 10) {
            width = 10
          }
          if (height < 10) {
            height = 10
          }
          div.style.width = width + 'px'
          div.style.height = height + 'px'
          const color = focusable.withinReach ? 'green' : 'red'
          div.style.border = `1px solid ${color}`
          div.style.color = 'white'
          div.style.backgroundColor = color
          div.style.zIndex = '100000'
          div.style.display = 'flex'
          div.style.alignItems = 'center'
          div.style.justifyContent = 'center'

          div.innerHTML = `<div>${counter++} ${
            focusable.withinReach ? `(${withinReachCounter++})` : ''
          }</div>`
          ;(div as any).focusable = focusable
          div.dataset.arrowtab = 'debug'

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
