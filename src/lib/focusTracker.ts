import { containsComposed } from './dom.js'
import { getRect, isEmptyRect, type Rect } from './geometry.js'

const maxEntries = 20

export type FocusTracker = ReturnType<typeof startFocusTracker>

// Remembers recently focused elements and where they were, so focus can be restored after it got lost
export const startFocusTracker = ({ root }: { root?: Element } = {}) => {
  // isInRoot is stored, because removed elements can't be checked anymore
  let recent: { element: HTMLElement; rect: Rect; isInRoot: boolean }[] = []

  const onFocusIn = (event: FocusEvent) => {
    // The target is retargeted to the shadow host, the composed path starts at the focused element
    const element = event.composedPath()[0]
    if (!(element instanceof HTMLElement)) return
    recent = recent.filter((entry) => entry.element !== element)
    recent.push({
      element,
      rect: getRect({ element }),
      isInRoot: !root || containsComposed({ container: root, element }),
    })
    recent = recent.slice(-maxEntries)
  }

  document.addEventListener('focusin', onFocusIn, { capture: true })

  return {
    // Current position of the last focused element, or its last known position if it was removed / hidden
    getLastRect: (): Rect | undefined => {
      const last = recent.at(-1)
      if (!last) return undefined
      if (!last.element.isConnected) return last.rect
      const rect = getRect({ element: last.element })
      return isEmptyRect({ rect }) ? last.rect : rect
    },
    isLastInRoot: () => recent.at(-1)?.isInRoot ?? false,
    getRecentlyFocused: ({ outside }: { outside: Element }) =>
      [...recent]
        .reverse()
        .find(
          ({ element }) =>
            element.isConnected &&
            !containsComposed({ container: outside, element }),
        )?.element,
    cleanup: () => {
      document.removeEventListener('focusin', onFocusIn, { capture: true })
    },
  }
}
