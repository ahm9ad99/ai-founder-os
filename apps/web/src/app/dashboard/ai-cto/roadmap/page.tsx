'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Route, ArrowLeft, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface Milestone {
  id: string
  title: string
  description: string
  quarter: string
  status: string
  techTags: string[]
  effort: string
  order: number
}

interface RoadmapData {
  id: string
  title: string
  milestones: Milestone[]
}

function GanttBar({ start, width, label, color }: { start: number; width: number; label: string; color: string }) {
  return (
    <div className="relative h-8">
      <div
        className="absolute top-1 h-6 rounded-md flex items-center px-2 text-xs font-medium text-white"
        style={{ left: `${start}%`, width: `${width}%`, backgroundColor: color }}
      >
        {label}
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const router = useRouter()
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cto/roadmap/latest')
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setRoadmap(data.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statusColor: Record<string, string> = {
    PLANNED: 'bg-blue-500/10 text-blue-500',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-500',
    DONE: 'bg-emerald-500/10 text-emerald-500',
    BLOCKED: 'bg-red-500/10 text-red-500',
  }

  const effortColor: Record<string, string> = {
    XS: '#22c55e',
    S: '#10b981',
    M: '#06b6d4',
    L: '#f59e0b',
    XL: '#ef4444',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  if (!roadmap || roadmap.milestones.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ai-cto">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Route className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No roadmap yet</p>
            <p className="text-sm text-muted-foreground mb-4">Generate a roadmap from a CTO session</p>
            <Button onClick={() => router.push('/dashboard/ai-cto')}>Back to AI CTO</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quarters = [...new Set(roadmap.milestones.map((m) => m.quarter))].sort()
  const totalWidth = quarters.length * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ai-cto">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{roadmap.title}</h1>
          </div>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/ai-cto/sessions/new')}>
          <Sparkles className="h-4 w-4 mr-2" /> Generate New
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex mb-2">
              {quarters.map((q) => (
                <div key={q} className="flex-1 text-center text-xs font-medium text-muted-foreground">{q}</div>
              ))}
            </div>
            {roadmap.milestones
              .sort((a, b) => a.order - b.order)
              .map((m) => {
                const qIndex = quarters.indexOf(m.quarter)
                const start = (qIndex / quarters.length) * 100
                const width = 100 / quarters.length
                return (
                  <div key={m.id}>
                    <GanttBar
                      start={start}
                      width={width}
                      label={m.title}
                      color={effortColor[m.effort] ?? '#6b7280'}
                    />
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {roadmap.milestones
          .sort((a, b) => a.order - b.order)
          .map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">{m.quarter}</Badge>
                  <Badge className={statusColor[m.status] ?? ''}>{m.status}</Badge>
                </div>
                <CardTitle className="text-sm font-medium mt-2">{m.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{m.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {m.techTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Effort: {m.effort}</span>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
