import type { ROIInputs, ROIResult } from '../types'

export function calcROI(annualKWh: number, inputs: ROIInputs): ROIResult {
  const { elecPrice, installCost, selfConsumptionPct, injectionTariff, priceIncreasePct } = inputs

  const selfConsumed = annualKWh * selfConsumptionPct
  const injected = annualKWh * (1 - selfConsumptionPct)
  const year1Savings = selfConsumed * elecPrice + injected * injectionTariff

  const paybackYears = year1Savings > 0 ? installCost / year1Savings : Infinity

  // 25-year cumulative savings
  const savings25yr: number[] = []
  let cumulative = 0
  for (let n = 1; n <= 25; n++) {
    const yearSavings = year1Savings * Math.pow(1 + priceIncreasePct, n - 1)
    cumulative += yearSavings
    savings25yr.push(cumulative)
  }

  return { year1Savings, paybackYears, savings25yr }
}
