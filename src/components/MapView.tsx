import { useEffect, useRef, useCallback, useState } from 'react'
import type { Panel, PanelModel, LatLng } from '../types'
import { fillRoofWithPanels } from '../utils/panelLayout'
import { GUTTER_X, GUTTER_Y } from '../constants/panels'

interface Props {
  isLoaded: boolean
  model: PanelModel
  tilt: number
  azimuth: number
  margin: number
  panels: Panel[]
  onPanelsChange: (panels: Panel[]) => void
  onRoofCentroid: (latLng: LatLng) => void
  onResetRoof: () => void
}

const ENABLED_STYLE = {
  fillColor: '#1E64FF',
  fillOpacity: 0.7,
  strokeColor: '#FFD700',
  strokeWeight: 1.5,
}

const MOVE_ENABLED_STYLE = {
  fillColor: '#1E64FF',
  fillOpacity: 0.7,
  strokeColor: '#00FF88',
  strokeWeight: 1.5,
}

const DISABLED_STYLE = {
  fillColor: '#888888',
  fillOpacity: 0.2,
  strokeColor: '#555555',
  strokeWeight: 1,
}

export function MapView({
  isLoaded,
  model,
  tilt,
  azimuth,
  margin,
  panels,
  onPanelsChange,
  onRoofCentroid,
  onResetRoof,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)

  // Multiple roof areas
  const roofPolygonsRef = useRef<google.maps.Polygon[]>([])
  const roofLatLngsRef = useRef<LatLng[][]>([])
  const panelPolygonsRef = useRef<google.maps.Polygon[]>([])

  // Track drawn area count for button visibility
  const [areaCount, setAreaCount] = useState(0)

  // Move mode
  const [moveMode, setMoveMode] = useState(false)

  // Drag tracking
  const isDraggingRef = useRef(false)
  const dragStartLatLngRef = useRef<{ lat: number; lng: number } | null>(null)
  const panelsCopyRef = useRef<Panel[]>([])

  // Stable refs to avoid stale closures in map init effect
  const onPanelsChangeRef = useRef(onPanelsChange)
  useEffect(() => { onPanelsChangeRef.current = onPanelsChange }, [onPanelsChange])

  const onRoofCentroidRef = useRef(onRoofCentroid)
  useEffect(() => { onRoofCentroidRef.current = onRoofCentroid }, [onRoofCentroid])

  const azimuthRef = useRef(azimuth)
  useEffect(() => { azimuthRef.current = azimuth }, [azimuth])

  const modelRef = useRef(model)
  useEffect(() => { modelRef.current = model }, [model])

  const tiltRef = useRef(tilt)
  useEffect(() => { tiltRef.current = tilt }, [tilt])

  const marginRef = useRef(margin)
  useEffect(() => { marginRef.current = margin }, [margin])

  // Arrow keys: nudge all panels (0.1 m, Shift = 1 m)
  useEffect(() => {
    if (panels.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return
      e.preventDefault()

      const step = e.shiftKey ? 1.0 : 0.1
      const refLat = panels[0].corners[0].lat
      const mPerLat = 111320
      const mPerLng = 111320 * Math.cos((refLat * Math.PI) / 180)

      let dLat = 0
      let dLng = 0
      if (e.key === 'ArrowUp') dLat = step / mPerLat
      if (e.key === 'ArrowDown') dLat = -step / mPerLat
      if (e.key === 'ArrowRight') dLng = step / mPerLng
      if (e.key === 'ArrowLeft') dLng = -step / mPerLng

      onPanelsChangeRef.current(
        panels.map((p) => ({
          ...p,
          corners: p.corners.map((c) => ({ lat: c.lat + dLat, lng: c.lng + dLng })),
        }))
      )
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [panels])

  // Re-render panel polygons when panels state or moveMode changes
  const renderPanelPolygons = useCallback(
    (panelList: Panel[]) => {
      if (!mapRef.current) return

      panelPolygonsRef.current.forEach((p) => p.setMap(null))
      panelPolygonsRef.current = []

      panelList.forEach((panel) => {
        const style = panel.enabled ? (moveMode ? MOVE_ENABLED_STYLE : ENABLED_STYLE) : DISABLED_STYLE

        const polyOptions: google.maps.PolygonOptions & { cursor?: string } = {
          paths: panel.corners,
          map: mapRef.current,
          clickable: true,
          cursor: moveMode ? 'grab' : 'pointer',
          ...style,
        }
        const poly = new google.maps.Polygon(polyOptions)

        if (moveMode) {
          poly.addListener('mousedown', (e: google.maps.MapMouseEvent) => {
            if (!e.latLng) return
            isDraggingRef.current = true
            dragStartLatLngRef.current = { lat: e.latLng.lat(), lng: e.latLng.lng() }
            panelsCopyRef.current = panelList.map((p) => ({
              ...p,
              corners: p.corners.map((c) => ({ ...c })),
            }))
            panelPolygonsRef.current.forEach((p) => p.setOptions({ clickable: false }))
            mapRef.current!.setOptions({ draggable: false })
          })
        } else {
          poly.addListener('click', () => {
            onPanelsChange(
              panelList.map((p) =>
                p.id === panel.id ? { ...p, enabled: !p.enabled } : p
              )
            )
          })
        }

        panelPolygonsRef.current.push(poly)
      })
    },
    [onPanelsChange, moveMode]
  )

  // Fill panels for all current roof areas, assigning globally unique IDs
  const refillAllAreas = useCallback((
    allLatLngs: LatLng[][],
    m: PanelModel,
    t: number,
    az: number,
    mg: number
  ): Panel[] => {
    const allPanels: Panel[] = []
    let globalIdx = 0
    for (const latLngs of allLatLngs) {
      const areaPanels = fillRoofWithPanels(latLngs, m, GUTTER_X, GUTTER_Y, -az, t, mg)
      for (const p of areaPanels) {
        allPanels.push({ ...p, id: `panel-${globalIdx++}` })
      }
    }
    return allPanels
  }, [])

  // Init map once
  useEffect(() => {
    if (!isLoaded || !mapDivRef.current || mapRef.current) return

    const map = new google.maps.Map(mapDivRef.current, {
      center: { lat: 51.0543, lng: 3.7174 },
      zoom: 20,
      mapTypeId: 'satellite',
      tilt: 0,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapRef.current = map

    const inputEl = document.getElementById('address-search') as HTMLInputElement | null
    if (inputEl) {
      const autocomplete = new google.maps.places.Autocomplete(inputEl, {
        types: ['geocode'],
      })
      autocomplete.bindTo('bounds', map)
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.geometry?.location) {
          map.panTo(place.geometry.location)
          map.setZoom(20)
        }
      })
    }

    map.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
      if (!isDraggingRef.current || !dragStartLatLngRef.current || !e.latLng) return
      const dLat = e.latLng.lat() - dragStartLatLngRef.current.lat
      const dLng = e.latLng.lng() - dragStartLatLngRef.current.lng
      panelPolygonsRef.current.forEach((poly, i) => {
        const panel = panelsCopyRef.current[i]
        if (!panel) return
        poly.setPath(panel.corners.map((c) => new google.maps.LatLng(c.lat + dLat, c.lng + dLng)))
      })
    })

    map.addListener('mouseup', (e: google.maps.MapMouseEvent) => {
      if (!isDraggingRef.current || !dragStartLatLngRef.current) return
      isDraggingRef.current = false
      mapRef.current!.setOptions({ draggable: true })

      if (!e.latLng) {
        dragStartLatLngRef.current = null
        panelsCopyRef.current = []
        return
      }

      const dLat = e.latLng.lat() - dragStartLatLngRef.current.lat
      const dLng = e.latLng.lng() - dragStartLatLngRef.current.lng
      const newPanels = panelsCopyRef.current.map((p) => ({
        ...p,
        corners: p.corners.map((c) => ({ lat: c.lat + dLat, lng: c.lng + dLng })),
      }))

      dragStartLatLngRef.current = null
      panelsCopyRef.current = []
      onPanelsChangeRef.current(newPanels)
    })

    const dm = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: '#FF6600',
        fillOpacity: 0.25,
        strokeColor: '#FF6600',
        strokeWeight: 2,
        editable: false,
        clickable: false,
      },
    })
    dm.setMap(map)
    drawingManagerRef.current = dm

    dm.addListener('polygoncomplete', (polygon: google.maps.Polygon) => {
      // Accumulate — don't remove previous areas
      roofPolygonsRef.current.push(polygon)

      const path = polygon.getPath()
      const latLngs: LatLng[] = []
      for (let i = 0; i < path.getLength(); i++) {
        const v = path.getAt(i)
        latLngs.push({ lat: v.lat(), lng: v.lng() })
      }
      roofLatLngsRef.current.push(latLngs)

      // Centroid across all areas
      const allPoints = roofLatLngsRef.current.flat()
      const centLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length
      const centLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length
      onRoofCentroidRef.current({ lat: centLat, lng: centLng })

      // Switch back to polygon mode so next area can be drawn immediately
      dm.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)

      const newPanels = refillAllAreas(
        roofLatLngsRef.current,
        modelRef.current,
        tiltRef.current,
        azimuthRef.current,
        marginRef.current,
      )
      onPanelsChangeRef.current(newPanels)
      setAreaCount(roofLatLngsRef.current.length)
    })
  }, [isLoaded, refillAllAreas]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fill panels when model/tilt/azimuth changes
  useEffect(() => {
    if (!roofLatLngsRef.current.length) return
    const newPanels = refillAllAreas(roofLatLngsRef.current, model, tilt, azimuth, margin)
    onPanelsChange(newPanels)
  }, [model, tilt, azimuth, margin]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync panel polygon visuals
  useEffect(() => {
    renderPanelPolygons(panels)
  }, [panels, renderPanelPolygons])

  const handleReset = () => {
    roofPolygonsRef.current.forEach((p) => p.setMap(null))
    roofPolygonsRef.current = []
    roofLatLngsRef.current = []
    panelPolygonsRef.current.forEach((p) => p.setMap(null))
    panelPolygonsRef.current = []
    drawingManagerRef.current?.setDrawingMode(google.maps.drawing.OverlayType.POLYGON)
    setMoveMode(false)
    setAreaCount(0)
    onResetRoof()
  }

  return (
    <div className="relative w-full h-full" id="map-container">
      <div ref={mapDivRef} className="w-full h-full" />

      {areaCount > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {panels.length > 0 && (
            <button
              onClick={() => setMoveMode((m) => !m)}
              title="Drag panels or use arrow keys (Shift = larger step)"
              className={`shadow-lg border text-sm font-semibold px-4 py-2 rounded-full transition-colors ${
                moveMode
                  ? 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {moveMode ? '✋ Moving — drag or ↑↓←→' : '✋ Move Panels'}
            </button>
          )}

          <button
            onClick={handleReset}
            className="bg-white shadow-lg border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-full hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
          >
            ↺ Reset All
          </button>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm">Loading map…</p>
          </div>
        </div>
      )}
    </div>
  )
}
