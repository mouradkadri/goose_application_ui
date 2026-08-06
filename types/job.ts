export interface Job {
  id: number
  title: string
  company: string
  location: string
  description: string
  salary: string
  posted: string
  rawDate: string
  matchScore: number
  requirements: string[]
  benefits: string[]
  applyUrl: string
}
