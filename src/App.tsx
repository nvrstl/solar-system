import { useState, useMemo } from 'react'
import { ApiKeyModal } from './components/ApiKeyModal'
import { MapView } from './components/MapView'
import { Sidebar } from './components/Sidebar'
import { useGoogleMaps } from './hooks/useGoogleMaps'
import { usePVGIS } from './hooks/usePVGIS'
import { calcROI } from './utils/roiCalc'
import { PANEL_MODELS } from './constants/panels'
import type { Panel, PanelModel, ROIInputs, LatLng } from './types'

const DEFAULT_ROI: ROIInputs = {
  elecPrice: 0.28,
  installCost: 8000,
  selfConsumptionPct: 0.7,
  injectionTariff: 0.05,
  priceIncreasePct: 0.03,
}

export default function App() {
  // API key
  const [apiKey, setApiKey] = useState<string | null>(
    () => localStorage.getItem('gmaps_api_key')
  )
  const [showKeyModal, setShowKeyModal] = useState(!apiKey)

  const { isLoaded, error: mapsError } = useGoogleMaps(apiKey)

  // Address
  const [address, setAddress] = useState('')

  // Panel config
  const [model, setModel] = useState<PanelModel>(PANEL_MODELS[0])
  const [tilt, setTilt] = useState(35)
  const [azimuth, setAzimuth] = useState(0)
  const [margin, setMargin] = useState(0.3)

  // Panels state
  const [panels, setPanels] = useState<Panel[]>([])
  const [roofCentroid, setRoofCentroid] = useState<LatLng | null>(null)

  // Derived: enabled panels + kWp
  const enabledPanels = panels.filter((p) => p.enabled)
  const kWp = (enabledPanels.length * model.watts) / 1000

  // PVGIS
  const pvgisParams = useMemo(
    () =>
      roofCentroid && kWp > 0
        ? {
            lat: roofCentroid.lat,
            lng: roofCentroid.lng,
            kWp,
            tiltDeg: tilt,
            azimuthDeg: azimuth,
          }
        : null,
    [roofCentroid, kWp, tilt, azimuth]
  )
  const pvgis = usePVGIS(pvgisParams)

  // ROI
  const [roiInputs, setROIInputs] = useState<ROIInputs>(DEFAULT_ROI)
  const roi = useMemo(
    () => (pvgis.annualKWh > 0 ? calcROI(pvgis.annualKWh, roiInputs) : null),
    [pvgis.annualKWh, roiInputs]
  )

  const handlePanelsChange = (newPanels: Panel[]) => {
    setPanels(newPanels)
  }

  const handleRoofCentroid = (latLng: LatLng) => {
    setRoofCentroid(latLng)
  }

  const handleResetRoof = () => {
    setPanels([])
    setRoofCentroid(null)
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="font-bold text-gray-800 text-base">Solar Roof Designer</span>
        </div>
        <div className="flex items-center gap-3">
          {mapsError && (
            <span className="text-xs text-red-500">{mapsError}</span>
          )}
          <button
            onClick={() => setShowKeyModal(true)}
            className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            API Key
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          address={address}
          onAddressChange={setAddress}
          model={model}
          onModelChange={setModel}
          tilt={tilt}
          onTiltChange={setTilt}
          azimuth={azimuth}
          onAzimuthChange={setAzimuth}
          margin={margin}
          onMarginChange={setMargin}
          panels={panels}
          kWp={kWp}
          pvgis={pvgis}
          roiInputs={roiInputs}
          onROIInputsChange={setROIInputs}
          roi={roi}
        />
        <main className="flex-1 relative overflow-hidden">
          <MapView
            isLoaded={isLoaded}
            model={model}
            tilt={tilt}
            azimuth={azimuth}
            margin={margin}
            panels={panels}
            onPanelsChange={handlePanelsChange}
            onRoofCentroid={handleRoofCentroid}
            onResetRoof={handleResetRoof}
          />
        </main>
      </div>

      {/* API Key modal */}
      {showKeyModal && (
        <ApiKeyModal
          onSave={(key) => {
            setApiKey(key)
            setShowKeyModal(false)
          }}
        />
      )}
    </div>
  )
}
