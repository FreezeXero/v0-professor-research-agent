import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
})
const geistMono = Geist_Mono({ 
  subsets: ['latin'], 
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ProfLens — Research Any Professor',
  description:
    'AI-powered professor research agent. Search Rate My Professor and Reddit for class-specific reviews, side-by-side ratings, and plain-English summaries.',
  keywords: ['professor research', 'rate my professor', 'college reviews', 'class reviews'],
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
