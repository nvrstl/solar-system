export interface LatLng {
  lat: number
  lng: number
}

export interface Panel {
  id: string
  enabled: boolean
  corners: LatLng[] // 4 corners
}

export interface PanelModel {
  name: string
  watts: number
  widthM: number
  heightM: number
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
}

export interface ROIResult {
  year1Savings: number
  paybackYears: number
  savings25yr: number[]
}
