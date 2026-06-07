'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().default(''),
  model: z.enum(['GPT4', 'GPT4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'GEMINI_PRO', 'GEMINI_ULTRA']),
  systemPrompt: z.string().max(4000).optional().default(''),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().int().min(1).max(128000).default(4096),
})

type CreateAgentForm = z.infer<typeof createAgentSchema>

const modelOptions = [
  { value: 'GPT4', label: 'GPT-4 (OpenAI)' },
  { value: 'CLAUDE_3_SONNET', label: 'Claude 3 Sonnet (Anthropic)' },
  { value: 'GEMINI_PRO', label: 'Gemini Pro (Google)' },
]

interface CreateAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function CreateAgentModal({ open, onOpenChange, onCreated }: CreateAgentModalProps) {
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAgentForm>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: '',
      description: '',
      model: 'GPT4',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 4096,
    },
  })

  const selectedModel = watch('model')

  const onSubmit = async (data: CreateAgentForm) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to create agent')
      }

      toast.success(`Agent "${data.name}" created successfully`)
      reset()
      onOpenChange(false)
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Configure a new AI agent for your organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              placeholder="e.g., Code Review Assistant"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <select
              id="model"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedModel}
              onChange={(e) => setValue('model', e.target.value as any)}
            >
              {modelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="What should this agent do?"
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt (optional)</Label>
            <textarea
              id="systemPrompt"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="You are a helpful AI assistant that..."
              {...register('systemPrompt')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature ({watch('temperature')})
              </Label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                className="w-full"
                {...register('temperature', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                {...register('maxTokens')}
              />
              {errors.maxTokens && (
                <p className="text-xs text-destructive">{errors.maxTokens.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
