import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { notFound } from 'next/navigation'
import { TicketDetailClient } from './ticket-detail-client'

async function getTicket(id: string) {
  const { userId } = auth()
  if (!userId) return null

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return null

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  })
  if (!orgMember) return null

  const ticket = await prisma.customerTicket.findFirst({
    where: { id, organizationId: orgMember.organizationId },
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

  return ticket
}

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await getTicket(params.id)

  if (!ticket) {
    notFound()
  }

  return <TicketDetailClient ticket={JSON.parse(JSON.stringify(ticket))} ticketId={params.id} />
}
