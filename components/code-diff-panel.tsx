'use client'

interface CodeDiffPanelProps {
  codeDiff: { before: string; after: string } | null
}

export default function CodeDiffPanel({ codeDiff }: CodeDiffPanelProps) {
  if (!codeDiff) {
    return (
      <div className="flex h-64 items-center justify-center bg-card">
        <p className="text-sm text-muted-foreground">No code diff to display. Select a message with code changes.</p>
      </div>
    )
  }

  const beforeLines = codeDiff.before.split('\n')
  const afterLines = codeDiff.after.split('\n')
  const maxLines = Math.max(beforeLines.length, afterLines.length)

  return (
    <div className="h-64 overflow-hidden bg-card">
      <div className="border-b border-border bg-secondary/50 px-4 py-2">
        <h3 className="text-sm font-semibold">Code Changes</h3>
      </div>
      <div className="grid h-[calc(100%-2.5rem)] grid-cols-2 divide-x divide-border overflow-auto">
        {/* Original */}
        <div className="overflow-auto">
          <div className="bg-secondary/30 px-4 py-2 text-xs font-semibold text-muted-foreground">
            Original
          </div>
          <pre className="p-4 text-xs font-mono leading-relaxed">
            {beforeLines.map((line, i) => {
              const isRemoved = afterLines[i] !== line && line !== ''
              return (
                <div
                  key={i}
                  className={`${isRemoved ? 'bg-diff-removed/20 border-l-2 border-destructive pl-2' : ''}`}
                >
                  {line || '\n'}
                </div>
              )
            })}
          </pre>
        </div>

        {/* Updated */}
        <div className="overflow-auto">
          <div className="bg-secondary/30 px-4 py-2 text-xs font-semibold text-muted-foreground">
            Updated
          </div>
          <pre className="p-4 text-xs font-mono leading-relaxed">
            {afterLines.map((line, i) => {
              const isAdded = beforeLines[i] !== line && line !== ''
              return (
                <div
                  key={i}
                  className={`${isAdded ? 'bg-diff-added/20 border-l-2 border-node-high pl-2' : ''}`}
                >
                  {line || '\n'}
                </div>
              )
            })}
          </pre>
        </div>
      </div>
    </div>
  )
}
