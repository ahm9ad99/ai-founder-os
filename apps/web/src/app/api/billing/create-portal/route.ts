import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

export async function POST() {
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
      include: { organization: { include: { subscription: true } } },
    })

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 })
    }

    const customerId = orgMember.organization.subscription?.stripeCustomerId
    if (!customerId) {
      return NextResponse.json({ error: 'No billing customer found' }, { status: 400 })
    }

    const { Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-04-10' as any,
    })

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('POST /api/billing/create-portal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

