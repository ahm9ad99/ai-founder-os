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
  })
  if (!orgMember) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const orgId = orgMember.organizationId

  const [totalSessions, totalMessages, totalPrds, roadmaps] = await Promise.all([
    prisma.cTOSession.count({ where: { organizationId: orgId } }),
    prisma.cTOMessage.count({
      where: { session: { organizationId: orgId } },
    }),
    prisma.pRD.count({ where: { organizationId: orgId } }),
    prisma.roadmap.count({ where: { organizationId: orgId } }),
  ])

  return NextResponse.json({
    data: { totalSessions, totalMessages, totalPrds, roadmaps },
  })
}
