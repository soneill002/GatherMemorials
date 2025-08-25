// app/layout.tsx
// Root layout for the entire application
// Handles global providers, fonts, metadata, and base structure

import type { Metadata, Viewport } from 'next'
import { Inter, Crimson_Text } from 'next/font/google'
import { ToastProvider } from '@/components/ui/toast'
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
 metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://gathermemorials.com'),
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
       alt: 'Gather Memorials - Honor your loved ones in faith',
     },
   ],
 },
 twitter: {
   card: 'summary_large_image',
   title: 'Gather Memorials',
   description: 'Create beautiful, faith-centered digital memorials',
   images: ['/og-image.png'],
   creator: '@gathermemorials', // Add your Twitter handle
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
   icon: [
     { url: '/favicon.ico' },
     { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
     { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
   ],
   shortcut: '/favicon-16x16.png',
   apple: '/apple-touch-icon.png',
   other: [
     {
       rel: 'mask-icon',
       url: '/safari-pinned-tab.svg',
       color: '#1A3C8C',
     },
   ],
 },
 manifest: '/site.webmanifest',
 alternates: {
   canonical: 'https://gathermemorials.com',
 },
 verification: {
   google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
   yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
 },
}

// Viewport configuration for optimal mobile experience
export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 5, // Allow zooming for accessibility
 themeColor: [
   { media: '(prefers-color-scheme: light)', color: '#1A3C8C' },
   { media: '(prefers-color-scheme: dark)', color: '#122C54' },
 ],
 colorScheme: 'light',
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
     // Prevent iOS font size adjustment
     style={{ WebkitTextSizeAdjust: '100%' }}
   >
     <head>
       {/* Preconnect to external domains for performance */}
       <link rel="preconnect" href="https://fonts.googleapis.com" />
       <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
       {process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && (
         <link 
           rel="preconnect" 
           href={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}`} 
         />
       )}
     </head>
     
     <body className="font-sans bg-white text-gray-900 min-h-screen flex flex-col antialiased">
       {/* Toast notifications provider */}
       <ToastProvider>
         {/* Skip to main content link for screen readers */}
         <a 
           href="#main-content" 
           className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-marian-blue-500 text-white px-4 py-2 rounded-md z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marian-blue-600"
         >
           Skip to main content
         </a>

         {/* Main app structure with semantic HTML */}
         <div className="flex flex-col min-h-screen">
           {/* Navbar */}
           <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
             <nav 
               className="container-mobile py-4"
               role="navigation"
               aria-label="Main navigation"
             >
               <div className="flex items-center justify-between">
                 {/* Logo */}
                 <a 
                   href="/" 
                   className="text-xl font-serif font-bold text-marian-blue-500 hover:text-marian-blue-600 transition-colors"
                   aria-label="Gather Memorials - Home"
                 >
                   Gather Memorials
                 </a>
                 
                 {/* Desktop Navigation */}
                 <div className="hidden lg:flex items-center gap-8">
                   <a 
                     href="/about" 
                     className="text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     About
                   </a>
                   <a 
                     href="/pricing" 
                     className="text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     Pricing
                   </a>
                   <a 
                     href="/examples" 
                     className="text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     Examples
                   </a>
                   <a 
                     href="/partners" 
                     className="text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     For Parishes
                   </a>
                   <div className="flex items-center gap-4 ml-4">
                     <a 
                       href="/auth/login" 
                       className="text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                     >
                       Sign In
                     </a>
                     <a 
                       href="/memorials/new" 
                       className="px-4 py-2 bg-marian-blue-500 text-white rounded-lg font-semibold hover:bg-marian-blue-600 transition-colors"
                     >
                       Create Memorial
                     </a>
                   </div>
                 </div>
                 
                 {/* Mobile menu button */}
                 <button 
                   className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
                   aria-label="Open menu"
                   aria-expanded="false"
                   aria-controls="mobile-menu"
                 >
                   <svg 
                     className="w-6 h-6" 
                     fill="none" 
                     stroke="currentColor" 
                     viewBox="0 0 24 24"
                     aria-hidden="true"
                   >
                     <path 
                       strokeLinecap="round" 
                       strokeLinejoin="round" 
                       strokeWidth={2} 
                       d="M4 6h16M4 12h16M4 18h16" 
                     />
                   </svg>
                 </button>
               </div>
               
               {/* Mobile menu (hidden by default) */}
               <div 
                 id="mobile-menu"
                 className="hidden lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg"
                 aria-label="Mobile navigation"
               >
                 <div className="px-4 py-4 space-y-3">
                   <a 
                     href="/about" 
                     className="block py-2 text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     About
                   </a>
                   <a 
                     href="/pricing" 
                     className="block py-2 text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     Pricing
                   </a>
                   <a 
                     href="/examples" 
                     className="block py-2 text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     Examples
                   </a>
                   <a 
                     href="/partners" 
                     className="block py-2 text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     For Parishes
                   </a>
                   <hr className="my-3 border-gray-200" />
                   <a 
                     href="/auth/login" 
                     className="block py-2 text-gray-700 hover:text-marian-blue-500 transition-colors font-medium"
                   >
                     Sign In
                   </a>
                   <a 
                     href="/memorials/new" 
                     className="block py-3 px-4 bg-marian-blue-500 text-white rounded-lg font-semibold hover:bg-marian-blue-600 transition-colors text-center"
                   >
                     Create Memorial
                   </a>
                 </div>
               </div>
             </nav>
           </header>

           {/* Main content area */}
           <main id="main-content" className="flex-grow">
             {children}
           </main>

           {/* Footer */}
           <footer 
             className="bg-gray-50 border-t border-gray-200 mt-auto"
             role="contentinfo"
           >
             <div className="container-mobile py-12">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                 {/* Company info */}
                 <div className="md:col-span-1">
                   <h3 className="font-serif font-bold text-lg text-marian-blue-500 mb-3">
                     Gather Memorials
                   </h3>
                   <p className="text-sm text-gray-600">
                     Creating faith-centered digital memorials for Catholic families worldwide.
                   </p>
                 </div>
                 
                 {/* Quick links */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Product</h4>
                   <ul className="space-y-2">
                     <li>
                       <a href="/features" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Features
                       </a>
                     </li>
                     <li>
                       <a href="/pricing" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Pricing
                       </a>
                     </li>
                     <li>
                       <a href="/examples" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Examples
                       </a>
                     </li>
                     <li>
                       <a href="/faq" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         FAQ
                       </a>
                     </li>
                   </ul>
                 </div>
                 
                 {/* Resources */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Resources</h4>
                   <ul className="space-y-2">
                     <li>
                       <a href="/blog" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Blog
                       </a>
                     </li>
                     <li>
                       <a href="/partners" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         For Parishes
                       </a>
                     </li>
                     <li>
                       <a href="/support" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Support
                       </a>
                     </li>
                     <li>
                       <a href="/contact" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Contact
                       </a>
                     </li>
                   </ul>
                 </div>
                 
                 {/* Legal */}
                 <div>
                   <h4 className="font-semibold text-gray-900 mb-3">Legal</h4>
                   <ul className="space-y-2">
                     <li>
                       <a href="/privacy" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Privacy Policy
                       </a>
                     </li>
                     <li>
                       <a href="/terms" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Terms of Service
                       </a>
                     </li>
                     <li>
                       <a href="/cookies" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Cookie Policy
                       </a>
                     </li>
                     <li>
                       <a href="/data-export" className="text-sm text-gray-600 hover:text-marian-blue-500 transition-colors">
                         Data Export
                       </a>
                     </li>
                   </ul>
                 </div>
               </div>
               
               {/* Bottom bar */}
               <div className="mt-8 pt-8 border-t border-gray-200">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                   <p className="text-sm text-gray-600">
                     © {new Date().getFullYear()} Gather Memorials. All rights reserved.
                   </p>
                   
                   {/* Social links */}
                   <div className="flex items-center gap-4">
                     <a 
                       href="https://facebook.com/gathermemorials" 
                       className="text-gray-400 hover:text-gray-600 transition-colors"
                       aria-label="Facebook"
                       target="_blank"
                       rel="noopener noreferrer"
                     >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                         <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                       </svg>
                     </a>
                     <a 
                       href="https://twitter.com/gathermemorials" 
                       className="text-gray-400 hover:text-gray-600 transition-colors"
                       aria-label="Twitter"
                       target="_blank"
                       rel="noopener noreferrer"
                     >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                         <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                       </svg>
                     </a>
                     <a 
                       href="https://instagram.com/gathermemorials" 
                       className="text-gray-400 hover:text-gray-600 transition-colors"
                       aria-label="Instagram"
                       target="_blank"
                       rel="noopener noreferrer"
                     >
                       <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                         <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                       </svg>
                     </a>
                   </div>
                 </div>
               </div>
             </div>
           </footer>
         </div>
       </ToastProvider>
     </body>
   </html>
 )
}