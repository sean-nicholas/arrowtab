import { getRect, isEmptyRect, type Rect } from './geometry.js'

const maxEntries = 20

export type FocusTracker = ReturnType<typeof startFocusTracker>

// Remembers recently focused elements and where they were, so focus can be restored after it got lost
export const startFocusTracker = () => {
  let recent: { element: HTMLElement; rect: Rect }[] = []

  const onFocusIn = (event: FocusEvent) => {
    const element = event.target
    if (!(element instanceof HTMLElement)) return
    recent = recent.filter((entry) => entry.element !== element)
    recent.push({ element, rect: getRect({ element }) })
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
    getRecentlyFocused: ({ outside }: { outside: Element }) =>
      [...recent]
        .reverse()
        .find(
          ({ element }) => element.isConnected && !outside.contains(element),
        )?.element,
    cleanup: () => {
      document.removeEventListener('focusin', onFocusIn, { capture: true })
    },
  }
}
