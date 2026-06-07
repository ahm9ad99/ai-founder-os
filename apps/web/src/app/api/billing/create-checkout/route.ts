import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@ai-founder/db'

const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  PRO: process.env.STRIPE_PRICE_PRO,
  BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
}

export async function POST(req: Request) {
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

    const { plan } = await req.json()

    if (!plan || !['STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = STRIPE_PRICE_IDS[plan]
    if (!priceId) {
      return NextResponse.json({ error: 'Price ID not configured for this plan' }, { status: 500 })
    }

    const { Stripe } = await import('stripe')
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-04-10' as any,
    })

    const subscription = orgMember.organization.subscription
    const customerId = subscription?.stripeCustomerId

    let customer: string
    if (customerId) {
      customer = customerId
    } else {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.email,
        metadata: { organizationId: orgMember.organizationId },
      })
      customer = newCustomer.id

      await prisma.subscription.update({
        where: { organizationId: orgMember.organizationId },
        data: { stripeCustomerId: customer },
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { organizationId: orgMember.organizationId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/billing?canceled=true`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('POST /api/billing/create-checkout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

