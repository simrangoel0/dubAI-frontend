'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Settings, Wrench, ZoomIn, ZoomOut } from 'lucide-react'
import { ContextChunk } from '@/types'
import { palette, background as bgColor, dropped as droppedColors } from '@/lib/ui-config'

interface Node {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  label: string
  dropped: boolean
}

interface Edge {
  source: string
  target: string
}

interface ObsidianGraphViewProps {
  contextStore: ContextChunk[]
  onNodeClick: (nodeId: string) => void
  onBack: () => void
  // called when a node is toggled dropped/in-use
  onToggleDropped?: (nodeId: string, dropped: boolean) => void
}

export default function ObsidianGraphView({
  contextStore,
  onNodeClick,
  onBack,
  onToggleDropped,
}: ObsidianGraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const fileColorMapRef = useRef<Map<string, string>>(new Map())
  const edgesRef = useRef<Edge[]>([])
  const hoveredNodeRef = useRef<string | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const initializedRef = useRef(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [localContextStore, setLocalContextStore] = useState<ContextChunk[]>(contextStore)
  const [droppedNodes, setDroppedNodes] = useState<Set<string>>(new Set())

  // colors are centralized in `lib/ui-config.ts` as `categoryColors`.

  useEffect(() => {
    if (initializedRef.current) return
    
    console.log('[v0] Initializing graph with', contextStore.length, 'nodes')
    
    const getColorForFile = (file: string) => {
      const map = fileColorMapRef.current
      if (map.has(file)) return map.get(file)!
      // simple stable hash -> index
      let h = 0
      for (let i = 0; i < file.length; i++) {
        h = (h * 31 + file.charCodeAt(i)) >>> 0
      }
      const color = palette[h % palette.length]
      map.set(file, color)
      return color
    }

    const initialNodes: Node[] = contextStore.map((chunk, idx) => {
      const influence = chunk.totalInfluence
      const size = 8 + influence * 22
      // assign a stable per-file color
      const color = getColorForFile(chunk.file)

      return {
        id: chunk.id,
        x: Math.random() * 1200,
        y: Math.random() * 800,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size,
        color,
        label: chunk.file.split('/').pop() || chunk.id,
        dropped: chunk.dropped || false,
      }
    })

    const initialEdges: Edge[] = []
    contextStore.forEach((chunk, i) => {
      const numConnections = Math.floor(Math.random() * 4) + 1
      for (let j = 0; j < numConnections; j++) {
        const targetIdx = Math.floor(Math.random() * contextStore.length)
        if (targetIdx !== i) {
          initialEdges.push({
            source: chunk.id,
            target: contextStore[targetIdx].id,
          })
        }
      }
    })

    nodesRef.current = initialNodes
    edgesRef.current = initialEdges
    initializedRef.current = true
    
    const initialDropped = new Set(
      contextStore.filter((c) => c.dropped).map((c) => c.id)
    )
    setDroppedNodes(initialDropped)
    
    console.log('[v0] Graph initialized with', initialNodes.length, 'nodes and', initialEdges.length, 'edges')
  }, [contextStore])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    console.log('[v0] Starting animation loop')

    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    updateSize()
    window.addEventListener('resize', updateSize)

    const centerX = canvas.offsetWidth / 2
    const centerY = canvas.offsetHeight / 2

    const simulate = () => {
      const nodes = nodesRef.current
      const edges = edgesRef.current
      
      if (nodes.length === 0) {
        animationFrameRef.current = requestAnimationFrame(simulate)
        return
      }

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      ctx.save()
      ctx.translate(pan.x, pan.y)
      ctx.scale(zoom, zoom)

      nodes.forEach((node) => {
        let fx = 0
        let fy = 0

        const dx = centerX - node.x
        const dy = centerY - node.y
        const distToCenter = Math.sqrt(dx * dx + dy * dy)
        if (distToCenter > 0) {
          fx += (dx / distToCenter) * 0.01
          fy += (dy / distToCenter) * 0.01
        }

        nodes.forEach((other) => {
          if (other.id === node.id) return
          const dx = node.x - other.x
          const dy = node.y - other.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (node.size + other.size) / (dist * dist) * 50
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        })

        node.vx = (node.vx + fx) * 0.95
        node.vy = (node.vy + fy) * 0.95

        node.x += node.vx
        node.y += node.vy

        if (node.x < node.size) node.x = node.size
        if (node.x > canvas.offsetWidth - node.size) node.x = canvas.offsetWidth - node.size
        if (node.y < node.size) node.y = node.size
        if (node.y > canvas.offsetHeight - node.size) node.y = canvas.offsetHeight - node.size
      })

      edges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)
        if (sourceNode && targetNode) {
          const bothDropped = droppedNodes.has(sourceNode.id) && droppedNodes.has(targetNode.id)
          ctx.strokeStyle = bothDropped
            ? 'rgba(148, 163, 184, 0.05)'
            : 'rgba(148, 163, 184, 0.15)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(sourceNode.x, sourceNode.y)
          ctx.lineTo(targetNode.x, targetNode.y)
          ctx.stroke()
        }
      })

      nodes.forEach((node) => {
        const isHovered = hoveredNodeRef.current === node.id
        const isDropped = droppedNodes.has(node.id)
        
        if (isHovered) {
          ctx.shadowBlur = 20
          ctx.shadowColor = isDropped ? droppedColors.shadow : node.color
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fillStyle = isDropped ? droppedColors.fill : node.color
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2)
        ctx.fill()

        ctx.shadowBlur = 0
        ctx.fillStyle = isDropped ? droppedColors.text : '#ffffff'
        ctx.font = isHovered ? 'bold 13px sans-serif' : '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.label, node.x, node.y - node.size - 8)
      })

      ctx.restore()

      animationFrameRef.current = requestAnimationFrame(simulate)
    }

    simulate()

    return () => {
      window.removeEventListener('resize', updateSize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [droppedNodes, zoom, pan])

  const getTransformedCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    const x = (clientX - rect.left - pan.x) / zoom
    const y = (clientY - rect.top - pan.y) / zoom
    return { x, y }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setPan({
        x: pan.x + (e.clientX - dragStart.x),
        y: pan.y + (e.clientY - dragStart.y),
      })
      setDragStart({ x: e.clientX, y: e.clientY })
      return
    }

    const { x: mouseX, y: mouseY } = getTransformedCoords(e.clientX, e.clientY)

    const nodes = nodesRef.current
    let found = false
    for (const node of nodes) {
      const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2)
      if (dist < node.size) {
        hoveredNodeRef.current = node.id
        if (canvasRef.current) canvasRef.current.style.cursor = 'pointer'
        found = true
        break
      }
    }

    if (!found) {
      hoveredNodeRef.current = null
      if (canvasRef.current) canvasRef.current.style.cursor = isDragging ? 'grabbing' : 'grab'
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x: mouseX, y: mouseY } = getTransformedCoords(e.clientX, e.clientY)
    
    // Check if clicking on a node
    const nodes = nodesRef.current
    let clickedNode = false
    for (const node of nodes) {
      const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2)
      if (dist < node.size) {
        clickedNode = true
        break
      }
    }
    
    // Only start dragging if not clicking on a node
    if (!clickedNode && e.button === 0) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return
    
    const { x: mouseX, y: mouseY } = getTransformedCoords(e.clientX, e.clientY)

    const nodes = nodesRef.current
    for (const node of nodes) {
      const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2)
      if (dist < node.size) {
        if (e.button === 0) {
          onNodeClick(node.id)
        }
        break
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const { x: mouseX, y: mouseY } = getTransformedCoords(e.clientX, e.clientY)

    const nodes = nodesRef.current
    for (const node of nodes) {
      const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2)
      if (dist < node.size) {
        handleToggleNode(node.id)
        break
      }
    }
  }

  const handleToggleNode = (nodeId: string) => {
    // compute new dropped state
    const willBeDropped = !droppedNodes.has(nodeId)

    setDroppedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })

    setLocalContextStore((prev) =>
      prev.map((chunk) =>
        chunk.id === nodeId ? { ...chunk, dropped: !chunk.dropped } : chunk
      )
    )

    // notify parent so the toggle can be persisted globally (or to backend)
    if (typeof onToggleDropped === 'function') {
      onToggleDropped(nodeId, willBeDropped)
    }
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    // Calculate zoom delta
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta))
    
    // Calculate new pan to keep mouse position fixed
    const zoomChange = newZoom / zoom
    const newPanX = mouseX - (mouseX - pan.x) * zoomChange
    const newPanY = mouseY - (mouseY - pan.y) * zoomChange
    
    setZoom(newZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  return (
    <div className="relative h-screen w-full bg-background">
      <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to chat
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Graph view</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleZoomOut} variant="ghost" size="icon" title="Zoom out">
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button onClick={handleResetView} variant="ghost" size="sm" title="Reset view">
            {(zoom * 100).toFixed(0)}%
          </Button>
          <Button onClick={handleZoomIn} variant="ghost" size="icon" title="Zoom in">
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Wrench className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-grab"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />

      <div className="absolute bottom-6 left-6 z-10 rounded-lg border border-border bg-card/90 px-4 py-3 backdrop-blur">
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Node size = influence score</div>
          <div className="text-xs">Left-click: View details</div>
          <div className="text-xs">Right-click: Toggle use/drop</div>
          <div className="text-xs">Drag to pan • Scroll to zoom</div>
        </div>
      </div>
    </div>
  )
}
