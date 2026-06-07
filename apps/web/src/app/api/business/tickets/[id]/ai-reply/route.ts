import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    include: { organization: { include: { subscription: true } } },
  })
  if (!orgMember) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const ticket = await prisma.customerTicket.findFirst({
    where: { id: params.id, organizationId: orgMember.organizationId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'AI reply is not configured. Set ANTHROPIC_API_KEY.' },
      { status: 503 },
    )
  }

  const conversationHistory = ticket.messages.map(m =>
    `${m.role === 'USER' ? 'Customer' : 'Assistant'}: ${m.content}`
  ).join('\n')

  const prompt = `You are a support agent for AI Founder OS, a SaaS platform. 
Respond helpfully and professionally to the following customer ticket.

Ticket subject: ${ticket.subject}
Ticket description: ${ticket.body || 'N/A'}

Conversation so far:
${conversationHistory || 'No previous messages.'}

Write a helpful reply addressing the customer's concerns. Keep it concise and actionable.`

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const reply = msg.content[0]?.type === 'text' ? msg.content[0].text : ''

    await prisma.auditLog.create({
      data: {
        organizationId: orgMember.organizationId,
        userId: user.id,
        action: 'AI_REPLY_GENERATED',
        resource: 'customer_ticket',
        resourceId: params.id,
        details: { subject: ticket.subject },
      },
    })

    return NextResponse.json({ data: { reply } })
  } catch (error: any) {
    console.error('AI reply error:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI reply', message: error.message },
      { status: 500 },
    )
  }
}
