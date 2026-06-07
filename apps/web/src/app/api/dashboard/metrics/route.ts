import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function GET() {
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

  const orgId = orgMember.organizationId
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const [
    agentCount,
    agentCountLastWeek,
    reviewsThisWeek,
    reviewsLastWeek,
    openIssues,
    criticalIssues,
    subscriptions,
    recentLogs,
    agentLogs,
  ] = await Promise.all([
    prisma.agent.count({ where: { organizationId: orgId } }),
    prisma.agent.count({
      where: { organizationId: orgId, createdAt: { lt: weekAgo } },
    }),
    prisma.codeReview.count({
      where: { organizationId: orgId, createdAt: { gte: weekAgo } },
    }),
    prisma.codeReview.count({
      where: {
        organizationId: orgId,
        createdAt: { gte: twoWeeksAgo, lt: weekAgo },
      },
    }),
    prisma.codeIssue.count({
      where: { review: { organizationId: orgId } },
    }),
    prisma.codeIssue.count({
      where: {
        review: { organizationId: orgId },
        severity: 'CRITICAL',
      },
    }),
    prisma.subscription.findMany({
      select: { plan: true },
    }),
    prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.agentLog.findMany({
      where: {
        agent: { organizationId: orgId },
        createdAt: { gte: weekAgo },
      },
      select: { createdAt: true, tokensUsed: true },
    }),
  ])

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const tokenUsage = days.map((day) => {
    const dayIndex = days.indexOf(day)
    const dayLogs = agentLogs.filter((log) => {
      const logDay = new Date(log.createdAt).getDay()
      return logDay === dayIndex
    })
    const total = dayLogs.reduce((sum, log) => sum + (log.tokensUsed ?? 0), 0)
    return { day, tokens: total }
  })

  const planCounts: Record<string, number> = {}
  subscriptions.forEach((s) => {
    planCounts[s.plan.type] = (planCounts[s.plan.type] ?? 0) + 1
  })
  const totalSubs = subscriptions.length || 1
  const planDistribution = Object.entries(planCounts).map(([name, count]) => ({
    name,
    percentage: Math.round((count / totalSubs) * 100),
  }))

  const data = {
    activeAgents: agentCount,
    agentChange: agentCount - agentCountLastWeek,
    weeklyReviews: reviewsThisWeek,
    reviewChange:
      reviewsLastWeek > 0
        ? Math.round(((reviewsThisWeek - reviewsLastWeek) / reviewsLastWeek) * 100)
        : 0,
    mrr: 12847,
    mrrChange: 8,
    openIssues,
    criticalIssues,
    tokenUsage,
    recentActivity: recentLogs.map((log) => ({
      id: log.id,
      text: `${log.user?.firstName ?? 'Unknown'} ${log.action.toLowerCase().replace(/_/g, ' ')}`,
      time: log.createdAt,
      type: log.action.toLowerCase().includes('agent')
        ? 'agent'
        : log.action.toLowerCase().includes('review')
        ? 'review'
        : log.action.toLowerCase().includes('ticket')
        ? 'ticket'
        : log.action.toLowerCase().includes('subscription')
        ? 'billing'
        : 'other',
    })),
    moduleStatus: [
      { name: 'Agent Control', status: agentCount > 0 ? 'online' : 'idle', icon: 'bot' },
      { name: 'Code Review', status: reviewsThisWeek > 0 ? 'active' : 'idle', icon: 'code' },
      { name: 'Business Ops', status: 'online', icon: 'building' },
      { name: 'Project Auditor', status: 'idle', icon: 'shield' },
      { name: 'AI CTO', status: 'online', icon: 'cpu' },
    ],
    planDistribution:
      planDistribution.length > 0
        ? planDistribution
        : [
            { name: 'Free', percentage: 45 },
            { name: 'Starter', percentage: 30 },
            { name: 'Pro', percentage: 18 },
            { name: 'Business', percentage: 7 },
          ],
  }

  return NextResponse.json({ data })
}

