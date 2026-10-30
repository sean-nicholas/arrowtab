import type { Direction } from './directions.js'

export const navigateEventName = 'arrowtab:navigate'

export type ArrowTabNavigateEvent = CustomEvent<{
  from: HTMLElement | null
  to: HTMLElement
  direction: Direction
}>

declare global {
  interface DocumentEventMap {
    [navigateEventName]: ArrowTabNavigateEvent
  }
  interface HTMLElementEventMap {
    [navigateEventName]: ArrowTabNavigateEvent
  }
}

// Dispatched on the focused element before focus moves. Returns false if a listener called preventDefault().
export const dispatchNavigate = (detail: ArrowTabNavigateEvent['detail']) =>
  (detail.from ?? document).dispatchEvent(
    new CustomEvent(navigateEventName, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  )
