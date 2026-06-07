import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  model: z.enum(['GPT4', 'GPT4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'GEMINI_PRO', 'GEMINI_ULTRA']).optional(),
  systemPrompt: z.string().max(4000).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  maxTokens: z.coerce.number().int().min(1).max(128000).optional(),
  status: z.enum(['ACTIVE', 'IDLE', 'ERROR', 'DISABLED']).optional(),
})

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        permissions: true,
        _count: { select: { logs: true } },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json({ data: agent })
  } catch (error) {
    console.error('GET /api/agents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agent = await prisma.agent.findUnique({ where: { id: params.id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateAgentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const updated = await prisma.agent.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/agents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agent = await prisma.agent.findUnique({ where: { id: params.id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    await prisma.agent.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/agents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
