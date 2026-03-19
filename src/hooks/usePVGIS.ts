import { useState, useEffect } from 'react'
import type { PVGISResult } from '../types'

interface PVGISParams {
  lat: number
  lng: number
  kWp: number
  tiltDeg: number
  azimuthDeg: number // 0=South, -90=East, 90=West
}

export function usePVGIS(params: PVGISParams | null): PVGISResult {
  const [result, setResult] = useState<PVGISResult>({
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
        setResult({ annualKWh, loading: false, error: null })
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setResult({ annualKWh: 0, loading: false, error: String(err.message) })
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
