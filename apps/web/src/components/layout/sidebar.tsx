'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Brain,
  Code2,
  Building2,
  ShieldCheck,
  Cpu,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  Users,
  CreditCard,
  Key,
  FileText,
  HelpCircle,
} from 'lucide-react'
import { useState, createContext, useContext, useEffect } from 'react'

type SidebarContextType = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Agent Control', href: '/dashboard/agents', icon: Bot },
  { title: 'Code Review', href: '/dashboard/code-review', icon: Code2 },
  { title: 'Business Ops', href: '/dashboard/business-ops', icon: Building2 },
  { title: 'Project Auditor', href: '/dashboard/project-auditor', icon: ShieldCheck },
  { title: 'AI CTO', href: '/dashboard/ai-cto', icon: Cpu },
]

const settingsItems: NavItem[] = [
  { title: 'General', href: '/dashboard/settings/general', icon: Settings },
  { title: 'Team', href: '/dashboard/settings/team', icon: Users },
  { title: 'API Keys', href: '/dashboard/settings/api-keys', icon: Key },
  { title: 'Billing', href: '/dashboard/settings/billing', icon: CreditCard },
  { title: 'Audit Logs', href: '/dashboard/settings/audit-logs', icon: FileText },
]

function NavGroup({
  items,
  collapsed,
  label,
}: {
  items: NavItem[]
  collapsed: boolean
  label: string
}) {
  const pathname = usePathname()

  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-3 mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                size={collapsed ? 'icon' : 'default'}
                className={cn(
                  'w-full justify-start gap-3 h-9',
                  collapsed ? 'justify-center px-0' : 'px-3',
                  isActive
                    ? 'bg-secondary font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span className="truncate">{item.title}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {item.badge}
                  </span>
                )}
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center border-b shrink-0',
            collapsed ? 'justify-center px-2' : 'px-4',
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2.5 font-semibold',
              collapsed && 'justify-center',
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="text-base tracking-tight">AI Founder OS</span>
            )}
          </Link>
        </div>

        <ScrollArea className="flex-1 px-2 py-3 scrollbar-thin">
          <nav>
            <NavGroup items={navItems} collapsed={collapsed} label="Main" />
            <NavGroup
              items={settingsItems}
              collapsed={collapsed}
              label="Settings"
            />
          </nav>
        </ScrollArea>

        <div className="shrink-0 border-t p-3">
          <div className={cn('flex', collapsed ? 'justify-center' : 'justify-end')}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>
    </SidebarContext.Provider>
  )
}
