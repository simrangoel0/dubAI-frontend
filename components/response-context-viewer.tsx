'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResponseContext, ContextChunk } from '@/types'

interface ResponseContextViewerProps {
  messageId: string
  responseContext: ResponseContext
  contextStore: ContextChunk[]
  onClose: () => void
}

export default function ResponseContextViewer({
  messageId,
  responseContext,
  contextStore,
  onClose,
}: ResponseContextViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<{ chunk: ContextChunk; responseChunk: { id: string; selected: boolean; influenceScore: number; reasoning?: string } } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    
    resizeCanvas()

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    const centerX = width / 2
    const centerY = height / 2

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width / 2)
    gradient.addColorStop(0, '#1e293b')
    gradient.addColorStop(1, '#0f172a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    const chunks = responseContext.chunks
    const angleStep = (Math.PI * 2) / chunks.length
    const radius = Math.min(width, height) * 0.35

    chunks.forEach((chunk, index) => {
      const angle = index * angleStep - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      const lineGradient = ctx.createLinearGradient(centerX, centerY, x, y)
      if (chunk.selected) {
        lineGradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)')
        lineGradient.addColorStop(1, 'rgba(34, 211, 238, 0.4)')
        ctx.strokeStyle = lineGradient
        ctx.lineWidth = 2.5
      } else {
        lineGradient.addColorStop(0, 'rgba(71, 85, 105, 0.1)')
        lineGradient.addColorStop(1, 'rgba(100, 116, 139, 0.1)')
        ctx.strokeStyle = lineGradient
        ctx.lineWidth = 1
      }
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    })

    const responseBoxSize = 140
    const boxX = centerX - responseBoxSize / 2
    const boxY = centerY - responseBoxSize / 2
    const cornerRadius = 12

    ctx.shadowBlur = 30
    ctx.shadowColor = 'rgba(59, 130, 246, 0.6)'
    ctx.fillStyle = '#3b82f6'
    
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, responseBoxSize, responseBoxSize, cornerRadius)
    ctx.fill()
    
    ctx.shadowBlur = 15
    ctx.shadowColor = 'rgba(96, 165, 250, 0.8)'
    ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'
    ctx.beginPath()
    ctx.roundRect(boxX + 5, boxY + 5, responseBoxSize - 10, responseBoxSize - 10, cornerRadius - 2)
    ctx.fill()
    
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Response', centerX, centerY - 5)
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    ctx.fillText(`${responseContext.chunks.filter(c => c.selected).length} chunks`, centerX, centerY + 15)

    chunks.forEach((chunk, index) => {
      const contextChunk = contextStore.find((c) => c.id === chunk.id)
      if (!contextChunk) return

      const angle = index * angleStep - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      const baseSize = chunk.selected ? 20 : 16
      const size = baseSize + chunk.influenceScore * 35
      const isHovered = hoveredNode === chunk.id

      if (chunk.selected) {
        ctx.shadowBlur = 25
        ctx.shadowColor = 'rgba(34, 211, 238, 0.8)'
        ctx.fillStyle = '#22d3ee'
        ctx.beginPath()
        ctx.arc(x, y, size + (isHovered ? 3 : 0), 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(165, 243, 252, 0.9)'
        const innerGradient = ctx.createRadialGradient(x - size/3, y - size/3, 0, x, y, size)
        innerGradient.addColorStop(0, 'rgba(165, 243, 252, 0.8)')
        innerGradient.addColorStop(1, 'rgba(34, 211, 238, 0.4)')
        ctx.fillStyle = innerGradient
        ctx.beginPath()
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.shadowBlur = 5
        ctx.shadowColor = 'rgba(71, 85, 105, 0.3)'
        ctx.fillStyle = isHovered ? '#64748b' : '#475569'
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(100, 116, 139, 0.3)'
        ctx.beginPath()
        ctx.arc(x, y, size * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.shadowBlur = 0

      const label = contextChunk.file.split('/').pop() || chunk.id
      const labelY = y - size - 15
      
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      const labelWidth = ctx.measureText(label).width
      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
      ctx.fillRect(x - labelWidth / 2 - 4, labelY - 10, labelWidth + 8, 18)
      
      ctx.fillStyle = chunk.selected ? '#ffffff' : '#94a3b8'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x, labelY)

      const scoreText = `${(chunk.influenceScore * 100).toFixed(0)}%`
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", monospace'
      ctx.fillStyle = chunk.selected ? '#22d3ee' : '#64748b'
      ctx.fillText(scoreText, x, y + size + 18)
    })

    ctx.restore()
  }, [messageId, responseContext, contextStore, hoveredNode, zoom, pan])

  const getTransformedCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left - pan.x) / zoom
    const y = (clientY - rect.top - pan.y) / zoom
    return { x, y }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPan({
          x: pan.x + (e.clientX - dragStart.x),
          y: pan.y + (e.clientY - dragStart.y),
        })
        setDragStart({ x: e.clientX, y: e.clientY })
        return
      }

      const { x, y } = getTransformedCoords(e.clientX, e.clientY)
      const centerX = canvas.offsetWidth / 2
      const centerY = canvas.offsetHeight / 2
      const radius = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.35

      const chunks = responseContext.chunks
      const angleStep = (Math.PI * 2) / chunks.length

      let foundHover = false
      chunks.forEach((chunk, index) => {
        const angle = index * angleStep - Math.PI / 2
        const nodeX = centerX + Math.cos(angle) * radius
        const nodeY = centerY + Math.sin(angle) * radius
        const baseSize = chunk.selected ? 20 : 16
        const size = baseSize + chunk.influenceScore * 35

        const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2)
        if (distance < size) {
          setHoveredNode(chunk.id)
          foundHover = true
        }
      })

      if (!foundHover) setHoveredNode(null)
    }

    const handleClick = (e: MouseEvent) => {
      if (isDragging) return
      
      const { x, y } = getTransformedCoords(e.clientX, e.clientY)
      const centerX = canvas.offsetWidth / 2
      const centerY = canvas.offsetHeight / 2
      const radius = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.35

      const chunks = responseContext.chunks
      const angleStep = (Math.PI * 2) / chunks.length

      chunks.forEach((chunk, index) => {
        const angle = index * angleStep - Math.PI / 2
        const nodeX = centerX + Math.cos(angle) * radius
        const nodeY = centerY + Math.sin(angle) * radius
        const baseSize = chunk.selected ? 20 : 16
        const size = baseSize + chunk.influenceScore * 35

        const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2)
        if (distance < size) {
          const contextChunk = contextStore.find((c) => c.id === chunk.id)
          if (contextChunk) {
            setSelectedNode({ chunk: contextChunk, responseChunk: chunk })
          }
        }
      })
    }

    const handleMouseDown = (e: MouseEvent) => {
      const { x, y } = getTransformedCoords(e.clientX, e.clientY)
      const centerX = canvas.offsetWidth / 2
      const centerY = canvas.offsetHeight / 2
      const radius = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.35

      const chunks = responseContext.chunks
      const angleStep = (Math.PI * 2) / chunks.length

      let clickedNode = false
      chunks.forEach((chunk, index) => {
        const angle = index * angleStep - Math.PI / 2
        const nodeX = centerX + Math.cos(angle) * radius
        const nodeY = centerY + Math.sin(angle) * radius
        const baseSize = chunk.selected ? 20 : 16
        const size = baseSize + chunk.influenceScore * 35

        const distance = Math.sqrt((x - nodeX) ** 2 + (y - nodeY) ** 2)
        if (distance < size) {
          clickedNode = true
        }
      })

      if (!clickedNode && e.button === 0) {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
    }
  }, [responseContext, contextStore, isDragging, pan, dragStart, zoom])

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta))
    
    const zoomChange = newZoom / zoom
    const newPanX = mouseX - (mouseX - pan.x) * zoomChange
    const newPanY = mouseY - (mouseY - pan.y) * zoomChange
    
    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative h-[90vh] w-[90vw] rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Response Context</h2>
            <p className="text-sm text-muted-foreground">
              {responseContext.chunks.filter((c) => c.selected).length} selected, {responseContext.chunks.filter((c) => !c.selected).length} dropped
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleZoomOut} variant="ghost" size="icon" title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button onClick={handleResetView} variant="ghost" size="sm" title="Reset view">
              {(zoom * 100).toFixed(0)}%
            </Button>
            <Button onClick={handleZoomIn} variant="ghost" size="icon" title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <canvas 
          ref={canvasRef} 
          className="h-[calc(100%-73px)] w-full cursor-grab" 
          onWheel={handleWheel}
        />

        <div className="absolute bottom-6 left-6 rounded-lg border border-border bg-card/95 px-4 py-3 backdrop-blur-sm">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
              <span className="text-foreground">Selected context</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-slate-600" />
              <span className="text-muted-foreground">Dropped context</span>
            </div>
            <div className="mt-3 border-t border-border pt-2 text-muted-foreground">
              Node size = influence score
            </div>
            <div className="text-muted-foreground">
              Drag to pan • Scroll to zoom
            </div>
          </div>
        </div>
      </div>

      {selectedNode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Context Explanation</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedNode.chunk.file}
                </p>
              </div>
              <Button onClick={() => setSelectedNode(null)} variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Status</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    selectedNode.responseChunk.selected 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'bg-slate-600/20 text-slate-400'
                  }`}>
                    {selectedNode.responseChunk.selected ? 'Selected' : 'Dropped'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Influence Score</span>
                  <span className="text-lg font-bold text-cyan-400">
                    {(selectedNode.responseChunk.influenceScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">Reasoning</h4>
                <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                  {selectedNode.responseChunk.reasoning || 
                    (selectedNode.responseChunk.selected 
                      ? `This context from ${selectedNode.chunk.file} was selected because it contains relevant information with an influence score of ${(selectedNode.responseChunk.influenceScore * 100).toFixed(1)}%. The content was determined to be valuable for generating an accurate and contextual response.`
                      : `This context from ${selectedNode.chunk.file} was not included in the final response. While it had an influence score of ${(selectedNode.responseChunk.influenceScore * 100).toFixed(1)}%, other context chunks were deemed more relevant or the model determined this information was not necessary for the specific query.`
                    )}
                </p>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-foreground">Context Preview</h4>
                <div className="max-h-[200px] overflow-auto rounded-lg border border-border bg-muted/30 p-4">
                  <pre className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
                    {selectedNode.chunk.content 
                      ? selectedNode.chunk.content.slice(0, 500) 
                      : 'No content available'}
                    {selectedNode.chunk.content && selectedNode.chunk.content.length > 500 && '...'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
