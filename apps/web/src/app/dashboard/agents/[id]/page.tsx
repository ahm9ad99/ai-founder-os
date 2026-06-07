'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Bot,
  Play,
  Square,
  Trash2,
  Activity,
  DollarSign,
  Cpu,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn, formatRelativeTime, formatTokenCount } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

type AgentLog = {
  id: string
  action: string
  input: string | null
  output: string | null
  tokensUsed: number | null
  cost: number | null
  duration: number | null
  status: string
  createdAt: string
}

type Agent = {
  id: string
  name: string
  description: string | null
  model: string
  status: string
  systemPrompt: string | null
  temperature: number
  maxTokens: number
  tokenUsage: number
  tokenCost: number
  createdAt: string
  updatedAt: string
  logs: AgentLog[]
  permissions: { id: string; action: string; enabled: boolean }[]
  _count: { logs: number }
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logPage, setLogPage] = useState(1)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [logsTotal, setLogsTotal] = useState(0)
  const [logsLoading, setLogsLoading] = useState(false)

  const fetchAgent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/agents/${params.id}`)
      if (!res.ok) throw new Error('Agent not found')
      const json = await res.json()
      setAgent(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  const fetchLogs = useCallback(async (page: number) => {
    setLogsLoading(true)
    try {
      const res = await fetch(`/api/agents/${params.id}/logs?page=${page}&limit=20`)
      const json = await res.json()
      setLogs(json.data ?? [])
      setLogsTotal(json.pagination?.total ?? 0)
      setLogPage(page)
    } finally {
      setLogsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchAgent()
    fetchLogs(1)
  }, [fetchAgent, fetchLogs])

  const handleToggleStatus = async () => {
    if (!agent) return
    const newStatus = agent.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setAgent({ ...agent, status: newStatus })
      toast.success(`Agent ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!agent || !confirm(`Delete "${agent.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Agent deleted')
      router.push('/dashboard/agents')
    } catch {
      toast.error('Failed to delete agent')
    }
  }

  const tokenChartData = dayNames.map((day) => {
    const dayIndex = dayNames.indexOf(day)
    const dayLogs = (agent?.logs ?? []).filter((log) => {
      const logDay = new Date(log.createdAt).getDay()
      return logDay === dayIndex
    })
    const total = dayLogs.reduce((sum, l) => sum + (l.tokensUsed ?? 0), 0)
    return { day, tokens: total }
  })

  const totalPages = Math.ceil(logsTotal / 20)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground">{error ?? 'Agent not found'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/agents')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {agent.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{agent.name}</h1>
              <Badge
                variant={
                  agent.status === 'ACTIVE'
                    ? 'success'
                    : agent.status === 'IDLE'
                    ? 'warning'
                    : agent.status === 'ERROR'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {agent.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {agent.model.replace(/_/g, ' ')} &middot; Created{' '}
              {formatRelativeTime(agent.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={agent.status === 'ACTIVE' ? 'outline' : 'default'}
            size="sm"
            onClick={handleToggleStatus}
            className="gap-2"
          >
            {agent.status === 'ACTIVE' ? (
              <>
                <Square className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Activate
              </>
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent._count.logs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokenCount(agent.tokenUsage)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${agent.tokenCost.toFixed(4)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Model</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{agent.model.replace(/_/g, ' ')}</div>
            <p className="text-xs text-muted-foreground">
              Temp: {agent.temperature} &middot; Max: {formatTokenCount(agent.maxTokens)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Token Usage (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tokenChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">System Prompt</p>
              <p className="text-sm mt-0.5">
                {agent.systemPrompt || (
                  <span className="italic text-muted-foreground">None set</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm mt-0.5">
                {agent.description || (
                  <span className="italic text-muted-foreground">No description</span>
                )}
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">Permissions</p>
              {agent.permissions.length === 0 ? (
                <p className="text-sm italic text-muted-foreground">No permissions configured</p>
              ) : (
                <div className="space-y-1">
                  {agent.permissions.map((perm) => (
                    <div key={perm.id} className="flex items-center justify-between text-sm">
                      <span>{perm.action}</span>
                      <Badge variant={perm.enabled ? 'success' : 'secondary'}>
                        {perm.enabled ? 'Allowed' : 'Denied'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Activity Log</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={logPage <= 1 || logsLoading}
                onClick={() => fetchLogs(logPage - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {logPage} / {totalPages || 1}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={logPage >= totalPages || logsLoading}
                onClick={() => fetchLogs(logPage + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No activity yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatRelativeTime(log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{log.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.status === 'SUCCESS'
                            ? 'success'
                            : log.status === 'ERROR'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.tokensUsed ? log.tokensUsed.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.cost ? `$${log.cost.toFixed(6)}` : '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
