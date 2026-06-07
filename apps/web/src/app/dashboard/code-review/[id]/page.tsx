'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Shield,
  Zap,
  Lightbulb,
  AlertTriangle,
  Download,
  ArrowLeft,
  GitBranch,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { cn, formatDate, formatRelativeTime } from '@/lib/utils'

type Issue = {
  id: string
  category: string | null
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  description: string | null
  suggestion: string | null
  file: string | null
  line: number | null
  code: string | null
  isFixed: boolean
}

type PullRequestRef = {
  title: string
  author: string | null
  branch: string | null
  repo: string | null
  url: string | null
}

type Review = {
  id: string
  prTitle: string | null
  branch: string | null
  repo: string | null
  prUrl: string | null
  status: string
  qualityScore: number | null
  summary: string | null
  createdAt: string
  updatedAt: string
  issues: Issue[]
  pullRequest: PullRequestRef | null
}

const severityStyles: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

function ScoreGauge({ score }: { score: number | null }) {
  const value = score ?? 0
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
  const circumference = 2 * Math.PI * 54
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <svg width="130" height="130" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" className="stroke-secondary" strokeWidth="10" />
        <circle
          cx="70" cy="70" r="54" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="70" y="66" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="28" fontWeight="bold">
          {value}
        </text>
        <text x="70" y="90" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="11">
          / 100
        </text>
      </svg>
    </div>
  )
}

export default function CodeReviewDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(`/api/code-review/${id}`)
      .then((r) => r.json())
      .then((json) => setReview(json.data ?? json))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/code-review/${id}/report`)
      if (!res.ok) throw new Error('Failed to generate report')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `code-review-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // fallback
    }
    setDownloading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground">Review not found</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  const securityIssues = review.issues.filter((i) => i.category === 'security')
  const perfIssues = review.issues.filter((i) => i.category === 'performance')
  const suggestions = review.issues.filter((i) => i.suggestion)
  const repo = review.repo ?? review.pullRequest?.repo
  const branch = review.branch ?? review.pullRequest?.branch
  const author = review.pullRequest?.author

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{review.prTitle ?? 'Code Review'}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
              <GitBranch className="h-3 w-3 shrink-0" />
              <span className="truncate">{branch ?? 'main'}</span>
              {repo && (
                <>
                  <span className="text-muted-foreground/50">&middot;</span>
                  <span className="truncate">{repo}</span>
                </>
              )}
              {author && (
                <>
                  <span className="text-muted-foreground/50">&middot;</span>
                  <span>{author}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2 shrink-0"
        >
          {downloading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardContent className="p-4 flex items-center justify-center">
            <ScoreGauge score={review.qualityScore} />
          </CardContent>
        </Card>
        {[
          {
            label: 'Total Issues',
            value: review.issues.length,
            icon: AlertTriangle,
            color: 'text-yellow-500',
          },
          {
            label: 'Security Alerts',
            value: securityIssues.length,
            icon: Shield,
            color: 'text-red-500',
          },
          {
            label: 'Suggestions',
            value: suggestions.length,
            icon: Lightbulb,
            color: 'text-blue-500',
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues ({review.issues.length})</TabsTrigger>
          <TabsTrigger value="security">
            Security ({securityIssues.length})
          </TabsTrigger>
          <TabsTrigger value="performance">
            Performance ({perfIssues.length})
          </TabsTrigger>
          <TabsTrigger value="suggestions">
            Suggestions ({suggestions.length})
          </TabsTrigger>
        </TabsList>

        {[
          { value: 'issues', items: review.issues },
          { value: 'security', items: securityIssues },
          { value: 'performance', items: perfIssues },
          { value: 'suggestions', items: suggestions },
        ].map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-3 mt-4">
            {tab.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">No items in this category</p>
              </div>
            ) : (
              tab.items.map((issue) => (
                <Card key={issue.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={cn(
                              'text-xs border',
                              severityStyles[issue.severity] ?? 'bg-muted text-muted-foreground',
                            )}
                          >
                            {issue.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {issue.file ?? 'unknown'}
                            {issue.line != null ? `:${issue.line}` : ''}
                          </span>
                          {issue.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {issue.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{issue.title}</p>
                        {issue.description && (
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                        )}
                        {issue.suggestion && (
                          <p className="text-xs text-primary mt-1">
                            💡 {issue.suggestion}
                          </p>
                        )}
                        {issue.code && (
                          <pre className="mt-2 rounded-md bg-muted p-3 overflow-x-auto text-xs font-mono">
                            <code>{issue.code}</code>
                          </pre>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
