import { useState } from 'react'
import { exportPDF } from '../utils/pdfExport'
import type { PVGISResult, ROIResult } from '../types'

interface Props {
  panelCount: number
  kWp: number
  pvgis: PVGISResult
  roi: ROIResult | null
  address: string
}

export function ExportButton({ panelCount, kWp, pvgis, roi, address }: Props) {
  const [exporting, setExporting] = useState(false)

  const handleClick = async () => {
    setExporting(true)
    try {
      await exportPDF({ panelCount, kWp, pvgis, roi, address })
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={exporting || panelCount === 0}
      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
    >
      {exporting ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Generating PDF…
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
          </svg>
          Export PDF Quote
        </>
      )}
    </button>
  )
}
