import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agent = await prisma.agent.findUnique({ where: { id: params.id } })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')))

    const [logs, total] = await Promise.all([
      prisma.agentLog.findMany({
        where: { agentId: params.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.agentLog.count({ where: { agentId: params.id } }),
    ])

    return NextResponse.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/agents/[id]/logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
