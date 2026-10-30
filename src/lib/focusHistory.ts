import type { FocusTracker } from './focusTracker.js'

const dialogSelector = '[role="dialog"], [role="alertdialog"], dialog'

const isOpen = ({ dialog }: { dialog: Element }) =>
  dialog.isConnected &&
  !dialog.closest('[hidden]') &&
  (dialog.tagName !== 'DIALOG' || dialog.hasAttribute('open'))

const isFocusLost = () => {
  const { activeElement } = document
  return (
    !activeElement ||
    activeElement === document.body ||
    !activeElement.isConnected
  )
}

/**
 * Refocuses the element that was focused before a dialog opened, once the dialog closes.
 * Only kicks in if focus got lost, so dialogs restoring focus themselves are left alone.
 */
export const startAutoDetectHistory = ({
  active,
  focusTracker,
}: {
  active: boolean
  focusTracker: FocusTracker
}) => {
  if (!active) {
    return {
      cleanup: () => {},
    }
  }

  // Ordered by opening time, nested dialogs come last
  let openDialogs: { dialog: Element; returnTo: HTMLElement | undefined }[] = []

  const trackOpenedDialogs = ({ root }: { root: Element }) => {
    const dialogs = [
      ...(root.matches(dialogSelector) ? [root] : []),
      ...root.querySelectorAll(dialogSelector),
    ]
    for (const dialog of dialogs) {
      if (!isOpen({ dialog })) continue
      if (openDialogs.some((entry) => entry.dialog === dialog)) continue
      openDialogs.push({
        dialog,
        returnTo: focusTracker.getRecentlyFocused({ outside: dialog }),
      })
    }
  }

  const dialogObserver = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      // Dialogs are often rendered inside a portal wrapper, so search the added subtree
      const roots =
        mutation.type === 'attributes'
          ? [mutation.target]
          : [...mutation.addedNodes]
      for (const root of roots) {
        if (root instanceof Element) trackOpenedDialogs({ root })
      }
    }

    const closed = openDialogs.filter(({ dialog }) => !isOpen({ dialog }))
    if (closed.length === 0) return
    openDialogs = openDialogs.filter((entry) => !closed.includes(entry))

    // If nested dialogs close at once, return to where the outermost one was opened
    const returnTo = closed[0]?.returnTo
    if (returnTo?.isConnected && isFocusLost()) {
      returnTo.focus()
    }
  })

  dialogObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['open', 'hidden'],
  })

  return {
    cleanup: () => {
      dialogObserver.disconnect()
    },
  }
}
