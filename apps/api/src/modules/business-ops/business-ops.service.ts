import { Injectable, NotFoundException } from '@nestjs/common'
import { prisma, TicketPriority, TicketStatus } from '@ai-founder/db'

@Injectable()
export class BusinessOpsService {
  async getTickets(organizationId: string) {
    return prisma.customerTicket.findMany({
      where: { organizationId },
      include: { assignee: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createTicket(data: { organizationId: string; subject: string; description?: string; customerEmail?: string; priority?: TicketPriority }) {
    return prisma.customerTicket.create({
      data: {
        organizationId: data.organizationId,
        subject: data.subject,
        description: data.description,
        customerEmail: data.customerEmail,
        priority: data.priority ?? TicketPriority.MEDIUM,
      },
    })
  }

  async updateTicket(id: string, data: { status?: TicketStatus; assigneeId?: string }) {
    const ticket = await prisma.customerTicket.findUnique({ where: { id } })
    if (!ticket) throw new NotFoundException('Ticket not found')

    return prisma.customerTicket.update({
      where: { id },
      data,
    })
  }

  async getInvoices(organizationId: string) {
    const subscriptions = await prisma.subscription.findMany({
      where: { organizationId },
      select: { id: true },
    })
    return prisma.invoice.findMany({
      where: { subscriptionId: { in: subscriptions.map(s => s.id) } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getEmails(organizationId: string) {
    const tickets = await prisma.customerTicket.findMany({
      where: { organizationId },
      select: { id: true },
    })
    return prisma.emailThread.findMany({
      where: { ticketId: { in: tickets.map(t => t.id) } },
      orderBy: { createdAt: 'desc' },
    })
  }
}
