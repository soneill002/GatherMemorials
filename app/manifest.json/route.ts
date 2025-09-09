// app/manifest.json/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: "Gather Memorials",
    short_name: "Gather",
    description: "Create beautiful, faith-centered memorial pages for your loved ones",
    theme_color: "#003087",
    background_color: "#ffffff",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/",
    icons: [
      {
        src: "/images/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/images/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=604800, immutable'
    }
  });
}