import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().optional().default(''),
  customerName: z.string().max(100).optional().default(''),
  customerEmail: z.string().email().optional().or(z.literal('')),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
})

export async function GET(req: Request) {
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

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const priority = url.searchParams.get('priority')
    const search = url.searchParams.get('search')

    const where: any = { organizationId: orgMember.organizationId }
    if (status && status !== 'ALL') where.status = status
    if (priority && priority !== 'ALL') where.priority = priority
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    const tickets = await prisma.customerTicket.findMany({
      where,
      include: { _count: { select: { messages: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: tickets })
  } catch (error) {
    console.error('GET /api/business/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    })
    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const body = await req.json()
    const parsed = createTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const ticket = await prisma.customerTicket.create({
      data: {
        subject: parsed.data.subject,
        body: parsed.data.body || null,
        customerName: parsed.data.customerName || null,
        customerEmail: parsed.data.customerEmail || null,
        priority: parsed.data.priority,
        organizationId: orgMember.organizationId,
      },
    })

    await prisma.auditLog.create({
      data: {
        organizationId: orgMember.organizationId,
        userId: user.id,
        action: 'TICKET_CREATED',
        resource: 'customer_ticket',
        resourceId: ticket.id,
        details: { subject: ticket.subject },
      },
    })

    return NextResponse.json({ data: ticket }, { status: 201 })
  } catch (error) {
    console.error('POST /api/business/tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

