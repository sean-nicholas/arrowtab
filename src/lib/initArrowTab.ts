import { canMoveCaret } from './caret.js'
import { changesValueOnArrowKeys } from './changesValueOnArrowKeys.js'
import {
  activateDebugMode,
  deactivateDebugMode,
  isInDebugMode,
} from './debugMode.js'
import { getDirection, getOpposite, type Direction } from './directions.js'
import { containsComposed, getDeepActiveElement } from './dom.js'
import { startAutoDetectHistory } from './focusHistory.js'
import { startFocusTracker } from './focusTracker.js'
import { createClipCheck, getFocusable } from './focusable.js'
import { getRect } from './geometry.js'
import { hasDisabledKeys } from './hasDisabledKeys.js'
import { dispatchNavigate } from './navigateEvent.js'
import { rankCandidates } from './rankCandidates.js'
import { getScope, wrapSelector } from './scope.js'
import {
  grid,
  spatial,
  type RankedCandidate,
  type Strategy,
} from './strategies.js'
import { isHandledByWidget } from './widgets.js'
import { getWrapOrigin } from './wrap.js'

const strategies = { spatial, grid }

export type ArrowTabOptions = {
  debug?: boolean
  autoDetectHistory?: boolean
  strategy?: keyof typeof strategies | Strategy
  // Only navigate inside this element. Defaults to the whole document.
  root?: Element
}

const getActiveElement = () => {
  const activeElement = getDeepActiveElement()
  return activeElement instanceof HTMLElement && activeElement !== document.body
    ? activeElement
    : null
}

const initializedRoots = new Set<Element | undefined>()

export const initArrowTab = ({
  debug = false,
  autoDetectHistory = false,
  strategy = 'spatial',
  root,
}: ArrowTabOptions = {}) => {
  const log = (...args: unknown[]) => {
    if (debug) console.log('[arrowtab]', ...args)
  }
  if (initializedRoots.has(root)) {
    console.warn(
      '[arrowtab] initArrowTab was called twice for the same root. Call cleanup() of the first instance before initializing it again.',
    )
  }
  initializedRoots.add(root)

  const rank = typeof strategy === 'function' ? strategy : strategies[strategy]
  const focusTracker = startFocusTracker({ root })
  // The last move, so the opposite direction can return to where focus came from
  let lastMove:
    | { from: HTMLElement; to: HTMLElement; direction: Direction }
    | undefined

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
    const rootElement = root ?? document.body
    // Without focus, e.g. after the focused element was removed, it counts where focus was last
    const isInRoot = activeElement
      ? containsComposed({ container: rootElement, element: activeElement })
      : focusTracker.isLastInRoot() || !root
    if (!isInRoot) return

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

    const scope = getScope({ activeElement, root: rootElement })
    const candidates = getFocusable({ root: scope }).filter(
      ({ element }) => element !== activeElement,
    )
    // Without focus, navigate from the last focused position, e.g. after the focused element was removed
    const origin = activeElement
      ? getRect({ element: activeElement })
      : focusTracker.getLastRect()
    const isClipped = createClipCheck()
    const isTarget = (item: RankedCandidate) =>
      item.withinReach && !isClipped(item)

    const ranked = origin
      ? rankCandidates({
          origin,
          candidates,
          direction,
          strategy: rank,
          activeElement,
          preferred:
            lastMove?.to === activeElement &&
            direction === getOpposite({ direction: lastMove.direction })
              ? lastMove.from
              : undefined,
        })
      : []

    if (showDebugMode) {
      event.preventDefault()
      activateDebugMode({
        origin,
        items: ranked.map((item) => ({ ...item, withinReach: isTarget(item) })),
      })
      return
    }

    // Enter the scope if focus is outside of it: nothing is focused or focus is behind a modal
    const isOutsideScope =
      !activeElement ||
      !containsComposed({ container: scope, element: activeElement })
    const target =
      ranked.find(isTarget) ??
      (isOutsideScope
        ? candidates.find((item) => !isClipped(item))
        : undefined) ??
      (origin && scope.matches(wrapSelector) && candidates.length > 0
        ? rank({
            origin: getWrapOrigin({ origin, candidates, direction }),
            candidates,
            direction,
          }).find(isTarget)
        : undefined)

    if (
      !target ||
      !dispatchNavigate({ from: activeElement, to: target.element, direction })
    ) {
      log(target ? 'navigation was canceled' : 'nothing within reach')
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
    // Scroll as little as possible. Sticky headers are respected via scroll-padding.
    target.element.focus({ preventScroll: true })
    target.element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    if (activeElement) {
      lastMove = { from: activeElement, to: target.element, direction }
    }
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
      initializedRoots.delete(root)
      if (isInDebugMode()) deactivateDebugMode()
    },
  }
}
