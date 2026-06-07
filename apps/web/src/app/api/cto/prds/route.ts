import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function GET() {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({ where: { userId: user.id } })
  if (!orgMember) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

  const data = await prisma.pRD.findMany({
    where: { organizationId: orgMember.organizationId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
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

  let prdContent: string
  const apiKey = process.env.ANTHROPIC_API_KEY

  const conversationContext = session.messages
    .map((m) => `${m.role === 'USER' ? 'User' : 'AI CTO'}: ${m.content}`)
    .join('\n\n')

  if (apiKey) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic = new Anthropic({ apiKey })
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: 'You are an expert technical product manager. Generate a comprehensive Product Requirements Document in markdown format. Include: title, executive summary, problem statement, target users, core features, technical architecture, non-functional requirements, and success metrics.',
        messages: [
          { role: 'user', content: `Based on this conversation, create a detailed PRD:\n\n${conversationContext}\n\n${instructions ? `Additional instructions: ${instructions}` : 'Create a comprehensive PRD based on the session context above.'}` },
        ],
      })
      prdContent = msg.content[0].type === 'text' ? msg.content[0].text : 'Failed to generate PRD.'
    } catch {
      prdContent = `# ${session.title} — Product Requirements Document

## Executive Summary
${session.title} is a project designed to address key market needs with a modern technical approach.

## Problem Statement
Users face significant challenges in this space that current solutions do not adequately address.

## Target Users
- Primary: End users who need this solution
- Secondary: Administrators and power users

## Core Features
1. **User Management** — Authentication, authorization, and profile management
2. **Core Workflow** — The primary business logic and user journey
3. **Analytics Dashboard** — Real-time insights and reporting
4. **Notification System** — Email and in-app notifications
5. **API Layer** — RESTful API for third-party integrations

## Technical Architecture
- **Frontend:** Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend:** Next.js API routes with tRPC
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk
- **Deployment:** Vercel
- **Monitoring:** Sentry + PostHog

## Non-Functional Requirements
- 99.9% uptime SLA
- < 200ms API response time (p95)
- SOC 2 compliance
- GDPR compliant data handling

## Success Metrics
- User adoption rate > 40% in first 3 months
- NPS score > 50
- Page load time < 1.5s`
    }
  } else {
    prdContent = `# ${session.title} — Product Requirements Document

## Executive Summary
${session.title} is a project designed to address key market needs with a modern technical approach.

## Problem Statement
Users face significant challenges in this space that current solutions do not adequately address.

## Target Users
- Primary: End users who need this solution
- Secondary: Administrators and power users

## Core Features
1. **User Management** — Authentication, authorization, and profile management
2. **Core Workflow** — The primary business logic and user journey
3. **Analytics Dashboard** — Real-time insights and reporting
4. **Notification System** — Email and in-app notifications
5. **API Layer** — RESTful API for third-party integrations

## Technical Architecture
- **Frontend:** Next.js 14 with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend:** Next.js API routes with tRPC
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk
- **Deployment:** Vercel
- **Monitoring:** Sentry + PostHog

## Non-Functional Requirements
- 99.9% uptime SLA
- < 200ms API response time (p95)
- SOC 2 compliance
- GDPR compliant data handling

## Success Metrics
- User adoption rate > 40% in first 3 months
- NPS score > 50
- Page load time < 1.5s`
  }

  const title = instructions
    ? `${session.title} — ${instructions.slice(0, 40)}`
    : `${session.title} — PRD`

  const prd = await prisma.pRD.create({
    data: {
      title: title.slice(0, 100),
      content: prdContent,
      organizationId: orgMember.organizationId,
    },
  })

  return NextResponse.json({ data: prd }, { status: 201 })
}
