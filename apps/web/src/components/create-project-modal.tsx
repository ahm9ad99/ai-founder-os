'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus } from 'lucide-react'
import { z } from 'zod'

const techOptions = ['Next.js', 'React', 'Node.js', 'Python', 'Go', 'Rust', 'Vue', 'Laravel']

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  repoUrl: z.string().url('Must be a valid URL').min(1, 'Repository URL is required'),
  description: z.string().max(2000).optional(),
})

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const toggleTech = (t: string) => {
    setTechStack(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const handleSubmit = async () => {
    const parsed = projectSchema.safeParse({ name, repoUrl, description })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.errors.forEach(e => { fieldErrors[e.path[0] as string] = e.message })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSubmitting(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, repoUrl, techStack, description: description || undefined }),
      })
      if (res.ok) {
        setName('')
        setRepoUrl('')
        setDescription('')
        setTechStack([])
        onOpenChange(false)
        onCreated()
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to create project' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Project Audit</DialogTitle>
          <DialogDescription>Add a project to run an automated health and security audit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="My Awesome App" />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>Repository URL</Label>
            <Input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/user/repo" />
            {errors.repoUrl && <p className="text-xs text-red-500">{errors.repoUrl}</p>}
          </div>
          <div className="space-y-2">
            <Label>Tech Stack</Label>
            <div className="flex flex-wrap gap-1.5">
              {techOptions.map(t => (
                <Badge
                  key={t}
                  variant={techStack.includes(t) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTech(t)}
                >
                  {techStack.includes(t) ? '✓ ' : '+ '}{t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the project..." rows={3} />
          </div>
          {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {submitting ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
