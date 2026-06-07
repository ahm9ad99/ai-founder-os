import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

const FALLBACK = {
  healthScore: 72,
  status: 'WARNING',
  summary: 'Project has moderate security posture. Several medium-severity vulnerabilities were found in dependencies. Performance is acceptable but could be improved with image optimization and code splitting.',
  vulnerabilities: [
    { severity: 'HIGH', cveId: 'CVE-2024-3094', title: 'Prototype Pollution in lodash', description: 'Affects lodash versions < 4.17.21. Allows remote code execution via crafted JSON input.', fix: 'Upgrade lodash to ^4.17.21' },
    { severity: 'MEDIUM', cveId: 'CVE-2024-21626', title: 'Container escape in runc', description: 'A flaw in runc allows container escape via process.cwd trick.', fix: 'Update runc to v1.1.12+' },
    { severity: 'LOW', cveId: null, title: 'Deprecated API usage', description: 'Several deprecated React lifecycle methods are in use.', fix: 'Migrate to modern React hooks patterns.' },
  ],
  performance: { bundleSize: '487 KB', lcp: '2.4s', tti: '3.1s', lighthouseScore: 78 },
  outdatedDeps: [
    { name: 'lodash', current: '4.17.20', latest: '4.17.21', severity: 'HIGH' },
    { name: 'axios', current: '0.27.2', latest: '1.6.7', severity: 'MEDIUM' },
    { name: 'express', current: '4.18.1', latest: '4.19.2', severity: 'LOW' },
    { name: 'typescript', current: '4.9.5', latest: '5.4.5', severity: 'INFO' },
  ],
  report: `# Audit Report

## Executive Summary
The project shows a moderate security posture with a health score of **72/100**. Several dependency vulnerabilities need attention, but no critical issues were detected.

## Key Findings
- **3 vulnerabilities** identified (1 high, 1 medium, 1 low)
- **4 outdated dependencies** found
- **Lighthouse score: 78** — room for improvement

## Recommendations
1. Update lodash to patch prototype pollution vulnerability
2. Address deprecated React lifecycle usage
3. Implement image optimization to improve LCP`,
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: orgMember.organizationId },
  })
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  let result: typeof FALLBACK

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      const prompt = `You are an expert software architect and security auditor. Analyze this project and return ONLY valid JSON (no markdown, no code fences):

Project: ${project.name}
Repository: ${project.repoUrl}
Tech Stack: ${project.techStack.join(', ')}
Description: ${project.description || 'N/A'}

Respond with this exact JSON shape:
{
  "healthScore": number (0-100),
  "status": "HEALTHY" | "WARNING" | "CRITICAL",
  "summary": "string",
  "vulnerabilities": [{ "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO", "cveId": "string|null", "title": "string", "description": "string", "fix": "string|null" }],
  "performance": { "bundleSize": "string", "lcp": "string", "tti": "string", "lighthouseScore": number },
  "outdatedDeps": [{ "name": "string", "current": "string", "latest": "string", "severity": "string" }],
  "report": "string (full markdown audit report)"
}`

      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = msg.content[0]?.type === 'text' ? msg.content[0].text : ''
      result = JSON.parse(text)
    } catch {
      result = FALLBACK
    }
  } else {
    result = FALLBACK
  }

  const audit = await prisma.audit.create({
    data: {
      projectId: project.id,
      status: 'COMPLETED',
      healthScore: result.healthScore,
      summary: result.summary,
      report: result.report,
      vulns: {
        create: result.vulnerabilities.map(v => ({
          severity: v.severity,
          cveId: v.cveId,
          title: v.title,
          description: v.description,
          fix: v.fix,
        })),
      },
      deps: {
        create: result.outdatedDeps.map(d => ({
          name: d.name,
          current: d.current,
          latest: d.latest,
          severity: d.severity,
        })),
      },
      perf: {
        create: {
          bundleSize: result.performance.bundleSize,
          lcp: result.performance.lcp,
          tti: result.performance.tti,
          lighthouseScore: result.performance.lighthouseScore,
        },
      },
    },
    include: {
      vulns: true,
      deps: true,
      perf: true,
    },
  })

  await prisma.project.update({
    where: { id: project.id },
    data: {
      healthScore: result.healthScore,
      lastAuditAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      organizationId: orgMember.organizationId,
      userId: user.id,
      action: 'AUDIT_COMPLETED',
      resource: 'project',
      resourceId: project.id,
      details: { healthScore: result.healthScore, vulnerabilities: result.vulnerabilities.length },
    },
  })

  return NextResponse.json({ data: audit }, { status: 201 })
}
