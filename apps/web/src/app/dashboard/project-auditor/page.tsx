'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateProjectModal } from '@/components/create-project-modal'
import { FolderSearch, Plus, AlertTriangle, Shield, Activity, ArrowRight } from 'lucide-react'

type Project = {
  id: string
  name: string
  repoUrl: string
  techStack: string[]
  healthScore: number | null
  lastAuditAt: string | null
  createdAt: string
  _count: { audits: number }
}

function HealthRing({ score, size = 64 }: { score: number | null; size?: number }) {
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - ((score ?? 0) / 100) * circumference
  const color = score === null ? '#6b7280' : score >= 80 ? '#10b981' : score >= 60 ? '#eab308' : '#ef4444'

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.28} fontWeight="bold" fill={color}>
        {score ?? '?'}
      </text>
    </svg>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    HEALTHY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    WARNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || colors.PENDING}`}>{status}</span>
}

function timeAgo(date: string | null) {
  if (!date) return 'Never'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(diff / 86400000)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export default function ProjectAuditorPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const { data } = await res.json()
        setProjects(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const avgHealth = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.healthScore ?? 0), 0) / projects.length)
    : 0
  const completedAudits = projects.reduce((s, p) => s + p._count.audits, 0)
  const critical = projects.filter(p => (p.healthScore ?? 100) < 40).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Auditor</h1>
          <p className="text-sm text-muted-foreground">Automated project health and security audits</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Audit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Monitored projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Audits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAudits}</div>
            <p className="text-xs text-muted-foreground">Total audits run</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgHealth >= 80 ? 'text-emerald-500' : avgHealth >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {avgHealth || '—'}
            </div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{critical}</div>
            <p className="text-xs text-muted-foreground">Projects needing attention</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderSearch className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No projects audited yet</h3>
            <p className="text-sm text-muted-foreground mb-6">Add your first project to start monitoring health and security.</p>
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Add Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => {
            const status = project.healthScore === null ? 'PENDING' : project.healthScore >= 80 ? 'HEALTHY' : project.healthScore >= 60 ? 'WARNING' : 'CRITICAL'
            return (
              <Card key={project.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/project-auditor/${project.id}`)}>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-semibold truncate">{project.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{project.repoUrl.replace(/^https?:\/\//, '')}</p>
                  </div>
                  <div className="flex justify-center">
                    <HealthRing score={project.healthScore} size={72} />
                  </div>
                  <div className="text-center">
                    <StatusBadge status={status} />
                    <p className="text-xs text-muted-foreground mt-1">Last audit: {timeAgo(project.lastAuditAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {project.techStack.slice(0, 4).map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                    ))}
                    {project.techStack.length > 4 && (
                      <Badge variant="outline" className="text-[10px]">+{project.techStack.length - 4}</Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    View Audit <ArrowRight className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateProjectModal open={modalOpen} onOpenChange={setModalOpen} onCreated={fetchProjects} />
    </div>
  )
}
