import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  model: z.enum(['GPT4', 'GPT4_TURBO', 'CLAUDE_3_OPUS', 'CLAUDE_3_SONNET', 'GEMINI_PRO', 'GEMINI_ULTRA']).default('GPT4'),
  systemPrompt: z.string().max(4000).optional().default(''),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  maxTokens: z.coerce.number().int().min(1).max(128000).default(4096),
})

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
    })

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const agents = await prisma.agent.findMany({
      where: { organizationId: orgMember.organizationId },
      include: {
        _count: { select: { logs: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: agents })
  } catch (error) {
    console.error('GET /api/agents:', error)
    return NextResponse.json({ error: 'Internal server error', data: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id },
      include: {
        organization: {
          include: { subscription: true },
        },
      },
    })

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = createAgentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const planLimits: Record<string, number> = {
      FREE: 1,
      STARTER: 5,
      PRO: 15,
      BUSINESS: 50,
      ENTERPRISE: 9999,
    }

    const subscription = orgMember.organization.subscription
    const maxAgents = planLimits[subscription?.planType ?? 'FREE'] ?? 1

    const agentCount = await prisma.agent.count({
      where: { organizationId: orgMember.organizationId },
    })

    if (agentCount >= maxAgents) {
      return NextResponse.json(
        {
          error: `Agent limit reached. Your plan allows ${maxAgents} agent${maxAgents === 1 ? '' : 's'}. Upgrade to create more.`,
        },
        { status: 403 },
      )
    }

    const agent = await prisma.agent.create({
      data: {
        ...parsed.data,
        createdBy: user.id,
        organizationId: orgMember.organizationId,
        status: 'ACTIVE',
      },
    })

    await prisma.auditLog.create({
      data: {
        organizationId: orgMember.organizationId,
        userId: user.id,
        action: 'AGENT_CREATED',
        resource: 'agent',
        resourceId: agent.id,
        details: { name: agent.name, model: agent.model },
      },
    })

    return NextResponse.json({ data: agent }, { status: 201 })
  } catch (error) {
    console.error('POST /api/agents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
