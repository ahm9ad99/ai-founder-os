import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

function severityColor(s: string): string {
  switch (s.toUpperCase()) {
    case 'CRITICAL': return '#ef4444'
    case 'HIGH': return '#f97316'
    case 'MEDIUM': return '#eab308'
    case 'LOW': return '#10b981'
    default: return '#6b7280'
  }
}

function scoreColor(s: number | null): string {
  if (s === null) return '#6b7280'
  if (s >= 80) return '#10b981'
  if (s >= 60) return '#eab308'
  return '#ef4444'
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    const project = await prisma.project.findFirst({
      where: { id: params.id, organizationId: orgMember.organizationId },
      include: {
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { vulns: true, deps: true, perf: true },
        },
      },
    })

    if (!project || project.audits.length === 0) {
      return NextResponse.json({ error: 'No audit data found' }, { status: 404 })
    }

  const audit = project.audits[0]!
  const hc = audit.healthScore
  const date = new Date(audit.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Audit Report - ${project.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f13; color: #e2e8f0; line-height: 1.6; }
    .cover { background: linear-gradient(135deg, #1e1b4b, #0f0f13); padding: 80px 40px; text-align: center; border-bottom: 2px solid #312e81; }
    .cover h1 { font-size: 36px; color: #fff; margin-bottom: 8px; }
    .cover .score { font-size: 72px; font-weight: 800; color: ${scoreColor(hc)}; margin: 24px 0 8px; }
    .cover .label { font-size: 14px; color: #94a3b8; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    h2 { font-size: 22px; color: #fff; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #1e293b; }
    h3 { font-size: 16px; color: #cbd5e1; margin: 16px 0 8px; }
    p { margin-bottom: 12px; color: #94a3b8; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    th { background: #1e293b; color: #e2e8f0; font-weight: 600; }
    td { color: #cbd5e1; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin: 16px 0; }
    .card { background: #1a1a24; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; }
    .card .val { font-size: 24px; font-weight: 700; margin-top: 4px; }
    .vuln { background: #1a1a24; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .vuln .title { font-weight: 600; margin: 8px 0 4px; }
    .vuln .desc { font-size: 13px; }
    .report-section { background: #1a1a24; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-top: 16px; white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #cbd5e1; }
    .footer { text-align: center; padding: 32px; font-size: 12px; color: #475569; border-top: 1px solid #1e293b; margin-top: 48px; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${project.name}</h1>
    <p>${project.repoUrl}</p>
    <div class="score">${hc ?? 'N/A'}</div>
    <div class="label">Health Score · Audited on ${date}</div>
    ${audit.status === 'COMPLETED' ? `<p style="margin-top:8px"><span class="badge" style="background:${scoreColor(hc)}33;color:${scoreColor(hc)}">${hc !== null && hc >= 80 ? 'HEALTHY' : hc !== null && hc >= 60 ? 'WARNING' : 'CRITICAL'}</span></p>` : ''}
  </div>

  <div class="container">
    <h2>Executive Summary</h2>
    <p>${audit.summary || 'No summary available.'}</p>

    <div class="grid">
      <div class="card"><div style="font-size:13px;color:#94a3b8">Vulnerabilities</div><div class="val">${audit.vulns.length}</div></div>
      <div class="card"><div style="font-size:13px;color:#94a3b8">Outdated Dependencies</div><div class="val">${audit.deps.length}</div></div>
      ${audit.perf ? `
      <div class="card"><div style="font-size:13px;color:#94a3b8">Lighthouse Score</div><div class="val" style="color:${scoreColor(audit.perf.lighthouseScore)}">${audit.perf.lighthouseScore ?? 'N/A'}</div></div>
      <div class="card"><div style="font-size:13px;color:#94a3b8">Bundle Size</div><div class="val">${audit.perf.bundleSize || 'N/A'}</div></div>
      ` : ''}
    </div>

    ${audit.vulns.length > 0 ? `
    <h2>Vulnerabilities</h2>
    ${audit.vulns.map(v => `
    <div class="vuln">
      <span class="badge" style="background:${severityColor(v.severity)}22;color:${severityColor(v.severity)}">${v.severity}</span>
      ${v.cveId ? `<span class="badge" style="background:#1e293b;color:#94a3b8;margin-left:6px">${v.cveId}</span>` : ''}
      <div class="title">${v.title}</div>
      <div class="desc">${v.description}</div>
      ${v.fix ? `<div style="margin-top:8px;padding:8px;background:#0f0f13;border-radius:4px;font-size:13px"><strong>Fix:</strong> ${v.fix}</div>` : ''}
    </div>
    `).join('')}
    ` : ''}

    ${audit.deps.length > 0 ? `
    <h2>Outdated Dependencies</h2>
    <table>
      <tr><th>Package</th><th>Current</th><th>Latest</th><th>Severity</th></tr>
      ${audit.deps.map(d => `
      <tr>
        <td style="font-family:monospace;font-size:13px">${d.name}</td>
        <td>${d.current}</td>
        <td style="color:#10b981">${d.latest}</td>
        <td><span class="badge" style="background:${severityColor(d.severity)}22;color:${severityColor(d.severity)}">${d.severity}</span></td>
      </tr>
      `).join('')}
    </table>
    ` : ''}

    ${audit.perf ? `
    <h2>Performance Metrics</h2>
    <div class="grid">
      <div class="card"><div style="font-size:13px;color:#94a3b8">Bundle Size</div><div class="val">${audit.perf.bundleSize || 'N/A'}</div></div>
      <div class="card"><div style="font-size:13px;color:#94a3b8">LCP</div><div class="val">${audit.perf.lcp || 'N/A'}</div></div>
      <div class="card"><div style="font-size:13px;color:#94a3b8">TTI</div><div class="val">${audit.perf.tti || 'N/A'}</div></div>
      <div class="card"><div style="font-size:13px;color:#94a3b8">Lighthouse Score</div><div class="val" style="color:${scoreColor(audit.perf.lighthouseScore)}">${audit.perf.lighthouseScore ?? 'N/A'}</div></div>
    </div>
    ` : ''}

    <h2>Full AI Audit Report</h2>
    <div class="report-section">${audit.report || 'No detailed report available.'}</div>

    <div class="footer">
      Generated by AI Founder OS Project Auditor · ${date}
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-${project.name.replace(/[^a-zA-Z0-9]/g, '-')}.html"`,
    },
  })
  } catch (error) {
    console.error('GET /api/projects/[id]/report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
