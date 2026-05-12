export interface LatLng {
  lat: number
  lng: number
}

export interface Panel {
  id: string
  enabled: boolean
  corners: LatLng[] // 4 corners
}

export type Orientation = 'landscape' | 'portrait'

export interface PanelModel {
  name: string
  watts: number
  longSideM: number  // physical long edge of the module
  shortSideM: number // physical short edge of the module
  custom?: boolean
}

export interface ROIInputs {
  elecPrice: number        // €/kWh
  installCost: number      // €
  selfConsumptionPct: number // 0–1
  injectionTariff: number  // €/kWh
  priceIncreasePct: number // annual % as decimal e.g. 0.03
}

export interface PVGISResult {
  annualKWh: number
  loading: boolean
  error: string | null
  source?: 'pvgis' | 'estimate'
}

export interface ROIResult {
  year1Savings: number
  paybackYears: number
  savings25yr: number[]
}
