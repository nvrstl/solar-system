import type { Panel, PanelModel, ROIInputs, ROIResult, PVGISResult } from '../types'
import { PanelConfig } from './PanelConfig'
import { ROIPanel } from './ROIPanel'
import { ExportButton } from './ExportButton'

interface Props {
  // Address
  address: string
  onAddressChange: (a: string) => void

  // Panel config
  model: PanelModel
  onModelChange: (m: PanelModel) => void
  tilt: number
  onTiltChange: (t: number) => void
  azimuth: number
  onAzimuthChange: (deg: number) => void
  margin: number
  onMarginChange: (m: number) => void

  // Results
  panels: Panel[]
  kWp: number
  pvgis: PVGISResult

  // ROI
  roiInputs: ROIInputs
  onROIInputsChange: (inputs: ROIInputs) => void
  roi: ROIResult | null
}

export function Sidebar({
  address,
  onAddressChange,
  model,
  onModelChange,
  tilt,
  onTiltChange,
  azimuth,
  onAzimuthChange,
  margin,
  onMarginChange,
  panels,
  kWp,
  pvgis,
  roiInputs,
  onROIInputsChange,
  roi,
}: Props) {
  const enabledCount = panels.filter((p) => p.enabled).length

  return (
    <aside className="w-[380px] min-w-[320px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
      {/* Address search */}
      <div className="p-4 border-b border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Address / Location
        </label>
        <input
          id="address-search"
          type="text"
          placeholder="Search address…"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Panel config */}
      <Section title="Panel Configuration">
        <PanelConfig
          model={model}
          onModelChange={onModelChange}
          tilt={tilt}
          onTiltChange={onTiltChange}
          azimuth={azimuth}
          onAzimuthChange={onAzimuthChange}
          margin={margin}
          onMarginChange={onMarginChange}
        />
      </Section>

      {/* Results */}
      <Section title="System Results">
        <div className="grid grid-cols-3 gap-2">
          <Stat
            label="Panels"
            value={enabledCount.toString()}
            sub={`of ${panels.length}`}
          />
          <Stat
            label="System"
            value={`${kWp.toFixed(2)}`}
            sub="kWp"
          />
          <Stat
            label="Annual"
            value={pvgis.loading ? '…' : pvgis.annualKWh > 0 ? Math.round(pvgis.annualKWh).toLocaleString('nl-BE') : '—'}
            sub="kWh"
          />
        </div>
        {pvgis.error && (
          <p className="text-xs text-red-500 mt-2">PVGIS: {pvgis.error}</p>
        )}
        {pvgis.loading && (
          <p className="text-xs text-blue-500 mt-2 animate-pulse">Fetching PVGIS data…</p>
        )}
      </Section>

      {/* ROI */}
      <Section title="ROI Calculator">
        <ROIPanel
          inputs={roiInputs}
          onChange={onROIInputsChange}
          roi={roi}
          kWp={kWp}
        />
      </Section>

      {/* Export */}
      <div className="p-4 mt-auto border-t border-gray-100">
        <ExportButton
          panelCount={enabledCount}
          kWp={kWp}
          pvgis={pvgis}
          roi={roi}
          address={address}
        />
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 border-b border-gray-100">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-blue-50 rounded-xl p-3 text-center">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-lg font-bold text-blue-700">{value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  )
}
