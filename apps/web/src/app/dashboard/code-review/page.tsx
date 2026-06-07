'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  GitPullRequest,
  GitBranch,
  Search,
  RefreshCw,
  Github,
  Plus,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'

type CodeIssue = {
  id: string
  severity: string
  category: string | null
  title: string
  file: string | null
}

type PullRequestRef = {
  title: string
  author: string | null
  branch: string
  repo: string | null
}

type CodeReview = {
  id: string
  title: string
  status: string
  qualityScore: number | null
  securityScore: number | null
  summary: string | null
  createdAt: string
  completedAt: string | null
  issues: CodeIssue[]
  pullRequest: PullRequestRef | null
  _count: { issues: number }
}

type AggregatedCounts = {
  critical: number
  high: number
  medium: number
  low: number
  security: number
}

function aggregateIssues(reviews: CodeReview[]): AggregatedCounts {
  const counts: AggregatedCounts = { critical: 0, high: 0, medium: 0, low: 0, security: 0 }
  for (const r of reviews) {
    for (const i of r.issues) {
      const sev = i.severity.toLowerCase() as keyof AggregatedCounts
      if (sev in counts) counts[sev]++
      if (i.category === 'security') counts.security++
    }
  }
  return counts
}

function getWorstSeverity(issues: CodeIssue[]): string | null {
  const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  for (const sev of order) {
    if (issues.some((i) => i.severity === sev)) return sev
  }
  return null
}

export default function CodeReviewPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<CodeReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [repoSearch, setRepoSearch] = useState('')

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (severityFilter) params.set('severity', severityFilter)
      if (repoSearch) params.set('repo', repoSearch)

      const res = await fetch(`/api/code-review?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load reviews')
      const json = await res.json()
      setReviews(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, severityFilter, repoSearch])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const counts = aggregateIssues(reviews)
  const completedReviews = reviews.filter((r) => r.status === 'COMPLETED')
  const avgScore =
    completedReviews.length > 0
      ? Math.round(
          completedReviews.reduce((s, r) => s + (r.qualityScore ?? 0), 0) /
            completedReviews.length,
        )
      : 0

  const uniqueRepos = [...new Set(reviews.map((r) => r.pullRequest?.repo).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Code Review Auditor</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered code review and security analysis for your pull requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {uniqueRepos.length === 0 && !loading && (
            <Button className="gap-2">
              <Github className="h-4 w-4" /> Connect GitHub
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={fetchReviews}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reviews Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{completedReviews.length}</div>
                <p className="text-xs text-muted-foreground">Total completed</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{avgScore || '—'}</div>
                <p className="text-xs text-muted-foreground">/100</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    counts.critical > 0 ? 'text-red-500' : 'text-muted-foreground',
                  )}
                >
                  {counts.critical}
                </div>
                <p className="text-xs text-muted-foreground">Require immediate action</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    counts.security > 0 ? 'text-red-500' : 'text-muted-foreground',
                  )}
                >
                  {counts.security}
                </div>
                <p className="text-xs text-muted-foreground">Across all reviews</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-sm font-medium">Pull Requests</CardTitle>
            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search repo..."
                  className="h-8 pl-8 text-xs"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                />
              </div>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchReviews}>
                Retry
              </Button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitPullRequest className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No pull requests reviewed yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                {statusFilter || severityFilter || repoSearch
                  ? 'Try adjusting your filters'
                  : 'Connect your GitHub repositories to start reviewing pull requests with AI'}
              </p>
              {!statusFilter && !severityFilter && !repoSearch && (
                <Button className="mt-4 gap-2">
                  <Github className="h-4 w-4" /> Connect GitHub
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => {
                  const worst = getWorstSeverity(review.issues)
                  const repo = review.pullRequest?.repo ?? '—'
                  const author = review.pullRequest?.author ?? null
                  return (
                    <TableRow
                      key={review.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/code-review/${review.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs">{repo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-snug">
                            {review.title}
                          </span>
                          {author && (
                            <span className="text-xs text-muted-foreground">{author}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            review.status === 'COMPLETED'
                              ? 'success'
                              : review.status === 'IN_PROGRESS'
                              ? 'warning'
                              : review.status === 'FAILED'
                              ? 'destructive'
                              : 'secondary'
                          }
                          className={cn(
                            review.status === 'COMPLETED' && 'bg-emerald-500/10 text-emerald-500',
                            review.status === 'IN_PROGRESS' && 'bg-blue-500/10 text-blue-500',
                            review.status === 'FAILED' && 'bg-red-500/10 text-red-500',
                          )}
                        >
                          {review.status === 'IN_PROGRESS'
                            ? 'Reviewing'
                            : review.status.charAt(0) + review.status.slice(1).toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {review.qualityScore != null ? (
                          <span
                            className={cn(
                              'font-semibold text-sm',
                              review.qualityScore >= 85
                                ? 'text-emerald-500'
                                : review.qualityScore >= 65
                                ? 'text-yellow-500'
                                : 'text-red-500',
                            )}
                          >
                            {review.qualityScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {review._count.issues > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                worst === 'CRITICAL'
                                  ? 'destructive'
                                  : worst === 'HIGH'
                                  ? 'warning'
                                  : worst === 'MEDIUM'
                                  ? 'info'
                                  : 'secondary'
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {review._count.issues}
                            </Badge>
                            {worst && (
                              <span
                                className={cn(
                                  'text-[10px] font-medium',
                                  worst === 'CRITICAL'
                                    ? 'text-red-500'
                                    : worst === 'HIGH'
                                    ? 'text-orange-500'
                                    : worst === 'MEDIUM'
                                    ? 'text-yellow-500'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {worst}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(review.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && reviews.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Issue Severity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Critical', count: counts.critical, color: 'bg-red-500' },
                  { label: 'High', count: counts.high, color: 'bg-orange-500' },
                  { label: 'Medium', count: counts.medium, color: 'bg-yellow-500' },
                  { label: 'Low', count: counts.low, color: 'bg-green-500' },
                ].map((item) => {
                  const totalIssues = counts.critical + counts.high + counts.medium + counts.low
                  const pct = totalIssues > 0 ? (item.count / totalIssues) * 100 : 0
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span
                          className={
                            item.label === 'Critical'
                              ? 'text-red-500'
                              : item.label === 'High'
                              ? 'text-orange-500'
                              : item.label === 'Medium'
                              ? 'text-yellow-500'
                              : 'text-muted-foreground'
                          }
                        >
                          {item.label}
                        </span>
                        <span className="text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', item.color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Connected Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              {uniqueRepos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Github className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No repositories connected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {uniqueRepos.map((repo) => {
                    const repoReviews = reviews.filter(
                      (r) => r.pullRequest?.repo === repo,
                    )
                    const lastReview = repoReviews[0]
                    return (
                      <div
                        key={repo}
                        className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{repo}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{repoReviews.length} reviews</span>
                          {lastReview && (
                            <span>Latest {formatRelativeTime(lastReview.createdAt)}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
