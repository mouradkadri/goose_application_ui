import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Access GooseJobs',
  description: 'GooseJobs is an AI-powered job application copilot. Enter your access code to get started.',
  robots: { index: true, follow: false },
}

export default function EnterLayout({ children }: { children: React.ReactNode }) {
  return children
}
