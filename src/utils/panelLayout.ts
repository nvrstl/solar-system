import type { LatLng, Panel, PanelModel } from '../types'
import { latLngToXY, xyToLatLng, rotatePt, pointInPolygon, centroid } from './geoUtils'


function lineIntersect(
  p1: { x: number; y: number }, p2: { x: number; y: number },
  p3: { x: number; y: number }, p4: { x: number; y: number }
): { x: number; y: number } | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y
  const denom = d1x * d2y - d1y * d2x
  if (Math.abs(denom) < 1e-10) return null
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom
  return { x: p1.x + t * d1x, y: p1.y + t * d1y }
}

function insetPolygon(
  poly: { x: number; y: number }[],
  margin: number
): { x: number; y: number }[] {
  const n = poly.length
  if (n < 3) return poly

  // Signed area (shoelace) — positive = CCW, negative = CW
  let area = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += poly[i].x * poly[j].y - poly[j].x * poly[i].y
  }
  const sign = area > 0 ? 1 : -1

  // Move each edge inward by margin
  const offsetEdges: { a: { x: number; y: number }; b: { x: number; y: number } }[] = []
  for (let i = 0; i < n; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % n]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 1e-10) continue
    // Inward unit normal: CCW polygon → (-dy, dx), CW → (dy, -dx)
    const nx = -sign * dy / len
    const ny =  sign * dx / len
    offsetEdges.push({
      a: { x: a.x + nx * margin, y: a.y + ny * margin },
      b: { x: b.x + nx * margin, y: b.y + ny * margin },
    })
  }

  // Intersect consecutive offset edges to get new vertices
  const result: { x: number; y: number }[] = []
  const m = offsetEdges.length
  for (let i = 0; i < m; i++) {
    const e1 = offsetEdges[i]
    const e2 = offsetEdges[(i + 1) % m]
    const pt = lineIntersect(e1.a, e1.b, e2.a, e2.b)
    result.push(pt ?? e1.b) // parallel edges: fall back to endpoint
  }
  return result
}

function longestEdgeAngle(xyPoly: { x: number; y: number }[]): number {
  let maxLen = 0
  let angle = 0
  const n = xyPoly.length
  for (let i = 0; i < n; i++) {
    const a = xyPoly[i]
    const b = xyPoly[(i + 1) % n]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len > maxLen) {
      maxLen = len
      angle = (Math.atan2(dy, dx) * 180) / Math.PI
    }
  }
  return angle
}

export function fillRoofWithPanels(
  roofLatLngs: LatLng[],
  model: PanelModel,
  gutterX: number,
  gutterY: number,
  rotationOverrideDeg?: number,
  tiltDeg = 0,
  marginM = 0.3
): Panel[] {
  if (roofLatLngs.length < 3) return []

  const cosTilt = Math.cos((tiltDeg * Math.PI) / 180)

  const ref = centroid(roofLatLngs)
  const xyPoly = roofLatLngs.map((p) => latLngToXY(p, ref))

  const ridgeAngle =
    rotationOverrideDeg !== undefined
      ? rotationOverrideDeg
      : longestEdgeAngle(xyPoly)

  // Rotate polygon so ridge aligns with X axis
  const rotated = xyPoly.map((p) => rotatePt(p, -ridgeAngle))

  // Inset by safe margin — panels must stay inside this boundary
  const inset = insetPolygon(rotated, marginM)
  if (inset.length < 3) return []

  // Bounding box of inset polygon
  const xs = inset.map((p) => p.x)
  const ys = inset.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const stepX = model.widthM + gutterX
  const hhProjected = (model.heightM / 2) * cosTilt
  const stepY = model.heightM * cosTilt + gutterY
  const hw = model.widthM / 2

  const panels: Panel[] = []
  let idx = 0

  for (let cx = minX + model.widthM / 2; cx < maxX; cx += stepX) {
    for (let cy = minY + hhProjected; cy < maxY; cy += stepY) {
      const corners = [
        { x: cx - hw, y: cy - hhProjected },
        { x: cx + hw, y: cy - hhProjected },
        { x: cx + hw, y: cy + hhProjected },
        { x: cx - hw, y: cy + hhProjected },
      ]

      // All 4 corners must be inside the inset polygon
      if (!corners.every((c) => pointInPolygon(c, inset))) continue

      const worldCorners = corners.map((c) => rotatePt(c, ridgeAngle))
      const latLngCorners = worldCorners.map((c) => xyToLatLng(c, ref))

      panels.push({
        id: `panel-${idx++}`,
        enabled: true,
        corners: latLngCorners,
      })
    }
  }

  return panels
}

export const AZIMUTH_PRESETS: Record<string, number> = {
  South: 0,
  'South-West': 45,
  'South-East': -45,
  West: 90,
  East: -90,
}
