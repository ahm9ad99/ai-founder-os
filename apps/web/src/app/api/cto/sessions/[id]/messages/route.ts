import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const session = await prisma.cTOSession.findUnique({ where: { id: params.id } })
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organizationId: session.organizationId },
  })
  if (!orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data = await prisma.cTOMessage.findMany({
    where: { sessionId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const session = await prisma.cTOSession.findUnique({ where: { id: params.id } })
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organizationId: session.organizationId },
  })
  if (!orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const json = await req.json()
  const { content } = json

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  const userMessage = await prisma.cTOMessage.create({
    data: { sessionId: params.id, role: 'USER', content: content.trim() },
  })

  const previousMessages = await prisma.cTOMessage.findMany({
    where: { sessionId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  let aiReply: string
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (apiKey) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic = new Anthropic({ apiKey })
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: 'You are an expert CTO advisor helping founders build their products. Provide concise, actionable advice covering technical architecture, product strategy, and engineering execution.',
        messages: previousMessages.map((m) => ({
          role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
          content: m.content,
        })),
      })
      aiReply = msg.content[0].type === 'text' ? msg.content[0].text : 'No response generated.'
    } catch {
      aiReply = fallbackAiReply(content)
    }
  } else {
    aiReply = fallbackAiReply(content)
  }

  const aiMessage = await prisma.cTOMessage.create({
    data: { sessionId: params.id, role: 'AI', content: aiReply },
  })

  return NextResponse.json({ data: [userMessage, aiMessage] }, { status: 201 })
}

function fallbackAiReply(userContent: string): string {
  if (userContent.toLowerCase().includes('tech stack')) {
    return 'Based on your project needs, I recommend:\n\n**Frontend:** Next.js 14 with TypeScript and Tailwind CSS\n**Backend:** Node.js with tRPC or Express\n**Database:** PostgreSQL with Prisma ORM\n**Cache:** Redis\n**Cloud:** Vercel + AWS S3\n\nThis stack gives you fast iteration, strong typing, and excellent developer experience. Would you like me to elaborate on any specific layer?'
  }
  if (userContent.toLowerCase().includes('architecture')) {
    return 'Here\'s a recommended architecture:\n\n1. **API Layer** — REST/GraphQL endpoints with rate limiting\n2. **Service Layer** — Business logic and validation\n3. **Data Layer** — Prisma ORM with PostgreSQL\n4. **Cache Layer** — Redis for session/query caching\n5. **Queue Layer** — Bull/RabbitMQ for background jobs\n\nEach layer should be independently deployable and testable. Start with a monorepo structure and split into microservices when traffic demands it.'
  }
  if (userContent.toLowerCase().includes('cost') || userContent.toLowerCase().includes('budget')) {
    return 'Here\'s a rough budget breakdown for an MVP:\n\n- **Frontend:** $15K–25K (2-3 months)\n- **Backend/API:** $20K–35K (2-3 months)\n- **Database/Infra:** $5K–10K (1 month)\n- **DevOps/Deployment:** $5K–8K\n- **Design:** $8K–15K\n- **QA:** $5K–10K\n\n**Total estimate: $58K–$103K**\n\nWant me to break down any specific area in more detail?'
  }
  if (userContent.toLowerCase().includes('timeline') || userContent.toLowerCase().includes('roadmap')) {
    return 'A typical MVP timeline looks like:\n\n- **Month 1:** Setup, auth, core data models\n- **Month 2:** Main features, API integration\n- **Month 3:** Polish, testing, deployment\n\nAfter that, iterate based on user feedback. I recommend 2-week sprints with regular demos. Would you like me to generate a detailed roadmap?'
  }
  return `Great question! Here's my analysis:\n\nRegarding "${userContent.slice(0, 100)}...", I recommend starting with a thorough requirements gathering phase. Define clear success metrics, identify your core user personas, and map out the critical user journeys.\n\n**Key considerations:**\n1. Start with an MVP that solves one core problem really well\n2. Design the data model carefully — it's expensive to change later\n3. Build in monitoring and observability from day one\n4. Plan for scale but don't over-engineer prematurely\n\nWould you like me to create a PRD or roadmap based on this discussion?`
}
