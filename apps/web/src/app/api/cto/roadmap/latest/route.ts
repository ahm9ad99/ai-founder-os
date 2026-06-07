import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const orgMember = await prisma.organizationMember.findFirst({ where: { userId: user.id } })
    if (!orgMember) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const data = await prisma.roadmap.findFirst({
      where: { organizationId: orgMember.organizationId },
      orderBy: { createdAt: 'desc' },
      include: { milestones: { orderBy: { order: 'asc' } } },
    })

    if (!data) return NextResponse.json({ error: 'No roadmap found' }, { status: 404 })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/cto/roadmap/latest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
