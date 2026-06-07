import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const updateTicketSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['URGENT', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  assigneeId: z.string().nullable().optional(),
})

export async function GET(req: Request, { params }: { params: { id: string } }) {
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
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        tasks: {
          include: {
            assignee: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        assignee: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ data: ticket })
  } catch (error) {
    console.error('GET /api/business/tickets/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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
    const parsed = updateTicketSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const data: any = { ...parsed.data }
    if (data.status === 'RESOLVED' && !data.resolvedAt) {
      data.resolvedAt = new Date()
    }

    const ticket = await prisma.customerTicket.updateMany({
      where: { id: params.id, organizationId: orgMember.organizationId },
      data,
    })

    if (ticket.count === 0) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const updated = await prisma.customerTicket.findUnique({
      where: { id: params.id },
      include: {
        assignee: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        organizationId: orgMember.organizationId,
        userId: user.id,
        action: 'TICKET_UPDATED',
        resource: 'customer_ticket',
        resourceId: params.id,
        details: parsed.data,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/business/tickets/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
