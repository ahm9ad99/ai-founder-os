import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1).max(100),
  repoUrl: z.string().url(),
  techStack: z.array(z.string()).default([]),
  description: z.string().max(2000).optional(),
})

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

    const projects = await prisma.project.findMany({
      where: { organizationId: orgMember.organizationId },
      include: {
        _count: { select: { audits: true } },
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, healthScore: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const data = projects.map(p => ({
      id: p.id,
      name: p.name,
      repoUrl: p.repoUrl,
      techStack: p.techStack,
      healthScore: p.healthScore,
      lastAuditAt: p.lastAuditAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      _count: p._count,
      latestAudit: p.audits[0] ?? null,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/projects:', error)
    return NextResponse.json({ error: 'Internal server error', data: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        repoUrl: parsed.data.repoUrl,
        techStack: parsed.data.techStack,
        description: parsed.data.description,
        organizationId: orgMember.organizationId,
      },
    })

    await prisma.audit.create({
      data: {
        projectId: project.id,
        status: 'PENDING',
      },
    })

    await prisma.auditLog.create({
      data: {
        organizationId: orgMember.organizationId,
        userId: user.id,
        action: 'PROJECT_CREATED',
        resource: 'project',
        resourceId: project.id,
        details: { name: project.name },
      },
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    console.error('POST /api/projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
