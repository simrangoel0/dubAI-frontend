import { ContextCategory } from '@/types'

export function inferCategoryFromPath(filePath: string): ContextCategory {
  const path = filePath.toLowerCase()
  if (path.includes('/components/') || path.includes('/ui/') || /components\//.test(path)) return 'component'
  if (path.includes('/hooks/') || /use[a-z0-9_]/.test(path)) return 'hook'
  if (path.endsWith('.md') || path.endsWith('.mdx') || path.includes('/docs/')) return 'documentation'
  if (path.includes('/api/') || path.includes('/server/') || path.includes('/pages/api/')) return 'api'
  if (path.includes('/utils/') || path.includes('/lib/')) return 'utility'

  // safe default
  return 'utility'
}
