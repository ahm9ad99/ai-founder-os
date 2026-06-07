import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@ai-founder/db'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    return new NextResponse('Webhook secret not set', { status: 500 })
  }

  const headerPayload = headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: { type: string; data: Record<string, unknown> }

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof evt
  } catch {
    return new NextResponse('Invalid webhook signature', { status: 400 })
  }

  const { data } = evt

  try {
    switch (evt.type) {
      case 'user.created': {
        await prisma.user.upsert({
          where: { clerkId: data.id as string },
          update: {
            email: (data.email_addresses as Array<{ email_address: string }>)[0]?.email_address ?? '',
            firstName: (data.first_name as string) ?? null,
            lastName: (data.last_name as string) ?? null,
            avatarUrl: (data.image_url as string) ?? null,
          },
          create: {
            clerkId: data.id as string,
            email: (data.email_addresses as Array<{ email_address: string }>)[0]?.email_address ?? '',
            firstName: (data.first_name as string) ?? null,
            lastName: (data.last_name as string) ?? null,
            avatarUrl: (data.image_url as string) ?? null,
          },
        })
        break
      }

      case 'user.updated': {
        await prisma.user.update({
          where: { clerkId: data.id as string },
          data: {
            email: (data.email_addresses as Array<{ email_address: string }>)[0]?.email_address ?? '',
            firstName: (data.first_name as string) ?? null,
            lastName: (data.last_name as string) ?? null,
            avatarUrl: (data.image_url as string) ?? null,
          },
        })
        break
      }

      case 'user.deleted': {
        await prisma.user.delete({ where: { clerkId: data.id as string } })
        break
      }

      case 'organization.created': {
        const creator = await prisma.user.findUnique({ where: { clerkId: data.created_by as string } })

        const org = await prisma.organization.create({
          data: {
            name: data.name as string,
            slug: data.slug as string,
          },
        })

        if (creator) {
          await prisma.organizationMember.create({
            data: {
              userId: creator.id,
              organizationId: org.id,
              role: 'OWNER',
            },
          })
        }

        await prisma.subscription.create({
          data: {
            organizationId: org.id,
            planType: 'FREE',
          },
        })

        await prisma.auditLog.create({
          data: {
            organizationId: org.id,
            userId: data.created_by as string,
            action: 'ORGANIZATION_CREATED',
            resource: 'organization',
            resourceId: org.id,
          },
        })
        break
      }

      case 'organizationMembership.created': {
        const membershipData = data as Record<string, unknown>
        const orgData = membershipData.organization as Record<string, unknown>
        const userData = membershipData.user as Record<string, unknown>

        const organization = await prisma.organization.findUnique({
          where: { slug: orgData.slug as string },
        })

        const user = await prisma.user.findUnique({
          where: { clerkId: userData.id as string },
        })

        if (organization && user) {
          await prisma.organizationMember.create({
            data: {
              userId: user.id,
              organizationId: organization.id,
              role: (membershipData.role as string)?.toUpperCase() as 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER' ?? 'DEVELOPER',
            },
          })
        }
        break
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ success: false, error: 'Webhook handler failed' }, { status: 500 })
  }
}
