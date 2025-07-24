'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const languages = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('language')
  
  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  const switchLanguage = (newLocale: string) => {
    // Replace the current locale in the pathname with the new one
    const pathWithoutLocale = pathname.startsWith(`/${locale}`) 
      ? pathname.slice(`/${locale}`.length) 
      : pathname
    
    const newPath = `/${newLocale}${pathWithoutLocale}`
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('switchLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={locale === language.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{language.flag}</span>
            {language.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}