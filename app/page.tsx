'use client'

import { useState } from 'react'
import ChatInterface from '@/components/chat-interface'
import ObsidianGraphView from '@/components/obsidian-graph-view'
import ResponseContextModal from '@/components/response-context-modal'
import ResponseContextViewer from '@/components/response-context-viewer'
import { Message, ContextChunk, ResponseContext, TraceLogEvent } from '@/types'

export default function GlassBoxDebugger() {
  const [currentView, setCurrentView] = useState<'chat' | 'graph'>('chat')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      role: 'user',
      text: 'Can you help me style my button component?',
      timestamp: Date.now() - 310000,
    },
    {
      id: 'msg-2',
      role: 'agent',
      text: 'I\'ll help you implement authentication. Let me check the button component context to provide the best styling approach.',
      code: '// Button styling\n.button {\n  background: #007bff;\n  color: white;\n  padding: 8px 16px;\n}',
      timestamp: Date.now() - 300000,
    },
    {
      id: 'msg-3',
      role: 'user',
      text: 'That looks good, but can you make it more modern?',
      timestamp: Date.now() - 190000,
    },
    {
      id: 'msg-4',
      role: 'agent',
      text: 'I\'ve optimized the button styling with modern CSS features and better accessibility. The updated design uses CSS variables and improved hover states.',
      code: '// Modern button styling\n.button {\n  background: var(--primary);\n  color: white;\n  padding: 12px 24px;\n  border-radius: 8px;\n  transition: all 0.2s;\n}\n.button:hover {\n  transform: translateY(-2px);\n  box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n}',
      timestamp: Date.now() - 180000,
    },
    {
      id: 'msg-5',
      role: 'user',
      text: 'Perfect! Can you add some animation?',
      timestamp: Date.now() - 70000,
    },
    {
      id: 'msg-6',
      role: 'agent',
      text: 'I\'ve added smooth animations and transitions to make the button feel more interactive. The final implementation includes ripple effects and state transitions.',
      code: '// Animated button\n.button {\n  background: var(--primary);\n  color: white;\n  padding: 12px 24px;\n  border-radius: 8px;\n  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);\n  position: relative;\n  overflow: hidden;\n}\n.button::before {\n  content: "";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  width: 0;\n  height: 0;\n  border-radius: 50%;\n  background: rgba(255,255,255,0.5);\n  transform: translate(-50%, -50%);\n  transition: width 0.6s, height 0.6s;\n}\n.button:hover::before {\n  width: 300px;\n  height: 300px;\n}',
      timestamp: Date.now() - 60000,
    },
  ])

  const [contextStore, setContextStore] = useState<ContextChunk[]>([
    {
      id: 'chunk-1',
      file: 'src/components/Button.tsx',
      lineStart: 1,
      lineEnd: 25,
      preview: 'export function Button({ children, variant = "default", ...props }) {...',
      totalInfluence: 0.85,
      usageTimeline: [0.2, 0.5, 0.7, 0.85, 0.9],
      category: 'component',
      dropped: false,
    },
    {
      id: 'chunk-2',
      file: 'src/utils/validation.ts',
      lineStart: 10,
      lineEnd: 35,
      preview: 'export function validateEmail(email: string): boolean {...',
      totalInfluence: 0.65,
      usageTimeline: [0.3, 0.4, 0.6, 0.65],
      category: 'utility',
      dropped: false,
    },
    {
      id: 'chunk-3',
      file: 'docs/api-reference.md',
      lineStart: 1,
      lineEnd: 50,
      preview: '# API Reference\n\n## Authentication\nAll API requests require...',
      totalInfluence: 0.45,
      usageTimeline: [0.1, 0.2, 0.3, 0.45],
      category: 'documentation',
      dropped: false,
    },
    {
      id: 'chunk-4',
      file: 'src/hooks/useAuth.ts',
      lineStart: 5,
      lineEnd: 40,
      preview: 'export function useAuth() { const [user, setUser] = useState<User | null>(null)...',
      totalInfluence: 0.92,
      usageTimeline: [0.4, 0.6, 0.8, 0.92, 0.95],
      category: 'hook',
      dropped: false,
    },
    {
      id: 'chunk-5',
      file: 'src/components/Form.tsx',
      lineStart: 15,
      lineEnd: 60,
      preview: 'export function Form({ onSubmit, children }) {...',
      totalInfluence: 0.15,
      usageTimeline: [0.1, 0.15],
      category: 'component',
      dropped: true,
    },
  ])

  const mockResponseContext: ResponseContext = {
    chunks: [
      {
        id: 'chunk-1',
        influenceScore: 0.9,
        selected: true,
        rationale: 'High relevance: Button component directly related to UI implementation',
      },
      {
        id: 'chunk-2',
        influenceScore: 0.7,
        selected: true,
        rationale: 'Medium relevance: Validation logic may be useful for form context',
      },
      {
        id: 'chunk-4',
        influenceScore: 0.6,
        selected: true,
        rationale: 'Medium relevance: Authentication hook provides user context',
      },
      {
        id: 'chunk-3',
        influenceScore: 0.3,
        selected: false,
        rationale: 'Low relevance: API documentation not directly applicable to this query',
      },
      {
        id: 'chunk-5',
        influenceScore: 0.2,
        selected: false,
        rationale: 'Dropped: Form component not relevant to button styling query',
      },
    ],
    droppedChunks: [
      {
        id: 'chunk-5',
        influenceScore: 0.2,
        selected: false,
        rationale: 'Dropped: Form component not relevant to button styling query',
      },
    ],
  }

  const mockTraceLog: TraceLogEvent[] = [
    {
      type: 'run',
      run_id: 'run_1',
      summary: 'Initial response about button styling',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      messageId: 'msg-2',
      retrieveStep: {
        selectedChunks: ['chunk-1', 'chunk-2'],
        droppedChunks: ['chunk-5'],
      },
      influenceMap: [
        { chunkId: 'chunk-1', influence: 0.9 },
        { chunkId: 'chunk-2', influence: 0.7 },
      ],
    },
    {
      type: 'context_change',
      source: 'user',
      summary: 'Boosted chunk-1',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      details: {
        action: 'boosted',
        affectedChunks: ['chunk-1'],
        description: 'User manually increased influence of Button component',
      },
    },
    {
      type: 'run',
      run_id: 'run_2',
      summary: 'Improved response with boosted context',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      messageId: 'msg-4',
      retrieveStep: {
        selectedChunks: ['chunk-1', 'chunk-2', 'chunk-4'],
        droppedChunks: ['chunk-3'],
      },
      influenceMap: [
        { chunkId: 'chunk-1', influence: 0.95 },
        { chunkId: 'chunk-2', influence: 0.8 },
        { chunkId: 'chunk-4', influence: 0.75 },
      ],
    },
    {
      type: 'context_change',
      source: 'agent',
      summary: 'Dropped chunk-3',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      details: {
        action: 'dropped',
        affectedChunks: ['chunk-3'],
        description: 'Agent automatically dropped low-relevance documentation',
      },
    },
    {
      type: 'run',
      run_id: 'run_3',
      summary: 'Final optimized response',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      messageId: 'msg-6',
      retrieveStep: {
        selectedChunks: ['chunk-1', 'chunk-4'],
        droppedChunks: ['chunk-3', 'chunk-5'],
      },
      influenceMap: [
        { chunkId: 'chunk-1', influence: 0.92 },
        { chunkId: 'chunk-4', influence: 0.88 },
      ],
      codeDiff: {
        before: 'function handleClick() {\n  alert("Old");\n}',
        after: 'function handleClick() {\n  console.log("New");\n}',
      },
    },
  ]

  const handleSendMessage = (text: string) => {
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMessage])

    setTimeout(() => {
      const newRunId = `run_${Math.floor(Date.now() / 1000)}`
      const agentMessageId = `msg-${Date.now()}-agent`
      
      const agentMessage: Message = {
        id: agentMessageId,
        role: 'agent',
        text: `I understand you're asking about "${text}". Here's my response based on the context I've analyzed.`,
        code: '// Example code snippet\nfunction handleClick() {\n  console.log("Button clicked!");\n}',
        contextUsed: ['chunk-1', 'chunk-2'],
        codeDiff: {
          before: 'function handleClick() {\n  alert("Old behavior");\n}',
          after: 'function handleClick() {\n  console.log("Button clicked!");\n  // New improved behavior\n}',
        },
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, agentMessage])
    }, 1000)
  }

  const handleViewContext = () => {
    setCurrentView('graph')
  }

  const handleViewResponseContext = (messageId: string) => {
    setSelectedMessageId(messageId)
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
  }

  const handleCloseModal = () => {
    setSelectedNodeId(null)
  }

  const handleCloseResponseContext = () => {
    setSelectedMessageId(null)
  }

  const handleBackToChat = () => {
    setCurrentView('chat')
    setSelectedNodeId(null)
  }

  const handleScrollToMessage = (messageId: string) => {
    console.log('[v0] Scrolling to message:', messageId)
    // Implementation would scroll chat to specific message
  }

  return (
    <div className="h-screen bg-background text-foreground">
      {currentView === 'chat' ? (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onViewContext={handleViewContext}
          onViewResponseContext={handleViewResponseContext}
          traceLog={mockTraceLog}
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
          responseContext={mockResponseContext}
          onClose={handleCloseModal}
        />
      )}

      {selectedMessageId && (
        <ResponseContextViewer
          messageId={selectedMessageId}
          responseContext={mockResponseContext}
          contextStore={contextStore}
          onClose={handleCloseResponseContext}
        />
      )}
    </div>
  )
}
