import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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

  return NextResponse.json({ data: prd })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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

  const json = await req.json()
  const { title, content, status } = json

  const updated = await prisma.pRD.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
    },
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
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

  await prisma.pRD.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
