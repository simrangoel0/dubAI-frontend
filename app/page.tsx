
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
    // optimistic update
    setMessages((prev) => [...prev, userMessage])

    try {
      // Build conversation history in backend shape: [{ role, content }]
      const historyPayload = [...messages, userMessage].map((m) => ({
        role: m.role === 'agent' ? 'assistant' : m.role, // map 'agent' -> 'assistant'
        content: m.text,
      }))

      // call backend run endpoint
      const result = await api.runPipeline(text, historyPayload, 'default')

      const answer = result.answer ?? {}

      // Our backend's AnswerAgent returns `final_answer` as the text field
      const agentText =
        answer.final_answer ??
        answer.answer_text ?? // fallback if you later rename
        answer.text ??
        answer.content ??
        JSON.stringify(answer)

      // Extract which chunks were selected in this run, if you want to surface that
      const contextUsedIds = Array.isArray(result.context?.selected_chunks)
        ? result.context.selected_chunks.map((c: any) =>
            c.chunk?.chunk_id ?? c.chunk_id
          )
        : undefined

      const agentMessage: Message = {
        id: result.message_id || `msg-agent-${Date.now()}`,
        role: 'agent',
        text: agentText,
        code: answer.final_code ?? answer.code,
        contextUsed: contextUsedIds,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, agentMessage])

      // refresh timeline and context graph
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
    // find run id for message from timeline
    const entry = traceLog.find((t: any) => (t as any).messageId === messageId)
    const runId = entry ? (entry as any).run_id : null
    if (!runId) {
      // try refreshing timeline then lookup again
      try {
        const timeline = await api.getTraceTimeline()
        setTraceLog(timeline)
        const refreshed = timeline.find((t: any) => (t as any).messageId === messageId)
        if (refreshed) {
          const rc = await api.getRunContext(refreshed.run_id)
          setResponseContext(rc)
          setSelectedMessageId(messageId)
        } else {
          console.warn('No run found for message', messageId)
        }
      } catch (err) {
        console.error('Failed to fetch timeline/run context', err)
      }
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
