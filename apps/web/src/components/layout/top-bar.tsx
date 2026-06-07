'use client'

import { UserButton, OrganizationSwitcher, useUser } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Bell, Search } from 'lucide-react'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

export function TopBar() {
  const { user } = useUser()
  const [showSearch, setShowSearch] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <div className="flex-1" />
      {showSearch && (
        <div className="relative w-64 animate-in">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="h-8 pl-8"
            onBlur={() => setShowSearch(false)}
            autoFocus
          />
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setShowSearch(!showSearch)}
      >
        <Search className="h-4 w-4" />
      </Button>
      <ThemeToggle />
      <Button variant="ghost" size="icon" className="h-9 w-9 relative">
        <Bell className="h-4 w-4" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
          3
        </span>
      </Button>
      <OrganizationSwitcher
        appearance={{
          elements: {
            rootBox: 'flex items-center',
            organizationSwitcherTrigger: 'rounded-md px-2 py-1 hover:bg-muted text-sm',
            organizationSwitcherTriggerIcon: 'text-muted-foreground',
          },
        }}
      />
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: 'h-8 w-8',
          },
        }}
        afterSignOutUrl="/"
      />
    </header>
  )
}


