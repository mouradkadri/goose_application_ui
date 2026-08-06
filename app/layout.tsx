import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { SearchProvider } from '@/components/search-provider'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goosejobs.vercel.app'
const title = 'GooseJobs — AI Job Application Copilot'
const description = 'Track every application, generate tailored resumes and cover letters with AI, prep for interviews, and manage your full job search pipeline — all in one workspace.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s | GooseJobs',
  },
  description,
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: 'GooseJobs',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'GooseJobs — AI Job Application Copilot' }],
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/goose_job_logo.png',
    apple: '/goose_job_logo.png',
  },
  robots: {
    index: true,
    follow: false,
    googleBot: { index: true, follow: false },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SearchProvider>
          {children}
        </SearchProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'inherit',
              fontSize: '13px',
            },
          }}
        />
      </body>
    </html>
  )
}
