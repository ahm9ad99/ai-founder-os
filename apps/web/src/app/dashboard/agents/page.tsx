'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Plus,
  Bot,
  Activity,
  DollarSign,
  Play,
  Square,
  Settings,
  AlertCircle,
  Search,
  Cpu,
} from 'lucide-react'
import { cn, formatTokenCount } from '@/lib/utils'
import { CreateAgentModal } from '@/components/agents/create-agent-modal'
import { toast } from 'sonner'

type Agent = {
  id: string
  name: string
  model: string
  status: string
  tokenUsage: number
  tokenCost: number
  _count?: { logs: number }
  createdAt: string
}

export default function AgentsPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error('Failed to load agents')
      const json = await res.json()
      setAgents(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const handleToggleStatus = async (agent: Agent) => {
    const newStatus = agent.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, status: newStatus } : a)),
      )
      toast.success(`${agent.name} ${newStatus === 'ACTIVE' ? 'activated' : 'paused'}`)
    } catch {
      toast.error('Failed to update agent status')
    }
  }

  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalTokens = agents.reduce((sum, a) => sum + a.tokenUsage, 0)
  const totalCost = agents.reduce((sum, a) => sum + a.tokenCost, 0)
  const onlineCount = agents.filter((a) => a.status === 'ACTIVE').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor your AI agents across models
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-12" /> : agents.length}</div>
            {!loading && (
              <p className="text-xs text-muted-foreground">
                {onlineCount} online
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-12" /> : agents.reduce((s, a) => s + (a._count?.logs ?? 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : formatTokenCount(totalTokens)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `$${totalCost.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <CardTitle className="text-sm font-medium">All Agents</CardTitle>
            <div className="relative ml-auto w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                className="h-8 pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchAgents}>
                Retry
              </Button>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No agents found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first agent to get started'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Create Agent
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Token Usage</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow
                    key={agent.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                  >
                    <TableCell className="font-medium">{agent.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {agent.model.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                        className={cn(
                          agent.status === 'ACTIVE' && 'bg-emerald-500/10 text-emerald-500',
                          agent.status === 'IDLE' && 'bg-yellow-500/10 text-yellow-500',
                          agent.status === 'ERROR' && 'bg-red-500/10 text-red-500',
                        )}
                      >
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{agent._count?.logs ?? 0}</TableCell>
                    <TableCell>{formatTokenCount(agent.tokenUsage)}</TableCell>
                    <TableCell>${agent.tokenCost.toFixed(4)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleStatus(agent)}
                          title={agent.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        >
                          {agent.status === 'ACTIVE' ? (
                            <Square className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/dashboard/agents/${agent.id}`)}
                          title="Settings"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateAgentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreated={fetchAgents}
      />
    </div>
  )
}
