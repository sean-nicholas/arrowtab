// TODO: Options
// modifierKey: 'ctrlKey',
// onlyWithModifierKey: false, // TODO: Better name
// strategy: arrowTab.XWalkEuclidean,
// selector: undefined,
// elementFilter: () => boolean,
// getElementPosition: (element) => { x: number, y: number },
// eventTriggerName: 'keydown' | 'keyup',
// earlyReturn: (event) => boolean, // TODO: Better name

const getFocusable = () => {
  // Selectors from https://zellwk.com/blog/keyboard-focusable-elements/
  const allFocusable = document.querySelectorAll(
    'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex^="-"])',
  )
  const focusable = Array.from(allFocusable).filter((element) => {
    if ('disabled' in element && element.disabled) return false
    if ('hidden' in element && element.hidden) return false
    if (element.getAttribute('aria-hidden') === 'true') return false
    return true
  })
  return focusable
}

const getMiddle = (element: HTMLElement) => {
  const { x, y, width, height } = element.getBoundingClientRect()
  return {
    x: x + width / 2,
    y: y + height / 2,
  }
}

// TODO: Better name
type StrategyInput = {
  xDistance: number
  yDistance: number
  element: HTMLElement
  angle: number
  position: { x: number; y: number }
}

document.addEventListener(
  'keydown',
  (event) => {
    const withinReachMetrics = {
      XWalk: ({ angle }: StrategyInput) => {
        if (event.key === 'ArrowDown' && (angle >= 315 || angle <= 45)) {
          return true
        }

        if (event.key === 'ArrowLeft' && angle > 45 && angle < 135) {
          return true
        }

        if (event.key === 'ArrowUp' && angle >= 135 && angle <= 225) {
          return true
        }

        if (event.key === 'ArrowRight' && angle > 225 && angle < 315) {
          return true
        }

        return false
      },
    }

    const distanceMetrics = {
      euclidean: ({ xDistance, yDistance }: StrategyInput) => {
        return Math.sqrt(xDistance ** 2 + yDistance ** 2)
      },
      manhattan: ({ xDistance, yDistance }: StrategyInput) => {
        return Math.abs(xDistance) + Math.abs(yDistance)
      },
      manhattanWeighted: ({ xDistance, yDistance }: StrategyInput) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          return Math.abs(xDistance) + Math.abs(yDistance) * 0.1
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          return Math.abs(xDistance) * 0.1 + Math.abs(yDistance)
        }
      },
    }

    const strategy = {
      XWalkEuclidean: {
        withinReachMetric: withinReachMetrics.XWalk,
        distanceMetric: distanceMetrics.euclidean,
      },
      XWalkManhattan: {
        withinReachMetric: withinReachMetrics.XWalk,
        distanceMetric: distanceMetrics.manhattan,
      },
      XWalkManhattanWeighted: {
        withinReachMetric: withinReachMetrics.XWalk,
        distanceMetric: distanceMetrics.manhattanWeighted,
      },
    }

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
      const selectionEnd = activeElement?.selectionEnd

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
        selectionStart !== activeElement?.value?.length
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
        activeElement?.tagName.toLowerCase() === 'textarea' // TODO: Use instanceof
      ) {
        const rows = activeElement?.value?.split('\n')
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
        activeElement?.tagName.toLowerCase() === 'textarea' // TODO: Use instanceof
      ) {
        const rows = activeElement?.value?.split('\n')
        // TODO: Refactor
        const lastRow = rows.pop()
        const lengthUntilLastRow = _.sumBy(rows, (row) => row.length)

        const start = selectionStart
        if (start <= lengthUntilLastRow + 1) {
          return
        }
      }
    }

    const inputTypesThatNeedModifierKey = {
      date: ['ArrowDown', 'ArrowUp'],
      time: ['ArrowDown', 'ArrowUp'],
      datetime: ['ArrowDown', 'ArrowUp'],
      'datetime-local': ['ArrowDown', 'ArrowUp'],
      month: ['ArrowDown', 'ArrowUp'],
      week: ['ArrowDown', 'ArrowUp'],
      number: ['ArrowDown', 'ArrowUp'],
      range: ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'],
    }

    // TODO: Use instanceof
    if (activeElement?.tagName.toLowerCase() === 'input') {
      const inputType = activeElement?.type
      if (inputTypesThatNeedModifierKey[inputType]) {
        if (inputTypesThatNeedModifierKey[inputType].includes(event.key)) {
          if (!event.shiftKey) {
            return
          }
        }
      }
    }

    const activePosition = getMiddle(activeElement)

    const allFocusable = getFocusable()

    const candidates = _(allFocusable)
      .filter((element) => element !== activeElement)
      .map((element) => {
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
      .map((focusable) => {
        const distance = activeStrategy.distanceMetric(focusable)

        return {
          ...focusable,
          distance,
        }
      })
      .map((focusable) => {
        const withinReach = activeStrategy.withinReachMetric(focusable)

        return {
          ...focusable,
          withinReach,
        }
      })
      .reverse() // Prefer down / right if same distance
      .orderBy((f) => f.distance)
      .filter(({ withinReach }) => withinReach)
      // .map((f) => {
      //   console.log(f)
      //   return f
      // })
      .value()

    let nearest = _.first(candidates)

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

    nearest.element.focus()
  },
  { capture: true },
)
