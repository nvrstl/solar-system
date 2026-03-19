import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { ROIResult, PVGISResult } from '../types'

interface ExportParams {
  panelCount: number
  kWp: number
  pvgis: PVGISResult
  roi: ROIResult | null
  address: string
}

export async function exportPDF(params: ExportParams): Promise<void> {
  const { panelCount, kWp, pvgis, roi, address } = params

  const mapEl = document.getElementById('map-container')
  if (!mapEl) return

  const canvas = await html2canvas(mapEl, { useCORS: true, scale: 1.5 })
  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // ── Header ──────────────────────────────────────────────────
  pdf.setFillColor(30, 100, 255)
  pdf.rect(0, 0, pageW, 18, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('☀  Solar Roof Designer', 10, 12)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  const dateStr = new Date().toLocaleDateString('nl-BE')
  pdf.text(`Generated: ${dateStr}`, pageW - 10, 12, { align: 'right' })

  // ── Address ─────────────────────────────────────────────────
  pdf.setTextColor(40, 40, 40)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.text(address || 'Location not specified', 10, 28)

  // ── Map image ───────────────────────────────────────────────
  const imgW = pageW - 20
  const imgH = (canvas.height / canvas.width) * imgW
  const clampedH = Math.min(imgH, pageH - 80)
  pdf.addImage(imgData, 'JPEG', 10, 32, imgW, clampedH)

  const tableY = 32 + clampedH + 8

  // ── Stats table ─────────────────────────────────────────────
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(30, 100, 255)
  pdf.text('System Summary', 10, tableY)

  pdf.setDrawColor(200, 200, 200)
  pdf.setFillColor(245, 247, 255)
  pdf.rect(10, tableY + 3, pageW - 20, 30, 'FD')

  pdf.setTextColor(40, 40, 40)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  const col1 = 14, col2 = 75, col3 = 138
  let row = tableY + 11

  pdf.setFont('helvetica', 'bold')
  pdf.text('Panels', col1, row)
  pdf.text('System size', col2, row)
  pdf.text('Annual production', col3, row)
  row += 5
  pdf.setFont('helvetica', 'normal')
  pdf.text(`${panelCount} panels`, col1, row)
  pdf.text(`${kWp.toFixed(2)} kWp`, col2, row)
  pdf.text(pvgis.annualKWh > 0 ? `${Math.round(pvgis.annualKWh).toLocaleString('nl-BE')} kWh` : '—', col3, row)

  if (roi) {
    row += 8
    pdf.setFont('helvetica', 'bold')
    pdf.text('Year 1 savings', col1, row)
    pdf.text('Payback period', col2, row)
    pdf.text('25-yr cumulative', col3, row)
    row += 5
    pdf.setFont('helvetica', 'normal')
    pdf.text(`€ ${Math.round(roi.year1Savings).toLocaleString('nl-BE')}`, col1, row)
    pdf.text(
      isFinite(roi.paybackYears) ? `${roi.paybackYears.toFixed(1)} years` : '—',
      col2,
      row
    )
    pdf.text(`€ ${Math.round(roi.savings25yr[24] ?? 0).toLocaleString('nl-BE')}`, col3, row)
  }

  // ── Footer ───────────────────────────────────────────────────
  pdf.setFontSize(8)
  pdf.setTextColor(150, 150, 150)
  pdf.text('Generated with Solar Roof Designer  •  PVGIS EU data', pageW / 2, pageH - 6, {
    align: 'center',
  })

  const safeName = (address || 'quote').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  pdf.save(`solar-quote-${safeName}.pdf`)
}
