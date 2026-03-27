import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050505',
}

export const metadata: Metadata = {
  title: {
    default: "Axiora — Agents d'IA per gestionar el teu Gmail",
    template: '%s | Axiora',
  },
  description: "Axiora connecta agents d'IA a la teva safata d'entrada. Llegeixen, classifiquen i responen emails automàticament — estalviant hores cada setmana.",
  keywords: ['IA', 'email automation', 'Gmail', 'AI agents', 'customer support', 'artificial intelligence', 'email management'],
  authors: [{ name: 'Axiora' }],
  creator: 'Axiora',
  metadataBase: new URL('https://axiora.ai'),
  openGraph: {
    type: 'website',
    locale: 'ca_ES',
    alternateLocale: ['es_ES', 'en_US'],
    url: 'https://axiora.ai',
    siteName: 'Axiora',
    title: "Axiora — Agents d'IA per gestionar el teu Gmail",
    description: "Connecta agents d'IA a la teva safata d'entrada. Llegeixen, classifiquen i responen emails automàticament.",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Axiora - AI Email Agents' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Axiora — Agents d'IA per gestionar el teu Gmail",
    description: "Connecta agents d'IA a la teva safata d'entrada. Automatitza respostes, classifica emails i estalvia hores.",
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Axiora',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: "AI email agents that manage your Gmail inbox automatically.",
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '25',
    highPrice: '399',
    priceCurrency: 'EUR',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca" dir="ltr">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
