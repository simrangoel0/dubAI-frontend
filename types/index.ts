export interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  code?: string;
  contextUsed?: string[];
  codeDiff?: {
    before: string;
    after: string;
  };
  timestamp: number;
  runId?: string;
}

export type ContextCategory = 'component' | 'utility' | 'documentation' | 'hook' | 'api'

export interface ContextChunk {
  id: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  preview: string;
  totalInfluence: number;
  usageTimeline: number[];
  category: ContextCategory;
  dropped?: boolean;
}

export interface ResponseContextChunk {
  id: string;
  influenceScore: number;
  selected: boolean;
  rationale: string;
}

export interface ResponseContext {
  chunks: ResponseContextChunk[];
  droppedChunks: ResponseContextChunk[];
}

export interface TraceLogRun {
  type: 'run'
  run_id: string
  messageId: string
  user_query: string  
  summary: string
  timestamp: string
  runLabel: string
  retrieveStep?: {
    selectedChunks: string[]
    droppedChunks: string[]
  }
  influenceMap?: {
    chunkId: string
    influence: number
  }[]
  codeDiff?: any
}


export interface TraceLogContextChange {
  type: "context_change";
  source: "user" | "agent";
  summary: string;
  timestamp: string;
  details: {
    action: "added" | "removed" | "boosted" | "dropped" | "summarised";
    affectedChunks: string[];
    description: string;
  };
}

export type TraceLogEvent = TraceLogRun | TraceLogContextChange;

export interface TraceLogTimeline {
  timeline: TraceLogEvent[];
}
