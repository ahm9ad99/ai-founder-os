'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { GeneratePrdModal } from '@/components/generate-prd-modal'
import { GenerateRoadmapModal } from '@/components/generate-roadmap-modal'
import { useRouter } from 'next/navigation'
import { Bot, User, Send, Loader2, ArrowLeft, FileText, Route } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  role: 'USER' | 'AI'
  content: string
  createdAt: string
}

export default function CtoSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<{ title: string; contextType: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [prdModalOpen, setPrdModalOpen] = useState(false)
  const [roadmapModalOpen, setRoadmapModalOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const [sessionRes, messagesRes] = await Promise.all([
          fetch(`/api/cto/sessions`),
          fetch(`/api/cto/sessions/${params.id}/messages`),
        ])
        if (sessionRes.status === 404 || messagesRes.status === 404) {
          setNotFound(true)
          return
        }
        if (!sessionRes.ok || !messagesRes.ok) throw new Error('Failed to load')
        const sessionsData = await sessionRes.json()
        const messagesData = await messagesRes.json()
        const found = sessionsData.data.find((s: any) => s.id === params.id)
        if (!found) { setNotFound(true); return }
        setSession(found)
        setMessages(messagesData.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, { id: 'temp', role: 'USER', content: text, createdAt: new Date().toISOString() }])
    try {
      const res = await fetch(`/api/cto/sessions/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const data = await res.json()
      setMessages((prev) => prev.filter((m) => m.id !== 'temp').concat(data.data))
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== 'temp'))
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Bot className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Session not found</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/ai-cto')}>Back to AI CTO</Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive font-medium">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ai-cto">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">{session?.title}</h1>
            <Badge variant="secondary" className="text-[10px]">{session?.contextType}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPrdModalOpen(true)}>
            <FileText className="h-3 w-3 mr-1" /> Generate PRD
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRoadmapModalOpen(true)}>
            <Route className="h-3 w-3 mr-1" /> Generate Roadmap
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Start the conversation</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Tell the AI CTO about your project idea, and it will help you refine it, generate PRDs, and create roadmaps.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-3 ${m.role === 'USER' ? 'justify-end' : ''}`}>
              {m.role === 'AI' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-lg p-3 ${
                m.role === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </p>
              </div>
              {m.role === 'USER' && (
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
        <Textarea
          placeholder="Ask the AI CTO anything about your project..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          className="flex-1"
          rows={2}
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()} className="self-end">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <GeneratePrdModal open={prdModalOpen} onOpenChange={setPrdModalOpen} sessionId={params.id} />
      <GenerateRoadmapModal open={roadmapModalOpen} onOpenChange={setRoadmapModalOpen} sessionId={params.id} />
    </div>
  )
}
