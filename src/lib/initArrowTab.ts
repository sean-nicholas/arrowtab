import {
  activateDebugMode,
  deactivateDebugMode,
  isInDebugMode,
} from './debugMode.js'
import { getFocusable } from './getFocusable.js'
import { hasDisabledKeys } from './hasDisabledKeys.js'
import { hasTextSelection } from './hasTextSelection.js'
import { preventNativeArrowKeyPresses } from './preventNativeArrowKeyPresses.js'
import { getByGrid } from './strategies.js'

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

export const initArrowTab = ({ debug = false }: { debug?: boolean } = {}) => {
  const onKeyDown = (event: KeyboardEvent) => {
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
      if (debug) {
        console.log('no active element')
      }
      return
    }

    if (hasDisabledKeys({ event, activeElement })) {
      if (debug) {
        console.log('arrow keys are disabled')
      }
      return
    }

    preventNativeArrowKeyPresses({ event, activeElement })

    const nothingHasFocus = activeElement === document.body
    if (nothingHasFocus) {
      if (debug) {
        console.log('nothing has focus. using first focusable')
      }
      const firstFocusable = getFocusable()?.[0]
      if (firstFocusable instanceof HTMLElement) {
        firstFocusable.focus()
        return
      }
    }

    if (hasTextSelection({ activeElement, event })) {
      if (debug) {
        console.log('element has text selection')
      }
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

    if (debug && event.ctrlKey) {
      if (isInDebugMode()) {
        deactivateDebugMode()
      }

      activateDebugMode({ focusableElements: sorted })
      return
    }

    let nearest = withinReach.at(0)

    if (debug) {
      console.log('found nearest element to select', nearest)
    }

    if (!nearest) {
      return
    }

    if (nearest.element instanceof HTMLElement) {
      if (debug) {
        console.log('focusing element', nearest)
      }
      nearest.element.focus()
    }
  }

  document.addEventListener('keydown', onKeyDown, { capture: true })

  return {
    cleanup: () => {
      document.removeEventListener('keydown', onKeyDown, { capture: true })
    },
  }
}
