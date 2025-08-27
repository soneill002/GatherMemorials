import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

// Load fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

// Metadata for SEO
export const metadata: Metadata = {
  title: {
    default: 'GatherMemorials - Create Beautiful Catholic Memorial Pages',
    template: '%s | GatherMemorials'
  },
  description: 'Honor your loved ones with beautiful, faith-centered digital memorial pages. Create lasting tributes with photo galleries, guestbooks, and prayer lists.',
  keywords: ['memorial', 'obituary', 'Catholic', 'funeral', 'remembrance', 'tribute'],
  authors: [{ name: 'GatherMemorials' }],
  creator: 'GatherMemorials',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gathermemorials.com',
    title: 'GatherMemorials - Catholic Memorial Pages',
    description: 'Create beautiful, faith-centered digital memorial pages for your loved ones',
    siteName: 'GatherMemorials',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'GatherMemorials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GatherMemorials - Catholic Memorial Pages',
    description: 'Create beautiful, faith-centered digital memorial pages for your loved ones',
    images: ['/og/default.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-vatican-50 text-vatican-900 min-h-screen flex flex-col">
        {/* Navigation will go here */}
        <nav className="border-b border-vatican-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="font-serif text-2xl text-marian-500">GatherMemorials</h1>
              </div>
              <div className="hidden sm:flex sm:space-x-8">
                <a href="/" className="text-vatican-700 hover:text-marian-500 px-3 py-2 text-sm font-medium">
                  Home
                </a>
                <a href="/how-it-works" className="text-vatican-700 hover:text-marian-500 px-3 py-2 text-sm font-medium">
                  How It Works
                </a>
                <a href="/pricing" className="text-vatican-700 hover:text-marian-500 px-3 py-2 text-sm font-medium">
                  Pricing
                </a>
                <a href="/memorials/new" className="bg-marian-500 text-white hover:bg-marian-600 px-4 py-2 rounded-md text-sm font-medium">
                  Create Memorial
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer will go here */}
        <footer className="bg-vatican-100 border-t border-vatican-200">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-vatican-600">
              © 2024 GatherMemorials. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}