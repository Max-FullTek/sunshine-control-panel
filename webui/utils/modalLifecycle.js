// Bootstrap's hidden event follows both the dialog and backdrop transitions.
// Disposing earlier leaves pending callbacks accessing a disposed instance.
export function manageModalLifecycle(element, modal, onClose) {
  let phase = 'hidden'
  let releasing = false
  const handlers = {
    'show.bs.modal': () => { phase = 'showing' },
    'shown.bs.modal': () => {
      phase = 'shown'
      if (releasing) modal.hide()
    },
    'hide.bs.modal': () => { phase = 'hiding' },
    'hidden.bs.modal': () => {
      phase = 'hidden'
      if (releasing) dispose()
      else onClose()
    },
  }
  const dispose = () => {
    for (const [event, handler] of Object.entries(handlers)) element.removeEventListener(event, handler)
    modal.dispose()
  }
  for (const [event, handler] of Object.entries(handlers)) element.addEventListener(event, handler)
  return () => {
    if (releasing) return
    releasing = true
    if (phase === 'hidden') dispose()
    else if (phase === 'shown') modal.hide()
    // Showing must finish before hide(); hiding must finish before dispose().
  }
}
