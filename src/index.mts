// TODO: Options
// modifierKey: 'ctrlKey',
// onlyWithModifierKey: false, // TODO: Better name
// strategy: arrowTab.XWalkEuclidean,
// selector: undefined,
// elementFilter: () => boolean,
// getElementPosition: (element) => { x: number, y: number },
// eventTriggerName: 'keydown' | 'keyup',
// earlyReturn: (event) => boolean, // TODO: Better name

import { getFocusable } from './lib/getFocusable.mjs'
import { getMiddle, getTopLeft } from './lib/positions.mjs'
import { strategy } from './lib/strategies.js'
import { sumBy } from './lib/sumBy.mjs'

let inDebugMode = false

export const initArrowTab = ({ debug = false }: { debug?: boolean } = {}) => {
  document.addEventListener(
    'keydown',
    (event) => {
      const activeStrategy = strategy.XWalkEuclidean

      const activeElement =
        document.activeElement === document.body
          ? getFocusable()?.[0]
          : document.activeElement

      if (!activeElement) {
        return
      }

      if (
        event.key !== 'ArrowLeft' &&
        event.key !== 'ArrowRight' &&
        event.key !== 'ArrowUp' &&
        event.key !== 'ArrowDown'
      ) {
        return
      }

      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        const selectionStart = activeElement.selectionStart
        const selectionEnd = activeElement.selectionEnd

        if (
          event.key === 'ArrowLeft' &&
          selectionStart !== undefined &&
          selectionStart !== null &&
          selectionStart !== 0
        ) {
          return
        }

        if (
          event.key === 'ArrowRight' &&
          selectionStart !== undefined &&
          selectionStart !== null &&
          selectionStart !== activeElement.value?.length
        ) {
          return
        }

        if (
          (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
          selectionStart !== undefined &&
          selectionEnd !== undefined &&
          selectionStart !== null &&
          selectionEnd !== null &&
          selectionStart !== selectionEnd
        ) {
          return
        }

        if (
          event.key === 'ArrowUp' &&
          selectionStart !== undefined &&
          selectionStart !== null &&
          activeElement instanceof HTMLTextAreaElement
        ) {
          const rows = activeElement.value?.split('\n')
          const start = selectionStart
          const firstRow = rows.at(0)
          if (firstRow && start > firstRow.length) {
            return
          }
        }

        if (
          event.key === 'ArrowDown' &&
          selectionStart !== undefined &&
          selectionStart !== null &&
          activeElement instanceof HTMLTextAreaElement
        ) {
          const rows = activeElement.value?.split('\n')
          const withoutLastRow = rows.slice(0, -1)
          const lengthUntilLastRow = sumBy(withoutLastRow, (row) => row.length)

          const start = selectionStart
          if (start <= lengthUntilLastRow + 1) {
            return
          }
        }
      }

      const inputTypesThatNeedModifierKey: Record<string, string[]> = {
        date: ['ArrowDown', 'ArrowUp'],
        time: ['ArrowDown', 'ArrowUp'],
        datetime: ['ArrowDown', 'ArrowUp'],
        'datetime-local': ['ArrowDown', 'ArrowUp'],
        month: ['ArrowDown', 'ArrowUp'],
        week: ['ArrowDown', 'ArrowUp'],
        number: ['ArrowDown', 'ArrowUp'],
        range: ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'],
      }

      if (activeElement instanceof HTMLInputElement) {
        const inputType = activeElement.type
        if (
          inputTypesThatNeedModifierKey[inputType] &&
          inputTypesThatNeedModifierKey[inputType].includes(event.key)
        ) {
          // TODO: Use modifierKey
          if (!event.shiftKey) {
            return
          } else {
            event.preventDefault()
          }
        }
      }

      const activePosition = getMiddle(activeElement)

      const allFocusable = getFocusable()
      const withoutActiveElement = allFocusable.filter(
        (element) => element !== activeElement,
      )
      const withPosition = withoutActiveElement.map((element) => {
        const position = getMiddle(element)

        // Calculate angle between active element and focusable element
        const xDistance = position.x - activePosition.x
        const yDistance = position.y - activePosition.y
        let angle =
          Math.acos(yDistance / Math.sqrt(xDistance ** 2 + yDistance ** 2)) *
          (180 / Math.PI)
        const direction = xDistance > 0 ? 'right' : 'left'
        if (direction === 'right') {
          angle = 360 - angle
        }

        return {
          xDistance,
          yDistance,
          element,
          angle,
          position,
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
