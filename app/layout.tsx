import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata: Metadata = {
  title: 'Edge Detectr | Free Online Edge Detection Tool',
  description: 'Transform your images with Edge Detectr - a free online tool for edge detection using Sobel, Prewitt, and Roberts Cross algorithms. No signup required.',
  keywords: 'edge detection, image processing, computer vision, sobel, prewitt, roberts cross, openmp, online tool, image edge detection',
  authors: [{ name: 'Kailin Xing' }],
  applicationName: 'Edge Detectr',
  metadataBase: new URL('https://edgedetectr.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Edge Detectr | Free Online Edge Detection Tool',
    description: 'Transform your images with Edge Detectr - a free online tool for edge detection using Sobel, Prewitt, and Roberts Cross algorithms. No signup required.',
    url: 'https://edgedetectr.com',
    siteName: 'Edge Detectr',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://edgedetectr.com/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Edge Detectr - Online Edge Detection Tool',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edge Detectr | Free Online Edge Detection Tool',
    description: 'Transform your images with Edge Detectr - a free online tool for edge detection using Sobel, Prewitt, and Roberts Cross algorithms.',
    images: ['https://edgedetectr.com/images/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <Script 
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Edge Detectr",
              "url": "https://edgedetectr.com",
              "description": "Free online edge detection tool with multiple algorithms including Sobel, Prewitt, and Roberts Cross",
              "applicationCategory": "Photography",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Person",
                "name": "Kailin Xing"
              },
              "keywords": "edge detection, image processing, computer vision, sobel, prewitt, roberts cross",
              "featureList": "Multiple edge detection algorithms, instant processing, no account required"
            })
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen h-full text-gray-900">
        {children}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
      </body>
    </html>
  )
}
