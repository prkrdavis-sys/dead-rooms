const SCROLL_OVERFLOW = new Set(['auto', 'scroll', 'overlay'])

let joystickCaptured = false

export function setJoystickCapture(active: boolean) {
  joystickCaptured = active
}

function overflowAllowsScroll(value: string): boolean {
  return SCROLL_OVERFLOW.has(value)
}

function canScroll(el: Element, dx: number, dy: number): boolean {
  const style = getComputedStyle(el)
  if (dy !== 0 && overflowAllowsScroll(style.overflowY)) {
    const max = el.scrollHeight - el.clientHeight
    if (max > 0) {
      if (dy < 0 && el.scrollTop > 0) return true
      if (dy > 0 && el.scrollTop < max) return true
    }
  }
  if (dx !== 0 && overflowAllowsScroll(style.overflowX)) {
    const max = el.scrollWidth - el.clientWidth
    if (max > 0) {
      if (dx < 0 && el.scrollLeft > 0) return true
      if (dx > 0 && el.scrollLeft < max) return true
    }
  }
  return false
}

function closestElement(target: EventTarget | null, selector: string): Element | null {
  return target instanceof Element ? target.closest(selector) : null
}

function touchScrollAllowed(target: EventTarget | null, dx: number, dy: number): boolean {
  if (joystickCaptured || closestElement(target, '[data-joystick]')) return false
  if (closestElement(target, '[data-play-locked]') && !closestElement(target, '[data-allow-touch-scroll]')) {
    return false
  }
  let el = target instanceof Element ? target : null
  while (el && el !== document.documentElement && el !== document.body) {
    if (canScroll(el, dx, dy)) return true
    el = el.parentElement
  }
  return false
}

function preventIfCancelable(event: Event) {
  if (event.cancelable) event.preventDefault()
}

/** Pin the document so analog-stick and game drags cannot pan or pinch-zoom the page. */
export function lockViewport(): () => void {
  let lastX = 0
  let lastY = 0

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (touch) {
      lastX = touch.clientX
      lastY = touch.clientY
    }
    if (closestElement(event.target, '[data-joystick]')) {
      joystickCaptured = true
      preventIfCancelable(event)
    }
  }

  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length > 1 || joystickCaptured) {
      preventIfCancelable(event)
      return
    }
    const touch = event.touches[0]
    if (!touch) {
      preventIfCancelable(event)
      return
    }
    const dx = lastX - touch.clientX
    const dy = lastY - touch.clientY
    lastX = touch.clientX
    lastY = touch.clientY
    if (!touchScrollAllowed(event.target, dx, dy)) {
      preventIfCancelable(event)
    }
  }

  const onTouchEnd = (event: TouchEvent) => {
    if (event.touches.length === 0) joystickCaptured = false
  }

  document.addEventListener('touchstart', onTouchStart, { passive: false, capture: true })
  document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true })
  document.addEventListener('touchend', onTouchEnd, { capture: true })
  document.addEventListener('touchcancel', onTouchEnd, { capture: true })
  for (const name of ['gesturestart', 'gesturechange', 'gestureend'] as const) {
    document.addEventListener(name, preventIfCancelable)
  }

  return () => {
    document.removeEventListener('touchstart', onTouchStart, true)
    document.removeEventListener('touchmove', onTouchMove, true)
    document.removeEventListener('touchend', onTouchEnd, true)
    document.removeEventListener('touchcancel', onTouchEnd, true)
    for (const name of ['gesturestart', 'gesturechange', 'gestureend'] as const) {
      document.removeEventListener(name, preventIfCancelable)
    }
    joystickCaptured = false
  }
}
