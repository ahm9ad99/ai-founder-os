'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { FileText, ArrowLeft, Download, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface PRD {
  id: string
  title: string
  content: string
  status: string
  createdAt: string
}

export default function PrdPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [prd, setPrd] = useState<PRD | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cto/prds/${params.id}`)
        if (res.status === 404) { setNotFound(true); return }
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setPrd(data.data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  async function handleExport() {
    try {
      const res = await fetch(`/api/cto/prds/${params.id}/export`)
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = `${prd?.title ?? 'prd'}.md`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
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
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">PRD not found</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/ai-cto')}>Back to AI CTO</Button>
      </div>
    )
  }

  if (error || !prd) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive font-medium">{error ?? 'PRD not found'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/ai-cto')}>Back</Button>
      </div>
    )
  }

  const statusColor: Record<string, string> = {
    DRAFT: 'bg-blue-500/10 text-blue-500',
    REVIEW: 'bg-yellow-500/10 text-yellow-500',
    APPROVED: 'bg-emerald-500/10 text-emerald-500',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ai-cto">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{prd.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={statusColor[prd.status] ?? ''}>{prd.status}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(prd.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" /> Export
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Product Requirements Document</CardTitle>
        </CardHeader>
        <CardContent>
          <article className="prose prose-sm max-w-none dark:prose-invert">
            {prd.content.split('\n').map((line, i) => {
              if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-6 mb-2">{line.slice(2)}</h1>
              if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2">{line.slice(3)}</h2>
              if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mt-4 mb-1">{line.slice(4)}</h3>
              if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>
              if (line.startsWith('|')) return <p key={i} className="text-sm font-mono text-muted-foreground">{line}</p>
              if (line.trim() === '') return <br key={i} />
              return <p key={i} className="text-sm text-muted-foreground">{line}</p>
            })}
          </article>
        </CardContent>
      </Card>
    </div>
  )
}
