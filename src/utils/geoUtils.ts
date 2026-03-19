import type { LatLng } from '../types'

const R = 6371000 // Earth radius in meters

export function latLngToXY(point: LatLng, ref: LatLng): { x: number; y: number } {
  const latRad = (ref.lat * Math.PI) / 180
  const x = (point.lng - ref.lng) * (Math.PI / 180) * R * Math.cos(latRad)
  const y = (point.lat - ref.lat) * (Math.PI / 180) * R
  return { x, y }
}

export function xyToLatLng(xy: { x: number; y: number }, ref: LatLng): LatLng {
  const latRad = (ref.lat * Math.PI) / 180
  const lat = ref.lat + (xy.y / R) * (180 / Math.PI)
  const lng = ref.lng + (xy.x / (R * Math.cos(latRad))) * (180 / Math.PI)
  return { lat, lng }
}

export function rotatePt(pt: { x: number; y: number }, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return {
    x: pt.x * cos - pt.y * sin,
    y: pt.x * sin + pt.y * cos,
  }
}

export function pointInPolygon(
  pt: { x: number; y: number },
  poly: { x: number; y: number }[]
): boolean {
  let inside = false
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function centroid(points: LatLng[]): LatLng {
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length
  const lng = points.reduce((s, p) => s + p.lng, 0) / points.length
  return { lat, lng }
}
