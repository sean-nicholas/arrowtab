import { canMoveCaret } from './caret.js'
import { changesValueOnArrowKeys } from './changesValueOnArrowKeys.js'
import {
  activateDebugMode,
  deactivateDebugMode,
  isInDebugMode,
} from './debugMode.js'
import { getDirection } from './directions.js'
import { startAutoDetectHistory } from './focusHistory.js'
import { startFocusTracker } from './focusTracker.js'
import { getFocusable } from './focusable.js'
import { getRect } from './geometry.js'
import { hasDisabledKeys } from './hasDisabledKeys.js'
import { rankCandidates } from './rankCandidates.js'
import { getScope } from './scope.js'
import { grid, spatial, type Strategy } from './strategies.js'
import { isHandledByWidget } from './widgets.js'

const strategies = { spatial, grid }

export type ArrowTabOptions = {
  debug?: boolean
  autoDetectHistory?: boolean
  strategy?: keyof typeof strategies | Strategy
}

const getActiveElement = () => {
  const { activeElement } = document
  return activeElement instanceof HTMLElement && activeElement !== document.body
    ? activeElement
    : null
}

export const initArrowTab = ({
  debug = false,
  autoDetectHistory = false,
  strategy = 'spatial',
}: ArrowTabOptions = {}) => {
  const log = (...args: unknown[]) => {
    if (debug) console.log('[arrowtab]', ...args)
  }
  const rank = typeof strategy === 'function' ? strategy : strategies[strategy]
  const focusTracker = startFocusTracker()

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isInDebugMode()) {
      deactivateDebugMode()
      return
    }

    const direction = getDirection({ key: event.key })
    if (!direction) return

    if (isInDebugMode()) deactivateDebugMode()
    const showDebugMode = debug && event.ctrlKey

    // Shift falls back to the native behavior. Alt, Meta and Ctrl belong to the OS / browser (word jumps, history navigation, ...)
    if (
      event.defaultPrevented ||
      event.isComposing ||
      event.shiftKey ||
      event.altKey ||
      event.metaKey ||
      (event.ctrlKey && !showDebugMode)
    ) {
      return
    }

    const activeElement = getActiveElement()

    if (activeElement) {
      if (hasDisabledKeys({ activeElement, direction })) {
        log('arrow keys are disabled')
        return
      }
      if (isHandledByWidget({ activeElement, direction })) {
        log('arrow key is handled by a widget')
        return
      }
      if (!showDebugMode && canMoveCaret({ activeElement, direction })) {
        log('caret can still move')
        return
      }
    }

    const scope = getScope({ activeElement })
    const candidates = getFocusable({ root: scope }).filter(
      ({ element }) => element !== activeElement,
    )
    // Without focus, navigate from the last focused position, e.g. after the focused element was removed
    const origin = activeElement
      ? getRect({ element: activeElement })
      : focusTracker.getLastRect()
    const ranked = origin
      ? rankCandidates({
          origin,
          candidates,
          direction,
          strategy: rank,
          activeElement,
        })
      : []

    if (showDebugMode) {
      event.preventDefault()
      activateDebugMode({ origin, items: ranked })
      return
    }

    // Enter the scope if focus is outside of it: nothing is focused or focus is behind a modal
    const isOutsideScope = !activeElement || !scope.contains(activeElement)
    const target =
      ranked.find(({ withinReach }) => withinReach) ??
      (isOutsideScope ? candidates[0] : undefined)

    if (!target) {
      log('nothing within reach')
      if (
        activeElement &&
        changesValueOnArrowKeys({ element: activeElement })
      ) {
        event.preventDefault()
      }
      return
    }

    log('focusing', target)
    event.preventDefault()
    target.element.focus()
  }

  document.addEventListener('keydown', onKeyDown, { capture: true })

  const { cleanup: cleanupAutoDetectHistory } = startAutoDetectHistory({
    active: autoDetectHistory,
    focusTracker,
  })

  return {
    cleanup: () => {
      document.removeEventListener('keydown', onKeyDown, { capture: true })
      cleanupAutoDetectHistory()
      focusTracker.cleanup()
      if (isInDebugMode()) deactivateDebugMode()
    },
  }
}
