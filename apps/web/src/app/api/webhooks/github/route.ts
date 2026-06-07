import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@ai-founder/db'

const GITHUB_SECRET = process.env.GITHUB_WEBHOOK_SECRET ?? ''

function verifySignature(body: string, signature: string): boolean {
  if (!GITHUB_SECRET || !signature) return false
  const expected = `sha256=${crypto
    .createHmac('sha256', GITHUB_SECRET)
    .update(body, 'utf8')
    .digest('hex')}`
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-hub-signature-256') ?? ''
  const event = req.headers.get('x-github-event') ?? ''

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (event !== 'pull_request') {
    return NextResponse.json({ skipped: true, event })
  }

  const payload = JSON.parse(rawBody)
  const { action, pull_request: pr, repository } = payload

  if (!['opened', 'synchronize', 'reopened'].includes(action)) {
    return NextResponse.json({ skipped: true, action })
  }

  const repoUrl = repository.html_url
  const repoName = repository.full_name
  const orgName = repository.owner?.login ?? ''

  const org = await prisma.organization.findFirst({
    where: { slug: orgName.toLowerCase() },
  })
  if (!org) return NextResponse.json({ skipped: 'no org match' })

  const pullRequest = await prisma.pullRequest.upsert({
    where: {
      repoUrl_prNumber: {
        repoUrl,
        prNumber: pr.number,
      },
    },
    create: {
      prNumber: pr.number,
      repoUrl,
      title: pr.title,
      branch: pr.head?.ref ?? 'main',
      baseBranch: pr.base?.ref ?? 'main',
      author: pr.user?.login ?? 'unknown',
      repo: repoName,
      url: pr.html_url,
      status: 'open',
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      filesChanged: pr.changed_files ?? 0,
      organizationId: org.id,
    },
    update: {
      title: pr.title,
      branch: pr.head?.ref ?? 'main',
      baseBranch: pr.base?.ref ?? 'main',
      status: 'open',
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      filesChanged: pr.changed_files ?? 0,
    },
  })

  const review = await prisma.codeReview.create({
    data: {
      pullRequestId: pullRequest.id,
      prTitle: pr.title,
      branch: pr.head?.ref ?? 'main',
      repo: repoName,
      prUrl: pr.html_url,
      status: 'IN_PROGRESS',
      organizationId: org.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: 'system',
      action: 'PR_RECEIVED',
      resource: 'pull_request',
      resourceId: pullRequest.id,
      details: {
        repo: repoName,
        pr: pr.number,
        title: pr.title,
        action,
      },
    },
  })

  return NextResponse.json({ queued: true, reviewId: review.id })
}
