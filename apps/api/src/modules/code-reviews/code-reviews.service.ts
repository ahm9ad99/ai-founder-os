import { Injectable, NotFoundException } from '@nestjs/common'
import { prisma } from '@ai-founder/db'

@Injectable()
export class CodeReviewsService {
  async findAll(organizationId: string) {
    return prisma.codeReview.findMany({
      where: { organizationId },
      include: {
        issues: true,
        pullRequest: true,
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const review = await prisma.codeReview.findUnique({
      where: { id },
      include: {
        issues: { orderBy: { severity: 'asc' } },
        pullRequest: true,
      },
    })

    if (!review) throw new NotFoundException('Code review not found')
    return review
  }

  async create(data: { organizationId: string; pullRequestId?: string; prTitle: string }) {
    return prisma.codeReview.create({
      data: {
        organizationId: data.organizationId,
        pullRequestId: data.pullRequestId,
        prTitle: data.prTitle,
        status: 'PENDING',
      },
    })
  }
}
