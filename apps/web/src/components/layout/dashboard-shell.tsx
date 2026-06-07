'use client'

import { Sidebar, useSidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { cn } from '@/lib/utils'
import { useOrganization, useUser } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isUserLoaded } = useUser()
  const { isLoaded: isOrgLoaded } = useOrganization()
  const { collapsed } = useSidebar()

  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col transition-all duration-300 ease-in-out',
          collapsed ? 'pl-16' : 'pl-64',
        )}
      >
        <TopBar />
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl animate-in">{children}</div>
        </main>
        <footer className="border-t py-4 px-6">
          <div className="mx-auto max-w-7xl flex items-center justify-between text-xs text-muted-foreground">
            <span>AI Founder OS v1.0</span>
            <span>Built for builders</span>
          </div>
        </footer>
      </div>
    </div>
  )
}


