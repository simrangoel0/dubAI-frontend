'use client'

import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContextAlertProps {
  unusedCount: number
  onReview: () => void
  onDismiss: () => void
}

export default function ContextAlert({ unusedCount, onReview, onDismiss }: ContextAlertProps) {
  return (
    <div className="border-b border-border bg-destructive/10 px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm">
            <span className="font-semibold">{unusedCount} context chunks</span> haven't been used in the last 15 messages. Consider removing them?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onReview}>
            Review Unused
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
