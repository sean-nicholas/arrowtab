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

import {
  activateDebugMode,
  deactivateDebugMode,
  isInDebugMode,
} from './lib/debugMode.mjs'
import { getFocusable } from './lib/getFocusable.mjs'
import { hasTextSelection } from './lib/hasTextSelection.mjs'
import { preventNativeArrowKeyPresses } from './lib/preventNativeArrowKeyPresses.mjs'
import { getByGrid } from './lib/strategies.mjs'

export const initArrowTab = ({ debug = false }: { debug?: boolean } = {}) => {
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape' && isInDebugMode()) {
        deactivateDebugMode()
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

      const sorted = getByGrid({
        focusableElements: withoutActiveElement,
        activeElement,
        event,
      })

      const withinReach = sorted.filter(({ withinReach }) => withinReach)

      let nearest = withinReach.at(0)

      if (!nearest) {
        return
      }

      if (debug && event.ctrlKey) {
        if (isInDebugMode()) {
          deactivateDebugMode()
        }

        activateDebugMode({ focusableElements: sorted })
        return
      }

      if (nearest.element instanceof HTMLElement) {
        nearest.element.focus()
      }
    },
    { capture: true },
  )
}
