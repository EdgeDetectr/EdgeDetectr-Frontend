import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Edge Detectr | Modern Edge Detection Application',
  description: 'Edge Detectr is a modern application offering multiple edge detection algorithms including Sobel, Prewitt, and Roberts Cross for image processing',
  keywords: 'edge detection, image processing, computer vision, sobel, prewitt, roberts cross, openmp',
  authors: [{ name: 'Kailin Xing' }],
  applicationName: 'Edge Detectr',
  metadataBase: new URL('https://edgedetectr.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Edge Detectr | Modern Edge Detection Application',
    description: 'Process images with multiple edge detection algorithms including Sobel, Prewitt, and Roberts Cross',
    url: 'https://edgedetectr.com',
    siteName: 'Edge Detectr',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edge Detectr | Modern Edge Detection Application',
    description: 'Process images with multiple edge detection algorithms including Sobel, Prewitt, and Roberts Cross',
  },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex flex-col min-h-screen h-full text-gray-900">
        {children}
      </body>
    </html>
  )
}
