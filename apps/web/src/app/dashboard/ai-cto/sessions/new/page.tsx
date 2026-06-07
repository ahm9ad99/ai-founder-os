'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, ArrowLeft, Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewCtoSessionPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [contextType, setContextType] = useState('product_idea')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/cto/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), contextType, description: description.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create session')
      }
      const data = await res.json()
      router.push(`/dashboard/ai-cto/sessions/${data.data.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ai-cto">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New CTO Session</h1>
          <p className="text-sm text-muted-foreground">Start a conversation with your AI CTO</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Session Details</CardTitle>
          <CardDescription>Describe your project idea for the AI CTO to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Session Title</Label>
              <Input
                id="title"
                placeholder="e.g., SaaS Inventory Management Platform"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contextType">Context Type</Label>
              <select
                id="contextType"
                value={contextType}
                onChange={(e) => setContextType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="product_idea">Product Idea</option>
                <option value="tech_stack">Tech Stack Review</option>
                <option value="architecture">Architecture Planning</option>
                <option value="migration">Migration Strategy</option>
                <option value="fundraising">Fundraising / Pitch Prep</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project, goals, target users, and any constraints..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={submitting || !title.trim()}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {submitting ? 'Creating...' : 'Start Session'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
