type DismissEvent = {
  preventDefault: () => void
  target: EventTarget | null
  detail?: { originalEvent?: Event }
}

function isRadixLayerElement(element: Element): boolean {
  return !!(
    element.closest('[data-radix-select-viewport]') ||
    element.closest('[data-radix-popper-content-wrapper]') ||
    element.closest('[data-slot="calendar"]') ||
    element.closest('[role="listbox"]') ||
    element.closest('[role="combobox"]') ||
    element.closest('[data-radix-popover-content]')
  )
}

/** Returns true when the event target is inside a Radix portaled overlay (select, popover, etc.). */
export function isRadixPortalTarget(
  target: EventTarget | null,
  originalEvent?: Event,
): boolean {
  if (target instanceof Element && isRadixLayerElement(target)) return true

  const path = originalEvent?.composedPath?.() ?? []
  return path.some((node) => node instanceof Element && isRadixLayerElement(node))
}

export function shouldPreventDialogDismiss(event: DismissEvent): boolean {
  if (isRadixPortalTarget(event.target, event.detail?.originalEvent)) return true

  if (event.target instanceof Element) {
    if (event.target.closest('[role="combobox"]')) return true
  }

  return false
}

export function preventDismissIfRadixPortal(event: DismissEvent) {
  if (shouldPreventDialogDismiss(event)) {
    event.preventDefault()
  }
}
