'use client'

import { useState, useRef, useEffect } from 'react'
import { TraceLogEvent, TraceLogRun, TraceLogContextChange, Message } from '@/types'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface TraceLogTimelineProps {
  timeline: TraceLogEvent[]
  messages: Message[]
  onScrollToMessage?: (messageId: string) => void
  isOpen: boolean
  onToggle: () => void
  clickLinkedMessageId: string | null
  onNodeClick: (messageId: string | null) => void
}

export default function TraceLogTimeline({
  timeline,
  messages,
  onScrollToMessage,
  isOpen,
  onToggle,
  clickLinkedMessageId,
  onNodeClick,
}: TraceLogTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<TraceLogEvent | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  const [clickedChangeId, setClickedChangeId] = useState<string | null>(null)

  const handleRunClick = (event: TraceLogRun) => {
    console.log('[v0] Run clicked:', event.run_id, 'messageId:', event.messageId)
    setSelectedEvent(event)
    if (event.messageId && onScrollToMessage) {
      onScrollToMessage(event.messageId)
      onNodeClick(event.messageId)
    }
  }

  const handleContextChangeClick = (event: TraceLogContextChange, index: number) => {
    setSelectedEvent(event)
    setClickedChangeId(`change-${index}`)
    setTimeout(() => setClickedChangeId(null), 300)
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString()
    } catch {
      return timestamp
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-border bg-card p-2 shadow-lg transition-all hover:bg-accent"
        style={{ right: isOpen ? '400px' : '0' }}
      >
        {isOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 z-30 h-screen w-[400px] border-l border-border bg-background shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border bg-card px-4 py-3">
            <h2 className="text-lg font-semibold">Trace Log</h2>
            <p className="text-xs text-muted-foreground">Evolution of AI responses and context</p>
          </div>

          {/* Timeline */}
          <div className="relative flex-1 overflow-y-auto p-8">
            <div className="relative">
              {/* Vertical line with glow */}
              <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-cyan-500/50 via-cyan-400/50 to-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />

              {/* Timeline events */}
              <div className="relative space-y-8">
                {timeline.map((event, index) => {
                  const isRun = event.type === 'run'
                  const eventId = isRun ? (event as TraceLogRun).run_id : `change-${index}`
                  const isHovered = hoveredEvent === eventId
                  const isLinked = isRun && (event as TraceLogRun).messageId === clickLinkedMessageId
                  const isChangeClicked = !isRun && clickedChangeId === eventId
                  
                  return (
                    <div
                      key={eventId}
                      className="relative flex items-center justify-center"
                      onMouseEnter={() => setHoveredEvent(eventId)}
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      {isRun ? (
                        // Large node for AI runs
                        <button
                          onClick={() => handleRunClick(event as TraceLogRun)}
                          className="group relative"
                        >
                          <div
                            className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card shadow-lg transition-all duration-200 ${
                              isLinked
                                ? 'scale-125 border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.8)] ring-2 ring-cyan-500/50'
                                : isHovered
                                ? 'scale-110 border-border shadow-[0_0_20px_rgba(59,130,246,0.6)]'
                                : 'border-border'
                            }`}
                          >
                            <div className={`h-3 w-3 rounded-full transition-all duration-200 ${
                              isLinked
                                ? 'bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                                : 'bg-gradient-to-br from-gray-400 to-gray-600'
                            }`} />
                          </div>
                          {/* Label */}
                          <div className="absolute left-16 top-1/2 -translate-y-1/2 text-left">
                            <div className={`text-sm font-medium transition-colors duration-200 ${
                              isLinked ? 'text-cyan-400' : 'text-foreground'
                            }`}>
                              {(event as TraceLogRun).runLabel}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(event as TraceLogRun).summary}
                            </div>
                            <div className="text-xs text-muted-foreground/60">
                              {formatTimestamp((event as TraceLogRun).timestamp)}
                            </div>
                          </div>
                        </button>
                      ) : (
                        // Small node for context changes
                        <button
                          onClick={() => handleContextChangeClick(event as TraceLogContextChange, index)}
                          className="group relative"
                        >
                          <div
                            className={`relative z-10 h-3.5 w-3.5 rounded-full border transition-all duration-200 ${
                              (event as TraceLogContextChange).source === 'user'
                                ? 'border-blue-400 bg-blue-500'
                                : 'border-green-400 bg-green-500'
                            } ${
                              isChangeClicked
                                ? 'scale-[2] shadow-[0_0_20px_rgba(59,130,246,0.8)]'
                                : isHovered
                                ? 'scale-150 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                                : 'shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                            }`}
                          />
                          {/* Tooltip on hover */}
                          {isHovered && (
                            <div className="absolute left-8 top-1/2 z-20 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                              <div className="font-medium">{(event as TraceLogContextChange).summary}</div>
                              <div className="text-muted-foreground">
                                {(event as TraceLogContextChange).source === 'user' ? 'User' : 'Agent'} change
                              </div>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedEvent && (
            <div className="border-t border-border bg-card">
              <div className="max-h-[40vh] overflow-y-auto p-4">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-sm font-semibold">
                    {selectedEvent.type === 'run' ? 'Run Details' : 'Context Change Details'}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedEvent(null)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {selectedEvent.type === 'run' ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-medium text-muted-foreground">Run ID</div>
                      <div className="text-foreground">{(selectedEvent as TraceLogRun).run_id}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Summary</div>
                      <div className="text-foreground">{(selectedEvent as TraceLogRun).summary}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Timestamp</div>
                      <div className="text-foreground">
                        {formatTimestamp((selectedEvent as TraceLogRun).timestamp)}
                      </div>
                    </div>

                    {(selectedEvent as TraceLogRun).retrieveStep && (
                      <div>
                        <div className="font-medium text-muted-foreground">Retrieve Step</div>
                        <div className="mt-1 space-y-1">
                          <div className="text-foreground">
                            Selected: {(selectedEvent as TraceLogRun).retrieveStep!.selectedChunks.length} chunks
                          </div>
                          <div className="text-foreground">
                            Dropped: {(selectedEvent as TraceLogRun).retrieveStep!.droppedChunks.length} chunks
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedEvent as TraceLogRun).influenceMap && (
                      <div>
                        <div className="mb-2 font-medium text-muted-foreground">Influence Map</div>
                        <div className="space-y-1">
                          {(selectedEvent as TraceLogRun).influenceMap!.map((item) => (
                            <div key={item.chunkId} className="flex items-center gap-2">
                              <div className="w-20 truncate text-foreground">{item.chunkId}</div>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full bg-cyan-500"
                                  style={{ width: `${item.influence * 100}%` }}
                                />
                              </div>
                              <div className="w-10 text-right text-foreground">
                                {Math.round(item.influence * 100)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedEvent as TraceLogRun).codeDiff && (
                      <div>
                        <div className="font-medium text-muted-foreground">Code Changes</div>
                        <div className="mt-1 rounded border border-border bg-secondary p-2 font-mono text-xs">
                          <div className="text-red-400">- Before</div>
                          <div className="text-green-400">+ After</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-medium text-muted-foreground">Type</div>
                      <div className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium">
                        <div
                          className={`mr-1 h-2 w-2 rounded-full ${
                            (selectedEvent as TraceLogContextChange).source === 'user'
                              ? 'bg-blue-500'
                              : 'bg-green-500'
                          }`}
                        />
                        {(selectedEvent as TraceLogContextChange).source === 'user' ? 'User' : 'Agent'} change
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Summary</div>
                      <div className="text-foreground">{(selectedEvent as TraceLogContextChange).summary}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Description</div>
                      <div className="text-foreground">
                        {(selectedEvent as TraceLogContextChange).details.description}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Affected Chunks</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(selectedEvent as TraceLogContextChange).details.affectedChunks.map((chunk) => (
                          <span
                            key={chunk}
                            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground"
                          >
                            {chunk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
