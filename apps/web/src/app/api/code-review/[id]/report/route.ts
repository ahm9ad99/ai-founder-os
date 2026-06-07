import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

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
      issues: { orderBy: [{ severity: 'asc' }] },
      pullRequest: { select: { title: true, author: true, branch: true, repo: true, url: true } },
    },
  })

  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const severityColors: Record<string, string> = {
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#3b82f6',
  }

  const criticalCount = review.issues.filter((i) => i.severity === 'CRITICAL').length
  const highCount = review.issues.filter((i) => i.severity === 'HIGH').length
  const mediumCount = review.issues.filter((i) => i.severity === 'MEDIUM').length
  const lowCount = review.issues.filter((i) => i.severity === 'LOW').length

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Code Review Report - ${review.prTitle ?? 'Review'}</title>
  <style>
    @page { margin: 20mm 15mm; }
    body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; color: #0f172a; line-height: 1.6; }
    .cover { text-align: center; padding: 60px 0 40px; border-bottom: 2px solid #6366f1; margin-bottom: 30px; }
    .cover h1 { font-size: 26px; color: #6366f1; margin: 0 0 8px; }
    .cover p { font-size: 13px; color: #64748b; margin: 2px 0; }
    .score-section { text-align: center; padding: 30px 0; }
    .score-number { font-size: 48px; font-weight: 800; }
    .score-label { font-size: 14px; color: #64748b; margin-top: 4px; }
    .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .summary-table td { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .summary-table td:first-child { font-weight: 600; color: #64748b; width: 200px; }
    .issue { page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .issue-severity { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; display: inline-block; }
    .issue-title { font-size: 14px; font-weight: 600; margin: 6px 0 4px; }
    .issue-desc { font-size: 12px; color: #475569; margin: 0; }
    .issue-file { font-size: 11px; color: #94a3b8; font-family: monospace; margin-top: 4px; }
    .issue-suggestion { font-size: 12px; color: #6366f1; margin-top: 6px; padding: 8px; background: #f1f5f9; border-radius: 4px; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    h2 { font-size: 18px; margin: 30px 0 16px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>AI Code Review Report</h1>
    <p>${review.prTitle ?? 'Untitled Review'}</p>
    ${review.pullRequest?.repo ? `<p>Repository: ${review.pullRequest.repo}</p>` : ''}
    ${review.pullRequest?.author ? `<p>Author: ${review.pullRequest.author}</p>` : ''}
    <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>

  <div class="score-section">
    <div class="score-number" style="color: ${(review.qualityScore ?? 0) >= 80 ? '#10b981' : (review.qualityScore ?? 0) >= 60 ? '#f59e0b' : '#ef4444'}">
      ${review.qualityScore ?? 'N/A'}
    </div>
    <div class="score-label">Quality Score / 100</div>
  </div>

  <table class="summary-table">
    <tr><td>Total Issues</td><td><strong>${review.issues.length}</strong></td></tr>
    <tr><td>Critical</td><td><strong style="color:#ef4444">${criticalCount}</strong></td></tr>
    <tr><td>High</td><td><strong style="color:#f97316">${highCount}</strong></td></tr>
    <tr><td>Medium</td><td><strong style="color:#eab308">${mediumCount}</strong></td></tr>
    <tr><td>Low</td><td><strong style="color:#3b82f6">${lowCount}</strong></td></tr>
    <tr><td>Review Date</td><td>${new Date(review.createdAt).toLocaleDateString()}</td></tr>
  </table>

  <h2>Issues Found</h2>
  ${review.issues.length === 0 ? '<p style="color:#94a3b8;font-style:italic">No issues found.</p>' : ''}
  ${review.issues.map((issue) => `
    <div class="issue">
      <span class="issue-severity" style="background:${severityColors[issue.severity] ?? '#64748b'}15;color:${severityColors[issue.severity] ?? '#64748b'}">
        ${issue.severity}
      </span>
      <div class="issue-title">${issue.title}</div>
      ${issue.description ? `<p class="issue-desc">${issue.description}</p>` : ''}
      ${issue.file ? `<p class="issue-file">${issue.file}${issue.line ? `:${issue.line}` : ''}</p>` : ''}
      ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
    </div>
  `).join('')}

  <div class="footer">
    AI Founder OS — AI Code Review Auditor
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="review-${params.id}.html"`,
    },
  })
  } catch (error) {
    console.error('GET /api/code-review/[id]/report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
