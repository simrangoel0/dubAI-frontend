'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ContextStoreGraph from '@/components/context-store-graph'
import ResponseContextGraph from '@/components/response-context-graph'
import { ContextChunk, ResponseContext } from '@/types'

interface ContextViewerProps {
  mode: 'store' | 'response'
  onModeChange: (mode: 'store' | 'response') => void
  contextStore: ContextChunk[]
  responseContext: ResponseContext
  unusedContextIds: string[]
}

export default function ContextViewer({
  mode,
  onModeChange,
  contextStore,
  responseContext,
  unusedContextIds,
}: ContextViewerProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Tabs value={mode} onValueChange={(v) => onModeChange(v as 'store' | 'response')} className="flex flex-1 flex-col">
        <div className="border-b border-border bg-card px-4">
          <TabsList className="h-12">
            <TabsTrigger value="store" className="text-sm">
              Context Store
            </TabsTrigger>
            <TabsTrigger value="response" className="text-sm">
              Response Context
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="store" className="flex-1 overflow-hidden m-0">
          <ContextStoreGraph contextStore={contextStore} unusedContextIds={unusedContextIds} />
        </TabsContent>

        <TabsContent value="response" className="flex-1 overflow-hidden m-0">
          <ResponseContextGraph
            responseContext={responseContext}
            contextStore={contextStore}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
