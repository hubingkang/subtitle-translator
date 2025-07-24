import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'
import { ThemeProvider } from '@/lib/theme-provider'
import { Navigation } from '@/components/navigation/Navigation'
import { Footer } from '@/components/footer/Footer'

export const metadata: Metadata = {
  title: 'Subtitle Tools',
  description: 'AI-powered subtitle translation and format conversion',
}

const locales = ['zh', 'en']

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider
        defaultTheme="system"
        storageKey="subtitle-translator-theme"
      >
        <Navigation />
        <main className="flex-1">{children}</main>
        <Footer />
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
