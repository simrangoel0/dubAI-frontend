'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ContextChunk } from '@/types'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'

interface ContextStoreGraphProps {
  contextStore: ContextChunk[]
  unusedContextIds: string[]
}

export default function ContextStoreGraph({ contextStore, unusedContextIds }: ContextStoreGraphProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'frequent' | 'rare'>('all')
  const [selectedNode, setSelectedNode] = useState<ContextChunk | null>(null)

  const filteredContext = contextStore.filter((chunk) => {
    const matchesSearch = chunk.file.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          chunk.id.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filter === 'frequent') return chunk.totalInfluence > 0.6
    if (filter === 'rare') return chunk.totalInfluence < 0.3
    return true
  })

  const getNodeSize = (influence: number) => {
    return 40 + influence * 60 // 40px to 100px
  }

  const getNodeColor = (influence: number) => {
    if (influence > 0.7) return 'bg-node-high border-node-high'
    if (influence > 0.4) return 'bg-node-medium border-node-medium'
    return 'bg-node-low border-node-low'
  }

  return (
    <div className="flex h-full">
      {/* Graph Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by file name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'frequent' ? 'default' : 'outline'}
            onClick={() => setFilter('frequent')}
            size="sm"
          >
            Frequent
          </Button>
          <Button
            variant={filter === 'rare' ? 'default' : 'outline'}
            onClick={() => setFilter('rare')}
            size="sm"
          >
            Rare
          </Button>
        </div>

        {/* Graph Visualization */}
        <div className="relative min-h-[400px] rounded-lg border border-border bg-secondary/20 p-8">
          <svg className="absolute inset-0 h-full w-full">
            {/* Connection lines */}
            {filteredContext.map((chunk, i) => {
              const x1 = 50 + (i % 3) * 250
              const y1 = 50 + Math.floor(i / 3) * 200
              return filteredContext.slice(i + 1, i + 2).map((targetChunk, j) => {
                const x2 = 50 + ((i + j + 1) % 3) * 250
                const y2 = 50 + Math.floor((i + j + 1) / 3) * 200
                return (
                  <line
                    key={`${chunk.id}-${targetChunk.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-border opacity-30"
                  />
                )
              })
            })}
          </svg>

          {/* Nodes */}
          {filteredContext.map((chunk, i) => {
            const size = getNodeSize(chunk.totalInfluence)
            const x = 50 + (i % 3) * 250
            const y = 50 + Math.floor(i / 3) * 200
            const isUnused = unusedContextIds.includes(chunk.id)

            return (
              <button
                key={chunk.id}
                onClick={() => setSelectedNode(chunk)}
                className={`absolute flex items-center justify-center rounded-full border-2 transition-all hover:scale-110 ${getNodeColor(chunk.totalInfluence)} ${
                  isUnused ? 'ring-2 ring-destructive ring-offset-2 ring-offset-background' : ''
                } ${selectedNode?.id === chunk.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                style={{
                  width: size,
                  height: size,
                  left: x - size / 2,
                  top: y - size / 2,
                }}
                title={chunk.file}
              >
                <span className="text-xs font-mono text-foreground">
                  {chunk.id.split('-')[1]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <div className="w-96 border-l border-border bg-card p-6 overflow-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Chunk ID</h3>
              <p className="font-mono text-sm">{selectedNode.id}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">File</h3>
              <p className="text-sm">{selectedNode.file}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Lines</h3>
              <p className="text-sm font-mono">
                {selectedNode.lineStart}–{selectedNode.lineEnd}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Total Influence</h3>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${selectedNode.totalInfluence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono">{(selectedNode.totalInfluence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Usage Timeline</h3>
              <div className="flex h-16 items-end gap-1">
                {selectedNode.usageTimeline.map((value, i) => (
                  <div key={i} className="flex-1 rounded-t bg-primary" style={{ height: `${value * 100}%` }} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Preview</h3>
              <pre className="rounded bg-secondary p-3 text-xs font-mono overflow-x-auto">
                {selectedNode.preview}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                Pin Context
              </Button>
              <Button size="sm" variant="destructive" className="flex-1">
                Exclude
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
