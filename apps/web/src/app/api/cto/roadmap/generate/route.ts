import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const orgMember = await prisma.organizationMember.findFirst({ where: { userId: user.id } })
    if (!orgMember) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const json = await req.json()
    const { sessionId, instructions } = json

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const session = await prisma.cTOSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.organizationId !== orgMember.organizationId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const conversationContext = session.messages
      .map((m) => `${m.role === 'USER' ? 'User' : 'AI CTO'}: ${m.content}`)
      .join('\n\n')

    let milestones: Array<{
      title: string
      description: string
      quarter: string
      status: string
      techTags: string[]
      effort: string
      order: number
    }>

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (apiKey) {
      try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic = new Anthropic({ apiKey })
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `You are an expert CTO and engineering leader. Generate a phased development roadmap as a JSON array. Each milestone must have: title, description, quarter (e.g. "Q1 2026"), status ("PLANNED"), techTags (string array), effort ("XS"/"S"/"M"/"L"/"XL"), order (integer). Return ONLY valid JSON array, no markdown.`,
        messages: [
          { role: 'user', content: `Generate a development roadmap for this project:\n\n${conversationContext}\n\n${instructions ? `Instructions: ${instructions}` : 'Create a 4-quarter roadmap with 3-4 milestones per quarter.'}` },
        ],
      })
      const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
      const parsed = JSON.parse(text)
      milestones = Array.isArray(parsed) ? parsed : []
    } catch {
      milestones = getDefaultMilestones(session.title)
    }
  } else {
    milestones = getDefaultMilestones(session.title)
  }

  const roadmap = await prisma.roadmap.create({
    data: {
      title: `${session.title} — Development Roadmap`,
      organizationId: orgMember.organizationId,
      milestones: {
        create: milestones.map((m, i) => ({
          title: m.title,
          description: m.description,
          quarter: m.quarter || `Q${Math.floor(i / 3) + 1} 2026`,
          status: m.status || 'PLANNED',
          techTags: m.techTags || [],
          effort: m.effort || 'M',
          order: m.order ?? i,
        })),
      },
    },
    include: { milestones: { orderBy: { order: 'asc' } } },
  })

  return NextResponse.json({ data: roadmap }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cto/roadmap/generate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDefaultMilestones(title: string) {
  return [
    { title: 'Foundation', description: `Core project setup for ${title}`, quarter: 'Q1 2026', status: 'PLANNED', techTags: ['Next.js', 'PostgreSQL', 'TypeScript'], effort: 'XL', order: 0 },
    { title: 'Core Features', description: 'Implement primary user workflows and business logic', quarter: 'Q1 2026', status: 'PLANNED', techTags: ['React', 'Node.js'], effort: 'XL', order: 1 },
    { title: 'Integrations', description: 'Third-party integrations and API development', quarter: 'Q2 2026', status: 'PLANNED', techTags: ['REST', 'GraphQL'], effort: 'L', order: 2 },
    { title: 'AI & Analytics', description: 'AI features and analytics dashboard', quarter: 'Q2 2026', status: 'PLANNED', techTags: ['Python', 'TensorFlow', 'PostHog'], effort: 'XL', order: 3 },
    { title: 'Mobile', description: 'Mobile app development (iOS/Android)', quarter: 'Q3 2026', status: 'PLANNED', techTags: ['React Native', 'Expo'], effort: 'XL', order: 4 },
    { title: 'Performance', description: 'Performance optimization and load testing', quarter: 'Q3 2026', status: 'PLANNED', techTags: ['Redis', 'CDN'], effort: 'L', order: 5 },
    { title: 'Security Audit', description: 'Security audit and compliance', quarter: 'Q4 2026', status: 'PLANNED', techTags: ['OWASP', 'SOC 2'], effort: 'M', order: 6 },
    { title: 'Scale', description: 'Infrastructure scaling and production hardening', quarter: 'Q4 2026', status: 'PLANNED', techTags: ['AWS', 'Kubernetes', 'Terraform'], effort: 'XL', order: 7 },
  ]
}
