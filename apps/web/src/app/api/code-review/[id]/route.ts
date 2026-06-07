import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']).optional(),
  qualityScore: z.coerce.number().min(0).max(100).optional(),
  summary: z.string().optional(),
})

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  })
  if (!orgMember) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const review = await prisma.codeReview.findFirst({
    where: { id: params.id, organizationId: orgMember.organizationId },
    include: {
      issues: { orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }] },
      pullRequest: {
        select: { title: true, author: true, branch: true, repo: true, url: true },
      },
    },
  })

  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data: review })
  } catch (error) {
    console.error('GET /api/code-review/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  })
  if (!orgMember) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const review = await prisma.codeReview.findFirst({
    where: { id: params.id, organizationId: orgMember.organizationId },
  })
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.codeReview.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      ...(parsed.data.status === 'COMPLETED' ? { completedAt: new Date() } : {}),
    },
  })

  return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('PATCH /api/code-review/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
