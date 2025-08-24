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
    default: 'Gather Memorials - Faith-Centered Digital Memorials',
    template: '%s | Gather Memorials', // For dynamic titles
  },
  description: 'Create beautiful, faith-centered digital memorials with prayers, virtual candles, and parish support. Honor your loved ones in the Catholic tradition.',
  keywords: ['Catholic memorials', 'digital memorial', 'online obituary', 'Catholic funeral', 'memorial website', 'Gather Memorials'],
  authors: [{ name: 'Gather Memorials' }],
  creator: 'Gather Memorials',
  publisher: 'Gather Memorials',
  metadataBase: new URL('https://gathermemorials.com'), // Change to your actual domain
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gathermemorials.com',
    siteName: 'Gather Memorials',
    title: 'Gather Memorials - Faith-Centered Digital Memorials',
    description: 'Create beautiful, faith-centered digital memorials with prayers, virtual candles, and parish support.',
    images: [
      {
        url: '/og-image.png', // You'll add this image later
        width: 1200,
        height: 630,
        alt: 'Gather Memorials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gather Memorials',
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
  // Style object to prevent iOS font size adjustment
  const htmlStyle = { WebkitTextSizeAdjust: '100%' }
  
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${crimsonText.variable}`}
      style={htmlStyle}
    >
      <body className="font-sans bg-white text-gray-900 min-h-screen flex flex-col">
        {/* Skip to main content link for screen readers */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-marian-blue-500 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        {/* Main app structure with semantic HTML */}
        <div className="flex flex-col min-h-screen">
          {/* Navbar will go here */}
          <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
            <nav className="container-mobile py-4">
              <div className="flex items-center justify-between">
                <a href="/" className="text-xl font-serif font-bold text-marian-blue-500">
                  Gather Memorials
                </a>
                {/* Mobile menu button - you'll implement this later */}
                <button 
                  className="lg:hidden p-2 rounded-md hover:bg-gray-100"
                  aria-label="Open menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </nav>
          </header>

          {/* Main content area */}
          <main id="main-content" className="flex-grow">
            {children}
          </main>

          {/* Footer will go here */}
          <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
            <div className="container-mobile py-8">
              <p className="text-center text-sm text-gray-600">
                © 2024 Gather Memorials. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}