import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from 'next-themes'
import { PostHogProvider } from '@/components/posthog-provider'
import { Toaster } from 'sonner'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'AI Founder OS',
    template: '%s | AI Founder OS',
  },
  description: 'One platform to manage AI agents, review code, operate your business, audit projects, and get CTO-level technical guidance — all powered by Claude AI.',
  keywords: ['AI', 'startup', 'SaaS', 'developer tools', 'AI agents', 'code review', 'CTO'],
  openGraph: {
    title: 'AI Founder OS',
    description: 'One platform to manage AI agents, review code, operate your business, audit projects, and get CTO-level technical guidance.',
    siteName: 'AI Founder OS',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Founder OS',
    description: 'One platform to manage AI agents, review code, operate your business, audit projects, and get CTO-level technical guidance.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className="dark scroll-smooth">
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <PostHogProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </PostHogProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
