import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/public(.*)',
  '/pricing',
  '/features',
  '/api/health',
])

const isApiRoute = createRouteMatcher(['/api/(.*)'])
const isOnboardingRoute = createRouteMatcher(['/onboarding'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  if (isApiRoute(req)) {
    auth().protect()
    return
  }

  const { userId, sessionClaims } = auth()

  if (!userId) {
    auth().protect()
    return
  }

  const metadata = sessionClaims?.publicMetadata as Record<string, unknown> | undefined
  const onboardingComplete = metadata?.onboardingComplete as boolean | undefined

  if (isOnboardingRoute(req)) {
    if (onboardingComplete) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return
  }

  if (!onboardingComplete) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  auth().protect()
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/'],
}
