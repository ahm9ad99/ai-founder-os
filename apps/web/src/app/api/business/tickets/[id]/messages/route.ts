import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1).max(10000),
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM']).default('USER'),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    const ticket = await prisma.customerTicket.findFirst({
      where: { id: params.id, organizationId: orgMember.organizationId },
    })
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = createMessageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const message = await prisma.message.create({
      data: {
        ticketId: params.id,
        role: parsed.data.role,
        content: parsed.data.content,
      },
    })

    return NextResponse.json({ data: message }, { status: 201 })
  } catch (error) {
    console.error('POST /api/business/tickets/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
