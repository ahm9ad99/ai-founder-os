'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus, Search, Filter, MessageSquare, CheckCircle2, Clock,
  AlertTriangle, ArrowUpDown, Loader2,
} from 'lucide-react'

type Ticket = {
  id: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  customerName: string | null
  customerEmail: string | null
  createdAt: string
  _count: { messages: number }
}

type BusinessTaskItem = {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
  priority: string | null
  assigneeId: string | null
  dueDate: string | null
  createdAt: string
}

export default function BusinessOpsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [tasks, setTasks] = useState<BusinessTaskItem[]>([])
  const [activeTab, setActiveTab] = useState('tickets')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTicket, setNewTicket] = useState({ subject: '', body: '', customerName: '', customerEmail: '', priority: 'MEDIUM' })
  const [stats, setStats] = useState({ openTickets: 0, highPriority: 0, aiSuggestions: 0, avgResponse: '0h' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ticketRes] = await Promise.all([
        fetch('/api/business/tickets'),
      ])
      if (ticketRes.ok) {
        const ticketData = await ticketRes.json()
        setTickets(ticketData.data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/business/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.data)
      }
    } catch {}
  }, [])

  useEffect(() => { fetchData(); fetchTasks() }, [fetchData, fetchTasks])

  useEffect(() => {
    const open = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS')
    const high = tickets.filter(t => t.priority === 'URGENT' || t.priority === 'HIGH')
    const suggestions = tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED')
    setStats({
      openTickets: open.length,
      highPriority: high.length,
      aiSuggestions: suggestions.length,
      avgResponse: '1.2h',
    })
  }, [tickets])

  useEffect(() => {
    let result = [...tickets]
    if (search) {
      result = result.filter(t =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        t.customerEmail?.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (statusFilter !== 'ALL') result = result.filter(t => t.status === statusFilter)
    if (priorityFilter !== 'ALL') result = result.filter(t => t.priority === priorityFilter)
    setFilteredTickets(result)
  }, [search, statusFilter, priorityFilter, tickets])

  const handleCreateTicket = async () => {
    const res = await fetch('/api/business/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    })
    if (res.ok) {
      setDialogOpen(false)
      setNewTicket({ subject: '', body: '', customerName: '', customerEmail: '', priority: 'MEDIUM' })
      fetchData()
    }
  }

  const statusColor: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }

  const priorityColor: Record<string, string> = {
    URGENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  }

  const taskStatusIcon: Record<string, React.ReactNode> = {
    TODO: <Clock className="h-4 w-4 text-muted-foreground" />,
    IN_PROGRESS: <Loader2 className="h-4 w-4 text-blue-500" />,
    DONE: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    CANCELLED: <AlertTriangle className="h-4 w-4 text-gray-400" />,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Operator</h1>
          <p className="text-sm text-muted-foreground">Customer management and operations automation</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Customer Ticket</DialogTitle>
              <DialogDescription>Add a new support ticket to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={newTicket.subject} onChange={e => setNewTicket(p => ({ ...p, subject: e.target.value }))} placeholder="Brief summary" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newTicket.body} onChange={e => setNewTicket(p => ({ ...p, body: e.target.value }))} placeholder="Details of the issue..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input value={newTicket.customerName} onChange={e => setNewTicket(p => ({ ...p, customerName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Customer Email</Label>
                  <Input value={newTicket.customerEmail} onChange={e => setNewTicket(p => ({ ...p, customerEmail: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={newTicket.priority} onValueChange={v => setNewTicket(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket}>Create Ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-red-500">{stats.highPriority} high priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</div>
            <p className="text-xs text-muted-foreground">{tasks.filter(t => t.status === 'TODO').length} pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponse}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.aiSuggestions}</div>
            <p className="text-xs text-emerald-500">Ready to review</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-1" /> Status</SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]"><ArrowUpDown className="h-4 w-4 mr-1" /> Priority</SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No tickets found</p>
                <p className="text-sm text-muted-foreground">Create a new ticket to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/business-ops/tickets/${ticket.id}`)}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {(ticket.customerName?.[0] || ticket.customerEmail?.[0] || '?').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {ticket.customerName || ticket.customerEmail || 'Anonymous'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[ticket.status] || ''}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[ticket.priority] || ''}`}>
                          {ticket.priority}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {ticket._count.messages}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No tasks yet</p>
                <p className="text-sm text-muted-foreground">Tasks will appear here when created from tickets.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-4">
                      {taskStatusIcon[task.status] || <Clock className="h-4 w-4" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.status.replace('_', ' ')} · {task.priority || 'medium'} priority
                          {task.dueDate ? ` · Due ${new Date(task.dueDate).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        task.status === 'DONE' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
