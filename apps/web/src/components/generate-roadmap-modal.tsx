'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Route } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function GenerateRoadmapModal({
  open, onOpenChange, sessionId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
}) {
  const router = useRouter()
  const [instructions, setInstructions] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/cto/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, instructions: instructions.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate roadmap')
      }
      const data = await res.json()
      onOpenChange(false)
      router.push('/dashboard/ai-cto/roadmap')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Roadmap</DialogTitle>
          <DialogDescription>The AI CTO will create a phased development roadmap with milestones and timeline estimates.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Additional Instructions (optional)</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Focus on a 3-month MVP timeline..."
              rows={4}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
            {submitting ? 'Generating...' : 'Generate Roadmap'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
