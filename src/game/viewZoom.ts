const MIN_ZOOM = 0.85
const MAX_ZOOM = 2.4
/** Roughly eleven tiles across the short screen axis, so the cone fills the view. */
const TARGET_SHORT_AXIS = 540

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Keep the camera close. In the dark the readable frame is the cone, not the
 * floorplan, so the view never zooms out to fit the whole building; it only
 * pulls back far enough to avoid showing past the map edges.
 */
export function zoomForView(width: number, height: number, roomW = 960, roomH = 528): number {
  const shortSide = Math.min(width, height)
  const tactical = shortSide / TARGET_SHORT_AXIS
  const noOverscan = Math.max(width / roomW, height / roomH)
  return clamp(Math.max(tactical, noOverscan), MIN_ZOOM, MAX_ZOOM)
}
