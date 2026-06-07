import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const createReviewSchema = z.object({
  repoUrl: z.string().url(),
  prNumber: z.coerce.number().int().positive(),
  title: z.string().min(1).max(500),
  branch: z.string().optional().default('main'),
  author: z.string().optional(),
})

export async function GET(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  })
  if (!orgMember) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const severity = url.searchParams.get('severity')
  const repo = url.searchParams.get('repo')
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20')))

  const where: Record<string, unknown> = { organizationId: orgMember.organizationId }
  if (status) where.status = status.toUpperCase()
  if (repo) where.repo = { contains: repo, mode: 'insensitive' }

  const [reviews, total] = await Promise.all([
    prisma.codeReview.findMany({
      where,
      include: {
        issues: {
          select: { id: true, severity: true, category: true, title: true, file: true },
        },
        pullRequest: { select: { title: true, author: true, branch: true, repo: true } },
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.codeReview.count({ where }),
  ])

  if (severity) {
    const filtered = reviews.filter((r) =>
      r.issues.some((i) => i.severity === severity.toUpperCase()),
    )
    return NextResponse.json({
      data: filtered,
      pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
    })
  }

  return NextResponse.json({
    data: reviews,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
  })
  if (!orgMember) return NextResponse.json({ error: 'No organization' }, { status: 404 })

  const body = await req.json()
  const parsed = createReviewSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const repoName = parsed.data.repoUrl.split('/').slice(-2).join('/').replace('.git', '')

  let pullRequest = await prisma.pullRequest.findFirst({
    where: {
      organizationId: orgMember.organizationId,
      repo: repoName,
      prNumber: parsed.data.prNumber,
    },
  })

  if (!pullRequest) {
    pullRequest = await prisma.pullRequest.create({
      data: {
        organizationId: orgMember.organizationId,
        repo: repoName,
        branch: parsed.data.branch ?? 'main',
      title: parsed.data.title,
        url: parsed.data.repoUrl,
        author: parsed.data.author ?? null,
        status: 'OPEN',
      },
    })
  }

  const review = await prisma.codeReview.create({
    data: {
      organizationId: orgMember.organizationId,
      pullRequestId: pullRequest.id,
      prTitle: parsed.data.title,
      status: 'PENDING',
    },
  })

  await prisma.auditLog.create({
    data: {
      organizationId: orgMember.organizationId,
      userId: user.id,
      action: 'REVIEW_REQUESTED',
      resource: 'code_review',
      resourceId: review.id,
      details: { repo: repoName, pr: parsed.data.prNumber },
    },
  })

  return NextResponse.json({ data: review }, { status: 201 })
}

