import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const prd = await prisma.pRD.findUnique({ where: { id: params.id } })
    if (!prd) return NextResponse.json({ error: 'PRD not found' }, { status: 404 })

    const orgMember = await prisma.organizationMember.findFirst({
      where: { userId: user.id, organizationId: prd.organizationId },
    })
    if (!orgMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const markdown = `# ${prd.title}\n\n**Status:** ${prd.status}\n**Generated:** ${prd.createdAt.toISOString().split('T')[0]}\n\n---\n\n${prd.content}`

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${prd.title.replace(/[^a-zA-Z0-9]/g, '_')}.md"`,
      },
    })
  } catch (error) {
    console.error('GET /api/cto/prds/[id]/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
