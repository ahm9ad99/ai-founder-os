import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'
import { prisma } from '@ai-founder/db'

const PLAN_LIMITS: Record<string, { maxAgents: number; maxTokensPerDay: number; maxTeamSeats: number }> = {
  FREE: { maxAgents: 1, maxTokensPerDay: 10000, maxTeamSeats: 1 },
  STARTER: { maxAgents: 5, maxTokensPerDay: 50000, maxTeamSeats: 3 },
  PRO: { maxAgents: 15, maxTokensPerDay: 200000, maxTeamSeats: 10 },
  BUSINESS: { maxAgents: 50, maxTokensPerDay: 500000, maxTeamSeats: 25 },
  ENTERPRISE: { maxAgents: 9999, maxTokensPerDay: 999999999, maxTeamSeats: 9999 },
}

@Injectable()
export class PlanLimitsGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const organizationId = request.organizationId ?? request.params?.organizationId

    if (!organizationId) {
      return true
    }

    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    })

    const plan = subscription?.planType ?? 'FREE'
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE

    const resourceType = this.getResourceType(context)

    if (resourceType === 'agent') {
      const count = await prisma.agent.count({ where: { organizationId } })
      if (count >= limits.maxAgents) {
        throw new HttpException(
          {
            error: 'Plan limit reached',
            message: `Your ${plan} plan allows ${limits.maxAgents} agent(s). Upgrade to create more.`,
            upgradeUrl: '/dashboard/settings/billing',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
    }

    if (resourceType === 'token') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const usage = await prisma.agentLog.aggregate({
        where: {
          agent: { organizationId },
          createdAt: { gte: today },
        },
        _sum: { tokensUsed: true },
      })

      const tokensUsed = usage._sum.tokensUsed ?? 0
      if (tokensUsed >= limits.maxTokensPerDay) {
        throw new HttpException(
          {
            error: 'Daily token limit reached',
            message: `Your ${plan} plan allows ${limits.maxTokensPerDay.toLocaleString()} tokens/day. Upgrade or wait until tomorrow.`,
            upgradeUrl: '/dashboard/settings/billing',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
    }

    return true
  }

  private getResourceType(context: ExecutionContext): string | null {
    const handler = context.getHandler().name.toLowerCase()
    if (handler.startsWith('create') && context.getClass().name.toLowerCase().includes('agent')) {
      return 'agent'
    }
    if (handler.startsWith('create') && context.getClass().name.toLowerCase().includes('log')) {
      return 'token'
    }
    return null
  }
}
