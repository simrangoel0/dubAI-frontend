'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ResponseContext, ContextChunk } from '@/types'
import { AlertCircle } from 'lucide-react'

interface ResponseContextGraphProps {
  responseContext: ResponseContext
  contextStore: ContextChunk[]
}

export default function ResponseContextGraph({
  responseContext,
  contextStore,
}: ResponseContextGraphProps) {
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null)
  const [showBoostModal, setShowBoostModal] = useState(false)

  const allChunks = [...responseContext.chunks, ...responseContext.droppedChunks]
  
  const selectedChunkData = allChunks.find((c) => c.id === selectedChunkId)
  const selectedChunkInfo = contextStore.find((c) => c.id === selectedChunkId)

  const getNodeColor = (chunk: typeof responseContext.chunks[0]) => {
    if (!chunk.selected) return 'bg-muted border-muted-foreground/30'
    if (chunk.influenceScore > 0.7) return 'bg-node-high border-node-high'
    if (chunk.influenceScore > 0.4) return 'bg-node-medium border-node-medium'
    return 'bg-node-low border-node-low'
  }

  const getNodeSize = (score: number) => {
    return 40 + score * 60
  }

  return (
    <div className="flex h-full">
      {/* Graph Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card p-4">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span className="text-sm">
            Showing context used for the selected response. Green nodes had high influence.
          </span>
        </div>

        {/* Response Graph */}
        <div className="relative min-h-[400px] rounded-lg border border-border bg-secondary/20 p-8">
          <svg className="absolute inset-0 h-full w-full">
            {allChunks.map((chunk, i) => {
              const x1 = 100 + (i % 4) * 200
              const y1 = 100 + Math.floor(i / 4) * 180
              return allChunks.slice(i + 1, i + 2).map((targetChunk, j) => {
                const x2 = 100 + ((i + j + 1) % 4) * 200
                const y2 = 100 + Math.floor((i + j + 1) / 4) * 180
                return (
                  <line
                    key={`${chunk.id}-${targetChunk.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-border opacity-20"
                  />
                )
              })
            })}
          </svg>

          {allChunks.map((chunk, i) => {
            const size = getNodeSize(chunk.influenceScore)
            const x = 100 + (i % 4) * 200
            const y = 100 + Math.floor(i / 4) * 180

            return (
              <button
                key={chunk.id}
                onClick={() => setSelectedChunkId(chunk.id)}
                className={`absolute flex items-center justify-center rounded-full border-2 transition-all hover:scale-110 ${getNodeColor(chunk)} ${
                  selectedChunkId === chunk.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
                }`}
                style={{
                  width: size,
                  height: size,
                  left: x - size / 2,
                  top: y - size / 2,
                  opacity: chunk.selected ? 1 : 0.4,
                }}
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
      {selectedChunkId && selectedChunkData && selectedChunkInfo && (
        <div className="w-96 border-l border-border bg-card p-6 overflow-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Chunk ID</h3>
              <p className="font-mono text-sm">{selectedChunkData.id}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">File</h3>
              <p className="text-sm">{selectedChunkInfo.file}</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Lines</h3>
              <p className="text-sm font-mono">
                {selectedChunkInfo.lineStart}–{selectedChunkInfo.lineEnd}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Status</h3>
              <p className={`text-sm font-semibold ${selectedChunkData.selected ? 'text-node-high' : 'text-muted-foreground'}`}>
                {selectedChunkData.selected ? 'Selected' : 'Dropped'}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-muted-foreground">Influence Score</h3>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${selectedChunkData.selected ? 'bg-primary' : 'bg-muted-foreground'}`}
                    style={{ width: `${selectedChunkData.influenceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono">{(selectedChunkData.influenceScore * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Rationale</h3>
              <p className="rounded bg-secondary p-3 text-sm leading-relaxed">
                {selectedChunkData.rationale}
              </p>
            </div>

            <Button
              onClick={() => setShowBoostModal(true)}
              className="w-full"
              disabled={!selectedChunkData.selected}
            >
              Boost & Rerun
            </Button>
          </div>
        </div>
      )}

      {/* Boost Modal */}
      {showBoostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Boost Context & Rerun</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Boost this context chunk for the next run of the last question?
            </p>
            <div className="flex gap-2">
              <Button onClick={() => setShowBoostModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => setShowBoostModal(false)} className="flex-1">
                Yes, Boost
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
