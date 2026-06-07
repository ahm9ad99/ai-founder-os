'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain, Code2, Bot, AlertTriangle, DollarSign, Activity, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils'

type DashboardMetrics = {
  activeAgents: number
  agentChange: number
  weeklyReviews: number
  reviewChange: number
  mrr: number
  mrrChange: number
  openIssues: number
  criticalIssues: number
  tokenUsage: { day: string; tokens: number }[]
  recentActivity: { id: string; text: string; time: Date; type: string }[]
  moduleStatus: { name: string; status: string; icon: string }[]
  planDistribution: { name: string; percentage: number }[]
}

const defaultMetrics: DashboardMetrics = {
  activeAgents: 0,
  agentChange: 0,
  weeklyReviews: 0,
  reviewChange: 0,
  mrr: 0,
  mrrChange: 0,
  openIssues: 0,
  criticalIssues: 0,
  tokenUsage: [],
  recentActivity: [],
  moduleStatus: [],
  planDistribution: [],
}

function MetricSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  )
}

function formatChange(value: number) {
  const sign = value >= 0 ? '+' : ''
  const color = value >= 0 ? 'text-emerald-500' : 'text-red-500'
  const Icon = value >= 0 ? TrendingUp : TrendingDown
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', color)}>
      <Icon className="h-3 w-3" />
      {sign}{value}%
    </span>
  )
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/dashboard/metrics')
        if (!res.ok) throw new Error('Failed to load metrics')
        const json = await res.json()
        setMetrics(json.data ?? defaultMetrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your AI Founder OS instance
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
            <MetricSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeAgents}</div>
                {formatChange(metrics.agentChange)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Reviews This Week</CardTitle>
                <Code2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.weeklyReviews}</div>
                {formatChange(metrics.reviewChange)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Monthly MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.mrr)}</div>
                {formatChange(metrics.mrrChange)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.openIssues}</div>
                {metrics.criticalIssues > 0 && (
                  <span className="text-xs text-red-500">
                    {metrics.criticalIssues} critical
                  </span>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Token Usage (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : metrics.tokenUsage.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No token data yet
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.tokenUsage}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                    <XAxis
                      dataKey="day"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(value: number) => [value.toLocaleString(), 'Tokens']}
                    />
                    <Bar
                      dataKey="tokens"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : metrics.recentActivity.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No activity yet
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        item.type === 'agent'
                          ? 'bg-primary'
                          : item.type === 'review'
                          ? 'bg-accent'
                          : item.type === 'billing'
                          ? 'bg-yellow-500'
                          : item.type === 'security'
                          ? 'bg-red-500'
                          : 'bg-muted-foreground',
                      )}
                    />
                    <div className="flex-1 space-y-0.5">
                      <p className="text-sm leading-snug text-foreground">{item.text}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(item.time)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Module Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid gap-2">
                {metrics.moduleStatus.map((mod) => {
                  const statusColor =
                    mod.status === 'online' || mod.status === 'active'
                      ? 'success'
                      : mod.status === 'idle'
                      ? 'warning'
                      : 'secondary'
                  return (
                    <div
                      key={mod.name}
                      className="flex items-center justify-between rounded-lg border px-3 py-2.5"
                    >
                      <span className="text-sm font-medium">{mod.name}</span>
                      <Badge variant={statusColor as any}>{mod.status}</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : metrics.planDistribution.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No plan data yet
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.planDistribution.map((plan) => (
                  <div key={plan.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span>{plan.name}</span>
                      <span className="text-muted-foreground">
                        {plan.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${plan.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
