'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Check, ArrowUpRight, CreditCard, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'

type PlanInfo = {
  name: string
  price: string
  monthlyPrice: number
  features: string[]
  popular: boolean
  planType: string
}

type SubscriptionData = {
  plan: string
  status: string
  currentPeriodEnd: string | null
  stripeCustomerId: string | null
}

type UsageData = {
  agentCount: number
  agentLimit: number
  tokenUsage: number
  tokenLimit: number
  memberCount: number
  memberLimit: number
}

const PLANS: PlanInfo[] = [
  {
    name: 'Free',
    price: '$0',
    monthlyPrice: 0,
    features: ['1 agent', '10K tokens/day', '0 team seats'],
    popular: false,
    planType: 'FREE',
  },
  {
    name: 'Starter',
    price: '$29',
    monthlyPrice: 29,
    features: ['5 agents', '50K tokens/day', '3 team seats', 'Basic analytics'],
    popular: false,
    planType: 'STARTER',
  },
  {
    name: 'Pro',
    price: '$99',
    monthlyPrice: 99,
    features: [
      '15 agents',
      '200K tokens/day',
      '10 team seats',
      'Advanced analytics',
      'Priority support',
    ],
    popular: true,
    planType: 'PRO',
  },
  {
    name: 'Business',
    price: '$299',
    monthlyPrice: 299,
    features: [
      '50 agents',
      '500K tokens/day',
      '25 team seats',
      'All features',
      'Dedicated support',
    ],
    popular: false,
    planType: 'BUSINESS',
  },
]

const PLAN_LIMITS: Record<string, { agents: number; tokens: number; seats: number }> = {
  FREE: { agents: 1, tokens: 10000, seats: 1 },
  STARTER: { agents: 5, tokens: 50000, seats: 3 },
  PRO: { agents: 15, tokens: 200000, seats: 10 },
  BUSINESS: { agents: 50, tokens: 500000, seats: 25 },
  ENTERPRISE: { agents: 9999, tokens: 999999999, seats: 9999 },
}

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription updated successfully')
    }
    if (searchParams.get('canceled') === 'true') {
      toast.error('Checkout was canceled')
    }
  }, [searchParams])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [orgRes, usageRes] = await Promise.all([
          fetch('/api/organization'),
          fetch('/api/dashboard/metrics'),
        ])
        const orgData = await orgRes.json()
        const usageData = await usageRes.json()

        const org = orgData.data?.[0]
        if (org?.organization?.subscription) {
          setSubscription(org.organization.subscription)
        }

        // Calculate usage from metrics
        const plan = org?.organization?.subscription?.plan ?? 'FREE'
        const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE
        setUsage({
          agentCount: usageData.data?.activeAgents ?? 0,
          agentLimit: limits.agents,
          tokenUsage: usageData.data?.tokenUsage?.reduce((s: number, d: any) => s + d.tokens, 0) ?? 0,
          tokenLimit: limits.tokens,
          memberCount: org?.organization?._count?.members ?? 0,
          memberLimit: limits.seats,
        })

        // Mock invoices for demo
        setInvoices([
          { id: 'INV-001', date: new Date().toISOString(), amount: 9900, status: 'paid', plan: plan },
        ])
      } catch {
        toast.error('Failed to load billing data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleUpgrade = async (planType: string) => {
    if (planType === 'FREE') return
    setActionLoading(planType)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planType }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Failed to create checkout')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBillingPortal = async () => {
    setActionLoading('portal')
    try {
      const res = await fetch('/api/billing/create-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error ?? 'Failed to open portal')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal')
    } finally {
      setActionLoading(null)
    }
  }

  const currentPlan = subscription?.plan ?? 'FREE'
  const usagePercent = usage
    ? { agents: (usage.agentCount / usage.agentLimit) * 100, tokens: (usage.tokenUsage / usage.tokenLimit) * 100 }
    : { agents: 0, tokens: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription and usage
          </p>
        </div>
        {subscription?.stripeCustomerId && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleBillingPortal}
            disabled={actionLoading === 'portal'}
          >
            {actionLoading === 'portal' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Billing Portal
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                You are on the {currentPlan.toLowerCase()} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
                <div>
                  <p className="text-lg font-bold">
                    {currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()} Plan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentPlan === 'FREE'
                      ? 'Free plan'
                      : `$${PLANS.find((p) => p.planType === currentPlan)?.monthlyPrice ?? 0}/month`}
                    {subscription?.currentPeriodEnd &&
                      ` — Renews ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                  </p>
                </div>
                <Badge
                  variant={
                    subscription?.status === 'ACTIVE'
                      ? 'success'
                      : subscription?.status === 'PAST_DUE'
                      ? 'destructive'
                      : 'warning'
                  }
                >
                  {subscription?.status ?? 'ACTIVE'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {usage && currentPlan !== 'ENTERPRISE' && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {usage.agentCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {usage.agentLimit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent.agents >= 90
                          ? 'bg-destructive'
                          : usagePercent.agents >= 70
                          ? 'bg-warning'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min(usagePercent.agents, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Daily Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {usage.tokenUsage.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {usage.tokenLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usagePercent.tokens >= 90
                          ? 'bg-destructive'
                          : usagePercent.tokens >= 70
                          ? 'bg-warning'
                          : 'bg-accent'
                      }`}
                      style={{ width: `${Math.min(usagePercent.tokens, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {usage.memberCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {usage.memberLimit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usage.memberCount >= usage.memberLimit
                          ? 'bg-destructive'
                          : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          (usage.memberCount / usage.memberLimit) * 100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.planType === currentPlan
              const isDowngrade =
                plan.planType !== 'FREE' &&
                PLANS.indexOf(plan) <
                  PLANS.findIndex((p) => p.planType === currentPlan)

              return (
                <Card
                  key={plan.name}
                  className={cn(
                    plan.popular && !isCurrent && 'border-primary',
                    isCurrent && 'border-2 border-primary',
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.popular && !isCurrent && (
                        <Badge>Popular</Badge>
                      )}
                      {isCurrent && <Badge variant="success">Current</Badge>}
                    </div>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-sm">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : plan.popular ? 'default' : 'outline'}
                      disabled={isCurrent || actionLoading === plan.planType}
                      onClick={() => handleUpgrade(plan.planType)}
                    >
                      {actionLoading === plan.planType ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isCurrent ? (
                        'Current Plan'
                      ) : isDowngrade ? (
                        'Downgrade'
                      ) : (
                        'Upgrade'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No invoices yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                        <TableCell>
                          {new Date(inv.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>${(inv.amount / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="success">{inv.status}</Badge>
                        </TableCell>
                        <TableCell>{inv.plan}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
