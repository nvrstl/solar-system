import { useState, useEffect } from 'react'
import type { PVGISResult } from '../types'

interface PVGISParams {
  lat: number
  lng: number
  kWp: number
  tiltDeg: number
  azimuthDeg: number // 0=South, -90=East, 90=West
}

// Local fallback when PVGIS is unreachable (CORS / offline).
// Approximates PVGIS within ~5–10% across NW Europe.
function estimateAnnualKWh(
  kWp: number,
  lat: number,
  tiltDeg: number,
  azimuthDeg: number,
  systemLoss = 0.14,
): number {
  // Base optimal yield (kWh/kWp/yr) at lat 50° ≈ 1050 (Belgium).
  // Linear adjust ±30 kWh/kWp per degree of latitude.
  const baseYield = 1050 + (50 - Math.abs(lat)) * 30

  // Tilt loss — peak around 35°, fall off either side.
  const tiltDelta = tiltDeg - 35
  const tiltFactor = Math.max(0.55, 1 - tiltDelta * tiltDelta * 0.00015)

  // Azimuth loss (0°=south, ±180°=north).
  const azRad = (Math.min(Math.abs(azimuthDeg), 180) * Math.PI) / 180
  const azFactor = 0.6 + 0.4 * Math.cos(azRad)

  return kWp * baseYield * tiltFactor * azFactor * (1 - systemLoss)
}

export function usePVGIS(params: PVGISParams | null): PVGISResult & { source?: 'pvgis' | 'estimate' } {
  const [result, setResult] = useState<PVGISResult & { source?: 'pvgis' | 'estimate' }>({
    annualKWh: 0,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!params || params.kWp <= 0) {
      setResult({ annualKWh: 0, loading: false, error: null })
      return
    }

    const controller = new AbortController()

    const url = new URL('https://re.jrc.ec.europa.eu/api/v5_2/PVcalc')
    url.searchParams.set('lat', params.lat.toFixed(6))
    url.searchParams.set('lon', params.lng.toFixed(6))
    url.searchParams.set('peakpower', params.kWp.toFixed(3))
    url.searchParams.set('loss', '14')
    url.searchParams.set('angle', params.tiltDeg.toString())
    url.searchParams.set('aspect', params.azimuthDeg.toString())
    url.searchParams.set('outputformat', 'json')

    setResult((r) => ({ ...r, loading: true, error: null }))

    fetch(url.toString(), { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`PVGIS error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const annualKWh = (data as any)?.outputs?.totals?.fixed?.E_y ?? 0
        setResult({ annualKWh, loading: false, error: null, source: 'pvgis' })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        // Fall back to local estimate so the UI keeps working.
        const annualKWh = estimateAnnualKWh(
          params.kWp,
          params.lat,
          params.tiltDeg,
          params.azimuthDeg,
        )
        setResult({
          annualKWh,
          loading: false,
          error: null,
          source: 'estimate',
        })
        // Keep the original error on the console for debugging.
        console.warn('PVGIS unreachable, using local estimate:', err.message)
      })

    return () => controller.abort()
  }, [
    params?.lat,
    params?.lng,
    params?.kWp,
    params?.tiltDeg,
    params?.azimuthDeg,
  ])

  return result
}
