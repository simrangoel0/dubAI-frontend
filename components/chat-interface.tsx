'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Message, TraceLogEvent } from '@/types'
import { Send, Eye } from 'lucide-react'
import TraceLogTimeline from '@/components/trace-log-timeline'

interface ChatInterfaceProps {
  messages: Message[]
  // accept either a sync or async sender to be resilient to caller implementations
  onSendMessage: (text: string) => void | Promise<void>
  onViewContext: () => void
  onViewResponseContext: (messageId: string) => void
  traceLog: TraceLogEvent[]
  onScrollToMessage: (messageId: string) => void
}

export default function ChatInterface({
  messages,
  onSendMessage,
  onViewContext,
  onViewResponseContext,
  traceLog,
  onScrollToMessage,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTraceLogOpen, setIsTraceLogOpen] = useState(false)
  const [clickLinkedMessageId, setClickLinkedMessageId] = useState<string | null>(null)
  const [scrollLinkedMessageId, setScrollLinkedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const activeLinkedMessageId = clickLinkedMessageId || scrollLinkedMessageId

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickLinkedMessageId) return
        
        let maxRatio = 0
        let topMessageId: string | null = null
        
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            topMessageId = entry.target.getAttribute('data-message-id')
          }
        })
        
        if (topMessageId && maxRatio > 0.5) {
          setScrollLinkedMessageId(topMessageId)
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '-20% 0px -20% 0px',
      }
    )

    messageRefs.current.forEach((element) => {
      observer.observe(element)
    })

    return () => observer.disconnect()
  }, [messages, clickLinkedMessageId])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setIsLoading(true)
    setInput('')

    try {
      // Support both sync and async implementations
      await Promise.resolve(onSendMessage(trimmed))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleScrollToMessage = (messageId: string) => {
    const element = messageRefs.current.get(messageId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setClickLinkedMessageId(messageId)
    }
  }

  const handleNodeClick = (messageId: string | null) => {
    if (messageId) {
      setClickLinkedMessageId(messageId)
    } else {
      // If null passed, clear click highlight and let scroll take over
      setClickLinkedMessageId(null)
    }
  }

  return (
    <div className="flex h-full flex-col relative">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Glass-Box Debugger</h1>
            <p className="text-sm text-muted-foreground">See how your LLM uses context</p>
          </div>
          <Button onClick={onViewContext} variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            View full context graph
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.map((message) => (
          <div
            key={message.id}
            data-message-id={message.id}
            ref={(el) => {
              if (el) {
                messageRefs.current.set(message.id, el)
              } else {
                messageRefs.current.delete(message.id)
              }
            }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] space-y-2 rounded-lg p-4 transition-all duration-200 ${
              message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border'
            } ${
              activeLinkedMessageId === message.id 
                ? 'ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20' 
                : ''
            }`}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
                {message.role === 'user' ? 'You' : 'Agent'}
              </div>
              <div className="text-sm leading-relaxed">{message.text}</div>
              
              {message.code && (
                <pre className="mt-3 overflow-x-auto rounded bg-secondary p-3 text-xs font-mono">
                  <code>{message.code}</code>
                </pre>
              )}

              {message.role === 'agent' && (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewResponseContext(message.id)}
                    className="text-xs"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View context
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg border border-border bg-card p-4">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">Agent</div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-150" />
                <div className="h-2 w-2 animate-pulse rounded-full bg-primary delay-300" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="h-[60px] w-[60px]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TraceLogTimeline
        timeline={traceLog}
        messages={messages}
        onScrollToMessage={handleScrollToMessage}
        isOpen={isTraceLogOpen}
        onToggle={() => setIsTraceLogOpen(!isTraceLogOpen)}
        clickLinkedMessageId={activeLinkedMessageId}
        onNodeClick={handleNodeClick}
      />
    </div>
  )
}
