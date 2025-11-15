export interface Message {
  id: string
  role: 'user' | 'agent'
  text: string
  code?: string
  contextUsed?: string[]
  codeDiff?: {
    before: string
    after: string
  }
  timestamp: number
}

export interface ContextChunk {
  id: string
  file: string
  lineStart: number
  lineEnd: number
  preview: string
  totalInfluence: number
  usageTimeline: number[]
  category: string
  dropped?: boolean
}

export interface ResponseContextChunk {
  id: string
  influenceScore: number
  selected: boolean
  rationale: string
}

export interface ResponseContext {
  chunks: ResponseContextChunk[]
  droppedChunks: ResponseContextChunk[]
}

export interface TraceLogRun {
  type: 'run'
  run_id: string
  summary: string
  timestamp: string
  messageId?: string
  retrieveStep?: {
    selectedChunks: string[]
    droppedChunks: string[]
  }
  scoringSummary?: {
    chunkId: string
    score: number
  }[]
  finalPrompt?: string
  influenceMap?: {
    chunkId: string
    influence: number
  }[]
  codeDiff?: {
    before: string
    after: string
  }
}

export interface TraceLogContextChange {
  type: 'context_change'
  source: 'user' | 'agent'
  summary: string
  timestamp: string
  details: {
    action: 'added' | 'removed' | 'boosted' | 'dropped' | 'summarised'
    affectedChunks: string[]
    description: string
  }
}

export type TraceLogEvent = TraceLogRun | TraceLogContextChange

export interface TraceLogTimeline {
  timeline: TraceLogEvent[]
}
