/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better error handling
  reactStrictMode: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Configure image domains for Next.js Image component
  images: {
    domains: [
      'res.cloudinary.com', // For Cloudinary images
      'images.ctfassets.net', // For Contentful images
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'GatherMemorials',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  
  // Redirects for common routes
  async redirects() {
    return [
      {
        source: '/memorial/:id',
        destination: '/memorials/:id',
        permanent: true,
      },
    ]
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig