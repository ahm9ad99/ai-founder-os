import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'
import { z } from 'zod'

const onboardingSchema = z.object({
  fullName: z.string().min(1),
  role: z.string().min(1),
  companyName: z.string().min(1),
  companySize: z.string().min(1),
  useCases: z.array(z.string()).min(1),
  workspaceName: z.string().min(1),
  teammates: z.array(z.string().email()).optional().default([]),
  githubRepo: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = onboardingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { onboardingComplete: true, role: data.role },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 })
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const orgMember = await prisma.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  })

  if (orgMember) {
    await prisma.organization.update({
      where: { id: orgMember.organizationId },
      data: { name: data.workspaceName },
    })
  }

  if (data.teammates.length > 0) {
    console.log('Inviting teammates:', data.teammates.join(', '))
  }

  return NextResponse.json({ success: true, redirectTo: '/dashboard' })
}
