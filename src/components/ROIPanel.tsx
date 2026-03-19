import type { ROIInputs, ROIResult } from '../types'

interface Props {
  inputs: ROIInputs
  onChange: (inputs: ROIInputs) => void
  roi: ROIResult | null
  kWp: number
}

function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
        {prefix && (
          <span className="px-2 bg-gray-50 text-gray-500 text-sm border-r border-gray-200">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          step={step ?? 0.01}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 px-3 py-2 text-sm focus:outline-none"
        />
        {suffix && (
          <span className="px-2 bg-gray-50 text-gray-500 text-sm border-l border-gray-200">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

export function ROIPanel({ inputs, onChange, roi, kWp }: Props) {
  const set = (patch: Partial<ROIInputs>) => onChange({ ...inputs, ...patch })

  return (
    <div className="space-y-3">
      <Field
        label="Electricity price"
        value={inputs.elecPrice}
        onChange={(v) => set({ elecPrice: v })}
        prefix="€"
        suffix="/kWh"
        step={0.01}
      />
      <Field
        label="Installation cost"
        value={inputs.installCost}
        onChange={(v) => set({ installCost: v })}
        prefix="€"
        step={100}
      />
      <Field
        label="Self-consumption"
        value={Math.round(inputs.selfConsumptionPct * 100)}
        onChange={(v) => set({ selfConsumptionPct: v / 100 })}
        suffix="%"
        step={1}
      />
      <Field
        label="Injection tariff"
        value={inputs.injectionTariff}
        onChange={(v) => set({ injectionTariff: v })}
        prefix="€"
        suffix="/kWh"
        step={0.01}
      />
      <Field
        label="Annual price increase"
        value={Math.round(inputs.priceIncreasePct * 100)}
        onChange={(v) => set({ priceIncreasePct: v / 100 })}
        suffix="%"
        step={1}
      />

      {roi && kWp > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1 mt-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Year 1 savings</span>
            <span className="font-bold text-blue-700">
              € {Math.round(roi.year1Savings).toLocaleString('nl-BE')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payback period</span>
            <span className="font-bold text-blue-700">
              {isFinite(roi.paybackYears) ? `${roi.paybackYears.toFixed(1)} yr` : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">25-yr savings</span>
            <span className="font-bold text-green-600">
              € {Math.round(roi.savings25yr[24] ?? 0).toLocaleString('nl-BE')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
