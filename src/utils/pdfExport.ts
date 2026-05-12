import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { ROIResult, PVGISResult } from '../types'

interface ExportParams {
  panelCount: number
  kWp: number
  pvgis: PVGISResult
  roi: ROIResult | null
  address: string
  clientName: string
}

// Homate brand palette (from the 2026 pitch deck).
const NAVY: [number, number, number] = [5, 22, 38]
const NAVY_SOFT: [number, number, number] = [15, 33, 51]
const MINT: [number, number, number] = [26, 209, 122]
const MINT_SOFT: [number, number, number] = [216, 244, 229]
const TEXT_DARK: [number, number, number] = [5, 22, 38]
const TEXT_MUTED: [number, number, number] = [120, 132, 144]
const WHITE: [number, number, number] = [255, 255, 255]

// Stylised "homate" hex/house mark, drawn as a stroked path.
function drawHomateMark(
  pdf: jsPDF,
  cx: number,
  cy: number,
  r: number,
  rgb: [number, number, number],
) {
  pdf.setDrawColor(rgb[0], rgb[1], rgb[2])
  pdf.setLineWidth(0.9)
  pdf.setLineJoin('round')
  const pts: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  for (let i = 0; i < 6; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % 6]
    pdf.line(x1, y1, x2, y2)
  }
  // Small chimney bump on the upper-right edge (matches the deck logo).
  const [tx, ty] = pts[0]
  pdf.line(tx + 0.5, ty - 1.2, tx + 1.6, ty - 1.2)
  pdf.line(tx + 0.5, ty - 1.2, tx + 0.5, ty + 0.2)
  pdf.line(tx + 1.6, ty - 1.2, tx + 1.6, ty + 0.2)
}

export async function exportPDF(params: ExportParams): Promise<void> {
  const { panelCount, kWp, pvgis, roi, address, clientName } = params

  const mapEl = document.getElementById('map-container')
  if (!mapEl) return

  const canvas = await html2canvas(mapEl, { useCORS: true, scale: 1.5 })
  const imgData = canvas.toDataURL('image/jpeg', 0.92)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // ── Header: navy band with homate wordmark ──────────────────
  const headerH = 32
  pdf.setFillColor(...NAVY)
  pdf.rect(0, 0, pageW, headerH, 'F')

  // Hex mark + wordmark
  drawHomateMark(pdf, 14, 16, 4.5, MINT)
  pdf.setTextColor(...WHITE)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('homate', 21, 18)

  // Right side: proposal label
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(170, 200, 215)
  pdf.text('SOLAR INSTALLATION PROPOSAL', pageW - 10, 13, { align: 'right' })

  pdf.setFontSize(8)
  const dateStr = new Date().toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  pdf.setTextColor(140, 170, 185)
  pdf.text(dateStr, pageW - 10, 19, { align: 'right' })

  // Mint accent line under header
  pdf.setFillColor(...MINT)
  pdf.rect(0, headerH, pageW, 1, 'F')

  // ── Klant + Locatie (two-column) ────────────────────────────
  let cursorY = headerH + 12
  const halfW = (pageW - 20) / 2

  pdf.setTextColor(...TEXT_MUTED)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('KLANT', 10, cursorY)
  pdf.text('LOCATIE', 10 + halfW, cursorY)

  cursorY += 6
  pdf.setTextColor(...TEXT_DARK)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)

  const safeClient = clientName?.trim() || 'Naam niet opgegeven'
  const safeAddress = address?.trim() || 'Locatie niet opgegeven'

  // Wrap long values to the half-column width so they don't overlap.
  const clientLines = pdf.splitTextToSize(safeClient, halfW - 4)
  const addressLines = pdf.splitTextToSize(safeAddress, halfW - 4)
  pdf.text(clientLines, 10, cursorY)
  pdf.text(addressLines, 10 + halfW, cursorY)

  const linesUsed = Math.max(
    Array.isArray(clientLines) ? clientLines.length : 1,
    Array.isArray(addressLines) ? addressLines.length : 1,
  )

  // ── Map image ───────────────────────────────────────────────
  cursorY += 4 + linesUsed * 5
  const imgW = pageW - 20
  const imgH = (canvas.height / canvas.width) * imgW
  const clampedH = Math.min(imgH, 100)

  // Thin navy border around the map
  pdf.setDrawColor(...NAVY)
  pdf.setLineWidth(0.4)
  pdf.rect(10, cursorY, imgW, clampedH)
  pdf.addImage(imgData, 'JPEG', 10, cursorY, imgW, clampedH)

  cursorY += clampedH + 10

  // ── System summary card (navy with mint numbers) ───────────
  const cardH = 38
  pdf.setFillColor(...NAVY)
  pdf.rect(10, cursorY, pageW - 20, cardH, 'F')
  pdf.setFillColor(...MINT)
  pdf.rect(10, cursorY, 1.2, cardH, 'F') // mint accent stripe

  pdf.setTextColor(170, 200, 215)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.text('JOUW INSTALLATIE', 14, cursorY + 7)

  const colW = (pageW - 20) / 3
  const stats: { label: string; value: string }[] = [
    { label: 'AANTAL PANELEN', value: `${panelCount}` },
    { label: 'VERMOGEN', value: `${kWp.toFixed(2)} kWp` },
    {
      label: 'JAARLIJKSE OPBRENGST',
      value:
        pvgis.annualKWh > 0
          ? `${Math.round(pvgis.annualKWh).toLocaleString('nl-BE')} kWh`
          : '—',
    },
  ]

  stats.forEach((s, i) => {
    const cx = 14 + colW * i
    pdf.setTextColor(140, 170, 185)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7.5)
    pdf.text(s.label, cx, cursorY + 17)
    pdf.setTextColor(...MINT)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(18)
    pdf.text(s.value, cx, cursorY + 28)
  })

  cursorY += cardH + 8

  // ── ROI / savings (mint-tinted card) ───────────────────────
  if (roi) {
    const roiH = 34
    pdf.setFillColor(...MINT_SOFT)
    pdf.rect(10, cursorY, pageW - 20, roiH, 'F')
    pdf.setDrawColor(...MINT)
    pdf.setLineWidth(0.3)
    pdf.line(10, cursorY, 10, cursorY + roiH)

    pdf.setTextColor(...NAVY_SOFT)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text('JOUW BESPARING', 14, cursorY + 7)

    const roiStats: { label: string; value: string }[] = [
      {
        label: 'BESPARING JAAR 1',
        value: `€ ${Math.round(roi.year1Savings).toLocaleString('nl-BE')}`,
      },
      {
        label: 'TERUGVERDIENTIJD',
        value: isFinite(roi.paybackYears)
          ? `${roi.paybackYears.toFixed(1)} jaar`
          : '—',
      },
      {
        label: 'CUMULATIEF NA 25 JAAR',
        value: `€ ${Math.round(roi.savings25yr[24] ?? 0).toLocaleString('nl-BE')}`,
      },
    ]

    roiStats.forEach((s, i) => {
      const cx = 14 + colW * i
      pdf.setTextColor(...TEXT_MUTED)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(7.5)
      pdf.text(s.label, cx, cursorY + 17)
      pdf.setTextColor(...TEXT_DARK)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(15)
      pdf.text(s.value, cx, cursorY + 27)
    })

    cursorY += roiH + 6
  }

  // ── Footer ───────────────────────────────────────────────────
  const footerY = pageH - 16
  pdf.setDrawColor(220, 226, 232)
  pdf.setLineWidth(0.2)
  pdf.line(10, footerY - 2, pageW - 10, footerY - 2)

  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(...TEXT_MUTED)
  pdf.text(
    'Deze offerte is een voorlopige schatting op basis van satellietbeelden en publieke zonneproductiedata.',
    10,
    footerY + 2,
  )
  pdf.text(
    'Definitieve prijs en opbrengst worden bevestigd na een gratis plaatsbezoek door een Homate-gecertificeerde installateur.',
    10,
    footerY + 6,
  )

  pdf.setTextColor(...NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.text('homate.be', pageW - 10, footerY + 4, { align: 'right' })

  const slug = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()

  const namePart = slug(clientName) || slug(address) || 'offerte'
  pdf.save(`homate-zonnepanelen-${namePart}.pdf`)
}
