import type { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goosejobs.vercel.app'

export const metadata: Metadata = {
  title: 'GooseJobs — AI Job Application Copilot',
  description:
    'Search 25+ job boards at once, tailor your resume with AI, and track every application in one focused workspace. Private beta.',
  keywords: [
    'AI job search',
    'job application tracker',
    'resume tailoring AI',
    'cover letter generator AI',
    'job board aggregator',
    'AI job copilot',
    'application pipeline tracker',
    'multi-board job search',
    'AI career tool',
    'job hunt workspace',
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: `${siteUrl}/enter` },
}

export default function EnterLayout({ children }: { children: React.ReactNode }) {
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://goosejobs.vercel.app'

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'GooseJobs',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Job Search',
      operatingSystem: 'Web',
      url,
      description:
        'AI-powered job application copilot. Search 25+ job boards simultaneously, tailor your resume and cover letters with AI, and track every application in a unified Kanban pipeline.',
      featureList: [
        'Search 25+ job boards simultaneously',
        'AI resume tailoring to match job descriptions',
        'AI cover letter generation',
        'Application pipeline tracking (Kanban)',
        'Interview preparation questions',
        'AI copilot chat for job search strategy',
        'Document vault for resume versions',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InviteOnly',
      },
      provider: {
        '@type': 'Organization',
        name: 'GooseJobs',
        url,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is GooseJobs?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GooseJobs is an AI-powered job application copilot that searches over 25 job boards simultaneously, tracks your applications in a Kanban pipeline, and helps you tailor resumes and cover letters using AI.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does GooseJobs search for jobs?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GooseJobs aggregates listings from 25+ sources including LinkedIn, Indeed, Google Jobs, Glassdoor, Remotive, WeWorkRemotely, EURES (EU Employment Services), and direct company ATS boards (Greenhouse, Lever, Ashby). Results are re-ranked by AI against your resume and target role.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can GooseJobs tailor my resume for a specific job?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. GooseJobs analyzes a job description and rewrites your resume to match it — highlighting relevant experience and adjusting language to improve ATS pass rates.',
          },
        },
        {
          '@type': 'Question',
          name: 'What countries does GooseJobs cover?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GooseJobs has strong coverage for the United States and European Union, including dedicated sources for Germany, France, the UK, Netherlands, Poland, Sweden, and other EU countries.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is GooseJobs free?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'GooseJobs is currently in private beta. Access requires an invite code at goosejobs.vercel.app/enter.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does GooseJobs support remote jobs?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. GooseJobs includes dedicated remote-only boards such as Remotive, WeWorkRemotely, Himalayas, Jobicy, and Working Nomads, plus a source for 4-day work week companies.',
          },
        },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
