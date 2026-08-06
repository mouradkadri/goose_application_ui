import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goosejobs.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/enter`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
