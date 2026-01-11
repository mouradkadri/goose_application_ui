import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'GOOSE JOBS - AI-Powered Job Matcher',
  description: 'the First AI-Powered Job Matcher that Analyzes Your Resume to Find the Perfect Job Opportunities Tailored Just for You. Upload Your Resume and Let Our Advanced AI Do the Rest!',
  generator: 'goose jobs 2026',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
