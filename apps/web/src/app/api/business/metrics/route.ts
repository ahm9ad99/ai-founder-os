import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

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

    const orgId = orgMember.organizationId

    const [openTickets, inProgressTickets, resolvedTickets, totalMessages, pendingTasks] =
      await Promise.all([
        prisma.customerTicket.count({
          where: { organizationId: orgId, status: 'OPEN' },
        }),
        prisma.customerTicket.count({
          where: { organizationId: orgId, status: 'IN_PROGRESS' },
        }),
        prisma.customerTicket.count({
          where: { organizationId: orgId, status: 'RESOLVED' },
        }),
        prisma.message.count({
          where: { ticket: { organizationId: orgId } },
        }),
        prisma.businessTask.count({
          where: { organizationId: orgId, status: 'TODO' },
        }),
      ])

    return NextResponse.json({
      data: {
        openTickets,
        inProgressTickets,
        resolvedTickets,
        totalMessages,
        pendingTasks,
      },
    })
  } catch (error) {
    console.error('GET /api/business/metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

