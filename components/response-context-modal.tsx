'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { ContextChunk, ResponseContext } from '@/types'

interface ResponseContextModalProps {
  nodeId: string
  contextStore: ContextChunk[]
  responseContext: ResponseContext
  onClose: () => void
}

export default function ResponseContextModal({
  nodeId,
  contextStore,
  responseContext,
  onClose,
}: ResponseContextModalProps) {
  const chunk = contextStore.find((c) => c.id === nodeId)
  const responseChunk = responseContext.chunks.find((c) => c.id === nodeId) || 
                        responseContext.droppedChunks.find((c) => c.id === nodeId)

  if (!chunk) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-3xl rounded-lg border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Context Details</h2>
            <p className="mt-1 font-mono text-sm text-primary">{chunk.file}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* File Info */}
          <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-secondary/50 p-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lines
              </div>
              <div className="mt-1 font-mono text-sm text-foreground">
                {chunk.lineStart}-{chunk.lineEnd}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category
              </div>
              <div className="mt-1 text-sm capitalize text-foreground">{chunk.category}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Total Influence
              </div>
              <div className="mt-1 text-sm text-foreground">
                {(chunk.totalInfluence * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </div>
              <div className="mt-1 text-sm">
                {chunk.dropped ? (
                  <span className="rounded-full bg-slate-600/20 px-2 py-0.5 text-xs font-medium text-slate-400">Dropped</span>
                ) : (
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-medium text-cyan-400">In Use</span>
                )}
              </div>
            </div>
          </div>

          {/* Code Preview */}
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-foreground">Code Preview</h3>
            <pre className="overflow-x-auto rounded-lg bg-secondary p-4 text-xs font-mono leading-relaxed text-foreground">
              <code>{chunk.preview}</code>
            </pre>
          </div>

          {/* Response Context Info */}
          {responseChunk && (
            <>
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-foreground">Influence Score</h3>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${responseChunk.influenceScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">
                    {(responseChunk.influenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Selection Rationale</h3>
                <p className="rounded-lg bg-secondary/50 p-4 text-sm leading-relaxed text-foreground">
                  {responseChunk.rationale}
                </p>
              </div>
            </>
          )}

          {/* Usage Timeline */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Usage Timeline</h3>
            <div className="flex items-end gap-1" style={{ height: '80px' }}>
              {chunk.usageTimeline.map((value, idx) => (
                <div key={idx} className="flex-1">
                  <div
                    className="w-full rounded-t bg-primary transition-all"
                    style={{ height: `${value * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Start</span>
              <span>Current</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
