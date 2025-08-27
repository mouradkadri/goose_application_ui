"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Calendar, Star } from "lucide-react"

interface Job {
  id: number
  title: string
  company: string
  location: string
  description: string
  salary: string
  posted: string
  matchScore: number
  requirements: string[]
  benefits: string[]
}

interface JobDetailsProps {
  job: Job
  resumeUploaded: boolean
}

export function JobDetails({ job, resumeUploaded }: JobDetailsProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 gap-3">
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-foreground font-sans mb-2">{job.title}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                <span>{job.company}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{job.posted}</span>
              </div>
            </div>
          </div>
          {resumeUploaded && (
            <div className="text-left md:text-right">
              <div className="flex items-center gap-1 text-accent font-semibold">
                <Star className="h-4 w-4" />
                <span>{job.matchScore}% Match</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-xs md:text-sm">
            {job.salary}
          </Badge>
          <Badge variant="outline" className="text-xs md:text-sm">
            Full-time
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 md:pb-6">
          <CardTitle className="font-sans text-base md:text-lg">Job Description</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            {job.description} We are looking for a talented individual who can contribute to our growing team and help
            us achieve our ambitious goals. This role offers excellent opportunities for professional growth and
            development in a collaborative environment.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="font-sans text-base md:text-lg">Requirements</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {job.requirements.map((req, index) => (
                <li key={index} className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 md:pb-6">
            <CardTitle className="font-sans text-base md:text-lg">Benefits</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">Apply Now</Button>
        <Button variant="outline" className="w-full sm:w-auto bg-transparent">
          Save Job
        </Button>
      </div>
    </div>
  )
}
