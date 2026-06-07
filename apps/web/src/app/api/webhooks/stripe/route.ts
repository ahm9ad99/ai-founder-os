import { NextResponse } from 'next/server'
import { prisma } from '@ai-founder/db'

const PLAN_MAP: Record<string, string> = {
  price_free: 'FREE',
  price_starter: 'STARTER',
  price_pro: 'PRO',
  price_business: 'BUSINESS',
  price_enterprise: 'ENTERPRISE',
}

const PLAN_LIMITS: Record<string, { maxAgents: number; maxTokensPerDay: number; maxTeamSeats: number }> = {
  FREE: { maxAgents: 1, maxTokensPerDay: 10000, maxTeamSeats: 1 },
  STARTER: { maxAgents: 5, maxTokensPerDay: 50000, maxTeamSeats: 3 },
  PRO: { maxAgents: 15, maxTokensPerDay: 200000, maxTeamSeats: 10 },
  BUSINESS: { maxAgents: 50, maxTokensPerDay: 500000, maxTeamSeats: 25 },
  ENTERPRISE: { maxAgents: 9999, maxTokensPerDay: 999999999, maxTeamSeats: 9999 },
}

async function verifyStripeSignature(body: string, signature: string | null) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !signature) {
    return null
  }

  const { Stripe } = await import('stripe')
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-04-10' as any,
  })

  try {
    return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  const event = await verifyStripeSignature(body, signature)
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const data = event.data.object as Record<string, any>

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = data
        const orgId = session.metadata?.organizationId
        if (!orgId) break

        const priceId = session.line_items?.data?.[0]?.price?.id
        const plan = priceId ? (PLAN_MAP[priceId] ?? 'FREE') : 'FREE'

        await prisma.subscription.upsert({
          where: { organizationId: orgId },
          update: {
            planType: plan as any,
            status: 'ACTIVE',
            stripeSubscriptionId: session.subscription ?? null,
            stripeCustomerId: session.customer ?? null,
            currentPeriodStart: session.current_period_start
              ? new Date(session.current_period_start * 1000)
              : null,
            currentPeriodEnd: session.current_period_end
              ? new Date(session.current_period_end * 1000)
              : null,
          },
          create: {
            organizationId: orgId,
            planType: plan as any,
            status: 'ACTIVE',
            stripeSubscriptionId: session.subscription ?? null,
            stripeCustomerId: session.customer ?? null,
          },
        })

        await prisma.auditLog.create({
          data: {
            organizationId: orgId,
            userId: 'system',
            action: 'SUBSCRIPTION_UPDATED',
            resource: 'subscription',
            details: { plan, event: 'checkout.completed' },
          },
        })
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = data
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        })
        if (!dbSub) break

        const statusMap: Record<string, string> = {
          active: 'ACTIVE',
          past_due: 'PAST_DUE',
          canceled: 'CANCELED',
          trialing: 'TRIALING',
          incomplete: 'INCOMPLETE',
        }

        await prisma.subscription.update({
          where: { id: dbSub.id },
          data: {
            status: (statusMap[sub.status] ?? 'INCOMPLETE') as any,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = data
        const dbSub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: sub.id },
        })
        if (dbSub) {
          await prisma.subscription.update({
            where: { id: dbSub.id },
            data: {
              status: 'CANCELED',
              planType: 'FREE',
              stripeSubscriptionId: null,
            },
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = data
        const dbSub = invoice.subscription
          ? await prisma.subscription.findFirst({
              where: { stripeSubscriptionId: invoice.subscription },
            })
          : null

        if (dbSub) {
          await prisma.invoice.create({
            data: {
              subscriptionId: dbSub.id,
              stripeInvoiceId: invoice.id,
              amount: invoice.amount_paid ?? 0,
              currency: invoice.currency ?? 'usd',
              status: 'paid',
              paidAt: invoice.status_transitions?.paid_at
                ? new Date(invoice.status_transitions.paid_at * 1000)
                : new Date(),
              periodStart: new Date(invoice.period_start * 1000),
              periodEnd: new Date(invoice.period_end * 1000),
              pdfUrl: invoice.hosted_invoice_url ?? null,
            },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const failedInvoice = data
        const failedSub = failedInvoice.subscription
          ? await prisma.subscription.findFirst({
              where: { stripeSubscriptionId: failedInvoice.subscription },
            })
          : null

        if (failedSub) {
          await prisma.subscription.update({
            where: { id: failedSub.id },
            data: { status: 'PAST_DUE' },
          })

          await prisma.notification.create({
            data: {
              userId: 'system',
              type: 'PAYMENT_FAILED',
              title: 'Payment Failed',
              message: 'Your latest invoice payment failed. Please update your payment method.',
              link: '/dashboard/settings/billing',
            },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
