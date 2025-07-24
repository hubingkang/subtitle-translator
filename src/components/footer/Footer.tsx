'use client'

import { Languages, Github, Heart } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo and Description */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Languages className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-lg font-semibold">{t('appTitle')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('appDescription')}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                {t('supports')} 9{t('subtitleFormats')}
              </span>
            </div>
            <div className="hidden md:block text-muted-foreground/50">•</div>
            <div className="flex items-center gap-2">
              <span>{t('clientProcessing')}</span>
            </div>
          </div>

          {/* Copyright and Links */}
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{t('madeWith')}</span>
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>{t('byDevelopers')}</span>
            </div>
            <div className="hidden md:block text-muted-foreground/50">•</div>
            <div className="flex items-center gap-2">
              <span>{t('copyright', { year: currentYear })}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
