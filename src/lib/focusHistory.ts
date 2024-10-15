const focusHistory: HTMLElement[] = []
let historyCandidate: HTMLElement | undefined

export const setHistoryCandidate = ({ element }: { element: Element }) => {
  if (!(element instanceof HTMLElement)) {
    return
  }
  historyCandidate = element
}

export const pushCandidateIntoHistory = () => {
  if (historyCandidate) {
    focusHistory.push(historyCandidate)
  }
}

export const focusPrevious = () => {
  const lastHistoryElement = focusHistory.pop()
  if (lastHistoryElement) {
    lastHistoryElement.focus()
  }
}

export const startAutoDetectHistory = ({ active }: { active: boolean }) => {
  if (!active) {
    return {
      cleanup: () => {},
    }
  }
  let dialogObserver: MutationObserver | null = null
  // TODO: Support multiple dialogs
  let lastDialogElement: HTMLElement | null = null
  dialogObserver = new MutationObserver((mutationList) => {
    for (const mutation of mutationList) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === 1 &&
            node instanceof HTMLElement &&
            node.getAttribute('role') === 'dialog'
          ) {
            lastDialogElement = node
            pushCandidateIntoHistory()
          }
        }

        for (const node of mutation.removedNodes) {
          if (node === lastDialogElement || node.contains(lastDialogElement)) {
            lastDialogElement = null
            focusPrevious()
            return
          }
        }
      }
    }
  })

  dialogObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })

  return {
    cleanup: () => {
      dialogObserver?.disconnect()
    },
  }
}
