'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  useEffect(() => {
    if (user && typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      import('posthog-js').then(({ default: posthog }) => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
          loaded: (ph) => {
            ph.identify(user.id, { email: user.primaryEmailAddress?.emailAddress, name: user.fullName })
          },
        })
      })
    }
  }, [user])

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>
  }

  return <>{children}</>
}


