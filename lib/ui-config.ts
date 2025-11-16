import { ContextCategory } from '@/types'

export const palette = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22d3ee', // cyan
  '#f97316', // orange
  '#a855f7', // purple
  '#84cc16', // lime
  '#ec4899', // pink
  '#6b7280', // gray
]

export const background = '#0f172a'

export const text = {
  normal: '#ffffff',
  muted: '#9ca3af',
}

export const dropped = {
  fill: '#4b5563',
  text: '#9ca3af',
  shadow: '#6b7280',
}

export const categoryColors: Record<ContextCategory, string> = {
  component: '#3b82f6',
  utility: '#ef4444',
  documentation: '#22d3ee',
  hook: '#f97316',
  api: '#a855f7',
}

export const categoryOrder: ContextCategory[] = ['component', 'utility', 'documentation', 'hook', 'api']
