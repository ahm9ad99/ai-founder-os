'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft, AlertCircle, RefreshCw, Download, ExternalLink,
  Shield, Zap, Package, FileText, Loader2,
} from 'lucide-react'

type Vuln = { id: string; severity: string; cveId: string | null; title: string; description: string; fix: string | null }
type Dep = { id: string; name: string; current: string; latest: string; severity: string }
type Perf = { bundleSize: string | null; lcp: string | null; tti: string | null; lighthouseScore: number | null }
type Audit = {
  id: string; status: string; healthScore: number | null; summary: string | null; report: string | null
  createdAt: string; vulns: Vuln[]; deps: Dep[]; perf: Perf | null
}
type Project = {
  id: string; name: string; repoUrl: string; techStack: string[]; description: string | null
  healthScore: number | null; lastAuditAt: string | null; audits: Audit[]
}

function ScoreGauge({ score }: { score: number | null }) {
  const s = score ?? 0
  const color = score === null ? '#6b7280' : s >= 80 ? '#10b981' : s >= 60 ? '#eab308' : '#ef4444'
  const label = score === null ? 'N/A' : score >= 80 ? 'Healthy' : score >= 60 ? 'Warning' : 'Critical'
  const radius = 80
  const strokeWidth = 12
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (s / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={200} height={200}>
        <circle cx={100} cy={100} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle cx={100} cy={100} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 100 100)`} />
        <text x={100} y={90} textAnchor="middle" fontSize={48} fontWeight="bold" fill={color}>{s}</text>
        <text x={100} y={120} textAnchor="middle" fontSize={14} fill={color}>{label}</text>
      </svg>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    LOW: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    INFO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[severity] || colors.INFO}`}>{severity}</span>
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

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [auditing, setAuditing] = useState(false)

  const fetchProject = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      if (res.status === 404) { setNotFound(true); return }
      if (res.ok) {
        const { data } = await res.json()
        setProject(data)
      }
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { fetchProject() }, [fetchProject])

  const latestAudit = project?.audits?.[0] ?? null

  const handleRerunAudit = async () => {
    setAuditing(true)
    try {
      const res = await fetch(`/api/projects/${params.id}/audit`, { method: 'POST' })
      if (res.ok) {
        await fetchProject()
      }
    } finally {
      setAuditing(false)
    }
  }

  const handleDownloadReport = () => {
    window.open(`/api/projects/${params.id}/report`, '_blank')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[300px]" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold mb-1">Project not found</h2>
        <p className="text-sm text-muted-foreground mb-6">This project doesn't exist or you don't have access.</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/project-auditor')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Projects
        </Button>
      </div>
    )
  }

  const tabs = [
    { value: 'overview', label: 'Overview', icon: FileText },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'performance', label: 'Performance', icon: Zap },
    { value: 'dependencies', label: 'Dependencies', icon: Package },
    { value: 'ai-report', label: 'AI Report', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/project-auditor')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              {project.repoUrl.replace(/^https?:\/\//, '')} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadReport} disabled={!latestAudit} className="gap-2">
            <Download className="h-4 w-4" /> PDF Report
          </Button>
          <Button size="sm" onClick={handleRerunAudit} disabled={auditing} className="gap-2">
            {auditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {auditing ? 'Auditing...' : 'Re-run Audit'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <ScoreGauge score={latestAudit?.healthScore ?? project.healthScore} />
            <div className="mt-4 text-center space-y-1">
              <p className="text-sm font-medium">Latest Audit</p>
              <p className="text-xs text-muted-foreground">{latestAudit ? timeAgo(latestAudit.createdAt) : 'No audit yet'}</p>
            </div>
            {project.techStack.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-4">
                {project.techStack.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {!latestAudit ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">No audit data yet</p>
                    <p className="text-xs text-muted-foreground">Run the first audit to see results.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{latestAudit.summary || 'No summary available.'}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium">{latestAudit.status}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Health Score</p>
                        <p className="font-medium">{latestAudit.healthScore ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Scan</p>
                        <p className="font-medium">{timeAgo(latestAudit.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tech Stack</p>
                        <p className="font-medium">{project.techStack.join(', ') || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vulnerabilities</p>
                        <p className="font-medium">{latestAudit.vulns.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outdated Deps</p>
                        <p className="font-medium">{latestAudit.deps.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-4 mt-4">
              {!latestAudit || latestAudit.vulns.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">No vulnerabilities found</p>
                    <p className="text-xs text-muted-foreground">Your project looks clean.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {latestAudit.vulns.map(v => (
                    <Card key={v.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={v.severity} />
                            {v.cveId && <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{v.cveId}</code>}
                          </div>
                        </div>
                        <p className="text-sm font-medium">{v.title}</p>
                        <p className="text-xs text-muted-foreground">{v.description}</p>
                        {v.fix && (
                          <div className="rounded bg-muted/50 p-2 text-xs">
                            <span className="font-medium">Fix: </span>{v.fix}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              {!latestAudit || !latestAudit.perf ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Zap className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">No performance data</p>
                    <p className="text-xs text-muted-foreground">Performance metrics will appear after an audit.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Bundle Size</CardTitle></CardHeader>
                    <CardContent><p className="text-xl font-bold">{latestAudit.perf.bundleSize || 'N/A'}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">LCP</CardTitle></CardHeader>
                    <CardContent><p className="text-xl font-bold">{latestAudit.perf.lcp || 'N/A'}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">TTI</CardTitle></CardHeader>
                    <CardContent><p className="text-xl font-bold">{latestAudit.perf.tti || 'N/A'}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Lighthouse</CardTitle></CardHeader>
                    <CardContent><p className={`text-xl font-bold ${(latestAudit.perf.lighthouseScore ?? 0) >= 80 ? 'text-emerald-500' : (latestAudit.perf.lighthouseScore ?? 0) >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{latestAudit.perf.lighthouseScore ?? 'N/A'}</p></CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dependencies" className="space-y-4 mt-4">
              {!latestAudit || latestAudit.deps.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">All dependencies up to date</p>
                    <p className="text-xs text-muted-foreground">No outdated packages found.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">Package</th>
                        <th className="text-left p-3 font-medium">Current</th>
                        <th className="text-left p-3 font-medium">Latest</th>
                        <th className="text-left p-3 font-medium">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestAudit.deps.map(d => (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="p-3 font-mono text-xs">{d.name}</td>
                          <td className="p-3">{d.current}</td>
                          <td className="p-3 text-emerald-600 dark:text-emerald-400">{d.latest}</td>
                          <td className="p-3"><SeverityBadge severity={d.severity} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ai-report" className="space-y-4 mt-4">
              {!latestAudit?.report ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">No AI report generated</p>
                    <p className="text-xs text-muted-foreground">Run an audit to generate the full AI report.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{latestAudit.report}</div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
