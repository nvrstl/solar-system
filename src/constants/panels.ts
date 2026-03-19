import type { PanelModel } from '../types'

export const PANEL_MODELS: PanelModel[] = [
  { name: 'Standard 400W', watts: 400, widthM: 1.722, heightM: 1.134 },
  { name: 'Standard 420W', watts: 420, widthM: 1.755, heightM: 1.038 },
  { name: 'Standard 440W', watts: 440, widthM: 1.769, heightM: 1.052 },
  { name: 'JA Solar 450W', watts: 450, widthM: 2.108, heightM: 1.052 },
  { name: 'Standard 500W', watts: 500, widthM: 2.108, heightM: 1.052 },
  { name: 'Jinko 410W',    watts: 410, widthM: 1.722, heightM: 1.134 },
]

export const GUTTER_X = 0.02 // meters between panels horizontally
export const GUTTER_Y = 0.02 // meters between panels vertically
