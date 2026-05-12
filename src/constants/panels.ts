import type { PanelModel } from '../types'

// Real spec-sheet dimensions (long side × short side, in meters).
// Sources: manufacturer datasheets (JinkoSolar Tiger Neo, JA Solar DeepBlue,
// Trina Vertex S, Longi Hi-MO 6, etc.) — typical residential modules.
export const PANEL_MODELS: PanelModel[] = [
  { name: 'Standard 400 W (108-cell M10)',  watts: 400, longSideM: 1.722, shortSideM: 1.134 },
  { name: 'Standard 420 W (108-cell M10)',  watts: 420, longSideM: 1.722, shortSideM: 1.134 },
  { name: 'Standard 440 W (108-cell M10)',  watts: 440, longSideM: 1.762, shortSideM: 1.134 },
  { name: 'Jinko Tiger Neo 450 W',          watts: 450, longSideM: 1.762, shortSideM: 1.134 },
  { name: 'JA Solar DeepBlue 460 W',        watts: 460, longSideM: 1.903, shortSideM: 1.134 },
  { name: 'Large-format 500 W (144-cell)',  watts: 500, longSideM: 2.094, shortSideM: 1.134 },
  { name: 'Large-format 550 W (144-cell)',  watts: 550, longSideM: 2.279, shortSideM: 1.134 },
  { name: 'Custom…',                        watts: 400, longSideM: 1.722, shortSideM: 1.134, custom: true },
]

export const GUTTER_X = 0.02 // meters between panels along the long axis
export const GUTTER_Y = 0.02 // meters between panels along the short axis
