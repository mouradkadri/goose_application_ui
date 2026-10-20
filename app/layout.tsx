import type { Metadata } from 'next'
import { Bricolage_Grotesque, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import { SearchProvider } from '@/components/search-provider'
import './globals.css'

// Field Guide type system: a characterful humanist grotesque for display, a clean
// neutral body face, and a mono reserved for data (scores, dates, statuses, IDs).
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
  display: 'swap',
})
const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

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
  keywords: [
    'AI job search',
    'job application tracker',
    'resume tailoring AI',
    'cover letter generator',
    'job board aggregator',
    'AI career copilot',
    'application pipeline',
    'job hunt tool',
  ],
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
      <body className={`font-sans ${display.variable} ${sans.variable} ${mono.variable}`}>
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
