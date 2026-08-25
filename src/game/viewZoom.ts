const TARGET_SHORT_AXIS = 520
const MIN_ZOOM = 0.58
const MAX_ZOOM = 1
const FULL_ZOOM_AT = 700

/** Keep a readable slice of the room visible on phones, tablets, and resized windows. */
export function zoomForView(width: number, height: number): number {
  const shortSide = Math.min(width, height)
  if (shortSide >= FULL_ZOOM_AT) return MAX_ZOOM
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, shortSide / TARGET_SHORT_AXIS))
}
