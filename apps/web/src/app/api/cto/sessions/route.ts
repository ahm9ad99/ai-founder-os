import { NextRequest, NextResponse } from 'next/server'
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

    const data = await prisma.cTOSession.findMany({
      where: { organizationId: orgMember.organizationId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/cto/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const orgMember = await prisma.organizationMember.findFirst({ where: { userId: user.id } })
    if (!orgMember) return NextResponse.json({ error: 'No organization found' }, { status: 404 })

    const json = await req.json()
    const { title, contextType, description } = json

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const session = await prisma.cTOSession.create({
      data: {
        title: title.trim(),
        contextType: contextType || 'product_idea',
        organizationId: orgMember.organizationId,
      },
    })

    if (description?.trim()) {
      await prisma.cTOMessage.create({
        data: {
          sessionId: session.id,
          role: 'USER',
          content: description.trim(),
        },
      })
    }

    return NextResponse.json({ data: session }, { status: 201 })
  } catch (error) {
    console.error('POST /api/cto/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
