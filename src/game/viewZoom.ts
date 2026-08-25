const MIN_ZOOM = 0.58
const MAX_ZOOM = 1.35
const ROOM_PAD = 80
const COMBAT_SHORT_AXIS = 500
const MIN_COMBAT_VIEW = 360

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Keep the room readable: fill large windows, stay close-in on tall phones. */
export function zoomForView(width: number, height: number, roomW = 960, roomH = 528): number {
  const paddedW = roomW + ROOM_PAD
  const paddedH = roomH + ROOM_PAD
  const zoomToFit = Math.min(width / paddedW, height / paddedH)
  const zoomToCover = Math.max(width / paddedW, height / paddedH)
  const shortSide = Math.min(width, height)
  const combatZoom = shortSide / COMBAT_SHORT_AXIS
  const tall = width / height < 0.85

  if (!tall && zoomToFit >= 0.7 && width >= roomW * 0.7 && height >= roomH * 0.7) {
    return clamp(zoomToFit, MIN_ZOOM, MAX_ZOOM)
  }

  const maxZoom = shortSide / MIN_COMBAT_VIEW
  return clamp(Math.max(combatZoom, Math.min(zoomToCover, maxZoom)), MIN_ZOOM, MAX_ZOOM)
}
