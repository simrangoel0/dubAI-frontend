
'use client'

import { useEffect, useState } from 'react'
import ChatInterface from '@/components/chat-interface'
import ObsidianGraphView from '@/components/obsidian-graph-view'
import ResponseContextModal from '@/components/response-context-modal'
import ResponseContextViewer from '@/components/response-context-viewer'
import { Message, ContextChunk, ResponseContext, TraceLogEvent } from '@/types'
import * as api from '@/lib/api'

export default function GlassBoxDebugger() {
  const [currentView, setCurrentView] = useState<'chat' | 'graph'>('chat')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [contextStore, setContextStore] = useState<ContextChunk[]>([])
  const [traceLog, setTraceLog] = useState<TraceLogEvent[]>([])
  const [responseContext, setResponseContext] = useState<ResponseContext | null>(null)

  useEffect(() => {
    // Load initial data: chat messages, context graph, and trace timeline
    let mounted = true

    ;(async () => {
      try {
        const [msgs, ctx, timeline] = await Promise.all([
          api.getChatMessages(),
          api.getContextGraph(),
          api.getTraceTimeline(),
        ])
        if (!mounted) return
        setMessages(msgs)
        setContextStore(ctx)
        setTraceLog(timeline)
      } catch (err) {
        console.error('Failed to load initial data', err)
      }
    })()

    return () => { mounted = false }
  }, [])

const handleSendMessage = async (text: string) => {
  const userMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'user',
    text,
    timestamp: Date.now(),
  }
  setMessages((prev) => [...prev, userMessage])

  try {
    const historyPayload = [...messages, userMessage].map((m) => ({
      role: m.role === 'agent' ? 'assistant' : m.role,
      content: m.text,
    }))

    const result = await api.runPipeline(
      text,
      historyPayload,
      'default', // or a conversationId state later
    )

    const answer = result.answer ?? {}
    const agentText =
      answer.final_answer ??
      answer.text ??
      answer.content ??
      JSON.stringify(answer)

    const agentMessage: Message = {
      id: result.message_id || `msg-agent-${Date.now()}`,
      role: 'agent',
      text: agentText,
      code: undefined,
      contextUsed: Array.isArray(result.context?.selected_chunks)
        ? result.context.selected_chunks.map(
            (c: any) => c.chunk?.chunk_id ?? c.chunk_id,
          )
        : undefined,
      timestamp: Date.now(),
      runId: result.run_id,  
    }

    setMessages((prev) => [...prev, agentMessage])

    const [timeline, ctx] = await Promise.all([
      api.getTraceTimeline(),
      api.getContextGraph(),
    ])
    setTraceLog(timeline)
    setContextStore(ctx)
  } catch (err) {
    console.error('Run failed', err)
  }
}

  const handleViewContext = () => {
    setCurrentView('graph')
  }

const handleViewResponseContext = async (messageId: string) => {
  // 1) Try to get runId directly from the message
  const msg = messages.find((m) => m.id === messageId)
  let runId = msg?.runId

  // 2) Fallback: use the timeline mapping (for older data)
  if (!runId) {
    const entry = traceLog.find((t: any) => (t as any).messageId === messageId)
    runId = entry ? (entry as any).run_id : undefined
  }

  if (!runId) {
    // Optional: refresh timeline once before giving up
    try {
      const timeline = await api.getTraceTimeline()
      setTraceLog(timeline)
      const refreshed = timeline.find(
        (t: any) => (t as any).messageId === messageId,
      )
      if (refreshed) {
        runId = (refreshed as any).run_id
      }
    } catch (err) {
      console.error('Failed to refresh timeline', err)
    }
  }

  if (!runId) {
    console.warn('No run found for message', messageId)
    return
  }

  try {
    const rc = await api.getRunContext(runId)
    setResponseContext(rc)
    setSelectedMessageId(messageId)
  } catch (err) {
    console.error('Failed to load run context', err)
  }
}

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
  }

  const handleCloseModal = () => {
    setSelectedNodeId(null)
  }

  const handleCloseResponseContext = () => {
    setSelectedMessageId(null)
    setResponseContext(null)
  }

  const handleBackToChat = () => {
    setCurrentView('chat')
    setSelectedNodeId(null)
  }

  const handleScrollToMessage = (messageId: string) => {
    console.log('[v0] Scrolling to message:', messageId)
  }

  return (
    <div className="h-screen bg-background text-foreground">
      {currentView === 'chat' ? (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onViewContext={handleViewContext}
          onViewResponseContext={handleViewResponseContext}
          traceLog={traceLog}
          onScrollToMessage={handleScrollToMessage}
        />
      ) : (
        <ObsidianGraphView
          contextStore={contextStore}
          onNodeClick={handleNodeClick}
          onBack={handleBackToChat}
        />
      )}

      {selectedNodeId && (
        <ResponseContextModal
          nodeId={selectedNodeId}
          contextStore={contextStore}
          responseContext={responseContext ?? { chunks: [], droppedChunks: [] }}
          onClose={handleCloseModal}
        />
      )}

      {selectedMessageId && responseContext && (
        <ResponseContextViewer
          messageId={selectedMessageId}
          responseContext={responseContext}
          contextStore={contextStore}
          onClose={handleCloseResponseContext}
        />
      )}
    </div>
  )
}
