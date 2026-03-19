import { PANEL_MODELS } from '../constants/panels'
import type { PanelModel } from '../types'

function azimuthLabel(deg: number): string {
  if (deg >= -22.5 && deg < 22.5) return 'S'
  if (deg >= 22.5 && deg < 67.5) return 'SW'
  if (deg >= 67.5 && deg < 112.5) return 'W'
  if (deg >= 112.5 && deg < 157.5) return 'NW'
  if (deg >= 157.5 || deg < -157.5) return 'N'
  if (deg >= -157.5 && deg < -112.5) return 'NE'
  if (deg >= -112.5 && deg < -67.5) return 'E'
  if (deg >= -67.5 && deg < -22.5) return 'SE'
  return 'S'
}

interface Props {
  model: PanelModel
  onModelChange: (m: PanelModel) => void
  tilt: number
  onTiltChange: (t: number) => void
  azimuth: number
  onAzimuthChange: (deg: number) => void
  margin: number
  onMarginChange: (m: number) => void
}

export function PanelConfig({
  model,
  onModelChange,
  tilt,
  onTiltChange,
  azimuth,
  onAzimuthChange,
  margin,
  onMarginChange,
}: Props) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Panel Model
        </label>
        <select
          value={model.name}
          onChange={(e) => {
            const m = PANEL_MODELS.find((p) => p.name === e.target.value)
            if (m) onModelChange(m)
          }}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PANEL_MODELS.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name} ({m.widthM}m × {m.heightM}m)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Roof Tilt: {tilt}°
        </label>
        <input
          type="range"
          min={0}
          max={60}
          value={tilt}
          onChange={(e) => onTiltChange(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>0° flat</span>
          <span>60°</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Slope Direction: {azimuth}° {azimuthLabel(azimuth)}
        </label>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={azimuth}
          onChange={(e) => onAzimuthChange(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>N (-180°)</span>
          <span>S (0°)</span>
          <span>N (180°)</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Safety Margin: {margin.toFixed(2)} m
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={margin}
          onChange={(e) => onMarginChange(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>0 m</span>
          <span>1 m</span>
        </div>
      </div>
    </div>
  )
}
