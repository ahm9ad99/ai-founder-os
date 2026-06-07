'use client'

import { ThemeProvider } from 'next-themes'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { PostHogProvider } from '@/components/posthog-provider'
import { Toaster } from 'sonner'
import { useTheme } from 'next-themes'
import { ErrorBoundary } from '@/components/error-boundary'

function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: '#6366f1',
          colorText: resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a',
          colorBackground: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff',
          colorInputBackground: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff',
        },
      }}
    >
      {children}
    </ClerkProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <PostHogProvider>
        <ClerkThemeProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </ClerkThemeProvider>
      </PostHogProvider>
    </ThemeProvider>
  )
}


