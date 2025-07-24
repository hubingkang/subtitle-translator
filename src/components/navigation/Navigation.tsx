'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { Languages, FileText } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { cn } from '@/lib/utils'

export function Navigation() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('navigation')

  const navigationItems = [
    {
      name: t('subtitleTranslation'),
      href: `/${locale}`,
      icon: Languages,
    },
    {
      name: t('formatConversion'),
      href: `/${locale}/converter`,
      icon: FileText,
    },
  ]

  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Languages className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Subtitle Tools</h1>
                <p className="text-xs text-muted-foreground">
                  AI-powered subtitle processing
                </p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile Navigation */}
            <nav className="md:hidden flex items-center space-x-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}