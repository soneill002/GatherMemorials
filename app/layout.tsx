import type { Metadata, Viewport } from 'next'
import { Inter, Crimson_Text } from 'next/font/google'
import '@/styles/globals.css'

// Load fonts with Next.js font optimization for better performance
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap', // Prevents invisible text during font load
})

const crimsonText = Crimson_Text({ 
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-crimson',
  display: 'swap',
})

// SEO and Open Graph metadata
export const metadata: Metadata = {
  title: {
    default: 'Catholic Memorials - Faith-Centered Digital Memorials',
    template: '%s | Catholic Memorials', // For dynamic titles
  },
  description: 'Create beautiful, faith-centered digital memorials with prayers, virtual candles, and parish support. Honor your loved ones in the Catholic tradition.',
  keywords: ['Catholic memorials', 'digital memorial', 'online obituary', 'Catholic funeral', 'memorial website'],
  authors: [{ name: 'Catholic Memorials' }],
  creator: 'Catholic Memorials',
  publisher: 'Catholic Memorials',
  metadataBase: new URL('https://catholicmemorials.com'), // Change to your domain
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://catholicmemorials.com',
    siteName: 'Catholic Memorials',
    title: 'Catholic Memorials - Faith-Centered Digital Memorials',
    description: 'Create beautiful, faith-centered digital memorials with prayers, virtual candles, and parish support.',
    images: [
      {
        url: '/og-image.png', // You'll add this image later
        width: 1200,
        height: 630,
        alt: 'Catholic Memorials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Catholic Memorials',
    description: 'Create beautiful, faith-centered digital memorials',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

// Viewport configuration for optimal mobile experience
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  themeColor: '#1A3C8C', // Marian blue for browser chrome
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${crimsonText.variable}`}
      // Prevent iOS from adjusting font sizes in landscape mode
      style={{ WebkitTextSizeAdjust: '100%' }}
    >
      <body className="font-sans bg-white text-gray-900 min-h-screen flex flex-col">
        {/* Skip to main content link for screen readers */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-marian-blue-500 text-white px-4 py-2 rounded-md z-50"
        >
          Skip