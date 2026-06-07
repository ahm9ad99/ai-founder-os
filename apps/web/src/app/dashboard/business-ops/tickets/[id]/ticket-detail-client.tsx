'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Send, Sparkles, MessageSquare, Plus,
  CheckCircle2, Loader2, Bot, User,
} from 'lucide-react'

type Message = {
  id: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  createdAt: string
}

type TicketTask = {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
  assignee: { firstName: string | null; lastName: string | null; avatarUrl: string | null } | null
}

type Ticket = {
  id: string
  subject: string
  body: string | null
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  customerName: string | null
  customerEmail: string | null
  assignee: { firstName: string | null; lastName: string | null; avatarUrl: string | null } | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  messages: Message[]
  tasks: TicketTask[]
}

export function TicketDetailClient({ ticket: initialTicket, ticketId }: { ticket: Ticket; ticketId: string }) {
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket>(initialTicket)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/business/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage, role: 'USER' }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setTicket(prev => ({ ...prev, messages: [...prev.messages, data] }))
        setNewMessage('')
      }
    } finally {
      setSending(false)
    }
  }

  const handleGenerateAiReply = async () => {
    setAiLoading(true)
    setAiSuggestion(null)
    try {
      const res = await fetch(`/api/business/tickets/${ticketId}/ai-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        const { data } = await res.json()
        setAiSuggestion(data.reply)
      }
    } finally {
      setAiLoading(false)
    }
  }

  const handleSendAiReply = async () => {
    if (!aiSuggestion) return
    setSending(true)
    try {
      const res = await fetch(`/api/business/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: aiSuggestion, role: 'ASSISTANT' }),
      })
      if (res.ok) {
        const { data } = await res.json()
        setTicket(prev => ({ ...prev, messages: [...prev.messages, data] }))
        setAiSuggestion(null)
      }
    } finally {
      setSending(false)
    }
  }

  const handleUpdateTicket = async (updates: Partial<{ status: string; priority: string }>) => {
    const res = await fetch(`/api/business/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const { data } = await res.json()
      setTicket(prev => ({ ...prev, ...data }))
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/business-ops')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            Created {new Date(ticket.createdAt).toLocaleDateString()}
            {ticket.customerName && ` by ${ticket.customerName}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={ticket.status} onValueChange={v => handleUpdateTicket({ status: v })}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ticket.priority} onValueChange={v => handleUpdateTicket({ priority: v })}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.body && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  {ticket.body}
                </div>
              )}

              {ticket.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ticket.messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'USER' ? '' : 'flex-row-reverse'}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {msg.role === 'USER' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        msg.role === 'USER'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.role === 'USER' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}>
                          {msg.role === 'USER' ? 'Customer' : 'AI'} · {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="min-h-[60px]"
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={handleGenerateAiReply} disabled={aiLoading} className="gap-2">
                  {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI Reply
                </Button>
                <Button size="sm" onClick={handleSendMessage} disabled={sending || !newMessage.trim()} className="gap-2">
                  {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {aiSuggestion && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Suggested Reply
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm whitespace-pre-wrap">{aiSuggestion}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSendAiReply} className="gap-2">
                    <Send className="h-3 w-3" /> Send Reply
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleGenerateAiReply} disabled={aiLoading} className="gap-2">
                    <Sparkles className="h-3 w-3" /> Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[ticket.status] || ''}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColor[ticket.priority] || ''}`}>
                  {ticket.priority}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm">{ticket.customerName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{ticket.customerEmail || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned To</p>
                <p className="text-sm">{ticket.assignee ? `${ticket.assignee.firstName} ${ticket.assignee.lastName}` : 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Messages</p>
                <p className="text-sm">{ticket.messages.length}</p>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                  <p className="text-sm">{new Date(ticket.resolvedAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ticket.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks</p>
              ) : (
                ticket.tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 rounded-lg border p-2">
                    {task.status === 'DONE'
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">{task.status.replace('_', ' ')}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
