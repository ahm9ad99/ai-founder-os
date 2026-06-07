'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, MessageSquare, FileText, Route, ArrowRight, Plus, Loader2, AlertCircle, Clock, Zap, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Session {
  id: string
  title: string
  contextType: string
  createdAt: string
  _count: { messages: number }
}

interface PRD {
  id: string
  title: string
  status: string
  createdAt: string
}

interface RoadmapData {
  id: string
  title: string
  milestones: { id: string; title: string; quarter: string; status: string }[]
}

interface Metrics {
  totalSessions: number
  totalMessages: number
  totalPrds: number
  roadmaps: number
}

export default function AiCtoPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [prds, setPrds] = useState<PRD[]>([])
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [metricsRes, sessionsRes, prdsRes, roadmapRes] = await Promise.all([
          fetch('/api/cto/metrics'),
          fetch('/api/cto/sessions'),
          fetch('/api/cto/prds'),
          fetch('/api/cto/roadmap/latest'),
        ])
        if (!metricsRes.ok || !sessionsRes.ok || !prdsRes.ok) throw new Error('Failed to load')
        const metricsData = await metricsRes.json()
        const sessionsData = await sessionsRes.json()
        const prdsData = await prdsRes.json()
        const roadmapData = roadmapRes.ok ? await roadmapRes.json() : null
        setMetrics(metricsData.data)
        setSessions(sessionsData.data)
        setPrds(prdsData.data)
        setRoadmap(roadmapData?.data ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

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

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-blue-500/10 text-blue-500',
    REVIEW: 'bg-yellow-500/10 text-yellow-500',
    APPROVED: 'bg-emerald-500/10 text-emerald-500',
    PLANNED: 'bg-blue-500/10 text-blue-500',
    IN_PROGRESS: 'bg-indigo-500/10 text-indigo-500',
    DONE: 'bg-emerald-500/10 text-emerald-500',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI CTO Platform</h1>
          <p className="text-sm text-muted-foreground">Your AI Chief Technology Officer</p>
        </div>
        <Button onClick={() => router.push('/dashboard/ai-cto/sessions/new')}>
          <Plus className="h-4 w-4 mr-2" /> New Session
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSessions ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalMessages ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">PRDs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPrds ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Roadmaps</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.roadmaps ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">CTO Sessions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/ai-cto/sessions/new')}>
              <Plus className="h-3 w-3 mr-1" /> New
            </Button>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Brain className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No sessions yet</p>
                <Button size="sm" onClick={() => router.push('/dashboard/ai-cto/sessions/new')}>
                  Start your first session
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/dashboard/ai-cto/sessions/${s.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s._count.messages} messages · {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">PRDs</CardTitle>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/ai-cto/sessions/new')}>
              <Sparkles className="h-3 w-3 mr-1" /> Generate
            </Button>
          </CardHeader>
          <CardContent>
            {prds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No PRDs generated yet</p>
                <Button size="sm" onClick={() => router.push('/dashboard/ai-cto/sessions/new')}>
                  Generate your first PRD
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {prds.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/dashboard/ai-cto/prds/${p.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={statusColor[p.status] ?? ''}>{p.status}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Latest Roadmap</CardTitle>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/ai-cto/roadmap')}>
            <Route className="h-3 w-3 mr-1" /> View Full
          </Button>
        </CardHeader>
        <CardContent>
          {!roadmap ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Route className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">No roadmap generated yet</p>
              <Button size="sm" onClick={() => router.push('/dashboard/ai-cto/sessions/new')}>
                Generate a roadmap
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium">{roadmap.title}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {roadmap.milestones.map((m) => {
                  const statusBadge = statusColor[m.status] ?? 'bg-slate-500/10 text-slate-500'
                  return (
                    <div key={m.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-[10px]">{m.quarter}</Badge>
                        <Badge className={`${statusBadge}`}>{m.status}</Badge>
                      </div>
                      <p className="text-sm font-medium">{m.title}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
