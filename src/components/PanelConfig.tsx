import { PANEL_MODELS } from '../constants/panels'
import type { Orientation, PanelModel } from '../types'

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
  orientation: Orientation
  onOrientationChange: (o: Orientation) => void
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
  orientation,
  onOrientationChange,
  tilt,
  onTiltChange,
  azimuth,
  onAzimuthChange,
  margin,
  onMarginChange,
}: Props) {
  const areaM2 = model.longSideM * model.shortSideM
  const wPerM2 = model.watts / areaM2

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
              {m.custom
                ? m.name
                : `${m.name} — ${m.longSideM}×${m.shortSideM} m`}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {model.watts} W · {areaM2.toFixed(2)} m² · {wPerM2.toFixed(0)} W/m²
        </p>
      </div>

      {model.custom && (
        <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <NumberField
            label="Watts"
            value={model.watts}
            step={5}
            min={100}
            max={800}
            onChange={(v) => onModelChange({ ...model, watts: v })}
          />
          <NumberField
            label="Long (m)"
            value={model.longSideM}
            step={0.01}
            min={0.5}
            max={3}
            onChange={(v) => onModelChange({ ...model, longSideM: v })}
          />
          <NumberField
            label="Short (m)"
            value={model.shortSideM}
            step={0.01}
            min={0.4}
            max={2}
            onChange={(v) => onModelChange({ ...model, shortSideM: v })}
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
          Orientation
        </label>
        <div className="grid grid-cols-2 gap-2">
          <OrientationButton
            active={orientation === 'landscape'}
            onClick={() => onOrientationChange('landscape')}
            label="Landscape"
            sub="long edge along ridge"
            iconLong={28}
            iconShort={16}
          />
          <OrientationButton
            active={orientation === 'portrait'}
            onClick={() => onOrientationChange('portrait')}
            label="Portrait"
            sub="long edge up the slope"
            iconLong={16}
            iconShort={28}
          />
        </div>
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

function NumberField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  step: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
        {label}
      </span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n)) onChange(n)
        }}
        className="w-full border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  )
}

function OrientationButton({
  active,
  onClick,
  label,
  sub,
  iconLong,
  iconShort,
}: {
  active: boolean
  onClick: () => void
  label: string
  sub: string
  iconLong: number
  iconShort: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-sm transition-colors ${
        active
          ? 'bg-blue-50 border-blue-400 text-blue-700'
          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
      }`}
    >
      <span
        className={`inline-block rounded-sm ${
          active ? 'bg-blue-500' : 'bg-gray-400'
        }`}
        style={{ width: iconLong, height: iconShort }}
      />
      <span className="flex flex-col leading-tight">
        <span className="font-semibold">{label}</span>
        <span className="text-[10px] text-gray-400">{sub}</span>
      </span>
    </button>
  )
}
